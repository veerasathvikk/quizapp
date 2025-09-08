const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const resultService = require('../services/resultService');

const router = express.Router();

// POST /api/quizzes/:id/submit   (submit answers)
router.post('/quizzes/:id/submit', requireAuth, async (req, res) => {
  try {
    const quizId = req.params.id;
    const { answers } = req.body;
    if (!Array.isArray(answers)) return res.status(400).json({ message: 'answers[] required' });
    console.log(quizId);
    console.log(req.user.id);
    console.log(answers);
    const { result, summary } = await resultService.submitQuiz({
      userId: req.user.id,
      quizId,
      answers
    });

    res.status(201).json({
      result_id: result.id,
      score: summary.score,
      total_questions: summary.totalQuestions,
      details: summary.details
    });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(400).json({ message: err.message });
  }
});

// GET /api/results/me
router.get('/results/me', requireAuth, async (req, res) => {
  try {
    const rows = await resultService.getResultsByUser(req.user.id);
    res.json({ results: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
