const pool = require('../config/db');

async function createQuiz({ ownerId, title, description, is_public = true, metadata = {}, questions = [] }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertQuizText = `
      INSERT INTO quizzes (owner_id, title, description, is_public, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;
    const quizRes = await client.query(insertQuizText, [ownerId, title, description, is_public, metadata]);
    const quiz = quizRes.rows[0];

    // Insert questions
    const qInsertText = `
      INSERT INTO questions (quiz_id, question_text, options, correct_index, order_index)
      VALUES ($1, $2, $3::jsonb, $4, $5)
      RETURNING *`;
    const insertedQuestions = [];

    for (let q of questions) {
      // Validate question shape and bounds on correct_index
      if (!q.question_text || !Array.isArray(q.options)) {
        throw new Error('Each question must have question_text and options array');
      }
      // Ensure correct_index is within bounds (if present)
      if (q.correct_index != null && (q.correct_index < 0 || q.correct_index >= q.options.length)) {
        throw new Error('correct_index out of bounds for question: ' + q.question_text);
      }
      const orderIndex = q.order_index || 0;
      const res = await client.query(qInsertText, [
        quiz.id,
        q.question_text,
        JSON.stringify(q.options),
        q.correct_index,
        orderIndex
      ]);
      insertedQuestions.push(res.rows[0]);
    }

    await client.query('COMMIT');

    // Return quiz + questions (with correct_index included because creator needs it)
    return { quiz, questions: insertedQuestions };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getPublicQuizzes({ limit = 50, offset = 0 } = {}) {
  const res = await pool.query(
    `SELECT id, owner_id, title, description, is_public, metadata, created_at FROM quizzes WHERE is_public = true ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
}

async function getQuizForPlayer(quizId) {
  // Fetch quiz and questions but omit correct_index
  const q1 = await pool.query(`SELECT id, owner_id, title, description, is_public, metadata, created_at FROM quizzes WHERE id = $1`, [quizId]);
  if (q1.rows.length === 0) return null;
  const quiz = q1.rows[0];

  const q2 = await pool.query(
    `SELECT id, question_text, options, correct_index, order_index FROM questions WHERE quiz_id = $1 ORDER BY order_index`,
    [quizId]
  );

  quiz.questions = q2.rows;
  return quiz;
}

async function getQuizWithAnswersForOwner(quizId, ownerId) {
  // For owners only — include correct_index
  const q1 = await pool.query(`SELECT id, owner_id, title, description, is_public, metadata, created_at FROM quizzes WHERE id = $1`, [quizId]);
  if (q1.rows.length === 0) return null;
  const quiz = q1.rows[0];

  if (quiz.owner_id !== ownerId) {
    throw new Error('Not authorized to view answer keys for this quiz');
  }

  const q2 = await pool.query(
    `SELECT id, question_text, options, correct_index, order_index FROM questions WHERE quiz_id = $1 ORDER BY order_index`,
    [quizId]
  );

  quiz.questions = q2.rows;
  return quiz;
}

async function getMyQuizzes(ownerId) {
  const res = await pool.query(
    `SELECT id, title, description, is_public, metadata, created_at FROM quizzes WHERE owner_id = $1 ORDER BY created_at DESC`,
    [ownerId]
  );
  return res.rows;
}

// Update quiz and its questions
async function updateQuiz({ quizId, ownerId, title, description, is_public, metadata, questions }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Check ownership
    const quizRes = await client.query('SELECT * FROM quizzes WHERE id = $1 AND owner_id = $2', [quizId, ownerId]);
    if (quizRes.rows.length === 0) throw new Error('Quiz not found or not owned by user');
    // Update quiz meta
    await client.query(
      'UPDATE quizzes SET title = $1, description = $2, is_public = $3, metadata = $4 WHERE id = $5',
      [title, description, is_public, metadata, quizId]
    );
    // Remove old questions
    await client.query('DELETE FROM questions WHERE quiz_id = $1', [quizId]);
    // Insert new questions
    const qInsertText = `
      INSERT INTO questions (quiz_id, question_text, options, correct_index, order_index)
      VALUES ($1, $2, $3::jsonb, $4, $5)
      RETURNING *`;
    const insertedQuestions = [];
    for (let q of questions) {
      if (!q.question_text || !Array.isArray(q.options)) {
        throw new Error('Each question must have question_text and options array');
      }
      if (q.correct_index != null && (q.correct_index < 0 || q.correct_index >= q.options.length)) {
        throw new Error('correct_index out of bounds for question: ' + q.question_text);
      }
      const orderIndex = q.order_index || 0;
      const res = await client.query(qInsertText, [
        quizId,
        q.question_text,
        JSON.stringify(q.options),
        q.correct_index,
        orderIndex
      ]);
      insertedQuestions.push(res.rows[0]);
    }
    await client.query('COMMIT');
    return { quiz: { ...quizRes.rows[0], title, description, is_public, metadata }, questions: insertedQuestions };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Permanently delete a quiz and its questions (owner only)
async function deleteQuiz({ quizId, ownerId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Only allow owner to delete
    const quizRes = await client.query('SELECT owner_id FROM quizzes WHERE id = $1', [quizId]);
    if (quizRes.rows.length === 0) throw new Error('Quiz not found');
    if (quizRes.rows[0].owner_id !== ownerId) throw new Error('Not authorized to delete this quiz');
    // Delete questions first (if using ON DELETE CASCADE, this is optional)
    await client.query('DELETE FROM questions WHERE quiz_id = $1', [quizId]);
    // Delete quiz
    await client.query('DELETE FROM quizzes WHERE id = $1', [quizId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createQuiz,
  getPublicQuizzes,
  getQuizForPlayer,
  getQuizWithAnswersForOwner,
  getMyQuizzes,
  updateQuiz,
  deleteQuiz,
};
