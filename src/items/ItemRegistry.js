import { BLOCK } from '../blocks/BlockRegistry.js';

export class ItemRegistry {
  constructor() {
    this.items = new Map();
    this.init();
  }

  register(def) {
    this.items.set(def.id, {
      id: def.id,
      name: def.name,
      maxStack: def.maxStack || 64,
      isBlock: !!def.isBlock,
      blockId: def.blockId || null,
      toolType: def.toolType || null,
      toolSpeed: def.toolSpeed || 1,
      toolLevel: def.toolLevel || 0,
      attackDamage: def.attackDamage || 1,
      maxDurability: def.maxDurability || null,
      isFood: !!def.isFood,
      nutrition: def.nutrition || 0,
      color: def.color || '#ffffff',
      iconChar: def.iconChar || '📦',
    });
  }

  get(id) {
    if (this.items.has(id)) return this.items.get(id);
    // If it's a numeric block ID
    if (typeof id === 'number') {
      return this.items.get(`block_${id}`) || {
        id,
        name: 'Block',
        maxStack: 64,
        isBlock: true,
        blockId: id,
        color: '#aaaaaa',
        iconChar: '🧱',
      };
    }
    return null;
  }

  init() {
    // 1. Block Items
    const registerBlockItem = (blockId, name, color, iconChar = '🧱') => {
      this.register({
        id: `block_${blockId}`,
        name,
        isBlock: true,
        blockId,
        color,
        iconChar,
      });
      // Also register numeric ID alias
      this.items.set(blockId, this.items.get(`block_${blockId}`));
    };

    registerBlockItem(BLOCK.GRASS, 'Grass Block', '#55a52d');
    registerBlockItem(BLOCK.DIRT, 'Dirt', '#825532');
    registerBlockItem(BLOCK.STONE, 'Stone', '#808084');
    registerBlockItem(BLOCK.COBBLESTONE, 'Cobblestone', '#737376');
    registerBlockItem(BLOCK.SAND, 'Sand', '#dece8e');
    registerBlockItem(BLOCK.GRAVEL, 'Gravel', '#878282');
    registerBlockItem(BLOCK.WOOD_OAK, 'Oak Log', '#694a2a', '🪵');
    registerBlockItem(BLOCK.LEAVES_OAK, 'Oak Leaves', '#378723', '🍃');
    registerBlockItem(BLOCK.WOOD_BIRCH, 'Birch Log', '#dcdcd7', '🪵');
    registerBlockItem(BLOCK.LEAVES_BIRCH, 'Birch Leaves', '#5fa52d', '🍃');
    registerBlockItem(BLOCK.WOOD_PINE, 'Pine Log', '#412d1c', '🪵');
    registerBlockItem(BLOCK.LEAVES_PINE, 'Pine Leaves', '#1e5528', '🍃');
    registerBlockItem(BLOCK.PLANKS, 'Wood Planks', '#a8804e', '🪵');
    registerBlockItem(BLOCK.GLASS, 'Glass', '#d7f0ff');
    registerBlockItem(BLOCK.SNOW, 'Snow Block', '#f0f4fa');
    registerBlockItem(BLOCK.ICE, 'Ice', '#afdbf5');
    registerBlockItem(BLOCK.CLAY, 'Clay', '#a0a5af');
    registerBlockItem(BLOCK.CACTUS, 'Cactus', '#2d7d28');
    registerBlockItem(BLOCK.FLOWER_YELLOW, 'Yellow Flower', '#ffdf00', '🌼');
    registerBlockItem(BLOCK.FLOWER_RED, 'Red Flower', '#e82535', '🌹');
    registerBlockItem(BLOCK.TALL_GRASS, 'Tall Grass', '#4fa32d', '🌿');
    registerBlockItem(BLOCK.MUSHROOM_RED, 'Red Mushroom', '#d92525', '🍄');
    registerBlockItem(BLOCK.MUSHROOM_BROWN, 'Brown Mushroom', '#8f6843', '🍄');
    registerBlockItem(BLOCK.CRAFTING_TABLE, 'Crafting Table', '#b9915f', '🛠️');
    registerBlockItem(BLOCK.FURNACE, 'Furnace', '#737376', '🔥');
    registerBlockItem(BLOCK.CHEST, 'Storage Chest', '#966e37', '📦');
    registerBlockItem(BLOCK.TORCH, 'Torch', '#ffaa00', '🕯️');
    registerBlockItem(BLOCK.BED, 'Bed', '#b81424', '🛏️');
    registerBlockItem(BLOCK.STONE_BRICKS, 'Stone Bricks', '#7d7d80');
    registerBlockItem(BLOCK.WOOD_DOOR, 'Wooden Door', '#a8804e', '🚪');
    registerBlockItem(BLOCK.WOOD_FENCE, 'Wooden Fence', '#9b6b3b');

    // 2. Raw Materials
    this.register({ id: 'stick', name: 'Stick', color: '#8f6843', iconChar: '🥢' });
    this.register({ id: 'coal', name: 'Coal', color: '#2b2b2b', iconChar: '⚫' });
    this.register({ id: 'raw_copper', name: 'Raw Copper', color: '#c36937', iconChar: '🟤' });
    this.register({ id: 'copper_ingot', name: 'Copper Ingot', color: '#d87f4c', iconChar: '🟧' });
    this.register({ id: 'raw_iron', name: 'Raw Iron', color: '#cfaf8c', iconChar: '⚪' });
    this.register({ id: 'iron_ingot', name: 'Iron Ingot', color: '#e8e8e8', iconChar: '◽' });
    this.register({ id: 'raw_gold', name: 'Raw Gold', color: '#ebc31e', iconChar: '🟡' });
    this.register({ id: 'gold_ingot', name: 'Gold Ingot', color: '#ffd700', iconChar: '🟨' });
    this.register({ id: 'red_crystal', name: 'Red Crystal', color: '#dc191e', iconChar: '♦️' });
    this.register({ id: 'gem', name: 'Radiant Gem', color: '#1ed7be', iconChar: '💎' });
    this.register({ id: 'clay_ball', name: 'Clay Ball', color: '#a0a5af', iconChar: '⚪' });
    this.register({ id: 'snowball', name: 'Snowball', color: '#f0f4fa', iconChar: '❄️' });

    // 3. Food & Seeds
    this.register({ id: 'apple', name: 'Red Apple', isFood: true, nutrition: 4, color: '#e62222', iconChar: '🍎' });
    this.register({ id: 'seeds_wheat', name: 'Wheat Seeds', color: '#9ec435', iconChar: '🌱' });
    this.register({ id: 'wheat', name: 'Wheat', color: '#e0c038', iconChar: '🌾' });
    this.register({ id: 'bread', name: 'Loaf of Bread', isFood: true, nutrition: 6, color: '#c28540', iconChar: '🍞' });
    this.register({ id: 'raw_meat', name: 'Raw Meat', isFood: true, nutrition: 2, color: '#a83232', iconChar: '🥩' });
    this.register({ id: 'cooked_meat', name: 'Roasted Steak', isFood: true, nutrition: 8, color: '#7a321e', iconChar: '🍖' });

    // 4. Tools & Weapons
    const tools = [
      { tier: 'wooden', name: 'Wooden', speed: 2, level: 0, dur: 60, col: '#a8804e' },
      { tier: 'stone', name: 'Stone', speed: 4, level: 1, dur: 132, col: '#808084' },
      { tier: 'iron', name: 'Iron', speed: 6, level: 2, dur: 250, col: '#e8e8e8' },
      { tier: 'gold', name: 'Gold', speed: 10, level: 2, dur: 36, col: '#ffd700' },
      { tier: 'gem', name: 'Gem', speed: 12, level: 3, dur: 1200, col: '#1ed7be' },
    ];

    tools.forEach((t) => {
      // Pickaxes
      this.register({
        id: `${t.tier}_pickaxe`,
        name: `${t.name} Pickaxe`,
        maxStack: 1,
        toolType: 'pickaxe',
        toolSpeed: t.speed,
        toolLevel: t.level,
        attackDamage: 2 + t.level,
        maxDurability: t.dur,
        color: t.col,
        iconChar: '⛏️',
      });

      // Axes
      this.register({
        id: `${t.tier}_axe`,
        name: `${t.name} Axe`,
        maxStack: 1,
        toolType: 'axe',
        toolSpeed: t.speed,
        toolLevel: t.level,
        attackDamage: 3 + t.level * 2,
        maxDurability: t.dur,
        color: t.col,
        iconChar: '🪓',
      });

      // Shovels
      this.register({
        id: `${t.tier}_shovel`,
        name: `${t.name} Shovel`,
        maxStack: 1,
        toolType: 'shovel',
        toolSpeed: t.speed,
        toolLevel: t.level,
        attackDamage: 1 + t.level,
        maxDurability: t.dur,
        color: t.col,
        iconChar: '🥄',
      });

      // Swords
      this.register({
        id: `${t.tier}_sword`,
        name: `${t.name} Sword`,
        maxStack: 1,
        toolType: 'sword',
        toolSpeed: 1.5,
        attackDamage: 4 + t.level * 2,
        maxDurability: t.dur,
        color: t.col,
        iconChar: '⚔️',
      });

      // Hoes
      this.register({
        id: `${t.tier}_hoe`,
        name: `${t.name} Hoe`,
        maxStack: 1,
        toolType: 'hoe',
        toolSpeed: 1,
        attackDamage: 1,
        maxDurability: t.dur,
        color: t.col,
        iconChar: '🔨',
      });
    });
  }
}

export const itemRegistry = new ItemRegistry();
