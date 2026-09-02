@echo off
setlocal enabledelayedexpansion
title Voxel Verse — 3D Browser Voxel Odyssey

:: Change working directory to script folder
cd /d "%~dp0"

:: Set console text color (Bright White on Dark Blue / Modern Dark Cyan)
color 0B

cls
echo.
echo  ======================================================================
echo     __     __              _   __     __
echo     \ \   / /__  _  _____ ^| ^|  \ \   / /__ _ __ ___  ___
echo      \ \ / / _ \^| \/ / _ \^| ^|   \ \ / / _ \ '__/ __^|/ _ \
echo       \ V / (_) ^>  ^<  __/^| ^|__  \ V /  __/ ^|  \__ \  __/
echo        \_/ \___/_/\_\___^|_____^|  \_/ \___^|_^|  ^|___/\___^|
echo.
echo                 3D BROWSER VOXEL SURVIVAL ODYSSEY
echo.
echo   Developer : MOHAMMAD FAHAD
echo   Repository: https://github.com/Dr-MrBot/Voxel_Verse.git
echo  ======================================================================
echo.

:: ---------------------------------------------------------
:: 1. System Requirements & Node.js Verification
:: ---------------------------------------------------------
echo  [*] [1/3] Checking System Requirements...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  [!] Node.js was not detected on this system.
    echo  [*] Attempting automatic installation of Node.js LTS via winget...
    echo.
    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        echo  [*] Running Windows Package Manager...
        winget install OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
        
        :: Refresh PATH for common installation directories
        if exist "C:\Program Files\nodejs" set "PATH=C:\Program Files\nodejs;%PATH%"
        if exist "%LocalAppData%\Programs\nodejs" set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
        
        where node >nul 2>nul
        if !errorlevel! neq 0 (
            echo.
            echo  [!] Node.js was installed, but Windows requires a quick terminal restart.
            echo  [!] Please close this window and double-click start.bat again.
            echo.
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo  [ERROR] winget is unavailable on this system.
        echo  Please download and install Node.js LTS from:
        echo  https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
for /f "tokens=*" %%v in ('npm -v 2^>nul') do set "NPM_VER=%%v"

echo       [+] Node.js  : %NODE_VER% (Detected)
echo       [+] npm CLI  : v%NPM_VER% (Detected)
echo.

:: ---------------------------------------------------------
:: 2. Project Files & Dependencies Verification
:: ---------------------------------------------------------
echo  [*] [2/3] Verifying Project Dependencies...

if not exist "package.json" (
    echo.
    echo  [ERROR] package.json not found in %~dp0
    echo  Please ensure start.bat is inside the project root folder.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo       [*] First-time launch: Installing dependencies with npm...
    call npm install
    if !errorlevel! neq 0 (
        echo.
        echo  [ERROR] npm install failed. Please check your internet connection.
        echo.
        pause
        exit /b 1
    )
    echo       [+] Dependencies installed successfully.
) else (
    echo       [+] Dependencies verified.
)
echo.

:: ---------------------------------------------------------
:: 3. Launch Development Server & Open Browser
:: ---------------------------------------------------------
echo  [*] [3/3] Starting Local Server ^& Launching Game...
echo.
echo  ======================================================================
echo    GAME CONTROLS QUICK REFERENCE:
echo     - WASD        : Move ^& Strafe
echo     - Space       : Jump / Ascend (Flight)
echo     - Shift       : Sneak / Descend (Flight)
echo     - Left-Click  : Mine / Attack (Hold to mine blocks)
echo     - Right-Click : Place Block / Interact / Open Doors
echo     - E           : Inventory ^& Crafting / Creative Catalog
echo     - F5          : Toggle First-Person / Third-Person Camera
echo     - F           : Toggle Creative Flight Mode
echo     - Q           : Drop Selected Hotbar Item
echo     - Esc         : Pause Game
echo  ======================================================================
echo.
echo   Local Address : http://localhost:5173/
echo   Server Status : ACTIVE
echo   (Press Ctrl+C in this terminal window to stop the server)
echo.

:: Start Vite dev server with automatic browser launch
call npm run dev -- --open

if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] The game server stopped unexpectedly.
    pause
)
