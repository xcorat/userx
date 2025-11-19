-- QnA App D1 Migration Schema
-- Cloudflare D1 database schema for production deployment
-- This is identical to schema.sql but optimized for D1

-- Users table
CREATE TABLE IF NOT EXISTS users (
  public_key TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  birthdate TEXT,
  location TEXT,
  timezone TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- User Keypairs table
CREATE TABLE IF NOT EXISTS user_keypairs (
  public_key TEXT PRIMARY KEY,
  encrypted_private_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (public_key) REFERENCES users(public_key) ON DELETE CASCADE
);

-- Public Questions table
CREATE TABLE IF NOT EXISTS public_questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  image_hash_id TEXT,                 -- Reference to image (nullable for backward compatibility)
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(public_key) ON DELETE CASCADE,
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
  FOREIGN KEY (user_id) REFERENCES users(public_key) ON DELETE CASCADE,
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
  FOREIGN KEY (from_user_id) REFERENCES users(public_key) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(public_key) ON DELETE CASCADE,
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
  FOREIGN KEY (user_id) REFERENCES users(public_key) ON DELETE CASCADE,
  FOREIGN KEY (choice_id) REFERENCES dm_question_choices(id) ON DELETE SET NULL,
  UNIQUE(dm_question_id, user_id),
  CHECK((choice_id IS NOT NULL AND text_answer IS NULL) OR (choice_id IS NULL AND text_answer IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_dm_answers_dm_question_id ON dm_answers(dm_question_id);
CREATE INDEX IF NOT EXISTS idx_dm_answers_user_id ON dm_answers(user_id);

-- Memeball Feature Tables
CREATE TABLE IF NOT EXISTS memes (
  id TEXT PRIMARY KEY,
  content_hash TEXT NOT NULL UNIQUE,      -- Hash of image content for deduplication
  image_url TEXT NOT NULL,                 -- URL to meme image
  alt_text TEXT,                           -- Accessibility alt text
  submitted_by TEXT NOT NULL,              -- User ID who submitted
  submitted_at TEXT NOT NULL,
  width INTEGER,                           -- Image dimensions for display
  height INTEGER,
  is_animated BOOLEAN DEFAULT 0,           -- For GIFs/animated content
  frame_count INTEGER,                     -- Number of frames for animated memes
  FOREIGN KEY (submitted_by) REFERENCES users(public_key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_memes_content_hash ON memes(content_hash);
CREATE INDEX IF NOT EXISTS idx_memes_submitted_by ON memes(submitted_by);
CREATE INDEX IF NOT EXISTS idx_memes_submitted_at ON memes(submitted_at);

-- Meme User Interactions (Pick/Reject)
CREATE TABLE IF NOT EXISTS meme_interactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  meme_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK(interaction_type IN ('pick', 'reject')),
  interacted_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(public_key) ON DELETE CASCADE,
  FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE,
  UNIQUE(user_id, meme_id)
);

CREATE INDEX IF NOT EXISTS idx_meme_interactions_user_id ON meme_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_meme_interactions_meme_id ON meme_interactions(meme_id);
CREATE INDEX IF NOT EXISTS idx_meme_interactions_type ON meme_interactions(interaction_type);

-- User Relations table (friend connections)
CREATE TABLE IF NOT EXISTS user_relations (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (from_user_id) REFERENCES users(public_key) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(public_key) ON DELETE CASCADE,
  CHECK(from_user_id != to_user_id),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_relations_from_user ON user_relations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_user_relations_to_user ON user_relations(to_user_id);
CREATE INDEX IF NOT EXISTS idx_user_relations_status ON user_relations(status);

```
