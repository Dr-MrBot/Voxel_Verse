import * as THREE from 'three';
import { TEX } from './BlockRegistry.js';

export class TextureAtlas {
  constructor() {
    this.tileSize = 16;
    this.atlasCols = 16;
    this.atlasRows = 16;
    this.canvasWidth = this.tileSize * this.atlasCols; // 256
    this.canvasHeight = this.tileSize * this.atlasRows; // 256

    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.canvasWidth;
      this.canvas.height = this.canvasHeight;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

      this.generate();
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.magFilter = THREE.NearestFilter;
      this.texture.minFilter = THREE.NearestFilter;
      this.texture.generateMipmaps = false;
      this.texture.colorSpace = THREE.SRGBColorSpace;
    }
  }

  // Get UV box [u0, v0, u1, v1] for a tile index
  getUV(tileIndex) {
    const col = tileIndex % this.atlasCols;
    const row = Math.floor(tileIndex / this.atlasCols);
    const u0 = col / this.atlasCols;
    const u1 = (col + 1) / this.atlasCols;
    // Three.js texture coordinate: v=0 is bottom, v=1 is top
    const v1 = 1.0 - (row / this.atlasRows);
    const v0 = 1.0 - ((row + 1) / this.atlasRows);
    return [u0, v0, u1, v1];
  }

  generate() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const drawTile = (index, drawFn) => {
      const col = index % this.atlasCols;
      const row = Math.floor(index / this.atlasCols);
      const x = col * this.tileSize;
      const y = row * this.tileSize;
      ctx.save();
      ctx.translate(x, y);
      drawFn(ctx, this.tileSize);
      ctx.restore();
    };

    // Helper: random seeded color variation
    const noiseRect = (x, y, w, h, baseR, baseG, baseB, variance) => {
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const v = (Math.random() - 0.5) * variance;
          const r = Math.min(255, Math.max(0, Math.floor(baseR + v)));
          const g = Math.min(255, Math.max(0, Math.floor(baseG + v)));
          const b = Math.min(255, Math.max(0, Math.floor(baseB + v)));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    };

    // 1. GRASS TOP
    drawTile(TEX.GRASS_TOP, () => {
      noiseRect(0, 0, 16, 16, 85, 165, 45, 30);
    });

    // 2. DIRT
    drawTile(TEX.DIRT, () => {
      noiseRect(0, 0, 16, 16, 130, 85, 50, 25);
    });

    // 3. GRASS SIDE
    drawTile(TEX.GRASS_SIDE, () => {
      // Base dirt
      noiseRect(0, 0, 16, 16, 130, 85, 50, 25);
      // Top grass trim with drooping blades
      for (let px = 0; px < 16; px++) {
        const drop = (px % 3 === 0) ? 4 : (px % 2 === 0 ? 3 : 2);
        for (let py = 0; py < drop; py++) {
          const v = (Math.random() - 0.5) * 30;
          ctx.fillStyle = `rgb(${Math.floor(85 + v)},${Math.floor(165 + v)},${Math.floor(45 + v)})`;
          ctx.fillRect(px, py, 1, 1);
        }
      }
    });

    // 4. STONE
    drawTile(TEX.STONE, () => {
      noiseRect(0, 0, 16, 16, 128, 128, 132, 25);
      ctx.fillStyle = 'rgba(70,70,75,0.4)';
      ctx.fillRect(3, 4, 4, 1);
      ctx.fillRect(8, 11, 5, 1);
      ctx.fillRect(10, 5, 1, 3);
    });

    // 5. COBBLESTONE
    drawTile(TEX.COBBLESTONE, () => {
      noiseRect(0, 0, 16, 16, 115, 115, 118, 30);
      // Cobble borders
      ctx.fillStyle = '#444447';
      const cobbles = [
        [0, 0, 6, 4], [7, 0, 9, 5],
        [0, 5, 8, 5], [9, 6, 7, 5],
        [0, 11, 7, 5], [8, 12, 8, 4]
      ];
      for (const [cx, cy, cw, ch] of cobbles) {
        ctx.strokeRect(cx + 0.5, cy + 0.5, cw - 1, ch - 1);
      }
    });

    // 6. SAND
    drawTile(TEX.SAND, () => {
      noiseRect(0, 0, 16, 16, 222, 206, 142, 20);
    });

    // 7. GRAVEL
    drawTile(TEX.GRAVEL, () => {
      noiseRect(0, 0, 16, 16, 135, 130, 130, 40);
    });

    // 8. WOOD OAK SIDE
    drawTile(TEX.WOOD_OAK_SIDE, () => {
      noiseRect(0, 0, 16, 16, 105, 75, 42, 20);
      ctx.fillStyle = 'rgba(60, 40, 20, 0.4)';
      for (let x = 2; x < 16; x += 4) {
        ctx.fillRect(x, 0, 1, 16);
      }
    });

    // 9. WOOD OAK TOP
    drawTile(TEX.WOOD_OAK_TOP, () => {
      noiseRect(0, 0, 16, 16, 175, 140, 90, 20);
      // Bark rim
      ctx.fillStyle = '#694a2a';
      ctx.strokeRect(0.5, 0.5, 15, 15);
      // Tree ring
      ctx.fillStyle = 'rgba(100, 75, 45, 0.5)';
      ctx.strokeRect(3.5, 3.5, 9, 9);
      ctx.fillRect(7, 7, 2, 2);
    });

    // 10. LEAVES OAK
    drawTile(TEX.LEAVES_OAK, () => {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 16, 16);
      for (let py = 0; py < 16; py++) {
        for (let px = 0; px < 16; px++) {
          if ((px + py) % 4 !== 0 || Math.random() > 0.3) {
            const v = (Math.random() - 0.5) * 35;
            ctx.fillStyle = `rgb(${Math.floor(55 + v)},${Math.floor(135 + v)},${Math.floor(35 + v)})`;
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }
    });

    // 11. WOOD BIRCH SIDE
    drawTile(TEX.WOOD_BIRCH_SIDE, () => {
      noiseRect(0, 0, 16, 16, 220, 220, 215, 15);
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(3, 3, 3, 1);
      ctx.fillRect(10, 8, 4, 1);
      ctx.fillRect(2, 13, 2, 1);
    });

    // 12. LEAVES BIRCH
    drawTile(TEX.LEAVES_BIRCH, () => {
      for (let py = 0; py < 16; py++) {
        for (let px = 0; px < 16; px++) {
          if ((px * 3 + py * 7) % 5 !== 0) {
            const v = (Math.random() - 0.5) * 30;
            ctx.fillStyle = `rgb(${Math.floor(95 + v)},${Math.floor(165 + v)},${Math.floor(45 + v)})`;
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }
    });

    // 13. WOOD PINE SIDE
    drawTile(TEX.WOOD_PINE_SIDE, () => {
      noiseRect(0, 0, 16, 16, 65, 45, 28, 18);
      ctx.fillStyle = 'rgba(35, 22, 12, 0.5)';
      for (let x = 3; x < 16; x += 5) {
        ctx.fillRect(x, 0, 2, 16);
      }
    });

    // 14. LEAVES PINE
    drawTile(TEX.LEAVES_PINE, () => {
      for (let py = 0; py < 16; py++) {
        for (let px = 0; px < 16; px++) {
          if ((px + py) % 3 !== 0) {
            const v = (Math.random() - 0.5) * 25;
            ctx.fillStyle = `rgb(${Math.floor(30 + v)},${Math.floor(85 + v)},${Math.floor(40 + v)})`;
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }
    });

    // 15. PLANKS
    drawTile(TEX.PLANKS, () => {
      noiseRect(0, 0, 16, 16, 168, 128, 78, 20);
      ctx.fillStyle = '#7a542a';
      // Plank horizontal borders
      ctx.fillRect(0, 3, 16, 1);
      ctx.fillRect(0, 7, 16, 1);
      ctx.fillRect(0, 11, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      // Vertical seams
      ctx.fillRect(6, 0, 1, 3);
      ctx.fillRect(11, 4, 1, 3);
      ctx.fillRect(4, 8, 1, 3);
      ctx.fillRect(13, 12, 1, 3);
    });

    // 16. GLASS
    drawTile(TEX.GLASS, () => {
      ctx.fillStyle = 'rgba(215, 240, 255, 0.25)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeRect(0.5, 0.5, 15, 15);
      // Specular glare
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(2, 2, 2, 2);
      ctx.fillRect(4, 4, 2, 2);
      ctx.fillRect(11, 11, 3, 3);
    });

    // 17. WATER
    drawTile(TEX.WATER, () => {
      ctx.fillStyle = 'rgba(38, 112, 212, 0.75)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = 'rgba(80, 165, 255, 0.5)';
      ctx.fillRect(2, 3, 5, 2);
      ctx.fillRect(9, 8, 5, 2);
      ctx.fillRect(3, 12, 4, 2);
    });

    // Helper: Ore generator
    const drawOre = (index, oreR, oreG, oreB, lightR, lightG, lightB) => {
      drawTile(index, () => {
        noiseRect(0, 0, 16, 16, 128, 128, 132, 25);
        const oreSpots = [
          [3, 3], [4, 3], [3, 4], [4, 4],
          [9, 4], [10, 4], [10, 5],
          [4, 10], [5, 10], [5, 11], [6, 11],
          [11, 11], [12, 11], [12, 12]
        ];
        for (const [ox, oy] of oreSpots) {
          ctx.fillStyle = `rgb(${oreR},${oreG},${oreB})`;
          ctx.fillRect(ox, oy, 1, 1);
        }
        // Highlights
        ctx.fillStyle = `rgb(${lightR},${lightG},${lightB})`;
        ctx.fillRect(3, 3, 1, 1);
        ctx.fillRect(10, 4, 1, 1);
        ctx.fillRect(5, 10, 1, 1);
        ctx.fillRect(12, 11, 1, 1);
      });
    };

    drawOre(TEX.COAL_ORE, 35, 35, 40, 75, 75, 80);
    drawOre(TEX.COPPER_ORE, 195, 105, 55, 235, 145, 95);
    drawOre(TEX.IRON_ORE, 205, 175, 140, 240, 215, 185);
    drawOre(TEX.GOLD_ORE, 235, 195, 30, 255, 235, 100);
    drawOre(TEX.RED_CRYSTAL_ORE, 220, 25, 30, 255, 100, 105);
    drawOre(TEX.GEM_ORE, 30, 215, 190, 120, 255, 235);

    // SNOW
    drawTile(TEX.SNOW, () => {
      noiseRect(0, 0, 16, 16, 242, 246, 252, 12);
    });

    // SNOW SIDE
    drawTile(TEX.SNOW_SIDE, () => {
      noiseRect(0, 0, 16, 16, 130, 85, 50, 25);
      for (let px = 0; px < 16; px++) {
        const drop = (px % 4 === 0) ? 5 : (px % 2 === 0 ? 4 : 3);
        for (let py = 0; py < drop; py++) {
          ctx.fillStyle = '#f0f4fa';
          ctx.fillRect(px, py, 1, 1);
        }
      }
    });

    // ICE
    drawTile(TEX.ICE, () => {
      ctx.fillStyle = 'rgba(175, 215, 245, 0.8)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = 'rgba(235, 250, 255, 0.6)';
      ctx.fillRect(2, 2, 1, 5);
      ctx.fillRect(2, 7, 5, 1);
      ctx.fillRect(9, 10, 5, 1);
      ctx.fillRect(13, 11, 1, 3);
    });

    // CLAY
    drawTile(TEX.CLAY, () => {
      noiseRect(0, 0, 16, 16, 160, 165, 175, 15);
    });

    // CACTUS
    drawTile(TEX.CACTUS_SIDE, () => {
      noiseRect(0, 0, 16, 16, 45, 125, 40, 20);
      ctx.fillStyle = '#1c6622';
      ctx.fillRect(3, 0, 1, 16);
      ctx.fillRect(8, 0, 1, 16);
      ctx.fillRect(12, 0, 1, 16);
      // Prickles
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 4, 1, 1);
      ctx.fillRect(4, 9, 1, 1);
      ctx.fillRect(9, 3, 1, 1);
      ctx.fillRect(13, 11, 1, 1);
    });

    drawTile(TEX.CACTUS_TOP, () => {
      noiseRect(0, 0, 16, 16, 55, 140, 50, 15);
      ctx.fillStyle = '#1c6622';
      ctx.strokeRect(2.5, 2.5, 11, 11);
    });

    // FLOWERS
    drawTile(TEX.FLOWER_YELLOW, () => {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 16, 16);
      // Stem
      ctx.fillStyle = '#3e8e24';
      ctx.fillRect(7, 7, 2, 9);
      ctx.fillRect(9, 10, 2, 1);
      // Flower head
      ctx.fillStyle = '#ffdf00';
      ctx.fillRect(6, 3, 4, 4);
      ctx.fillStyle = '#d69e00';
      ctx.fillRect(7, 4, 2, 2);
    });

    drawTile(TEX.FLOWER_RED, () => {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#3e8e24';
      ctx.fillRect(7, 7, 2, 9);
      ctx.fillRect(5, 11, 2, 1);
      // Petals
      ctx.fillStyle = '#e82535';
      ctx.fillRect(6, 2, 4, 5);
      ctx.fillRect(5, 3, 6, 3);
      ctx.fillStyle = '#780c14';
      ctx.fillRect(7, 4, 2, 2);
    });

    // TALL GRASS
    drawTile(TEX.TALL_GRASS, () => {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#4fa32d';
      const blades = [[4, 4, 12], [6, 2, 14], [8, 1, 15], [10, 3, 13], [12, 6, 10]];
      for (const [bx, by, bh] of blades) {
        ctx.fillRect(bx, by, 1, bh);
      }
    });

    // MUSHROOMS
    drawTile(TEX.MUSHROOM_RED, () => {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#e5e5d5';
      ctx.fillRect(7, 9, 2, 7);
      ctx.fillStyle = '#d92525';
      ctx.fillRect(4, 5, 8, 4);
      ctx.fillRect(5, 4, 6, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5, 6, 1, 1);
      ctx.fillRect(8, 5, 1, 1);
      ctx.fillRect(10, 7, 1, 1);
    });

    drawTile(TEX.MUSHROOM_BROWN, () => {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#e5e5d5';
      ctx.fillRect(7, 9, 2, 7);
      ctx.fillStyle = '#8f6843';
      ctx.fillRect(4, 6, 8, 3);
      ctx.fillRect(5, 5, 6, 1);
    });

    // CRAFTING TABLE
    drawTile(TEX.CRAFTING_TABLE_TOP, () => {
      noiseRect(0, 0, 16, 16, 185, 145, 95, 20);
      ctx.strokeStyle = '#5a3d1c';
      ctx.strokeRect(1.5, 1.5, 13, 13);
      ctx.fillStyle = '#5a3d1c';
      ctx.fillRect(7, 2, 2, 12);
      ctx.fillRect(2, 7, 12, 2);
    });

    drawTile(TEX.CRAFTING_TABLE_SIDE, () => {
      noiseRect(0, 0, 16, 16, 168, 128, 78, 20);
      ctx.fillStyle = '#4a2f12';
      // Side tool outlines
      ctx.fillRect(3, 4, 2, 7);
      ctx.fillRect(2, 4, 4, 2);
      ctx.fillRect(11, 4, 1, 8);
      ctx.fillRect(10, 5, 3, 2);
    });

    // FURNACE
    drawTile(TEX.FURNACE_SIDE, () => {
      noiseRect(0, 0, 16, 16, 115, 115, 118, 30);
      ctx.strokeRect(0.5, 0.5, 15, 15);
    });

    drawTile(TEX.FURNACE_FRONT, () => {
      noiseRect(0, 0, 16, 16, 115, 115, 118, 30);
      // Dark hearth opening
      ctx.fillStyle = '#222222';
      ctx.fillRect(3, 7, 10, 7);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(4, 8, 8, 5);
    });

    drawTile(TEX.FURNACE_FRONT_ON, () => {
      noiseRect(0, 0, 16, 16, 115, 115, 118, 30);
      // Lit furnace fire
      ctx.fillStyle = '#222222';
      ctx.fillRect(3, 7, 10, 7);
      ctx.fillStyle = '#e85d04';
      ctx.fillRect(4, 9, 8, 4);
      ctx.fillStyle = '#ffba08';
      ctx.fillRect(6, 10, 4, 2);
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(7, 11, 2, 1);
    });

    drawTile(TEX.FURNACE_TOP, () => {
      noiseRect(0, 0, 16, 16, 105, 105, 108, 25);
      ctx.fillStyle = '#444447';
      ctx.strokeRect(1.5, 1.5, 13, 13);
    });

    // CHEST
    drawTile(TEX.CHEST_TOP, () => {
      noiseRect(0, 0, 16, 16, 150, 110, 55, 20);
      ctx.fillStyle = '#382510';
      ctx.strokeRect(1.5, 1.5, 13, 13);
    });

    drawTile(TEX.CHEST_SIDE, () => {
      noiseRect(0, 0, 16, 16, 150, 110, 55, 20);
      ctx.fillStyle = '#382510';
      ctx.strokeRect(1.5, 1.5, 13, 13);
      ctx.fillRect(1, 6, 14, 1);
    });

    drawTile(TEX.CHEST_FRONT, () => {
      noiseRect(0, 0, 16, 16, 150, 110, 55, 20);
      ctx.fillStyle = '#382510';
      ctx.strokeRect(1.5, 1.5, 13, 13);
      ctx.fillRect(1, 6, 14, 1);
      // Latch
      ctx.fillStyle = '#c0c0c5';
      ctx.fillRect(7, 5, 2, 4);
      ctx.fillStyle = '#555558';
      ctx.fillRect(7, 8, 2, 1);
    });

    // TORCH
    drawTile(TEX.TORCH, () => {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 16, 16);
      // Stick
      ctx.fillStyle = '#7a542a';
      ctx.fillRect(7, 5, 2, 11);
      // Flame
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(6, 2, 4, 4);
      ctx.fillStyle = '#fff480';
      ctx.fillRect(7, 3, 2, 2);
    });

    // FARMLAND
    drawTile(TEX.FARMLAND_TOP, () => {
      noiseRect(0, 0, 16, 16, 110, 70, 40, 20);
      ctx.fillStyle = '#4a2f15';
      for (let y = 1; y < 16; y += 3) {
        ctx.fillRect(0, y, 16, 1);
      }
    });

    drawTile(TEX.FARMLAND_WET_TOP, () => {
      noiseRect(0, 0, 16, 16, 65, 40, 22, 15);
      ctx.fillStyle = '#2d1b0c';
      for (let y = 1; y < 16; y += 3) {
        ctx.fillRect(0, y, 16, 1);
      }
    });

    // CROPS
    for (let stage = 0; stage < 4; stage++) {
      drawTile(TEX.CROP_0 + stage, () => {
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 16, 16);
        const h = (stage + 1) * 3;
        const color = stage === 3 ? '#e0c038' : '#6bc435';
        ctx.fillStyle = color;
        for (let x = 2; x < 15; x += 3) {
          ctx.fillRect(x, 16 - h, 1, h);
          if (stage >= 2) {
            ctx.fillRect(x - 1, 16 - h + 1, 3, 2);
          }
        }
      });
    }

    // BED
    drawTile(TEX.BED_TOP, () => {
      ctx.fillStyle = '#b81424'; // Red duvet
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#f0f0f5'; // White pillow
      ctx.fillRect(2, 2, 12, 5);
      ctx.fillStyle = '#820a16';
      ctx.strokeRect(0.5, 0.5, 15, 15);
    });

    drawTile(TEX.BED_SIDE, () => {
      ctx.fillStyle = '#8f6843'; // Wood frame
      ctx.fillRect(0, 10, 16, 6);
      ctx.fillStyle = '#b81424'; // Red mattress side
      ctx.fillRect(0, 4, 16, 6);
      ctx.fillStyle = '#f0f0f5'; // Pillow side
      ctx.fillRect(0, 4, 4, 6);
    });

    // STONE BRICKS
    drawTile(TEX.STONE_BRICKS, () => {
      noiseRect(0, 0, 16, 16, 125, 125, 128, 20);
      ctx.fillStyle = '#55555a';
      // Brick mortar lines
      ctx.fillRect(0, 4, 16, 1);
      ctx.fillRect(0, 9, 16, 1);
      ctx.fillRect(0, 14, 16, 1);
      ctx.fillRect(8, 0, 1, 4);
      ctx.fillRect(3, 5, 1, 4);
      ctx.fillRect(12, 5, 1, 4);
      ctx.fillRect(8, 10, 1, 4);
    });

    // WOOD DOOR
    drawTile(TEX.WOOD_DOOR_TOP, () => {
      noiseRect(0, 0, 16, 16, 168, 128, 78, 20);
      ctx.fillStyle = '#4a2f12';
      ctx.strokeRect(1.5, 1.5, 13, 13);
      // Window panes
      ctx.fillStyle = 'rgba(200, 230, 255, 0.6)';
      ctx.fillRect(3, 3, 4, 4);
      ctx.fillRect(9, 3, 4, 4);
      ctx.fillRect(3, 9, 4, 4);
      ctx.fillRect(9, 9, 4, 4);
    });

    drawTile(TEX.WOOD_DOOR_BOTTOM, () => {
      noiseRect(0, 0, 16, 16, 168, 128, 78, 20);
      ctx.fillStyle = '#4a2f12';
      ctx.strokeRect(1.5, 1.5, 13, 13);
      // Handle
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(12, 4, 2, 3);
    });

    // WOOD FENCE
    drawTile(TEX.WOOD_FENCE, () => {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#9b6b3b';
      // Vertical posts
      ctx.fillRect(2, 0, 3, 16);
      ctx.fillRect(11, 0, 3, 16);
      // Horizontal bars
      ctx.fillRect(0, 3, 16, 3);
      ctx.fillRect(0, 10, 16, 3);
    });

    // CRACK OVERLAYS
    for (let c = 0; c < 5; c++) {
      drawTile(TEX.CRACK_0 + c, () => {
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        const numLines = (c + 1) * 3;
        for (let l = 0; l < numLines; l++) {
          const rx = Math.floor(Math.random() * 14);
          const ry = Math.floor(Math.random() * 14);
          const rw = Math.floor(Math.random() * 4) + 1;
          const rh = Math.floor(Math.random() * 4) + 1;
          ctx.fillRect(rx, ry, rw, 1);
          ctx.fillRect(rx, ry, 1, rh);
        }
      });
    }
  }
}

export const textureAtlas = new TextureAtlas();
