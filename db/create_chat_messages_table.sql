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
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON chat_messages(is_pinned) WHERE is_pinned = TRUE;

-- Create RLS policies for security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages for courses they have access to
CREATE POLICY "Users can read chat messages for their courses" ON chat_messages
    FOR SELECT USING (
        course_id IN (
            SELECT c.id 
            FROM courses c
            JOIN user_subscriptions us ON us.subscription_id = c.subscription_id
            WHERE us.user_id = auth.uid()::text
            AND us.is_active = TRUE
        )
    );

-- Policy: Users can insert messages for courses they have access to
CREATE POLICY "Users can send chat messages for their courses" ON chat_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text
        AND course_id IN (
            SELECT c.id 
            FROM courses c
            JOIN user_subscriptions us ON us.subscription_id = c.subscription_id
            WHERE us.user_id = auth.uid()::text
            AND us.is_active = TRUE
        )
    );

-- Policy: Only admins and instructors can update/delete messages
CREATE POLICY "Admins and instructors can modify chat messages" ON chat_messages
    FOR ALL USING (
        user_type IN ('admin', 'instructor')
        OR user_id = auth.uid()::text
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

-- Add foreign key constraint to courses table (if it doesn't exist)
-- ALTER TABLE chat_messages 
-- ADD CONSTRAINT fk_chat_messages_course_id 
-- FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
