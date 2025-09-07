// Advanced Clan System with Real-time Collaboration and Challenges

interface ClanMember {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  points: number;
  currentCourse?: string;
  currentProgress?: number;
  lastActivity: Date;
  isOnline: boolean;
  completedCourses: string[];
  achievements: string[];
}

interface Challenge {
  id: string;
  createdBy: string;
  targetMember?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  points: number;
  timeLimit: number;
  createdAt: Date;
  responses: ChallengeResponse[];
}

interface ChallengeResponse {
  memberId: string;
  memberName: string;
  answer: number;
  isCorrect: boolean;
  timeSpent: number;
  timestamp: Date;
}

interface ClanActivity {
  id: string;
  type: 'course_started' | 'course_completed' | 'achievement' | 'challenge_created' | 'challenge_completed' | 'level_up' | 'quiz_passed';
  memberId: string;
  memberName: string;
  description: string;
  data?: any;
  timestamp: Date;
  points?: number;
}

interface Clan {
  id: string;
  name: string;
  description: string;
  members: ClanMember[];
  totalPoints: number;
  level: number;
  activities: ClanActivity[];
  challenges: Challenge[];
  createdAt: Date;
  isPublic: boolean;
}

class AdvancedClanSystem {
  private currentUser: any;
  private clanData: Clan | null = null;
  private activityListeners: ((activity: ClanActivity) => void)[] = [];
  private challengeListeners: ((challenge: Challenge) => void)[] = [];
  private memberUpdateListeners: ((member: ClanMember) => void)[] = [];

  constructor(currentUser: any) {
    this.currentUser = currentUser;
    this.initializeClanSystem();
  }

  async initializeClanSystem() {
    // Load clan data from localStorage or create new
    const savedClan = localStorage.getItem('clanData');
    if (savedClan) {
      this.clanData = JSON.parse(savedClan);
      // Update last activity for current user
      this.updateMemberActivity('system_login');
    } else {
      await this.createDefaultClan();
    }

    // Simulate real-time updates
    this.startRealTimeSimulation();
  }

  async createDefaultClan(): Promise<Clan> {
    const defaultClan: Clan = {
      id: 'clan_' + Date.now(),
      name: 'Learning Warriors',
      description: 'A collaborative community of passionate learners',
      members: [
        {
          id: this.currentUser?.uid || 'user_1',
          name: this.currentUser?.displayName || 'You',
          level: 1,
          points: 0,
          lastActivity: new Date(),
          isOnline: true,
          completedCourses: [],
          achievements: ['First Login']
        },
        // Simulate other active members
        {
          id: 'member_2',
          name: 'Alex Chen',
          avatar: '👨‍💻',
          level: 3,
          points: 2450,
          currentCourse: 'Complete Data Science Masterclass',
          currentProgress: 65,
          lastActivity: new Date(Date.now() - 5 * 60000), // 5 minutes ago
          isOnline: true,
          completedCourses: ['JavaScript Fundamentals', 'Python Basics'],
          achievements: ['Fast Learner', 'Quiz Master', 'Helpful Member']
        },
        {
          id: 'member_3',
          name: 'Sarah Ahmed',
          avatar: '👩‍🎓',
          level: 4,
          points: 3200,
          currentCourse: 'Advanced Machine Learning',
          currentProgress: 40,
          lastActivity: new Date(Date.now() - 15 * 60000), // 15 minutes ago
          isOnline: true,
          completedCourses: ['Data Analysis', 'Statistics', 'Python for ML'],
          achievements: ['Course Crusher', 'Top Performer', 'Challenge Champion']
        },
        {
          id: 'member_4',
          name: 'Marcus Johnson',
          avatar: '🧠',
          level: 2,
          points: 1800,
          currentCourse: 'Web Development Bootcamp',
          currentProgress: 25,
          lastActivity: new Date(Date.now() - 2 * 60000), // 2 minutes ago
          isOnline: true,
          completedCourses: ['HTML/CSS Basics'],
          achievements: ['Quick Start', 'Consistent Learner']
        }
      ],
      totalPoints: 7450,
      level: 2,
      activities: [],
      challenges: [],
      createdAt: new Date(),
      isPublic: true
    };

    this.clanData = defaultClan;
    this.saveClanData();
    return defaultClan;
  }

  getClanData(): Clan | null {
    return this.clanData;
  }

  getCurrentMember(): ClanMember | null {
    if (!this.clanData) return null;
    return this.clanData.members.find(m => m.id === (this.currentUser?.uid || 'user_1')) || null;
  }

  // Real-time activity simulation
  startRealTimeSimulation() {
    // Simulate member activities every 30-60 seconds
    setInterval(() => {
      if (this.clanData) {
        this.simulateMemberActivity();
      }
    }, Math.random() * 30000 + 30000); // 30-60 seconds

    // Simulate challenges every 2-5 minutes
    setInterval(() => {
      if (this.clanData && Math.random() < 0.3) { // 30% chance
        this.simulateChallenge();
      }
    }, Math.random() * 180000 + 120000); // 2-5 minutes
  }

  simulateMemberActivity() {
    if (!this.clanData) return;

    const activeMembers = this.clanData.members.filter(m => 
      m.isOnline && m.id !== (this.currentUser?.uid || 'user_1')
    );

    if (activeMembers.length === 0) return;

    const member = activeMembers[Math.floor(Math.random() * activeMembers.length)];
    const activities = [
      'completed_quiz',
      'started_module',
      'achievement_unlocked',
      'course_progress',
      'helped_member'
    ];

    const activityType = activities[Math.floor(Math.random() * activities.length)];
    
    let activity: ClanActivity;
    
    switch (activityType) {
      case 'completed_quiz':
        activity = {
          id: 'activity_' + Date.now(),
          type: 'quiz_passed',
          memberId: member.id,
          memberName: member.name,
          description: `completed a quiz in ${member.currentCourse || 'their course'}`,
          timestamp: new Date(),
          points: 50
        };
        member.points += 50;
        break;

      case 'started_module':
        activity = {
          id: 'activity_' + Date.now(),
          type: 'course_started',
          memberId: member.id,
          memberName: member.name,
          description: `started a new module: "${this.getRandomModuleName()}"`,
          timestamp: new Date(),
          points: 20
        };
        member.points += 20;
        if (member.currentProgress) {
          member.currentProgress += Math.floor(Math.random() * 10 + 5);
        }
        break;

      case 'achievement_unlocked':
        const newAchievement = this.getRandomAchievement();
        if (!member.achievements.includes(newAchievement)) {
          member.achievements.push(newAchievement);
          activity = {
            id: 'activity_' + Date.now(),
            type: 'achievement',
            memberId: member.id,
            memberName: member.name,
            description: `unlocked achievement: "${newAchievement}"`,
            timestamp: new Date(),
            points: 100
          };
          member.points += 100;
        } else {
          return; // Skip if already has achievement
        }
        break;

      case 'course_progress':
        if (member.currentProgress && member.currentProgress < 95) {
          member.currentProgress += Math.floor(Math.random() * 15 + 5);
          activity = {
            id: 'activity_' + Date.now(),
            type: 'course_started',
            memberId: member.id,
            memberName: member.name,
            description: `made progress in ${member.currentCourse} (${member.currentProgress}%)`,
            timestamp: new Date(),
            points: 30
          };
          member.points += 30;
        } else {
          return;
        }
        break;

      default:
        return;
    }

    // Check for level up
    const newLevel = Math.floor(member.points / 1000) + 1;
    if (newLevel > member.level) {
      member.level = newLevel;
      const levelUpActivity: ClanActivity = {
        id: 'activity_' + Date.now() + 1,
        type: 'level_up',
        memberId: member.id,
        memberName: member.name,
        description: `leveled up to Level ${newLevel}! 🎉`,
        timestamp: new Date(),
        points: 200
      };
      this.clanData.activities.unshift(levelUpActivity);
      this.notifyActivityListeners(levelUpActivity);
    }

    member.lastActivity = new Date();
    this.clanData.activities.unshift(activity);
    
    // Keep only last 50 activities
    if (this.clanData.activities.length > 50) {
      this.clanData.activities = this.clanData.activities.slice(0, 50);
    }

    this.saveClanData();
    this.notifyActivityListeners(activity);
    this.notifyMemberUpdateListeners(member);
  }

  simulateChallenge() {
    if (!this.clanData) return;

    const challenges = [
      {
        question: "What is the time complexity of binary search?",
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        correct: 1,
        explanation: "Binary search divides the search space in half each time, resulting in O(log n) complexity.",
        topic: "Algorithms",
        difficulty: "medium" as const
      },
      {
        question: "Which Python library is best for data manipulation?",
        options: ["NumPy", "Pandas", "Matplotlib", "Requests"],
        correct: 1,
        explanation: "Pandas is specifically designed for data manipulation and analysis.",
        topic: "Python",
        difficulty: "easy" as const
      },
      {
        question: "What does CNN stand for in machine learning?",
        options: ["Computer Neural Network", "Convolutional Neural Network", "Collective Node Network", "Complex Number Network"],
        correct: 1,
        explanation: "CNN stands for Convolutional Neural Network, commonly used for image processing.",
        topic: "Machine Learning",
        difficulty: "medium" as const
      }
    ];

    const activeMembers = this.clanData.members.filter(m => 
      m.isOnline && m.id !== (this.currentUser?.uid || 'user_1')
    );

    if (activeMembers.length === 0) return;

    const creator = activeMembers[Math.floor(Math.random() * activeMembers.length)];
    const challengeData = challenges[Math.floor(Math.random() * challenges.length)];

    const challenge: Challenge = {
      id: 'challenge_' + Date.now(),
      createdBy: creator.id,
      question: challengeData.question,
      options: challengeData.options,
      correctAnswer: challengeData.correct,
      explanation: challengeData.explanation,
      difficulty: challengeData.difficulty,
      topic: challengeData.topic,
      points: challengeData.difficulty === 'medium' ? 75 : 50,
      timeLimit: 60,
      createdAt: new Date(),
      responses: []
    };

    this.clanData.challenges.unshift(challenge);
    
    // Keep only last 20 challenges
    if (this.clanData.challenges.length > 20) {
      this.clanData.challenges = this.clanData.challenges.slice(0, 20);
    }

    // Add activity
    const activity: ClanActivity = {
      id: 'activity_' + Date.now(),
      type: 'challenge_created',
      memberId: creator.id,
      memberName: creator.name,
      description: `created a ${challengeData.difficulty} challenge: "${challengeData.topic}"`,
      timestamp: new Date(),
      points: 25
    };

    this.clanData.activities.unshift(activity);
    creator.points += 25;

    this.saveClanData();
    this.notifyActivityListeners(activity);
    this.notifyChallengeListeners(challenge);
  }

  getRandomModuleName(): string {
    const modules = [
      "Advanced Data Structures",
      "Machine Learning Fundamentals", 
      "React Components Deep Dive",
      "Python Error Handling",
      "SQL Optimization Techniques",
      "API Design Patterns",
      "Async Programming",
      "Database Indexing"
    ];
    return modules[Math.floor(Math.random() * modules.length)];
  }

  getRandomAchievement(): string {
    const achievements = [
      "Speed Demon",
      "Perfect Score",
      "Night Owl",
      "Early Bird", 
      "Streak Master",
      "Code Warrior",
      "Problem Solver",
      "Team Player",
      "Knowledge Seeker",
      "Challenge Accepted"
    ];
    return achievements[Math.floor(Math.random() * achievements.length)];
  }

  // User interactions
  updateMemberActivity(activityType: string, data?: any) {
    if (!this.clanData) return;
    
    const currentMember = this.getCurrentMember();
    if (!currentMember) return;

    currentMember.lastActivity = new Date();
    currentMember.isOnline = true;

    let activity: ClanActivity | null = null;

    switch (activityType) {
      case 'course_started':
        activity = {
          id: 'activity_' + Date.now(),
          type: 'course_started',
          memberId: currentMember.id,
          memberName: currentMember.name,
          description: `started learning: "${data.courseTitle}"`,
          timestamp: new Date(),
          points: 50
        };
        currentMember.currentCourse = data.courseTitle;
        currentMember.currentProgress = 0;
        currentMember.points += 50;
        break;

      case 'assessment_completed':
        activity = {
          id: 'activity_' + Date.now(),
          type: 'achievement',
          memberId: currentMember.id,
          memberName: currentMember.name,
          description: `completed adaptive assessment with ${data.accuracy}% accuracy`,
          timestamp: new Date(),
          points: data.accuracy >= 80 ? 150 : data.accuracy >= 60 ? 100 : 75
        };
        currentMember.points += activity.points!;
        
        // Add achievement if high score
        if (data.accuracy >= 90 && !currentMember.achievements.includes('Assessment Master')) {
          currentMember.achievements.push('Assessment Master');
        }
        break;

      case 'course_progress':
        if (data.progress > (currentMember.currentProgress || 0)) {
          currentMember.currentProgress = data.progress;
          activity = {
            id: 'activity_' + Date.now(),
            type: 'course_started',
            memberId: currentMember.id,
            memberName: currentMember.name,
            description: `made progress in ${currentMember.currentCourse} (${data.progress}%)`,
            timestamp: new Date(),
            points: 20
          };
          currentMember.points += 20;
        }
        break;
    }

    if (activity) {
      this.clanData.activities.unshift(activity);
      this.saveClanData();
      this.notifyActivityListeners(activity);
    }

    this.checkLevelUp(currentMember);
  }

  checkLevelUp(member: ClanMember) {
    if (!this.clanData) return;
    
    const newLevel = Math.floor(member.points / 1000) + 1;
    if (newLevel > member.level) {
      member.level = newLevel;
      const activity: ClanActivity = {
        id: 'activity_' + Date.now(),
        type: 'level_up',
        memberId: member.id,
        memberName: member.name,
        description: `reached Level ${newLevel}! 🎉`,
        timestamp: new Date(),
        points: 200
      };
      this.clanData.activities.unshift(activity);
      this.saveClanData();
      this.notifyActivityListeners(activity);
    }
  }

  // Challenge system
  createChallenge(question: string, options: string[], correctAnswer: number, explanation: string, topic: string, difficulty: 'easy' | 'medium' | 'hard', targetMember?: string): Challenge {
    if (!this.clanData) throw new Error('No clan data');
    
    const currentMember = this.getCurrentMember();
    if (!currentMember) throw new Error('Current member not found');

    const challenge: Challenge = {
      id: 'challenge_' + Date.now(),
      createdBy: currentMember.id,
      targetMember,
      question,
      options,
      correctAnswer,
      explanation,
      difficulty,
      topic,
      points: difficulty === 'hard' ? 100 : difficulty === 'medium' ? 75 : 50,
      timeLimit: 60,
      createdAt: new Date(),
      responses: []
    };

    this.clanData.challenges.unshift(challenge);
    
    // Add activity
    const activity: ClanActivity = {
      id: 'activity_' + Date.now(),
      type: 'challenge_created',
      memberId: currentMember.id,
      memberName: currentMember.name,
      description: targetMember ? 
        `challenged ${this.getMemberName(targetMember)} with a ${difficulty} question` :
        `created a ${difficulty} challenge for everyone: "${topic}"`,
      timestamp: new Date(),
      points: 25
    };

    currentMember.points += 25;
    this.clanData.activities.unshift(activity);
    this.saveClanData();
    
    this.notifyActivityListeners(activity);
    this.notifyChallengeListeners(challenge);
    
    return challenge;
  }

  respondToChallenge(challengeId: string, selectedAnswer: number, timeSpent: number): boolean {
    if (!this.clanData) return false;
    
    const challenge = this.clanData.challenges.find(c => c.id === challengeId);
    if (!challenge) return false;

    const currentMember = this.getCurrentMember();
    if (!currentMember) return false;

    // Check if already responded
    if (challenge.responses.some(r => r.memberId === currentMember.id)) {
      return false;
    }

    const isCorrect = selectedAnswer === challenge.correctAnswer;
    
    const response: ChallengeResponse = {
      memberId: currentMember.id,
      memberName: currentMember.name,
      answer: selectedAnswer,
      isCorrect,
      timeSpent,
      timestamp: new Date()
    };

    challenge.responses.push(response);

    // Award points
    if (isCorrect) {
      const bonusPoints = timeSpent < 30 ? challenge.points + 25 : challenge.points;
      currentMember.points += bonusPoints;
      
      const activity: ClanActivity = {
        id: 'activity_' + Date.now(),
        type: 'challenge_completed',
        memberId: currentMember.id,
        memberName: currentMember.name,
        description: `correctly answered ${challenge.createdBy === currentMember.id ? 'their own' : `${this.getMemberName(challenge.createdBy)}'s`} challenge (${bonusPoints} pts)`,
        timestamp: new Date(),
        points: bonusPoints
      };
      
      this.clanData.activities.unshift(activity);
      this.notifyActivityListeners(activity);
    }

    this.checkLevelUp(currentMember);
    this.saveClanData();
    
    return isCorrect;
  }

  getMemberName(memberId: string): string {
    if (!this.clanData) return 'Unknown';
    const member = this.clanData.members.find(m => m.id === memberId);
    return member?.name || 'Unknown';
  }

  // Event listeners
  onActivityUpdate(callback: (activity: ClanActivity) => void) {
    this.activityListeners.push(callback);
  }

  onChallengeUpdate(callback: (challenge: Challenge) => void) {
    this.challengeListeners.push(callback);
  }

  onMemberUpdate(callback: (member: ClanMember) => void) {
    this.memberUpdateListeners.push(callback);
  }

  private notifyActivityListeners(activity: ClanActivity) {
    this.activityListeners.forEach(callback => callback(activity));
  }

  private notifyChallengeListeners(challenge: Challenge) {
    this.challengeListeners.forEach(callback => callback(challenge));
  }

  private notifyMemberUpdateListeners(member: ClanMember) {
    this.memberUpdateListeners.forEach(callback => callback(member));
  }

  private saveClanData() {
    if (this.clanData) {
      localStorage.setItem('clanData', JSON.stringify(this.clanData));
    }
  }

  // Get leaderboard
  getLeaderboard(): ClanMember[] {
    if (!this.clanData) return [];
    return [...this.clanData.members].sort((a, b) => b.points - a.points);
  }

  // Get recent activities
  getRecentActivities(limit: number = 20): ClanActivity[] {
    if (!this.clanData) return [];
    return this.clanData.activities.slice(0, limit);
  }

  // Get active challenges
  getActiveChallenges(): Challenge[] {
    if (!this.clanData) return [];
    return this.clanData.challenges.slice(0, 10);
  }
}

export default AdvancedClanSystem;
export type { Clan, ClanMember, Challenge, ChallengeResponse, ClanActivity };
