const pool = require('../config/db');

async function submitQuiz({ userId, quizId, answers }) {
  // answers: [{question_id, selected_index}, ...]
  // 1) fetch correct answers for quiz questions
  console.log(quizId);
  console.log(userId);
  const questionIds = answers.map(a => a.question_id);
  console.log(questionIds)
  const qRes = await pool.query(
    `SELECT id, correct_index FROM questions WHERE quiz_id = $1 AND id = ANY($2::uuid[])`,
    [quizId, questionIds]
  );
  console.log(qRes);

  // build a map of question_id => correct_index
  const correctMap = {};
  for (const row of qRes.rows) {
    correctMap[row.id] = row.correct_index;
  }
  console.log(correctMap);

  // compute correctness & details
  const details = [];
  let correctCount = 0;
  for (const ans of answers) {
    const correct_index = (correctMap[ans.question_id] == null) ? null : correctMap[ans.question_id];
    const selected_index = ans.selected_index;
    const correct = (correct_index != null) ? (selected_index === correct_index) : false;
    if (correct) correctCount++;
    details.push({
      question_id: ans.question_id,
      selected_index,
      correct_index,
      correct
    });
  }

  const totalQuestions = answers.length;
  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100 * 100) / 100; // two decimals

  // Insert into results table
  const insertText = `
    INSERT INTO results (user_id, quiz_id, score, total_questions, details)
    VALUES ($1, $2, $3, $4, $5::jsonb)
    RETURNING *`;
  const res = await pool.query(insertText, [userId, quizId, score, totalQuestions, JSON.stringify(details)]);
  return { result: res.rows[0], summary: { score, totalQuestions, details } };
}

async function getResultsByUser(userId, limit = 50, offset = 0) {
  const res = await pool.query(
    `SELECT r.id,
            r.quiz_id,
            q.title AS quiz_title,
            r.score,
            r.total_questions,
            r.details,
            r.created_at
     FROM results r
     JOIN quizzes q ON q.id = r.quiz_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3;
`,
    [userId, limit, offset]
  );
  return res.rows;
}

// Get all results for a quiz, sorted by score descending
async function getResultsByQuiz(quizId) {
  const res = await pool.query(`
    SELECT r.*, u.email, u.name
    FROM results r
    JOIN users u ON r.user_id = u.id
    WHERE r.quiz_id = $1
    ORDER BY r.score DESC, r.created_at ASC
  `, [quizId]);
  return res.rows;
}

module.exports = { submitQuiz, getResultsByUser, getResultsByQuiz };
