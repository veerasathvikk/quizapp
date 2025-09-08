import React, { useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';


export default function Login() {
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState('enterEmail'); // enterEmail, verifyOtp, enterName
  const [message, setMessage] = useState(null);
  const [otp, setOtp] = useState('');
  const [isNewUser , setIsNewUser ] = useState(false);
  const { setToken, setUser  } = useContext(AuthContext);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      setMessage('Sending OTP...');
      await api.post('/auth/request-otp', { email });
      setMessage('OTP sent. Check your email (spam also).');
      setStage('verifyOtp');
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  const handleVerify = async () => {
    try {
      setMessage('Verifying...');
      const resp = await api.post('/auth/verify-otp', { email, otp });
      const { token, user, isNewUser  } = resp.data;
      setToken(token);
      setUser (user);
      setIsNewUser (isNewUser );
      if (isNewUser ) {
        setStage('enterName');
      } else {
        setStage('done');
        navigate('/');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  const handleSaveName = async () => {
    try {
      setMessage('Saving name...');
      await api.put('/users/me', { name });
      setUser (prev => ({ ...prev, name }));
      setMessage('Name saved. Redirecting...');
      navigate('/');
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Login</h1>


      {stage === 'enterEmail' && (
        <div>
          <label className={styles.label} htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            className={styles.inputField}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            autoComplete="email"
          />
          <div className={styles.actionRow}>
            <button
              className={styles.buttonPrimary}
              onClick={handleSendOtp}
              disabled={!email}
            >
              Send OTP
            </button>
          </div>
        </div>
      )}

      {stage === 'verifyOtp' && (
        <div>
          <p style={{ marginBottom: 8 }}>
            We sent an OTP to <b>{email}</b>. Enter it below (6 digits).
          </p>
          <input
            type="text"
            className={styles.inputField}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
          />
          <div className={styles.actionRow}>
            <button
              className={styles.buttonPrimary}
              onClick={handleVerify}
              disabled={otp.length !== 6}
            >
              Verify OTP
            </button>
            <button
              className={styles.buttonSecondary}
              onClick={() => { setStage('enterEmail'); setMessage(null); setOtp(''); }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {stage === 'enterName' && (
        <div>
          <p style={{ marginBottom: 8 }}>
            Welcome new user! Please enter your name to continue.
          </p>
          <input
            type="text"
            className={styles.inputField}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <div className={styles.actionRow}>
            <button
              className={styles.buttonPrimary}
              onClick={handleSaveName}
              disabled={!name.trim()}
            >
              Save & Continue
            </button>
          </div>
        </div>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}