import { BLOCK } from '../blocks/BlockRegistry.js';

export const BIOMES = {
  OCEAN: 'ocean',
  BEACH: 'beach',
  PLAINS: 'plains',
  FOREST: 'forest',
  BIRCH_FOREST: 'birch_forest',
  PINE_FOREST: 'pine_forest',
  DESERT: 'desert',
  SNOW_PEAKS: 'snow_peaks',
  SWAMP: 'swamp',
};

export class BiomeRegistry {
  constructor() {
    this.biomes = {
      [BIOMES.OCEAN]: {
        name: 'Ocean',
        surfaceBlock: BLOCK.SAND,
        subSurfaceBlock: BLOCK.GRAVEL,
        baseHeight: 18,
        heightVariance: 4,
        treeFrequency: 0,
        plantFrequency: 0.05,
        waterColor: '#1d5fa6',
        skyColor: '#6da0e8',
        fogColor: '#4f7fb8',
      },
      [BIOMES.BEACH]: {
        name: 'Beach',
        surfaceBlock: BLOCK.SAND,
        subSurfaceBlock: BLOCK.SAND,
        baseHeight: 25,
        heightVariance: 2,
        treeFrequency: 0.005,
        treeType: 'oak',
        plantFrequency: 0.02,
        skyColor: '#7cb5f7',
        fogColor: '#6ca2e0',
      },
      [BIOMES.PLAINS]: {
        name: 'Plains',
        surfaceBlock: BLOCK.GRASS,
        subSurfaceBlock: BLOCK.DIRT,
        baseHeight: 28,
        heightVariance: 6,
        treeFrequency: 0.008,
        treeType: 'oak',
        plantFrequency: 0.25,
        flowers: [BLOCK.FLOWER_YELLOW, BLOCK.FLOWER_RED, BLOCK.TALL_GRASS],
        skyColor: '#7cb5f7',
        fogColor: '#a4c9f5',
      },
      [BIOMES.FOREST]: {
        name: 'Forest',
        surfaceBlock: BLOCK.GRASS,
        subSurfaceBlock: BLOCK.DIRT,
        baseHeight: 30,
        heightVariance: 8,
        treeFrequency: 0.08,
        treeType: 'oak',
        plantFrequency: 0.18,
        flowers: [BLOCK.TALL_GRASS, BLOCK.FLOWER_RED, BLOCK.MUSHROOM_RED, BLOCK.MUSHROOM_BROWN],
        skyColor: '#7cb5f7',
        fogColor: '#a4c9f5',
      },
      [BIOMES.BIRCH_FOREST]: {
        name: 'Birch Forest',
        surfaceBlock: BLOCK.GRASS,
        subSurfaceBlock: BLOCK.DIRT,
        baseHeight: 30,
        heightVariance: 7,
        treeFrequency: 0.07,
        treeType: 'birch',
        plantFrequency: 0.2,
        flowers: [BLOCK.FLOWER_YELLOW, BLOCK.TALL_GRASS],
        skyColor: '#80bdff',
        fogColor: '#adcff7',
      },
      [BIOMES.PINE_FOREST]: {
        name: 'Pine Forest',
        surfaceBlock: BLOCK.GRASS,
        subSurfaceBlock: BLOCK.DIRT,
        baseHeight: 34,
        heightVariance: 10,
        treeFrequency: 0.07,
        treeType: 'pine',
        plantFrequency: 0.1,
        flowers: [BLOCK.TALL_GRASS, BLOCK.MUSHROOM_BROWN],
        skyColor: '#749ec7',
        fogColor: '#8faec9',
      },
      [BIOMES.DESERT]: {
        name: 'Desert',
        surfaceBlock: BLOCK.SAND,
        subSurfaceBlock: BLOCK.SAND,
        baseHeight: 27,
        heightVariance: 5,
        treeFrequency: 0.02, // cactus
        treeType: 'cactus',
        plantFrequency: 0.01,
        skyColor: '#f2be77',
        fogColor: '#e0b57e',
      },
      [BIOMES.SNOW_PEAKS]: {
        name: 'Snow Peaks',
        surfaceBlock: BLOCK.SNOW,
        subSurfaceBlock: BLOCK.DIRT,
        baseHeight: 42,
        heightVariance: 16,
        treeFrequency: 0.03,
        treeType: 'pine',
        plantFrequency: 0.02,
        skyColor: '#b0cbe8',
        fogColor: '#cad8e6',
      },
      [BIOMES.SWAMP]: {
        name: 'Swamp',
        surfaceBlock: BLOCK.GRASS,
        subSurfaceBlock: BLOCK.CLAY,
        baseHeight: 25,
        heightVariance: 3,
        treeFrequency: 0.05,
        treeType: 'oak',
        plantFrequency: 0.25,
        flowers: [BLOCK.MUSHROOM_BROWN, BLOCK.MUSHROOM_RED, BLOCK.TALL_GRASS],
        skyColor: '#6f8a70',
        fogColor: '#5e755f',
      },
    };
  }

  get(biomeKey) {
    return this.biomes[biomeKey] || this.biomes[BIOMES.PLAINS];
  }

  // Determine biome from temperature (-1 to 1) and humidity (-1 to 1) and continental height
  determineBiome(temp, humidity, continental) {
    if (continental < -0.25) return BIOMES.OCEAN;
    if (continental < -0.15) return BIOMES.BEACH;

    if (temp > 0.4 && humidity < -0.2) return BIOMES.DESERT;
    if (temp < -0.3) return BIOMES.SNOW_PEAKS;
    if (temp < 0.1 && humidity > 0.1) return BIOMES.PINE_FOREST;
    if (humidity > 0.4 && temp > 0.1) return BIOMES.SWAMP;
    if (humidity > 0.1) {
      return temp > 0.2 ? BIOMES.FOREST : BIOMES.BIRCH_FOREST;
    }
    return BIOMES.PLAINS;
  }
}

export const biomeRegistry = new BiomeRegistry();
