# EdTech Platform - Complete Python Implementation

🚀 **Advanced Personalized Microlearning Engine with AI-Driven Features**

A comprehensive EdTech platform built with Python and FastAPI, featuring adaptive assessment, personalized learning paths, RAG-based AI assistance, spaced repetition, real-time engagement monitoring, and advanced analytics.

## 🎯 Key Features

### 🧠 AI-Powered Learning
- **AI Orchestrator**: Central intelligence coordinating all AI services
- **RAG Engine**: Retrieval-Augmented Generation for intelligent content discovery
- **Adaptive Assessment**: Computer Adaptive Testing (CAT) using Item Response Theory
- **Chat Agent**: Conversational AI for educational support
- **Engagement Monitoring**: Real-time fatigue and attention tracking

### 📚 Personalized Learning
- **Spaced Repetition Engine**: Scientifically optimized memory consolidation
- **Learning Path Generator**: Personalized curriculum creation
- **Content Recommender**: Intelligent content discovery and recommendations
- **Adaptive Difficulty**: Dynamic content adjustment based on performance

### 🔥 Advanced Analytics
- **Real-time Performance Tracking**: Live progress monitoring
- **Learning Science Integration**: Evidence-based optimization
- **Comprehensive Analytics**: Detailed insights into learning patterns
- **Predictive Modeling**: Forecast learning outcomes

## 🏗️ Architecture

```
edtech_platform/
├── app/
│   ├── core/                    # Core configuration
│   │   ├── config.py           # Application settings
│   │   ├── database.py         # Database configuration
│   │   ├── firebase_config.py  # Firebase setup
│   │   └── logger.py           # Logging configuration
│   │
│   ├── models/                  # Database models
│   │   ├── user.py             # User data models
│   │   ├── assessment.py       # Assessment models
│   │   ├── content.py          # Content models
│   │   └── analytics.py        # Analytics models
│   │
│   ├── services/                # Business logic services
│   │   ├── ai_orchestrator.py  # Central AI coordination
│   │   └── user_service.py     # User management
│   │
│   ├── ai_services/             # Specialized AI services
│   │   ├── rag_engine.py       # RAG implementation
│   │   ├── adaptive_assessment.py  # CAT engine
│   │   ├── chat_agent.py       # Conversational AI
│   │   ├── spaced_repetition_engine.py  # Memory optimization
│   │   ├── engagement_monitor.py    # Engagement tracking
│   │   ├── learning_path_generator.py  # Curriculum generation
│   │   └── content_recommender.py     # Content recommendations
│   │
│   └── api/                     # API endpoints
│       ├── auth.py             # Authentication routes
│       ├── learning.py         # Learning & assessment routes
│       ├── ai_assistant.py     # AI assistant routes
│       └── routes.py           # Router configuration
│
├── main.py                     # FastAPI application entry point
├── requirements.txt            # Python dependencies
├── .env.template              # Environment configuration template
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL
- Redis
- Firebase project (for authentication)

### 1. Environment Setup

```bash
# Clone and navigate to project
cd edtech_platform

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

```bash
# Copy environment template
cp .env.template .env

# Edit .env file with your configuration:
# - Database credentials
# - Firebase service account
# - AI API keys (OpenAI, Google AI)
# - Other service configurations
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb edtech_platform

# Run database migrations (when implemented)
alembic upgrade head
```

### 4. Run the Application

```bash
# Start the FastAPI server
python main.py

# Or with uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Access the Platform

- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🔧 Configuration

### Environment Variables

Key configuration variables in `.env`:

```env
# Core Application
DEBUG=True
API_HOST=0.0.0.0
API_PORT=8000
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql://user:pass@localhost/edtech_platform
REDIS_URL=redis://localhost:6379/0

# Firebase Authentication
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com

# AI Services
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_AI_API_KEY=your-google-ai-key

# Vector Database
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
```

## 🤖 AI Services Overview

### 1. AI Orchestrator
Central intelligence that coordinates all AI services, handles request routing, and manages context.

**Key Features:**
- Intent detection and request routing
- Multi-service coordination
- Context management and user tracking
- Comprehensive request processing

### 2. RAG Engine
Retrieval-Augmented Generation system for intelligent content search and AI responses.

**Key Features:**
- ChromaDB vector database integration
- Semantic search capabilities
- LLM integration (OpenAI/Google Gemini)
- Educational content indexing

### 3. Adaptive Assessment Engine
Computer Adaptive Testing (CAT) implementation using Item Response Theory.

**Key Features:**
- 3-Parameter Logistic (3PL) IRT model
- Maximum Likelihood Estimation (MLE)
- Fisher Information maximization
- Adaptive question selection

### 4. Spaced Repetition Engine
Memory consolidation system using SuperMemo 2 algorithm with modern optimizations.

**Key Features:**
- Scientifically optimized scheduling
- Performance-based difficulty adjustment
- Retention analytics and insights
- Adaptive interval calculation

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `POST /api/v1/auth/logout` - User logout

### Learning & Assessment
- `POST /api/v1/learning/assessment/start` - Start adaptive assessment
- `POST /api/v1/learning/assessment/{id}/respond` - Submit assessment response
- `GET /api/v1/learning/assessment/{id}/results` - Get assessment results
- `POST /api/v1/learning/learning-path/create` - Create learning path
- `POST /api/v1/learning/content/search` - Search content

### AI Assistant
- `POST /api/v1/ai/chat` - Chat with AI assistant
- `WS /api/v1/ai/chat/ws/{user_id}` - WebSocket chat
- `POST /api/v1/ai/spaced-repetition/session` - Start spaced repetition
- `POST /api/v1/ai/spaced-repetition/performance` - Record performance
- `GET /api/v1/ai/engagement/monitor` - Check engagement status

## 🔬 AI Algorithms Implemented

### Item Response Theory (IRT)
- **3-Parameter Logistic Model**: Comprehensive ability estimation
- **Maximum Likelihood Estimation**: Precise ability calculation
- **Fisher Information**: Optimal question selection
- **Adaptive Stopping Criteria**: Efficient assessment completion

### Spaced Repetition
- **SuperMemo 2 Algorithm**: Proven memory consolidation
- **Performance-Based Adjustment**: Dynamic difficulty scaling
- **Retention Optimization**: Scientific review scheduling
- **Forgetting Curve Integration**: Memory science application

### Machine Learning
- **Engagement Prediction**: Real-time attention monitoring
- **Learning Path Optimization**: Personalized curriculum generation
- **Content Recommendation**: Intelligent resource discovery
- **Performance Prediction**: Outcome forecasting

## 🛠️ Development

### Code Structure
- **Modular Architecture**: Clear separation of concerns
- **Async/Await**: High-performance async operations
- **Type Hints**: Full type safety with Pydantic
- **Error Handling**: Comprehensive exception management
- **Logging**: Structured logging throughout

### Testing
```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test categories
pytest tests/test_ai_services/
pytest tests/test_assessment/
```

### Code Quality
```bash
# Format code
black app/

# Lint code
flake8 app/

# Type checking
mypy app/
```

## 📊 Monitoring & Analytics

### Health Monitoring
- Service health checks at `/health`
- Real-time service status monitoring
- Automatic service recovery
- Performance metrics tracking

### Learning Analytics
- Real-time progress tracking
- Engagement pattern analysis
- Performance prediction models
- Retention rate optimization

### System Metrics
- API response times
- Service availability
- Error rate monitoring
- Resource utilization

## 🔒 Security

### Authentication
- Firebase Authentication integration
- JWT token validation
- Secure session management
- Role-based access control

### Data Protection
- Input validation with Pydantic
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting

## 🚀 Deployment

### Production Setup
1. Set `DEBUG=False` in environment
2. Configure production database
3. Set up reverse proxy (nginx)
4. Configure SSL certificates
5. Set up monitoring and logging

### Docker Deployment
```bash
# Build Docker image
docker build -t edtech-platform .

# Run container
docker run -d -p 8000:8000 --env-file .env edtech-platform
```

### Cloud Deployment
- AWS ECS/EKS
- Google Cloud Run
- Azure Container Instances
- Heroku (with proper configuration)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/docs`
- Review the configuration in `.env.template`

---

**Built with ❤️ using Python, FastAPI, and cutting-edge AI technologies**
