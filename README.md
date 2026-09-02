# 🌐 Voxel Verse

[![Developer](https://img.shields.io/badge/Developer-MOHAMMAD%20FAHAD-00e5ff?style=for-the-badge&logo=github)](https://github.com/Dr-MrBot/Voxel_Verse.git)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20%7C%20Web-blue?style=for-the-badge&logo=windows)](https://github.com/Dr-MrBot/Voxel_Verse.git)
[![Engine](https://img.shields.io/badge/Built%20With-Three.js%20%26%20WebGL-ff007f?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-brightgreen?style=for-the-badge)](https://github.com/Dr-MrBot/Voxel_Verse.git)

**Voxel Verse** is an original 3D voxel sandbox adventure game that runs directly in your web browser. Explore infinite procedural mountains, deep caves, and lush forests. Mine ores, craft tools, build shelters, encounter wildlife, or switch to Creative Mode to fly and build freely — with zero installation setup required.

---

## ⚡ Quick Start: How to Play (1-Click Method)

You do **not** need any coding experience to play!

1. **Download or Clone** this repository:
   - Click the green **Code** button at the top of GitHub, then click **Download ZIP**.
   - Extract the ZIP folder anywhere on your computer (e.g. Desktop).
2. Open the **`Voxel_Verse`** folder.
3. Double-click **`start.bat`**.

That's it! The launcher will automatically set up everything needed and open the game directly in your web browser at `http://localhost:5173/`.

---

## 🎮 What You Can Do in the Game

### 🌍 Infinite 3D Worlds & Exploration
- **9 Dynamic Biomes**: Roam through Plains, Oak Forests, Birch Woods, Pine Mountains, Deserts with cacti, Snow Peaks, Swamps, Beaches, and Oceans.
- **Deep Underground Caves**: Dig beneath the surface to explore organic cavern tunnels filled with Coal, Copper, Iron, Gold, and Radiant Gems.

### ⛏️ Realistic Mining & Crafting
- **Physics-Based Mining**: Blocks have realistic durability — punch dirt easily, but use pickaxes to break through hard stone and ores.
- **Crafting & Smelting**: Open your 2×2 inventory crafting grid or use a **Crafting Table** for 3×3 recipes. Smelt ores into ingots using **Furnaces**.
- **Storage & Homes**: Build shelters with working **Wooden Doors** you can click to open, climbable **Ladders**, and **Chests** to store your items.

### 🎒 Survival vs. Creative Modes
- **🏕️ Survival Mode**: Manage your **Health** (10 hearts) and **Hunger** (10 drumsticks). Eat food to regenerate health, avoid fall damage, and watch out for nighttime monsters.
- **✨ Creative Mode**: Fly freely through the sky, break blocks instantly, and press **`E`** to open an infinite catalog of every block and item with a search bar.

### 🐾 Creatures & Wildlife
- **Friendly Wildlife**: Encounter Forest Stags, Wild Boars, Woolly Rams, and hopping Meadowbirds.
- **Nighttime Monsters**: Defend against nocturnal Shadow Stalkers, Bone Archers, Toxic Spores, and cave Lurkers.

### 💾 Automatic Saving
- The game automatically saves your world, player location, inventory, chests, and placed blocks to your browser's local database. When you come back, your world is right where you left it.

---

## ✨ Complete Animation Systems

Voxel Verse features custom skeletal and procedural animations that bring every movement and interaction to life:

### 👤 Player Character Animations
- **Idle Breathing**: Torso and head gently bob up and down with a relaxed breathing rhythm while standing still.
- **Natural Walking & Sprinting**: Alternating pendulum limb swing matching movement speed. Sprinting dynamically increases the swing rate from `8.5` to `14.0 rad/s` with a wider arm-and-leg arc.
- **Airborne Jump & Fall**: When leaping into the air, legs tuck in dynamically while arms raise upward to react to vertical momentum.
- **First-Person Tool Bobbing**: In first-person view, your hand and equipped tool bob in a gentle figure-8 motion as you walk.
- **Mining & Tool Swing Cadence**: Right arm swings in a forceful, natural chopping arc at **3.1 swings per second** (`0.32s` per stroke) in both first-person and third-person modes.
- **Damage Flinch & Red Flash**: Taking damage causes the character to briefly flinch while all model textures flash bright crimson red.

### 🧱 Interactive World & Physics Animations
- **Progressive Block Cracking**: Blocks show visible 3D wireframe fissures that darken and spread as you continue mining them.
- **3D Floating & Spinning Item Drops**: Broken blocks pop out as 3D mini-items that spin 360° continuously while floating up and down on a gentle wave until you pick them up.
- **Celestial Day/Night Cycle**: The sun and moon orbit smoothly across the sky, casting golden-hour sunsets and revealing a twinkling night starfield.

### 🐾 Creature & Wildlife Animations
- **Animal Locomotion**: Four-legged walking cycles for Forest Stags, Wild Boars, and Woolly Rams.
- **Bird Hopping**: Chirping Meadowbirds hop along the grass and flutter their wings as they explore fields.

### 🎨 UI Micro-Animations
- **Item Pickup Notifications**: Collecting items triggers animated badges on the right side of the screen that slide in, stack consecutive pickups (`+12 Stone`), and gently fade away.

---

## ⌨️ Controls Guide

| Key | What It Does |
| :--- | :--- |
| **W, A, S, D** | Walk Forward, Left, Backward, Right |
| **Mouse** | Look around (Click game screen to lock cursor) |
| **Left Click (Hold)** | Mine blocks / Attack creatures |
| **Right Click** | Place blocks / Open chests / Open doors / Eat food |
| **Space** | Jump / Swim up *(Fly upward in Creative Mode)* |
| **Shift** | Sneak / Sprint *(Fly downward in Creative Mode)* |
| **E** | Open Inventory & Crafting *(Survival)* / Open Item Catalog *(Creative)* |
| **F5** | Switch between First-Person and Third-Person Camera |
| **F** | Toggle Flying on/off *(Creative Mode only)* |
| **Q** | Drop held item onto the ground |
| **1 – 9 Keys** | Select items in your hotbar |
| **Mouse Wheel** | Scroll through hotbar items |
| **Esc** | Pause game / Open options menu |

---

## 💻 System Requirements

Voxel Verse is ultra-lightweight and runs smoothly on almost any modern computer:

- **Operating System**: Windows 10 or Windows 11 (also works on Mac and Linux via terminal).
- **Web Browser**: Google Chrome, Microsoft Edge, Mozilla Firefox, or Brave.
- **Graphics**: Any standard integrated or dedicated graphics card supporting WebGL.

---

## 🛠️ Manual Installation (For Developers)

If you prefer using the terminal rather than `start.bat`:

```bash
# 1. Install dependencies
npm install

# 2. Start the game server and launch browser
npm run dev -- --open
```

---

## 👨‍💻 Meet the Developer

<div align="center">
  <br />
  <a href="https://github.com/Dr-MrBot">
    <img src="https://github.com/Dr-MrBot.png" width="130" height="130" style="border-radius: 50%; border: 4px solid #00e5ff; box-shadow: 0 4px 20px rgba(0, 229, 255, 0.4);" alt="MOHAMMAD FAHAD" />
  </a>
  <h2 style="margin: 10px 0 4px 0; color: #00e5ff;">MOHAMMAD FAHAD</h2>
  <p><strong>Creator & Lead Architect of Voxel Verse</strong></p>
  <p>
    <a href="https://github.com/Dr-MrBot">
      <img src="https://img.shields.io/badge/GitHub-Profile-181717?style=for-the-badge&logo=github" alt="GitHub Profile" />
    </a>
    <a href="https://github.com/Dr-MrBot/Voxel_Verse">
      <img src="https://img.shields.io/badge/Repository-Voxel_Verse-00e5ff?style=for-the-badge&logo=git" alt="Repository" />
    </a>
  </p>
  <br />
</div>

---

## 📄 License & Originality

Voxel Verse is an original open-source voxel sandbox game. All procedural generation algorithms, texture synthesis, sound effects, character models, and gameplay logic were created specifically for this project. It does not use proprietary textures, audio, or code from Minecraft.