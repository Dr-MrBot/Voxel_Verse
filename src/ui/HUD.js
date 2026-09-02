import { itemRegistry } from '../items/ItemRegistry.js';

export class HUD {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('hud-container');
    this.recentPickups = new Map(); // id -> { name, count, timer, el }
    this.initElements();
  }

  initElements() {
    this.container.innerHTML = `
      <div id="crosshair"></div>
      
      <!-- Block Target Pill directly above/under crosshair -->
      <div id="block-target-pill" class="hidden">Stone</div>

      <div id="debug-info">
        <span id="gamemode-badge" class="badge-mode">SURVIVAL</span> | 
        <span id="coord-display">XYZ: 0.0, 32.0, 0.0</span> | 
        <span id="biome-display">Plains</span> | 
        <span id="fps-display">60 FPS</span>
      </div>

      <div id="status-bars">
        <div id="health-bar" class="stat-row"></div>
        <div id="hunger-bar" class="stat-row"></div>
      </div>

      <div id="xp-container">
        <div id="xp-bar-fill"></div>
        <div id="xp-level-badge">1</div>
      </div>

      <!-- Right-side Item Pickup Feed -->
      <div id="item-pickup-feed"></div>

      <div id="hotbar-container"></div>
      <div id="tooltip-display"></div>
      <div id="notification-toast"></div>
    `;

    this.coordDisplay = document.getElementById('coord-display');
    this.biomeDisplay = document.getElementById('biome-display');
    this.fpsDisplay = document.getElementById('fps-display');
    this.gamemodeBadge = document.getElementById('gamemode-badge');
    this.healthBar = document.getElementById('health-bar');
    this.hungerBar = document.getElementById('hunger-bar');
    this.xpContainer = document.getElementById('xp-container');
    this.xpFill = document.getElementById('xp-bar-fill');
    this.xpLevel = document.getElementById('xp-level-badge');
    this.hotbarContainer = document.getElementById('hotbar-container');
    this.tooltip = document.getElementById('tooltip-display');
    this.toast = document.getElementById('notification-toast');
    this.targetPill = document.getElementById('block-target-pill');
    this.pickupFeed = document.getElementById('item-pickup-feed');

    // Build 9 hotbar slot DOM nodes
    this.hotbarSlots = [];
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = 'hotbar-slot';
      slot.dataset.slotIndex = i;
      slot.innerHTML = `
        <span class="slot-num">${i + 1}</span>
        <div class="slot-icon"></div>
        <span class="slot-count"></span>
        <div class="slot-durability"><div class="durability-fill"></div></div>
      `;
      slot.addEventListener('click', () => {
        this.game.player.selectedHotbarSlot = i;
      });
      this.hotbarContainer.appendChild(slot);
      this.hotbarSlots.push(slot);
    }

    this.toastTimer = 0;
  }

  showNotification(msg) {
    this.toast.textContent = msg;
    this.toast.classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.classList.remove('visible');
    }, 2800);
  }

  // Show stackable item pickup notifications (e.g. +12 Stone)
  showItemPickup(itemId, count = 1) {
    const itemDef = itemRegistry.get(itemId);
    const name = itemDef ? itemDef.name : itemId;

    if (this.recentPickups.has(itemId)) {
      const entry = this.recentPickups.get(itemId);
      entry.count += count;
      entry.timer = 2.5; // Reset timer
      entry.el.textContent = `+${entry.count} ${name}`;
      entry.el.classList.remove('fade-out');
    } else {
      const el = document.createElement('div');
      el.className = 'pickup-toast';
      el.textContent = `+${count} ${name}`;
      this.pickupFeed.appendChild(el);

      const entry = {
        name,
        count,
        timer: 2.5,
        el,
      };
      this.recentPickups.set(itemId, entry);
    }
  }

  update(delta, player, fps) {
    // 1. Coordinates, Biome, Game Mode
    const p = player.position;
    this.coordDisplay.textContent = `XYZ: ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}`;
    this.fpsDisplay.textContent = `${fps} FPS`;

    if (player.gameMode === 'creative') {
      this.gamemodeBadge.textContent = player.isFlying ? 'CREATIVE (FLYING)' : 'CREATIVE';
      this.gamemodeBadge.style.color = '#00e5ff';
      this.healthBar.style.display = 'none';
      this.hungerBar.style.display = 'none';
      this.xpContainer.style.display = 'none';
    } else {
      this.gamemodeBadge.textContent = 'SURVIVAL';
      this.gamemodeBadge.style.color = '#69f0ae';
      this.healthBar.style.display = 'flex';
      this.hungerBar.style.display = 'flex';
      this.xpContainer.style.display = 'block';
    }

    const { biome } = this.game.world.generator.getTerrainData(Math.floor(p.x), Math.floor(p.z));
    this.biomeDisplay.textContent = biome.name;

    // 2. Health & Hunger (Survival mode only)
    if (player.gameMode !== 'creative') {
      let healthHtml = '';
      for (let i = 0; i < 10; i++) {
        const hp = player.health - i * 2;
        if (hp >= 2) healthHtml += '<span class="heart full">❤️</span>';
        else if (hp === 1) healthHtml += '<span class="heart half">💔</span>';
        else healthHtml += '<span class="heart empty">🖤</span>';
      }
      this.healthBar.innerHTML = healthHtml;

      let hungerHtml = '';
      for (let i = 0; i < 10; i++) {
        const h = player.hunger - i * 2;
        if (h >= 2) hungerHtml += '<span class="drumstick full">🍗</span>';
        else if (h === 1) hungerHtml += '<span class="drumstick half">🍖</span>';
        else hungerHtml += '<span class="drumstick empty">🦴</span>';
      }
      this.hungerBar.innerHTML = hungerHtml;

      const xpPct = Math.min(100, Math.max(0, (player.xp / player.xpForNextLevel) * 100));
      this.xpFill.style.width = `${xpPct}%`;
      this.xpLevel.textContent = player.level;
    }

    // 3. Block Target Pill
    const targetedBlock = player.interactions ? player.interactions.targetedBlockDef : null;
    if (targetedBlock && targetedBlock.name && targetedBlock.name !== 'Air') {
      this.targetPill.textContent = targetedBlock.name;
      this.targetPill.classList.remove('hidden');
    } else {
      this.targetPill.classList.add('hidden');
    }

    // 4. Update Pickup Feed timers
    for (const [id, entry] of this.recentPickups.entries()) {
      entry.timer -= delta;
      if (entry.timer <= 0.6) {
        entry.el.classList.add('fade-out');
      }
      if (entry.timer <= 0) {
        if (entry.el.parentElement) {
          entry.el.parentElement.removeChild(entry.el);
        }
        this.recentPickups.delete(id);
      }
    }

    // 5. Hotbar items
    this.updateHotbarUI();
  }

  updateHotbarUI() {
    const player = this.game.player;
    if (!player) return;

    for (let i = 0; i < 9; i++) {
      const slotEl = this.hotbarSlots[i];
      const item = player.inventory[i];
      const isSelected = (i === player.selectedHotbarSlot);

      if (isSelected) slotEl.classList.add('selected');
      else slotEl.classList.remove('selected');

      const iconEl = slotEl.querySelector('.slot-icon');
      const countEl = slotEl.querySelector('.slot-count');
      const durEl = slotEl.querySelector('.slot-durability');
      const durFill = slotEl.querySelector('.durability-fill');

      if (item) {
        const itemDef = itemRegistry.get(item.id);
        iconEl.textContent = itemDef ? (itemDef.iconChar || '📦') : '📦';
        iconEl.style.color = itemDef ? itemDef.color : '#ffffff';
        countEl.textContent = (player.gameMode === 'creative') ? '∞' : (item.count > 1 ? item.count : '');

        // Durability bar (Survival only)
        if (player.gameMode !== 'creative' && item.durability !== undefined && itemDef && itemDef.maxDurability) {
          durEl.style.display = 'block';
          const durPct = (item.durability / itemDef.maxDurability) * 100;
          durFill.style.width = `${durPct}%`;
          durFill.style.backgroundColor = durPct > 50 ? '#4caf50' : (durPct > 20 ? '#ff9800' : '#f44336');
        } else {
          durEl.style.display = 'none';
        }
      } else {
        iconEl.textContent = '';
        countEl.textContent = '';
        durEl.style.display = 'none';
      }
    }

    // Tooltip for selected hotbar item
    const currentItem = player.getSelectedItem();
    if (currentItem) {
      const def = itemRegistry.get(currentItem.id);
      this.tooltip.textContent = def ? def.name : 'Unknown Item';
      this.tooltip.style.opacity = '1';
    } else {
      this.tooltip.style.opacity = '0';
    }
  }
}
