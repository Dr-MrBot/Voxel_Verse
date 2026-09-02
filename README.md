# 🌐 Voxel Verse — 3D Browser Voxel Survival Odyssey

[![Developer](https://img.shields.io/badge/Developer-MOHAMMAD%20FAHAD-00e5ff?style=for-the-badge&logo=github)](https://github.com/Dr-MrBot/Voxel_Verse.git)
[![Engine](https://img.shields.io/badge/Engine-Three.js%20(WebGL)-ff007f?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Audio](https://img.shields.io/badge/Audio-Web%20Audio%20API-4caf50?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Storage](https://img.shields.io/badge/Database-IndexedDB-ff9800?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Web-blue?style=for-the-badge&logo=windows)](https://github.com/Dr-MrBot/Voxel_Verse.git)

**Voxel Verse** is an original, fully playable 3D browser-based voxel survival and creative sandbox game. Built completely from the ground up using **Vanilla JavaScript (ES Modules)**, **Three.js (WebGL)**, and the **Web Audio API**, Voxel Verse delivers a complete voxel survival odyssey right inside any modern web browser — with **zero external plugins, zero proprietary Minecraft assets, and zero heavyweight runtime dependencies**.

---

## 📑 Table of Contents
1. [Overview & Philosophy](#-overview--philosophy)
2. [Core Game Features](#-core-game-features)
3. [Deep Dive: Animation Systems](#-deep-dive-animation-systems)
4. [Game Modes: Survival vs. Creative](#-game-modes-survival-vs-creative)
5. [Physics & Mining System](#-physics--mining-system)
6. [Interactive World Objects](#-interactive-world-objects)
7. [Wildlife & Hostile Creature AI](#-wildlife--hostile-creature-ai)
8. [Procedural Audio Engine](#-procedural-audio-engine)
9. [World Persistence & Saving](#-world-persistence--saving)
10. [Windows One-Click Launcher](#-windows-one-click-launcher)
11. [Manual Developer Installation](#-manual-developer-installation)
12. [Controls Quick Reference](#-controls-quick-reference)
13. [Project Directory Architecture](#-project-directory-architecture)
14. [Troubleshooting Guide](#-troubleshooting-guide)
15. [Developer Credits & Attribution](#-developer-credits--attribution)

---

## 🌟 Overview & Philosophy

Voxel Verse is designed as a pure, lightweight, yet visually stunning voxel sandbox:
- **100% Original Codebase**: Every subsystem — from terrain noise and chunk face-culling meshing to the procedural pixel-art texture atlas and audio synthesizer — was created from scratch.
- **Hardware-Accelerated WebGL**: Renders thousands of voxels smoothly at 60 FPS using instanced chunk buffer geometries with ambient occlusion vertex shading.
- **Immediate Playability**: Includes a Windows One-Click Launcher (`start.bat`) that automatically handles Node.js installation, dependency resolution, and browser launching.

---

## 🎮 Core Game Features

### 🌍 Infinite Procedural Terrain & Biomes
- **Simplex Noise with FBM**: Multi-octave continuous heightmaps generate natural topography with rolling hills, continental landmasses, and deep ocean basins.
- **9 Distinct Biomes**:
  - **Plains**: Lush green meadows populated with wild boars, stags, and colorful flowers.
  - **Forest**: Dense oak forests with thick leaf canopies and fallen logs.
  - **Birch Woods**: Light birch groves with tall white-barked trees.
  - **Pine Mountains**: Alpine peaks cloaked in evergreen conifers.
  - **Desert**: Rolling sand dunes punctuated by tall saguaro-like cacti.
  - **Snow Peaks**: High-altitude mountains covered in snow blocks and ice.
  - **Swamp**: Muddy wetlands with standing water and dark vegetation.
  - **Ocean & Beaches**: Sandy shorelines transitioning into vast, translucent blue seas.
- **3D Caves & Underground Caverns**: Continuous 3D noise tunnels carve subterranean cave systems, revealing hidden ravines and rich mineral seams.
- **Ore Strata**: Coal, Copper, Iron, Gold, Red Crystal, and Radiant Gem veins nestled inside stone layers at realistic depths.

---

## 🏃 Deep Dive: Animation Systems

Voxel Verse features a rich suite of skeletal and procedural animation systems designed to make character movement, world interactions, and combat feel alive, fluid, and responsive:

| Animation System | Implementation Details |
| :--- | :--- |
| **Idle Breathing** | When standing still, the character's torso and head execute a gentle sinusoidal vertical oscillation (`y += sin(t * 3.0) * 0.05`), simulating relaxed breathing. |
| **Walking & Sprinting Cycle** | Arms and legs oscillate with an alternating counter-phase pendulum swing. When sprinting, the oscillation frequency increases from `8.5 rad/s` to `14.0 rad/s` with a wider limb swing amplitude (`±0.65 rad`). |
| **Airborne Jump & Fall** | When leaving the ground, legs bend dynamically into a jump tuck pose (`legLeft: +0.35 rad`, `legRight: -0.25 rad`), while arms raise upward to react to momentum. |
| **First-Person Tool Overlay** | In first-person mode, the player's right hand and equipped 3D tool are visible in the lower-right viewport. During movement, the hand gently bobs in a figure-8 walking pattern. |
| **Mining & Attack Swing** | When holding left-click, the player's right arm (in third-person) and the viewport tool (in first-person) perform a forceful vertical chopping arc at a natural human cadence of **3.1 swings per second** (`0.32s` per stroke). |
| **Damage Flinch & Hit Flash** | Taking damage triggers a high-priority flinch animation: all character mesh materials flash bright crimson red for `0.20s`, accompanied by an audible pain sound. |
| **3D Floating Item Drops** | Dropped item entities hover in the world while rotating a full 360° on the Y-axis (`2.5 rad/s`), accompanied by a gentle vertical floating bob (`sin(age * 4.0) * 0.08m`). |
| **Progressive Block Cracking** | Blocks under mining display a 3D wireframe fissure overlay whose opacity scales progressively from `0.15` to `0.85` as break progress approaches completion. |
| **Creature Locomotion** | Quadrupeds (Stag, Boar, Ram) alternate front and rear leg pairs during movement; Meadowbirds hop rhythmically along the terrain and flutter their wings. |
| **UI Micro-Animations** | Item pickups trigger right-side toast badges that slide in smoothly (`slideInRight`), stack consecutive collections (e.g., `+12 Stone`), and fade upwards before removal. |

---

## ⚔️ Game Modes: Survival vs. Creative

| Feature | 🏕️ Survival Mode | ✨ Creative Mode |
| :--- | :--- | :--- |
| **Health System** | 20 HP (10 Hearts); damage taken from falls, drowning, and mobs | Infinite / Invulnerable (no health loss) |
| **Hunger System** | 20 Points (10 Drumsticks); food restores hunger; sprint depletes | Disabled (no hunger depletion or starvation) |
| **Flight Mode** | Disabled (normal jumping and swimming) | **Enabled**: Press `F` to fly (Space = Up, Shift = Down) |
| **Mining Speed** | Physics-based duration determined by block hardness & tool tier | Controlled instant break (`0.22s` deliberate cooldown) |
| **Item Consumption** | Blocks and tools are consumed upon placement or usage | Infinite block placement; items are never depleted |
| **Inventory View** | Standard 2×2 Crafting & 36-slot Survival Inventory (`KeyE`) | Dedicated 8-Category Searchable Catalog (`KeyE`) |
| **Tool Durability** | Tools wear down and shatter upon reaching 0 durability | Infinite durability (tools never break) |

---

## ⛏️ Physics & Mining System

Mining in Voxel Verse is calibrated against realistic physical material resistances:

- **Hardness & Tool Matching**:
  - **Dirt / Sand / Gravel**: Mined in **~0.9s** with bare hands; cut in **~0.25s** using a Shovel.
  - **Wood Logs / Planks**: Cut in **~2.8s** bare-handed; chopped in **~1.4s** with a Wooden Axe; **~0.7s** with a Stone Axe.
  - **Stone & Cobblestone**: Requires **~6.5s** with bare hands (and produces no drops without a pickaxe!); mined in **~1.6s** with a Wooden Pickaxe, **~0.8s** with Stone, and **~0.4s** with Iron.
  - **Valuable Ores**: Coal, Iron, Gold, and Gem strata require matching tool tiers to yield drops.
- **Rhythmic Chipping Feedback**: Hitting blocks produces rhythmic audio chips every `0.28s`, while the target block's name appears dynamically in a HUD targeting pill.
- **Swept AABB Collision**: Character movement utilizes axis-separated swept bounding box collision with automatic step-up (`0.6m`) for walking up hills without jumping.

---

## 🚪 Interactive World Objects

- **Clickable Wooden Doors**: Right-click to toggle doors open or closed with sound and collision state updates.
- **Climbable Ladders**: Touch ladders and press forward/jump to ascend vertically.
- **Storage Chests**: Right-click to open a persistent 27-slot chest storage container.
- **Smelting Furnaces**: Place fuel (coal, wood) in the bottom slot and ores in the top slot to smelt ingots.
- **Crafting Workstations**: Right-click Crafting Tables to expand your crafting workspace to 3×3.
- **Sleeping Beds**: Right-click to set your respawn point; automatically skips nighttime to bright morning.

---

## 🐾 Wildlife & Hostile Creature AI

- **Passive Wildlife**:
  - **Forest Stag**: Graceful horned animal wandering meadows.
  - **Wild Boar**: Sturdy passive creature grazing on grass.
  - **Woolly Ram**: Fluffy hillside dweller.
  - **Chirping Meadowbird**: Small bird that hops along the grass and flutters short distances.
- **Hostile Night Monsters**:
  - **Shadow Stalker**: Tall nocturnal entity that pursues players under the cover of night.
  - **Bone Archer**: Ranged skeleton entity that fires projectiles at players.
  - **Toxic Spore**: Explosive plant creature that hisses and flashes before detonating.
  - **Deep Cavern Lurker**: Sturdy underground beast that lurks inside dark stone caves.

---

## 🔊 Procedural Audio Engine

All sound effects in Voxel Verse are generated entirely at runtime through the **Web Audio API synthesizer**:
- **Footsteps**: Modulated white noise bursts with low-pass filtering.
- **Chipping / Mining**: Resonant bandpass pulses tailored to stone, wood, dirt, and grass sounds.
- **Block Placing**: Soft low-frequency percussive thuds.
- **Tool Breakage**: High-frequency glass-like shattering sound.
- **Level Up**: Ascending arpeggio chime with harmonic overtones.
- **Pain & Hurt**: Downward pitch-swept square wave with noise burst.

---

## 💾 World Persistence & Saving

Voxel Verse utilizes HTML5 **IndexedDB** for seamless, high-capacity offline world storage:
- **World Metadata**: Seed, world name, total play time, and selected game mode.
- **Player State**: XYZ position coordinates, camera rotation, current health, hunger, level, XP, and equipped inventory slots.
- **Voxel Deltas**: Only player-modified blocks (placed or broken) are serialized as sparse coordinate maps (`x,y,z -> blockId`), ensuring save files remain under a few kilobytes.
- **Container Contents**: Every chest and furnace inventory is saved and restored exactly as left.

---

## 🪟 Windows One-Click Launcher

The repository includes a dedicated Windows launcher script: **`start.bat`**

### What `start.bat` Does Automatically:
1. **Checks for Node.js**: Verifies if `node` and `npm` are installed.
2. **Auto-Installs Node.js LTS**: If missing, automatically downloads and installs Node.js LTS via the Windows Package Manager (`winget`).
3. **Refreshes Environment Paths**: Instantly updates system PATH in the running session.
4. **Installs Dependencies**: Runs `npm install` only on first launch or if `node_modules` is missing.
5. **Starts Local Dev Server**: Boots up the Vite development server.
6. **Opens Default Browser**: Automatically launches your default web browser at `http://localhost:5173/`.
7. **Organized Terminal Interface**: Displays a clean, ASCII-boxed status interface with quick controls reminders.

### How to Run:
```cmd
1. Open the Voxel_Verse project folder.
2. Double-click "start.bat".
3. Enjoy the game!
```

---

## 💻 Manual Developer Installation

If you prefer using the terminal or are running on macOS/Linux:

```bash
# 1. Clone the repository
git clone https://github.com/Dr-MrBot/Voxel_Verse.git

# 2. Enter directory
cd Voxel_Verse

# 3. Install dependencies
npm install

# 4. Start local development server with auto-browser launch
npm run dev -- --open
```

To create an optimized production bundle:
```bash
npm run build
```

---

## ⌨️ Controls Quick Reference

| Key / Input | Action |
| :--- | :--- |
| **W, A, S, D** | Move Forward / Left / Backward / Right |
| **Mouse Move** | Look around (Pointer Lock) |
| **Left-Click (Hold)** | Mine targeted block / Attack creatures |
| **Right-Click** | Place block / Interact (Chest, Furnace, Door, Bed) |
| **Space** | Jump / Swim upward *(Ascend vertically when flying)* |
| **Shift** | Sneak / Sprint *(Descend vertically when flying)* |
| **E** | Open Inventory & Crafting *(Survival)* / Open Item Catalog *(Creative)* |
| **F5** | Toggle First-Person / Third-Person Camera View |
| **F** | Toggle Creative Flight Mode *(Creative Mode only)* |
| **Q** | Drop selected hotbar item into the world |
| **1 – 9 Keys** | Select Hotbar slots 1 through 9 |
| **Mouse Wheel** | Scroll through Hotbar items |
| **Escape** | Pause game / Close open modals |

---

## 📁 Project Directory Architecture

```text
Voxel_Verse/
├── start.bat                    # Windows 10/11 One-Click Launcher
├── README.md                    # Comprehensive documentation
├── package.json                 # Project configuration & Vite scripts
├── index.html                   # HTML5 shell & WebGL canvas container
├── .gitignore                   # Ignores node_modules, dist, and logs
└── src/
    ├── main.js                  # Application entry point
    ├── style.css                # Glassmorphic UI styles, HUD, and catalog themes
    ├── blocks/
    │   ├── BlockRegistry.js     # 35+ voxel definitions, hardness, and drop tables
    │   └── TextureAtlas.js      # Procedural 256×256 canvas pixel-art atlas generator
    ├── items/
    │   ├── ItemRegistry.js      # Item definitions, tool tiers, food, and weapons
    │   └── DroppedItem.js       # 3D floating voxel drops with physics and magnet pickup
    ├── player/
    │   ├── Player.js            # Player controller, stats, flight, and camera
    │   ├── PlayerModel.js       # 3D voxel character model and limb animation engine
    │   ├── Physics.js           # Swept AABB collision, step-up, and DDA raycasting
    │   └── BlockInteractions.js # Mining physics, block placement, and door toggling
    ├── world/
    │   ├── World.js             # Chunk manager, lazy streaming, and save integration
    │   ├── Chunk.js             # 16×16×64 chunk voxel mesher with ambient occlusion
    │   ├── TerrainGenerator.js  # Procedural Simplex noise, 3D caves, and trees
    │   ├── BiomeRegistry.js     # Biome climate, surface, and vegetation registry
    │   └── SkyAndWeather.js     # Celestial day/night cycle, stars, and rain particles
    ├── crafting/
    │   ├── RecipeRegistry.js    # 2×2 and 3×3 crafting recipe matcher
    │   └── FurnaceSystem.js     # Smelting timers and fuel combustion logic
    ├── mobs/
    │   └── Mob.js               # 3D voxel wildlife and hostile creature AI
    ├── core/
    │   ├── Game.js              # Central game coordinator and state machine
    │   ├── InputManager.js      # Pointer lock, mouse look, and keyboard listeners
    │   ├── AudioManager.js      # Procedural Web Audio API sound synthesizer
    │   └── SaveSystem.js        # IndexedDB & LocalStorage world persistence
    └── ui/
        ├── HUD.js               # Crosshair, hearts, drumsticks, XP, and pickup feed
        ├── InventoryUI.js       # 2×2 & 3×3 crafting, chests, and furnaces
        ├── CreativeInventoryUI.js # Tabbed Creative item catalog with real-time search
        └── MenuUI.js            # Title screen, world creator, pause, settings, credits
```

---

## 🔧 Troubleshooting Guide

### 1. `winget` Is Unavailable on Windows
If `start.bat` displays an error about `winget`:
- Download and install **Node.js LTS** manually from [https://nodejs.org/](https://nodejs.org/).
- Ensure the option **"Add to PATH"** is selected during setup.
- Re-run `start.bat`.

### 2. Port 5173 Is Already in Use
- If another process is using port 5173, Vite automatically selects the next available port (e.g., `5174`).
- Check the terminal output for the active URL.

### 3. Black Screen or WebGL Unsupported
- Verify hardware acceleration is enabled in your browser settings (**Settings > System > Use hardware acceleration when available**).
- Open `chrome://gpu` (in Chrome/Edge) to verify WebGL 2.0 status.
- Update your GPU drivers to the latest version.

### 4. Browser Does Not Open Automatically
- If your default browser fails to launch, open any modern browser and navigate manually to:
  ```
  http://localhost:5173/
  ```

---

## 👨‍💻 Developer Credits & Attribution

- **Creator & Lead Developer**: **MOHAMMAD FAHAD**
- **Project**: **Voxel Verse**
- **Official GitHub Repository**: [https://github.com/Dr-MrBot/Voxel_Verse.git](https://github.com/Dr-MrBot/Voxel_Verse.git)

---

## 📄 Intellectual Property & Originality Notice

Voxel Verse is an independent, original open-source voxel sandbox game. All procedural generation algorithms, texture synthesis shaders, Web Audio synthesizer routines, 3D character models, and gameplay logic were engineered specifically for this project. It does not contain or copy proprietary textures, audio files, code, or trademarks from Minecraft or Mojang Studios.