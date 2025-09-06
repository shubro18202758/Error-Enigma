import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="font-sans bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 min-h-screen text-white">
      {/* Simple header without external component */}
      <header className="fixed w-full top-0 z-50 bg-dark-800/80 backdrop-blur-md border-b border-dark-600">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                LearnMate
              </Link>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">Home</Link>
              <a href="#courses" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">Courses</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">About</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">Contact</a>
            </nav>

            <div className="flex items-center space-x-4">
              <Link 
                to="/signin" 
                className="text-gray-300 hover:text-white transition-all duration-300 font-medium"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  Master New <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Skills</span> With LearnMate
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Join thousands of learners in our interactive learning platform. Track your progress, 
                  compete with your clan, and discover personalized course recommendations.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/signup" 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl text-center"
                >
                  Start Learning Today
                </Link>
                <Link 
                  to="/signin" 
                  className="border-2 border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 text-center"
                >
                  Sign In
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gray-800/50 backdrop-blur-md border border-gray-600 p-8 rounded-2xl shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Interactive Learning</h3>
                      <p className="text-gray-400">Hands-on experience</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 4v4h4V4h-4zM4 4v4h4V4H4zM4 10v4h4v-4H4zM4 16v4h4v-4H4zM10 4v4h4V4h-4zM16 10v4h4v-4h-4zM10 10v4h4v-4h-4zM10 16v4h4v-4h-4zM16 16v4h4v-4h-4z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Progress Tracking</h3>
                      <p className="text-gray-400">Monitor your growth</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Clan Community</h3>
                      <p className="text-gray-400">Learn together</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-800/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Why Choose <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">LearnMate?</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience learning like never before with our comprehensive platform designed for modern learners.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-md border border-gray-600 p-8 rounded-2xl hover:transform hover:-translate-y-2 transition-all duration-300 shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Personalized Learning</h3>
              <p className="text-gray-400 leading-relaxed">
                AI-powered recommendations tailored to your learning style and progress.
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-md border border-gray-600 p-8 rounded-2xl hover:transform hover:-translate-y-2 transition-all duration-300 shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Track Progress</h3>
              <p className="text-gray-400 leading-relaxed">
                Detailed analytics and insights to monitor your learning journey.
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-md border border-gray-600 p-8 rounded-2xl hover:transform hover:-translate-y-2 transition-all duration-300 shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Join Your Clan</h3>
              <p className="text-gray-400 leading-relaxed">
                Connect with peers, compete, and achieve goals together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-600 p-12 rounded-3xl text-center shadow-2xl">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Start Your <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Learning Journey?</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are already mastering new skills with LearnMate. 
              Your future self will thank you.
            </p>
            <Link 
              to="/signup" 
              className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800/50 py-12 border-t border-gray-700">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">LearnMate</span>
              </div>
              <p className="text-gray-400">
                Empowering learners worldwide with personalized education experiences.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Courses</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Progress</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Clans</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Leaderboard</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LearnMate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;