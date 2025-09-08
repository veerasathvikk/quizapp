const express = require('express');
const { updateUserName } = require('../services/userService');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// PUT /api/users/me
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });

    const updated = await updateUserName(req.user.id, name);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
