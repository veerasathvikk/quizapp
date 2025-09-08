import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import socket from '../api/socket';
import styles from "./QuizPlayer.module.css";

export default function QuizPlayer() {
  const { id: pin } = useParams(); // pin is used as the game session id
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [role, setRole] = useState('player'); // 'host' or 'player'
  const [answerCount, setAnswerCount] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showCorrect, setShowCorrect] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [answerResult, setAnswerResult] = useState(null); // { correct: boolean, correctIndex: number }
  const [gameEnded, setGameEnded] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure socket joins the correct room for this game PIN
    socket.emit('join-room', pin);
    // Listen for question events
    socket.on('show-question', ({ question, index, total, timeLimit }) => {
      setCurrentQuestion(question);
      setQuestionIndex(index);
      setTotalQuestions(total);
      setSelected(null);
      setAnswered(false);
      setWaiting(false);
      setShowCorrect(false);
      setTimer(timeLimit || 20); // default 20s if not provided
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setAnswered(true);
            setWaiting(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
    socket.on('answer-result', ({ correct, correctIndex }) => {
      setAnswerResult({ correct, correctIndex });
    });
    socket.on('show-correct-answer', ({ correctIndex }) => {
      setShowCorrect(true);
      setAnswered(true);
      setWaiting(false);
      // Show feedback for 3 seconds, then keep the feedback visible (do not hide it)
      // setTimeout(() => {
      //   setShowCorrect(false);
      //   setAnswerResult(null);
      // }, 3000);
    });
    socket.on('leaderboard', (data) => {
      setLeaderboard(data);
    });
    socket.on('game-ended', () => {
      setGameEnded(true);
      setShowLeaderboard(true);
      // alert('Game ended!');
      // navigate('/'); // Commented out to keep leaderboard visible
    });
    // Detect if host
    socket.on('lobby-update', (session) => {
      if (session.host === socket.id) setRole('host');
      else setRole('player');
    });
    return () => {
      socket.off('show-question');
      socket.off('answer-count');
      socket.off('game-ended');
      socket.off('lobby-update');
      socket.off('answer-result');
      socket.off('show-correct-answer');
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [navigate, pin]);

  const handleSelect = (idx) => {
    if (!answered) setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    setAnswered(true);
    setWaiting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    socket.emit('submit-answer', { pin, answerIndex: selected });
  };

  const handleNext = () => {
    socket.emit('next-question', { pin });
    setAnswerCount(0);
    setShowCorrect(false);
  };

  const handleExit = () => {
    navigate('/');
  };

  // Host ends the quiz
  const handleEndQuiz = () => {
    socket.emit('game-ended', { pin });
    setGameEnded(true);
    setShowLeaderboard(true);
  };
  // Participant views leaderboard at end
  const handleViewLeaderboard = () => {
    setShowLeaderboard(true);
  };

  // At the last question, only show leaderboard, not the question
  if ((gameEnded || showLeaderboard) && leaderboard && leaderboard.length > 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Leaderboard</h2>
        <div className={styles.leaderboardSection}>
          <ol className={styles.leaderboardList}>
            {leaderboard.map((entry, i) => (
              <li key={i} className={styles.leaderboardItem}>
                {(entry?.nickname || entry?.name) ?? `Player ${i+1}`}: {entry?.score ?? 0}
              </li>
            ))}
          </ol>
        </div>
        <button className={styles.submitButton} onClick={handleExit} style={{marginTop: 24}}>
          Exit
        </button>
      </div>
    );
  }
  if ((gameEnded || showLeaderboard) && (!leaderboard || leaderboard.length === 0)) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Leaderboard</h2>
        <div>No leaderboard data available.</div>
        <button className={styles.submitButton} onClick={handleExit} style={{marginTop: 24}}>
          Exit
        </button>
      </div>
    );
  }

  if (!currentQuestion) return <div className={styles.container}><h2>Waiting for question...</h2></div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Question {questionIndex + 1} / {totalQuestions}</h2>
      <div className={styles.timer}>Time left: {timer}s</div>
      <p className={styles.questionText}>{currentQuestion.question_text}</p>
      <div className={styles.options}>
        {currentQuestion.options.map((opt, idx) => (
          <label key={idx} className={styles.optionLabel} style={showCorrect && currentQuestion.correctIndex === idx ? {background:'#d4edda'} : {}}>
            <input
              type="radio"
              name="option"
              checked={selected === idx}
              onChange={() => handleSelect(idx)}
              disabled={answered || role === 'host'}
              className={styles.radioInput}
            />
            {opt}
            {showCorrect && currentQuestion.correctIndex === idx && <span className={styles.correctMark}> ✓</span>}
          </label>
        ))}
      </div>
      {showCorrect && (
        <div className={styles.correctAnswer}>
          Correct answer: {currentQuestion.options[answerResult?.correctIndex ?? currentQuestion.correct_index]}
        </div>
      )}
      {showCorrect && answerResult && (
        <div className={answerResult.correct ? styles.correct : styles.incorrect}>
          {selected === null
            ? 'You didn\'t answer.'
            : answerResult.correct
              ? 'Your answer is correct!'
              : 'Your answer is incorrect.'}
        </div>
      )}
      {(role === 'host' || showCorrect || gameEnded) ? (
        leaderboard && leaderboard.length > 0 && (
          <div className={styles.leaderboardSection}>
            <h3>Leaderboard</h3>
            <ol className={styles.leaderboardList}>
              {leaderboard.map((entry, i) => (
                <li key={i} className={styles.leaderboardItem}>
                  {(entry?.nickname || entry?.name) ?? `Player ${i+1}`}: {entry?.score ?? 0}
                </li>
              ))}
            </ol>
            {gameEnded && (
              <button className={styles.submitButton} onClick={handleExit} style={{marginTop: 24}}>
                Exit
              </button>
            )}
          </div>
        )
      ) : null}
      {role === 'host' && questionIndex === totalQuestions - 1 ? (
        <div>
          <button className={styles.submitButton} style={{background:'#d32f2f'}} onClick={handleEndQuiz}>
            End Quiz & Show Leaderboard
          </button>
        </div>
      ) : null}
      {role !== 'host' && questionIndex === totalQuestions - 1 && !gameEnded && showLeaderboard ? (
        <div>
          <button className={styles.submitButton} style={{background:'#1976d2'}} onClick={handleViewLeaderboard}>
            View Leaderboard
          </button>
        </div>
      ) : null}
      {role === 'host' && questionIndex !== totalQuestions - 1 ? (
        <div>
          <p className={styles.description}>
            {answerCount} participant{answerCount === 1 ? '' : 's'} answered
          </p>
          <button className={styles.submitButton} style={{background:'#1976d2'}} onClick={handleNext}>
            Next Question
          </button>
        </div>
      ) : null}
      {role !== 'host' && !answered ? (
        <button className={styles.submitButton} onClick={handleSubmit} disabled={selected === null || timer === 0}>
          Submit Answer
        </button>
      ) : null}
      {role !== 'host' && answered ? (
        <div>
          <p className={styles.description}>{waiting && !showCorrect ? 'Waiting for next question...' : ''}</p>
        </div>
      ) : null}
    </div>
  );
}