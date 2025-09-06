import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserProgress {
  [topicName: string]: {
    completed: number;
    total: number;
    percentage: number;
    lastUpdated: Date;
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  avatar?: string;
  clanId?: string | null;
  progress: UserProgress;
  profile: {
    bio: string;
    level: number;
    points: number;
  };
  createdAt: Date;
  lastLogin?: Date;
}

export interface ClanData {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  members: string[];
  isPrivate: boolean;
  createdAt: Date;
  stats: {
    totalPoints: number;
    averageProgress: number;
    activeMembers: number;
  };
}

// Get user profile data
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Create or update user profile
export const createUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      uid: userId,
      progress: {},
      profile: {
        bio: '',
        level: 1,
        points: 0
      },
      createdAt: new Date(),
      ...profileData
    }, { merge: true });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Update user progress
export const updateUserProgress = async (
  userId: string, 
  topicName: string, 
  completed: number, 
  total: number
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const percentage = Math.round((completed / total) * 100);
    
    await updateDoc(userRef, {
      [`progress.${topicName}`]: {
        completed,
        total,
        percentage,
        lastUpdated: new Date()
      },
      'profile.points': completed * 10, // 10 points per completed item
      lastActivity: new Date()
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
};

// Get clan data
export const getClanData = async (clanId: string): Promise<ClanData | null> => {
  try {
    const clanRef = doc(db, 'clans', clanId);
    const clanSnap = await getDoc(clanRef);
    
    if (clanSnap.exists()) {
      return clanSnap.data() as ClanData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching clan data:', error);
    return null;
  }
};

// Get clan members with their progress
export const getClanMembers = async (clanId: string): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('clanId', '==', clanId),
      orderBy('profile.points', 'desc'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    const members: UserProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      members.push(doc.data() as UserProfile);
    });
    
    return members;
  } catch (error) {
    console.error('Error fetching clan members:', error);
    return [];
  }
};

// Get all public clans
export const getPublicClans = async (): Promise<ClanData[]> => {
  try {
    const clansRef = collection(db, 'clans');
    const q = query(
      clansRef,
      where('isPrivate', '==', false),
      orderBy('memberCount', 'desc'),
      limit(20)
    );
    
    const querySnapshot = await getDocs(q);
    const clans: ClanData[] = [];
    
    querySnapshot.forEach((doc) => {
      clans.push(doc.data() as ClanData);
    });
    
    return clans;
  } catch (error) {
    console.error('Error fetching public clans:', error);
    return [];
  }
};

// Join a clan
export const joinClan = async (userId: string, clanId: string): Promise<void> => {
  try {
    // Update user's clan ID
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      clanId: clanId,
      joinedClanAt: new Date()
    });
    
    // Update clan member count and members array
    const clanRef = doc(db, 'clans', clanId);
    const clanSnap = await getDoc(clanRef);
    
    if (clanSnap.exists()) {
      const clanData = clanSnap.data();
      const updatedMembers = [...(clanData.members || []), userId];
      
      await updateDoc(clanRef, {
        members: updatedMembers,
        memberCount: updatedMembers.length,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error joining clan:', error);
    throw error;
  }
};

// Leave a clan
export const leaveClan = async (userId: string, clanId: string): Promise<void> => {
  try {
    // Update user's clan ID
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      clanId: null,
      leftClanAt: new Date()
    });
    
    // Update clan member count and members array
    const clanRef = doc(db, 'clans', clanId);
    const clanSnap = await getDoc(clanRef);
    
    if (clanSnap.exists()) {
      const clanData = clanSnap.data();
      const updatedMembers = (clanData.members || []).filter((id: string) => id !== userId);
      
      await updateDoc(clanRef, {
        members: updatedMembers,
        memberCount: updatedMembers.length,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error leaving clan:', error);
    throw error;
  }
};
