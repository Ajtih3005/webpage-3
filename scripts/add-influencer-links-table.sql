-- Create influencer_links table for tracking bookings from influencer links
CREATE TABLE IF NOT EXISTS influencer_links (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  influencer_name VARCHAR(255) NOT NULL,
  influencer_email VARCHAR(255),
  influencer_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);
