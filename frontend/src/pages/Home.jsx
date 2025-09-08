import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Homepage</h2>
      <div className={styles.boxGrid}>
        <div className={styles.box}>
          <Link className={styles.boxLink} to="/join">Join a Quiz</Link>
        </div>
        <div className={styles.box}>
          <Link className={styles.boxLink} to="/my-quizzes">My Quizzes</Link>
        </div>
        <div className={styles.box}>
          <Link className={styles.boxLink} to="/create">Create a Quiz</Link>
        </div>
      </div>
    </div>
  );
}