const { db } = require('../config/database');

class UserProgress {
  // Initialize user progress tracking
  static async initializeUser(uid, email, name) {
    const query = `
      INSERT OR REPLACE INTO user_progress (
        uid, email, name, total_points, current_streak, longest_streak,
        lessons_completed, quizzes_completed, projects_completed,
        last_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    `;
    
    return db.run(query, [uid, email, name, 0, 0, 0, 0, 0, 0]);
  }

  // Get user's complete progress
  static async getUserProgress(uid) {
    const query = `
      SELECT * FROM user_progress WHERE uid = ?
    `;
    
    const user = await db.get(query, [uid]);
    
    if (!user) {
      // Create new user if doesn't exist
      await this.initializeUser(uid, '', '');
      return await db.get(query, [uid]);
    }
    
    return user;
  }

  // Update user streak
  static async updateStreak(uid) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const user = await this.getUserProgress(uid);
    const lastActive = user.last_active ? user.last_active.split('T')[0] : null;
    
    let newStreak = user.current_streak;
    
    if (lastActive === today) {
      // Already active today, no change
      return user.current_streak;
    } else if (lastActive === yesterday) {
      // Consecutive day, increment streak
      newStreak = user.current_streak + 1;
    } else {
      // Streak broken, reset to 1
      newStreak = 1;
    }
    
    const longestStreak = Math.max(user.longest_streak, newStreak);
    
    const query = `
      UPDATE user_progress 
      SET current_streak = ?, longest_streak = ?, last_active = datetime('now')
      WHERE uid = ?
    `;
    
    await db.run(query, [newStreak, longestStreak, uid]);
    return newStreak;
  }

  // Record lesson completion
  static async completeLessson(uid, contentId, contentType, pointsEarned = 10) {
    // Check if already completed
    const existingQuery = `
      SELECT id FROM user_completions 
      WHERE uid = ? AND content_id = ? AND content_type = ?
    `;
    
    const existing = await db.get(existingQuery, [uid, contentId, contentType]);
    if (existing) {
      return { alreadyCompleted: true };
    }
    
    // Record completion
    const completionQuery = `
      INSERT INTO user_completions (uid, content_id, content_type, points_earned, completed_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `;
    
    await db.run(completionQuery, [uid, contentId, contentType, pointsEarned]);
    
    // Update user progress
    const updateField = contentType === 'quiz' ? 'quizzes_completed' : 
                       contentType === 'project' ? 'projects_completed' : 'lessons_completed';
    
    const updateQuery = `
      UPDATE user_progress 
      SET ${updateField} = ${updateField} + 1,
          total_points = total_points + ?,
          updated_at = datetime('now')
      WHERE uid = ?
    `;
    
    await db.run(updateQuery, [pointsEarned, uid]);
    
    // Update streak
    const newStreak = await this.updateStreak(uid);
    
    return {
      pointsEarned,
      newStreak,
      alreadyCompleted: false
    };
  }

  // Get user's completed content
  static async getUserCompletions(uid) {
    const query = `
      SELECT content_id, content_type, points_earned, completed_at
      FROM user_completions 
      WHERE uid = ?
      ORDER BY completed_at DESC
    `;
    
    return db.all(query, [uid]);
  }

  // Get learning analytics for user
  static async getLearningAnalytics(uid) {
    const user = await this.getUserProgress(uid);
    const completions = await this.getUserCompletions(uid);
    
    // Calculate weekly progress
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weeklyCompletions = completions.filter(c => c.completed_at > oneWeekAgo);
    
    // Calculate learning velocity (items per day)
    const totalDays = Math.max(1, Math.ceil((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)));
    const learningVelocity = (user.lessons_completed + user.quizzes_completed + user.projects_completed) / totalDays;
    
    // Calculate category distribution
    const categoryStats = {
      lessons: completions.filter(c => c.content_type === 'course').length,
      quizzes: completions.filter(c => c.content_type === 'quiz').length,
      projects: completions.filter(c => c.content_type === 'project').length,
      tutorials: completions.filter(c => c.content_type === 'tutorial').length
    };
    
    return {
      totalPoints: user.total_points,
      currentStreak: user.current_streak,
      longestStreak: user.longest_streak,
      totalCompleted: user.lessons_completed + user.quizzes_completed + user.projects_completed,
      weeklyProgress: weeklyCompletions.length,
      learningVelocity: Math.round(learningVelocity * 100) / 100,
      categoryStats,
      level: Math.floor(user.total_points / 100) + 1, // 100 points per level
      pointsToNextLevel: 100 - (user.total_points % 100),
      recentCompletions: completions.slice(0, 10)
    };
  }

  // Get leaderboard
  static async getLeaderboard(limit = 10) {
    const query = `
      SELECT uid, name, total_points, current_streak, 
             lessons_completed + quizzes_completed + projects_completed as total_completed
      FROM user_progress 
      ORDER BY total_points DESC 
      LIMIT ?
    `;
    
    return db.all(query, [limit]);
  }

  // Update user profile
  static async updateProfile(uid, updates) {
    const allowedFields = ['name', 'email', 'avatar_url', 'bio', 'learning_goals'];
    const validUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        validUpdates[key] = updates[key];
      }
    });
    
    if (Object.keys(validUpdates).length === 0) {
      return false;
    }
    
    const fields = Object.keys(validUpdates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(validUpdates);
    values.push(uid);
    
    const query = `
      UPDATE user_progress 
      SET ${fields}, updated_at = datetime('now')
      WHERE uid = ?
    `;
    
    return db.run(query, values);
  }
}

module.exports = UserProgress;
