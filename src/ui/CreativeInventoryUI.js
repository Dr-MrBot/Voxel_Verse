import { itemRegistry } from '../items/ItemRegistry.js';
import { BLOCK } from '../blocks/BlockRegistry.js';

export const CREATIVE_CATEGORIES = {
  BUILDING: [
    BLOCK.WOOD_PLANKS, BLOCK.COBBLESTONE, BLOCK.STONE, BLOCK.STONE_BRICKS,
    BLOCK.SAND, BLOCK.GRAVEL, BLOCK.GLASS, BLOCK.DIRT, BLOCK.CLAY,
  ],
  NATURE: [
    BLOCK.GRASS, BLOCK.DIRT, BLOCK.WOOD_OAK, BLOCK.WOOD_BIRCH, BLOCK.WOOD_PINE,
    BLOCK.LEAVES_OAK, BLOCK.LEAVES_BIRCH, BLOCK.CACTUS, BLOCK.FLOWER_RED,
    BLOCK.FLOWER_YELLOW, BLOCK.MUSHROOM_BROWN, BLOCK.MUSHROOM_RED, 'seeds_wheat', 'apple',
  ],
  ORES: [
    BLOCK.COAL_ORE, BLOCK.COPPER_ORE, BLOCK.IRON_ORE, BLOCK.GOLD_ORE, BLOCK.GEM_ORE,
    'coal', 'raw_copper', 'raw_iron', 'copper_ingot', 'iron_ingot', 'gold_ingot', 'gem', 'red_crystal',
  ],
  TOOLS: [
    'wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe', 'gold_pickaxe', 'gem_pickaxe',
    'wooden_axe', 'stone_axe', 'iron_axe', 'gold_axe', 'gem_axe',
    'wooden_shovel', 'stone_shovel', 'iron_shovel', 'gold_shovel', 'gem_shovel',
    'wooden_hoe', 'stone_hoe', 'iron_hoe', 'gold_hoe', 'gem_hoe',
  ],
  COMBAT: [
    'wooden_sword', 'stone_sword', 'iron_sword', 'gold_sword', 'gem_sword',
  ],
  FOOD: [
    'apple', 'bread', 'cooked_meat', 'raw_meat',
  ],
  DECORATION: [
    BLOCK.TORCH, BLOCK.LANTERN, BLOCK.BED, BLOCK.WOOD_DOOR, BLOCK.LADDER,
  ],
  FUNCTIONAL: [
    BLOCK.CRAFTING_TABLE, BLOCK.FURNACE, BLOCK.CHEST,
  ],
};

export class CreativeInventoryUI {
  constructor(game) {
    this.game = game;
    this.currentCategory = 'BUILDING';
    this.searchQuery = '';
    this.initDOM();
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.id = 'creative-inventory-modal';
    this.container.className = 'modal-overlay hidden';

    this.container.innerHTML = `
      <div class="creative-inventory-panel">
        <div class="creative-header">
          <div class="creative-title">
            <span class="badge-creative">CREATIVE</span>
            <h2>Item & Block Catalog</h2>
          </div>
          <div class="creative-search-wrapper">
            <input type="text" id="creative-search" placeholder="Search items & blocks..." autocomplete="off" />
          </div>
          <button class="btn-close" id="btn-close-creative">✕</button>
        </div>

        <div class="creative-tabs" id="creative-tabs">
          ${Object.keys(CREATIVE_CATEGORIES).map((cat, idx) => `
            <button class="creative-tab-btn ${idx === 0 ? 'active' : ''}" data-category="${cat}">
              ${cat}
            </button>
          `).join('')}
        </div>

        <div class="creative-grid-container">
          <div class="creative-items-grid" id="creative-items-grid"></div>
        </div>

        <div class="creative-hotbar-section">
          <div class="creative-hotbar-label">HOTBAR QUICK-ASSIGN (Click item above to equip)</div>
          <div class="creative-hotbar-slots" id="creative-hotbar-slots"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Event listeners
    this.container.querySelector('#btn-close-creative').addEventListener('click', () => {
      this.close();
    });

    const searchInput = this.container.querySelector('#creative-search');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderGrid();
    });

    this.container.querySelectorAll('.creative-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.container.querySelectorAll('.creative-tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentCategory = e.target.dataset.category;
        this.renderGrid();
      });
    });
  }

  open() {
    this.container.classList.remove('hidden');
    this.container.querySelector('#creative-search').value = '';
    this.searchQuery = '';
    this.renderGrid();
    this.renderHotbar();
    this.game.input.releasePointerLock();
  }

  close() {
    this.container.classList.add('hidden');
    this.game.input.requestPointerLock();
  }

  isOpen() {
    return !this.container.classList.contains('hidden');
  }

  renderGrid() {
    const grid = this.container.querySelector('#creative-items-grid');
    grid.innerHTML = '';

    let itemsToShow = [];

    if (this.searchQuery) {
      // Search across all items
      itemsToShow = itemRegistry.getAllItems().filter((item) => {
        return item.name.toLowerCase().includes(this.searchQuery);
      }).map(item => item.id);
    } else {
      itemsToShow = CREATIVE_CATEGORIES[this.currentCategory] || [];
    }

    itemsToShow.forEach((itemId) => {
      const itemDef = itemRegistry.get(itemId);
      if (!itemDef) return;

      const card = document.createElement('div');
      card.className = 'creative-item-card';
      card.title = itemDef.name;

      card.innerHTML = `
        <div class="item-icon-wrapper">
          <div class="item-badge-count">∞</div>
          <div class="item-name-label">${itemDef.name}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        // Add full stack of this item into hotbar or player inventory
        const count = itemDef.maxStack || 64;
        const player = this.game.player;
        if (player) {
          // Put in current hotbar slot directly
          const curSlot = player.selectedHotbarSlot;
          player.inventory[curSlot] = { id: itemId, count, durability: itemDef.maxDurability };
          this.game.ui.showNotification(`Equipped ${itemDef.name}`);
          this.renderHotbar();
          this.game.hud.updateHotbarUI();
        }
      });

      grid.appendChild(card);
    });
  }

  renderHotbar() {
    const hotbarContainer = this.container.querySelector('#creative-hotbar-slots');
    hotbarContainer.innerHTML = '';

    const player = this.game.player;
    if (!player) return;

    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = `creative-hotbar-slot ${player.selectedHotbarSlot === i ? 'selected' : ''}`;
      slot.dataset.slot = i;

      const item = player.inventory[i];
      if (item) {
        const itemDef = itemRegistry.get(item.id);
        slot.innerHTML = `
          <div class="slot-item-name">${itemDef ? itemDef.name : item.id}</div>
          <div class="slot-count">${item.count}</div>
        `;
      } else {
        slot.innerHTML = `<span class="slot-empty">${i + 1}</span>`;
      }

      slot.addEventListener('click', () => {
        player.selectedHotbarSlot = i;
        this.renderHotbar();
        this.game.hud.updateHotbarUI();
      });

      hotbarContainer.appendChild(slot);
    }
  }
}
