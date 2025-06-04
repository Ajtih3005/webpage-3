-- Create sample subscription detail pages

-- First, let's create the subscription_pages table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    hero_image_url TEXT,
    introduction_title VARCHAR(255),
    introduction_content TEXT,
    status VARCHAR(50) DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_page_cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_page_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES subscription_pages(id) ON DELETE CASCADE,
    card_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    icon VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_page_sections table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_page_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES subscription_pages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_page_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_page_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES subscription_pages(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample subscription pages
INSERT INTO subscription_pages (slug, title, subtitle, hero_image_url, introduction_title, introduction_content, status) VALUES
('yoga-programs', 'Yoga Programs', 'Transform your mind, body, and spirit through ancient practices', '/images/yoga-hero-bg.jpg', 'Discover Inner Peace Through Yoga', 'Our comprehensive yoga programs are designed to guide you on a transformative journey of self-discovery. Whether you''re a beginner or an experienced practitioner, our expert instructors will help you develop strength, flexibility, and mindfulness through traditional and modern yoga practices.', 'published'),

('fitness-training', 'Fitness Training', 'Build strength, endurance, and achieve your fitness goals', '/images/forest-wellness-bg.jpg', 'Achieve Your Fitness Goals', 'Our fitness training programs combine the best of traditional exercise methods with modern fitness science. From strength training to cardio workouts, our certified trainers will create personalized programs to help you reach your fitness objectives in a supportive and motivating environment.', 'published'),

('wellness-packages', 'Wellness Packages', 'Holistic approach to health and well-being', '/images/serene-forest-meditation.jpg', 'Complete Wellness Solutions', 'Our wellness packages offer a holistic approach to health, combining physical fitness, mental well-being, and spiritual growth. These comprehensive programs include yoga, meditation, nutrition guidance, and lifestyle coaching to help you achieve optimal health and happiness.', 'published');

-- Get the page IDs for adding cards and sections
DO $$
DECLARE
    yoga_page_id UUID;
    fitness_page_id UUID;
    wellness_page_id UUID;
BEGIN
    -- Get page IDs
    SELECT id INTO yoga_page_id FROM subscription_pages WHERE slug = 'yoga-programs';
    SELECT id INTO fitness_page_id FROM subscription_pages WHERE slug = 'fitness-training';
    SELECT id INTO wellness_page_id FROM subscription_pages WHERE slug = 'wellness-packages';

    -- Insert info cards for Yoga Programs
    INSERT INTO subscription_page_cards (page_id, card_type, title, value, icon, display_order) VALUES
    (yoga_page_id, 'info', 'Program Start', 'Every Monday', 'calendar', 1),
    (yoga_page_id, 'info', 'Session Duration', '60-90 minutes', 'clock', 2),
    (yoga_page_id, 'info', 'Class Size', 'Max 15 students', 'users', 3),
    (yoga_page_id, 'info', 'Experience Level', 'All levels welcome', 'star', 4);

    -- Insert content sections for Yoga Programs
    INSERT INTO subscription_page_sections (page_id, title, content, display_order) VALUES
    (yoga_page_id, 'What You''ll Learn', '<p>Our yoga programs cover a comprehensive range of practices including:</p><ul><li>Hatha Yoga fundamentals and advanced poses</li><li>Pranayama (breathing techniques) for stress relief</li><li>Meditation and mindfulness practices</li><li>Yoga philosophy and lifestyle principles</li><li>Proper alignment and injury prevention</li></ul>', 1),
    (yoga_page_id, 'Class Schedule', '<p>We offer flexible scheduling to fit your lifestyle:</p><ul><li><strong>Morning Sessions:</strong> 6:00 AM - 7:30 AM (Monday to Friday)</li><li><strong>Evening Sessions:</strong> 6:00 PM - 7:30 PM (Monday to Friday)</li><li><strong>Weekend Classes:</strong> 8:00 AM - 9:30 AM (Saturday & Sunday)</li><li><strong>Special Workshops:</strong> Monthly intensive sessions</li></ul>', 2),
    (yoga_page_id, 'Benefits & Results', '<p>Regular practice with our programs will help you achieve:</p><ul><li>Improved flexibility and strength</li><li>Better posture and body alignment</li><li>Reduced stress and anxiety</li><li>Enhanced mental clarity and focus</li><li>Better sleep quality</li><li>Increased energy levels</li></ul>', 3);

    -- Insert info cards for Fitness Training
    INSERT INTO subscription_page_cards (page_id, card_type, title, value, icon, display_order) VALUES
    (fitness_page_id, 'info', 'Training Start', 'Flexible start dates', 'calendar', 1),
    (fitness_page_id, 'info', 'Workout Duration', '45-75 minutes', 'clock', 2),
    (fitness_page_id, 'info', 'Group Size', 'Small groups (8-12)', 'users', 3),
    (fitness_page_id, 'info', 'Fitness Level', 'Beginner to advanced', 'star', 4);

    -- Insert content sections for Fitness Training
    INSERT INTO subscription_page_sections (page_id, title, content, display_order) VALUES
    (fitness_page_id, 'Training Programs', '<p>Our comprehensive fitness training includes:</p><ul><li>Strength training with free weights and machines</li><li>Cardiovascular conditioning programs</li><li>Functional movement training</li><li>High-Intensity Interval Training (HIIT)</li><li>Flexibility and mobility work</li><li>Personalized workout plans</li></ul>', 1),
    (fitness_page_id, 'Training Schedule', '<p>Choose from multiple training sessions throughout the week:</p><ul><li><strong>Early Morning:</strong> 5:30 AM - 6:45 AM</li><li><strong>Morning:</strong> 7:00 AM - 8:15 AM</li><li><strong>Evening:</strong> 6:00 PM - 7:15 PM</li><li><strong>Late Evening:</strong> 7:30 PM - 8:45 PM</li><li><strong>Weekend Sessions:</strong> 9:00 AM - 10:15 AM</li></ul>', 2),
    (fitness_page_id, 'Expected Results', '<p>With consistent training, you can expect:</p><ul><li>Increased muscle strength and endurance</li><li>Improved cardiovascular health</li><li>Better body composition (muscle gain, fat loss)</li><li>Enhanced athletic performance</li><li>Increased metabolism</li><li>Greater confidence and self-esteem</li></ul>', 3);

    -- Insert info cards for Wellness Packages
    INSERT INTO subscription_page_cards (page_id, card_type, title, value, icon, display_order) VALUES
    (wellness_page_id, 'info', 'Program Duration', '3-12 months', 'calendar', 1),
    (wellness_page_id, 'info', 'Session Types', 'Multiple modalities', 'clock', 2),
    (wellness_page_id, 'info', 'Support Level', '1-on-1 & group sessions', 'users', 3),
    (wellness_page_id, 'info', 'Approach', 'Holistic wellness', 'star', 4);

    -- Insert content sections for Wellness Packages
    INSERT INTO subscription_page_sections (page_id, title, content, display_order) VALUES
    (wellness_page_id, 'Comprehensive Approach', '<p>Our wellness packages integrate multiple disciplines:</p><ul><li>Yoga and meditation practices</li><li>Fitness and strength training</li><li>Nutrition counseling and meal planning</li><li>Stress management techniques</li><li>Lifestyle coaching and habit formation</li><li>Mental health and emotional well-being support</li></ul>', 1),
    (wellness_page_id, 'Program Structure', '<p>Each wellness package is carefully structured:</p><ul><li><strong>Initial Assessment:</strong> Comprehensive health and wellness evaluation</li><li><strong>Personalized Plan:</strong> Custom program based on your goals</li><li><strong>Regular Sessions:</strong> Weekly group and individual sessions</li><li><strong>Progress Tracking:</strong> Monthly assessments and plan adjustments</li><li><strong>Ongoing Support:</strong> 24/7 access to wellness resources</li></ul>', 2),
    (wellness_page_id, 'Transformation Goals', '<p>Our wellness packages help you achieve:</p><ul><li>Optimal physical health and vitality</li><li>Mental clarity and emotional balance</li><li>Sustainable healthy lifestyle habits</li><li>Improved work-life balance</li><li>Enhanced relationships and social connections</li><li>Greater sense of purpose and fulfillment</li></ul>', 3);

END $$;

-- Link existing subscription plans to pages (if any exist)
-- This will link all existing paid subscriptions to each page for demonstration
DO $$
DECLARE
    yoga_page_id UUID;
    fitness_page_id UUID;
    wellness_page_id UUID;
    sub_record RECORD;
    counter INTEGER := 1;
BEGIN
    -- Get page IDs
    SELECT id INTO yoga_page_id FROM subscription_pages WHERE slug = 'yoga-programs';
    SELECT id INTO fitness_page_id FROM subscription_pages WHERE slug = 'fitness-training';
    SELECT id INTO wellness_page_id FROM subscription_pages WHERE slug = 'wellness-packages';

    -- Link subscriptions to pages (distribute them across pages)
    FOR sub_record IN SELECT id FROM subscriptions WHERE price > 0 ORDER BY price LOOP
        IF counter % 3 = 1 THEN
            INSERT INTO subscription_page_plans (page_id, subscription_id, display_order) 
            VALUES (yoga_page_id, sub_record.id, counter);
        ELSIF counter % 3 = 2 THEN
            INSERT INTO subscription_page_plans (page_id, subscription_id, display_order) 
            VALUES (fitness_page_id, sub_record.id, counter);
        ELSE
            INSERT INTO subscription_page_plans (page_id, subscription_id, display_order) 
            VALUES (wellness_page_id, sub_record.id, counter);
        END IF;
        counter := counter + 1;
    END LOOP;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_pages_slug ON subscription_pages(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_pages_status ON subscription_pages(status);
CREATE INDEX IF NOT EXISTS idx_subscription_page_cards_page_id ON subscription_page_cards(page_id);
CREATE INDEX IF NOT EXISTS idx_subscription_page_sections_page_id ON subscription_page_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_subscription_page_plans_page_id ON subscription_page_plans(page_id);

SELECT 'Sample subscription pages created successfully!' as result;
