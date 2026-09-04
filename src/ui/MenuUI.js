import { saveSystem } from '../core/SaveSystem.js';
import { audioManager } from '../core/AudioManager.js';

export class MenuUI {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('menu-container');
    this.selectedNewMode = 'survival';
    this.initElements();
  }

  initElements() {
    this.container.innerHTML = `
      <!-- 0. Animated Loading Screen -->
      <div id="loading-screen" class="menu-screen">
        <div class="loading-box">
          <div class="logo-box">
            <h1 class="game-logo">VOXEL VERSE</h1>
            <p class="game-subtitle">VOXEL ODYSSEY</p>
          </div>
          <div class="loading-bar-wrapper">
            <div id="loading-bar-fill" class="loading-bar-fill" style="width: 0%;"></div>
          </div>
          <div id="loading-status-text" class="loading-status">Generating procedural terrain...</div>
          <div class="loading-dev-tag">
            Developer: <strong>MOHAMMAD FAHAD</strong>
          </div>
        </div>
      </div>

      <!-- 1. Title Screen -->
      <div id="title-screen" class="menu-screen active">
        <div class="logo-box">
          <h1 class="game-logo">VOXEL VERSE</h1>
          <p class="game-subtitle">3D VOXEL SURVIVAL ODYSSEY</p>
        </div>
        <div class="menu-buttons">
          <button id="btn-play-new" class="btn-primary">NEW WORLD</button>
          <button id="btn-load-menu" class="btn-secondary">LOAD WORLD</button>
          <button id="btn-settings" class="btn-secondary">SETTINGS</button>
          <button id="btn-controls" class="btn-secondary">CONTROLS & HELP</button>
          <button id="btn-credits" class="btn-secondary">CREDITS / ABOUT</button>
        </div>
        <div class="version-tag">
          Developed by <strong>MOHAMMAD FAHAD</strong> • Three.js WebGL & Web Audio • v1.2.0
        </div>
      </div>

      <!-- 2. New World Modal -->
      <div id="new-world-modal" class="menu-modal">
        <div class="modal-card">
          <h2>CREATE NEW WORLD</h2>
          <div class="form-group">
            <label>World Name</label>
            <input type="text" id="input-world-name" value="My Voxel Realm" maxlength="24" />
          </div>
          <div class="form-group">
            <label>Game Mode</label>
            <div class="gamemode-toggle-group">
              <button type="button" class="btn-mode-select active" id="btn-mode-survival" data-mode="survival">
                🏕️ Survival
              </button>
              <button type="button" class="btn-mode-select" id="btn-mode-creative" data-mode="creative">
                ✨ Creative
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>World Seed (leave blank for random)</label>
            <div class="seed-input-row">
              <input type="text" id="input-world-seed" placeholder="Random Seed" />
              <button id="btn-random-seed" type="button" class="btn-sm">🎲 Random</button>
            </div>
          </div>
          <div class="form-group">
            <label>Render Distance: <span id="val-render-dist">5</span> chunks</label>
            <input type="range" id="input-render-dist" min="3" max="8" value="5" />
          </div>
          <div class="modal-actions">
            <button id="btn-cancel-new" class="btn-secondary">CANCEL</button>
            <button id="btn-create-confirm" class="btn-primary">START GAME</button>
          </div>
        </div>
      </div>

      <!-- 3. Load World Modal -->
      <div id="load-world-modal" class="menu-modal">
        <div class="modal-card">
          <h2>LOAD SAVED WORLD</h2>
          <div id="world-list-container" class="world-list"></div>
          <div class="modal-actions">
            <button id="btn-close-load" class="btn-secondary">BACK</button>
          </div>
        </div>
      </div>

      <!-- 4. Pause Menu -->
      <div id="pause-menu" class="menu-modal">
        <div class="modal-card pause-card">
          <h2>GAME PAUSED</h2>
          <div class="pause-gamemode-banner">
            MODE: <span id="pause-mode-text">SURVIVAL</span>
          </div>
          <div class="menu-buttons">
            <button id="btn-resume" class="btn-primary">RESUME</button>
            <button id="btn-toggle-gamemode" class="btn-secondary">SWITCH TO CREATIVE</button>
            <button id="btn-save-world" class="btn-secondary">SAVE REALM</button>
            <button id="btn-pause-settings" class="btn-secondary">SETTINGS</button>
            <button id="btn-quit-title" class="btn-danger">QUIT TO TITLE</button>
          </div>
          <div class="pause-footer-credit">
            Developer: <strong>MOHAMMAD FAHAD</strong>
          </div>
        </div>
      </div>

      <!-- 5. Settings Modal -->
      <div id="settings-modal" class="menu-modal">
        <div class="modal-card">
          <h2>SETTINGS</h2>
          <div class="form-group">
            <label>Field of View (FOV): <span id="val-fov">75</span></label>
            <input type="range" id="input-fov" min="60" max="100" value="75" />
          </div>
          <div class="form-group">
            <label>Mouse Sensitivity: <span id="val-sens">1.0</span></label>
            <input type="range" id="input-sens" min="0.3" max="3.0" step="0.1" value="1.0" />
          </div>
          <div class="form-group">
            <label>Master Volume: <span id="val-vol-master">80%</span></label>
            <input type="range" id="input-vol-master" min="0" max="100" value="80" />
          </div>
          <div class="form-group">
            <label>Sound Effects Volume: <span id="val-vol-sfx">80%</span></label>
            <input type="range" id="input-vol-sfx" min="0" max="100" value="80" />
          </div>
          <div class="form-group checkbox-group">
            <label><input type="checkbox" id="check-invert-y" /> Invert Mouse Y</label>
          </div>
          <div class="modal-actions">
            <button id="btn-close-settings" class="btn-primary">DONE</button>
          </div>
        </div>
      </div>

      <!-- 6. Controls Help Modal -->
      <div id="controls-modal" class="menu-modal">
        <div class="modal-card controls-card">
          <h2>CONTROLS GUIDE</h2>
          <div class="controls-grid">
            <div><strong>W, A, S, D</strong> - Move / Strafe</div>
            <div><strong>Space</strong> - Jump / Swim Up (Flight Up)</div>
            <div><strong>Shift</strong> - Sprint / Sneak Ledge Protection</div>
            <div><strong>Left Click</strong> - Mine Block / Attack</div>
            <div><strong>Right Click</strong> - Place / Interact / Open Doors</div>
            <div><strong>E</strong> - Inventory / Creative Catalog</div>
            <div><strong>F5</strong> - Toggle 1st / 3rd Person View</div>
            <div><strong>F</strong> - Toggle Creative Flight</div>
            <div><strong>F3</strong> - Toggle Performance Debug Info</div>
            <div><strong>Q</strong> - Drop Held Item</div>
            <div><strong>1 - 9</strong> - Select Hotbar Slot</div>
            <div><strong>Mouse Wheel</strong> - Scroll Hotbar / Zoom 3rd Person</div>
            <div><strong>Esc</strong> - Pause Game</div>
          </div>
          <div class="modal-actions">
            <button id="btn-close-controls" class="btn-primary">GOT IT</button>
          </div>
        </div>
      </div>

      <!-- 7. Credits Modal -->
      <div id="credits-modal" class="menu-modal">
        <div class="modal-card credits-card">
          <h2>ABOUT & CREDITS</h2>
          <div class="credits-body">
            <h1 class="credits-title">VOXEL VERSE</h1>
            <div class="credits-sub">3D VOXEL SURVIVAL ODYSSEY</div>
            <div class="credits-author-box">
              <div class="credits-role">CREATOR & DEVELOPER</div>
              <div class="credits-name">MOHAMMAD FAHAD</div>
            </div>
            <p class="credits-desc">
              An original, fully playable browser-based 3D voxel sandbox adventure featuring survival & creative modes, 
              procedural infinite terrain, 3D animated character & creatures, day/night cycles, and dynamic physics.
            </p>
            <div class="credits-tech-list">
              <div>Graphics Engine: Three.js (WebGL)</div>
              <div>Audio Engine: Web Audio API Synthesizer</div>
              <div>Persistence: HTML5 IndexedDB</div>
            </div>
          </div>
          <div class="modal-actions">
            <button id="btn-close-credits" class="btn-primary">CLOSE</button>
          </div>
        </div>
      </div>

      <!-- 8. Death Screen -->
      <div id="death-screen" class="menu-screen">
        <div class="death-box">
          <h1 class="death-title">YOU DIED!</h1>
          <p class="death-score">Score / Level: <span id="death-level-val">1</span></p>
          <button id="btn-respawn" class="btn-primary">RESPAWN</button>
        </div>
      </div>
    `;

    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingFill = document.getElementById('loading-bar-fill');
    this.loadingStatus = document.getElementById('loading-status-text');

    this.bindEvents();
  }

  showLoading(text = 'Generating procedural terrain...') {
    if (this.loadingStatus) this.loadingStatus.textContent = text;
    if (this.loadingFill) this.loadingFill.style.width = '10%';
    if (this.loadingScreen) this.loadingScreen.classList.add('active');
  }

  updateLoading(pct, text) {
    if (this.loadingFill) this.loadingFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    if (text && this.loadingStatus) this.loadingStatus.textContent = text;
  }

  hideLoading() {
    if (this.loadingScreen) this.loadingScreen.classList.remove('active');
  }

  bindEvents() {
    const titleScreen = document.getElementById('title-screen');
    const newWorldModal = document.getElementById('new-world-modal');
    const loadWorldModal = document.getElementById('load-world-modal');
    const pauseMenu = document.getElementById('pause-menu');
    const settingsModal = document.getElementById('settings-modal');
    const controlsModal = document.getElementById('controls-modal');
    const creditsModal = document.getElementById('credits-modal');
    const deathScreen = document.getElementById('death-screen');

    // Title buttons
    document.getElementById('btn-play-new').addEventListener('click', () => {
      newWorldModal.classList.add('visible');
      audioManager.playUIClick();
    });

    document.getElementById('btn-cancel-new').addEventListener('click', () => {
      newWorldModal.classList.remove('visible');
      audioManager.playUIClick();
    });

    // Game Mode selection buttons in New World modal
    const btnSurv = document.getElementById('btn-mode-survival');
    const btnCreat = document.getElementById('btn-mode-creative');

    btnSurv.addEventListener('click', () => {
      btnSurv.classList.add('active');
      btnCreat.classList.remove('active');
      this.selectedNewMode = 'survival';
      audioManager.playUIClick();
    });

    btnCreat.addEventListener('click', () => {
      btnCreat.classList.add('active');
      btnSurv.classList.remove('active');
      this.selectedNewMode = 'creative';
      audioManager.playUIClick();
    });

    document.getElementById('btn-random-seed').addEventListener('click', () => {
      document.getElementById('input-world-seed').value = Math.floor(Math.random() * 9999999);
      audioManager.playUIClick();
    });

    document.getElementById('btn-create-confirm').addEventListener('click', () => {
      const name = document.getElementById('input-world-name').value.trim() || 'My Voxel Realm';
      const seedVal = document.getElementById('input-world-seed').value.trim();
      const seed = seedVal ? seedVal : Math.floor(Math.random() * 9999999);
      const renderDist = parseInt(document.getElementById('input-render-dist').value, 10) || 5;

      newWorldModal.classList.remove('visible');
      titleScreen.classList.remove('active');
      audioManager.playUIClick();
      this.game.startNewGame(name, seed, renderDist, this.selectedNewMode);
    });

    // Render dist slider label
    document.getElementById('input-render-dist').addEventListener('input', (e) => {
      document.getElementById('val-render-dist').textContent = e.target.value;
    });

    // Load World button
    document.getElementById('btn-load-menu').addEventListener('click', async () => {
      audioManager.playUIClick();
      await this.refreshWorldList();
      loadWorldModal.classList.add('visible');
    });

    document.getElementById('btn-close-load').addEventListener('click', () => {
      audioManager.playUIClick();
      loadWorldModal.classList.remove('visible');
    });

    // Settings
    document.getElementById('btn-settings').addEventListener('click', () => {
      audioManager.playUIClick();
      settingsModal.classList.add('visible');
    });

    document.getElementById('btn-pause-settings').addEventListener('click', () => {
      audioManager.playUIClick();
      settingsModal.classList.add('visible');
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      audioManager.playUIClick();
      settingsModal.classList.remove('visible');
    });

    // Controls
    document.getElementById('btn-controls').addEventListener('click', () => {
      audioManager.playUIClick();
      controlsModal.classList.add('visible');
    });

    document.getElementById('btn-close-controls').addEventListener('click', () => {
      audioManager.playUIClick();
      controlsModal.classList.remove('visible');
    });

    // Credits
    document.getElementById('btn-credits').addEventListener('click', () => {
      audioManager.playUIClick();
      creditsModal.classList.add('visible');
    });

    document.getElementById('btn-close-credits').addEventListener('click', () => {
      audioManager.playUIClick();
      creditsModal.classList.remove('visible');
    });

    // Pause menu buttons
    document.getElementById('btn-resume').addEventListener('click', () => {
      audioManager.playUIClick();
      this.game.resume();
    });

    document.getElementById('btn-toggle-gamemode').addEventListener('click', () => {
      audioManager.playUIClick();
      const curMode = this.game.player ? this.game.player.gameMode : 'survival';
      const newMode = curMode === 'survival' ? 'creative' : 'survival';
      this.game.setGameMode(newMode);
      this.updatePauseModeDisplay();
    });

    document.getElementById('btn-save-world').addEventListener('click', async () => {
      audioManager.playUIClick();
      await this.game.saveCurrentWorld();
      this.game.hud.showNotification('World saved successfully!');
    });

    document.getElementById('btn-quit-title').addEventListener('click', () => {
      audioManager.playUIClick();
      pauseMenu.classList.remove('visible');
      titleScreen.classList.add('active');
      this.game.quitToTitle();
    });

    // Death screen respawn
    document.getElementById('btn-respawn').addEventListener('click', () => {
      audioManager.playUIClick();
      deathScreen.classList.remove('active');
      this.game.respawnPlayer();
    });

    // Settings inputs
    document.getElementById('input-fov').addEventListener('input', (e) => {
      document.getElementById('val-fov').textContent = e.target.value;
      if (this.game.camera) {
        this.game.camera.fov = parseFloat(e.target.value);
        this.game.camera.updateProjectionMatrix();
      }
    });

    document.getElementById('input-sens').addEventListener('input', (e) => {
      document.getElementById('val-sens').textContent = e.target.value;
      if (this.game.input) {
        this.game.input.mouseSensitivity = parseFloat(e.target.value) * 0.002;
      }
    });

    document.getElementById('input-vol-master').addEventListener('input', (e) => {
      document.getElementById('val-vol-master').textContent = `${e.target.value}%`;
      audioManager.setMasterVolume(parseFloat(e.target.value) / 100);
    });

    document.getElementById('input-vol-sfx').addEventListener('input', (e) => {
      document.getElementById('val-vol-sfx').textContent = `${e.target.value}%`;
      audioManager.setSFXVolume(parseFloat(e.target.value) / 100);
    });

    document.getElementById('check-invert-y').addEventListener('change', (e) => {
      if (this.game.input) {
        this.game.input.invertY = e.target.checked;
      }
    });
  }

  updatePauseModeDisplay() {
    const mode = this.game.player ? this.game.player.gameMode : 'survival';
    const textEl = document.getElementById('pause-mode-text');
    const toggleBtn = document.getElementById('btn-toggle-gamemode');
    if (textEl) textEl.textContent = mode.toUpperCase();
    if (toggleBtn) {
      toggleBtn.textContent = mode === 'survival' ? 'SWITCH TO CREATIVE' : 'SWITCH TO SURVIVAL';
    }
  }

  showPauseMenu() {
    this.updatePauseModeDisplay();
    document.getElementById('pause-menu').classList.add('visible');
  }

  hidePauseMenu() {
    document.getElementById('pause-menu').classList.remove('visible');
  }

  showDeathScreen(level) {
    document.getElementById('death-level-val').textContent = level;
    document.getElementById('death-screen').classList.add('active');
  }

  async refreshWorldList() {
    const listContainer = document.getElementById('world-list-container');
    listContainer.innerHTML = '<div class="loading-text">Loading saved worlds...</div>';

    const worlds = await saveSystem.getAllWorlds();
    listContainer.innerHTML = '';

    if (worlds.length === 0) {
      listContainer.innerHTML = '<div class="empty-list-msg">No saved worlds found. Create one!</div>';
      return;
    }

    worlds.forEach((w) => {
      const item = document.createElement('div');
      item.className = 'world-item';
      const dateStr = new Date(w.date).toLocaleDateString();
      const modeStr = (w.gameMode || (w.player && w.player.gameMode) || 'survival').toUpperCase();

      item.innerHTML = `
        <div class="world-info">
          <div class="world-name-title">${w.name} <span class="mode-tag-small">${modeStr}</span></div>
          <div class="world-meta">Seed: ${w.seed} • Saved: ${dateStr}</div>
        </div>
        <div class="world-actions">
          <button class="btn-play-world btn-sm btn-primary">PLAY</button>
          <button class="btn-del-world btn-sm btn-danger">DELETE</button>
        </div>
      `;

      item.querySelector('.btn-play-world').addEventListener('click', () => {
        audioManager.playUIClick();
        document.getElementById('load-world-modal').classList.remove('visible');
        document.getElementById('title-screen').classList.remove('active');
        this.game.loadSavedGame(w);
      });

      item.querySelector('.btn-del-world').addEventListener('click', async (e) => {
        e.stopPropagation();
        audioManager.playUIClick();
        if (confirm(`Are you sure you want to delete "${w.name}"?`)) {
          await saveSystem.deleteWorld(w.name);
          await this.refreshWorldList();
        }
      });

      listContainer.appendChild(item);
    });
  }
}
