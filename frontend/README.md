# LearnMate - AI-Powered Learning Platform (Frontend)

LearnMate is a modern frontend web application that provides personalized learning experiences with AI tutors. Built with pure HTML, CSS (Tailwind), and JavaScript for maximum compatibility and simplicity.

## Features

### 🎯 Personal Progress Tracking
- Track your learning progress across different topics
- Visual progress bars with completion percentages
- Category-based organization (Programming, Maths, Data Science, etc.)
- Overall progress dashboard

### 👥 Clan/Community Progress
- Community leaderboard showing top learners
- Clan-wide topic completion tracking
- Community statistics and engagement metrics
- Member progress comparison

### 🎓 Smart Course Recommendations
- AI-powered course suggestions based on your learning history
- Recommendations based on courses you've searched or taken
- Popular courses among your clan members
- Difficulty-based filtering (Beginner, Intermediate, Advanced)
- Category-specific recommendations

### 🤖 AI Tutors
- Personalized learning assistance
- Smart, anytime, anywhere learning
- Interactive learning experience

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS (CDN)
- **Icons**: Emoji-based icons for visual appeal
- **Server**: Simple HTTP server for development

## Getting Started

### Prerequisites

- A modern web browser
- Node.js (for development server, optional)

### Quick Start

1. **Option 1: Direct File Opening**
   - Simply open `index.html` in your web browser
   - No server required for basic functionality

2. **Option 2: Development Server**
   ```bash
   npm install
   npm run dev
   ```
   - Opens at [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with http-server
- `npm run start` - Start production server
- `npm run build` - Build confirmation (frontend-only)

## Project Structure

```
├── index.html          # Landing page with hero, course highlights, testimonials
├── dashboard.html      # Main dashboard with progress tracking features
├── package.json        # Development dependencies
└── README.md          # This file
```

## Key Pages

### Landing Page (`index.html`)
- Hero section with AI tutor introduction
- Course category highlights (Programming, Maths, Science, Data Science, Algorithms)
- User testimonials
- Sign-in simulation (enables dashboard access)

### Dashboard (`dashboard.html`)
- **Personal Progress Section**: Shows your learning progress with topic completion
- **Clan Progress Section**: Community leaderboard and topic progress tracking
- **Recommended Courses**: Intelligent course suggestions based on learning history
- Interactive progress visualization with dynamic data

## Features in Detail

### Progress Section
Shows your personal learning progress with:
- Topic names and completion status (JavaScript, React, Linear Algebra, etc.)
- Visual progress bars with percentages
- Category groupings (Programming, Maths, Algorithms, Data Science)
- Remaining lessons count and overall statistics

### Clan Progress
Community features including:
- Member leaderboard ranked by completion percentage
- Community topic progress tracking across all members
- Active member count and average completion stats
- Social learning motivation through friendly competition

### Course Recommendations
Intelligent suggestions featuring:
- Courses based on your current learning path
- Popular courses among clan members
- Difficulty-appropriate next steps (Beginner/Intermediate/Advanced)
- Detailed course information with ratings, duration, and student counts
- Relevance explanations for each recommendation

## Data Structure

The application uses mock data stored in JavaScript objects:

- **Topics**: Personal learning progress with completion tracking
- **Clan Members**: Community user data with progress information
- **Clan Topics**: Community-wide topic completion statistics
- **Recommended Courses**: Course suggestions with metadata

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11+: Basic support (may need polyfills)

## Development

### Local Development
```bash
# Install development dependencies
npm install

# Start development server
npm run dev
```

### No-Build Deployment
Since this is a frontend-only application, you can:
1. Upload the HTML files directly to any web server
2. Use GitHub Pages, Netlify, Vercel, or similar static hosting
3. Serve from any CDN or static file server

## Contributing

This project is part of a hackathon submission. Feel free to explore the code and suggest improvements!

## License

This project is created for educational and demonstration purposes.
