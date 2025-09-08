import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from '../api/axios';
import socket from '../api/socket';
import styles from './QuizDashboard.module.css';

export default function QuizDashboard() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hostingPin, setHostingPin] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const quizRes = await api.get(`/quizzes/${id}`);
        setQuiz(quizRes.data);
        const resultsRes = await api.get(`/quizzes/${id}/results`);
        setResults(resultsRes.data.results || []);
      } catch (err) {
        alert("Failed to load quiz dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Host a live game
  const handleHostGame = () => {
    const token = localStorage.getItem('quizapp_token');
    socket.emit('create-game', { quizId: id, token }, (res) => {
      if (res && res.pin) {
        setHostingPin(res.pin);
        // Ensure host joins the game room to receive show-question events
        socket.emit('join-room', res.pin);
      }
    });
  };

  // Listen for lobby updates and game start
  useEffect(() => {
    if (!hostingPin) return;
    socket.on('lobby-update', (session) => {
      setLobby(session);
    });
    socket.on('game-started', () => {
      setGameStarted(true);
      if (hostingPin) {
        navigate(`/host/${hostingPin}`);
      }
    });
    return () => {
      socket.off('lobby-update');
      socket.off('game-started');
    };
  }, [hostingPin]);

  const handleStartGame = () => {
    socket.emit('start-game', { pin: hostingPin });
  };

  if (loading) return <p className={styles.noResults}>Loading...</p>;
  if (!quiz) return <p className={styles.noResults}>Quiz not found</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Quiz Dashboard</h2>
      <h3 className={styles.subtitle}>{quiz.title}</h3>
      <p className={styles.description}>{quiz.description}</p>
      <button
        className={styles.modifyButton}
        onClick={() => navigate(`/edit-quiz/${id}`)}
        type="button"
      >
        Modify Quiz
      </button>
      <button
        className={styles.modifyButton}
        style={{marginLeft: 8, background: '#4caf50'}}
        onClick={handleHostGame}
        type="button"
        disabled={!!hostingPin}
      >
        {hostingPin ? `Hosting (PIN: ${hostingPin})` : 'Host Live Game'}
      </button>
      {hostingPin && (
        <div style={{marginTop: 16, background: '#e3f2fd', padding: 12, borderRadius: 8}}>
          <h4>Lobby PIN: <span style={{fontWeight: 'bold'}}>{hostingPin}</span></h4>
          <div>
            <strong>Players Joined:</strong>
            <ul>
              {lobby?.players?.map(p => <li key={p.id}>{p.nickname}</li>)}
            </ul>
          </div>
          {!gameStarted && (
            <button className={styles.modifyButton} style={{marginTop: 16, background: '#1976d2'}} onClick={handleStartGame}>
              Start Game
            </button>
          )}
          {gameStarted && <p style={{color: 'green', marginTop: 16}}>Game Started!</p>}
        </div>
      )}

      <h4 className={styles.resultsTitle}>User  Results</h4>
      {results.length === 0 ? (
        <p className={styles.noResults}>No one has taken this quiz yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>User </th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Score</th>
              <th className={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr key={r.id} className={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                <td className={styles.td}>{r.name || 'N/A'}</td>
                <td className={styles.td}>{r.email}</td>
                <td className={styles.td}>{r.score}</td>
                <td className={styles.td}>{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}