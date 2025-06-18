-- =====================================================
-- COURSES BATCH RESTRUCTURING MIGRATION
-- =====================================================
-- This script migrates from duplicate courses per batch
-- to single courses with multiple batches
-- =====================================================

BEGIN;

-- Step 1: Create backup tables
CREATE TABLE IF NOT EXISTS courses_backup AS SELECT * FROM courses;
CREATE TABLE IF NOT EXISTS user_courses_backup AS SELECT * FROM user_courses;

-- Step 2: Create new course_batches table
CREATE TABLE IF NOT EXISTS course_batches (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    batch_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(255),
    custom_batch_time VARCHAR(255),
    scheduled_date DATE NOT NULL,
    is_predefined_batch BOOLEAN DEFAULT true,
    max_participants INTEGER DEFAULT 100,
    current_participants INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique batch names per course
    UNIQUE(course_id, batch_name)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_batches_course_id ON course_batches(course_id);
CREATE INDEX IF NOT EXISTS idx_course_batches_scheduled_date ON course_batches(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_course_batches_active ON course_batches(is_active);

-- Step 4: Identify and consolidate duplicate courses
WITH course_groups AS (
    SELECT 
        title,
        description,
        youtube_link,
        subscription_id,
        language,
        instructor_id,
        MIN(id) as master_course_id,
        ARRAY_AGG(id ORDER BY created_at) as all_course_ids,
        COUNT(*) as duplicate_count
    FROM courses 
    GROUP BY title, description, youtube_link, subscription_id, language, instructor_id
),
course_mapping AS (
    SELECT 
        unnest(all_course_ids) as old_course_id,
        master_course_id as new_course_id
    FROM course_groups
)

-- Step 5: Insert consolidated course batches
INSERT INTO course_batches (
    course_id, 
    batch_name, 
    batch_number, 
    custom_batch_time, 
    scheduled_date, 
    is_predefined_batch,
    created_at
)
SELECT DISTINCT
    cm.new_course_id,
    COALESCE(
        c.batch_number,
        c.custom_batch_time,
        'Batch ' || ROW_NUMBER() OVER (PARTITION BY cm.new_course_id ORDER BY c.scheduled_date)
    ) as batch_name,
    c.batch_number,
    c.custom_batch_time,
    c.scheduled_date,
    c.is_predefined_batch,
    c.created_at
FROM courses c
JOIN course_mapping cm ON c.id = cm.old_course_id;

-- Step 6: Add batch_id column to user_courses
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES course_batches(id);

-- Step 7: Update user_courses with batch references
WITH course_mapping AS (
    SELECT 
        c.id as old_course_id,
        cb.course_id as new_course_id,
        cb.id as batch_id
    FROM courses c
    JOIN course_batches cb ON (
        (c.batch_number IS NOT NULL AND cb.batch_number = c.batch_number) OR
        (c.custom_batch_time IS NOT NULL AND cb.custom_batch_time = c.custom_batch_time) OR
        (c.batch_number IS NULL AND c.custom_batch_time IS NULL)
    )
    WHERE cb.course_id IN (
        SELECT MIN(id) 
        FROM courses c2 
        WHERE c2.title = c.title 
        AND c2.subscription_id = c.subscription_id
        GROUP BY c2.title, c2.subscription_id
    )
)
UPDATE user_courses 
SET 
    course_id = cm.new_course_id,
    batch_id = cm.batch_id
FROM course_mapping cm 
WHERE user_courses.course_id = cm.old_course_id;

-- Step 8: Update attendance table
WITH course_mapping AS (
    SELECT 
        c.id as old_course_id,
        cb.course_id as new_course_id
    FROM courses c
    JOIN course_batches cb ON cb.course_id IN (
        SELECT MIN(id) 
        FROM courses c2 
        WHERE c2.title = c.title 
        AND c2.subscription_id = c.subscription_id
        GROUP BY c2.title, c2.subscription_id
    )
)
UPDATE attendance 
SET course_id = cm.new_course_id
FROM course_mapping cm 
WHERE attendance.course_id = cm.old_course_id;

-- Step 9: Update video_analytics table
WITH course_mapping AS (
    SELECT 
        c.id as old_course_id,
        cb.course_id as new_course_id
    FROM courses c
    JOIN course_batches cb ON cb.course_id IN (
        SELECT MIN(id) 
        FROM courses c2 
        WHERE c2.title = c.title 
        AND c2.subscription_id = c.subscription_id
        GROUP BY c2.title, c2.subscription_id
    )
)
UPDATE video_analytics 
SET course_id = cm.new_course_id
FROM course_mapping cm 
WHERE video_analytics.course_id = cm.old_course_id;

-- Step 10: Update instructor_course_assignments table
WITH course_mapping AS (
    SELECT 
        c.id as old_course_id,
        cb.course_id as new_course_id
    FROM courses c
    JOIN course_batches cb ON cb.course_id IN (
        SELECT MIN(id) 
        FROM courses c2 
        WHERE c2.title = c.title 
        AND c2.subscription_id = c.subscription_id
        GROUP BY c2.title, c2.subscription_id
    )
)
UPDATE instructor_course_assignments 
SET course_id = cm.new_course_id
FROM course_mapping cm 
WHERE instructor_course_assignments.course_id = cm.old_course_id;

-- Step 11: Update instructor_sessions table
WITH course_mapping AS (
    SELECT 
        c.id as old_course_id,
        cb.course_id as new_course_id
    FROM courses c
    JOIN course_batches cb ON cb.course_id IN (
        SELECT MIN(id) 
        FROM courses c2 
        WHERE c2.title = c.title 
        AND c2.subscription_id = c.subscription_id
        GROUP BY c2.title, c2.subscription_id
    )
)
UPDATE instructor_sessions 
SET course_id = cm.new_course_id
FROM course_mapping cm 
WHERE instructor_sessions.course_id = cm.old_course_id;

-- Step 12: Update notifications table
WITH course_mapping AS (
    SELECT 
        c.id as old_course_id,
        cb.course_id as new_course_id
    FROM courses c
    JOIN course_batches cb ON cb.course_id IN (
        SELECT MIN(id) 
        FROM courses c2 
        WHERE c2.title = c.title 
        AND c2.subscription_id = c.subscription_id
        GROUP BY c2.title, c2.subscription_id
    )
)
UPDATE notifications 
SET course_id = cm.new_course_id
FROM course_mapping cm 
WHERE notifications.course_id = cm.old_course_id;

-- Step 13: Remove duplicate courses (keep only master courses)
DELETE FROM courses 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM courses_backup 
    GROUP BY title, description, youtube_link, subscription_id, language, instructor_id
);

-- Step 14: Remove old batch-related columns from courses table
ALTER TABLE courses DROP COLUMN IF EXISTS batch_number;
ALTER TABLE courses DROP COLUMN IF EXISTS custom_batch_time;
ALTER TABLE courses DROP COLUMN IF EXISTS is_predefined_batch;

-- Step 15: Update courses table to remove scheduled_date (now in batches)
ALTER TABLE courses DROP COLUMN IF EXISTS scheduled_date;

-- Step 16: Create helpful views
CREATE OR REPLACE VIEW course_batches_view AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    c.description,
    c.youtube_link,
    c.subscription_id,
    c.language,
    c.instructor_id,
    cb.id as batch_id,
    cb.batch_name,
    cb.scheduled_date,
    cb.max_participants,
    cb.current_participants,
    cb.is_active as batch_active,
    c.created_at as course_created_at,
    cb.created_at as batch_created_at
FROM courses c
LEFT JOIN course_batches cb ON c.id = cb.course_id
ORDER BY c.title, cb.scheduled_date;

-- Step 17: Create summary view for admin dashboard
CREATE OR REPLACE VIEW course_summary AS
SELECT 
    c.id,
    c.title,
    c.description,
    c.subscription_id,
    c.instructor_id,
    COUNT(cb.id) as total_batches,
    COUNT(CASE WHEN cb.is_active THEN 1 END) as active_batches,
    MIN(cb.scheduled_date) as first_batch_date,
    MAX(cb.scheduled_date) as last_batch_date,
    SUM(cb.current_participants) as total_participants
FROM courses c
LEFT JOIN course_batches cb ON c.id = cb.course_id
GROUP BY c.id, c.title, c.description, c.subscription_id, c.instructor_id
ORDER BY c.title;

-- Step 18: Create function to get batch label
CREATE OR REPLACE FUNCTION get_batch_label(batch_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    batch_name TEXT;
    scheduled_date DATE;
BEGIN
    SELECT cb.batch_name, cb.scheduled_date 
    INTO batch_name, scheduled_date
    FROM course_batches cb 
    WHERE cb.id = batch_id;
    
    IF batch_name IS NOT NULL THEN
        RETURN batch_name || ' (' || scheduled_date || ')';
    ELSE
        RETURN 'Batch ' || scheduled_date;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 19: Update participant counts
UPDATE course_batches 
SET current_participants = (
    SELECT COUNT(*) 
    FROM user_courses uc 
    WHERE uc.batch_id = course_batches.id
);

-- Step 20: Create migration log
CREATE TABLE IF NOT EXISTS migration_logs (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'success',
    details TEXT
);

INSERT INTO migration_logs (migration_name, details) 
VALUES ('courses_batch_restructuring', 'Successfully migrated courses to batch-based structure');

COMMIT;

-- Verification queries
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_courses FROM courses;
SELECT COUNT(*) as total_batches FROM course_batches;
SELECT COUNT(*) as user_courses_with_batches FROM user_courses WHERE batch_id IS NOT NULL;
