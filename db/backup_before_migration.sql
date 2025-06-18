-- 🛡️ BACKUP YOUR DATA BEFORE RUNNING THE MIGRATION

-- Backup courses table
CREATE TABLE courses_backup_$(date +%Y%m%d) AS 
SELECT * FROM courses;

-- Backup subscriptions table (just in case)
CREATE TABLE subscriptions_backup_$(date +%Y%m%d) AS 
SELECT * FROM subscriptions;

-- Backup user_courses table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_courses') THEN
    EXECUTE 'CREATE TABLE user_courses_backup_' || to_char(now(), 'YYYYMMDD') || ' AS SELECT * FROM user_courses';
  END IF;
END $$;

-- Verify backups were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename LIKE '%backup%'
ORDER BY tablename;
