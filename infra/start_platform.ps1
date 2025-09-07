# EdTech Platform Complete Startup Script (Windows PowerShell)
# This script starts all components of the EdTech platform in the correct order

Write-Host "🎓 Starting Complete EdTech Platform..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Function to print colored output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Blue }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# Set base directory
$BaseDir = "D:\error_404"

# Function to wait for service to be ready
function Wait-ForService {
    param($Url, $Name)
    
    Write-Info "Waiting for $Name to be ready..."
    $maxAttempts = 30
    $attempt = 1
    
    do {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Success "$Name is ready!"
                return $true
            }
        }
        catch {
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 2
            $attempt++
        }
    } while ($attempt -le $maxAttempts)
    
    Write-Error "$Name failed to start within 60 seconds"
    return $false
}

# Function to start a process in a new window
function Start-ServiceInNewWindow {
    param($Title, $WorkingDirectory, $Command, $Arguments)
    
    $processArgs = @{
        FilePath = "powershell.exe"
        ArgumentList = @(
            "-NoExit",
            "-Command",
            "& { Set-Location '$WorkingDirectory'; $Host.UI.RawUI.WindowTitle = '$Title'; $Command $Arguments }"
        )
        WindowStyle = "Normal"
    }
    
    return Start-Process @processArgs -PassThru
}

try {
    # Step 1: Start Backend API (Node.js)
    Write-Info "🔧 Step 1: Starting Backend API (Node.js)..."
    
    $backendPath = Join-Path $BaseDir "backend"
    if (Test-Path $backendPath) {
        if (Test-Path (Join-Path $backendPath "package.json")) {
            Write-Info "Starting backend server in new window..."
            
            $backendProcess = Start-ServiceInNewWindow `
                -Title "EdTech Backend API" `
                -WorkingDirectory $backendPath `
                -Command "npm" `
                -Arguments "start"
            
            # Wait for backend to be ready
            if (Wait-ForService "http://localhost:3001/health" "Backend API") {
                Write-Success "Backend API started successfully"
            }
        } else {
            Write-Error "Backend package.json not found"
            exit 1
        }
    } else {
        Write-Error "Backend directory not found at $backendPath"
        exit 1
    }

    # Step 2: Start AI Services (Python FastAPI)
    Write-Info "🤖 Step 2: Starting AI Services (Python FastAPI)..."
    
    $aiServicesPath = Join-Path $BaseDir "services"
    if (Test-Path $aiServicesPath) {
        if (Test-Path (Join-Path $aiServicesPath "main.py")) {
            Write-Info "Starting AI services in new window..."
            
            $aiProcess = Start-ServiceInNewWindow `
                -Title "EdTech AI Services" `
                -WorkingDirectory $aiServicesPath `
                -Command "python" `
                -Arguments "main.py"
            
            # Wait for AI services to be ready
            if (Wait-ForService "http://localhost:8000/health" "AI Services") {
                Write-Success "AI Services started successfully"
            }
        } else {
            Write-Error "AI Services main.py not found"
            exit 1
        }
    } else {
        Write-Error "AI Services directory not found at $aiServicesPath"
        exit 1
    }

    # Step 3: Start Frontend (React)
    Write-Info "🎨 Step 3: Starting Frontend (React)..."
    
    $frontendPath = Join-Path $BaseDir "frontend"
    if (Test-Path $frontendPath) {
        if (Test-Path (Join-Path $frontendPath "package.json")) {
            Write-Info "Starting React application in new window..."
            
            $frontendProcess = Start-ServiceInNewWindow `
                -Title "EdTech Frontend React App" `
                -WorkingDirectory $frontendPath `
                -Command "npm" `
                -Arguments "start"
            
            # Wait for frontend to be ready
            if (Wait-ForService "http://localhost:3000" "Frontend Application") {
                Write-Success "Frontend Application started successfully"
            }
        } else {
            Write-Error "Frontend package.json not found"
            exit 1
        }
    } else {
        Write-Error "Frontend directory not found at $frontendPath"
        exit 1
    }

    # Step 4: Start Admin Panel (Flask)
    Write-Info "👨‍💼 Step 4: Starting Admin Panel (Flask)..."
    
    # Admin panel is now integrated into backend
    # $adminPath = Join-Path $BaseDir "admin_panel"
    if (Test-Path $adminPath) {
        if (Test-Path (Join-Path $adminPath "app.py")) {
            Write-Info "Starting admin panel in new window..."
            
            $adminProcess = Start-ServiceInNewWindow `
                -Title "EdTech Admin Panel" `
                -WorkingDirectory $adminPath `
                -Command "python" `
                -Arguments "app.py"
            
            # Wait for admin panel to be ready
            if (Wait-ForService "http://localhost:5000" "Admin Panel") {
                Write-Success "Admin Panel started successfully"
            }
        } else {
            Write-Error "Admin Panel app.py not found"
            exit 1
        }
    } else {
        Write-Error "Admin Panel directory not found at $adminPath"
        exit 1
    }

    # Display system status
    Write-Host ""
    Write-Host "🎉 EdTech Platform Successfully Started!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Access Points:" -ForegroundColor Cyan
    Write-Host "  • Main Application:    http://localhost:3000" -ForegroundColor White
    Write-Host "  • Backend API:         http://localhost:3001" -ForegroundColor White  
    Write-Host "  • AI Services:         http://localhost:8000" -ForegroundColor White
    Write-Host "  • Admin Panel:         http://localhost:5000" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 API Documentation:" -ForegroundColor Cyan
    Write-Host "  • Backend API:         http://localhost:3001/api-docs" -ForegroundColor White
    Write-Host "  • AI Services:         http://localhost:8000/docs" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Health Checks:" -ForegroundColor Cyan
    Write-Host "  • Backend Health:      http://localhost:3001/health" -ForegroundColor White
    Write-Host "  • AI Services Health:  http://localhost:8000/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Key Features Available:" -ForegroundColor Cyan
    Write-Host "  ✅ User Authentication (Firebase)" -ForegroundColor Green
    Write-Host "  ✅ AI Chat Overlay (Gemini LLM)" -ForegroundColor Green
    Write-Host "  ✅ Adaptive Assessment Engine" -ForegroundColor Green
    Write-Host "  ✅ Spaced Repetition System" -ForegroundColor Green
    Write-Host "  ✅ Real-time Learning Analytics" -ForegroundColor Green
    Write-Host "  ✅ Content Processing Pipeline" -ForegroundColor Green
    Write-Host "  ✅ Personalized Learning Paths" -ForegroundColor Green
    Write-Host "  ✅ Gamification & Social Learning" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎥 Content Processing:" -ForegroundColor Cyan
    Write-Host "  Usage: python $BaseDir\microlearning_content_processor\processor.py `"video.mp4`" `"Course`" `"Module`" `"Instructor`"" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Opening Main Application..." -ForegroundColor Yellow
    Start-Process "http://localhost:3000"
    
    Write-Host "✨ All services are running! Each service is running in its own window." -ForegroundColor Green
    Write-Host "   You can close this window safely - services will continue running." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🛑 To stop all services, close the individual PowerShell windows or run:" -ForegroundColor Red
    Write-Host "   Get-Process *node*,*python* | Stop-Process -Force" -ForegroundColor Gray
    
    # Keep this window open to show status
    Write-Host ""
    Write-Host "Press Enter to exit this status window (services will continue running)..." -ForegroundColor Yellow
    Read-Host

} catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Press Enter to exit..." -ForegroundColor Yellow
    Read-Host
    exit 1
}
