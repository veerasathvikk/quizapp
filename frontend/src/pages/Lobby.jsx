import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../api/socket';
import styles from './QuizDashboard.module.css';

export default function Lobby() {
  const { pin } = useParams();
  const [lobby, setLobby] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit('join-room', pin); // Optional: for room-specific events
    // Check if this client is the host (by comparing socket.id with lobby.host)
    socket.on('lobby-update', (session) => {
      setLobby(session);
      if (session.host === socket.id) setIsHost(true);
    });
    socket.on('game-ended', () => {
      setGameEnded(true);
    });
    socket.on('game-started', () => {
      setGameStarted(true);
      // Redirect to quiz play page (implement this route as needed)
      navigate(`/quiz/${pin}`);
    });
    return () => {
      socket.off('lobby-update');
      socket.off('game-ended');
      socket.off('game-started');
    };
  }, [pin, navigate]);

  const handleStartGame = () => {
    socket.emit('start-game', { pin });
  };

  if (gameStarted) return <div className={styles.container}><h2>Game Started!</h2><p>Redirecting to quiz...</p></div>;
  if (gameEnded) return <div className={styles.container}><h2>Game Ended</h2><p>The host has ended the game or disconnected.</p></div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Lobby</h2>
      <h3>Game PIN: <span style={{fontWeight:'bold'}}>{pin}</span></h3>
      <div>
        <strong>Players Joined:</strong>
        <ul>
          {lobby?.players?.map(p => <li key={p.id}>{p.nickname}</li>)}
        </ul>
      </div>
      {isHost ? (
        <button className={styles.modifyButton} style={{marginTop: 16, background: '#1976d2'}} onClick={handleStartGame}>
          Start Game
        </button>
      ) : (
        <p>Waiting for host to start the game...</p>
      )}
    </div>
  );
}
