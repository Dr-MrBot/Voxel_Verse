import { itemRegistry } from '../items/ItemRegistry.js';
import { recipeRegistry } from '../crafting/RecipeRegistry.js';
import { audioManager } from '../core/AudioManager.js';

export class InventoryUI {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('inventory-modal-container');
    this.cursorItem = null; // Item held on cursor

    // 2x2 or 3x3 crafting grids
    this.craftGrid2x2 = new Array(4).fill(null);
    this.craftGrid3x3 = new Array(9).fill(null);

    this.activeContainerType = null; // null (player), 'crafting_table', 'furnace', 'chest'
    this.activeContainerData = null; // e.g. chest position or furnace state

    this.initCursorElement();
  }

  initCursorElement() {
    this.cursorEl = document.createElement('div');
    this.cursorEl.id = 'inventory-cursor-item';
    this.cursorEl.style.display = 'none';
    document.body.appendChild(this.cursorEl);

    window.addEventListener('mousemove', (e) => {
      if (this.cursorItem) {
        this.cursorEl.style.left = `${e.clientX + 10}px`;
        this.cursorEl.style.top = `${e.clientY + 10}px`;
      }
    });
  }

  updateCursorDisplay() {
    if (this.cursorItem && this.cursorItem.count > 0) {
      const def = itemRegistry.get(this.cursorItem.id);
      this.cursorEl.innerHTML = `
        <span style="color: ${def ? def.color : '#fff'}">${def ? (def.iconChar || '📦') : '📦'}</span>
        <span class="slot-count">${this.cursorItem.count > 1 ? this.cursorItem.count : ''}</span>
      `;
      this.cursorEl.style.display = 'flex';
    } else {
      this.cursorItem = null;
      this.cursorEl.style.display = 'none';
    }
  }

  open(type = null, data = null) {
    this.activeContainerType = type;
    this.activeContainerData = data;
    this.render();
    this.container.classList.add('visible');
    this.game.input.releasePointerLock();
  }

  close() {
    // Return cursor item to player inventory
    if (this.cursorItem) {
      this.game.player.addItem(this.cursorItem.id, this.cursorItem.count);
      this.cursorItem = null;
      this.updateCursorDisplay();
    }

    // Return crafting grid items to player
    const returnGrid = (grid) => {
      for (let i = 0; i < grid.length; i++) {
        if (grid[i]) {
          this.game.player.addItem(grid[i].id, grid[i].count);
          grid[i] = null;
        }
      }
    };
    returnGrid(this.craftGrid2x2);
    returnGrid(this.craftGrid3x3);

    this.activeContainerType = null;
    this.activeContainerData = null;
    this.container.classList.remove('visible');
  }

  isOpen() {
    return this.container.classList.contains('visible');
  }

  createSlot(item, onClick) {
    const slot = document.createElement('div');
    slot.className = 'inv-slot';
    if (item && item.count > 0) {
      const def = itemRegistry.get(item.id);
      slot.innerHTML = `
        <div class="slot-icon" style="color: ${def ? def.color : '#fff'}">${def ? (def.iconChar || '📦') : '📦'}</div>
        <span class="slot-count">${item.count > 1 ? item.count : ''}</span>
      `;
    }

    slot.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onClick(e.button === 2); // true if right click
      this.render();
    });

    return slot;
  }

  // Handle slot interaction (Left/Right click with cursor)
  handleSlotClick(slotOwner, slotIndex, isRightClick) {
    const getItem = () => {
      if (slotOwner === 'player') return this.game.player.inventory[slotIndex];
      if (slotOwner === 'craft2x2') return this.craftGrid2x2[slotIndex];
      if (slotOwner === 'craft3x3') return this.craftGrid3x3[slotIndex];
      if (slotOwner === 'chest') return this.activeContainerData.items[slotIndex];
      if (slotOwner === 'furnace_in') return this.activeContainerData.input;
      if (slotOwner === 'furnace_fuel') return this.activeContainerData.fuel;
      if (slotOwner === 'furnace_out') return this.activeContainerData.output;
      return null;
    };

    const setItem = (val) => {
      if (slotOwner === 'player') this.game.player.inventory[slotIndex] = val;
      else if (slotOwner === 'craft2x2') this.craftGrid2x2[slotIndex] = val;
      else if (slotOwner === 'craft3x3') this.craftGrid3x3[slotIndex] = val;
      else if (slotOwner === 'chest') this.activeContainerData.items[slotIndex] = val;
      else if (slotOwner === 'furnace_in') this.activeContainerData.input = val;
      else if (slotOwner === 'furnace_fuel') this.activeContainerData.fuel = val;
      else if (slotOwner === 'furnace_out') this.activeContainerData.output = val;
    };

    const current = getItem();

    // Furnace output slot is take-only
    if (slotOwner === 'furnace_out') {
      if (current) {
        if (!this.cursorItem) {
          this.cursorItem = { ...current };
          setItem(null);
        } else if (this.cursorItem.id === current.id) {
          this.cursorItem.count += current.count;
          setItem(null);
        }
        audioManager.playPop();
      }
      this.updateCursorDisplay();
      return;
    }

    if (!this.cursorItem) {
      if (current) {
        if (isRightClick && current.count > 1) {
          // Take half
          const half = Math.ceil(current.count / 2);
          this.cursorItem = { ...current, count: half };
          current.count -= half;
        } else {
          // Take all
          this.cursorItem = { ...current };
          setItem(null);
        }
        audioManager.playPop();
      }
    } else {
      // Placing cursor item into slot
      const def = itemRegistry.get(this.cursorItem.id);
      const maxStack = def ? def.maxStack : 64;

      if (!current) {
        if (isRightClick) {
          // Place 1
          setItem({ ...this.cursorItem, count: 1 });
          this.cursorItem.count--;
          if (this.cursorItem.count <= 0) this.cursorItem = null;
        } else {
          // Place all
          setItem({ ...this.cursorItem });
          this.cursorItem = null;
        }
        audioManager.playPop();
      } else if (current.id === this.cursorItem.id && current.count < maxStack) {
        if (isRightClick) {
          current.count++;
          this.cursorItem.count--;
          if (this.cursorItem.count <= 0) this.cursorItem = null;
        } else {
          const add = Math.min(this.cursorItem.count, maxStack - current.count);
          current.count += add;
          this.cursorItem.count -= add;
          if (this.cursorItem.count <= 0) this.cursorItem = null;
        }
        audioManager.playPop();
      } else if (!isRightClick) {
        // Swap items
        const temp = { ...current };
        setItem({ ...this.cursorItem });
        this.cursorItem = temp;
        audioManager.playPop();
      }
    }

    this.updateCursorDisplay();
  }

  // Handle crafting recipe output extraction
  handleCraftExtract(grid, size) {
    const match = recipeRegistry.findMatch(grid, size, size);
    if (!match) return;

    if (!this.cursorItem) {
      this.cursorItem = { ...match.output };
    } else if (this.cursorItem.id === match.output.id) {
      this.cursorItem.count += match.output.count;
    } else {
      return; // Cannot take if holding different item
    }

    // Consume 1 of each ingredient in the grid
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]) {
        grid[i].count--;
        if (grid[i].count <= 0) grid[i] = null;
      }
    }

    audioManager.playPop();
    this.updateCursorDisplay();
  }

  render() {
    this.container.innerHTML = '';
    const modal = document.createElement('div');
    modal.className = 'inventory-modal-box';

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';
    let title = 'Crafting & Inventory';
    if (this.activeContainerType === 'crafting_table') title = 'Crafting Table (3x3)';
    else if (this.activeContainerType === 'furnace') title = 'Furnace';
    else if (this.activeContainerType === 'chest') title = 'Storage Chest';
    header.innerHTML = `<h2>${title}</h2><button class="close-btn">&times;</button>`;
    header.querySelector('.close-btn').addEventListener('click', () => this.close());
    modal.appendChild(header);

    const body = document.createElement('div');
    body.className = 'modal-body';

    // Top section: Container specific (Chest / Furnace / Crafting Table / 2x2 Crafting)
    const topSection = document.createElement('div');
    topSection.className = 'container-top-section';

    if (this.activeContainerType === 'chest') {
      // 27 Chest Slots (3x9)
      const chestGrid = document.createElement('div');
      chestGrid.className = 'inv-grid chest-grid';
      for (let i = 0; i < 27; i++) {
        chestGrid.appendChild(this.createSlot(this.activeContainerData.items[i], (rc) => {
          this.handleSlotClick('chest', i, rc);
        }));
      }
      topSection.appendChild(chestGrid);
    } else if (this.activeContainerType === 'furnace') {
      // Furnace: Input, Fuel, Output
      const furnaceBox = document.createElement('div');
      furnaceBox.className = 'furnace-container';

      const leftCol = document.createElement('div');
      leftCol.className = 'furnace-left';
      leftCol.appendChild(this.createSlot(this.activeContainerData.input, (rc) => {
        this.handleSlotClick('furnace_in', 0, rc);
      }));

      const flame = document.createElement('div');
      flame.className = `furnace-flame ${this.activeContainerData.burnTime > 0 ? 'active' : ''}`;
      flame.innerHTML = '🔥';
      leftCol.appendChild(flame);

      leftCol.appendChild(this.createSlot(this.activeContainerData.fuel, (rc) => {
        this.handleSlotClick('furnace_fuel', 0, rc);
      }));

      const arrow = document.createElement('div');
      arrow.className = 'furnace-arrow';
      const pct = (this.activeContainerData.cookTime / this.activeContainerData.maxCookTime) * 100;
      arrow.innerHTML = `<span style="font-size: 24px;">➡️</span><div class="cook-bar" style="width:${pct}%"></div>`;

      const rightCol = document.createElement('div');
      rightCol.className = 'furnace-right';
      rightCol.appendChild(this.createSlot(this.activeContainerData.output, (rc) => {
        this.handleSlotClick('furnace_out', 0, rc);
      }));

      furnaceBox.appendChild(leftCol);
      furnaceBox.appendChild(arrow);
      furnaceBox.appendChild(rightCol);
      topSection.appendChild(furnaceBox);
    } else if (this.activeContainerType === 'crafting_table') {
      // 3x3 Crafting Table
      const craftWrap = document.createElement('div');
      craftWrap.className = 'crafting-wrapper';

      const grid3x3 = document.createElement('div');
      grid3x3.className = 'craft-grid-3x3';
      for (let i = 0; i < 9; i++) {
        grid3x3.appendChild(this.createSlot(this.craftGrid3x3[i], (rc) => {
          this.handleSlotClick('craft3x3', i, rc);
        }));
      }

      const arrow = document.createElement('div');
      arrow.className = 'craft-arrow';
      arrow.innerHTML = '➡️';

      const match = recipeRegistry.findMatch(this.craftGrid3x3, 3, 3);
      const outputSlot = this.createSlot(match ? match.output : null, () => {
        this.handleCraftExtract(this.craftGrid3x3, 3);
      });
      outputSlot.classList.add('craft-output-slot');

      craftWrap.appendChild(grid3x3);
      craftWrap.appendChild(arrow);
      craftWrap.appendChild(outputSlot);
      topSection.appendChild(craftWrap);
    } else {
      // 2x2 Player Crafting
      const craftWrap = document.createElement('div');
      craftWrap.className = 'crafting-wrapper 2x2';

      const grid2x2 = document.createElement('div');
      grid2x2.className = 'craft-grid-2x2';
      for (let i = 0; i < 4; i++) {
        grid2x2.appendChild(this.createSlot(this.craftGrid2x2[i], (rc) => {
          this.handleSlotClick('craft2x2', i, rc);
        }));
      }

      const arrow = document.createElement('div');
      arrow.className = 'craft-arrow';
      arrow.innerHTML = '➡️';

      const match = recipeRegistry.findMatch(this.craftGrid2x2, 2, 2);
      const outputSlot = this.createSlot(match ? match.output : null, () => {
        this.handleCraftExtract(this.craftGrid2x2, 2);
      });
      outputSlot.classList.add('craft-output-slot');

      craftWrap.appendChild(grid2x2);
      craftWrap.appendChild(arrow);
      craftWrap.appendChild(outputSlot);
      topSection.appendChild(craftWrap);
    }

    body.appendChild(topSection);

    // Player Inventory: 27 storage slots (indices 9-35)
    const invLabel = document.createElement('h3');
    invLabel.textContent = 'Inventory';
    body.appendChild(invLabel);

    const playerGrid = document.createElement('div');
    playerGrid.className = 'inv-grid player-grid';
    for (let i = 9; i < 36; i++) {
      playerGrid.appendChild(this.createSlot(this.game.player.inventory[i], (rc) => {
        this.handleSlotClick('player', i, rc);
      }));
    }
    body.appendChild(playerGrid);

    // Player Hotbar: 9 slots (indices 0-8)
    const hotbarLabel = document.createElement('h3');
    hotbarLabel.textContent = 'Hotbar';
    body.appendChild(hotbarLabel);

    const hotbarGrid = document.createElement('div');
    hotbarGrid.className = 'inv-grid hotbar-grid';
    for (let i = 0; i < 9; i++) {
      hotbarGrid.appendChild(this.createSlot(this.game.player.inventory[i], (rc) => {
        this.handleSlotClick('player', i, rc);
      }));
    }
    body.appendChild(hotbarGrid);

    modal.appendChild(body);
    this.container.appendChild(modal);
    this.updateCursorDisplay();
  }
}
