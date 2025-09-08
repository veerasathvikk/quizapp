import { useEffect, useState } from "react";
import api from '../api/axios';
import styles from './Results.module.css';

export default function Results() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    api.get("/results/me")
      .then((res) => setResults(res.data.results || []))
      .catch(() => setResults([]));
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>My Quiz Results</h2>
      {results.length === 0 ? (
        <p>No results found.</p>
      ) : (
        results.map((r) => (
          <div key={r.id} className={styles.resultCard}>
            <p className={styles.resultText}><strong>Quiz:</strong> {r.quiz_title}</p>
            <p className={styles.resultText}><strong>Score:</strong> {r.score}</p>
            <p className={styles.resultText}>
              <strong>Date:</strong> {new Date(r.created_at).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}