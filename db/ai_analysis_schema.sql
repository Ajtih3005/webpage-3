-- Create AI analysis tables for yoga pose analysis
CREATE TABLE IF NOT EXISTS ai_analysis_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  session_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end_time TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER, -- in seconds
  activity_type VARCHAR(50) DEFAULT 'yoga', -- yoga, fitness, singing, dance, meditation
  overall_score DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_pose_analysis (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES ai_analysis_sessions(id),
  timestamp_seconds INTEGER NOT NULL, -- seconds from session start
  pose_name VARCHAR(100),
  accuracy_score DECIMAL(5, 2) DEFAULT 0, -- 0-100
  alignment_feedback TEXT,
  instructor_pose_data JSONB, -- pose landmarks from instructor video
  user_pose_data JSONB, -- pose landmarks from user camera
  comparison_data JSONB, -- detailed comparison metrics
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_session_reports (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES ai_analysis_sessions(id),
  report_data JSONB NOT NULL, -- comprehensive session analysis
  strengths TEXT[],
  improvements TEXT[],
  recommendations TEXT[],
  progress_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_course ON ai_analysis_sessions(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_ai_pose_analysis_session ON ai_pose_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_pose_analysis_timestamp ON ai_pose_analysis(session_id, timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_ai_reports_session ON ai_session_reports(session_id);

-- Function to get user's AI analysis progress
CREATE OR REPLACE FUNCTION get_user_ai_progress(user_id_param INTEGER)
RETURNS TABLE (
  total_sessions INTEGER,
  average_score DECIMAL,
  improvement_trend DECIMAL,
  favorite_activity VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_sessions,
    COALESCE(AVG(overall_score), 0)::DECIMAL as average_score,
    CASE 
      WHEN COUNT(*) > 1 THEN 
        (SELECT (last_score - first_score) 
         FROM (
           SELECT 
             FIRST_VALUE(overall_score) OVER (ORDER BY session_start_time) as first_score,
             LAST_VALUE(overall_score) OVER (ORDER BY session_start_time ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as last_score
           FROM ai_analysis_sessions 
           WHERE user_id = user_id_param
           LIMIT 1
         ) scores)
      ELSE 0
    END::DECIMAL as improvement_trend,
    COALESCE(
      (SELECT activity_type 
       FROM ai_analysis_sessions 
       WHERE user_id = user_id_param 
       GROUP BY activity_type 
       ORDER BY COUNT(*) DESC 
       LIMIT 1), 
      'yoga'
    )::VARCHAR as favorite_activity
  FROM ai_analysis_sessions
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;
