import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../api/socket';
import styles from './QuizPlayer.module.css';

export default function HostGame() {
  const { pin } = useParams();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answerCount, setAnswerCount] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [timer, setTimer] = useState(null);
  const [showCorrect, setShowCorrect] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit('join-room', pin);
    socket.on('show-question', ({ question, index, total, timeLeft }) => {
      setCurrentQuestion(question);
      setQuestionIndex(index);
      setTotalQuestions(total);
      setAnswerCount(0);
      setCorrectIndex(null);
      setShowCorrect(null);
      setLeaderboard(null);
      setTimer(timeLeft || 20);
    });
    socket.on('timer-update', ({ timeLeft }) => {
      setTimer(timeLeft);
    });
    socket.on('show-correct-answer', ({ correctIndex }) => {
      setShowCorrect(correctIndex);
    });
    socket.on('leaderboard', (data) => {
      setLeaderboard(data);
    });
    socket.on('answer-count', (count) => {
      setAnswerCount(count);
    });
    socket.on('game-ended', () => {
      setGameEnded(true);
      setShowLeaderboard(true); // Show leaderboard when game ends
      // Removed auto navigation
    });
    socket.on('answer-result', ({ correctIndex }) => {
      setCorrectIndex(correctIndex);
    });
    return () => {
      socket.off('show-question');
      socket.off('timer-update');
      socket.off('show-correct-answer');
      socket.off('leaderboard');
      socket.off('answer-count');
      socket.off('game-ended');
      socket.off('answer-result');
    };
  }, [pin, navigate]);

  const handleNext = () => {
    socket.emit('next-question', { pin });
    setAnswerCount(0);
    setCorrectIndex(null);
  };

  const handleEndQuiz = () => {
    socket.emit('game-ended', { pin });
    setShowLeaderboard(true);
  };
  const handleExit = () => {
    navigate('/');
  };

  if (showLeaderboard || gameEnded) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Leaderboard</h2>
        {leaderboard && leaderboard.length > 0 && (
          <div className={styles.leaderboardSection}>
            <ol className={styles.leaderboardList}>
              {leaderboard.map((p, i) => (
                <li key={i} className={styles.leaderboardItem}>
                  {p.nickname}: {p.score}
                </li>
              ))}
            </ol>
          </div>
        )}
        <button className={styles.submitButton} onClick={handleExit} style={{marginTop: 24}}>
          Exit
        </button>
      </div>
    );
  }

  if (gameEnded) return <div className={styles.container}><h2>Game Ended</h2></div>;
  if (!currentQuestion) return <div className={styles.container}><h2>Waiting for question...</h2></div>;

  return (
    <div className={styles.container}>
      {gameEnded && <h2>Game Ended! Returning to home...</h2>}
      {currentQuestion && (
        <div>
          <h2>Question {questionIndex + 1} / {totalQuestions}</h2>
          <div>{currentQuestion.question_text}</div>
          <div>
            {currentQuestion.options && currentQuestion.options.map((opt, idx) => (
              <div key={idx} style={{
                background: showCorrect === idx ? '#c8e6c9' : '',
                padding: '4px',
                margin: '2px 0'
              }}>
                {opt}
                {showCorrect === idx && <span style={{color:'green',marginLeft:8}}>(Correct)</span>}
              </div>
            ))}
          </div>
          {timer !== null && <div>Time left: {timer}s</div>}
          <div>Answers received: {answerCount}</div>
          {showCorrect !== null && (
            <div style={{ marginTop: 10 }}>
              Correct answer: {currentQuestion.options[showCorrect]}
            </div>
          )}
          {leaderboard && (
            <div style={{ marginTop: 20 }}>
              <h3>Leaderboard</h3>
              <ol>
                {leaderboard.map((p, i) => (
                  <li key={i}>{p.nickname}: {p.score}</li>
                ))}
              </ol>
            </div>
          )}
          {questionIndex === totalQuestions - 1 ? (
            <button className={styles.submitButton} style={{background:'#d32f2f',marginTop:20}} onClick={handleEndQuiz}>
              End Quiz & Show Leaderboard
            </button>
          ) : (
            <button onClick={handleNext} style={{marginTop:20}}>Next Question</button>
          )}
        </div>
      )}
    </div>
  );
}
