const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);


const quizzesRoutes = require('./routes/quizzes');
const resultsRoutes = require('./routes/results');

app.use('/api/quizzes', quizzesRoutes);
app.use('/api', resultsRoutes);
module.exports = app;
