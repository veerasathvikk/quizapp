const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const quizService = require('../services/quizService');

const router = express.Router();

// POST /api/quizzes  (create)
router.post('/', requireAuth, async (req, res) => {
  try {
    const payload = req.body;
    // Minimal validation
    if (!payload.title || !Array.isArray(payload.questions) || payload.questions.length === 0) {
      return res.status(400).json({ message: 'title and questions[] required' });
    }
    const { quiz, questions } = await quizService.createQuiz({
      ownerId: req.user.id,
      title: payload.title,
      description: payload.description || null,
      is_public: payload.is_public != null ? payload.is_public : true,
      metadata: payload.metadata || {},
      questions: payload.questions
    });

    // Return created quiz with questions (including correct_index) — used by creator UI
    res.status(201).json({ quiz, questions });
  } catch (err) {
    console.error('Create quiz error:', err);
    res.status(400).json({ message: err.message });
  }
});

// GET /api/quizzes (list public)
router.get('/', async (req, res) => {
  const quizzes = await quizService.getPublicQuizzes();
  res.json({ quizzes });
});

// GET /api/quizzes/my (list my quizzes)
router.get('/my', requireAuth, async (req, res) => {
  const my = await quizService.getMyQuizzes(req.user.id);
  res.json({ quizzes: my });
});

// GET /api/quizzes/:id (player view)
router.get('/:id', async (req, res) => {
  const quiz = await quizService.getQuizForPlayer(req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  res.json(quiz);
});

// GET /api/quizzes/:id/owner (owner view with answers)
router.get('/:id/owner', requireAuth, async (req, res) => {
  try {
    const quiz = await quizService.getQuizWithAnswersForOwner(req.params.id, req.user.id);
    res.json(quiz);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
});

// GET /api/quizzes/:id/results (all results for a quiz, sorted by score desc)
router.get('/:id/results', requireAuth, async (req, res) => {
  try {
    const quizId = req.params.id;
    const results = await require('../services/resultService').getResultsByQuiz(quizId);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/quizzes/:id (update quiz)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const quizId = req.params.id;
    const payload = req.body;
    const updated = await quizService.updateQuiz({ quizId, ownerId: req.user.id, ...payload });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/quizzes/:id (delete quiz)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await quizService.deleteQuiz({ quizId: req.params.id, ownerId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
});

module.exports = router;
