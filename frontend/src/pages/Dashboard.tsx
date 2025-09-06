import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    clan: 'Tech Warriors',
    level: 'Intermediate'
  });

  const handleSignOut = () => {
    // Simulate sign out
    alert('Signed out successfully!');
    navigate('/');
  };

  // Helper function to calculate overall progress
  const calculateOverallProgress = (topics: any[]) => {
    let totalProgress = 0;
    for (let i = 0; i < topics.length; i++) {
      totalProgress += (topics[i].completed / topics[i].total);
    }
    return Math.round((totalProgress / topics.length) * 100);
  };

  // Mock data for progress
  const personalProgress = [
    { topic: 'JavaScript Fundamentals', completed: 85, total: 100, color: 'bg-blue-500' },
    { topic: 'React Development', completed: 60, total: 80, color: 'bg-green-500' },
    { topic: 'Node.js Backend', completed: 45, total: 75, color: 'bg-purple-500' },
    { topic: 'Database Design', completed: 30, total: 60, color: 'bg-yellow-500' },
    { topic: 'API Development', completed: 25, total: 50, color: 'bg-red-500' }
  ];

  // Clan progress for the same topics as personal progress
  const clanTopicProgress = [
    {
      name: 'Alex Chen',
      avatar: '👨‍💻',
      clan: 'Tech Warriors',
      rank: 1,
      topics: [
        { topic: 'JavaScript Fundamentals', completed: 95, total: 100 },
        { topic: 'React Development', completed: 75, total: 80 },
        { topic: 'Node.js Backend', completed: 65, total: 75 },
        { topic: 'Database Design', completed: 50, total: 60 },
        { topic: 'API Development', completed: 40, total: 50 }
      ]
    },
    {
      name: 'Sarah Kim',
      avatar: '👩‍💻',
      clan: 'Tech Warriors',
      rank: 2,
      topics: [
        { topic: 'JavaScript Fundamentals', completed: 90, total: 100 },
        { topic: 'React Development', completed: 70, total: 80 },
        { topic: 'Node.js Backend', completed: 60, total: 75 },
        { topic: 'Database Design', completed: 45, total: 60 },
        { topic: 'API Development', completed: 35, total: 50 }
      ]
    },
    {
      name: 'You',
      avatar: '🧑‍💻',
      clan: 'Tech Warriors',
      rank: 3,
      topics: personalProgress // Use the same data as personal progress
    },
    {
      name: 'Mike Johnson',
      avatar: '👨‍🎓',
      clan: 'Tech Warriors',
      rank: 4,
      topics: [
        { topic: 'JavaScript Fundamentals', completed: 80, total: 100 },
        { topic: 'React Development', completed: 55, total: 80 },
        { topic: 'Node.js Backend', completed: 40, total: 75 },
        { topic: 'Database Design', completed: 25, total: 60 },
        { topic: 'API Development', completed: 20, total: 50 }
      ]
    },
    {
      name: 'Emily Davis',
      avatar: '👩‍🎓',
      clan: 'Tech Warriors',
      rank: 5,
      topics: [
        { topic: 'JavaScript Fundamentals', completed: 75, total: 100 },
        { topic: 'React Development', completed: 50, total: 80 },
        { topic: 'Node.js Backend', completed: 35, total: 75 },
        { topic: 'Database Design', completed: 20, total: 60 },
        { topic: 'API Development', completed: 15, total: 50 }
      ]
    }
  ];

  const recommendedCourses = [
    {
      title: 'Advanced React Patterns',
      description: 'Master advanced React concepts including hooks, context, and performance optimization',
      difficulty: 'Advanced',
      duration: '8 hours',
      rating: 4.8,
      students: 2340,
      image: '⚛️'
    },
    {
      title: 'TypeScript for Professionals',
      description: 'Learn TypeScript to write more robust and maintainable JavaScript applications',
      difficulty: 'Intermediate',
      duration: '6 hours',
      rating: 4.7,
      students: 1890,
      image: '📘'
    },
    {
      title: 'GraphQL API Design',
      description: 'Build efficient APIs with GraphQL and learn modern data fetching patterns',
      difficulty: 'Intermediate',
      duration: '5 hours',
      rating: 4.9,
      students: 1560,
      image: '🔗'
    }
  ];

  return (
    <div className="font-sans bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 min-h-screen text-white">
      {/* Enhanced header with navigation and search */}
      <header className="fixed w-full top-0 z-50 bg-dark-800/80 backdrop-blur-md border-b border-dark-600">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                LearnMate
              </span>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">Home</a>
              <a href="#" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">Courses</a>
              <a href="#" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">About</a>
              <span className="text-primary-400 font-medium">Dashboard</span>
            </nav>

            <div className="flex items-center space-x-4">
              <button 
                onClick={handleSignOut}
                className="text-gray-300 hover:text-white transition-all duration-300 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="border-t border-dark-600 bg-dark-800/50">
          <div className="container mx-auto px-6 py-3">
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-xl bg-dark-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm"
                placeholder="Search courses, topics, or resources..."
              />
            </div>
          </div>
        </div>
      </header>
      
      {/* Dashboard Content */}
      <main className="pt-32 pb-12">
        <div className="container mx-auto px-6">
          {/* Welcome Section */}
          <div className="mb-12">
            <div className="glass-morphism rounded-2xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Welcome back, <span className="gradient-text">{user.name}</span>!
                  </h1>
                  <p className="text-dark-300 text-lg">
                    Ready to continue your learning journey with {user.clan}?
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="glass-morphism rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="text-2xl font-bold text-primary-400">75%</div>
                    <div className="text-dark-300 text-sm">Overall Progress</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Progress Section */}
          <div className="mb-12">
            <div className="glass-morphism rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center">
                  <svg className="w-8 h-8 mr-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                  Your Progress
                </h2>
                <div className="text-primary-400 font-medium">
                  {personalProgress.length} Active Topics
                </div>
              </div>
              
              <div className="space-y-4">
                {personalProgress.map((item, index) => (
                  <div key={index} className="glass-morphism rounded-xl p-6 hover-lift">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-white">{item.topic}</h3>
                      <span className="text-primary-400 font-medium">
                        {item.completed}/{item.total} lessons
                      </span>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full ${item.color} transition-all duration-300`}
                        style={{ width: `${(item.completed / item.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-dark-300">
                      <span>{Math.round((item.completed / item.total) * 100)}% complete</span>
                      <span>{item.total - item.completed} lessons remaining</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clan Progress Section */}
          <div className="mb-12">
            <div className="glass-morphism rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center">
                  <svg className="w-8 h-8 mr-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                  Clan Leaderboard - Same Topics
                </h2>
                <div className="text-primary-400 font-medium">
                  {user.clan}
                </div>
              </div>
              
              <div className="space-y-6">
                {clanTopicProgress.map((member, index) => (
                  <div key={index} className={`glass-morphism rounded-xl p-6 hover-lift ${member.name === 'You' ? 'ring-2 ring-primary-500' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-primary-400 w-8">#{member.rank}</span>
                        <span className="text-2xl">{member.avatar}</span>
                        <div>
                          <div className="text-lg font-semibold text-white">{member.name}</div>
                          <div className="text-sm text-dark-300">{member.clan}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary-400">
                          {calculateOverallProgress(member.topics)}%
                        </div>
                        <div className="text-sm text-dark-300">Overall Progress</div>
                      </div>
                    </div>
                    
                    {/* Topic-specific progress bars */}
                    <div className="space-y-3">
                      {member.topics.map((topicData, topicIndex) => {
                        const progressPercent = Math.round((topicData.completed / topicData.total) * 100);
                        const personalTopic = personalProgress[topicIndex];
                        
                        return (
                          <div key={topicIndex} className="bg-dark-800/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">{topicData.topic}</span>
                              <span className="text-xs text-dark-300">
                                {topicData.completed}/{topicData.total}
                              </span>
                            </div>
                            <div className="w-full bg-dark-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${personalTopic?.color || 'bg-primary-500'}`}
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-dark-400 mt-1">{progressPercent}% complete</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Courses Section */}
          <div className="mb-12">
            <div className="glass-morphism rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center">
                  <svg className="w-8 h-8 mr-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Recommended for You
                </h2>
                <div className="text-primary-400 font-medium">
                  Based on your interests
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedCourses.map((course, index) => (
                  <div key={index} className="glass-morphism rounded-xl p-6 hover-lift">
                    <div className="text-4xl mb-4 text-center">{course.image}</div>
                    <h3 className="text-xl font-semibold text-white mb-3">{course.title}</h3>
                    <p className="text-dark-300 text-sm mb-4 line-clamp-3">{course.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-400">Difficulty:</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          course.difficulty === 'Advanced' ? 'bg-red-500/20 text-red-400' :
                          course.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {course.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-400">Duration:</span>
                        <span className="text-sm text-white">{course.duration}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-400">Rating:</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400">⭐</span>
                          <span className="text-sm text-white">{course.rating}</span>
                          <span className="text-sm text-dark-400">({course.students})</span>
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-glow hover:shadow-glow-lg">
                      Start Learning
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-morphism rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">📚</div>
              <div className="text-2xl font-bold text-primary-400">12</div>
              <div className="text-dark-300">Courses Completed</div>
            </div>
            <div className="glass-morphism rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">⏱️</div>
              <div className="text-2xl font-bold text-primary-400">42h</div>
              <div className="text-dark-300">Time Spent Learning</div>
            </div>
            <div className="glass-morphism rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-2xl font-bold text-primary-400">8</div>
              <div className="text-dark-300">Achievements Earned</div>
            </div>
            <div className="glass-morphism rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">📈</div>
              <div className="text-2xl font-bold text-primary-400">5</div>
              <div className="text-dark-300">Day Streak</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
