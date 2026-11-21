-- Personal tracking tables for Good Deeds, Reflection Journal, and Khatm Planner
-- Run: node server/migrations/run.js

CREATE TABLE IF NOT EXISTS good_deeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  points INTEGER DEFAULT 1,
  deed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deed_time VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reflection_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah INTEGER,
  ayah INTEGER,
  reflection TEXT NOT NULL,
  mood VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS khatm_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(20) NOT NULL,
  plan_days INTEGER NOT NULL,
  plan_label VARCHAR(50),
  current_page INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add role column to users if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
-- Add push token column to users if it doesn't exist  
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;

CREATE INDEX IF NOT EXISTS idx_good_deeds_user ON good_deeds(user_id);
CREATE INDEX IF NOT EXISTS idx_good_deeds_date ON good_deeds(user_id, deed_date);
CREATE INDEX IF NOT EXISTS idx_journal_user ON reflection_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_khatm_user ON khatm_plans(user_id);
