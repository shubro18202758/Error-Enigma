const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  
  // Path Structure
  modules: [{
    moduleId: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    estimatedDuration: { type: Number, required: true }, // minutes
    prerequisites: [String],
    learningObjectives: [String],
    
    // Content Items
    content: [{
      type: { type: String, enum: ['video', 'text', 'quiz', 'interactive', 'assessment'], required: true },
      contentId: { type: String, required: true },
      title: String,
      duration: Number, // minutes
      difficulty: { type: Number, min: 1, max: 5, default: 3 },
      isOptional: { type: Boolean, default: false },
      order: { type: Number, required: true }
    }],
    
    // Assessment
    assessment: {
      assessmentId: String,
      type: { type: String, enum: ['quiz', 'project', 'peer-review', 'adaptive'] },
      passingScore: { type: Number, default: 70 },
      maxAttempts: { type: Number, default: 3 }
    }
  }],
  
  // Adaptive Features
  adaptiveRules: [{
    condition: String, // e.g., "score < 70"
    action: String,    // e.g., "add_remedial_content"
    parameters: mongoose.Schema.Types.Mixed
  }],
  
  // Personalization
  personalizations: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customModules: [String],
    skipList: [String],
    additionalContent: [String],
    difficultyAdjustment: { type: Number, min: -2, max: 2, default: 0 }
  }],
  
  // Analytics
  analytics: {
    enrollments: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    averageCompletionTime: { type: Number, default: 0 }, // minutes
    difficultyFeedback: { type: Number, min: 1, max: 5, default: 3 }
  },
  
  // Metadata
  tags: [String],
  skills: [String], // Skills this path develops
  prerequisites: [String], // Required skills/knowledge
  estimatedTotalTime: { type: Number, required: true }, // minutes
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
  version: { type: String, default: '1.0' }
}, {
  timestamps: true
});

// Content Schema for individual learning content
const contentSchema = new mongoose.Schema({
  contentId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['video', 'text', 'quiz', 'interactive', 'flashcard'], required: true },
  
  // Content Data
  data: {
    // For videos
    url: String,
    duration: Number,
    transcript: String,
    subtitles: [{ language: String, url: String }],
    
    // For text content
    body: String,
    readingLevel: { type: Number, min: 1, max: 12 },
    
    // For quizzes
    questions: [{
      question: String,
      type: { type: String, enum: ['mcq', 'true-false', 'fill-blank', 'essay'] },
      options: [String],
      correctAnswer: mongoose.Schema.Types.Mixed,
      explanation: String,
      difficulty: { type: Number, min: 1, max: 5 },
      tags: [String]
    }],
    
    // For flashcards
    front: String,
    back: String,
    hints: [String]
  },
  
  // Adaptive Properties
  difficulty: { type: Number, min: 1, max: 5, required: true },
  bloomLevel: { type: String, enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'] },
  cognitiveLoad: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  
  // Learning Science
  spacedRepetitionData: {
    initialInterval: { type: Number, default: 1 }, // days
    easeFactor: { type: Number, default: 2.5 },
    successRate: { type: Number, min: 0, max: 1, default: 0 }
  },
  
  // Metadata
  subject: { type: String, required: true },
  topics: [String],
  learningObjectives: [String],
  estimatedTime: { type: Number, required: true }, // minutes
  
  // Quality Metrics
  analytics: {
    views: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    averageTimeSpent: { type: Number, default: 0 }, // minutes
    dropOffRate: { type: Number, min: 0, max: 1, default: 0 }
  },
  
  // Version Control
  version: { type: String, default: '1.0' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

// Assessment Schema for adaptive testing
const assessmentSchema = new mongoose.Schema({
  assessmentId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['adaptive', 'linear', 'competency'], required: true },
  subject: { type: String, required: true },
  
  // Question Pool
  questionPool: [{
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'true-false', 'numerical', 'essay'], required: true },
    options: [String],
    correctAnswer: mongoose.Schema.Types.Mixed,
    
    // IRT Parameters for adaptive testing
    difficulty: { type: Number, required: true }, // b parameter
    discrimination: { type: Number, default: 1 }, // a parameter
    guessing: { type: Number, default: 0 }, // c parameter
    
    // Competency mapping
    competencies: [String],
    bloomLevel: String,
    
    // Metadata
    tags: [String],
    timeLimit: Number, // seconds
    explanation: String,
    hints: [String]
  }],
  
  // Adaptive Rules
  adaptiveSettings: {
    startingDifficulty: { type: Number, default: 0 },
    precisionTarget: { type: Number, default: 0.3 },
    maxQuestions: { type: Number, default: 20 },
    minQuestions: { type: Number, default: 5 },
    terminationCriteria: {
      standardError: { type: Number, default: 0.3 },
      confidenceLevel: { type: Number, default: 0.95 }
    }
  },
  
  // Scoring
  scoringRules: {
    passingThreshold: { type: Number, default: 0.6 },
    scaleLow: { type: Number, default: 0 },
    scaleHigh: { type: Number, default: 100 },
    competencyThresholds: [{
      competency: String,
      threshold: Number
    }]
  },
  
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

// Study Group Schema for social learning
const studyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  subject: { type: String, required: true },
  
  // Members
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
    isActive: { type: Boolean, default: true }
  }],
  
  // Group Settings
  settings: {
    maxMembers: { type: Number, default: 10 },
    isPublic: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: true },
    allowInvites: { type: Boolean, default: true }
  },
  
  // Activities
  activities: [{
    type: { type: String, enum: ['discussion', 'study-session', 'quiz', 'challenge'] },
    title: String,
    description: String,
    scheduledAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['planned', 'active', 'completed', 'cancelled'], default: 'planned' }
  }],
  
  // Gamification
  groupScore: { type: Number, default: 0 },
  achievements: [String],
  challenges: [{
    challengeId: String,
    title: String,
    target: Number,
    progress: Number,
    deadline: Date,
    reward: String
  }],
  
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes
learningPathSchema.index({ category: 1, difficulty: 1 });
learningPathSchema.index({ 'analytics.averageRating': -1 });
contentSchema.index({ subject: 1, type: 1 });
contentSchema.index({ difficulty: 1 });
assessmentSchema.index({ subject: 1, type: 1 });
studyGroupSchema.index({ subject: 1, 'settings.isPublic': 1 });

module.exports = {
  LearningPath: mongoose.model('LearningPath', learningPathSchema),
  Content: mongoose.model('Content', contentSchema),
  Assessment: mongoose.model('Assessment', assessmentSchema),
  StudyGroup: mongoose.model('StudyGroup', studyGroupSchema)
};
