const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AdaptiveTestOrchestrator {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.contentLibraryPath = path.join(__dirname, '../content-library');
    this.testResults = new Map(); // Store test results in memory (should be in DB in production)
  }

  // Generate adaptive pre-test based on user's goals and available content
  async generateAdaptiveTest(userId, userGoals, skillLevel = 'beginner') {
    try {
      // Load available content to understand what we can teach
      const availableContent = await this.loadContentLibrary();
      
      const prompt = `
As an advanced educational AI, create a comprehensive adaptive pre-test to assess a learner's current knowledge and skills.

User Information:
- Goals: ${userGoals}
- Current Skill Level: ${skillLevel}

Available Learning Content:
${JSON.stringify(availableContent, null, 2)}

Create an adaptive test with the following structure:
1. 15-20 questions covering different topics and difficulty levels
2. Questions should be relevant to the user's goals
3. Include multiple choice, coding challenges, and scenario-based questions
4. Start with easier questions and adapt based on responses
5. Each question should have:
   - id: unique identifier
   - type: "multiple_choice", "code_challenge", "scenario", "short_answer"
   - difficulty: "beginner", "intermediate", "advanced"
   - topic: relevant topic area
   - question: the actual question
   - options: array of options (for multiple choice)
   - correctAnswer: correct answer or expected approach
   - explanation: why this is correct
   - skillsAssessed: array of skills this question evaluates
   - timeLimit: suggested time in seconds

Generate a personalized adaptive test that will help create the perfect learning roadmap.

Return as JSON object with "questions" array.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let adaptiveTest;

      try {
        // Try to extract JSON from the response
        const jsonMatch = response.text().match(/```json\n?([\s\S]*?)\n?```/) || 
                         response.text().match(/```\n?([\s\S]*?)\n?```/) ||
                         [null, response.text()];
        
        adaptiveTest = JSON.parse(jsonMatch[1] || response.text());
      } catch (parseError) {
        console.error('Failed to parse adaptive test JSON:', parseError);
        // Fallback test structure
        adaptiveTest = this.generateFallbackTest(userGoals);
      }

      // Store test for this user
      this.testResults.set(`${userId}_test`, {
        test: adaptiveTest,
        started: new Date(),
        completed: false
      });

      return {
        success: true,
        testId: `${userId}_test_${Date.now()}`,
        test: adaptiveTest,
        instructions: "This adaptive test will help us create your personalized learning roadmap. Answer questions to the best of your ability."
      };

    } catch (error) {
      console.error('Error generating adaptive test:', error);
      return {
        success: false,
        error: 'Failed to generate adaptive test',
        test: this.generateFallbackTest(userGoals)
      };
    }
  }

  // Process test answers and generate comprehensive report
  async processTestResults(userId, testId, answers) {
    try {
      const testData = this.testResults.get(`${userId}_test`);
      if (!testData) {
        throw new Error('Test not found');
      }

      // Analyze answers using AI
      const analysisPrompt = `
Analyze the following adaptive test results and provide a comprehensive learning assessment:

Test Questions and User Answers:
${JSON.stringify({ questions: testData.test.questions, answers }, null, 2)}

Provide analysis in this JSON structure:
{
  "overallScore": number (0-100),
  "skillAssessment": {
    "strengths": ["skill1", "skill2"],
    "weaknesses": ["skill3", "skill4"],
    "knowledgeGaps": ["gap1", "gap2"],
    "recommendedLevel": "beginner|intermediate|advanced"
  },
  "detailedAnalysis": {
    "topicScores": {"topic1": score, "topic2": score},
    "learningStyle": "visual|auditory|kinesthetic|mixed",
    "recommendedPace": "fast|medium|slow",
    "estimatedTimeToGoals": "weeks/months"
  },
  "personalizedInsights": [
    "insight about learning style",
    "insight about knowledge level",
    "insight about areas to focus"
  ]
}
`;

      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      let analysis;

      try {
        const jsonMatch = response.text().match(/```json\n?([\s\S]*?)\n?```/) || 
                         response.text().match(/```\n?([\s\S]*?)\n?```/) ||
                         [null, response.text()];
        
        analysis = JSON.parse(jsonMatch[1] || response.text());
      } catch (parseError) {
        console.error('Failed to parse analysis JSON:', parseError);
        analysis = this.generateFallbackAnalysis(answers);
      }

      // Mark test as completed
      this.testResults.set(`${userId}_test`, {
        ...testData,
        completed: true,
        answers,
        analysis,
        completedAt: new Date()
      });

      return {
        success: true,
        analysis,
        testCompleted: true
      };

    } catch (error) {
      console.error('Error processing test results:', error);
      return {
        success: false,
        error: 'Failed to process test results'
      };
    }
  }

  // Generate personalized learning roadmap based on test results
  async generatePersonalizedRoadmap(userId, testAnalysis, userGoals) {
    try {
      const availableContent = await this.loadContentLibrary();
      
      const roadmapPrompt = `
Create a comprehensive, personalized learning roadmap based on the adaptive test analysis.

Test Analysis:
${JSON.stringify(testAnalysis, null, 2)}

User Goals: ${userGoals}

Available Learning Resources:
${JSON.stringify(availableContent, null, 2)}

Create a detailed roadmap with this structure:
{
  "roadmapId": "unique_id",
  "title": "Personalized Learning Path for [User Goals]",
  "description": "Brief description of the learning journey",
  "estimatedDuration": "X weeks/months",
  "difficultyProgression": "beginner -> intermediate -> advanced",
  "phases": [
    {
      "phaseId": "phase_1",
      "title": "Foundation Phase",
      "description": "Build fundamental skills",
      "duration": "2-3 weeks",
      "objectives": ["objective1", "objective2"],
      "modules": [
        {
          "moduleId": "module_1",
          "title": "Module Title",
          "description": "What you'll learn",
          "estimatedTime": "4-6 hours",
          "difficulty": "beginner",
          "resources": [
            {
              "type": "video|text|quiz|project|interactive",
              "title": "Resource Title",
              "file": "filename from content library",
              "duration": "30 mins",
              "required": true
            }
          ],
          "assessments": [
            {
              "type": "quiz|project|assignment",
              "title": "Assessment Title",
              "description": "What to complete"
            }
          ]
        }
      ]
    }
  ],
  "adaptiveFeatures": {
    "personalizedRecommendations": true,
    "difficultAdjustment": true,
    "paceAdaptation": true,
    "forgettingCurveOptimization": true
  },
  "milestones": [
    {
      "id": "milestone_1",
      "title": "First Milestone",
      "description": "What you'll achieve",
      "estimatedWeek": 2,
      "rewards": ["badge", "certificate", "points"]
    }
  ]
}

Make sure to:
1. Address identified knowledge gaps first
2. Build on user's strengths
3. Include variety of learning materials (video, text, interactive)
4. Progressive difficulty increase
5. Regular assessments and projects
6. Forgetting curve optimization with spaced repetition
7. Adaptive features for personalization
`;

      const result = await this.model.generateContent(roadmapPrompt);
      const response = await result.response;
      let roadmap;

      try {
        const jsonMatch = response.text().match(/```json\n?([\s\S]*?)\n?```/) || 
                         response.text().match(/```\n?([\s\S]*?)\n?```/) ||
                         [null, response.text()];
        
        roadmap = JSON.parse(jsonMatch[1] || response.text());
      } catch (parseError) {
        console.error('Failed to parse roadmap JSON:', parseError);
        roadmap = this.generateFallbackRoadmap(userGoals, testAnalysis);
      }

      // Add time-efficient optimization
      roadmap = this.optimizeForTimeEfficiency(roadmap, testAnalysis);

      return {
        success: true,
        roadmap,
        adaptiveFeatures: {
          personalizedRecommendations: true,
          difficultyAdjustment: true,
          paceAdaptation: true,
          forgettingCurveOptimization: true,
          realTimeProgress: true
        }
      };

    } catch (error) {
      console.error('Error generating personalized roadmap:', error);
      return {
        success: false,
        error: 'Failed to generate personalized roadmap'
      };
    }
  }

  // Load and index all available content from the content library
  async loadContentLibrary() {
    try {
      const contentIndex = {
        courses: [],
        videos: [],
        documents: [],
        transcripts: [],
        interactive: []
      };

      // Check if content library exists
      try {
        await fs.access(this.contentLibraryPath);
      } catch {
        console.warn('Content library not found, creating sample structure');
        return this.getSampleContentLibrary();
      }

      const items = await fs.readdir(this.contentLibraryPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const categoryPath = path.join(this.contentLibraryPath, item.name);
          const categoryFiles = await fs.readdir(categoryPath);
          
          for (const file of categoryFiles) {
            const filePath = path.join(categoryPath, file);
            const stats = await fs.stat(filePath);
            const ext = path.extname(file).toLowerCase();
            
            const fileInfo = {
              id: `${item.name}_${file}`,
              title: this.formatTitle(file),
              file: file,
              category: item.name,
              path: filePath,
              size: stats.size,
              modified: stats.mtime,
              type: this.getContentType(ext)
            };

            // Check for transcript files (video/audio converted to text)
            if (ext === '.txt' && file.includes('transcript')) {
              contentIndex.transcripts.push(fileInfo);
            } else if (['.mp4', '.avi', '.mkv', '.webm'].includes(ext)) {
              contentIndex.videos.push(fileInfo);
              // Check for corresponding transcript
              const transcriptFile = file.replace(ext, '_transcript.txt');
              const transcriptPath = path.join(categoryPath, transcriptFile);
              try {
                await fs.access(transcriptPath);
                fileInfo.transcript = transcriptFile;
                fileInfo.hasTranscript = true;
              } catch {
                fileInfo.hasTranscript = false;
              }
            } else if (['.pdf', '.md', '.txt', '.docx'].includes(ext)) {
              contentIndex.documents.push(fileInfo);
            } else if (['.html', '.js', '.css', '.json'].includes(ext)) {
              contentIndex.interactive.push(fileInfo);
            }
          }
        }
      }

      return contentIndex;

    } catch (error) {
      console.error('Error loading content library:', error);
      return this.getSampleContentLibrary();
    }
  }

  // Optimize roadmap for time efficiency
  optimizeForTimeEfficiency(roadmap, testAnalysis) {
    // Implement forgetting curve optimization
    roadmap.forgettingCurveSchedule = this.generateSpacedRepetitionSchedule(roadmap);
    
    // Add time-efficient learning techniques
    roadmap.timeOptimizations = {
      microLearning: true,
      spacedRepetition: true,
      activeRecall: true,
      interleaving: true,
      pomodoroSuggested: true
    };
    
    // Adjust based on user's learning pace from analysis
    if (testAnalysis.detailedAnalysis?.recommendedPace === 'fast') {
      roadmap.phases.forEach(phase => {
        phase.duration = this.reduceDuration(phase.duration, 0.8);
        phase.modules.forEach(module => {
          module.estimatedTime = this.reduceDuration(module.estimatedTime, 0.8);
        });
      });
    }
    
    return roadmap;
  }

  // Generate spaced repetition schedule for optimal retention
  generateSpacedRepetitionSchedule(roadmap) {
    const schedule = [];
    let dayCounter = 0;
    
    roadmap.phases.forEach((phase, phaseIndex) => {
      phase.modules.forEach((module, moduleIndex) => {
        // Initial learning
        schedule.push({
          day: dayCounter + 1,
          type: 'initial_learning',
          content: module.title,
          moduleId: module.moduleId
        });
        
        // Spaced repetition intervals: 1 day, 3 days, 7 days, 14 days, 30 days
        const intervals = [1, 3, 7, 14, 30];
        intervals.forEach(interval => {
          schedule.push({
            day: dayCounter + 1 + interval,
            type: 'review',
            content: `Review: ${module.title}`,
            moduleId: module.moduleId,
            interval: interval
          });
        });
        
        dayCounter += Math.ceil(this.parseDuration(module.estimatedTime || '2 hours') / 24);
      });
    });
    
    return schedule.sort((a, b) => a.day - b.day);
  }

  // Helper methods
  generateFallbackTest(userGoals) {
    return {
      questions: [
        {
          id: "q1",
          type: "multiple_choice",
          difficulty: "beginner",
          topic: "programming_basics",
          question: "What is your primary programming experience?",
          options: ["None/Beginner", "Some basics", "Intermediate", "Advanced"],
          correctAnswer: "Any answer is correct - this assesses current level",
          explanation: "This helps us understand your starting point",
          skillsAssessed: ["experience_level"],
          timeLimit: 30
        },
        {
          id: "q2",
          type: "short_answer",
          difficulty: "beginner",
          topic: "learning_goals",
          question: `Based on your goals: ${userGoals}, what specific skills do you want to develop first?`,
          correctAnswer: "Personal learning priorities",
          explanation: "Helps create personalized learning path",
          skillsAssessed: ["goal_clarity", "self_assessment"],
          timeLimit: 120
        }
      ]
    };
  }

  generateFallbackAnalysis(answers) {
    return {
      overallScore: 75,
      skillAssessment: {
        strengths: ["motivation", "clear_goals"],
        weaknesses: ["technical_skills", "practical_experience"],
        knowledgeGaps: ["programming_fundamentals", "project_development"],
        recommendedLevel: "beginner"
      },
      detailedAnalysis: {
        topicScores: { "programming": 60, "theory": 70, "practical": 50 },
        learningStyle: "mixed",
        recommendedPace: "medium",
        estimatedTimeToGoals: "3-6 months"
      },
      personalizedInsights: [
        "You show strong motivation and clear learning goals",
        "Focus on building practical programming skills",
        "Recommend starting with fundamentals and building up"
      ]
    };
  }

  generateFallbackRoadmap(userGoals, testAnalysis) {
    return {
      roadmapId: `roadmap_${Date.now()}`,
      title: `Personalized Learning Path: ${userGoals}`,
      description: "A comprehensive learning journey tailored to your goals and current skill level",
      estimatedDuration: "12-16 weeks",
      difficultyProgression: "beginner -> intermediate -> advanced",
      phases: [
        {
          phaseId: "foundation",
          title: "Foundation Phase",
          description: "Build essential skills and knowledge",
          duration: "4 weeks",
          objectives: ["Master fundamental concepts", "Build confidence", "Establish learning routine"],
          modules: [
            {
              moduleId: "basics_1",
              title: "Getting Started",
              description: "Introduction to core concepts",
              estimatedTime: "6-8 hours",
              difficulty: "beginner",
              resources: [
                {
                  type: "video",
                  title: "Introduction Video",
                  duration: "30 mins",
                  required: true
                }
              ],
              assessments: [
                {
                  type: "quiz",
                  title: "Knowledge Check",
                  description: "Test your understanding"
                }
              ]
            }
          ]
        }
      ],
      adaptiveFeatures: {
        personalizedRecommendations: true,
        difficultyAdjustment: true,
        paceAdaptation: true,
        forgettingCurveOptimization: true
      },
      milestones: [
        {
          id: "first_milestone",
          title: "Foundation Complete",
          description: "Completed fundamental learning phase",
          estimatedWeek: 4,
          rewards: ["Foundation Badge", "100 Points"]
        }
      ]
    };
  }

  getSampleContentLibrary() {
    return {
      courses: [
        { id: "js_basics", title: "JavaScript Fundamentals", category: "programming", type: "course" },
        { id: "python_intro", title: "Python Introduction", category: "programming", type: "course" }
      ],
      videos: [
        { id: "js_intro_video", title: "JavaScript Introduction", category: "programming", type: "video", hasTranscript: true },
        { id: "python_basics_video", title: "Python Basics", category: "programming", type: "video", hasTranscript: true }
      ],
      documents: [
        { id: "js_guide", title: "JavaScript Guide", category: "programming", type: "document" },
        { id: "python_ref", title: "Python Reference", category: "programming", type: "document" }
      ],
      transcripts: [
        { id: "js_intro_transcript", title: "JavaScript Introduction Transcript", category: "programming", type: "transcript" }
      ],
      interactive: [
        { id: "js_playground", title: "JavaScript Playground", category: "programming", type: "interactive" }
      ]
    };
  }

  getContentType(extension) {
    const typeMap = {
      '.mp4': 'video', '.avi': 'video', '.mkv': 'video', '.webm': 'video',
      '.pdf': 'document', '.md': 'document', '.txt': 'document', '.docx': 'document',
      '.html': 'interactive', '.js': 'interactive', '.css': 'interactive', '.json': 'interactive'
    };
    return typeMap[extension] || 'unknown';
  }

  formatTitle(filename) {
    return filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[_-]/g, ' ') // Replace underscores and dashes with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
  }

  parseDuration(duration) {
    // Convert duration string to hours (simple implementation)
    const match = duration.match(/(\d+)\s*(hour|hr|h|minute|min|m)/i);
    if (!match) return 2; // Default 2 hours
    
    const [, amount, unit] = match;
    const num = parseInt(amount);
    
    if (unit.toLowerCase().startsWith('h')) return num;
    if (unit.toLowerCase().startsWith('m')) return num / 60;
    
    return 2;
  }

  reduceDuration(duration, factor) {
    const match = duration.match(/(\d+)-?(\d+)?\s*(week|day|hour|minute)/i);
    if (!match) return duration;
    
    const [full, start, end, unit] = match;
    const newStart = Math.ceil(parseInt(start) * factor);
    const newEnd = end ? Math.ceil(parseInt(end) * factor) : null;
    
    return newEnd ? `${newStart}-${newEnd} ${unit}s` : `${newStart} ${unit}s`;
  }
}

module.exports = AdaptiveTestOrchestrator;
