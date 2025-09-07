const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseService {
  constructor() {
    this.db = null;
    this.initializeDatabase();
  }

  initializeDatabase() {
    const dbPath = path.join(__dirname, '..', 'database', 'edtech_platform.db');
    
    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('✅ SQLite database connected');
        this.createTables();
      }
    });
  }

  createTables() {
    // Read and execute the comprehensive schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    
    try {
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      
      // Clean up the SQL - remove comments and normalize whitespace
      const cleanSQL = schemaSQL
        .replace(/--.*$/gm, '') // Remove line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Split by semicolons but be more careful about it
      const statements = cleanSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.match(/^\s*$/));
      
      // Execute statements sequentially to avoid dependency issues
      this.executeStatementsSequentially(statements, 0);
      
    } catch (error) {
      console.error('Error reading schema file:', error);
      // Fallback to basic tables if schema file not found
      this.createBasicTables();
    }
  }

  executeStatementsSequentially(statements, index) {
    if (index >= statements.length) {
      console.log('✅ Database schema initialized');
      return;
    }

    const sql = statements[index];
    this.db.run(sql, (err) => {
      if (err) {
        console.error(`Error executing statement ${index + 1}:`, err);
        console.error('Statement:', sql.substring(0, 100) + '...');
      }
      // Continue to next statement regardless of error
      this.executeStatementsSequentially(statements, index + 1);
    });
  }

  createBasicTables() {
    // Fallback basic schema
    const basicTables = [
      `CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT UNIQUE NOT NULL,
        email TEXT,
        name TEXT,
        total_points INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        lessons_completed INTEGER DEFAULT 0,
        quizzes_completed INTEGER DEFAULT 0,
        projects_completed INTEGER DEFAULT 0,
        last_active DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS user_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT NOT NULL,
        content_id TEXT NOT NULL,
        content_type TEXT NOT NULL,
        points_earned INTEGER DEFAULT 0,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(uid, content_id, content_type)
      )`
    ];

    basicTables.forEach(sql => {
      this.db.run(sql, (err) => {
        if (err) {
          console.error('Error creating basic table:', err);
        }
      });
    });
  }

  // User Management
  async createUser(userData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO users (uid, email, name, level, points, streak, clanId)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        userData.uid,
        userData.email,
        userData.name || userData.displayName || 'New User',
        userData.level || 1,
        userData.points || 0,
        userData.streak || 0,
        userData.clanId || null
      ];

      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true, id: this.lastID });
        }
      });
    });
  }

  async getUserProfile(uid) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE uid = ?';
      
      this.db.get(sql, [uid], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true, data: row });
        }
      });
    });
  }

  async updateUserProfile(uid, updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const sql = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE uid = ?`;
      
      this.db.run(sql, [...values, uid], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true, changes: this.changes });
        }
      });
    });
  }

  // Progress Management
  async getUserProgress(uid) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM user_progress WHERE user_uid = ?';
      
      this.db.all(sql, [uid], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const progressMap = {};
          rows.forEach(row => {
            progressMap[row.topic] = {
              completed: row.completed,
              total: row.total,
              percentage: row.percentage
            };
          });
          resolve({ success: true, data: progressMap });
        }
      });
    });
  }

  async updateProgress(uid, topic, completed, total) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO user_progress (user_uid, topic, completed, total, percentage, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      this.db.run(sql, [uid, topic, completed, total, percentage], async (err) => {
        if (err) {
          reject(err);
        } else {
          // Update user points based on progress
          const pointsEarned = Math.floor(percentage / 10);
          try {
            await this.updateUserProfile(uid, { points: pointsEarned });
            await this.updateLeaderboard(uid);
            resolve({ success: true });
          } catch (updateErr) {
            reject(updateErr);
          }
        }
      });
    });
  }

  // Leaderboard Management
  async updateLeaderboard(uid) {
    return new Promise(async (resolve, reject) => {
      try {
        // Get user data
        const userResult = await this.getUserProfile(uid);
        if (!userResult.success || !userResult.data) {
          return resolve({ success: false, error: 'User not found' });
        }

        const user = userResult.data;
        
        // Calculate overall progress
        const progressResult = await this.getUserProgress(uid);
        const progressData = progressResult.data || {};
        const topics = Object.values(progressData);
        const overallProgress = topics.length > 0 
          ? topics.reduce((acc, topic) => acc + topic.percentage, 0) / topics.length 
          : 0;

        const sql = `
          INSERT OR REPLACE INTO leaderboard (uid, name, points, level, overallProgress, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        this.db.run(sql, [uid, user.name, user.points, user.level, overallProgress], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ success: true });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async getLeaderboard(limit = 10) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM leaderboard ORDER BY points DESC, overallProgress DESC LIMIT ?';
      
      this.db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true, data: rows });
        }
      });
    });
  }

  // Dashboard Data
  async getDashboardData(uid) {
    try {
      const userResult = await this.getUserProfile(uid);
      if (!userResult.success || !userResult.data) {
        return { success: false, error: 'User not found' };
      }

      const user = userResult.data;
      const progressResult = await this.getUserProgress(uid);
      
      // Structure data like the existing API expects
      const dashboardData = {
        user: {
          uid: user.uid,
          email: user.email,
          name: user.name,
          progress: {
            topics: progressResult.data || {}
          },
          profile: {
            points: user.points,
            level: user.level,
            streak: user.streak
          }
        },
        hasJoinedClan: !!user.clanId,
        clanData: null
      };

      // Show general leaderboard
      const leaderboardResult = await this.getLeaderboard(10);
      dashboardData.clanData = {
        id: 'general',
        name: 'Global Leaderboard',
        description: 'Top learners across the platform',
        memberCount: leaderboardResult.data?.length || 0,
        members: leaderboardResult.data || []
      };

      return { success: true, dashboard: dashboardData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Promise-based query methods for easier use
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

const databaseService = new DatabaseService();

// Export both the service instance and promise-based methods for models
module.exports = {
  databaseService,
  db: {
    run: (sql, params = []) => databaseService.run(sql, params),
    get: (sql, params = []) => databaseService.get(sql, params),
    all: (sql, params = []) => databaseService.all(sql, params)
  }
};
