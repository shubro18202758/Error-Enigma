const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

/**
 * Advanced RAG-enabled AI Service
 * Provides intelligent responses with access to entire content library
 */
class AdvancedAIService {
  constructor() {
    // Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      this.geminiAvailable = false;
    } else {
      console.log('🔑 Gemini API key found, length:', process.env.GEMINI_API_KEY.length);
      this.geminiAvailable = true;
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy');
    // Updated to use the current Gemini model
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.contentIndex = new Map();
    this.courseDatabase = new Map();
    this.vectorStore = new Map(); // Simplified vector store
    this.initializeRAG();
    
    // Test Gemini connection
    this.testGeminiConnection();
  }

  async testGeminiConnection() {
    if (!this.geminiAvailable) {
      console.log('⚠️ Skipping Gemini connection test - API key not available');
      return;
    }
    
    try {
      console.log('🔍 Testing Gemini API connection...');
      const result = await this.model.generateContent('Hello');
      const response = await result.response;
      const text = response.text();
      console.log('✅ Gemini API connection successful, response length:', text.length);
    } catch (error) {
      console.error('❌ Gemini API connection failed:', error.message);
      this.geminiAvailable = false;
    }
  }

  async initializeRAG() {
    console.log('🚀 Initializing Advanced RAG System...');
    await this.indexContentLibrary();
    console.log('✅ RAG System initialized with', this.contentIndex.size, 'content pieces');
  }

  async indexContentLibrary() {
    const contentLibraryPath = path.join(__dirname, '../../services/shared/content_library/Courses');
    
    try {
      const courseDirectories = await fs.readdir(contentLibraryPath);
      
      for (const courseDir of courseDirectories) {
        const coursePath = path.join(contentLibraryPath, courseDir);
        const stat = await fs.stat(coursePath);
        
        if (stat.isDirectory()) {
          await this.indexCourse(coursePath, courseDir);
        }
      }
    } catch (error) {
      console.error('Error indexing content library:', error);
    }
  }

  async indexCourse(coursePath, courseDir) {
    try {
      // Read course metadata
      const metadataPath = path.join(coursePath, 'course_metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      const courseData = JSON.parse(metadataContent);
      
      // Store course in database
      this.courseDatabase.set(courseDir, courseData);
      
      // Index course content for RAG
      const courseText = this.extractSearchableText(courseData);
      this.contentIndex.set(courseDir, {
        id: courseDir,
        title: courseData.course_name,
        content: courseText,
        metadata: courseData,
        type: 'course'
      });

      // Index modules if they exist
      if (courseData.modules) {
        courseData.modules.forEach((module, index) => {
          const moduleKey = `${courseDir}_module_${index}`;
          const moduleText = this.extractModuleText(module);
          this.contentIndex.set(moduleKey, {
            id: moduleKey,
            title: module.title,
            content: moduleText,
            metadata: { ...module, courseId: courseDir, courseName: courseData.course_name },
            type: 'module'
          });
        });
      }

      // Try to read additional content files
      await this.indexAdditionalFiles(coursePath, courseDir, courseData);
      
    } catch (error) {
      console.log(`Skipping ${courseDir}: ${error.message}`);
    }
  }

  async indexAdditionalFiles(coursePath, courseDir, courseData) {
    const possibleFiles = ['README.md', 'syllabus.md', 'overview.txt', 'content.json'];
    
    for (const fileName of possibleFiles) {
      try {
        const filePath = path.join(coursePath, fileName);
        const content = await fs.readFile(filePath, 'utf8');
        
        const fileKey = `${courseDir}_${fileName}`;
        this.contentIndex.set(fileKey, {
          id: fileKey,
          title: `${courseData.course_name} - ${fileName}`,
          content: content,
          metadata: { courseId: courseDir, fileName, courseName: courseData.course_name },
          type: 'document'
        });
      } catch (error) {
        // File doesn't exist, continue
      }
    }
  }

  extractSearchableText(courseData) {
    let text = '';
    text += courseData.course_name + ' ';
    text += courseData.description + ' ';
    text += (courseData.topic || '') + ' ';
    text += (courseData.category || '') + ' ';
    text += (courseData.learning_objectives || []).join(' ') + ' ';
    text += (courseData.prerequisites || []).join(' ') + ' ';
    text += (courseData.technologies || []).join(' ') + ' ';
    
    if (courseData.modules) {
      courseData.modules.forEach(module => {
        text += this.extractModuleText(module) + ' ';
      });
    }
    
    return text;
  }

  extractModuleText(module) {
    let text = '';
    text += module.title + ' ';
    text += (module.description || '') + ' ';
    text += (module.content || '') + ' ';
    text += (module.learning_objectives || []).join(' ') + ' ';
    
    if (module.lessons) {
      module.lessons.forEach(lesson => {
        text += lesson.title + ' ';
        text += (lesson.content || '') + ' ';
        text += (lesson.summary || '') + ' ';
      });
    }
    
    return text;
  }

  // Semantic search through content
  searchContent(query, limit = 5) {
    const results = [];
    
    // Handle undefined or null query
    if (!query || typeof query !== 'string') {
      console.log('Invalid query provided to searchContent:', query);
      return [];
    }
    
    const queryLower = query.toLowerCase();
    
    for (const [key, content] of this.contentIndex) {
      // Ensure content and title exist before calling toLowerCase()
      if (!content || !content.content || !content.title) {
        continue;
      }
      
      const contentLower = content.content.toLowerCase();
      const titleLower = content.title.toLowerCase();
      
      // Simple relevance scoring
      let score = 0;
      
      // Title matches are highly relevant
      if (titleLower.includes(queryLower)) score += 10;
      
      // Content matches
      const queryWords = queryLower.split(' ');
      queryWords.forEach(word => {
        if (word.length > 2) { // Skip small words
          if (titleLower.includes(word)) score += 5;
          if (contentLower.includes(word)) score += 2;
        }
      });
      
      // Technology/topic matches
      if (content.metadata.technologies) {
        content.metadata.technologies.forEach(tech => {
          if (tech.toLowerCase().includes(queryLower)) score += 8;
        });
      }
      
      if (score > 0) {
        results.push({ ...content, relevanceScore: score });
      }
    }
    
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  async generateContextualResponse(userQuery, userContext = {}) {
    try {
      // Validate query
      if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
        console.log('Invalid userQuery provided to generateContextualResponse:', userQuery);
        return {
          response: "I need a specific question or topic to help you with. What would you like to learn about?",
          relevantContent: [],
          sources: []
        };
      }
      
      // Search for relevant content
      const relevantContent = this.searchContent(userQuery.trim(), 3);
      
      // Build context-aware prompt
      const contextPrompt = this.buildContextPrompt(userQuery, relevantContent, userContext);
      
      // Generate response with Gemini or fallback
      let responseText;
      
      if (this.geminiAvailable) {
        try {
          const result = await this.model.generateContent(contextPrompt);
          const response = await result.response;
          responseText = response.text();
          console.log('✅ Gemini response generated successfully');
        } catch (geminiError) {
          console.error('❌ Gemini API error:', geminiError.message);
          this.geminiAvailable = false; // Disable for this session
          responseText = this.generateFallbackResponse(userQuery, relevantContent, userContext);
        }
      } else {
        responseText = this.generateFallbackResponse(userQuery, relevantContent, userContext);
      }
      
      return {
        response: responseText,
        relevantContent: relevantContent,
        sources: relevantContent.map(content => ({
          title: content.title,
          type: content.type,
          courseId: content.metadata.courseId
        }))
      };
    } catch (error) {
      console.error('🚨 AI Response Error:', error);
      
      // Generate fallback response with content library
      const relevantContent = this.searchContent(userQuery.trim(), 3);
      return {
        response: this.generateFallbackResponse(userQuery, relevantContent, userContext),
        relevantContent: relevantContent,
        sources: relevantContent.map(content => ({
          title: content.title,
          type: content.type,
          courseId: content.metadata?.courseId || 'unknown'
        })),
        error: 'AI service temporarily unavailable, using content library'
      };
    }
  }

  generateFallbackResponse(userQuery, relevantContent, userContext) {
    console.log('🔄 Generating fallback response using content library');
    
    if (relevantContent && relevantContent.length > 0) {
      const topContent = relevantContent[0];
      return `Based on our content library, I found information about "${topContent.title}":

${topContent.content.substring(0, 300)}...

**Related Topics:**
${relevantContent.slice(0, 3).map(content => `• ${content.title}`).join('\n')}

**What would you like to know more about?**
- Course details and structure
- Learning objectives and outcomes  
- Prerequisites and requirements
- Practice exercises and projects

I can help you explore any of these topics in detail!`;
    } else {
      // No relevant content found, provide general help
      const userLevel = userContext.level || 1;
      const courses = Array.from(this.courseDatabase.values()).slice(0, 3);
      
      return `I'm here to help with your learning journey! (Level ${userLevel})

**Available Courses:**
${courses.map(course => `• ${course.title} - ${course.duration}`).join('\n')}

**I can help you with:**
- Finding relevant courses and tutorials
- Explaining programming concepts
- Creating personalized learning paths
- Answering questions about course content

What specific topic would you like to explore?`;
    }
  }

  buildContextPrompt(userQuery, relevantContent, userContext) {
    let prompt = `You are an advanced AI learning assistant for an EdTech platform. You have access to a comprehensive content library and should provide helpful, accurate, and educational responses.

User Context:
- Current page: ${userContext.currentPage || 'unknown'}
- User progress: ${JSON.stringify(userContext.userProgress || {})}
- Learning goals: ${userContext.learningGoals || 'Not specified'}

User Query: "${userQuery}"

Relevant Content from Library:
`;

    relevantContent.forEach((content, index) => {
      prompt += `
${index + 1}. ${content.title} (${content.type})
   Course: ${content.metadata.courseName || content.metadata.courseId}
   Content: ${content.content ? content.content.substring(0, 300) : 'No content available'}...
   `;
    });

    prompt += `

Instructions:
1. Provide a comprehensive, helpful response to the user's query
2. Reference specific courses, modules, or content when relevant
3. Suggest concrete learning paths or next steps
4. If asked about available courses, list them with details
5. Be encouraging and supportive in your tone
6. If the query is about progress or recommendations, use the user context
7. Always aim to enhance the learning experience

Please provide your response:`;

    return prompt;
  }

  // Get all available courses
  getAllCourses() {
    const courses = [];
    for (const [key, courseData] of this.courseDatabase) {
      // Calculate total duration in minutes for microlearning format
      const totalMinutes = courseData.modules ? 
        courseData.modules.reduce((total, module) => total + (module.total_duration_minutes || 0), 0) :
        (courseData.estimated_hours * 60);
      
      courses.push({
        id: key,
        title: courseData.course_name,
        description: courseData.description,
        difficulty: courseData.difficulty,
        duration: `${totalMinutes} minutes`, // Microlearning format
        durationHours: Math.round(totalMinutes / 60 * 10) / 10, // For compatibility
        topic: courseData.topic,
        category: courseData.category,
        technologies: courseData.technologies || [],
        modules: courseData.total_modules,
        totalLessons: courseData.modules ? 
          courseData.modules.reduce((total, module) => total + (module.total_lessons || 0), 0) : 0,
        learningObjectives: courseData.learning_objectives || [],
        instructor: courseData.instructor,
        courseId: courseData.course_id
      });
    }
    return courses;
  }

  // Get detailed lesson content including transcripts
  async getLessonContent(courseId, moduleId, lessonId) {
    try {
      const coursePath = path.join(__dirname, '../../services/shared/content_library/Courses', courseId);
      const course = this.courseDatabase.get(courseId);
      
      if (!course) return null;
      
      // Find the specific lesson
      let targetLesson = null;
      let targetModule = null;
      
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          if (lesson.lesson_id === lessonId) {
            targetLesson = lesson;
            targetModule = module;
            break;
          }
        }
        if (targetLesson) break;
      }
      
      if (!targetLesson) return null;
      
      // Load transcript
      const transcriptPath = path.join(coursePath, `Module_${String(targetModule.order).padStart(2, '0')}_${targetModule.module_name.toLowerCase().replace(/\s+/g, '_')}`, targetLesson.transcript_file);
      
      let transcript = '';
      try {
        transcript = await fs.readFile(transcriptPath, 'utf8');
      } catch (error) {
        console.log('Could not load transcript:', transcriptPath);
      }
      
      return {
        lesson: targetLesson,
        module: targetModule,
        transcript: transcript,
        course: course
      };
    } catch (error) {
      console.error('Error loading lesson content:', error);
      return null;
    }
  }

  // Generate personalized learning roadmap
  async generateLearningRoadmap(userProfile, goals, timeline) {
    const availableCourses = this.getAllCourses();
    
    const roadmapPrompt = `Create a personalized learning roadmap for this user:

User Profile:
- Current Level: ${userProfile.level || 'Beginner'}
- Completed: ${userProfile.completedCourses || 0} courses
- Strengths: ${userProfile.strengths || 'None specified'}
- Interests: ${userProfile.interests || 'General'}

Learning Goals: ${goals}
Timeline: ${timeline}

Available Courses:
${availableCourses.map((course, i) => 
  `${i+1}. ${course.title} - ${course.difficulty} (${course.duration})\n   Technologies: ${course.technologies.join(', ')}\n   Objectives: ${course.learningObjectives.slice(0, 2).join(', ')}`
).join('\n\n')}

Please create a structured learning roadmap with:
1. Recommended course sequence
2. Estimated timeline for each phase
3. Key milestones and checkpoints
4. Skills that will be gained
5. Prerequisites and preparation needed
6. Tips for staying motivated

Format as a clear, actionable roadmap.`;

    try {
      const result = await this.model.generateContent(roadmapPrompt);
      const response = await result.response;
      return {
        roadmap: response.text(),
        courses: availableCourses,
        timeline: timeline
      };
    } catch (error) {
      console.error('Roadmap generation error:', error);
      return { error: 'Failed to generate roadmap' };
    }
  }

  // Analyze learning patterns and suggest optimizations
  async analyzeLearningPatterns(userActivity) {
    const analysisPrompt = `Analyze this user's learning patterns and provide insights:

Learning Activity Data:
${JSON.stringify(userActivity, null, 2)}

Please analyze and provide:
1. Learning velocity and consistency patterns
2. Strengths and areas for improvement
3. Optimal study times based on performance
4. Fatigue indicators and recommendations
5. Content type preferences
6. Suggested improvements for better retention

Provide actionable insights for optimizing their learning experience.`;

    try {
      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      return {
        analysis: response.text(),
        recommendations: this.extractRecommendations(response.text())
      };
    } catch (error) {
      console.error('Pattern analysis error:', error);
      return { error: 'Failed to analyze patterns' };
    }
  }

  extractRecommendations(analysisText) {
    // Simple extraction of actionable recommendations
    const lines = analysisText.split('\n');
    const recommendations = lines
      .filter(line => line.includes('recommend') || line.includes('suggest') || line.includes('should'))
      .slice(0, 5);
    return recommendations;
  }
}

module.exports = AdvancedAIService;
