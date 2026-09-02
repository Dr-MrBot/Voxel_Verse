import * as THREE from 'three';
import { Chunk, CHUNK_SIZE } from './Chunk.js';
import { TerrainGenerator, WORLD_HEIGHT, SEA_LEVEL } from './TerrainGenerator.js';
import { BLOCK } from '../blocks/BlockRegistry.js';
import { textureAtlas } from '../blocks/TextureAtlas.js';

export class World {
  constructor(scene, seed = 1337) {
    this.scene = scene;
    this.seed = seed;
    this.generator = new TerrainGenerator(seed);

    this.chunks = new Map();
    this.modifiedBlocks = new Map(); // key: "x,y,z" -> blockId
    this.chests = new Map();         // key: "x,y,z" -> items array
    this.furnaces = new Map();       // key: "x,y,z" -> furnace state

    this.renderDistance = 5; // chunks radius
    this.meshQueue = [];

    this.initMaterials();
  }

  initMaterials() {
    this.materials = {
      opaque: new THREE.MeshLambertMaterial({
        map: textureAtlas.texture,
        vertexColors: true,
        side: THREE.DoubleSide,
      }),
      transparent: new THREE.MeshLambertMaterial({
        map: textureAtlas.texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        alphaTest: 0.1,
        side: THREE.DoubleSide,
        depthWrite: true,
      }),
    };
  }

  getChunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  getChunk(cx, cz) {
    return this.chunks.get(this.getChunkKey(cx, cz));
  }

  getChunkAtWorldPos(wx, wz) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    return this.getChunk(cx, cz);
  }

  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= WORLD_HEIGHT) return BLOCK.AIR;
    const key = `${wx},${wy},${wz}`;
    if (this.modifiedBlocks.has(key)) {
      return this.modifiedBlocks.get(key);
    }

    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);

    if (chunk) {
      const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      return chunk.data[chunk.getIndex(lx, wy, lz)];
    }

    return BLOCK.AIR;
  }

  setBlock(wx, wy, wz, blockId) {
    if (wy < 0 || wy >= WORLD_HEIGHT) return;
    const key = `${wx},${wy},${wz}`;
    this.modifiedBlocks.set(key, blockId);

    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);

    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    if (chunk) {
      chunk.data[chunk.getIndex(lx, wy, lz)] = blockId;
      this.queueChunkMesh(chunk);
    }

    // Check if border block and trigger neighbor chunk rebuilds
    if (lx === 0) {
      const neighbor = this.getChunk(cx - 1, cz);
      if (neighbor) this.queueChunkMesh(neighbor);
    } else if (lx === CHUNK_SIZE - 1) {
      const neighbor = this.getChunk(cx + 1, cz);
      if (neighbor) this.queueChunkMesh(neighbor);
    }

    if (lz === 0) {
      const neighbor = this.getChunk(cx, cz - 1);
      if (neighbor) this.queueChunkMesh(neighbor);
    } else if (lz === CHUNK_SIZE - 1) {
      const neighbor = this.getChunk(cx, cz + 1);
      if (neighbor) this.queueChunkMesh(neighbor);
    }
  }

  queueChunkMesh(chunk) {
    if (!this.meshQueue.includes(chunk)) {
      this.meshQueue.push(chunk);
    }
  }

  // Load or generate chunk
  loadChunk(cx, cz) {
    const key = this.getChunkKey(cx, cz);
    if (this.chunks.has(key)) return this.chunks.get(key);

    const chunk = new Chunk(this, cx, cz);
    const { data, heightMap } = this.generator.generateChunkData(cx, cz);
    chunk.data = data;
    chunk.heightMap = heightMap;

    // Apply modified block deltas to chunk
    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = startX + lx;
        const wz = startZ + lz;
        for (let wy = 0; wy < WORLD_HEIGHT; wy++) {
          const modKey = `${wx},${wy},${wz}`;
          if (this.modifiedBlocks.has(modKey)) {
            chunk.data[chunk.getIndex(lx, wy, lz)] = this.modifiedBlocks.get(modKey);
          }
        }
      }
    }

    this.chunks.set(key, chunk);
    this.queueChunkMesh(chunk);
    return chunk;
  }

  unloadChunk(cx, cz) {
    const key = this.getChunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (chunk) {
      chunk.dispose();
      this.chunks.delete(key);
      const queueIdx = this.meshQueue.indexOf(chunk);
      if (queueIdx !== -1) {
        this.meshQueue.splice(queueIdx, 1);
      }
    }
  }

  // Synchronously generate and mesh chunks around spawn so player lands on solid ground immediately
  pregenerateSpawn(spawnX = 0, spawnZ = 0) {
    const centerCX = Math.floor(spawnX / CHUNK_SIZE);
    const centerCZ = Math.floor(spawnZ / CHUNK_SIZE);
    const radius = 3; // 7x7 chunks = 49 chunks = 112x112 blocks
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        this.loadChunk(centerCX + dx, centerCZ + dz);
      }
    }
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const chunk = this.getChunk(centerCX + dx, centerCZ + dz);
        if (chunk) chunk.buildMesh(this.materials);
      }
    }
    this.meshQueue = [];
  }

  // Find a safe spawn position on solid ground with open air above
  findSafeSpawn() {
    this.loadChunk(0, 0);
    this.loadChunk(0, -1);
    this.loadChunk(-1, 0);
    this.loadChunk(1, 0);
    this.loadChunk(0, 1);

    for (let x = 4; x < 12; x++) {
      for (let z = 4; z < 12; z++) {
        const { height } = this.generator.getTerrainData(x, z);
        if (height >= SEA_LEVEL + 1) {
          const chunk = this.loadChunk(Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE));
          const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
          const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

          const groundB = chunk.data[chunk.getIndex(lx, height, lz)];
          const air1 = chunk.data[chunk.getIndex(lx, height + 1, lz)];
          const air2 = chunk.data[chunk.getIndex(lx, height + 2, lz)];

          if ((groundB === BLOCK.GRASS || groundB === BLOCK.SAND || groundB === BLOCK.DIRT) &&
              air1 === BLOCK.AIR && air2 === BLOCK.AIR) {
            return { x: x + 0.5, y: height + 1.0, z: z + 0.5 };
          }
        }
      }
    }

    return { x: 8.5, y: SEA_LEVEL + 5.0, z: 8.5 };
  }

  // Update streamed chunks around player position
  update(playerPos) {
    const centerChunkX = Math.floor(playerPos.x / CHUNK_SIZE);
    const centerChunkZ = Math.floor(playerPos.z / CHUNK_SIZE);

    const dist = this.renderDistance;
    const neededKeys = new Set();

    // Spiral / radial chunk loading
    for (let dx = -dist; dx <= dist; dx++) {
      for (let dz = -dist; dz <= dist; dz++) {
        if (dx * dx + dz * dz <= dist * dist + 1) {
          const cx = centerChunkX + dx;
          const cz = centerChunkZ + dz;
          neededKeys.add(this.getChunkKey(cx, cz));
          this.loadChunk(cx, cz);
        }
      }
    }

    // Unload distant chunks
    for (const [key, chunk] of this.chunks.entries()) {
      if (!neededKeys.has(key)) {
        this.unloadChunk(chunk.chunkX, chunk.chunkZ);
      }
    }

    // Build queued chunk meshes (limit to 2 per frame to maintain 60 FPS)
    let processed = 0;
    while (this.meshQueue.length > 0 && processed < 2) {
      const chunk = this.meshQueue.shift();
      if (this.chunks.has(chunk.key)) {
        chunk.buildMesh(this.materials);
        processed++;
      }
    }
  }

  dispose() {
    for (const chunk of this.chunks.values()) {
      chunk.dispose();
    }
    this.chunks.clear();
    this.meshQueue = [];
  }
}
