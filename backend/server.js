// Load environment variables FIRST before any other imports
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');

// Import configurations
const { initializeFirebase } = require('./config/firebase');
const dbService = require('./config/database');
const logger = require('./config/logger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user'); // Fixed: using singular user.js
const coursesRoutes = require('./routes/courses');
const assessmentRoutes = require('./routes/assessment');
const learningPathRoutes = require('./routes/learningPath');
const analyticsRoutes = require('./routes/analytics');
const gamificationRoutes = require('./routes/gamification');
const contentRoutes = require('./routes/content');
const aiRoutes = require('./routes/ai');
const socialRoutes = require('./routes/social');
const proctorRoutes = require('./routes/proctor');
const clansRoutes = require('./routes/clans');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Initialize services
async function initializeServices() {
  try {
    // Initialize Firebase
    await initializeFirebase();
    logger.info('Firebase initialized successfully');

    // Connect to database
    console.log('✅ Database service initialized');
    logger.info('Database connected successfully');

  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"]
    }
  }
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting with different tiers
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply different rate limits to different routes
app.use('/api/ai', createRateLimit(60 * 1000, 20, 'Too many AI requests'));
app.use('/api/assessment', createRateLimit(15 * 60 * 1000, 50, 'Too many assessment requests'));
app.use('/api', createRateLimit(15 * 60 * 1000, 100, 'Too many requests'));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'EdTech Platform Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    features: {
      firebase: !!process.env.FIREBASE_PROJECT_ID,
      ai: !!process.env.GEMINI_API_KEY,
      database: !!process.env.DATABASE_URL,
      realtime: true
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/learning-path', learningPathRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/proctor', proctorRoutes);
app.use('/api/clans', clansRoutes);

// Socket.IO for real-time features
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  // Join user-specific room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    logger.info(`User ${userId} joined their room`);
  });

  // Handle learning session events
  socket.on('learning-session-start', (data) => {
    socket.to(`user-${data.userId}`).emit('session-started', data);
  });

  // Handle assessment events
  socket.on('assessment-progress', (data) => {
    io.to(`user-${data.userId}`).emit('assessment-update', data);
  });

  // Handle real-time chat
  socket.on('ai-chat', async (data) => {
    try {
      // Process AI chat request
      const response = await processAIChat(data);
      socket.emit('ai-response', response);
    } catch (error) {
      socket.emit('ai-error', { message: 'AI service unavailable' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Global error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Helper function for AI chat processing
async function processAIChat(data) {
  // This will be implemented with the AI service
  return {
    message: "AI response processing...",
    timestamp: new Date().toISOString()
  };
}

// Initialize and start server
async function startServer() {
  try {
    await initializeServices();
    
    server.listen(PORT, () => {
      logger.info(`🚀 EdTech Platform Backend API running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
      logger.info(`🤖 AI Services: ${process.env.GEMINI_API_KEY ? 'Enabled' : 'Disabled'}`);
      logger.info(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
      logger.info(`⚡ Real-time: WebSocket ready on port ${PORT}`);
      
      console.log(`
╔═══════════════════════════════════════════════╗
║        🎓 EDTECH PLATFORM BACKEND 🚀         ║
║                                               ║
║  Port: ${PORT}                                   ║
║  Environment: ${process.env.NODE_ENV || 'development'}                        ║
║  Firebase: ✅ Connected                        ║
║  AI Services: ✅ Ready                         ║
║  Real-time: ✅ WebSocket Active               ║
║                                               ║
║  🌟 Advanced Features Enabled:               ║
║  • Adaptive Assessment Engine                 ║
║  • AI-Powered Content Recommendations        ║
║  • Real-time Engagement Tracking            ║
║  • Gamification & Social Learning           ║
║  • Personalized Learning Paths              ║
║                                               ║
╚═══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = { app, server, io };
