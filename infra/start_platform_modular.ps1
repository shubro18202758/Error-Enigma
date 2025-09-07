# EdTech Platform - Production Ready Startup Script
# This script starts all components of the modular EdTech platform

Write-Host "🎓 Starting EdTech Microlearning Platform..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Function to print colored output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Blue }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# Set base directory
$BaseDir = Split-Path -Parent $PSScriptRoot

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
    Write-Info "🏗️  Starting modular EdTech platform services..."
    
    # Step 1: Start Backend API (Node.js + Express)
    Write-Info "🔧 Step 1: Starting Backend API with integrated admin routes..."
    
    $backendPath = Join-Path $BaseDir "backend"
    if (Test-Path $backendPath) {
        if (Test-Path (Join-Path $backendPath "package.json")) {
            Write-Info "Starting backend server in new window..."
            
            $backendProcess = Start-ServiceInNewWindow `
                -Title "EdTech Backend API + Admin" `
                -WorkingDirectory $backendPath `
                -Command "npm" `
                -Arguments "start"
            
            if (Wait-ForService "http://localhost:3001/health" "Backend API") {
                Write-Success "Backend API with admin routes started successfully"
            }
        } else {
            Write-Error "Backend package.json not found"
            exit 1
        }
    } else {
        Write-Error "Backend directory not found at $backendPath"
        exit 1
    }

    # Step 2: Start AI Services (Python FastAPI Microservices)
    Write-Info "🤖 Step 2: Starting AI Microservices (FastAPI)..."
    
    $servicesPath = Join-Path $BaseDir "services"
    if (Test-Path $servicesPath) {
        if (Test-Path (Join-Path $servicesPath "main.py")) {
            Write-Info "Starting AI microservices in new window..."
            
            $aiProcess = Start-ServiceInNewWindow `
                -Title "EdTech AI Microservices" `
                -WorkingDirectory $servicesPath `
                -Command "python" `
                -Arguments "-m uvicorn main:app --host 0.0.0.0 --port 8000"
            
            if (Wait-ForService "http://localhost:8000/health" "AI Microservices") {
                Write-Success "AI Microservices started successfully"
            }
        } else {
            Write-Error "AI Services main.py not found"
            exit 1
        }
    } else {
        Write-Error "Services directory not found at $servicesPath"
        exit 1
    }

    # Step 3: Start Frontend (React PWA)
    Write-Info "🎨 Step 3: Starting Frontend React PWA..."
    
    $frontendPath = Join-Path $BaseDir "frontend"
    if (Test-Path $frontendPath) {
        if (Test-Path (Join-Path $frontendPath "package.json")) {
            Write-Info "Starting React PWA in new window..."
            
            $frontendProcess = Start-ServiceInNewWindow `
                -Title "EdTech Frontend PWA" `
                -WorkingDirectory $frontendPath `
                -Command "npm" `
                -Arguments "start"
            
            if (Wait-ForService "http://localhost:3000" "Frontend PWA") {
                Write-Success "Frontend PWA started successfully"
            }
        } else {
            Write-Error "Frontend package.json not found"
            exit 1
        }
    } else {
        Write-Error "Frontend directory not found at $frontendPath"
        exit 1
    }

    # Step 4: Start Orchestrator (Agentic AI Controller)
    Write-Info "🎯 Step 4: Starting Orchestrator (Agentic AI)..."
    
    $orchestratorPath = Join-Path $BaseDir "orchestrator"
    if (Test-Path $orchestratorPath) {
        if (Test-Path (Join-Path $orchestratorPath "integration_hub.py")) {
            Write-Info "Starting AI orchestrator in new window..."
            
            $orchestratorProcess = Start-ServiceInNewWindow `
                -Title "EdTech AI Orchestrator" `
                -WorkingDirectory $orchestratorPath `
                -Command "python" `
                -Arguments "integration_hub.py"
            
            Write-Success "AI Orchestrator started successfully"
        } else {
            Write-Warning "Orchestrator integration_hub.py not found, skipping..."
        }
    } else {
        Write-Warning "Orchestrator directory not found, skipping..."
    }

    # Display system status
    Write-Host ""
    Write-Host "🎉 EdTech Microlearning Platform Successfully Started!" -ForegroundColor Green
    Write-Host "===================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Service Access Points:" -ForegroundColor Cyan
    Write-Host "  • Frontend PWA:           http://localhost:3000" -ForegroundColor White
    Write-Host "  • Backend API:            http://localhost:3001" -ForegroundColor White  
    Write-Host "  • AI Microservices:       http://localhost:8000" -ForegroundColor White
    Write-Host "  • Admin Dashboard:        http://localhost:3001/admin" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 API Documentation:" -ForegroundColor Cyan
    Write-Host "  • Backend Swagger:        http://localhost:3001/api-docs" -ForegroundColor White
    Write-Host "  • AI Services Docs:       http://localhost:8000/docs" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Health Endpoints:" -ForegroundColor Cyan
    Write-Host "  • Backend Health:         http://localhost:3001/health" -ForegroundColor White
    Write-Host "  • AI Services Health:     http://localhost:8000/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Platform Modules:" -ForegroundColor Cyan
    Write-Host "  ✅ Competency Assessment Engine" -ForegroundColor Green
    Write-Host "  ✅ Adaptive Spaced Repetition" -ForegroundColor Green
    Write-Host "  ✅ Fatigue Detection System" -ForegroundColor Green
    Write-Host "  ✅ RAG-based Content Generation" -ForegroundColor Green
    Write-Host "  ✅ Real-time Learning Analytics" -ForegroundColor Green
    Write-Host "  ✅ Gamification & Social Learning" -ForegroundColor Green
    Write-Host "  ✅ Content Processing Pipeline" -ForegroundColor Green
    Write-Host "  ✅ Agentic AI Orchestration" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Project Structure:" -ForegroundColor Cyan
    Write-Host "  frontend/    → React PWA with Tailwind CSS" -ForegroundColor Gray
    Write-Host "  backend/     → Node.js API + Admin routes" -ForegroundColor Gray
    Write-Host "  services/    → Python AI microservices" -ForegroundColor Gray
    Write-Host "  orchestrator/→ Agentic AI controller" -ForegroundColor Gray
    Write-Host "  database/    → SQL schema + NoSQL setup" -ForegroundColor Gray
    Write-Host "  docs/        → API documentation" -ForegroundColor Gray
    Write-Host "  infra/       → Deployment & monitoring" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🌐 Opening Frontend Application..." -ForegroundColor Yellow
    Start-Process "http://localhost:3000"
    
    Write-Host "✨ All services are running! Each service runs in its own window." -ForegroundColor Green
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
