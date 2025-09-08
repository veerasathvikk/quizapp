import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../api/socket';
import styles from './QuizDashboard.module.css';

export default function JoinGame() {
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');
    socket.emit('join-game', { pin, nickname }, (res) => {
      if (res && res.error) {
        setError(res.error);
      } else {
        navigate(`/lobby/${pin}`);
      }
    });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Join Game</h2>
      <form onSubmit={handleJoin}>
        <input
          className={styles.input}
          type="text"
          placeholder="Game PIN"
          value={pin}
          onChange={e => setPin(e.target.value)}
          required
        />
        <input
          className={styles.input}
          type="text"
          placeholder="Nickname"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          required
        />
        <button className={styles.modifyButton} type="submit">Join</button>
        {error && <p className={styles.noResults} style={{color:'red'}}>{error}</p>}
      </form>
    </div>
  );
}

