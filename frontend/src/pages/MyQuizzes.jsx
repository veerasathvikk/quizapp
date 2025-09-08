import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from '../api/axios';
import styles from './MyQuizzes.module.css';

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/quizzes/my")
      .then(res => {
        setQuizzes(res.data.quizzes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Delete quiz handler
  const handleDelete = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz permanently?")) return;
    try {
      await api.delete(`/quizzes/${quizId}`);
      setQuizzes(quizzes.filter(q => q.id !== quizId));
    } catch (err) {
      alert("Failed to delete quiz.");
    }
  };

  if (loading) return <p className={styles.message}>Loading...</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>My Quizzes</h2>
      {quizzes.length === 0 ? (
        <p className={styles.message}>You have not created any quizzes yet.</p>
      ) : (
        <ul className={styles.list}>
          {quizzes.map(q => (
            <li key={q.id} className={styles.listItem}>
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  navigate(`/quiz-dashboard/${q.id}`);
                }}
                className={styles.link}
              >
                {q.title}
              </a>
              <div className={styles.listItemContent}>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(q.id)}
                >
                  Delete
                </button>
                <button
                  className={styles.modifyBtn}
                  onClick={() => navigate(`/edit-quiz/${q.id}`)}
                >
                  Modify
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}