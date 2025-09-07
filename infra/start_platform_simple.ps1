# EdTech Platform Complete Startup Script (Windows PowerShell)
# This script starts all components of the EdTech platform in the correct order

Write-Host "Starting Complete EdTech Platform..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Function to print colored output
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

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

try {
    # Step 1: Start Backend API (Node.js)
    Write-Info "Step 1: Starting Backend API (Node.js)..."
    
    $backendPath = Join-Path $BaseDir "backend"
    if (Test-Path $backendPath) {
        if (Test-Path (Join-Path $backendPath "package.json")) {
            Write-Info "Starting backend server in new window..."
            
            $backendArgs = @(
                "-NoExit",
                "-Command",
                "Set-Location '$backendPath'; `$Host.UI.RawUI.WindowTitle = 'EdTech Backend API'; npm start"
            )
            
            $backendProcess = Start-Process "powershell.exe" -ArgumentList $backendArgs -WindowStyle Normal -PassThru
            
            # Wait for backend to be ready
            Start-Sleep -Seconds 10
            Write-Success "Backend API starting..."
        } else {
            Write-Error "Backend package.json not found"
            exit 1
        }
    } else {
        Write-Error "Backend directory not found at $backendPath"
        exit 1
    }

    # Step 2: Start AI Services (Python FastAPI)
    Write-Info "Step 2: Starting AI Services (Python FastAPI)..."
    
    $aiServicesPath = Join-Path $BaseDir "edtech_platform"
    if (Test-Path $aiServicesPath) {
        if (Test-Path (Join-Path $aiServicesPath "main.py")) {
            Write-Info "Starting AI services in new window..."
            
            $aiArgs = @(
                "-NoExit",
                "-Command",
                "Set-Location '$aiServicesPath'; `$Host.UI.RawUI.WindowTitle = 'EdTech AI Services'; python main.py"
            )
            
            $aiProcess = Start-Process "powershell.exe" -ArgumentList $aiArgs -WindowStyle Normal -PassThru
            
            # Wait for AI services
            Start-Sleep -Seconds 10
            Write-Success "AI Services starting..."
        } else {
            Write-Error "AI Services main.py not found"
            exit 1
        }
    } else {
        Write-Error "AI Services directory not found at $aiServicesPath"
        exit 1
    }

    # Step 3: Start Frontend (React)
    Write-Info "Step 3: Starting Frontend (React)..."
    
    $frontendPath = Join-Path $BaseDir "frontend"
    if (Test-Path $frontendPath) {
        if (Test-Path (Join-Path $frontendPath "package.json")) {
            Write-Info "Starting React application in new window..."
            
            $frontendArgs = @(
                "-NoExit",
                "-Command",
                "Set-Location '$frontendPath'; `$Host.UI.RawUI.WindowTitle = 'EdTech Frontend React App'; npm start"
            )
            
            $frontendProcess = Start-Process "powershell.exe" -ArgumentList $frontendArgs -WindowStyle Normal -PassThru
            
            # Wait for frontend
            Start-Sleep -Seconds 15
            Write-Success "Frontend Application starting..."
        } else {
            Write-Error "Frontend package.json not found"
            exit 1
        }
    } else {
        Write-Error "Frontend directory not found at $frontendPath"
        exit 1
    }

    # Step 4: Start Admin Panel (Flask)
    Write-Info "Step 4: Starting Admin Panel (Flask)..."
    
    $adminPath = Join-Path $BaseDir "admin_panel"
    if (Test-Path $adminPath) {
        if (Test-Path (Join-Path $adminPath "app.py")) {
            Write-Info "Starting admin panel in new window..."
            
            $adminArgs = @(
                "-NoExit",
                "-Command",
                "Set-Location '$adminPath'; `$Host.UI.RawUI.WindowTitle = 'EdTech Admin Panel'; python app.py"
            )
            
            $adminProcess = Start-Process "powershell.exe" -ArgumentList $adminArgs -WindowStyle Normal -PassThru
            
            # Wait for admin panel
            Start-Sleep -Seconds 10
            Write-Success "Admin Panel starting..."
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
    Write-Host "EdTech Platform Successfully Starting!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "  • Main Application:    http://localhost:3000" -ForegroundColor White
    Write-Host "  • Backend API:         http://localhost:3001" -ForegroundColor White  
    Write-Host "  • AI Services:         http://localhost:8000" -ForegroundColor White
    Write-Host "  • Admin Panel:         http://localhost:5000" -ForegroundColor White
    Write-Host ""
    Write-Host "Key Features Available:" -ForegroundColor Cyan
    Write-Host "  - User Authentication (Firebase)" -ForegroundColor Green
    Write-Host "  - AI Chat Overlay (Gemini LLM)" -ForegroundColor Green
    Write-Host "  - Adaptive Assessment Engine" -ForegroundColor Green
    Write-Host "  - Spaced Repetition System" -ForegroundColor Green
    Write-Host "  - Real-time Learning Analytics" -ForegroundColor Green
    Write-Host "  - Content Processing Pipeline" -ForegroundColor Green
    Write-Host ""
    Write-Host "Opening Main Application..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:3000"
    
    Write-Host "All services are starting! Each service is running in its own window." -ForegroundColor Green
    Write-Host "You can close this window safely - services will continue running." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To stop all services, close the individual PowerShell windows." -ForegroundColor Red
    
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
