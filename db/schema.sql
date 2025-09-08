-- 01_create_extensions_and_schema.sql
BEGIN;

-- 1) Extensions (for UUID generation)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));

-- 3) OTPs (for email OTP auth)
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,            -- store hashed OTP (bcrypt/sha256)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  consumed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_otps_email ON otps (lower(email));
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps (expires_at);

-- 4) Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb, -- freeform (tags, difficulty, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_owner ON quizzes (owner_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_public ON quizzes (is_public);

-- 5) Questions
-- Each question stores options as JSONB array; correct_index is integer index into options (0-based)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,        -- example: ['A','B','C','D'] or [{"text":"A"},{"text":"B"}]
  correct_index INTEGER,         -- NULL allowed for surveys; otherwise 0-based index
  order_index INTEGER DEFAULT 0, -- ordering in quiz
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions (quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_order ON questions (quiz_id, order_index);

-- 6) Results / Attempts
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
  score NUMERIC(5,2) NOT NULL,      -- percentage or absolute as you prefer
  total_questions INTEGER NOT NULL,
  details JSONB NOT NULL,           -- per-question: [{question_id:..., selected_index:..., correct_index:..., correct: true}, ...]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_results_user ON results (user_id);
CREATE INDEX IF NOT EXISTS idx_results_quiz ON results (quiz_id);

COMMIT;
