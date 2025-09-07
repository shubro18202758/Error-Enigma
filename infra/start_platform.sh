#!/bin/bash

# EdTech Platform Complete Startup Script
# This script starts all components of the EdTech platform in the correct order

echo "🎓 Starting Complete EdTech Platform..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running on Windows (Git Bash/WSL)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    print_info "Detected Windows environment"
    BASE_DIR="/d/error_404"
else
    BASE_DIR="$(pwd)"
fi

# Function to check if a port is available
check_port() {
    local port=$1
    if command -v netstat >/dev/null 2>&1; then
        netstat -an | grep ":$port " >/dev/null 2>&1
        return $?
    else
        # Fallback for systems without netstat
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    print_info "Waiting for $name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_status "$name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$name failed to start within 60 seconds"
    return 1
}

# Step 1: Start Backend API (Node.js)
print_info "🔧 Step 1: Starting Backend API (Node.js)..."
cd "$BASE_DIR/backend" || { print_error "Backend directory not found"; exit 1; }

if [ -f "package.json" ]; then
    print_info "Installing backend dependencies..."
    npm install
    
    print_info "Starting backend server..."
    npm start &
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    wait_for_service "http://localhost:3001/health" "Backend API"
else
    print_error "Backend package.json not found"
    exit 1
fi

# Step 2: Start AI Services (Python FastAPI)
print_info "🤖 Step 2: Starting AI Services (Python FastAPI)..."
cd "$BASE_DIR/edtech_platform" || { print_error "AI Services directory not found"; exit 1; }

if [ -f "main.py" ]; then
    print_info "Installing Python dependencies..."
    pip install -r requirements.txt
    
    print_info "Starting AI services..."
    python main.py &
    AI_PID=$!
    
    # Wait for AI services to be ready
    wait_for_service "http://localhost:8000/health" "AI Services"
else
    print_error "AI Services main.py not found"
    exit 1
fi

# Step 3: Start Frontend (React)
print_info "🎨 Step 3: Starting Frontend (React)..."
cd "$BASE_DIR/frontend" || { print_error "Frontend directory not found"; exit 1; }

if [ -f "package.json" ]; then
    print_info "Installing frontend dependencies..."
    npm install
    
    print_info "Starting React application..."
    npm start &
    FRONTEND_PID=$!
    
    # Wait for frontend to be ready
    wait_for_service "http://localhost:3000" "Frontend Application"
else
    print_error "Frontend package.json not found"
    exit 1
fi

# Step 4: Start Admin Panel (Flask)
print_info "👨‍💼 Step 4: Starting Admin Panel (Flask)..."
cd "$BASE_DIR/admin_panel" || { print_error "Admin Panel directory not found"; exit 1; }

if [ -f "app.py" ]; then
    print_info "Installing admin panel dependencies..."
    pip install -r requirements.txt
    
    print_info "Starting admin panel..."
    python app.py &
    ADMIN_PID=$!
    
    # Wait for admin panel to be ready
    wait_for_service "http://localhost:5000" "Admin Panel"
else
    print_error "Admin Panel app.py not found"
    exit 1
fi

# Display system status
echo ""
echo "🎉 EdTech Platform Successfully Started!"
echo "======================================"
echo ""
echo "📱 Access Points:"
echo "  • Main Application:    http://localhost:3000"
echo "  • Backend API:         http://localhost:3001"
echo "  • AI Services:         http://localhost:8000"
echo "  • Admin Panel:         http://localhost:5000"
echo ""
echo "📚 API Documentation:"
echo "  • Backend API:         http://localhost:3001/api-docs"
echo "  • AI Services:         http://localhost:8000/docs"
echo ""
echo "🔧 Health Checks:"
echo "  • Backend Health:      http://localhost:3001/health"
echo "  • AI Services Health:  http://localhost:8000/health"
echo ""
echo "🎯 Key Features Available:"
echo "  ✅ User Authentication (Firebase)"
echo "  ✅ AI Chat Overlay (Gemini LLM)"
echo "  ✅ Adaptive Assessment Engine"
echo "  ✅ Spaced Repetition System"
echo "  ✅ Real-time Learning Analytics"
echo "  ✅ Content Processing Pipeline"
echo "  ✅ Personalized Learning Paths"
echo "  ✅ Gamification & Social Learning"
echo ""
echo "🎥 Content Processing:"
echo "  Usage: python $BASE_DIR/microlearning_content_processor/processor.py \"video.mp4\" \"Course\" \"Module\" \"Instructor\""
echo ""

# Function to handle cleanup on exit
cleanup() {
    print_info "Shutting down services..."
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        print_status "Frontend stopped"
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        print_status "Backend stopped"
    fi
    
    if [ ! -z "$AI_PID" ]; then
        kill $AI_PID 2>/dev/null
        print_status "AI Services stopped"
    fi
    
    if [ ! -z "$ADMIN_PID" ]; then
        kill $ADMIN_PID 2>/dev/null
        print_status "Admin Panel stopped"
    fi
    
    print_info "All services stopped. Goodbye!"
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running and show logs
print_info "All services are running. Press Ctrl+C to stop all services."
print_info "Monitoring services... (Check the web interfaces above)"

# Monitor services
while true do
    sleep 30
    
    # Check if services are still running
    if ! curl -s "http://localhost:3001/health" >/dev/null 2>&1; then
        print_warning "Backend API appears to be down"
    fi
    
    if ! curl -s "http://localhost:8000/health" >/dev/null 2>&1; then
        print_warning "AI Services appear to be down"
    fi
    
    if ! curl -s "http://localhost:3000" >/dev/null 2>&1; then
        print_warning "Frontend appears to be down"
    fi
    
    if ! curl -s "http://localhost:5000" >/dev/null 2>&1; then
        print_warning "Admin Panel appears to be down"
    fi
done
