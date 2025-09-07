import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signUp = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    if (result.user) {
      await updateProfile(result.user, {
        displayName: name
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    return signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    localStorage.removeItem('authToken');
    return signOut(auth);
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!currentUser) return null;
    
    try {
      const token = await currentUser.getIdToken();
      localStorage.setItem('authToken', token);
      return token;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Store token when user signs in
        try {
          const token = await user.getIdToken();
          localStorage.setItem('authToken', token);
        } catch (error) {
          console.error('Error storing token:', error);
        }
      } else {
        // Clear token when user signs out
        localStorage.removeItem('authToken');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    getIdToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
