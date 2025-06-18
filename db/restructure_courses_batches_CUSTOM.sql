-- 🚨 CUSTOM MIGRATION FOR YOUR DATABASE STRUCTURE
-- ⚠️ BACKUP YOUR DATA FIRST: CREATE TABLE courses_backup AS SELECT * FROM courses;

-- Step 1: Create the new course_batches table
CREATE TABLE IF NOT EXISTS course_batches (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  batch_number VARCHAR(10),
  custom_batch_time VARCHAR(100),
  is_predefined_batch BOOLEAN DEFAULT true,
  subscription_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  CONSTRAINT fk_course_batches_course 
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_course_batches_subscription 
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_batches_course_id ON course_batches(course_id);
CREATE INDEX IF NOT EXISTS idx_course_batches_subscription_id ON course_batches(subscription_id);
CREATE INDEX IF NOT EXISTS idx_course_batches_batch_number ON course_batches(batch_number);

-- Step 3: Migrate existing data from courses to course_batches
INSERT INTO course_batches (
  course_id, 
  batch_number, 
  custom_batch_time, 
  is_predefined_batch, 
  subscription_id
)
SELECT 
  id as course_id,
  batch_number,
  custom_batch_time,
  COALESCE(is_predefined_batch, true),
  subscription_id
FROM courses
WHERE batch_number IS NOT NULL OR custom_batch_time IS NOT NULL;

-- Step 4: Handle duplicate courses (same title, date, language)
-- First, update course_batches to point to the "master" course record
WITH course_groups AS (
  SELECT 
    title,
    scheduled_date,
    language,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY id) as all_ids
  FROM courses 
  GROUP BY title, scheduled_date, language
  HAVING COUNT(*) > 1
),
courses_to_update AS (
  SELECT 
    keep_id,
    UNNEST(all_ids[2:]) as duplicate_id
  FROM course_groups
)
UPDATE course_batches 
SET course_id = courses_to_update.keep_id
FROM courses_to_update
WHERE course_batches.course_id = courses_to_update.duplicate_id;

-- Step 5: Update user_courses table to reference the master course
WITH course_groups AS (
  SELECT 
    title,
    scheduled_date,
    language,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY id) as all_ids
  FROM courses 
  GROUP BY title, scheduled_date, language
  HAVING COUNT(*) > 1
),
courses_to_update AS (
  SELECT 
    keep_id,
    UNNEST(all_ids[2:]) as duplicate_id
  FROM course_groups
)
UPDATE user_courses 
SET course_id = courses_to_update.keep_id
FROM courses_to_update
WHERE user_courses.course_id = courses_to_update.duplicate_id;

-- Step 6: Update attendance table to reference the master course
WITH course_groups AS (
  SELECT 
    title,
    scheduled_date,
    language,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY id) as all_ids
  FROM courses 
  GROUP BY title, scheduled_date, language
  HAVING COUNT(*) > 1
),
courses_to_update AS (
  SELECT 
    keep_id,
    UNNEST(all_ids[2:]) as duplicate_id
  FROM course_groups
)
UPDATE attendance 
SET course_id = courses_to_update.keep_id
FROM courses_to_update
WHERE attendance.course_id = courses_to_update.duplicate_id;

-- Step 7: Update video_analytics table to reference the master course
WITH course_groups AS (
  SELECT 
    title,
    scheduled_date,
    language,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY id) as all_ids
  FROM courses 
  GROUP BY title, scheduled_date, language
  HAVING COUNT(*) > 1
),
courses_to_update AS (
  SELECT 
    keep_id,
    UNNEST(all_ids[2:]) as duplicate_id
  FROM course_groups
)
UPDATE video_analytics 
SET course_id = courses_to_update.keep_id
FROM courses_to_update
WHERE video_analytics.course_id = courses_to_update.duplicate_id;

-- Step 8: Update instructor_course_assignments table
WITH course_groups AS (
  SELECT 
    title,
    scheduled_date,
    language,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY id) as all_ids
  FROM courses 
  GROUP BY title, scheduled_date, language
  HAVING COUNT(*) > 1
),
courses_to_update AS (
  SELECT 
    keep_id,
    UNNEST(all_ids[2:]) as duplicate_id
  FROM course_groups
)
UPDATE instructor_course_assignments 
SET course_id = courses_to_update.keep_id
FROM courses_to_update
WHERE instructor_course_assignments.course_id = courses_to_update.duplicate_id;

-- Step 9: Update instructor_sessions table
WITH course_groups AS (
  SELECT 
    title,
    scheduled_date,
    language,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY id) as all_ids
  FROM courses 
  GROUP BY title, scheduled_date, language
  HAVING COUNT(*) > 1
),
courses_to_update AS (
  SELECT 
    keep_id,
    UNNEST(all_ids[2:]) as duplicate_id
  FROM course_groups
)
UPDATE instructor_sessions 
SET course_id = courses_to_update.keep_id
FROM courses_to_update
WHERE instructor_sessions.course_id = courses_to_update.duplicate_id;

-- Step 10: Update notifications table
WITH course_groups AS (
  SELECT 
    title,
    scheduled_date,
    language,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY id) as all_ids
  FROM courses 
  GROUP BY title, scheduled_date, language
  HAVING COUNT(*) > 1
),
courses_to_update AS (
  SELECT 
    keep_id,
    UNNEST(all_ids[2:]) as duplicate_id
  FROM course_groups
)
UPDATE notifications 
SET course_id = courses_to_update.keep_id
FROM courses_to_update
WHERE notifications.course_id = courses_to_update.duplicate_id;

-- Step 11: Delete duplicate course records
WITH course_groups AS (
  SELECT 
    title,
    scheduled_date,
    language,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY id) as all_ids
  FROM courses 
  GROUP BY title, scheduled_date, language
  HAVING COUNT(*) > 1
)
DELETE FROM courses 
WHERE id IN (
  SELECT UNNEST(all_ids[2:]) 
  FROM course_groups
);

-- Step 12: Clean up the courses table structure
ALTER TABLE courses 
DROP COLUMN IF EXISTS batch_number,
DROP COLUMN IF EXISTS custom_batch_time,
DROP COLUMN IF EXISTS is_predefined_batch,
DROP COLUMN IF EXISTS subscription_id;

-- Step 13: Add indexes to courses table for better performance
CREATE INDEX IF NOT EXISTS idx_courses_scheduled_date ON courses(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_courses_language ON courses(language);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);

-- Step 14: Create a helpful view for easy querying
CREATE OR REPLACE VIEW course_batches_view AS
SELECT 
  c.id as course_id,
  c.title,
  c.description,
  c.youtube_link,
  c.scheduled_date,
  c.language,
  c.scheduling_type,
  c.subscription_day,
  c.subscription_week,
  c.instructor_id,
  c.created_at as course_created_at,
  
  cb.id as batch_id,
  cb.batch_number,
  cb.custom_batch_time,
  cb.is_predefined_batch,
  cb.subscription_id,
  cb.created_at as batch_created_at,
  
  s.name as subscription_name,
  s.price as subscription_price
FROM courses c
LEFT JOIN course_batches cb ON c.id = cb.course_id
LEFT JOIN subscriptions s ON cb.subscription_id = s.id
ORDER BY c.scheduled_date DESC, c.title, cb.batch_number;

-- Step 15: Add batch_id column to user_courses for future use
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS batch_id INTEGER;
ALTER TABLE user_courses 
ADD CONSTRAINT fk_user_courses_batch 
FOREIGN KEY (batch_id) REFERENCES course_batches(id) ON DELETE SET NULL;

-- Step 16: Create index for the new batch_id column
CREATE INDEX IF NOT EXISTS idx_user_courses_batch_id ON user_courses(batch_id);

-- Step 17: Create a function to get batch label (for UI display)
CREATE OR REPLACE FUNCTION get_batch_label(batch_number VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  CASE batch_number
    WHEN '1' THEN RETURN 'Morning Batch 1 (5:30-6:30)';
    WHEN '2' THEN RETURN 'Morning Batch 2 (6:40-7:40)';
    WHEN '3' THEN RETURN 'Morning Batch 3 (7:50-8:50)';
    WHEN '4' THEN RETURN 'Evening Batch 4 (5:30-6:30)';
    WHEN '5' THEN RETURN 'Evening Batch 5 (6:40-7:40)';
    WHEN '6' THEN RETURN 'Evening Batch 6 (7:50-8:50)';
    ELSE RETURN 'Custom Batch';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Step 18: Create summary view for admin dashboard
CREATE OR REPLACE VIEW course_summary AS
SELECT 
  c.id,
  c.title,
  c.scheduled_date,
  c.language,
  COUNT(cb.id) as total_batches,
  COUNT(CASE WHEN cb.subscription_id IS NOT NULL THEN 1 END) as paid_batches,
  COUNT(CASE WHEN cb.subscription_id IS NULL THEN 1 END) as free_batches,
  STRING_AGG(DISTINCT s.name, ', ') as subscription_names
FROM courses c
LEFT JOIN course_batches cb ON c.id = cb.course_id
LEFT JOIN subscriptions s ON cb.subscription_id = s.id
GROUP BY c.id, c.title, c.scheduled_date, c.language
ORDER BY c.scheduled_date DESC;

-- ✅ MIGRATION COMPLETE!
-- Run this query to verify the migration worked:
-- SELECT * FROM course_summary LIMIT 10;
