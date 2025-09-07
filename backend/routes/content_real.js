const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const UserProgress = require('../models/UserProgress');
const router = express.Router();

// Get all real content from content library
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, difficulty, search } = req.query;
    
    // Get user completions to track progress
    const userCompletions = await UserProgress.getUserCompletions(req.user.uid);
    const completedContent = new Set(userCompletions.map(c => c.content_id));
    
    const contentLibraryPath = path.join(__dirname, '../../services/content-library');
    const allContent = [];
    
    // Content types to scan
    const contentTypes = [
      { folder: 'courses', type: 'course' },
      { folder: 'quizzes', type: 'quiz' },
      { folder: 'projects', type: 'project' },
      { folder: 'tutorials', type: 'tutorial' }
    ];

    for (const contentTypeConfig of contentTypes) {
      const typePath = path.join(contentLibraryPath, contentTypeConfig.folder);
      
      if (!await fs.access(typePath).then(() => true).catch(() => false)) {
        console.log(`Content type folder not found: ${contentTypeConfig.folder}`);
        continue;
      }

      try {
        const items = await fs.readdir(typePath, { withFileTypes: true });
        
        for (const item of items) {
          if (!item.isDirectory()) continue;
          
          const itemPath = path.join(typePath, item.name);
          
          // Try different metadata file names
          const possibleMetadataFiles = [
            'metadata.json',
            'course_metadata.json',
            `${item.name}_metadata.json`
          ];
          
          let metadata = null;
          for (const metadataFile of possibleMetadataFiles) {
            const metadataPath = path.join(itemPath, metadataFile);
            try {
              const metadataContent = await fs.readFile(metadataPath, 'utf8');
              metadata = JSON.parse(metadataContent);
              break;
            } catch (error) {
              // Try next metadata file
            }
          }
          
          if (!metadata) {
            console.log(`No metadata found for ${item.name}`);
            continue;
          }
          
          // Transform metadata to consistent format
          const contentId = metadata.id || metadata.course_id || item.name;
          const transformedContent = {
            id: contentId,
            title: metadata.title || metadata.course_name || metadata.name || item.name,
            description: metadata.description || 'No description available',
            type: contentTypeConfig.type,
            difficulty: metadata.difficulty || 'beginner',
            duration: formatDuration(metadata.duration || metadata.estimated_hours),
            thumbnail: getContentThumbnail(contentTypeConfig.type, metadata.difficulty),
            tags: getContentTags(metadata, contentTypeConfig.type),
            instructor: metadata.instructor || 'LearnMate Team',
            totalModules: metadata.total_modules || metadata.modules?.length || 1,
            createdAt: metadata.created_at || new Date().toISOString(),
            modules: metadata.modules || [],
            // Real user progress
            completed: completedContent.has(contentId),
            progress: completedContent.has(contentId) ? 100 : 0
          };

          allContent.push(transformedContent);
        }
        
      } catch (error) {
        console.error(`Error reading ${contentTypeConfig.folder}:`, error.message);
      }
    }

    // Apply filters
    let filteredContent = allContent;
    
    if (type) {
      filteredContent = filteredContent.filter(item => item.type === type);
    }
    
    if (difficulty) {
      filteredContent = filteredContent.filter(item => item.difficulty === difficulty);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContent = filteredContent.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort by creation date (newest first)
    filteredContent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      message: 'Real content library loaded successfully',
      content: filteredContent,
      total: filteredContent.length,
      totalAvailable: allContent.length
    });
    
  } catch (error) {
    console.error('Content library error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to load content library'
    });
  }
});

// Get specific content item
router.get('/:contentId', authenticateToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const contentLibraryPath = path.join(__dirname, '../../services/content-library');
    
    // Search through all content types
    const contentTypes = ['courses', 'quizzes', 'projects', 'tutorials'];
    
    for (const contentType of contentTypes) {
      const typePath = path.join(contentLibraryPath, contentType);
      
      if (!await fs.access(typePath).then(() => true).catch(() => false)) continue;
      
      const items = await fs.readdir(typePath, { withFileTypes: true });
      
      for (const item of items) {
        if (!item.isDirectory()) continue;
        
        const itemPath = path.join(typePath, item.name);
        
        // Try to find metadata
        const possibleMetadataFiles = [
          'metadata.json',
          'course_metadata.json',
          `${item.name}_metadata.json`
        ];
        
        for (const metadataFile of possibleMetadataFiles) {
          const metadataPath = path.join(itemPath, metadataFile);
          try {
            const metadataContent = await fs.readFile(metadataPath, 'utf8');
            const metadata = JSON.parse(metadataContent);
            
            const itemId = metadata.id || metadata.course_id || item.name;
            
            if (itemId === contentId) {
              // Found the content, return full details
              const userCompletions = await UserProgress.getUserCompletions(req.user.uid);
              const isCompleted = userCompletions.some(c => c.content_id === contentId);
              
              res.json({
                success: true,
                content: {
                  ...metadata,
                  id: itemId,
                  type: contentType.slice(0, -1), // Remove 's'
                  completed: isCompleted,
                  progress: isCompleted ? 100 : 0
                }
              });
              return;
            }
          } catch (error) {
            // Continue searching
          }
        }
      }
    }
    
    res.status(404).json({
      success: false,
      error: 'Content not found'
    });
    
  } catch (error) {
    console.error('Content fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions
function formatDuration(duration) {
  if (typeof duration === 'string') return duration;
  if (typeof duration === 'number') {
    return duration >= 1 ? `${duration} hours` : `${duration * 60} minutes`;
  }
  return '1 hour';
}

function getContentThumbnail(type, difficulty) {
  const typeEmojis = {
    course: difficulty === 'beginner' ? '🟢' : difficulty === 'intermediate' ? '🟡' : '🔴',
    quiz: '📝',
    project: '🚀',
    tutorial: '📚'
  };
  return typeEmojis[type] || '📖';
}

function getContentTags(metadata, type) {
  const tags = [];
  
  if (metadata.topic) tags.push(metadata.topic);
  if (metadata.category) tags.push(metadata.category);
  if (metadata.tags && Array.isArray(metadata.tags)) {
    tags.push(...metadata.tags);
  }
  if (metadata.difficulty) {
    tags.push(metadata.difficulty.charAt(0).toUpperCase() + metadata.difficulty.slice(1));
  }
  
  // Add type-specific tags
  if (type === 'course' && !tags.includes('Course')) tags.push('Course');
  if (type === 'quiz' && !tags.includes('Quiz')) tags.push('Quiz');
  if (type === 'project' && !tags.includes('Project')) tags.push('Project');
  if (type === 'tutorial' && !tags.includes('Tutorial')) tags.push('Tutorial');
  
  return tags.length > 0 ? tags : [type.charAt(0).toUpperCase() + type.slice(1)];
}

module.exports = router;
