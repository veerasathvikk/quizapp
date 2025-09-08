const pool = require('../config/db');

async function findUserByEmail(email) {
  const result = await pool.query(`SELECT * FROM users WHERE lower(email) = lower($1)`, [email]);
  return result.rows[0];
}

async function createUser(email) {
  const result = await pool.query(
    `INSERT INTO users (email) VALUES ($1) RETURNING *`,
    [email.toLowerCase()]
  );
  return result.rows[0];
}

async function updateUserName(userId, name) {
  const result = await pool.query(
    `UPDATE users SET name = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [name, userId]
  );
  return result.rows[0];
}

module.exports = { findUserByEmail, createUser, updateUserName };
