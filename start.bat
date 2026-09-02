@echo off
setlocal enabledelayedexpansion
title Voxel Verse — 3D Browser Voxel Survival Odyssey

:: Navigate to project directory
cd /d "%~dp0"

echo ============================================================
echo   VOXEL VERSE - Windows One-Click Launcher
echo   Developer: MOHAMMAD FAHAD
echo   Repository: https://github.com/Dr-MrBot/Voxel_Verse.git
echo ============================================================
echo.

echo Checking requirements...

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js was not detected on your system.
    echo Attempting automatic installation of Node.js LTS via winget...
    echo.
    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        echo Running Windows Package Manager (winget)...
        winget install OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
        
        :: Refresh PATH for current session
        if exist "C:\Program Files\nodejs" (
            set "PATH=C:\Program Files\nodejs;%PATH%"
        )
        if exist "%LocalAppData%\Programs\nodejs" (
            set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
        )
        where node >nul 2>nul
        if !errorlevel! neq 0 (
            echo.
            echo [NOTE] Node.js installation finished, but a terminal restart may be needed.
            echo If this window fails, please close it and double-click start.bat again.
        )
    ) else (
        echo [ERROR] winget is not available on this Windows installation.
        echo Please manually download and install Node.js LTS from:
        echo https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
)

:: 2. Verify Node and npm
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js command 'node' is still not accessible.
    echo Please install Node.js from https://nodejs.org/ and run start.bat again.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
for /f "tokens=*" %%v in ('npm -v 2^>nul') do set "NPM_VER=%%v"

echo Node.js detected: %NODE_VER%
echo npm detected:     v%NPM_VER%
echo.

:: 3. Check for package.json
if not exist "package.json" (
    echo [ERROR] package.json was not found in:
    echo %~dp0
    echo Please make sure start.bat is located in the root folder of Voxel Verse.
    echo.
    pause
    exit /b 1
)

:: 4. Check & install dependencies
if not exist "node_modules" (
    echo Installing dependencies (first run only)...
    call npm install
    if !errorlevel! neq 0 (
        echo.
        echo [ERROR] npm install encountered an error.
        echo Please check your internet connection and try again.
        pause
        exit /b 1
    )
    echo Dependencies successfully installed.
    echo.
) else (
    echo Dependencies verified.
)

:: 5. Start Voxel Verse development server & open browser
echo.
echo Starting Voxel Verse...
echo Opening browser at http://localhost:5173...
echo.
echo ------------------------------------------------------------
echo Server is running. Press Ctrl+C in this window to stop.
echo ------------------------------------------------------------
echo.

:: Launch Vite with automatic browser open
call npm run dev -- --open

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Voxel Verse server exited unexpectedly.
    pause
)
