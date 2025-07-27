-- Create live sessions table
CREATE TABLE IF NOT EXISTS live_sessions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  instructor_id INTEGER REFERENCES users(id),
  session_type VARCHAR(50) DEFAULT 'synchronized',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL
);

-- Create session participants table
CREATE TABLE IF NOT EXISTS session_participants (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES live_sessions(id),
  user_id INTEGER REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'student',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  UNIQUE(session_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_sessions_course_id ON live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);

-- Add session_mode column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS session_mode VARCHAR(20) DEFAULT 'individual';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS allow_chat BOOLEAN DEFAULT false;
