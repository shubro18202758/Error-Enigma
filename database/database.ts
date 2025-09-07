// Database Configuration with MySQL fallback and SQLite local storage
import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export class DatabaseService {
  private mysqlConnection: mysql.Connection | null = null;
  private sqliteDb: any = null;
  private isOnline = true;

  constructor() {
    this.initializeDatabases();
  }

  private async initializeDatabases() {
    try {
      // Initialize SQLite local database
      await this.initializeSQLite();
      
      // Try to connect to MySQL
      await this.connectToMySQL();
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  private async initializeSQLite() {
    try {
      const dbPath = path.join(process.cwd(), 'database', 'edtech_local.db');
      
      this.sqliteDb = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      // Create tables if they don't exist
      await this.createSQLiteTables();
      console.log('✅ SQLite database initialized');
    } catch (error) {
      console.error('SQLite initialization error:', error);
      throw error;
    }
  }

  private async connectToMySQL() {
    try {
      const config = {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'edtech_user',
        password: process.env.MYSQL_PASSWORD || 'edtech_pass',
        database: process.env.MYSQL_DATABASE || 'edtech_platform',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        connectTimeout: 5000,
        acquireTimeout: 5000
      };

      this.mysqlConnection = await mysql.createConnection(config);
      
      // Test connection
      await this.mysqlConnection.ping();
      
      // Create tables if they don't exist
      await this.createMySQLTables();
      
      this.isOnline = true;
      console.log('✅ MySQL database connected');
    } catch (error) {
      console.warn('MySQL connection failed, using SQLite fallback:', error.message);
      this.isOnline = false;
      this.mysqlConnection = null;
    }
  }

  private async createSQLiteTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        displayName TEXT,
        level INTEGER DEFAULT 1,
        points INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_uid TEXT NOT NULL,
        topic TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        percentage REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users(uid),
        UNIQUE(user_uid, topic)
      )`,
      
      `CREATE TABLE IF NOT EXISTS leaderboard (
        uid TEXT PRIMARY KEY,
        displayName TEXT NOT NULL,
        points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_uid TEXT NOT NULL,
        topic TEXT NOT NULL,
        score REAL NOT NULL,
        max_score REAL NOT NULL,
        competency_level TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users(uid)
      )`,
      
      `CREATE TABLE IF NOT EXISTS learning_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_uid TEXT NOT NULL,
        topic TEXT NOT NULL,
        duration INTEGER NOT NULL,
        fatigue_score REAL,
        spaced_repetition_due DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users(uid)
      )`
    ];

    for (const table of tables) {
      await this.sqliteDb.exec(table);
    }
  }

  private async createMySQLTables() {
    if (!this.mysqlConnection) return;

    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        displayName VARCHAR(255),
        level INT DEFAULT 1,
        points INT DEFAULT 0,
        streak INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_uid VARCHAR(255) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        completed INT DEFAULT 0,
        total INT DEFAULT 0,
        percentage DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
        UNIQUE KEY unique_user_topic (user_uid, topic)
      )`,
      
      `CREATE TABLE IF NOT EXISTS leaderboard (
        uid VARCHAR(255) PRIMARY KEY,
        displayName VARCHAR(255) NOT NULL,
        points INT DEFAULT 0,
        level INT DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS assessments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_uid VARCHAR(255) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        max_score DECIMAL(5,2) NOT NULL,
        competency_level VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS learning_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_uid VARCHAR(255) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        duration INT NOT NULL,
        fatigue_score DECIMAL(3,2),
        spaced_repetition_due TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
      )`
    ];

    for (const table of tables) {
      await this.mysqlConnection.execute(table);
    }
  }

  // User Management
  async createUser(userData: any) {
    const query = `
      INSERT OR REPLACE INTO users (uid, email, displayName, level, points, streak)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      userData.uid,
      userData.email,
      userData.displayName || 'New User',
      userData.level || 1,
      userData.points || 0,
      userData.streak || 0
    ];

    try {
      if (this.isOnline && this.mysqlConnection) {
        const mysqlQuery = query.replace('INSERT OR REPLACE', 'INSERT INTO users SET uid=?, email=?, displayName=?, level=?, points=?, streak=? ON DUPLICATE KEY UPDATE displayName=VALUES(displayName), level=VALUES(level), points=VALUES(points), streak=VALUES(streak)');
        await this.mysqlConnection.execute(mysqlQuery, values);
      }
      
      await this.sqliteDb.run(query, values);
      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserProfile(uid: string) {
    const query = 'SELECT * FROM users WHERE uid = ?';
    
    try {
      if (this.isOnline && this.mysqlConnection) {
        const [rows] = await this.mysqlConnection.execute(query, [uid]);
        if (Array.isArray(rows) && rows.length > 0) {
          return { success: true, data: rows[0] };
        }
      }
      
      const user = await this.sqliteDb.get(query, [uid]);
      return { success: true, data: user || null };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUserProfile(uid: string, updates: any) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE users SET ${setClause} WHERE uid = ?`;
    
    try {
      if (this.isOnline && this.mysqlConnection) {
        await this.mysqlConnection.execute(query, [...values, uid]);
      }
      
      await this.sqliteDb.run(query, [...values, uid]);
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Progress Management
  async getUserProgress(uid: string) {
    const query = 'SELECT * FROM user_progress WHERE user_uid = ?';
    
    try {
      if (this.isOnline && this.mysqlConnection) {
        const [rows] = await this.mysqlConnection.execute(query, [uid]);
        if (Array.isArray(rows) && rows.length > 0) {
          const progressMap = {};
          rows.forEach((row: any) => {
            progressMap[row.topic] = {
              completed: row.completed,
              total: row.total,
              percentage: row.percentage
            };
          });
          return { success: true, data: progressMap };
        }
      }
      
      const rows = await this.sqliteDb.all(query, [uid]);
      const progressMap = {};
      rows.forEach((row: any) => {
        progressMap[row.topic] = {
          completed: row.completed,
          total: row.total,
          percentage: row.percentage
        };
      });
      return { success: true, data: progressMap };
    } catch (error) {
      console.error('Error getting user progress:', error);
      return { success: false, error: error.message };
    }
  }

  async updateProgress(uid: string, topic: string, completed: number, total: number) {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    const query = `
      INSERT OR REPLACE INTO user_progress (user_uid, topic, completed, total, percentage)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    try {
      if (this.isOnline && this.mysqlConnection) {
        const mysqlQuery = `
          INSERT INTO user_progress (user_uid, topic, completed, total, percentage)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE completed = VALUES(completed), total = VALUES(total), percentage = VALUES(percentage)
        `;
        await this.mysqlConnection.execute(mysqlQuery, [uid, topic, completed, total, percentage]);
      }
      
      await this.sqliteDb.run(query, [uid, topic, completed, total, percentage]);
      
      // Update user points based on progress
      const pointsEarned = Math.floor(percentage / 10); // 1 point per 10% completion
      await this.updateUserProfile(uid, { points: pointsEarned });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating progress:', error);
      return { success: false, error: error.message };
    }
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10) {
    const query = 'SELECT * FROM leaderboard ORDER BY points DESC, level DESC LIMIT ?';
    
    try {
      if (this.isOnline && this.mysqlConnection) {
        const [rows] = await this.mysqlConnection.execute(query, [limit]);
        if (Array.isArray(rows) && rows.length > 0) {
          return { success: true, data: rows };
        }
      }
      
      const rows = await this.sqliteDb.all(query, [limit]);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return { success: false, error: error.message };
    }
  }

  async updateLeaderboard(uid: string, displayName: string, points: number, level: number) {
    const query = `
      INSERT OR REPLACE INTO leaderboard (uid, displayName, points, level)
      VALUES (?, ?, ?, ?)
    `;
    
    try {
      if (this.isOnline && this.mysqlConnection) {
        const mysqlQuery = `
          INSERT INTO leaderboard (uid, displayName, points, level)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE displayName = VALUES(displayName), points = VALUES(points), level = VALUES(level)
        `;
        await this.mysqlConnection.execute(mysqlQuery, [uid, displayName, points, level]);
      }
      
      await this.sqliteDb.run(query, [uid, displayName, points, level]);
      return { success: true };
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      return { success: false, error: error.message };
    }
  }

  // Assessment Management
  async saveAssessment(uid: string, topic: string, score: number, maxScore: number, competencyLevel: string) {
    const query = `
      INSERT INTO assessments (user_uid, topic, score, max_score, competency_level)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    try {
      if (this.isOnline && this.mysqlConnection) {
        await this.mysqlConnection.execute(query, [uid, topic, score, maxScore, competencyLevel]);
      }
      
      await this.sqliteDb.run(query, [uid, topic, score, maxScore, competencyLevel]);
      return { success: true };
    } catch (error) {
      console.error('Error saving assessment:', error);
      return { success: false, error: error.message };
    }
  }

  // Learning Session Management
  async saveLearningSession(uid: string, topic: string, duration: number, fatigueScore?: number, spacedRepetitionDue?: Date) {
    const query = `
      INSERT INTO learning_sessions (user_uid, topic, duration, fatigue_score, spaced_repetition_due)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    try {
      if (this.isOnline && this.mysqlConnection) {
        await this.mysqlConnection.execute(query, [uid, topic, duration, fatigueScore, spacedRepetitionDue]);
      }
      
      await this.sqliteDb.run(query, [uid, topic, duration, fatigueScore, spacedRepetitionDue]);
      return { success: true };
    } catch (error) {
      console.error('Error saving learning session:', error);
      return { success: false, error: error.message };
    }
  }

  // Connection Status
  async checkConnections() {
    const status = {
      mysql: false,
      sqlite: false
    };

    // Check MySQL
    try {
      if (this.mysqlConnection) {
        await this.mysqlConnection.ping();
        status.mysql = true;
        this.isOnline = true;
      }
    } catch (error) {
      this.isOnline = false;
      // Try to reconnect
      await this.connectToMySQL();
    }

    // Check SQLite
    try {
      if (this.sqliteDb) {
        await this.sqliteDb.get('SELECT 1');
        status.sqlite = true;
      }
    } catch (error) {
      console.error('SQLite check failed:', error);
    }

    return status;
  }

  // Sync data from SQLite to MySQL when connection is restored
  async syncToMySQL() {
    if (!this.isOnline || !this.mysqlConnection) return;

    try {
      console.log('🔄 Syncing local data to MySQL...');
      
      // Sync users
      const users = await this.sqliteDb.all('SELECT * FROM users');
      for (const user of users) {
        await this.createUser(user);
      }

      // Sync progress
      const progress = await this.sqliteDb.all('SELECT * FROM user_progress');
      for (const prog of progress) {
        await this.updateProgress(prog.user_uid, prog.topic, prog.completed, prog.total);
      }

      console.log('✅ Data sync completed');
    } catch (error) {
      console.error('Data sync error:', error);
    }
  }

  async close() {
    try {
      if (this.mysqlConnection) {
        await this.mysqlConnection.end();
      }
      if (this.sqliteDb) {
        await this.sqliteDb.close();
      }
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }
}

// Singleton instance
export const dbService = new DatabaseService();
