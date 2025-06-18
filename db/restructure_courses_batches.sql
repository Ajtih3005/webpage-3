-- Step 1: Create new course_batches table
CREATE TABLE IF NOT EXISTS course_batches (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  batch_number VARCHAR(10),
  custom_batch_time VARCHAR(100),
  is_predefined_batch BOOLEAN DEFAULT true,
  subscription_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
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
  is_predefined_batch,
  subscription_id
FROM courses
WHERE batch_number IS NOT NULL OR custom_batch_time IS NOT NULL;

-- Step 4: Remove duplicate courses (keep one record per title+date+language combination)
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
-- Update course_batches to point to the kept course
UPDATE course_batches 
SET course_id = courses_to_update.keep_id
FROM courses_to_update
WHERE course_batches.course_id = courses_to_update.duplicate_id;

-- Step 5: Delete duplicate course records
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

-- Step 6: Clean up courses table - remove batch-specific columns
ALTER TABLE courses 
DROP COLUMN IF EXISTS batch_number,
DROP COLUMN IF EXISTS custom_batch_time,
DROP COLUMN IF EXISTS is_predefined_batch,
DROP COLUMN IF EXISTS subscription_id;

-- Step 7: Add any missing indexes to courses table
CREATE INDEX IF NOT EXISTS idx_courses_scheduled_date ON courses(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_courses_language ON courses(language);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);

-- Step 8: Create view for easy querying (combines course + batch info)
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

-- Step 9: Update user_courses table to reference batch_id instead of course_id
-- First add the new column
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS batch_id INTEGER;

-- Add foreign key constraint
ALTER TABLE user_courses 
ADD CONSTRAINT fk_user_courses_batch 
FOREIGN KEY (batch_id) REFERENCES course_batches(id) ON DELETE CASCADE;

-- Migrate existing user_courses data
UPDATE user_courses 
SET batch_id = (
  SELECT cb.id 
  FROM course_batches cb 
  WHERE cb.course_id = user_courses.course_id 
  LIMIT 1
)
WHERE batch_id IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_courses_batch_id ON user_courses(batch_id);
