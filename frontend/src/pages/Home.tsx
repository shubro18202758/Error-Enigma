import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Landing from './Landing';
import AuthenticatedHome from './AuthenticatedHome';

const Home: React.FC = () => {
  const { currentUser, loading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading LearnMate...</p>
        </div>
      </div>
    );
  }

  // Smart routing based on authentication status
  if (currentUser) {
    return <AuthenticatedHome />;
  }

  return <Landing />;
};

export default Home;
