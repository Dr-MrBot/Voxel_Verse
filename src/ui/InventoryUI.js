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
        <span style="color: ${def ? def.color : '#fff'}; font-size: 20px;">${def ? (def.iconChar || '📦') : '📦'}</span>
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
      slot.title = def ? def.name : 'Item';
    }

    slot.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const isRightClick = (e.button === 2);
      const isShiftClick = e.shiftKey;
      onClick(isRightClick, isShiftClick);
      this.render();
    });

    return slot;
  }

  // Handle slot interaction (Left / Right / Shift click with cursor)
  handleSlotClick(slotOwner, slotIndex, isRightClick, isShiftClick) {
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

    // 1. Shift-Click Quick Transfer
    if (isShiftClick && current && !this.cursorItem) {
      if (slotOwner === 'player') {
        if (slotIndex < 9) {
          // Hotbar -> Main Inventory (9-35)
          for (let i = 9; i < 36; i++) {
            if (!this.game.player.inventory[i]) {
              this.game.player.inventory[i] = current;
              setItem(null);
              audioManager.playPop();
              return;
            }
          }
        } else {
          // Main Inventory -> Hotbar (0-8)
          for (let i = 0; i < 9; i++) {
            if (!this.game.player.inventory[i]) {
              this.game.player.inventory[i] = current;
              setItem(null);
              audioManager.playPop();
              return;
            }
          }
        }

        // If Chest is open: Player -> Chest
        if (this.activeContainerType === 'chest' && this.activeContainerData) {
          for (let i = 0; i < this.activeContainerData.items.length; i++) {
            if (!this.activeContainerData.items[i]) {
              this.activeContainerData.items[i] = current;
              setItem(null);
              audioManager.playPop();
              return;
            }
          }
        }
      } else if (slotOwner === 'chest' && this.activeContainerData) {
        // Chest -> Player
        const added = this.game.player.addItem(current.id, current.count);
        if (added === current.count) {
          setItem(null);
        } else {
          current.count -= added;
        }
        audioManager.playPop();
        return;
      }
    }

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
      return;
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

    // Top Workstation Area
    if (this.activeContainerType === 'chest') {
      const chestSection = document.createElement('div');
      chestSection.className = 'chest-section';
      const grid = document.createElement('div');
      grid.className = 'chest-grid';
      for (let i = 0; i < this.activeContainerData.items.length; i++) {
        const item = this.activeContainerData.items[i];
        grid.appendChild(this.createSlot(item, (r, s) => this.handleSlotClick('chest', i, r, s)));
      }
      chestSection.appendChild(grid);
      modal.appendChild(chestSection);
    } else if (this.activeContainerType === 'furnace') {
      const fSection = document.createElement('div');
      fSection.className = 'furnace-section';
      const inputSlot = this.createSlot(this.activeContainerData.input, (r, s) => this.handleSlotClick('furnace_in', 0, r, s));
      const fuelSlot = this.createSlot(this.activeContainerData.fuel, (r, s) => this.handleSlotClick('furnace_fuel', 0, r, s));
      const outSlot = this.createSlot(this.activeContainerData.output, (r, s) => this.handleSlotClick('furnace_out', 0, r, s));

      fSection.innerHTML = `
        <div class="furnace-slots-left">
          <div class="slot-label">Input</div>
          <div class="f-in-holder"></div>
          <div class="slot-label">Fuel</div>
          <div class="f-fuel-holder"></div>
        </div>
        <div class="furnace-progress-arrow">➔</div>
        <div class="furnace-slots-right">
          <div class="slot-label">Output</div>
          <div class="f-out-holder"></div>
        </div>
      `;
      fSection.querySelector('.f-in-holder').appendChild(inputSlot);
      fSection.querySelector('.f-fuel-holder').appendChild(fuelSlot);
      fSection.querySelector('.f-out-holder').appendChild(outSlot);
      modal.appendChild(fSection);
    } else if (this.activeContainerType === 'crafting_table') {
      const cSection = document.createElement('div');
      cSection.className = 'crafting-3x3-section';
      const grid = document.createElement('div');
      grid.className = 'crafting-3x3-grid';
      for (let i = 0; i < 9; i++) {
        grid.appendChild(this.createSlot(this.craftGrid3x3[i], (r, s) => this.handleSlotClick('craft3x3', i, r, s)));
      }

      const match = recipeRegistry.findMatch(this.craftGrid3x3, 3, 3);
      const outSlot = this.createSlot(match ? match.output : null, () => this.handleCraftExtract(this.craftGrid3x3, 3));

      cSection.appendChild(grid);
      const arrow = document.createElement('div');
      arrow.className = 'craft-arrow';
      arrow.textContent = '➔';
      cSection.appendChild(arrow);
      cSection.appendChild(outSlot);
      modal.appendChild(cSection);
    } else {
      // 2x2 Crafting in Player Inventory
      const c2Section = document.createElement('div');
      c2Section.className = 'crafting-2x2-section';
      const grid = document.createElement('div');
      grid.className = 'crafting-2x2-grid';
      for (let i = 0; i < 4; i++) {
        grid.appendChild(this.createSlot(this.craftGrid2x2[i], (r, s) => this.handleSlotClick('craft2x2', i, r, s)));
      }

      const match = recipeRegistry.findMatch(this.craftGrid2x2, 2, 2);
      const outSlot = this.createSlot(match ? match.output : null, () => this.handleCraftExtract(this.craftGrid2x2, 2));

      c2Section.appendChild(grid);
      const arrow = document.createElement('div');
      arrow.className = 'craft-arrow';
      arrow.textContent = '➔';
      c2Section.appendChild(arrow);
      c2Section.appendChild(outSlot);
      modal.appendChild(c2Section);
    }

    // Divider
    const div = document.createElement('div');
    div.className = 'inv-section-title';
    div.textContent = 'Player Inventory';
    modal.appendChild(div);

    // Main Inventory (27 slots: 9 to 35)
    const mainGrid = document.createElement('div');
    mainGrid.className = 'player-main-grid';
    for (let i = 9; i < 36; i++) {
      mainGrid.appendChild(this.createSlot(this.game.player.inventory[i], (r, s) => this.handleSlotClick('player', i, r, s)));
    }
    modal.appendChild(mainGrid);

    // Hotbar (9 slots: 0 to 8)
    const hotbarTitle = document.createElement('div');
    hotbarTitle.className = 'inv-section-title';
    hotbarTitle.textContent = 'Hotbar';
    modal.appendChild(hotbarTitle);

    const hotbarGrid = document.createElement('div');
    hotbarGrid.className = 'player-hotbar-grid';
    for (let i = 0; i < 9; i++) {
      hotbarGrid.appendChild(this.createSlot(this.game.player.inventory[i], (r, s) => this.handleSlotClick('player', i, r, s)));
    }
    modal.appendChild(hotbarGrid);

    this.container.appendChild(modal);
  }
}
