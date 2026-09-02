import { SimplexNoise, PRNG } from '../utils/Noise.js';
import { BLOCK } from '../blocks/BlockRegistry.js';
import { biomeRegistry, BIOMES } from './BiomeRegistry.js';

export const SEA_LEVEL = 24;
export const WORLD_HEIGHT = 64;

export class TerrainGenerator {
  constructor(seed = 1337) {
    this.seed = seed;
    this.noiseContinental = new SimplexNoise(seed);
    this.noiseTerrain = new SimplexNoise(seed + 101);
    this.noiseDetail = new SimplexNoise(seed + 202);
    this.noiseTemperature = new SimplexNoise(seed + 303);
    this.noiseHumidity = new SimplexNoise(seed + 404);
    this.noiseCaves = new SimplexNoise(seed + 505);
    this.noiseOres = new SimplexNoise(seed + 606);
  }

  // Get surface height and biome at world (wx, wz)
  getTerrainData(wx, wz) {
    const scaleCont = 0.003;
    const continental = this.noiseContinental.fbm2D(wx * scaleCont, wz * scaleCont, 3, 2.0, 0.5);

    const scaleTemp = 0.002;
    const temp = this.noiseTemperature.noise2D(wx * scaleTemp, wz * scaleTemp);

    const scaleHumid = 0.002;
    const humid = this.noiseHumidity.noise2D(wx * scaleHumid, wz * scaleHumid);

    const biomeKey = biomeRegistry.determineBiome(temp, humid, continental);
    const biome = biomeRegistry.get(biomeKey);

    const scaleTerrain = 0.015;
    const detailTerrain = this.noiseTerrain.fbm2D(wx * scaleTerrain, wz * scaleTerrain, 4, 2.0, 0.5);

    let height = biome.baseHeight + detailTerrain * biome.heightVariance;

    // Mountain scaling
    if (biomeKey === BIOMES.SNOW_PEAKS) {
      const peakNoise = Math.max(0, this.noiseDetail.fbm2D(wx * 0.03, wz * 0.03, 3));
      height += peakNoise * 14;
    }

    height = Math.max(5, Math.min(WORLD_HEIGHT - 10, Math.floor(height)));

    return { height, biomeKey, biome };
  }

  // Populate chunk block data (Uint8Array of size 16 * 16 * WORLD_HEIGHT)
  generateChunkData(chunkX, chunkZ) {
    const data = new Uint8Array(16 * 16 * WORLD_HEIGHT);
    const getIdx = (x, y, z) => (x * 16 + z) * WORLD_HEIGHT + y;

    const startX = chunkX * 16;
    const startZ = chunkZ * 16;

    // 1. Heightmap & Surface base fill
    const heightMap = new Int32Array(16 * 16);
    const biomeMap = new Array(16 * 16);

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        const wx = startX + x;
        const wz = startZ + z;
        const { height, biomeKey, biome } = this.getTerrainData(wx, wz);
        const mapIdx = x * 16 + z;
        heightMap[mapIdx] = height;
        biomeMap[mapIdx] = { biomeKey, biome };

        // Bedrock at y=0
        data[getIdx(x, 0, z)] = BLOCK.STONE;

        // Fill underground stone, subsurface, and surface
        for (let y = 1; y <= height; y++) {
          let blockType = BLOCK.STONE;

          if (y === height) {
            // Surface block
            blockType = biome.surfaceBlock;
            if (biomeKey === BIOMES.OCEAN && y <= SEA_LEVEL) {
              blockType = BLOCK.SAND;
            }
          } else if (y >= height - 3) {
            // Subsurface block
            blockType = biome.subSurfaceBlock;
          }

          data[getIdx(x, y, z)] = blockType;
        }

        // Fill water up to SEA_LEVEL
        if (height < SEA_LEVEL) {
          for (let y = height + 1; y <= SEA_LEVEL; y++) {
            data[getIdx(x, y, z)] = BLOCK.WATER;
          }
        }
      }
    }

    // 2. 3D Caves (worm tubes and caverns)
    const caveScale = 0.04;
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        const wx = startX + x;
        const wz = startZ + z;
        const surfaceH = heightMap[x * 16 + z];

        // Caves only between y=3 and surface-3
        for (let y = 3; y < surfaceH - 2; y++) {
          const caveVal = this.noiseCaves.noise3D(wx * caveScale, y * (caveScale * 1.5), wz * caveScale);
          // If noise is close to zero inside narrow threshold, carve a cave tunnel
          if (Math.abs(caveVal) < 0.08) {
            data[getIdx(x, y, z)] = BLOCK.AIR;
          }
        }
      }
    }

    // 3. Ore Generation (veins)
    const oreScale = 0.12;
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        const wx = startX + x;
        const wz = startZ + z;
        const surfaceH = heightMap[x * 16 + z];

        for (let y = 2; y < surfaceH - 2; y++) {
          const current = data[getIdx(x, y, z)];
          if (current !== BLOCK.STONE) continue;

          const oreNoise = this.noiseOres.noise3D(wx * oreScale, y * oreScale, wz * oreScale);

          // Coal: y < 60, fairly common
          if (y < 58 && oreNoise > 0.65) {
            data[getIdx(x, y, z)] = BLOCK.COAL_ORE;
          }
          // Copper: y < 45
          else if (y < 45 && oreNoise < -0.72) {
            data[getIdx(x, y, z)] = BLOCK.COPPER_ORE;
          }
          // Iron: y < 36
          else if (y < 36 && oreNoise > 0.74) {
            data[getIdx(x, y, z)] = BLOCK.IRON_ORE;
          }
          // Gold: y < 22
          else if (y < 22 && oreNoise < -0.80) {
            data[getIdx(x, y, z)] = BLOCK.GOLD_ORE;
          }
          // Red Crystal: y < 16
          else if (y < 16 && oreNoise > 0.82) {
            data[getIdx(x, y, z)] = BLOCK.RED_CRYSTAL_ORE;
          }
          // Gem: y < 10
          else if (y < 10 && oreNoise < -0.86) {
            data[getIdx(x, y, z)] = BLOCK.GEM_ORE;
          }
        }
      }
    }

    // 4. Foliage & Trees & Plants (deterministic using PRNG seeded per chunk)
    const chunkPrng = new PRNG(this.seed + chunkX * 73856093 ^ chunkZ * 19349663);

    for (let x = 2; x < 14; x++) {
      for (let z = 2; z < 14; z++) {
        const mapIdx = x * 16 + z;
        const surfaceH = heightMap[mapIdx];
        const { biomeKey, biome } = biomeMap[mapIdx];

        if (surfaceH < SEA_LEVEL) continue; // Don't plant underwater
        const groundBlock = data[getIdx(x, surfaceH, z)];
        if (groundBlock !== BLOCK.GRASS && groundBlock !== BLOCK.SAND && groundBlock !== BLOCK.SNOW) continue;

        // Tree placement
        const rollTree = chunkPrng.next();
        if (rollTree < biome.treeFrequency) {
          this.growTree(data, x, surfaceH + 1, z, biome.treeType || 'oak', chunkPrng);
          continue;
        }

        // Flower & plant placement
        const rollPlant = chunkPrng.next();
        if (rollPlant < biome.plantFrequency && data[getIdx(x, surfaceH + 1, z)] === BLOCK.AIR) {
          if (biome.flowers && biome.flowers.length > 0) {
            const flower = biome.flowers[Math.floor(chunkPrng.next() * biome.flowers.length)];
            data[getIdx(x, surfaceH + 1, z)] = flower;
          }
        }
      }
    }

    return { data, heightMap };
  }

  // Procedural Voxel Tree Builder
  growTree(data, x, y, z, type, prng) {
    const getIdx = (bx, by, bz) => {
      if (bx < 0 || bx >= 16 || bz < 0 || bz >= 16 || by < 0 || by >= WORLD_HEIGHT) return -1;
      return (bx * 16 + bz) * WORLD_HEIGHT + by;
    };

    const setBlockSafe = (bx, by, bz, block) => {
      const idx = getIdx(bx, by, bz);
      if (idx !== -1 && (data[idx] === BLOCK.AIR || data[idx] === BLOCK.LEAVES_OAK || data[idx] === BLOCK.LEAVES_BIRCH || data[idx] === BLOCK.LEAVES_PINE)) {
        data[idx] = block;
      }
    };

    if (type === 'cactus') {
      const cactusHeight = 2 + Math.floor(prng.next() * 3);
      for (let h = 0; h < cactusHeight; h++) {
        setBlockSafe(x, y + h, z, BLOCK.CACTUS);
      }
      return;
    }

    if (type === 'pine') {
      const trunkHeight = 6 + Math.floor(prng.next() * 3);
      // Trunk
      for (let h = 0; h < trunkHeight; h++) {
        setBlockSafe(x, y + h, z, BLOCK.WOOD_PINE);
      }
      // Pine conical foliage layers
      for (let h = 2; h <= trunkHeight + 1; h++) {
        const radius = (trunkHeight + 1 - h) % 2 === 0 ? 2 : 1;
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dz = -radius; dz <= radius; dz++) {
            if (Math.abs(dx) + Math.abs(dz) <= radius + 1) {
              setBlockSafe(x + dx, y + h, z + dz, BLOCK.LEAVES_PINE);
            }
          }
        }
      }
      setBlockSafe(x, y + trunkHeight + 2, z, BLOCK.LEAVES_PINE);
      return;
    }

    // Oak / Birch tree
    const isBirch = type === 'birch';
    const woodBlock = isBirch ? BLOCK.WOOD_BIRCH : BLOCK.WOOD_OAK;
    const leafBlock = isBirch ? BLOCK.LEAVES_BIRCH : BLOCK.LEAVES_OAK;
    const trunkHeight = 4 + Math.floor(prng.next() * 3);

    // Trunk
    for (let h = 0; h < trunkHeight; h++) {
      setBlockSafe(x, y + h, z, woodBlock);
    }

    // Crown canopy
    const leafStart = trunkHeight - 2;
    for (let ly = leafStart; ly <= trunkHeight + 1; ly++) {
      const radius = ly >= trunkHeight ? 1 : 2;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.abs(dx) === radius && Math.abs(dz) === radius && prng.next() > 0.5) continue;
          setBlockSafe(x + dx, y + ly, z + dz, leafBlock);
        }
      }
    }
  }
}
