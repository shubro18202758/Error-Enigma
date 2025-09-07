const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Repository content library path
const CONTENT_LIBRARY_PATH = path.join(__dirname, '../../services/shared/content_library');

/**
 * Load course metadata from repository structure
 */
async function loadCourseFromRepository(courseId) {
  try {
    const coursePath = path.join(CONTENT_LIBRARY_PATH, 'Courses', courseId, 'course_metadata.json');
    const courseData = await fs.readFile(coursePath, 'utf8');
    return JSON.parse(courseData);
  } catch (error) {
    console.warn(`Failed to load course ${courseId} from repository:`, error.message);
    return null;
  }
}

/**
 * Get all available courses from repository
 */
async function getAllCoursesFromRepository() {
  try {
    const coursesDir = path.join(CONTENT_LIBRARY_PATH, 'Courses');
    const courseDirectories = await fs.readdir(coursesDir);
    const courses = [];

    for (const courseDir of courseDirectories) {
      const courseStats = await fs.stat(path.join(coursesDir, courseDir));
      if (courseStats.isDirectory()) {
        const courseData = await loadCourseFromRepository(courseDir);
        if (courseData) {
          // Transform to unified format
          const unifiedCourse = {
            id: courseData.course_id,
            courseId: courseDir,
            title: courseData.course_name,
            description: courseData.description,
            level: courseData.difficulty,
            category: courseData.topic,
            subcategory: courseData.category,
            duration: courseData.estimated_hours,
            instructor: courseData.instructor,
            rating: Math.random() * 2 + 3, // Mock rating between 3-5
            enrolled: Math.floor(Math.random() * 3000) + 1500, // Mock enrollment
            skills: extractSkillsFromCourse(courseData),
            modules: courseData.modules.map(module => ({
              id: module.module_id,
              name: module.module_name,
              description: module.description,
              order: module.order,
              lessons: module.total_lessons,
              duration: module.total_duration_minutes,
              topics: module.lessons.map(lesson => lesson.title)
            })),
            totalModules: courseData.total_modules,
            totalLessons: courseData.modules.reduce((total, module) => total + module.total_lessons, 0),
            totalDuration: courseData.modules.reduce((total, module) => total + module.total_duration_minutes, 0),
            prerequisites: ['Basic Computer Skills'], // Default prerequisites
            learningObjectives: generateLearningObjectives(courseData),
            repositoryPath: `services/shared/content_library/Courses/${courseDir}/`,
            hasVideoContent: true,
            hasTranscripts: true,
            hasMetadata: true,
            createdAt: courseData.created_at,
            repositoryBased: true
          };
          courses.push(unifiedCourse);
        }
      }
    }

    return courses;
  } catch (error) {
    console.error('Failed to load courses from repository:', error);
    return [];
  }
}

/**
 * Extract skills from course data
 */
function extractSkillsFromCourse(courseData) {
  const skills = new Set();
  
  // Add course topic as primary skill
  skills.add(courseData.topic);
  
  // Extract skills from module and lesson titles
  courseData.modules.forEach(module => {
    // Add module-specific skills
    if (module.module_name.toLowerCase().includes('python')) skills.add('Python');
    if (module.module_name.toLowerCase().includes('javascript')) skills.add('JavaScript');
    if (module.module_name.toLowerCase().includes('react')) skills.add('React');
    if (module.module_name.toLowerCase().includes('node')) skills.add('Node.js');
    if (module.module_name.toLowerCase().includes('html')) skills.add('HTML');
    if (module.module_name.toLowerCase().includes('css')) skills.add('CSS');
    if (module.module_name.toLowerCase().includes('machine learning')) skills.add('Machine Learning');
    if (module.module_name.toLowerCase().includes('statistics')) skills.add('Statistics');
    if (module.module_name.toLowerCase().includes('data')) skills.add('Data Analysis');
    
    module.lessons.forEach(lesson => {
      if (lesson.title.toLowerCase().includes('visualization')) skills.add('Data Visualization');
      if (lesson.title.toLowerCase().includes('mongodb')) skills.add('MongoDB');
      if (lesson.title.toLowerCase().includes('authentication')) skills.add('Authentication');
    });
  });
  
  return Array.from(skills).slice(0, 6); // Limit to 6 skills
}

/**
 * Generate learning objectives from course data
 */
function generateLearningObjectives(courseData) {
  const objectives = [
    `Master ${courseData.topic} fundamentals and advanced concepts`,
    `Complete hands-on projects in ${courseData.topic}`,
    'Apply learned skills to real-world scenarios',
    'Build a portfolio of projects'
  ];
  
  // Add course-specific objectives
  if (courseData.topic === 'Data Science') {
    objectives.push(
      'Master Python programming for data science',
      'Understand statistical analysis and machine learning',
      'Create compelling data visualizations'
    );
  } else if (courseData.topic === 'Web Development') {
    objectives.push(
      'Build responsive, modern websites',
      'Master full-stack web development',
      'Deploy applications to production'
    );
  }
  
  return objectives.slice(0, 5); // Limit to 5 objectives
}

// Routes

/**
 * GET /api/courses - Get all courses from repository
 */
router.get('/', async (req, res) => {
  try {
    console.log('📚 Loading courses from repository...');
    const courses = await getAllCoursesFromRepository();
    
    res.json({
      success: true,
      message: 'Courses loaded from repository',
      courses: courses,
      totalCourses: courses.length,
      sourcedFromRepository: true,
      repositoryPath: CONTENT_LIBRARY_PATH
    });
  } catch (error) {
    console.error('Error loading courses:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to load courses from repository'
    });
  }
});

/**
 * GET /api/courses/:id - Get specific course from repository
 */
router.get('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log(`📖 Loading course ${courseId} from repository...`);
    
    const courseData = await loadCourseFromRepository(courseId);
    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: `Course ${courseId} not found in repository`
      });
    }

    // Transform to unified format (same as above)
    const unifiedCourse = {
      id: courseData.course_id,
      courseId: courseId,
      title: courseData.course_name,
      description: courseData.description,
      level: courseData.difficulty,
      category: courseData.topic,
      subcategory: courseData.category,
      duration: courseData.estimated_hours,
      instructor: courseData.instructor,
      modules: courseData.modules,
      totalModules: courseData.total_modules,
      repositoryPath: `services/shared/content_library/Courses/${courseId}/`,
      repositoryBased: true,
      fullMetadata: courseData
    };

    res.json({
      success: true,
      course: unifiedCourse,
      sourcedFromRepository: true
    });
  } catch (error) {
    console.error(`Error loading course ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: `Failed to load course ${req.params.id} from repository`
    });
  }
});

/**
 * GET /api/content-library/courses - Alias for repository-based course loading
 */
router.get('/content-library/courses', async (req, res) => {
  // Redirect to main courses endpoint
  return router.handle({ ...req, url: '/api/courses' }, res);
});

/**
 * GET /api/courses/:courseId/modules/:moduleId - Get specific module
 */
router.get('/:courseId/modules/:moduleId', async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    console.log(`📋 Loading module ${moduleId} from course ${courseId}...`);
    
    const courseData = await loadCourseFromRepository(courseId);
    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: `Course ${courseId} not found in repository`
      });
    }

    const module = courseData.modules.find(m => m.module_id === moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: `Module ${moduleId} not found in course ${courseId}`
      });
    }

    res.json({
      success: true,
      module: module,
      sourcedFromRepository: true,
      repositoryPath: `services/shared/content_library/Courses/${courseId}/Module_${module.order.toString().padStart(2, '0')}_${module.module_name.toLowerCase().replace(/\s+/g, '_')}/`
    });
  } catch (error) {
    console.error(`Error loading module ${req.params.moduleId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
