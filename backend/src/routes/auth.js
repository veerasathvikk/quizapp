const express = require('express');
const jwt = require('jsonwebtoken');
const { requestOTP, verifyOTP } = require('../services/otpService');
const { findUserByEmail, createUser } = require('../services/userService');

const router = express.Router();

// POST /api/auth/request-otp
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    await requestOTP(email);
    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    await verifyOTP(email, otp);

    let user = await findUserByEmail(email);
    let isNewUser = false;
    if (!user) {
      user = await createUser(email);
      isNewUser = true;
    }

    // issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user, isNewUser });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
