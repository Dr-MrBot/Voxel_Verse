import { BLOCK } from '../blocks/BlockRegistry.js';

export class RecipeRegistry {
  constructor() {
    this.recipes = [];
    this.init();
  }

  register(recipe) {
    this.recipes.push(recipe);
  }

  init() {
    // 1. Shapeless: Log -> 4 Planks
    [BLOCK.WOOD_OAK, BLOCK.WOOD_BIRCH, BLOCK.WOOD_PINE].forEach((logId) => {
      this.register({
        id: `planks_from_${logId}`,
        shapeless: true,
        inputs: [{ id: logId, count: 1 }],
        output: { id: BLOCK.PLANKS, count: 4 },
      });
    });

    // 2. Sticks (2 planks vertical)
    this.register({
      id: 'sticks',
      width: 1,
      height: 2,
      pattern: [
        BLOCK.PLANKS,
        BLOCK.PLANKS,
      ],
      output: { id: 'stick', count: 4 },
    });

    // 3. Torches (1 coal over 1 stick)
    this.register({
      id: 'torches',
      width: 1,
      height: 2,
      pattern: [
        'coal',
        'stick',
      ],
      output: { id: BLOCK.TORCH, count: 4 },
    });

    // 4. Crafting Table (2x2 planks)
    this.register({
      id: 'crafting_table',
      width: 2,
      height: 2,
      pattern: [
        BLOCK.PLANKS, BLOCK.PLANKS,
        BLOCK.PLANKS, BLOCK.PLANKS,
      ],
      output: { id: BLOCK.CRAFTING_TABLE, count: 1 },
    });

    // 5. Chest (3x3 hollow planks)
    this.register({
      id: 'chest',
      width: 3,
      height: 3,
      pattern: [
        BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS,
        BLOCK.PLANKS, null,         BLOCK.PLANKS,
        BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS,
      ],
      output: { id: BLOCK.CHEST, count: 1 },
    });

    // 6. Furnace (3x3 hollow cobblestone)
    this.register({
      id: 'furnace',
      width: 3,
      height: 3,
      pattern: [
        BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, BLOCK.COBBLESTONE,
        BLOCK.COBBLESTONE, null,              BLOCK.COBBLESTONE,
        BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, BLOCK.COBBLESTONE,
      ],
      output: { id: BLOCK.FURNACE, count: 1 },
    });

    // 7. Tools: Pickaxes, Axes, Shovels, Swords, Hoes
    const tiers = [
      { mat: BLOCK.PLANKS, name: 'wooden' },
      { mat: BLOCK.COBBLESTONE, name: 'stone' },
      { mat: 'iron_ingot', name: 'iron' },
      { mat: 'gold_ingot', name: 'gold' },
      { mat: 'gem', name: 'gem' },
    ];

    tiers.forEach(({ mat, name }) => {
      // Pickaxe
      this.register({
        id: `${name}_pickaxe`,
        width: 3,
        height: 3,
        pattern: [
          mat,    mat,     mat,
          null,   'stick', null,
          null,   'stick', null,
        ],
        output: { id: `${name}_pickaxe`, count: 1 },
      });

      // Axe
      this.register({
        id: `${name}_axe`,
        width: 2,
        height: 3,
        pattern: [
          mat,    mat,
          mat,    'stick',
          null,   'stick',
        ],
        output: { id: `${name}_axe`, count: 1 },
      });

      // Shovel
      this.register({
        id: `${name}_shovel`,
        width: 1,
        height: 3,
        pattern: [
          mat,
          'stick',
          'stick',
        ],
        output: { id: `${name}_shovel`, count: 1 },
      });

      // Sword
      this.register({
        id: `${name}_sword`,
        width: 1,
        height: 3,
        pattern: [
          mat,
          mat,
          'stick',
        ],
        output: { id: `${name}_sword`, count: 1 },
      });

      // Hoe
      this.register({
        id: `${name}_hoe`,
        width: 2,
        height: 3,
        pattern: [
          mat,    mat,
          null,   'stick',
          null,   'stick',
        ],
        output: { id: `${name}_hoe`, count: 1 },
      });
    });

    // 8. Bed (3 leaves/wool over 3 planks)
    this.register({
      id: 'bed',
      width: 3,
      height: 2,
      pattern: [
        BLOCK.LEAVES_OAK, BLOCK.LEAVES_OAK, BLOCK.LEAVES_OAK,
        BLOCK.PLANKS,     BLOCK.PLANKS,     BLOCK.PLANKS,
      ],
      output: { id: BLOCK.BED, count: 1 },
    });

    // 9. Bread (3 wheat horizontal)
    this.register({
      id: 'bread',
      width: 3,
      height: 1,
      pattern: [
        'wheat', 'wheat', 'wheat',
      ],
      output: { id: 'bread', count: 1 },
    });

    // 10. Stone Bricks (2x2 stone)
    this.register({
      id: 'stone_bricks',
      width: 2,
      height: 2,
      pattern: [
        BLOCK.STONE, BLOCK.STONE,
        BLOCK.STONE, BLOCK.STONE,
      ],
      output: { id: BLOCK.STONE_BRICKS, count: 4 },
    });

    // 11. Wood Door (2x3 planks)
    this.register({
      id: 'wood_door',
      width: 2,
      height: 3,
      pattern: [
        BLOCK.PLANKS, BLOCK.PLANKS,
        BLOCK.PLANKS, BLOCK.PLANKS,
        BLOCK.PLANKS, BLOCK.PLANKS,
      ],
      output: { id: BLOCK.WOOD_DOOR, count: 3 },
    });

    // 12. Wood Fence (3x2 planks and sticks)
    this.register({
      id: 'wood_fence',
      width: 3,
      height: 2,
      pattern: [
        BLOCK.PLANKS, 'stick', BLOCK.PLANKS,
        BLOCK.PLANKS, 'stick', BLOCK.PLANKS,
      ],
      output: { id: BLOCK.WOOD_FENCE, count: 3 },
    });
  }

  // Match grid: grid is 1D array of length gridWidth * gridHeight
  findMatch(grid, gridWidth, gridHeight) {
    // 1. Test shapeless recipes
    const nonNullItems = grid.filter((item) => item !== null && item.count > 0);
    for (const recipe of this.recipes) {
      if (recipe.shapeless) {
        if (nonNullItems.length === recipe.inputs.length) {
          const matched = recipe.inputs.every((req) =>
            nonNullItems.some((item) => item.id === req.id && item.count >= req.count)
          );
          if (matched) return recipe;
        }
      }
    }

    // 2. Find bounding box of items in the grid
    let minX = gridWidth, maxX = -1;
    let minY = gridHeight, maxY = -1;

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const item = grid[y * gridWidth + x];
        if (item && item.count > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (minX > maxX || minY > maxY) return null; // Empty grid

    const patternW = maxX - minX + 1;
    const patternH = maxY - minY + 1;

    // 3. Test shaped recipes matching pattern dimensions
    for (const recipe of this.recipes) {
      if (recipe.shapeless) continue;
      if (recipe.width === patternW && recipe.height === patternH) {
        let match = true;
        for (let py = 0; py < patternH; py++) {
          for (let px = 0; px < patternW; px++) {
            const gridItem = grid[(minY + py) * gridWidth + (minX + px)];
            const targetId = recipe.pattern[py * patternW + px];

            if (targetId === null) {
              if (gridItem !== null) match = false;
            } else {
              if (!gridItem || gridItem.id !== targetId) match = false;
            }
            if (!match) break;
          }
          if (!match) break;
        }
        if (match) return recipe;
      }
    }

    return null;
  }
}

export const recipeRegistry = new RecipeRegistry();
