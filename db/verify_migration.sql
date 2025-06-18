-- 🔍 RUN THESE QUERIES TO VERIFY THE MIGRATION WORKED

-- Check 1: Count courses before and after
SELECT 
  'Original courses' as type,
  COUNT(*) as count
FROM courses_backup
UNION ALL
SELECT 
  'New courses' as type,
  COUNT(*) as count
FROM courses
UNION ALL
SELECT 
  'Course batches' as type,
  COUNT(*) as count
FROM course_batches;

-- Check 2: Sample of the new structure
SELECT 
  c.title,
  c.scheduled_date,
  c.language,
  cb.batch_number,
  cb.custom_batch_time,
  cb.subscription_id,
  s.name as subscription_name
FROM courses c
LEFT JOIN course_batches cb ON c.id = cb.course_id
LEFT JOIN subscriptions s ON cb.subscription_id = s.id
ORDER BY c.title, cb.batch_number
LIMIT 10;

-- Check 3: Verify no orphaned records
SELECT 
  'Orphaned course_batches' as issue,
  COUNT(*) as count
FROM course_batches cb
LEFT JOIN courses c ON cb.course_id = c.id
WHERE c.id IS NULL
UNION ALL
SELECT 
  'Orphaned user_courses' as issue,
  COUNT(*) as count
FROM user_courses uc
LEFT JOIN courses c ON uc.course_id = c.id
WHERE c.id IS NULL;

-- Check 4: Summary statistics
SELECT * FROM course_summary LIMIT 5;
