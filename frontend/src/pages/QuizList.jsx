import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import styles from './QuizList.module.css';

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get('/quizzes');
        setQuizzes(resp.data.quizzes || []);
      } catch (err) {
        console.error("Failed to fetch quizzes", err);
      }
    })();
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Public Quizzes</h2>
      <ul>
        {quizzes.map((quiz) => (
          <li key={quiz.id} className={styles.quizItem}>
            <h3 className={styles.quizTitle}>{quiz.title}</h3>
          </li>
        ))}
      </ul>
    </div>
  );
}