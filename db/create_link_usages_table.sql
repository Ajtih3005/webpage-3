-- Create link_usages table if it doesn't exist
CREATE TABLE IF NOT EXISTS link_usages (
  id SERIAL PRIMARY KEY,
  link_id INTEGER NOT NULL REFERENCES generated_links(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(link_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_link_usages_link_id ON link_usages(link_id);
CREATE INDEX IF NOT EXISTS idx_link_usages_user_id ON link_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_link_usages_used_at ON link_usages(used_at);
