const { Pool } = require('pg');
require('dotenv').config(); // This will load the environment variables

// Connection string using the environment variable
const connectionString = process.env.DB_CONNECTION_STRING;

// Connection configuration using the connection string
const db = new Pool({
  connectionString: connectionString,
});

// Test the connection
db.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
    process.exit(1); // Exit if connection fails
  } else {
    console.log('Connected to PostgreSQL database');
    release(); // Release the client back to the pool
  }
});

module.exports = db;
