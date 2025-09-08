SET search_path TO quizapp, public;

-- Check users
SELECT id, email, name, created_at FROM users;

-- Check OTPs
SELECT id, email, expires_at, used_at, attempt_count FROM otps ORDER BY created_at DESC;

-- Check quizzes & questions
SELECT q.id AS quiz_id, q.title, q.is_public, u.email AS owner_email
FROM quizzes q JOIN users u ON u.id = q.owner_id;

SELECT qs.quiz_id, qs.prompt, qs.options, qs.correct_index, qs.points
FROM questions qs
ORDER BY qs.created_at;

-- Check results
SELECT r.id, r.quiz_id, r.user_id, r.score, r.total, r.created_at
FROM results r
ORDER BY r.created_at DESC;

-- View of public quizzes
SELECT * FROM v_public_quizzes;

-- Constraint test: this should FAIL (correct_index out of bounds)
-- Uncomment to test and expect an error:
-- INSERT INTO questions (quiz_id, prompt, options, correct_index)
-- SELECT id, 'Bad question', '["Only one"]'::jsonb, 1 FROM quizzes LIMIT 1;

-- Cleanup temp tables (if they still exist)
DROP TABLE IF EXISTS tmp_user;
DROP TABLE IF EXISTS tmp_quiz;
