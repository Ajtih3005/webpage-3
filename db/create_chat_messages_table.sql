-- Create chat_messages table for course-based chat rooms
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('student', 'instructor', 'admin')),
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'link', 'announcement')),
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_course_id ON chat_messages(course_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON chat_messages(is_pinned) WHERE is_pinned = TRUE;

-- Create RLS (Row Level Security) policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages from courses they have access to
CREATE POLICY "Users can read chat messages from their courses" ON chat_messages
    FOR SELECT USING (
        course_id IN (
            SELECT c.id 
            FROM courses c
            JOIN user_subscriptions us ON us.subscription_id = c.subscription_id
            WHERE us.user_id = auth.uid()::text
            AND us.status = 'active'
        )
    );

-- Policy: Users can insert messages to courses they have access to
CREATE POLICY "Users can send messages to their courses" ON chat_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text
        AND course_id IN (
            SELECT c.id 
            FROM courses c
            JOIN user_subscriptions us ON us.subscription_id = c.subscription_id
            WHERE us.user_id = auth.uid()::text
            AND us.status = 'active'
        )
    );

-- Policy: Only admins and instructors can update messages (for pinning)
CREATE POLICY "Admins and instructors can update messages" ON chat_messages
    FOR UPDATE USING (
        user_type IN ('admin', 'instructor')
        OR user_id = auth.uid()::text
    );

-- Policy: Only admins can delete messages
CREATE POLICY "Only admins can delete messages" ON chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_messages_updated_at();

-- Add some sample data for testing
INSERT INTO chat_messages (course_id, user_id, user_name, user_type, message, message_type) VALUES
(1, 'admin-user-id', 'Admin', 'admin', 'Welcome to Yoga Basics chat room! Feel free to ask questions during the session.', 'announcement'),
(1, 'instructor-user-id', 'Yoga Instructor', 'instructor', 'Today we will focus on basic breathing techniques. Please have your yoga mat ready.', 'text'),
(2, 'admin-user-id', 'Admin', 'admin', 'Meditation session starting soon. Please find a quiet space.', 'announcement');

-- Create view for chat room statistics
CREATE OR REPLACE VIEW chat_room_stats AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    c.batch_number,
    COUNT(cm.id) as message_count,
    COUNT(DISTINCT cm.user_id) as unique_participants,
    MAX(cm.created_at) as last_message_at,
    COUNT(CASE WHEN cm.is_pinned = TRUE THEN 1 END) as pinned_messages
FROM courses c
LEFT JOIN chat_messages cm ON c.id = cm.course_id
GROUP BY c.id, c.title, c.batch_number;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT ON chat_room_stats TO authenticated;
