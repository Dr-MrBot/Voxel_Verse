import { BLOCK } from '../blocks/BlockRegistry.js';

export const FUELS = {
  coal: 64.0,
  [BLOCK.WOOD_OAK]: 15.0,
  [BLOCK.WOOD_BIRCH]: 15.0,
  [BLOCK.WOOD_PINE]: 15.0,
  [BLOCK.PLANKS]: 15.0,
  stick: 5.0,
};

export const SMELT_RECIPES = {
  raw_iron: { id: 'iron_ingot', count: 1 },
  raw_gold: { id: 'gold_ingot', count: 1 },
  raw_copper: { id: 'copper_ingot', count: 1 },
  [BLOCK.SAND]: { id: BLOCK.GLASS, count: 1 },
  [BLOCK.COBBLESTONE]: { id: BLOCK.STONE, count: 1 },
  raw_meat: { id: 'cooked_meat', count: 1 },
  clay_ball: { id: 'brick', count: 1 },
};

export class FurnaceSystem {
  constructor(world) {
    this.world = world;
    // Map of key "x,y,z" -> furnace state object
    this.furnaces = this.world.furnaces;
  }

  getFurnace(x, y, z) {
    const key = `${x},${y},${z}`;
    if (!this.furnaces.has(key)) {
      this.furnaces.set(key, {
        x, y, z,
        input: null,
        fuel: null,
        output: null,
        burnTime: 0,
        maxBurnTime: 0,
        cookTime: 0,
        maxCookTime: 8.0,
      });
    }
    return this.furnaces.get(key);
  }

  update(delta) {
    for (const [key, f] of this.furnaces.entries()) {
      const isBurning = f.burnTime > 0;

      // 1. Consume burn time
      if (f.burnTime > 0) {
        f.burnTime = Math.max(0, f.burnTime - delta);
      }

      // 2. Can we smelt current input?
      const recipe = f.input ? SMELT_RECIPES[f.input.id] : null;
      const canOutput = recipe && (!f.output || (f.output.id === recipe.id && f.output.count < 64));

      // 3. Ignite fuel if needed
      if (!isBurning && canOutput && f.fuel && f.fuel.count > 0) {
        const fuelDuration = FUELS[f.fuel.id];
        if (fuelDuration) {
          f.fuel.count--;
          if (f.fuel.count <= 0) f.fuel = null;
          f.burnTime = fuelDuration;
          f.maxBurnTime = fuelDuration;
        }
      }

      // 4. Progress cooking
      if (f.burnTime > 0 && canOutput) {
        f.cookTime += delta;
        if (f.cookTime >= f.maxCookTime) {
          // Finished smelting one item!
          f.cookTime = 0;
          f.input.count--;
          if (f.input.count <= 0) f.input = null;

          if (!f.output) {
            f.output = { id: recipe.id, count: recipe.count };
          } else {
            f.output.count += recipe.count;
          }
        }
      } else if (!canOutput) {
        f.cookTime = 0;
      }

      // 5. Update block visual in world (Lit vs Unlit furnace)
      const currentBlock = this.world.getBlock(f.x, f.y, f.z);
      if (f.burnTime > 0 && currentBlock === BLOCK.FURNACE) {
        this.world.setBlock(f.x, f.y, f.z, BLOCK.FURNACE_ACTIVE);
      } else if (f.burnTime <= 0 && currentBlock === BLOCK.FURNACE_ACTIVE) {
        this.world.setBlock(f.x, f.y, f.z, BLOCK.FURNACE);
      }
    }
  }
}
