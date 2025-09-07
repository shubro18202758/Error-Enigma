const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Authentication
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  photoURL: { type: String },
  
  // Learning Profile
  learningProfile: {
    preferredDifficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    learningStyle: { type: String, enum: ['visual', 'auditory', 'kinesthetic', 'reading'], default: 'visual' },
    timePreference: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], default: 'evening' },
    sessionDuration: { type: Number, default: 15 }, // minutes
    goals: [{ type: String }],
    interests: [{ type: String }]
  },
  
  // Competency Profile
  competencies: [{
    subject: { type: String, required: true },
    level: { type: Number, min: 0, max: 1, default: 0 }, // 0-1 scale
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    lastAssessed: { type: Date, default: Date.now },
    skillAreas: [{
      area: String,
      proficiency: { type: Number, min: 0, max: 1 }
    }]
  }],
  
  // Engagement Analytics
  engagementMetrics: {
    totalStudyTime: { type: Number, default: 0 }, // minutes
    sessionsCompleted: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    averageSessionLength: { type: Number, default: 0 },
    fatigueScore: { type: Number, min: 0, max: 1, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },
    engagementTrend: { type: String, enum: ['improving', 'stable', 'declining'], default: 'stable' }
  },
  
  // Learning Path
  currentLearningPath: {
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath' },
    currentModule: { type: Number, default: 0 },
    progress: { type: Number, min: 0, max: 1, default: 0 },
    estimatedCompletion: { type: Date },
    milestones: [{
      title: String,
      completed: { type: Boolean, default: false },
      completedAt: Date,
      target: Date
    }]
  },
  
  // Gamification
  gamification: {
    totalPoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{
      badgeId: String,
      earnedAt: { type: Date, default: Date.now },
      category: String
    }],
    achievements: [{
      achievementId: String,
      unlockedAt: { type: Date, default: Date.now },
      description: String
    }],
    rank: { type: Number, default: 0 },
    leaderboardOptIn: { type: Boolean, default: true }
  },
  
  // Social Features
  social: {
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    studyGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudyGroup' }],
    publicProfile: { type: Boolean, default: false },
    mentorshipRole: { type: String, enum: ['none', 'mentor', 'mentee'], default: 'none' }
  },
  
  // AI Interaction History
  aiInteractions: [{
    timestamp: { type: Date, default: Date.now },
    query: String,
    response: String,
    context: mongoose.Schema.Types.Mixed,
    satisfaction: { type: Number, min: 1, max: 5 }
  }],
  
  // Spaced Repetition Data
  spacedRepetition: {
    cards: [{
      cardId: String,
      subject: String,
      difficulty: { type: Number, min: 1, max: 5, default: 3 },
      interval: { type: Number, default: 1 }, // days
      easeFactor: { type: Number, default: 2.5 },
      repetitions: { type: Number, default: 0 },
      nextReview: { type: Date, default: Date.now },
      lastReviewed: { type: Date },
      correctStreak: { type: Number, default: 0 }
    }]
  },
  
  // Proctoring Data
  proctoringProfile: {
    baselineBehavior: {
      typingPattern: mongoose.Schema.Types.Mixed,
      mouseMovement: mongoose.Schema.Types.Mixed,
      faceProfile: mongoose.Schema.Types.Mixed
    },
    violations: [{
      type: String,
      timestamp: Date,
      severity: { type: String, enum: ['low', 'medium', 'high'] },
      description: String
    }],
    trustScore: { type: Number, min: 0, max: 1, default: 1 }
  },
  
  // Settings & Preferences
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      studyReminders: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true }
    },
    privacy: {
      shareProgress: { type: Boolean, default: false },
      allowFriendRequests: { type: Boolean, default: true },
      showOnLeaderboard: { type: Boolean, default: true }
    },
    accessibility: {
      fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
      highContrast: { type: Boolean, default: false },
      screenReader: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ uid: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'gamification.totalPoints': -1 });
userSchema.index({ 'engagementMetrics.lastActiveDate': -1 });

// Virtual fields
userSchema.virtual('currentLevel').get(function() {
  return Math.floor(this.gamification.totalPoints / 1000) + 1;
});

userSchema.virtual('nextLevelPoints').get(function() {
  const currentLevel = this.currentLevel;
  return (currentLevel * 1000) - this.gamification.totalPoints;
});

// Methods
userSchema.methods.updateEngagement = function(sessionData) {
  const metrics = this.engagementMetrics;
  metrics.totalStudyTime += sessionData.duration;
  metrics.sessionsCompleted += 1;
  metrics.averageSessionLength = metrics.totalStudyTime / metrics.sessionsCompleted;
  metrics.lastActiveDate = new Date();
  
  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (this.engagementMetrics.lastActiveDate >= yesterday) {
    metrics.currentStreak += 1;
    if (metrics.currentStreak > metrics.longestStreak) {
      metrics.longestStreak = metrics.currentStreak;
    }
  } else {
    metrics.currentStreak = 1;
  }
  
  return this.save();
};

userSchema.methods.addPoints = function(points, category = 'general') {
  this.gamification.totalPoints += points;
  this.gamification.level = Math.floor(this.gamification.totalPoints / 1000) + 1;
  return this.save();
};

userSchema.methods.updateCompetency = function(subject, newLevel, confidence = null) {
  let competency = this.competencies.find(c => c.subject === subject);
  
  if (!competency) {
    competency = {
      subject: subject,
      level: newLevel,
      confidence: confidence || newLevel,
      lastAssessed: new Date(),
      skillAreas: []
    };
    this.competencies.push(competency);
  } else {
    competency.level = newLevel;
    if (confidence !== null) competency.confidence = confidence;
    competency.lastAssessed = new Date();
  }
  
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
