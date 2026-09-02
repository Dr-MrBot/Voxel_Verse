// Data-driven Block Registry
export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  COBBLESTONE: 4,
  SAND: 5,
  GRAVEL: 6,
  WOOD_OAK: 7,
  LEAVES_OAK: 8,
  WOOD_BIRCH: 9,
  LEAVES_BIRCH: 10,
  WOOD_PINE: 11,
  LEAVES_PINE: 12,
  PLANKS: 13,
  GLASS: 14,
  WATER: 15,
  COAL_ORE: 16,
  COPPER_ORE: 17,
  IRON_ORE: 18,
  GOLD_ORE: 19,
  RED_CRYSTAL_ORE: 20,
  GEM_ORE: 21,
  SNOW: 22,
  ICE: 23,
  CLAY: 24,
  CACTUS: 25,
  FLOWER_YELLOW: 26,
  FLOWER_RED: 27,
  TALL_GRASS: 28,
  MUSHROOM_RED: 29,
  MUSHROOM_BROWN: 30,
  CRAFTING_TABLE: 31,
  FURNACE: 32,
  FURNACE_ACTIVE: 33,
  CHEST: 34,
  TORCH: 35,
  FARMLAND: 36,
  FARMLAND_WET: 37,
  CROPS_WHEAT_0: 38,
  CROPS_WHEAT_1: 39,
  CROPS_WHEAT_2: 40,
  CROPS_WHEAT_3: 41,
  BED: 42,
  STONE_BRICKS: 43,
  WOOD_DOOR: 44,
  WOOD_FENCE: 45,
};

// Texture Atlas Indices (16x16 grid on atlas = 256 texture slots)
export const TEX = {
  GRASS_TOP: 0,
  GRASS_SIDE: 1,
  DIRT: 2,
  STONE: 3,
  COBBLESTONE: 4,
  SAND: 5,
  GRAVEL: 6,
  WOOD_OAK_SIDE: 7,
  WOOD_OAK_TOP: 8,
  LEAVES_OAK: 9,
  WOOD_BIRCH_SIDE: 10,
  LEAVES_BIRCH: 11,
  WOOD_PINE_SIDE: 12,
  LEAVES_PINE: 13,
  PLANKS: 14,
  GLASS: 15,
  WATER: 16,
  COAL_ORE: 17,
  COPPER_ORE: 18,
  IRON_ORE: 19,
  GOLD_ORE: 20,
  RED_CRYSTAL_ORE: 21,
  GEM_ORE: 22,
  SNOW: 23,
  SNOW_SIDE: 24,
  ICE: 25,
  CLAY: 26,
  CACTUS_SIDE: 27,
  CACTUS_TOP: 28,
  FLOWER_YELLOW: 29,
  FLOWER_RED: 30,
  TALL_GRASS: 31,
  MUSHROOM_RED: 32,
  MUSHROOM_BROWN: 33,
  CRAFTING_TABLE_TOP: 34,
  CRAFTING_TABLE_SIDE: 35,
  FURNACE_SIDE: 36,
  FURNACE_FRONT: 37,
  FURNACE_FRONT_ON: 38,
  FURNACE_TOP: 39,
  CHEST_TOP: 40,
  CHEST_SIDE: 41,
  CHEST_FRONT: 42,
  TORCH: 43,
  FARMLAND_TOP: 44,
  FARMLAND_WET_TOP: 45,
  CROP_0: 46,
  CROP_1: 47,
  CROP_2: 48,
  CROP_3: 49,
  BED_TOP: 50,
  BED_SIDE: 51,
  STONE_BRICKS: 52,
  WOOD_DOOR_TOP: 53,
  WOOD_DOOR_BOTTOM: 54,
  WOOD_FENCE: 55,
  CRACK_0: 60,
  CRACK_1: 61,
  CRACK_2: 62,
  CRACK_3: 63,
  CRACK_4: 64,
};

export class BlockRegistry {
  constructor() {
    this.blocks = new Map();
    this.init();
  }

  register(def) {
    this.blocks.set(def.id, {
      id: def.id,
      name: def.name || 'Block',
      solid: def.solid !== false,
      transparent: def.transparent === true,
      liquid: def.liquid === true,
      crossMesh: def.crossMesh === true,
      hardness: def.hardness !== undefined ? def.hardness : 1.0,
      toolType: def.toolType || null,
      toolLevel: def.toolLevel || 0,
      lightLevel: def.lightLevel || 0,
      sound: def.sound || 'stone',
      drops: def.drops || [{ id: def.id, count: 1 }],
      textures: def.textures || { all: 0 },
    });
  }

  get(id) {
    return this.blocks.get(id) || this.blocks.get(BLOCK.AIR);
  }

  // Returns texture atlas index for face: 0:right(+x), 1:left(-x), 2:top(+y), 3:bottom(-y), 4:front(+z), 5:back(-z)
  getTextureForFace(blockId, faceIndex) {
    const block = this.get(blockId);
    if (!block || !block.textures) return 0;
    const t = block.textures;
    if (t.all !== undefined) return t.all;

    // Face mapping: 2 = top, 3 = bottom
    if (faceIndex === 2 && t.top !== undefined) return t.top;
    if (faceIndex === 3 && t.bottom !== undefined) return t.bottom;
    if (faceIndex === 4 && t.front !== undefined) return t.front;
    if (faceIndex === 5 && t.back !== undefined) return t.back;
    if (faceIndex === 0 && t.right !== undefined) return t.right;
    if (faceIndex === 1 && t.left !== undefined) return t.left;

    return t.side !== undefined ? t.side : (t.top !== undefined ? t.top : 0);
  }

  init() {
    this.register({
      id: BLOCK.AIR,
      name: 'Air',
      solid: false,
      transparent: true,
      hardness: 0,
    });

    this.register({
      id: BLOCK.GRASS,
      name: 'Grass Block',
      hardness: 0.6,
      toolType: 'shovel',
      sound: 'grass',
      textures: { top: TEX.GRASS_TOP, bottom: TEX.DIRT, side: TEX.GRASS_SIDE },
      drops: [{ id: BLOCK.DIRT, count: 1 }],
    });

    this.register({
      id: BLOCK.DIRT,
      name: 'Dirt',
      hardness: 0.5,
      toolType: 'shovel',
      sound: 'dirt',
      textures: { all: TEX.DIRT },
      drops: [{ id: BLOCK.DIRT, count: 1 }],
    });

    this.register({
      id: BLOCK.STONE,
      name: 'Stone',
      hardness: 1.5,
      toolType: 'pickaxe',
      toolLevel: 0,
      sound: 'stone',
      textures: { all: TEX.STONE },
      drops: [{ id: BLOCK.COBBLESTONE, count: 1 }],
    });

    this.register({
      id: BLOCK.COBBLESTONE,
      name: 'Cobblestone',
      hardness: 2.0,
      toolType: 'pickaxe',
      toolLevel: 0,
      sound: 'stone',
      textures: { all: TEX.COBBLESTONE },
    });

    this.register({
      id: BLOCK.SAND,
      name: 'Sand',
      hardness: 0.5,
      toolType: 'shovel',
      sound: 'sand',
      textures: { all: TEX.SAND },
    });

    this.register({
      id: BLOCK.GRAVEL,
      name: 'Gravel',
      hardness: 0.6,
      toolType: 'shovel',
      sound: 'gravel',
      textures: { all: TEX.GRAVEL },
    });

    this.register({
      id: BLOCK.WOOD_OAK,
      name: 'Oak Log',
      hardness: 2.0,
      toolType: 'axe',
      sound: 'wood',
      textures: { top: TEX.WOOD_OAK_TOP, bottom: TEX.WOOD_OAK_TOP, side: TEX.WOOD_OAK_SIDE },
    });

    this.register({
      id: BLOCK.LEAVES_OAK,
      name: 'Oak Leaves',
      hardness: 0.2,
      transparent: true,
      sound: 'grass',
      textures: { all: TEX.LEAVES_OAK },
      drops: [{ id: 'sapling_oak', count: 1, chance: 0.15 }, { id: 'apple', count: 1, chance: 0.05 }],
    });

    this.register({
      id: BLOCK.WOOD_BIRCH,
      name: 'Birch Log',
      hardness: 2.0,
      toolType: 'axe',
      sound: 'wood',
      textures: { top: TEX.WOOD_OAK_TOP, bottom: TEX.WOOD_OAK_TOP, side: TEX.WOOD_BIRCH_SIDE },
    });

    this.register({
      id: BLOCK.LEAVES_BIRCH,
      name: 'Birch Leaves',
      hardness: 0.2,
      transparent: true,
      sound: 'grass',
      textures: { all: TEX.LEAVES_BIRCH },
    });

    this.register({
      id: BLOCK.WOOD_PINE,
      name: 'Pine Log',
      hardness: 2.0,
      toolType: 'axe',
      sound: 'wood',
      textures: { top: TEX.WOOD_OAK_TOP, bottom: TEX.WOOD_OAK_TOP, side: TEX.WOOD_PINE_SIDE },
    });

    this.register({
      id: BLOCK.LEAVES_PINE,
      name: 'Pine Leaves',
      hardness: 0.2,
      transparent: true,
      sound: 'grass',
      textures: { all: TEX.LEAVES_PINE },
    });

    this.register({
      id: BLOCK.PLANKS,
      name: 'Wood Planks',
      hardness: 1.5,
      toolType: 'axe',
      sound: 'wood',
      textures: { all: TEX.PLANKS },
    });

    this.register({
      id: BLOCK.GLASS,
      name: 'Glass',
      hardness: 0.3,
      transparent: true,
      sound: 'glass',
      textures: { all: TEX.GLASS },
      drops: [],
    });

    this.register({
      id: BLOCK.WATER,
      name: 'Water',
      solid: false,
      transparent: true,
      liquid: true,
      hardness: 100,
      textures: { all: TEX.WATER },
      drops: [],
    });

    this.register({
      id: BLOCK.COAL_ORE,
      name: 'Coal Ore',
      hardness: 3.0,
      toolType: 'pickaxe',
      toolLevel: 0,
      sound: 'stone',
      textures: { all: TEX.COAL_ORE },
      drops: [{ id: 'coal', count: 1 }],
    });

    this.register({
      id: BLOCK.COPPER_ORE,
      name: 'Copper Ore',
      hardness: 3.0,
      toolType: 'pickaxe',
      toolLevel: 1,
      sound: 'stone',
      textures: { all: TEX.COPPER_ORE },
      drops: [{ id: 'raw_copper', count: 1 }],
    });

    this.register({
      id: BLOCK.IRON_ORE,
      name: 'Iron Ore',
      hardness: 3.5,
      toolType: 'pickaxe',
      toolLevel: 1,
      sound: 'stone',
      textures: { all: TEX.IRON_ORE },
      drops: [{ id: 'raw_iron', count: 1 }],
    });

    this.register({
      id: BLOCK.GOLD_ORE,
      name: 'Gold Ore',
      hardness: 4.0,
      toolType: 'pickaxe',
      toolLevel: 2,
      sound: 'stone',
      textures: { all: TEX.GOLD_ORE },
      drops: [{ id: 'raw_gold', count: 1 }],
    });

    this.register({
      id: BLOCK.RED_CRYSTAL_ORE,
      name: 'Red Crystal Ore',
      hardness: 4.0,
      toolType: 'pickaxe',
      toolLevel: 2,
      sound: 'stone',
      textures: { all: TEX.RED_CRYSTAL_ORE },
      drops: [{ id: 'red_crystal', count: 3, min: 2, max: 4 }],
    });

    this.register({
      id: BLOCK.GEM_ORE,
      name: 'Gem Ore',
      hardness: 5.0,
      toolType: 'pickaxe',
      toolLevel: 2,
      sound: 'stone',
      textures: { all: TEX.GEM_ORE },
      drops: [{ id: 'gem', count: 1 }],
    });

    this.register({
      id: BLOCK.SNOW,
      name: 'Snow Block',
      hardness: 0.3,
      toolType: 'shovel',
      sound: 'snow',
      textures: { top: TEX.SNOW, bottom: TEX.DIRT, side: TEX.SNOW_SIDE },
      drops: [{ id: 'snowball', count: 4 }],
    });

    this.register({
      id: BLOCK.ICE,
      name: 'Ice',
      hardness: 0.5,
      transparent: true,
      sound: 'glass',
      textures: { all: TEX.ICE },
      drops: [],
    });

    this.register({
      id: BLOCK.CLAY,
      name: 'Clay',
      hardness: 0.6,
      toolType: 'shovel',
      sound: 'dirt',
      textures: { all: TEX.CLAY },
      drops: [{ id: 'clay_ball', count: 4 }],
    });

    this.register({
      id: BLOCK.CACTUS,
      name: 'Cactus',
      hardness: 0.4,
      transparent: true,
      sound: 'wood',
      textures: { top: TEX.CACTUS_TOP, bottom: TEX.CACTUS_TOP, side: TEX.CACTUS_SIDE },
    });

    this.register({
      id: BLOCK.FLOWER_YELLOW,
      name: 'Yellow Flower',
      solid: false,
      transparent: true,
      crossMesh: true,
      hardness: 0,
      sound: 'grass',
      textures: { all: TEX.FLOWER_YELLOW },
    });

    this.register({
      id: BLOCK.FLOWER_RED,
      name: 'Red Flower',
      solid: false,
      transparent: true,
      crossMesh: true,
      hardness: 0,
      sound: 'grass',
      textures: { all: TEX.FLOWER_RED },
    });

    this.register({
      id: BLOCK.TALL_GRASS,
      name: 'Tall Grass',
      solid: false,
      transparent: true,
      crossMesh: true,
      hardness: 0,
      sound: 'grass',
      textures: { all: TEX.TALL_GRASS },
      drops: [{ id: 'seeds_wheat', count: 1, chance: 0.3 }],
    });

    this.register({
      id: BLOCK.MUSHROOM_RED,
      name: 'Red Mushroom',
      solid: false,
      transparent: true,
      crossMesh: true,
      hardness: 0,
      sound: 'grass',
      textures: { all: TEX.MUSHROOM_RED },
    });

    this.register({
      id: BLOCK.MUSHROOM_BROWN,
      name: 'Brown Mushroom',
      solid: false,
      transparent: true,
      crossMesh: true,
      hardness: 0,
      sound: 'grass',
      textures: { all: TEX.MUSHROOM_BROWN },
    });

    this.register({
      id: BLOCK.CRAFTING_TABLE,
      name: 'Crafting Table',
      hardness: 2.0,
      toolType: 'axe',
      sound: 'wood',
      textures: { top: TEX.CRAFTING_TABLE_TOP, bottom: TEX.PLANKS, side: TEX.CRAFTING_TABLE_SIDE },
    });

    this.register({
      id: BLOCK.FURNACE,
      name: 'Furnace',
      hardness: 3.5,
      toolType: 'pickaxe',
      sound: 'stone',
      textures: { top: TEX.FURNACE_TOP, bottom: TEX.FURNACE_TOP, side: TEX.FURNACE_SIDE, front: TEX.FURNACE_FRONT },
    });

    this.register({
      id: BLOCK.FURNACE_ACTIVE,
      name: 'Lit Furnace',
      hardness: 3.5,
      lightLevel: 13,
      toolType: 'pickaxe',
      sound: 'stone',
      textures: { top: TEX.FURNACE_TOP, bottom: TEX.FURNACE_TOP, side: TEX.FURNACE_SIDE, front: TEX.FURNACE_FRONT_ON },
      drops: [{ id: BLOCK.FURNACE, count: 1 }],
    });

    this.register({
      id: BLOCK.CHEST,
      name: 'Chest',
      hardness: 2.5,
      toolType: 'axe',
      sound: 'wood',
      textures: { top: TEX.CHEST_TOP, bottom: TEX.CHEST_TOP, side: TEX.CHEST_SIDE, front: TEX.CHEST_FRONT },
    });

    this.register({
      id: BLOCK.TORCH,
      name: 'Torch',
      solid: false,
      transparent: true,
      crossMesh: true,
      lightLevel: 14,
      hardness: 0,
      sound: 'wood',
      textures: { all: TEX.TORCH },
    });

    this.register({
      id: BLOCK.FARMLAND,
      name: 'Farmland',
      hardness: 0.6,
      toolType: 'shovel',
      sound: 'dirt',
      textures: { top: TEX.FARMLAND_TOP, bottom: TEX.DIRT, side: TEX.DIRT },
      drops: [{ id: BLOCK.DIRT, count: 1 }],
    });

    this.register({
      id: BLOCK.FARMLAND_WET,
      name: 'Hydrated Farmland',
      hardness: 0.6,
      toolType: 'shovel',
      sound: 'dirt',
      textures: { top: TEX.FARMLAND_WET_TOP, bottom: TEX.DIRT, side: TEX.DIRT },
      drops: [{ id: BLOCK.DIRT, count: 1 }],
    });

    this.register({
      id: BLOCK.CROPS_WHEAT_0,
      name: 'Wheat Seeds',
      solid: false,
      transparent: true,
      crossMesh: true,
      hardness: 0,
      sound: 'grass',
      textures: { all: TEX.CROP_0 },
      drops: [{ id: 'seeds_wheat', count: 1 }],
    });

    this.register({
      id: BLOCK.CROPS_WHEAT_1,
      name: 'Growing Wheat',
      solid: false,
      transparent: true,
      crossMesh: true,
      hardness: 0,
      sound: 'grass',
      textures: { all: TEX.CROP_1 },
      drops: [{ id: 'seeds_wheat', count: 1 }],
    });

    this.register({
      id: BLOCK.CROPS_WHEAT_2,
      name: 'Growing Wheat',
      solid: false,
      transparent: true,
      crossMesh: true,
      hardness: 0,
      sound: 'grass',
      textures: { all: TEX.CROP_2 },
      drops: [{ id: 'seeds_wheat', count: 1 }],
    });

    this.register({
      id: BLOCK.CROPS_WHEAT_3,
      name: 'Ripe Wheat',
      solid: false,
      transparent: true,
      crossMesh: true,
      hardness: 0,
      sound: 'grass',
      textures: { all: TEX.CROP_3 },
      drops: [{ id: 'wheat', count: 1 }, { id: 'seeds_wheat', count: 2 }],
    });

    this.register({
      id: BLOCK.BED,
      name: 'Bed',
      hardness: 0.8,
      toolType: 'axe',
      sound: 'wood',
      textures: { top: TEX.BED_TOP, bottom: TEX.PLANKS, side: TEX.BED_SIDE },
    });

    this.register({
      id: BLOCK.STONE_BRICKS,
      name: 'Stone Bricks',
      hardness: 2.0,
      toolType: 'pickaxe',
      sound: 'stone',
      textures: { all: TEX.STONE_BRICKS },
    });

    this.register({
      id: BLOCK.WOOD_DOOR,
      name: 'Wooden Door',
      hardness: 1.5,
      transparent: true,
      toolType: 'axe',
      sound: 'wood',
      textures: { top: TEX.WOOD_DOOR_TOP, bottom: TEX.WOOD_DOOR_BOTTOM, side: TEX.PLANKS },
    });

    this.register({
      id: BLOCK.WOOD_FENCE,
      name: 'Wooden Fence',
      hardness: 1.5,
      transparent: true,
      toolType: 'axe',
      sound: 'wood',
      textures: { all: TEX.WOOD_FENCE },
    });
  }
}

export const blockRegistry = new BlockRegistry();
