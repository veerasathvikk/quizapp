import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import styles from "./EditQuiz.module.css";

export default function EditQuiz() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/quizzes/${id}/owner`)
      .then(res => {
        setQuiz(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const addQuestion = () => {
    setQuiz(qz => ({
      ...qz,
      questions: [
        ...qz.questions,
        {
          question_text: "",
          options: ["", ""],
          correct_index: 0,
          order_index: qz.questions.length + 1,
        },
      ],
    }));
  };

  const removeQuestion = (index) => {
    setQuiz(qz => {
      const updated = qz.questions.filter((_, i) => i !== index);
      updated.forEach((q, i) => (q.order_index = i + 1));
      return { ...qz, questions: updated };
    });
  };

  const updateQuestionText = (index, text) => {
    setQuiz(qz => {
      const updated = [...qz.questions];
      updated[index].question_text = text;
      return { ...qz, questions: updated };
    });
  };

  const addOption = (qIndex) => {
    setQuiz(qz => {
      const updated = [...qz.questions];
      updated[qIndex].options.push("");
      return { ...qz, questions: updated };
    });
  };

  const removeOption = (qIndex, optIndex) => {
    setQuiz(qz => {
      const updated = [...qz.questions];
      updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
      if (updated[qIndex].correct_index >= updated[qIndex].options.length) {
        updated[qIndex].correct_index = 0;
      }
      return { ...qz, questions: updated };
    });
  };

  const updateOptionText = (qIndex, optIndex, text) => {
    setQuiz(qz => {
      const updated = [...qz.questions];
      updated[qIndex].options[optIndex] = text;
      return { ...qz, questions: updated };
    });
  };

  const updateCorrectIndex = (qIndex, idx) => {
    setQuiz(qz => {
      const updated = [...qz.questions];
      updated[qIndex].correct_index = idx;
      return { ...qz, questions: updated };
    });
  };

  const handleChange = (field, value) => {
    setQuiz(qz => ({ ...qz, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/quizzes/${id}`, {
        title: quiz.title,
        description: quiz.description,
        is_public: quiz.is_public,
        metadata: quiz.metadata,
        questions: quiz.questions,
      });
      alert("Quiz updated!");
      navigate(`/quiz-dashboard/${id}`);
    } catch (err) {
      alert("Failed to update quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!quiz) return <p className={styles.error}>Quiz not found</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Edit Quiz</h2>

      <label className={styles.label} htmlFor="title">Title:</label>
      <input
        id="title"
        className={styles.input}
        value={quiz.title}
        onChange={e => handleChange('title', e.target.value)}
      />

      <label className={styles.label} htmlFor="description">Description:</label>
      <textarea
        id="description"
        className={styles.textarea}
        value={quiz.description}
        onChange={e => handleChange('description', e.target.value)}
      />

      <div className={styles.questionsSection}>
        <h3 className={styles.label}>Questions</h3>
        {quiz.questions.map((q, idx) => (
          <div key={idx} className={styles.questionCard}>
            <input
              className={styles.questionInput}
              value={q.question_text}
              onChange={e => updateQuestionText(idx, e.target.value)}
              placeholder={`Question ${idx + 1}`}
            />

            <div className={styles.optionsContainer}>
              {q.options.map((opt, oidx) => (
                <div key={oidx} className={styles.optionItem}>
                  <input
                    className={styles.optionInput}
                    value={opt}
                    onChange={e => updateOptionText(idx, oidx, e.target.value)}
                    placeholder={`Option ${oidx + 1}`}
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx, oidx)}
                      className={styles.removeOptionBtn}
                      title="Remove option"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(idx)}
                className={styles.addOptionBtn}
              >
                + Option
              </button>
            </div>

            <label className={styles.label} htmlFor={`correct-${idx}`}>
              Correct Option:
            </label>
            <select
              id={`correct-${idx}`}
              className={styles.select}
              value={q.correct_index}
              onChange={e => updateCorrectIndex(idx, Number(e.target.value))}
            >
              {q.options.map((_, oidx) => (
                <option key={oidx} value={oidx}>{oidx + 1}</option>
              ))}
            </select>

            {quiz.questions.length > 1 && (
              <button
                type="button"
                onClick={() => removeQuestion(idx)}
                className={styles.removeQuestionBtn}
                title="Remove question"
              >
                Remove Question
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addQuestion}
          className={styles.addQuestionBtn}
        >
          + Add Question
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={styles.saveBtn}
        type="button"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}