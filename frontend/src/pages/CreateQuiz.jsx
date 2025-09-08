import React, { useState } from "react";
import api from "../api/axios";
import styles from "./CreateQuiz.module.css";
import Papa from "papaparse";

export default function QuizBuilder() {
  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    is_public: true,
    metadata: { tags: [] },
    questions: [],
  });

  const addQuestion = () => {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          question_text: "",
          options: ["", ""],
          correct_index: 0,
          order_index: quiz.questions.length + 1,
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    const updated = quiz.questions.filter((_, i) => i !== index);
    updated.forEach((q, i) => (q.order_index = i + 1));
    setQuiz({ ...quiz, questions: updated });
  };

  const updateQuestionText = (index, text) => {
    const updated = [...quiz.questions];
    updated[index].question_text = text;
    setQuiz({ ...quiz, questions: updated });
  };

  const addOption = (qIndex) => {
    const updated = [...quiz.questions];
    updated[qIndex].options.push("");
    setQuiz({ ...quiz, questions: updated });
  };

  const removeOption = (qIndex, oIndex) => {
    const updated = [...quiz.questions];
    updated[qIndex].options.splice(oIndex, 1);
    if (updated[qIndex].correct_index >= updated[qIndex].options.length) {
      updated[qIndex].correct_index = 0;
    }
    setQuiz({ ...quiz, questions: updated });
  };

  const updateOption = (qIndex, oIndex, text) => {
    const updated = [...quiz.questions];
    updated[qIndex].options[oIndex] = text;
    setQuiz({ ...quiz, questions: updated });
  };

  const setCorrectIndex = (qIndex, index) => {
    const updated = [...quiz.questions];
    updated[qIndex].correct_index = index;
    setQuiz({ ...quiz, questions: updated });
  };

  const handleSubmit = async () => {
    for (const q of quiz.questions) {
      if (!q.question_text.trim() || q.options.length < 2) {
        alert("Each question must have text and at least 2 options.");
        return;
      }
    }

    try {
      const res = await api.post("/quizzes", quiz);
      alert("✅ Quiz created successfully!");
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("❌ Error creating quiz");
    }
  };

  // CSV upload handler for 1-based correct_index
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const questions = results.data.map((row, idx) => {
          // Normalize keys (trim and lowercase)
          const normalized = {};
          Object.keys(row).forEach((key) => {
            normalized[key.trim().toLowerCase()] = row[key];
          });
          // Extract options
          const options = [
            normalized.option1 || "",
            normalized.option2 || "",
            normalized.option3 || "",
            normalized.option4 || "",
          ].filter((opt) => String(opt).trim() !== "");
          // Use 1-based correct_index if present
          let correct_index = 0;
          if (
            normalized.correct_index !== undefined &&
            normalized.correct_index !== null &&
            String(normalized.correct_index).trim() !== "" &&
            !isNaN(Number(normalized.correct_index))
          ) {
            let idxNum = Number(normalized.correct_index) - 1;
            if (idxNum >= 0 && idxNum < options.length) {
              correct_index = idxNum;
            }
          } else if (normalized.correct_answer) {
            // Fallback to correct_answer text matching
            const correctAns = String(normalized.correct_answer)
              .trim()
              .toLowerCase();
            const idx = options.findIndex(
              (opt) =>
                String(opt)
                  .trim()
                  .toLowerCase()
                  .localeCompare(correctAns, undefined, {
                    sensitivity: "base",
                  }) === 0
            );
            correct_index = idx !== -1 ? idx : 0;
          }
          return {
            question_text: normalized.question_text || "",
            options: options.length >= 2 ? options : ["", ""],
            correct_index,
            order_index: idx + 1,
          };
        });
        setQuiz((prev) => ({ ...prev, questions }));
      },
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create Quiz</h1>

      {/* Quiz Details */}
      <div>
        <input
          className={styles.input}
          placeholder="Quiz Title"
          value={quiz.title}
          onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
        />
        <textarea
          className={styles.textarea}
          placeholder="Description"
          value={quiz.description}
          onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
        />
      </div>

      {/* Questions */}
      {quiz.questions.map((q, qIndex) => (
        <div key={qIndex} className={styles.questionCard}>
          <div className={styles.questionHeader}>
            <input
              className={`${styles.input} ${styles.questionInput}`}
              placeholder={`Question ${qIndex + 1}`}
              value={q.question_text}
              onChange={(e) => updateQuestionText(qIndex, e.target.value)}
            />
            <button
              className={styles.removeQuestionBtn}
              onClick={() => removeQuestion(qIndex)}
              title="Remove question"
              type="button"
            >
              ❌
            </button>
          </div>

          {/* Options */}
          {q.options.map((opt, oIndex) => (
            <div key={oIndex} className={styles.optionRow}>
              <input
                className={styles.optionInput}
                placeholder={`Option ${oIndex + 1}`}
                value={opt}
                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
              />
              <input
                type="radio"
                name={`correct-${qIndex}`}
                checked={q.correct_index === oIndex}
                onChange={() => setCorrectIndex(qIndex, oIndex)}
                aria-label={`Select option ${oIndex + 1} as correct answer`}
              />
              <button
                className={styles.removeOptionBtn}
                onClick={() => removeOption(qIndex, oIndex)}
                disabled={q.options.length <= 2}
                title="Remove option"
                type="button"
              >
                🗑
              </button>
            </div>
          ))}

          <button
            className={styles.addOptionBtn}
            onClick={() => addOption(qIndex)}
            type="button"
          >
            ➕ Add Option
          </button>
        </div>
      ))}

      {/* CSV Upload */}
      <div>
        <label>Upload Questions (CSV): </label>
        <input type="file" accept=".csv" onChange={handleCSVUpload} />
        <small>
          CSV columns: question_text, option1, option2, option3, option4,
          correct_index (1-based)
        </small>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.addQuestionBtn}
          onClick={addQuestion}
          type="button"
        >
          ➕ Add Question
        </button>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          type="button"
        >
          ✅ Submit Quiz
        </button>
      </div>
    </div>
  );
}