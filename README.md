# 🎓 EdTech Microlearning Platform

A comprehensive AI-driven microlearning platform with modular architecture for personalized education.

## 🏗️ Architecture Overview

```
📁 Project Structure
├── 🎨 frontend/           → React PWA with Tailwind CSS
├── 🔧 backend/            → Node.js API + Express + Admin routes  
├── 🤖 services/           → Python AI microservices (FastAPI)
├── 🎯 orchestrator/       → Agentic AI controller & context manager
├── 💾 database/           → SQL schema + NoSQL collections
├── 📚 docs/               → API documentation & guides
└── 🚀 infra/              → Docker, deployment, monitoring configs
```

## 🚀 Quick Start

1. **Start All Services:**
   ```powershell
   # Windows
   .\infra\start_platform_modular.ps1
   
   # Linux/Mac  
   ./infra/start_platform.sh
   ```

2. **Access Points:**
   - Frontend PWA: http://localhost:3000
   - Backend API: http://localhost:3001
   - AI Services: http://localhost:8000
   - Admin Panel: http://localhost:3001/admin

## 🧩 Core Modules

### 🎨 Frontend (React PWA)
- Progressive Web App with offline capabilities
- Real-time chat with AI orchestrator
- Adaptive UI based on learning patterns
- Gamification elements and social features

### 🔧 Backend (Node.js + Express)
- RESTful APIs for all platform features
- JWT authentication with role-based access
- Real-time WebSocket connections
- Integrated admin routes and management

### 🤖 AI Microservices (Python + FastAPI)
- **Competency Assessment:** Adaptive testing with CAT algorithms
- **Spaced Repetition:** Forgetting curve optimization
- **Fatigue Detection:** Engagement and burnout monitoring  
- **RAG System:** Content generation with retrieval augmentation
- **Content Processor:** Automated learning material creation

### 🎯 Orchestrator (Agentic AI)
- Context-aware AI agent for learning assistance
- Multi-service coordination and routing
- Persistent conversation memory
- Plugin architecture for extensibility

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ & npm 9+
- Python 3.9+ & pip
- PostgreSQL (optional, SQLite fallback)
- Redis (optional, memory fallback)

### Environment Configuration
```bash
# Copy environment templates
cp .env.example .env
cp services/.env.template services/.env

# Configure your API keys and database connections
# Edit .env files with your specific settings
```

## 📊 Features

### 🎯 Personalized Learning
- Adaptive assessment engine
- Competency-based progression
- Personalized learning paths
- Spaced repetition optimization

### 🤖 AI-Powered
- Natural language chat interface
- Intelligent content recommendations
- Automated fatigue detection
- Context-aware assistance

### 📈 Analytics & Gamification
- Real-time progress tracking
- Achievement system and badges
- Social learning features
- Performance analytics dashboard

### 🔧 Technical Excellence  
- Microservices architecture
- Real-time WebSocket communication
- Progressive Web App (PWA)
- Containerized deployment ready
- Comprehensive API documentation

## 🚀 Deployment

### Docker Deployment
```bash
# Build and start all services
docker-compose up -d

# Scale AI services
docker-compose up -d --scale services=3
```

### Production Checklist
- [ ] Configure environment variables
- [ ] Set up SSL certificates
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Configure CDN for static assets

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Architecture Guide](docs/ARCHITECTURE.md)  
- [Development Guide](docs/CONTRIBUTING.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🤝 Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - See LICENSE file for details.
