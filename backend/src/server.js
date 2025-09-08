require('dotenv').config();
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const quizService = require('./services/quizService');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust this in production
    methods: ['GET', 'POST']
  }
});

// In-memory store for game sessions
const gameSessions = {};

// Helper to generate a unique 6-digit PIN
function generateGamePin() {
  let pin;
  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
  } while (gameSessions[pin]);
  return pin;
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Host creates a new game session
  socket.on('create-game', (hostUser, callback) => {
    const pin = generateGamePin();
    // Store the token if provided
    gameSessions[pin] = {
      host: socket.id,
      hostUser,
      players: [],
      state: 'lobby',
      token: hostUser.token // store JWT token for later use
    };
    socket.join(pin);
    if (callback) callback({ pin });
    io.to(pin).emit('lobby-update', gameSessions[pin]);
  });

  // Player joins a game session
  socket.on('join-game', ({ pin, nickname }, callback) => {
    const session = gameSessions[pin];
    if (!session || session.state !== 'lobby') {
      if (callback) callback({ error: 'Invalid or closed game PIN.' });
      return;
    }
    // Add score property to player
    const player = { id: socket.id, nickname, score: 0 };
    session.players.push(player);
    socket.join(pin);
    if (callback) callback({ success: true });
    io.to(pin).emit('lobby-update', session);
  });

  // Ensure socket joins the correct room for this game PIN
  socket.on('join-room', (pin) => {
    socket.join(pin);
    // If game has started, emit the current question to this socket
    const session = gameSessions[pin];
    if (session && session.state === 'started' && session.questions && session.currentQuestion != null) {
      socket.emit('show-question', {
        question: session.questions[session.currentQuestion],
        index: session.currentQuestion,
        total: session.questions.length
      });
    }
  });

  // Host starts the game
  socket.on('start-game', async ({ pin }) => {
    const session = gameSessions[pin];
    if (session && session.host === socket.id && session.state === 'lobby') {
      session.state = 'started';
      // Debug: log hostUser and quizId
      console.log('Starting game for pin:', pin, 'hostUser:', session.hostUser);
      const quizId = session.hostUser.quizId || session.hostUser.id || session.hostUser.quiz_id;
      if (!quizId) {
        io.to(session.host).emit('game-error', 'Quiz ID missing. Cannot start game.');
        return;
      }
      // Fetch quiz questions directly from DB using quizService
      try {
        const quiz = await quizService.getQuizForPlayer(quizId);
        if (!quiz || !quiz.questions || quiz.questions.length === 0) {
          throw new Error('Quiz not found or has no questions');
        }
        session.questions = quiz.questions;
        session.currentQuestion = 0;
        session.answers = {}; // { [socketId]: answerIndex }
        session.questionClosed = false;
        session.timer = null;
        session.timeLeft = 20; // seconds per question
        io.to(pin).emit('game-started');
        // Send first question
        sendQuestionWithTimer(pin);
      } catch (err) {
        console.error('Quiz fetch error:', err.message);
        io.to(session.host).emit('game-error', 'Failed to fetch quiz questions.');
        io.to(pin).emit('game-ended');
      }
    }
  });

  // Helper to send question and start timer
  function sendQuestionWithTimer(pin) {
    const session = gameSessions[pin];
    if (!session) return;
    const question = session.questions[session.currentQuestion];
    session.answers = {};
    session.questionClosed = false;
    session.timeLeft = 20;
    io.to(pin).emit('show-question', {
      question,
      index: session.currentQuestion,
      total: session.questions.length,
      timeLeft: session.timeLeft
    });
    // Start timer
    if (session.timer) clearInterval(session.timer);
    session.timer = setInterval(() => {
      session.timeLeft--;
      io.to(pin).emit('timer-update', { timeLeft: session.timeLeft });
      if (session.timeLeft <= 0) {
        clearInterval(session.timer);
        session.timer = null;
        closeQuestionAndShowResults(pin);
      }
    }, 1000);
  }

  // Helper to close question, show correct answer, update scores, and emit leaderboard
  function closeQuestionAndShowResults(pin) {
    const session = gameSessions[pin];
    if (!session) return;
    session.questionClosed = true;
    // Calculate correct answer index for this question
    const currentQ = session.questions[session.currentQuestion];
    const correctIndex = currentQ.correct_index; // Use correct_index from DB
    // Update scores and notify players
    session.players.forEach(player => {
      const playerAnswer = session.answers[player.id];
      const isCorrect = playerAnswer === correctIndex;
      // Only award 100 points for correct answer
      if (playerAnswer !== undefined && isCorrect) {
        player.score += 100;
      }
      // No points for wrong, unattempted, or incorrect answers
      io.to(player.id).emit('answer-result', { correct: isCorrect, correctIndex });
    });
    // Emit correct answer to all
    io.to(pin).emit('show-correct-answer', { correctIndex });
    // Emit leaderboard
    const leaderboard = session.players.map(p => ({ nickname: p.nickname, score: p.score })).sort((a, b) => b.score - a.score);
    io.to(pin).emit('leaderboard', leaderboard);
  }

  // Host moves to next question
  socket.on('next-question', ({ pin }) => {
    const session = gameSessions[pin];
    if (session && session.host === socket.id && session.state === 'started') {
      if (session.timer) clearInterval(session.timer);
      session.currentQuestion++;
      if (session.currentQuestion < session.questions.length) {
        sendQuestionWithTimer(pin);
      } else {
        io.to(pin).emit('game-ended');
        delete gameSessions[pin];
      }
    }
  });

  // Player submits answer
  socket.on('submit-answer', ({ pin, answerIndex }) => {
    const session = gameSessions[pin];
    if (session && session.state === 'started') {
      if (session.questionClosed) return;
      // Only accept the first answer per player per question
      if (session.answers[socket.id] === undefined) {
        session.answers[socket.id] = answerIndex;
        io.to(session.host).emit('answer-count', Object.keys(session.answers).length);
      }
      // Check if all players have answered
      if (Object.keys(session.answers).length === session.players.length) {
        if (session.timer) clearInterval(session.timer);
        closeQuestionAndShowResults(pin);
      }
    }
  });

  // Host ends the quiz for all
  socket.on('game-ended', ({ pin }) => {
    const session = gameSessions[pin];
    if (!session) return;
    // If not already closed, close the last question and show leaderboard
    if (!session.questionClosed) {
      closeQuestionAndShowResults(pin);
    }
    io.to(pin).emit('game-ended');
    delete gameSessions[pin];
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove player from any session
    for (const pin in gameSessions) {
      const session = gameSessions[pin];
      if (session.host === socket.id) {
        // End game if host disconnects
        io.to(pin).emit('game-ended');
        delete gameSessions[pin];
      } else {
        const idx = session.players.findIndex(p => p.id === socket.id);
        if (idx !== -1) {
          session.players.splice(idx, 1);
          io.to(pin).emit('lobby-update', session);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
