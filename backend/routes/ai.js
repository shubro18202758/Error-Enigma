const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const AdvancedAIService = require('../services/AdvancedAIService');
const AdaptiveTestOrchestrator = require('../services/AdaptiveTestOrchestrator');
const UserProgress = require('../models/UserProgress');

const router = express.Router();

// Initialize the advanced AI service and adaptive test orchestrator
let aiService = null;
let testOrchestrator = null;

const initializeAIService = async () => {
  if (!aiService) {
    aiService = new AdvancedAIService();
  }
  return aiService;
};

const initializeTestOrchestrator = async () => {
  if (!testOrchestrator) {
    testOrchestrator = new AdaptiveTestOrchestrator();
  }
  return testOrchestrator;
};

// Initialize on startup
initializeAIService().catch(console.error);
initializeTestOrchestrator().catch(console.error);

// Advanced RAG-enabled chat endpoint
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, currentPage, context } = req.body;
    
    // Ensure AI service is ready
    const ai = await initializeAIService();
    
    // Build user context
    let userContext = {
      currentPage: currentPage || 'unknown',
      isAuthenticated: !!req.user
    };
    
    if (req.user) {
      try {
        const userProgress = await UserProgress.getUserProgress(req.user.uid);
        const completions = await UserProgress.getUserCompletions(req.user.uid);
        
        userContext = {
          ...userContext,
          userProgress: {
            level: Math.floor(userProgress.total_points / 100) + 1,
            totalPoints: userProgress.total_points,
            streak: userProgress.current_streak,
            completed: userProgress.lessons_completed + userProgress.quizzes_completed + userProgress.projects_completed
          },
          recentCompletions: completions.slice(0, 5),
          learningGoals: userProgress.learning_goals || 'Not specified'
        };
      } catch (error) {
        console.error('Error fetching user context:', error);
      }
    }
    
    // Generate contextual AI response
    const aiResponse = await ai.generateContextualResponse(message, userContext);
    
    res.json({
      success: true,
      response: aiResponse.response,
      sources: aiResponse.sources || [],
      relevantContent: aiResponse.relevantContent || [],
      timestamp: new Date().toISOString(),
      hasRAG: true
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI service temporarily unavailable',
      fallbackResponse: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment."
    });
  }
});

// Get available courses with AI enhancement
router.get('/courses', optionalAuth, async (req, res) => {
  try {
    const ai = await initializeAIService();
    const courses = ai.getAllCourses();
    
    res.json({
      success: true,
      courses: courses,
      total: courses.length,
      categories: [...new Set(courses.map(c => c.category))],
      technologies: [...new Set(courses.flatMap(c => c.technologies))],
      difficulties: [...new Set(courses.map(c => c.difficulty))]
    });
  } catch (error) {
    console.error('Courses endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate personalized learning roadmap
router.post('/roadmap', authenticateToken, async (req, res) => {
  try {
    const { goals, timeline, preferences } = req.body;
    
    // Get user profile
    const userProgress = await UserProgress.getUserProgress(req.user.uid);
    const userProfile = {
      level: Math.floor(userProgress.total_points / 100) + 1,
      completedCourses: userProgress.lessons_completed,
      strengths: preferences?.strengths || [],
      interests: preferences?.interests || [],
      currentStreak: userProgress.current_streak
    };
    
    const ai = await initializeAIService();
    const roadmap = await ai.generateLearningRoadmap(userProfile, goals, timeline);
    
    res.json({
      success: true,
      roadmap: roadmap.roadmap,
      recommendedCourses: roadmap.courses?.slice(0, 8) || [],
      timeline: roadmap.timeline,
      userProfile: userProfile
    });
  } catch (error) {
    console.error('Roadmap generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze learning patterns
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userActivity = await UserProgress.getLearningAnalytics(req.user.uid);
    const completions = await UserProgress.getUserCompletions(req.user.uid);
    
    const activityData = {
      ...userActivity,
      recentCompletions: completions,
      sessionCount: completions.length,
      averageSessionTime: userActivity.averageSessionTime || 25
    };
    
    const ai = await initializeAIService();
    const analysis = await ai.analyzeLearningPatterns(activityData);
    
    res.json({
      success: true,
      analysis: analysis.analysis,
      recommendations: analysis.recommendations || [],
      rawData: activityData,
      insights: {
        learningVelocity: userActivity.learningVelocity || 0,
        consistencyScore: userActivity.weeklyProgress || 0,
        retentionRate: Math.min(95, 60 + (userActivity.weeklyProgress || 0) * 5)
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Smart content recommendation
router.post('/recommend', authenticateToken, async (req, res) => {
  try {
    const { topic, difficulty, format } = req.body;
    
    // Build query from provided fields only
    const queryParts = [];
    if (topic && topic.trim()) queryParts.push(topic.trim());
    if (difficulty && difficulty.trim()) queryParts.push(difficulty.trim());
    if (format && format.trim()) queryParts.push(format.trim());
    
    const query = queryParts.length > 0 ? queryParts.join(' ') : 'programming courses';
    
    const ai = await initializeAIService();
    const recommendations = ai.searchContent(query, 6);
    
    res.json({
      success: true,
      recommendations: recommendations,
      searchQuery: query,
      totalFound: recommendations.length
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Context-aware help (screen-aware AI)
router.post('/context-help', authenticateToken, async (req, res) => {
  try {
    const { screenContext, userQuestion, visibleContent } = req.body;
    
    const contextualQuery = `
    User is viewing: ${screenContext.page}
    Visible content: ${visibleContent?.substring(0, 500)}
    User question: ${userQuestion}
    
    Provide specific help based on what they're currently seeing.
    `;
    
    const ai = await initializeAIService();
    const response = await ai.generateContextualResponse(contextualQuery, {
      currentPage: screenContext.page,
      visibleContent: visibleContent
    });
    
    res.json({
      success: true,
      contextualHelp: response.response,
      relatedContent: response.relevantContent?.slice(0, 3) || [],
      actionSuggestions: [
        "Continue with current lesson",
        "Review previous concepts", 
        "Try practice exercises",
        "Ask follow-up questions"
      ]
    });
  } catch (error) {
    console.error('Context help error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate adaptive pre-test for skill assessment
router.post('/adaptive-test', authenticateToken, async (req, res) => {
  try {
    const { goals, skillLevel } = req.body;
    
    if (!goals) {
      return res.status(400).json({
        success: false,
        error: 'Learning goals are required for test generation'
      });
    }
    
    const orchestrator = await initializeTestOrchestrator();
    const testResult = await orchestrator.generateAdaptiveTest(
      req.user.uid, 
      goals, 
      skillLevel || 'beginner'
    );
    
    res.json({
      success: true,
      ...testResult,
      message: "Adaptive test generated successfully"
    });
  } catch (error) {
    console.error('Adaptive test generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate adaptive test'
    });
  }
});

// Enhanced Agentic AI Chat with Course Integration
router.post('/agentic-chat', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    const userProgress = await UserProgress.getUserProgress(req.user.uid);
    const ai = await initializeAIService();
    
    const userContext = {
      level: Math.floor(userProgress.total_points / 100) + 1,
      streak: userProgress.current_streak,
      currentPage: context?.currentPage || 'dashboard'
    };
    
    let response;
    try {
      response = await ai.generateContextualResponse(message, userContext);
    } catch (error) {
      console.error('AI response generation failed, using fallback:', error);
      // Fallback response
      response = {
        response: `I understand you're asking about "${message}". I'm here to help with your learning journey! 

Based on your current progress (Level ${userContext.level}, ${userContext.streak} day streak), I can assist you with:
• Finding relevant courses and tutorials
• Creating personalized learning paths
• Taking skill assessments
• Tracking your progress

What specific topic would you like to explore or learn more about?`
      };
    }
    
    const suggestions = [
      'Show me learning paths',
      'Take a skills assessment',
      'Explore courses',
      'Track my progress'
    ];
    
    const actions = [];
    
    if (message.toLowerCase().includes('course') || message.toLowerCase().includes('learn')) {
      const courses = ai.getAllCourses();
      courses.slice(0, 2).forEach(course => {
        actions.push({
          type: 'start_course',
          label: `Start ${course.title}`,
          data: course
        });
      });
    }
    
    res.json({
      success: true,
      response: response.response,
      suggestions,
      actions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Agentic chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI temporarily unavailable'
    });
  }
});

// Generate personalized roadmap from assessment results
router.post('/generate-roadmap', authenticateToken, async (req, res) => {
  try {
    const { assessmentResults, userProfile } = req.body;
    
    if (!assessmentResults) {
      return res.status(400).json({
        success: false,
        error: 'Assessment results are required'
      });
    }
    
    const ai = await initializeAIService();
    
    // Process assessment results for roadmap generation
    const roadmapData = {
      userLevel: userProfile?.level || 'beginner',
      strengths: assessmentResults.recommendations?.strengths || [],
      focusAreas: assessmentResults.recommendations?.focusAreas || [],
      completionPercentage: assessmentResults.learningPath?.completionPercentage || 0,
      moduleTitle: assessmentResults.moduleInfo?.moduleTitle || 'Programming Course'
    };
    
    // Generate AI-powered roadmap
      // Generate AI-powered roadmap with fallback
      let roadmap;
      try {
        roadmap = await ai.generateLearningRoadmap(roadmapData, {
          timeline: '4-6 weeks',
          focus: 'skill_building'
        });
      } catch (error) {
        console.error('AI roadmap generation failed, using fallback:', error);
        // Fallback roadmap structure
        roadmap = {
          roadmap: `Based on your assessment results, here's your personalized learning path:

**Priority Focus Areas:**
${roadmapData.focusAreas.slice(0, 3).map(area => `• ${area}`).join('\n')}

**Your Strengths:**
${roadmapData.strengths.slice(0, 3).map(strength => `✅ ${strength}`).join('\n')}

**Recommended Study Approach:**
1. Start with priority topics that need attention
2. Build on your existing strengths  
3. Practice consistently with coding exercises
4. Take regular progress assessments`,
          courses: [],
          timeline: '4-6 weeks'
        };
      }    res.json({
      success: true,
      roadmap: {
        studyPlan: roadmap.roadmap || 'Personalized study plan based on your assessment results',
        recommendations: roadmap.courses?.slice(0, 5) || [],
        timeline: roadmap.timeline || '4-6 weeks',
        focusAreas: roadmapData.focusAreas,
        strengths: roadmapData.strengths,
        nextSteps: [
          'Start with priority topics identified in your assessment',
          'Practice coding exercises daily',
          'Review concepts you found challenging',
          'Take regular progress assessments'
        ]
      },
      assessmentSummary: assessmentResults,
      userProfile: roadmapData
    });
    
  } catch (error) {
    console.error('Roadmap generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error generating personalized roadmap'
    });
  }
});

// Generate personalized learning content based on adaptive assessment
router.post('/personalized-learning', authenticateToken, async (req, res) => {
  try {
    const { courseId, courseTitle, assessmentResults, userGoals } = req.body;
    
    if (!courseId || !assessmentResults) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and assessment results are required'
      });
    }
    
    const orchestrator = await initializeTestOrchestrator();
    
    // Generate personalized roadmap using assessment results
    const personalizedPath = await orchestrator.generatePersonalizedRoadmap(
      req.user.uid,
      assessmentResults,
      userGoals || 'General programming skills'
    );
    
    // Generate content labeling based on skill level
    const contentLabels = await generateContentLabeling(assessmentResults, courseTitle);
    
    res.json({
      success: true,
      personalizedPath,
      contentLabels,
      assessmentSummary: assessmentResults,
      recommendations: {
        startingModules: personalizedPath.recommendedModules?.slice(0, 3) || [],
        skipModules: assessmentResults.strongAreas || [],
        focusAreas: assessmentResults.weakAreas || []
      },
      message: `Personalized learning path created for ${courseTitle}`
    });
    
  } catch (error) {
    console.error('Personalized learning error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error generating personalized content'
    });
  }
});

// Helper function to generate content labeling
async function generateContentLabeling(assessmentResults, courseTitle) {
  try {
    const labels = {
      difficulty: assessmentResults.overallLevel || 'beginner',
      recommendedOrder: [],
      skipSuggestions: [],
      priorityTopics: []
    };
    
    // Label content based on assessment performance
    if (assessmentResults.strongAreas?.length > 0) {
      labels.skipSuggestions = assessmentResults.strongAreas.map(area => ({
        topic: area,
        reason: 'Strong performance in assessment',
        confidence: 'high'
      }));
    }
    
    if (assessmentResults.weakAreas?.length > 0) {
      labels.priorityTopics = assessmentResults.weakAreas.map(area => ({
        topic: area,
        reason: 'Needs reinforcement based on assessment',
        priority: 'high'
      }));
    }
    
    return labels;
  } catch (error) {
    console.error('Content labeling error:', error);
    return { difficulty: 'beginner', recommendedOrder: [], skipSuggestions: [], priorityTopics: [] };
  }
}

module.exports = router;
