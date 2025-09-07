-- User Progress Tracking Schema
-- This creates all necessary tables for real user progress tracking

-- Main user progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT UNIQUE NOT NULL,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    bio TEXT,
    learning_goals TEXT,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    tutorials_completed INTEGER DEFAULT 0,
    last_active DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User completions table (tracks individual content completions)
CREATE TABLE IF NOT EXISTS user_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT NOT NULL,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL, -- 'course', 'quiz', 'project', 'tutorial'
    points_earned INTEGER DEFAULT 0,
    completion_percentage REAL DEFAULT 100.0,
    time_spent INTEGER DEFAULT 0, -- in minutes
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES user_progress(uid),
    UNIQUE(uid, content_id, content_type)
);

-- User learning sessions (tracks individual study sessions)
CREATE TABLE IF NOT EXISTS learning_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT NOT NULL,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_end DATETIME,
    time_spent INTEGER DEFAULT 0, -- in minutes
    progress_made REAL DEFAULT 0, -- percentage progress in this session
    FOREIGN KEY (uid) REFERENCES user_progress(uid)
);

-- User achievements/badges
CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT NOT NULL,
    achievement_type TEXT NOT NULL, -- 'streak', 'completion', 'points', 'speed'
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    points_awarded INTEGER DEFAULT 0,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES user_progress(uid)
);

-- Content ratings and reviews
CREATE TABLE IF NOT EXISTS content_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT NOT NULL,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    helpful_votes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES user_progress(uid),
    UNIQUE(uid, content_id, content_type)
);

-- User learning preferences and AI data
CREATE TABLE IF NOT EXISTS user_learning_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT UNIQUE NOT NULL,
    learning_style TEXT, -- 'visual', 'auditory', 'kinesthetic', 'reading'
    difficulty_preference TEXT, -- 'beginner', 'intermediate', 'advanced'
    pace_preference TEXT, -- 'slow', 'moderate', 'fast'
    preferred_subjects TEXT, -- JSON array of preferred topics
    weak_areas TEXT, -- JSON array of topics needing improvement
    study_schedule TEXT, -- JSON object with preferred study times
    ai_recommendations TEXT, -- JSON object with AI-generated recommendations
    last_ai_update DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES user_progress(uid)
);

-- Clan membership and progress
CREATE TABLE IF NOT EXISTS clan_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clan_id TEXT NOT NULL,
    uid TEXT NOT NULL,
    role TEXT DEFAULT 'member', -- 'member', 'moderator', 'leader'
    points_contributed INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES user_progress(uid),
    UNIQUE(clan_id, uid)
);

-- Clan challenges and competitions
CREATE TABLE IF NOT EXISTS clan_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clan_id TEXT NOT NULL,
    challenge_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    challenge_type TEXT NOT NULL, -- 'quiz', 'project', 'discussion', 'competition'
    content_id TEXT, -- reference to actual content if applicable
    points_reward INTEGER DEFAULT 50,
    deadline DATETIME,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES user_progress(uid)
);

-- Challenge participants and progress
CREATE TABLE IF NOT EXISTS challenge_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id TEXT NOT NULL,
    uid TEXT NOT NULL,
    status TEXT DEFAULT 'joined', -- 'joined', 'in_progress', 'completed', 'abandoned'
    progress_percentage REAL DEFAULT 0,
    score INTEGER DEFAULT 0,
    submission_url TEXT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (challenge_id) REFERENCES clan_challenges(challenge_id),
    FOREIGN KEY (uid) REFERENCES user_progress(uid),
    UNIQUE(challenge_id, uid)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_completions_uid ON user_completions(uid);
CREATE INDEX IF NOT EXISTS idx_user_completions_content ON user_completions(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_uid ON learning_sessions(uid);
CREATE INDEX IF NOT EXISTS idx_user_achievements_uid ON user_achievements(uid);
CREATE INDEX IF NOT EXISTS idx_content_reviews_content ON content_reviews(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_clan_members_uid ON clan_members(uid);
CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_uid ON challenge_participants(uid);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
