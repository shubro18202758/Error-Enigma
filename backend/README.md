# LearnMate Backend API

Backend API for LearnMate learning platform with Firebase authentication and clan management.

## Features

- 🔐 Firebase Authentication (Google Sign-In + Email/Password)
- 👥 User Management with Progress Tracking
- 🏆 Optional Clan System with Leaderboards
- 📊 Progress Analytics (individual and clan-based)
- 🔒 Secure API with JWT tokens
- 🚀 RESTful API endpoints

**Note:** Clan membership is completely optional - users can use the platform individually or join clans for community features.

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `error-404-6b343`
3. Go to Project Settings > Service Accounts
4. Generate a new private key
5. Download the JSON file and rename it to `serviceAccountKey.json`
6. Place it in the `config/` folder

### 2. Environment Setup

1. Install dependencies:
```bash
npm install
```

2. Update the `.env` file with your specific values:
```env
# Add your Firebase messaging sender ID and app ID
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Generate a strong JWT secret
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
```

### 3. Firebase Firestore Rules

Set up these security rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow other users to read basic info
    }
    
    // Clans are readable by members, writable by admins
    match /clans/{clanId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || request.auth.uid in resource.data.members);
    }
  }
}
```

### 4. Firebase Authentication Setup

1. Go to Authentication > Sign-in method
2. Enable these providers:
   - Email/Password
   - Google
3. Add your domain to authorized domains

### 5. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on: `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Google Sign-In
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify token

### Users
- `GET /api/users/dashboard` - Get dashboard data (works with/without clan)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/progress` - Update learning progress
- `GET /api/users/clan-members` - Get clan members (returns empty if no clan)
- `POST /api/users/join-clan` - Join a clan (optional)
- `POST /api/users/leave-clan` - Leave clan

### Clans (Optional Features)
- `GET /api/clans/` - Browse all public clans
- `POST /api/clans/create` - Create new clan
- `GET /api/clans/:clanId` - Get clan details
- `GET /api/clans/:clanId/leaderboard` - Get clan leaderboard
- `GET /api/clans/search/:query` - Search clans
- `POST /api/clans/:clanId/join` - Join clan by ID
- `POST /api/clans/:clanId/leave` - Leave clan
- `POST /api/clans/:clanId/update-stats` - Update clan statistics

## Data Models

### User
```javascript
{
  uid: string,
  email: string,
  name: string,
  avatar?: string,
  clanId?: string | null, // Optional - can be null if user hasn't joined a clan
  progress: {
    topics: {
      [topicName]: {
        completed: number,
        total: number,
        percentage: number,
        lastUpdated: Date
      }
    },
    lastActivity: Date
  },
  profile: {
    bio: string,
    level: number,
    points: number
  },
  createdAt: Date,
  lastLogin: Date
}
```

### Clan
```javascript
{
  id: string,
  name: string,
  description: string,
  createdBy: string,
  members: string[],
  memberCount: number,
  isPrivate: boolean,
  settings: {
    maxMembers: number,
    allowInvites: boolean,
    requireApproval: boolean
  },
  stats: {
    totalPoints: number,
    averageProgress: number,
    activeMembers: number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- 🔒 Firebase ID token verification
- 🛡️ Rate limiting (100 requests per 15 minutes)
- 🔐 CORS protection
- 🛡️ Helmet security headers
- 🚫 Input validation
- 🔑 Secure password hashing (bcrypt)

## Error Handling

All endpoints return standardized error responses:
```javascript
{
  success: false,
  message: "Error description",
  error: "Detailed error message"
}
```

## Health Check

Check if the API is running:
```
GET /health
```

Response:
```javascript
{
  status: "OK",
  message: "LearnMate Backend API is running",
  timestamp: "2024-01-01T00:00:00.000Z",
  environment: "development"
}
```
