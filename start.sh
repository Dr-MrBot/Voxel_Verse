#!/usr/bin/env bash
# ==============================================================================
#   VOXEL VERSE — Linux & macOS One-Click Launcher
#   Developer : MOHAMMAD FAHAD
#   Repository: https://github.com/Dr-MrBot/Voxel_Verse.git
# ==============================================================================

# Ensure script runs in its own directory
cd "$(dirname "$0")" || exit 1

# Terminal Colors
CYAN='\033[1;36m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear
echo -e "${CYAN}"
echo " ======================================================================"
echo "    __     __              _   __     __"
echo "    \ \   / /__  _  _____ | |  \ \   / /__ _ __ ___  ___"
echo "     \ \ / / _ \| \/ / _ \| |   \ \ / / _ \ '__/ __|/ _ \\"
echo "      \ V / (_) >  <  __/| |__  \ V /  __/ |  \__ \  __/"
echo "       \_/ \___/_/\_\___|_____|  \_/ \___|_|  |___/\___|"
echo ""
echo "                3D BROWSER VOXEL SURVIVAL ODYSSEY"
echo ""
echo "  Developer : MOHAMMAD FAHAD"
echo "  Repository: https://github.com/Dr-MrBot/Voxel_Verse.git"
echo " ======================================================================"
echo -e "${NC}"

# ------------------------------------------------------------------------------
# 1. System Requirements & Node.js Verification
# ------------------------------------------------------------------------------
echo -e "${BOLD}[*] [1/3] Checking System Requirements...${NC}"

if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}[!] Node.js was not detected on this system.${NC}"
    echo -e "${YELLOW}Please install Node.js (v18+) using your package manager:${NC}"
    echo "   - Debian/Ubuntu : sudo apt update && sudo apt install -y nodejs npm"
    echo "   - Fedora/RHEL   : sudo dnf install -y nodejs npm"
    echo "   - Arch Linux    : sudo pacman -S nodejs npm"
    echo "   - macOS (Homebrew): brew install node"
    echo "   - Or install NVM: https://github.com/nvm-sh/nvm"
    echo ""
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo -e "${RED}[!] npm CLI was not detected. Please install npm.${NC}"
    exit 1
fi

NODE_VER=$(node -v 2>/dev/null)
NPM_VER=$(npm -v 2>/dev/null)

echo -e "      ${GREEN}[+] Node.js  : ${NODE_VER} (Detected)${NC}"
echo -e "      ${GREEN}[+] npm CLI  : v${NPM_VER} (Detected)${NC}"
echo ""

# ------------------------------------------------------------------------------
# 2. Project Files & Dependencies Verification
# ------------------------------------------------------------------------------
echo -e "${BOLD}[*] [2/3] Verifying Project Dependencies...${NC}"

if [ ! -f "package.json" ]; then
    echo -e "${RED}[ERROR] package.json not found in $(pwd)${NC}"
    echo "Please make sure start.sh is located in the project root folder."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "      ${YELLOW}[*] First-time launch: Installing dependencies with npm...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] npm install failed. Please check your internet connection.${NC}"
        exit 1
    fi
    echo -e "      ${GREEN}[+] Dependencies installed successfully.${NC}"
else
    echo -e "      ${GREEN}[+] Dependencies verified.${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# 3. Launch Development Server & Open Browser
# ------------------------------------------------------------------------------
echo -e "${BOLD}[*] [3/3] Starting Local Server & Launching Game...${NC}"
echo ""
echo -e "${CYAN}======================================================================${NC}"
echo -e "${BOLD}  GAME CONTROLS QUICK REFERENCE:${NC}"
echo "   - WASD        : Move & Strafe"
echo "   - Space       : Jump / Swim Up (Flight Up in Creative)"
echo "   - Shift       : Sneak with Ledge Protection / Sprint"
echo "   - Left-Click  : Mine Block / Attack Creatures"
echo "   - Right-Click : Place Block / Interact / Open Doors & Chests"
echo "   - E           : Inventory & Crafting / Creative Catalog"
echo "   - F5          : Toggle First-Person / Third-Person Camera"
echo "   - F3          : Toggle Real-time Performance & Coordinate Debug"
echo "   - F           : Toggle Creative Flight Mode"
echo "   - Q           : Drop Selected Hotbar Item"
echo "   - Mouse Wheel : Scroll Hotbar / Zoom 3rd Person View (Hold Right-Click)"
echo "   - Esc         : Pause Game"
echo -e "${CYAN}======================================================================${NC}"
echo ""
echo -e "  Local Address : ${GREEN}http://localhost:5173/${NC}"
echo -e "  Server Status : ${GREEN}ACTIVE${NC}"
echo -e "  (Press ${BOLD}Ctrl+C${NC} in this terminal window to stop the server)"
echo ""

# Start Vite server with automatic browser launch
npm run dev -- --open
