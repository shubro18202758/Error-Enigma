import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    clanId: '',
    educationLevel: '',
    areaOfInterest: '',
    terms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long!');
      return;
    }
    
    if (!formData.terms) {
      setError('Please accept the terms and conditions!');
      return;
    }

    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in all required fields!');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await signUp(formData.email, formData.password, formData.fullName);
      navigate('/dashboard');
    } catch (error: any) {
      setError('Failed to create account. Please try again.');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error: any) {
      setError('Failed to sign up with Google. Please try again.');
      console.error('Google sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white">
      <header className="fixed w-full top-0 z-50 bg-gray-800/80 backdrop-blur-md border-b border-gray-600">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                LearnMate
              </Link>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">Home</Link>
              <Link to="/courses" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">Courses</Link>
              <Link to="/about" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">About</Link>
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
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Join LearnMate</h1>
              <p className="text-gray-300">Create your account and start your learning journey</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="fullName" className="block text-sm font-medium text-white mb-2">Full Name</label>
                    <input 
                      type="text" 
                      id="fullName" 
                      name="fullName" 
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-white mb-2">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-white mb-2">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        id="password" 
                        name="password" 
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        placeholder="Create a password"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          {showPassword ? (
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                          ) : (
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        id="confirmPassword" 
                        name="confirmPassword" 
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        placeholder="Confirm your password"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          {showConfirmPassword ? (
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                          ) : (
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-white mb-2">Date of Birth</label>
                    <input 
                      type="date" 
                      id="dateOfBirth" 
                      name="dateOfBirth" 
                      required
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label htmlFor="clanId" className="block text-sm font-medium text-white mb-2">Clan ID (Optional)</label>
                    <input 
                      type="text" 
                      id="clanId" 
                      name="clanId"
                      value={formData.clanId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter clan ID if you have one"
                    />
                  </div>

                  <div>
                    <label htmlFor="educationLevel" className="block text-sm font-medium text-white mb-2">Education Level</label>
                    <select 
                      id="educationLevel" 
                      name="educationLevel" 
                      required
                      value={formData.educationLevel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Select your education level</option>
                      <option value="high-school">High School</option>
                      <option value="associate">Associate Degree</option>
                      <option value="bachelor">Bachelor's Degree</option>
                      <option value="master">Master's Degree</option>
                      <option value="phd">PhD</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="areaOfInterest" className="block text-sm font-medium text-white mb-2">Area of Interest</label>
                    <select 
                      id="areaOfInterest" 
                      name="areaOfInterest" 
                      required
                      value={formData.areaOfInterest}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Select your area of interest</option>
                      <option value="programming">Programming & Development</option>
                      <option value="data-science">Data Science & Analytics</option>
                      <option value="ai-ml">Artificial Intelligence & Machine Learning</option>
                      <option value="cybersecurity">Cybersecurity</option>
                      <option value="cloud-computing">Cloud Computing</option>
                      <option value="mobile-development">Mobile Development</option>
                      <option value="web-development">Web Development</option>
                      <option value="devops">DevOps & Infrastructure</option>
                      <option value="design">UI/UX Design</option>
                      <option value="business">Business & Management</option>
                      <option value="marketing">Digital Marketing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    name="terms" 
                    required
                    checked={formData.terms}
                    onChange={handleInputChange}
                    className="w-4 h-4 mt-1 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-300">
                    I agree to the{' '}
                    <Link to="/terms" className="text-blue-400 hover:text-blue-300">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-blue-400 hover:text-blue-300">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative text-center">
                    <span className="px-4 bg-gray-900 text-gray-400">Or</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 rounded-xl text-white hover:bg-gray-700/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="text-center">
                  <p className="text-gray-300">
                    Already have an account?{' '}
                    <Link to="/signin" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
