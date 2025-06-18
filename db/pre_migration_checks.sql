-- 🔍 RUN THESE CHECKS FIRST TO UNDERSTAND YOUR CURRENT STRUCTURE

-- Check 1: See your current courses table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;

-- Check 2: Count your current courses
SELECT 
  COUNT(*) as total_courses,
  COUNT(DISTINCT title || scheduled_date || language) as unique_courses,
  COUNT(*) - COUNT(DISTINCT title || scheduled_date || language) as duplicates_to_remove
FROM courses;

-- Check 3: See sample data
SELECT 
  id, title, scheduled_date, language, batch_number, custom_batch_time, subscription_id
FROM courses 
ORDER BY title, scheduled_date, batch_number
LIMIT 10;

-- Check 4: Check for foreign key constraints
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'courses';

-- Check 5: See if user_courses table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_courses'
);
