-- QnA App Database Schema
-- SQLite database schema for persistent storage

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar_url TEXT,
  birthdate TEXT,
  location TEXT,
  timezone TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Public Questions table
CREATE TABLE IF NOT EXISTS public_questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  image_hash_id TEXT,                 -- Reference to image (nullable for backward compatibility)
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (image_hash_id) REFERENCES question_images(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_public_questions_created_by ON public_questions(created_by);
CREATE INDEX IF NOT EXISTS idx_public_questions_created_at ON public_questions(created_at);

-- Question Images table (content-addressed store)
CREATE TABLE IF NOT EXISTS question_images (
  id TEXT PRIMARY KEY,                -- hashid (e.g., "img_abc123")
  image_url TEXT NOT NULL,            -- External URL for now
  uploaded_at TEXT NOT NULL
);

-- Question Choices table
CREATE TABLE IF NOT EXISTS question_choices (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  FOREIGN KEY (question_id) REFERENCES public_questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_question_choices_question_id ON question_choices(question_id);

-- Public Answers table
CREATE TABLE IF NOT EXISTS public_answers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  choice_id TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK(visibility IN ('public', 'private')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES public_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (choice_id) REFERENCES question_choices(id) ON DELETE CASCADE,
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_public_answers_user_id ON public_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_public_answers_question_id ON public_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_public_answers_visibility ON public_answers(visibility);

-- DM Questions table
CREATE TABLE IF NOT EXISTS dm_questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK(from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_questions_from_user ON dm_questions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_dm_questions_to_user ON dm_questions(to_user_id);

-- DM Question Choices table
CREATE TABLE IF NOT EXISTS dm_question_choices (
  id TEXT PRIMARY KEY,
  dm_question_id TEXT NOT NULL,
  text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  FOREIGN KEY (dm_question_id) REFERENCES dm_questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dm_question_choices_dm_question_id ON dm_question_choices(dm_question_id);

-- DM Answers table
CREATE TABLE IF NOT EXISTS dm_answers (
  id TEXT PRIMARY KEY,
  dm_question_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  choice_id TEXT,
  text_answer TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (dm_question_id) REFERENCES dm_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (choice_id) REFERENCES dm_question_choices(id) ON DELETE SET NULL,
  UNIQUE(dm_question_id, user_id),
  CHECK((choice_id IS NOT NULL AND text_answer IS NULL) OR (choice_id IS NULL AND text_answer IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_dm_answers_dm_question_id ON dm_answers(dm_question_id);
CREATE INDEX IF NOT EXISTS idx_dm_answers_user_id ON dm_answers(user_id);
