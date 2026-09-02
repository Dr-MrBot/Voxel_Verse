import * as THREE from 'three';
import { BLOCK, blockRegistry } from '../blocks/BlockRegistry.js';
import { textureAtlas } from '../blocks/TextureAtlas.js';
import { WORLD_HEIGHT } from './TerrainGenerator.js';

export const CHUNK_SIZE = 16;

// Direction offsets: +X, -X, +Y, -Y, +Z, -Z
// Each face corners: [v0(BL), v1(BR), v2(TR), v3(TL)]
const FACES = [
  { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], norm: [1, 0, 0], shade: 0.8 },   // Right (+X)
  { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], norm: [-1, 0, 0], shade: 0.8 }, // Left (-X)
  { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], norm: [0, 1, 0], shade: 1.0 },    // Top (+Y)
  { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], norm: [0, -1, 0], shade: 0.6 }, // Bottom (-Y)
  { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], norm: [0, 0, 1], shade: 0.9 },   // Front (+Z)
  { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], norm: [0, 0, -1], shade: 0.9 }, // Back (-Z)
];

export class Chunk {
  constructor(world, chunkX, chunkZ) {
    this.world = world;
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.key = `${chunkX},${chunkZ}`;

    this.data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * WORLD_HEIGHT);
    this.heightMap = new Int32Array(CHUNK_SIZE * CHUNK_SIZE);
    this.isDirty = true;

    this.opaqueMesh = null;
    this.transMesh = null;
  }

  getIndex(x, y, z) {
    return (x * CHUNK_SIZE + z) * WORLD_HEIGHT + y;
  }

  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT) {
      return this.world.getBlock(this.chunkX * CHUNK_SIZE + x, y, this.chunkZ * CHUNK_SIZE + z);
    }
    return this.data[this.getIndex(x, y, z)];
  }

  setBlock(x, y, z, blockId) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT) {
      return;
    }
    this.data[this.getIndex(x, y, z)] = blockId;
    this.isDirty = true;
  }

  // Calculate ambient occlusion for vertex (0=darkest, 3=brightest)
  calcAO(side1, side2, corner) {
    const s1 = side1 ? 1 : 0;
    const s2 = side2 ? 1 : 0;
    const c = corner ? 1 : 0;
    if (s1 && s2) return 0;
    return 3 - (s1 + s2 + c);
  }

  // Generate buffer geometries with face culling and vertex AO
  buildMesh(materials) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const colors = [];

    const transPositions = [];
    const transNormals = [];
    const transUvs = [];
    const transColors = [];

    const aoFactors = [0.5, 0.68, 0.85, 1.0];

    const addQuad = (v0, v1, v2, v3, norm, uvBox, shade, aoValues, isTrans) => {
      const posArr = isTrans ? transPositions : positions;
      const normArr = isTrans ? transNormals : normals;
      const uvArr = isTrans ? transUvs : uvs;
      const colArr = isTrans ? transColors : colors;

      // Two triangles: (v0, v1, v2) and (v0, v2, v3)
      const flip = (aoValues[0] + aoValues[2]) > (aoValues[1] + aoValues[3]);

      const [u0, v0y, u1, v1y] = uvBox;

      const pushVertex = (v, u, vy, aoIdx) => {
        posArr.push(v[0], v[1], v[2]);
        normArr.push(norm[0], norm[1], norm[2]);
        uvArr.push(u, vy);
        const ao = aoFactors[aoValues[aoIdx]];
        const c = shade * ao;
        colArr.push(c, c, c);
      };

      if (!flip) {
        // v0(BL), v1(BR), v2(TR)
        pushVertex(v0, u0, v0y, 0);
        pushVertex(v1, u1, v0y, 1);
        pushVertex(v2, u1, v1y, 2);

        // v0(BL), v2(TR), v3(TL)
        pushVertex(v0, u0, v0y, 0);
        pushVertex(v2, u1, v1y, 2);
        pushVertex(v3, u0, v1y, 3);
      } else {
        // v1(BR), v2(TR), v3(TL)
        pushVertex(v1, u1, v0y, 1);
        pushVertex(v2, u1, v1y, 2);
        pushVertex(v3, u0, v1y, 3);

        // v1(BR), v3(TL), v0(BL)
        pushVertex(v1, u1, v0y, 1);
        pushVertex(v3, u0, v1y, 3);
        pushVertex(v0, u0, v0y, 0);
      }
    };

    const isOpaqueSolid = (b) => {
      if (b === BLOCK.AIR) return false;
      const def = blockRegistry.get(b);
      return def.solid && !def.transparent;
    };

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          const block = this.data[this.getIndex(x, y, z)];
          if (block === BLOCK.AIR) continue;

          const def = blockRegistry.get(block);

          // Render cross meshes (flowers, tall grass, crops, torches)
          if (def.crossMesh) {
            const uvBox = textureAtlas.getUV(textureAtlas.getUV ? blockRegistry.getTextureForFace(block, 0) : 0);
            const p0 = [x, y, z];
            const p1 = [x + 1, y, z + 1];
            const p2 = [x + 1, y + 1, z + 1];
            const p3 = [x, y + 1, z];

            const p4 = [x, y, z + 1];
            const p5 = [x + 1, y, z];
            const p6 = [x + 1, y + 1, z];
            const p7 = [x, y + 1, z + 1];

            addQuad(p0, p3, p2, p1, [0, 1, 0], uvBox, 1.0, [3, 3, 3, 3], true);
            addQuad(p1, p2, p3, p0, [0, 1, 0], uvBox, 1.0, [3, 3, 3, 3], true);
            addQuad(p4, p7, p6, p5, [0, 1, 0], uvBox, 1.0, [3, 3, 3, 3], true);
            addQuad(p5, p6, p7, p4, [0, 1, 0], uvBox, 1.0, [3, 3, 3, 3], true);
            continue;
          }

          // Render standard 6-sided cubes
          for (let f = 0; f < 6; f++) {
            const face = FACES[f];
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];

            const neighbor = this.getBlock(nx, ny, nz);
            const neighborDef = blockRegistry.get(neighbor);

            // Face culling test
            let renderFace = false;
            if (def.liquid) {
              renderFace = (neighbor !== BLOCK.WATER);
            } else if (def.transparent) {
              renderFace = (neighbor !== block && (!neighborDef.solid || neighborDef.transparent));
            } else {
              renderFace = (!neighborDef.solid || neighborDef.transparent);
            }

            if (!renderFace) continue;

            const texIndex = blockRegistry.getTextureForFace(block, f);
            const uvBox = textureAtlas.getUV(texIndex);

            const v0 = [x + face.corners[0][0], y + face.corners[0][1], z + face.corners[0][2]];
            const v1 = [x + face.corners[1][0], y + face.corners[1][1], z + face.corners[1][2]];
            const v2 = [x + face.corners[2][0], y + face.corners[2][1], z + face.corners[2][2]];
            const v3 = [x + face.corners[3][0], y + face.corners[3][1], z + face.corners[3][2]];

            // Ambient Occlusion
            const aoValues = [3, 3, 3, 3];
            if (!def.transparent && !def.liquid) {
              const [dx, dy, dz] = face.dir;
              if (dy !== 0) {
                // Horizontal neighbors on top/bottom face
                const sN = isOpaqueSolid(this.getBlock(x, y + dy, z - 1));
                const sS = isOpaqueSolid(this.getBlock(x, y + dy, z + 1));
                const sE = isOpaqueSolid(this.getBlock(x + 1, y + dy, z));
                const sW = isOpaqueSolid(this.getBlock(x - 1, y + dy, z));
                const cNW = isOpaqueSolid(this.getBlock(x - 1, y + dy, z - 1));
                const cNE = isOpaqueSolid(this.getBlock(x + 1, y + dy, z - 1));
                const cSW = isOpaqueSolid(this.getBlock(x - 1, y + dy, z + 1));
                const cSE = isOpaqueSolid(this.getBlock(x + 1, y + dy, z + 1));

                if (dy > 0) {
                  aoValues[0] = this.calcAO(sW, sS, cSW);
                  aoValues[1] = this.calcAO(sE, sS, cSE);
                  aoValues[2] = this.calcAO(sE, sN, cNE);
                  aoValues[3] = this.calcAO(sW, sN, cNW);
                } else {
                  aoValues[0] = this.calcAO(sW, sN, cNW);
                  aoValues[1] = this.calcAO(sE, sN, cNE);
                  aoValues[2] = this.calcAO(sE, sS, cSE);
                  aoValues[3] = this.calcAO(sW, sS, cSW);
                }
              }
            }

            const isTrans = def.transparent || def.liquid;
            addQuad(v0, v1, v2, v3, face.norm, uvBox, face.shade, aoValues, isTrans);
          }
        }
      }
    }

    this.disposeMeshes();

    const worldOffsetX = this.chunkX * CHUNK_SIZE;
    const worldOffsetZ = this.chunkZ * CHUNK_SIZE;

    // Build Opaque Mesh
    if (positions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      this.opaqueMesh = new THREE.Mesh(geo, materials.opaque);
      this.opaqueMesh.position.set(worldOffsetX, 0, worldOffsetZ);
      this.world.scene.add(this.opaqueMesh);
    }

    // Build Transparent Mesh (leaves, glass, water)
    if (transPositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(transPositions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(transNormals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(transUvs, 2));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(transColors, 3));

      this.transMesh = new THREE.Mesh(geo, materials.transparent);
      this.transMesh.position.set(worldOffsetX, 0, worldOffsetZ);
      this.world.scene.add(this.transMesh);
    }

    this.isDirty = false;
  }

  disposeMeshes() {
    if (this.opaqueMesh) {
      this.world.scene.remove(this.opaqueMesh);
      this.opaqueMesh.geometry.dispose();
      this.opaqueMesh = null;
    }
    if (this.transMesh) {
      this.world.scene.remove(this.transMesh);
      this.transMesh.geometry.dispose();
      this.transMesh = null;
    }
  }

  dispose() {
    this.disposeMeshes();
  }
}
