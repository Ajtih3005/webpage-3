-- Add last_day_counted column to user_subscriptions table
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS last_day_counted DATE;

-- Add index for better performance on active subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_date 
ON user_subscriptions(is_active, activation_date) 
WHERE is_active = true AND activation_date IS NOT NULL;

-- Update existing active subscriptions to have proper last_day_counted
UPDATE user_subscriptions 
SET last_day_counted = CASE 
  WHEN activation_date IS NOT NULL AND is_active = true THEN 
    CURRENT_DATE
  ELSE last_day_counted
END
WHERE activation_date IS NOT NULL AND last_day_counted IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
AND column_name = 'last_day_counted';
