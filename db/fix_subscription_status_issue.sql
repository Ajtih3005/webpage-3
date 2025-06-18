-- =====================================================
-- FIX SUBSCRIPTION STATUS ISSUE
-- =====================================================

-- Step 1: Check current subscription status inconsistencies
SELECT 
    us.id,
    us.user_id,
    us.subscription_id,
    us.is_active as "DB is_active",
    us.activation_date,
    us.total_active_days_used,
    s.duration_days,
    CASE 
        WHEN us.activation_date IS NULL THEN 'PENDING'
        WHEN us.is_active = false THEN 'PAUSED'
        WHEN us.total_active_days_used >= s.duration_days THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END as "Calculated Status"
FROM user_subscriptions us
JOIN subscriptions s ON us.subscription_id = s.id
WHERE us.user_id IN (SELECT id FROM users LIMIT 5)
ORDER BY us.created_at DESC;

-- Step 2: Fix the is_subscription_expired function
CREATE OR REPLACE FUNCTION is_subscription_expired(p_user_subscription_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_days_used INTEGER;
    v_duration_days INTEGER;
    v_is_active BOOLEAN;
    v_activation_date TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT 
        COALESCE(us.total_active_days_used, 0),
        s.duration_days,
        us.is_active,
        us.activation_date
    INTO 
        v_total_days_used,
        v_duration_days,
        v_is_active,
        v_activation_date
    FROM user_subscriptions us
    JOIN subscriptions s ON us.subscription_id = s.id
    WHERE us.id = p_user_subscription_id;
    
    -- If no activation date, it's pending (not expired)
    IF v_activation_date IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- If admin deactivated, it's paused (not expired)
    IF v_is_active = FALSE THEN
        RETURN FALSE;
    END IF;
    
    -- Check if days used >= duration
    RETURN v_total_days_used >= v_duration_days;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a unified subscription status function
CREATE OR REPLACE FUNCTION get_subscription_status(p_user_subscription_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    v_total_days_used INTEGER;
    v_duration_days INTEGER;
    v_is_active BOOLEAN;
    v_activation_date TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT 
        COALESCE(us.total_active_days_used, 0),
        s.duration_days,
        us.is_active,
        us.activation_date
    INTO 
        v_total_days_used,
        v_duration_days,
        v_is_active,
        v_activation_date
    FROM user_subscriptions us
    JOIN subscriptions s ON us.subscription_id = s.id
    WHERE us.id = p_user_subscription_id;
    
    -- Check status in priority order
    IF v_activation_date IS NULL THEN
        RETURN 'PENDING';
    ELSIF v_total_days_used >= v_duration_days THEN
        RETURN 'EXPIRED';
    ELSIF v_is_active = FALSE THEN
        RETURN 'PAUSED';
    ELSE
        RETURN 'ACTIVE';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update current_subscriptions view to be more accurate
CREATE OR REPLACE VIEW current_subscriptions AS
SELECT 
    us.*,
    s.name as subscription_name,
    s.duration_days,
    s.price,
    u.name as user_name,
    u.email as user_email,
    u.phone as user_phone,
    GREATEST(0, s.duration_days - COALESCE(us.total_active_days_used, 0)) as remaining_days,
    get_subscription_status(us.id) as status_display
FROM user_subscriptions us
JOIN subscriptions s ON us.subscription_id = s.id
JOIN users u ON us.user_id = u.id
WHERE get_subscription_status(us.id) IN ('ACTIVE', 'PENDING', 'PAUSED');

-- Step 5: Update expired_subscriptions view
CREATE OR REPLACE VIEW expired_subscriptions AS
SELECT 
    us.*,
    s.name as subscription_name,
    s.duration_days,
    s.price,
    u.name as user_name,
    u.email as user_email,
    u.phone as user_phone,
    0 as remaining_days,
    'EXPIRED' as status_display
FROM user_subscriptions us
JOIN subscriptions s ON us.subscription_id = s.id
JOIN users u ON us.user_id = u.id
WHERE get_subscription_status(us.id) = 'EXPIRED';
