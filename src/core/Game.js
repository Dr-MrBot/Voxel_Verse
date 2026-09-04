import * as THREE from 'three';
import { World } from '../world/World.js';
import { Player } from '../player/Player.js';
import { SkyAndWeather } from '../world/SkyAndWeather.js';
import { FurnaceSystem } from '../crafting/FurnaceSystem.js';
import { MobManager } from '../mobs/Mob.js';
import { DroppedItem } from '../items/DroppedItem.js';
import { InputManager } from './InputManager.js';
import { audioManager } from './AudioManager.js';
import { saveSystem } from './SaveSystem.js';
import { HUD } from '../ui/HUD.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { CreativeInventoryUI } from '../ui/CreativeInventoryUI.js';
import { MenuUI } from '../ui/MenuUI.js';
import { ParticleSystem } from '../utils/ParticleSystem.js';

export class Game {
  constructor() {
    this.container = document.getElementById('game-canvas-container');
    this.state = 'TITLE'; // 'TITLE', 'LOADING', 'PLAYING', 'PAUSED', 'DEAD'
    this.worldName = 'My Voxel Realm';
    this.seed = 1337;
    this.gameMode = 'survival';

    this.droppedItems = [];
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.autoSaveTimer = 0;

    this.initThree();
    this.initSystems();
    this.initLoop();
  }

  initThree() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 400);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initSystems() {
    this.input = new InputManager(this.renderer.domElement);
    this.particles = new ParticleSystem(this.scene);
    this.hud = new HUD(this);
    this.inventoryUI = new InventoryUI(this);
    this.creativeUI = new CreativeInventoryUI(this);
    this.menuUI = new MenuUI(this);
    this.ui = this.hud;

    this.initFullscreenToggle();

    // Bind canvas click to request pointer lock when playing
    this.renderer.domElement.addEventListener('click', () => {
      if (this.state === 'PLAYING' && !this.inventoryUI.isOpen() && !this.creativeUI.isOpen()) {
        this.input.requestPointerLock();
        audioManager.ensureContext();
      }
    });

    // Keyboard handlers for Inventory ('E') and Pause ('Escape')
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'PLAYING' && this.state !== 'PAUSED') return;

      if (e.code === 'KeyE') {
        if (this.creativeUI.isOpen()) {
          this.creativeUI.close();
          this.input.requestPointerLock();
        } else if (this.inventoryUI.isOpen()) {
          this.inventoryUI.close();
          this.input.requestPointerLock();
        } else if (this.state === 'PLAYING') {
          if (this.player && this.player.gameMode === 'creative') {
            this.creativeUI.open();
          } else {
            this.inventoryUI.open();
          }
        }
      } else if (e.code === 'Escape') {
        if (this.creativeUI.isOpen()) {
          this.creativeUI.close();
          this.input.requestPointerLock();
        } else if (this.inventoryUI.isOpen()) {
          this.inventoryUI.close();
          this.input.requestPointerLock();
        } else if (this.state === 'PLAYING') {
          this.pause();
        } else if (this.state === 'PAUSED') {
          this.resume();
        }
      }
    });
  }

  initFullscreenToggle() {
    const btn = document.getElementById('btn-fullscreen-toggle');
    if (!btn) return;

    const iconEnter = document.getElementById('icon-fs-enter');
    const iconExit = document.getElementById('icon-fs-exit');

    const updateUI = () => {
      const isFS = !!document.fullscreenElement;
      if (isFS) {
        if (iconEnter) iconEnter.classList.add('hidden');
        if (iconExit) iconExit.classList.remove('hidden');
        btn.title = 'Exit Fullscreen';
      } else {
        if (iconEnter) iconEnter.classList.remove('hidden');
        if (iconExit) iconExit.classList.add('hidden');
        btn.title = 'Full Screen Mode (F11)';
      }
      setTimeout(() => {
        if (this.camera && this.renderer) {
          this.camera.aspect = window.innerWidth / window.innerHeight;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
      }, 100);
    };

    btn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    });

    document.addEventListener('fullscreenchange', updateUI);
  }

  setGameMode(mode) {
    if (this.player) {
      this.player.gameMode = mode;
      this.gameMode = mode;
      this.hud.showNotification(`Game mode set to ${mode.toUpperCase()}`);
    }
  }

  startNewGame(name, seed, renderDist = 5, mode = 'survival') {
    this.worldName = name;
    this.seed = seed;
    this.gameMode = mode;
    this.state = 'LOADING';

    this.menuUI.showLoading('Initializing procedural world engine...');
    this.cleanupCurrentGame();

    setTimeout(() => {
      this.menuUI.updateLoading(25, 'Generating terrain topography & biomes...');

      setTimeout(() => {
        this.world = new World(this.scene, this.seed);
        this.world.renderDistance = renderDist;

        this.sky = new SkyAndWeather(this.scene, this.renderer);
        this.furnaceSystem = new FurnaceSystem(this.world);
        this.mobManager = new MobManager(this);

        this.menuUI.updateLoading(60, 'Pre-meshing spawn chunks...');

        setTimeout(() => {
          this.player = new Player(this, this.world, this.scene, this.camera);
          this.player.gameMode = mode;

          // Find safe spawn elevation
          const spawn = this.world.findSafeSpawn(0, 0);
          this.player.position.set(spawn.x + 0.5, spawn.y + 1.2, spawn.z + 0.5);
          this.player.spawnPoint.copy(this.player.position);

          this.menuUI.updateLoading(90, 'Spawning entities & celestial sky...');

          setTimeout(() => {
            this.menuUI.updateLoading(100, 'Ready!');
            setTimeout(() => {
              this.menuUI.hideLoading();
              this.state = 'PLAYING';
              this.input.requestPointerLock();
              audioManager.ensureContext();
              this.hud.showNotification(`Welcome to ${this.worldName}! Mode: ${mode.toUpperCase()}`);
            }, 300);
          }, 150);
        }, 150);
      }, 150);
    }, 100);
  }

  loadSavedGame(saveData) {
    this.worldName = saveData.name;
    this.seed = saveData.seed;
    this.gameMode = saveData.gameMode || (saveData.player && saveData.player.gameMode) || 'survival';
    this.state = 'LOADING';

    this.menuUI.showLoading('Loading saved world from database...');
    this.cleanupCurrentGame();

    setTimeout(() => {
      this.world = new World(this.scene, this.seed);
      this.world.renderDistance = saveData.renderDistance || 5;

      if (saveData.modifiedBlocks) {
        this.world.modifiedBlocks = new Map(saveData.modifiedBlocks);
      }
      if (saveData.chests) {
        this.world.chests = new Map(saveData.chests);
      }
      if (saveData.furnaces) {
        this.world.furnaces = new Map(saveData.furnaces);
      }

      this.sky = new SkyAndWeather(this.scene, this.renderer);
      if (saveData.time !== undefined) this.sky.time = saveData.time;
      if (saveData.weather) this.sky.setWeather(saveData.weather);

      this.furnaceSystem = new FurnaceSystem(this.world);
      this.mobManager = new MobManager(this);

      this.player = new Player(this, this.world, this.scene, this.camera);
      if (saveData.player) {
        const p = saveData.player;
        this.player.position.set(p.x, p.y, p.z);
        this.player.yaw = p.yaw || 0;
        this.player.pitch = p.pitch || 0;
        this.player.health = p.health || 20;
        this.player.hunger = p.hunger || 20;
        this.player.level = p.level || 1;
        this.player.xp = p.xp || 0;
        this.player.gameMode = p.gameMode || this.gameMode;
        if (p.spawnPoint) {
          this.player.spawnPoint.set(p.spawnPoint[0], p.spawnPoint[1], p.spawnPoint[2]);
        }
        if (p.inventory) {
          this.player.inventory = p.inventory;
        }
      }

      this.menuUI.updateLoading(100, 'Restored successfully!');
      setTimeout(() => {
        this.menuUI.hideLoading();
        this.state = 'PLAYING';
        this.input.requestPointerLock();
        audioManager.ensureContext();
        this.hud.showNotification(`Loaded world: ${this.worldName}`);
      }, 300);
    }, 150);
  }

  cleanupCurrentGame() {
    if (this.world) this.world.dispose();
    if (this.mobManager) this.mobManager.clearAll();
    for (const item of this.droppedItems) {
      item.dispose();
    }
    this.droppedItems = [];
  }

  pause() {
    this.state = 'PAUSED';
    this.input.releasePointerLock();
    this.menuUI.showPauseMenu();
  }

  resume() {
    this.state = 'PLAYING';
    this.menuUI.hidePauseMenu();
    this.input.requestPointerLock();
  }

  async saveCurrentWorld() {
    if (!this.world || !this.player) return;
    await saveSystem.saveWorld(this.worldName, {
      seed: this.seed,
      gameMode: this.player.gameMode,
      player: this.player,
      world: this.world,
      sky: this.sky,
    });
  }

  quitToTitle() {
    this.saveCurrentWorld();
    this.state = 'TITLE';
    this.cleanupCurrentGame();
    this.input.releasePointerLock();
  }

  onPlayerDied() {
    this.state = 'DEAD';
    this.input.releasePointerLock();
    this.menuUI.showDeathScreen(this.player.level);
  }

  respawnPlayer() {
    this.player.respawn();
    this.state = 'PLAYING';
    this.input.requestPointerLock();
  }

  spawnDroppedItem(x, y, z, itemId, count = 1) {
    const item = new DroppedItem(this.world, this.scene, x, y, z, itemId, count);
    this.droppedItems.push(item);
  }

  openCraftingTable() {
    this.inventoryUI.open('crafting_table');
  }

  openFurnace(x, y, z) {
    const furnaceData = this.furnaceSystem.getFurnace(x, y, z);
    this.inventoryUI.open('furnace', furnaceData);
  }

  openChest(x, y, z) {
    const key = `${x},${y},${z}`;
    if (!this.world.chests.has(key)) {
      this.world.chests.set(key, new Array(27).fill(null));
    }
    const chestData = { x, y, z, items: this.world.chests.get(key) };
    this.inventoryUI.open('chest', chestData);
  }

  initLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      requestAnimationFrame(loop);

      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      // FPS tracking
      this.frameCount++;
      if (now - this.lastFpsTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsTime = now;
      }

      // Update pooled particles
      if (this.particles) {
        this.particles.update(delta);
      }

      if (this.state === 'PLAYING') {
        const allowControl = !this.inventoryUI.isOpen() && !this.creativeUI.isOpen();
        this.player.update(delta, this.input, allowControl);

        // World chunk streaming around player
        this.world.update(this.player.position);

        // Sky and Weather
        this.sky.update(delta, this.player.position);

        // Furnace cooking
        this.furnaceSystem.update(delta);

        // Mobs update
        this.mobManager.update(delta, this.player);

        // Dropped items
        for (let i = this.droppedItems.length - 1; i >= 0; i--) {
          const item = this.droppedItems[i];
          if (item.isDead) {
            this.droppedItems.splice(i, 1);
            continue;
          }
          item.update(delta, this.player);
        }

        // HUD update
        this.hud.update(delta, this.player, this.fps);

        // Periodic 60s auto-save
        this.autoSaveTimer += delta;
        if (this.autoSaveTimer >= 60.0) {
          this.autoSaveTimer = 0;
          this.saveCurrentWorld();
          this.hud.showNotification('World Auto-Saved');
        }
      }

      this.renderer.render(this.scene, this.camera);
    };

    requestAnimationFrame(loop);
  }
}
