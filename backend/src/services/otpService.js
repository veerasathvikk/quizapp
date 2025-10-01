const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generateOTP } = require('../utils/otpGenerator');
const { sendEmail } = require('../utils/email');

async function requestOTP(email) {
  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await pool.query(
    `INSERT INTO otps (email, otp_hash, expires_at) VALUES ($1, $2, $3)`,
    [email.toLowerCase(), otpHash, expiresAt]
  );

  // Print OTP to console
  console.log(`OTP for ${email}: ${otp}`);

  // Try to send OTP via email
//  try {
//    await sendEmail(email, 'Your Quiz App OTP', `Your OTP is: ${otp} (valid for 5 minutes)`);
//    console.log(`OTP email sent successfully to ${email}`);
//  } catch (error) {
//    console.log(`Failed to send OTP email to ${email}:`, error.message);
//  }

  return true;
}

async function verifyOTP(email, otp) {
  const result = await pool.query(
    `SELECT * FROM otps WHERE lower(email) = lower($1) AND used = false ORDER BY created_at DESC LIMIT 1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('No OTP request found for this email');
  }

  const otpRow = result.rows[0];
  if (new Date(otpRow.expires_at) < new Date()) {
    throw new Error('OTP expired');
  }

  const isValid = await bcrypt.compare(otp, otpRow.otp_hash);
  if (!isValid) {
    throw new Error('Invalid OTP');
  }

  // Mark OTP as used
  await pool.query(`UPDATE otps SET used = true, consumed_at = now() WHERE id = $1`, [otpRow.id]);

  return true;
}

module.exports = { requestOTP, verifyOTP };
