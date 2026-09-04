import * as THREE from 'three';
import { BLOCK, blockRegistry } from '../blocks/BlockRegistry.js';

export class Physics {
  constructor(world) {
    this.world = world;
    this.gravity = -28.0;
    this.terminalVelocity = -55.0;
    this.waterGravity = -5.0;
    this.waterTerminalVel = -7.0;
    this.stepHeight = 0.58; // Smooth auto-step up 0.5 blocks (slabs/stairs/hills)
  }

  // Get bounding box of player at position (pos.y is feet position)
  getPlayerAABB(pos, width = 0.6, height = 1.8) {
    const halfW = width / 2;
    return new THREE.Box3(
      new THREE.Vector3(pos.x - halfW, pos.y, pos.z - halfW),
      new THREE.Vector3(pos.x + halfW, pos.y + height, pos.z + halfW)
    );
  }

  // Check if an AABB collides with any solid block in the world
  getIntersectingBlocks(aabb) {
    const minX = Math.floor(aabb.min.x);
    const maxX = Math.floor(aabb.max.x);
    const minY = Math.floor(aabb.min.y);
    const maxY = Math.floor(aabb.max.y);
    const minZ = Math.floor(aabb.min.z);
    const maxZ = Math.floor(aabb.max.z);

    const blocks = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const b = this.world.getBlock(x, y, z);
          if (b !== BLOCK.AIR && b !== BLOCK.WATER) {
            const def = blockRegistry.get(b);
            if (def && def.solid) {
              blocks.push(new THREE.Box3(
                new THREE.Vector3(x, y, z),
                new THREE.Vector3(x + 1, y + 1, z + 1)
              ));
            }
          }
        }
      }
    }
    return blocks;
  }

  // Check if there is solid ground beneath an AABB (used for ledge sneak protection)
  hasGroundBeneath(pos, width = 0.6) {
    const halfW = width / 2;
    const testAABB = new THREE.Box3(
      new THREE.Vector3(pos.x - halfW, pos.y - 0.4, pos.z - halfW),
      new THREE.Vector3(pos.x + halfW, pos.y, pos.z + halfW)
    );
    const intersecting = this.getIntersectingBlocks(testAABB);
    return intersecting.length > 0;
  }

  // Check if player position is in water
  isInWater(pos, height = 1.8) {
    const feetBlock = this.world.getBlock(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
    const waistBlock = this.world.getBlock(Math.floor(pos.x), Math.floor(pos.y + 0.8), Math.floor(pos.z));
    const headBlock = this.world.getBlock(Math.floor(pos.x), Math.floor(pos.y + 1.5), Math.floor(pos.z));
    return (feetBlock === BLOCK.WATER || waistBlock === BLOCK.WATER || headBlock === BLOCK.WATER);
  }

  isHeadInWater(pos) {
    return this.world.getBlock(Math.floor(pos.x), Math.floor(pos.y + 1.5), Math.floor(pos.z)) === BLOCK.WATER;
  }

  // Move player with swept AABB collision, ledge crouching, and auto step-up
  move(pos, velocity, delta, isFlying = false, isSneaking = false, width = 0.6, height = 1.8) {
    const inWater = this.isInWater(pos, height);

    // Apply gravity (unless flying in Creative mode)
    if (!isFlying) {
      if (inWater) {
        velocity.y += this.waterGravity * delta;
        velocity.y = Math.max(velocity.y, this.waterTerminalVel);
        velocity.x *= 0.88;
        velocity.z *= 0.88;
      } else {
        velocity.y += this.gravity * delta;
        velocity.y = Math.max(velocity.y, this.terminalVelocity);
      }
    }

    const moveDelta = velocity.clone().multiplyScalar(delta);
    let onGround = false;

    // 1. Move on Y axis
    pos.y += moveDelta.y;
    let aabb = this.getPlayerAABB(pos, width, height);
    let collisions = this.getIntersectingBlocks(aabb);

    for (const box of collisions) {
      if (moveDelta.y < 0) {
        // Falling onto ground
        pos.y = box.max.y;
        velocity.y = 0;
        onGround = true;
      } else if (moveDelta.y > 0) {
        // Hitting ceiling
        pos.y = box.min.y - height;
        velocity.y = 0;
      }
      aabb = this.getPlayerAABB(pos, width, height);
    }

    // Void fall boundary protection
    if (pos.y < 1.0) {
      pos.y = 1.0;
      velocity.y = 0;
      onGround = true;
    }

    // 2. Move on X axis with Ledge Sneak Protection and Step-Up
    const prevX = pos.x;
    pos.x += moveDelta.x;

    // Sneak ledge protection on X
    if (isSneaking && onGround && !isFlying) {
      if (!this.hasGroundBeneath(pos, width)) {
        pos.x = prevX;
      }
    }

    aabb = this.getPlayerAABB(pos, width, height);
    collisions = this.getIntersectingBlocks(aabb);

    if (collisions.length > 0) {
      // Try step up
      let stepped = false;
      if (onGround) {
        const testPos = pos.clone();
        testPos.y += this.stepHeight;
        const stepAABB = this.getPlayerAABB(testPos, width, height);
        if (this.getIntersectingBlocks(stepAABB).length === 0) {
          pos.y += this.stepHeight;
          stepped = true;
        }
      }

      if (!stepped) {
        pos.x = prevX;
        velocity.x = 0;
      }
    }

    // 3. Move on Z axis with Ledge Sneak Protection and Step-Up
    const prevZ = pos.z;
    pos.z += moveDelta.z;

    // Sneak ledge protection on Z
    if (isSneaking && onGround && !isFlying) {
      if (!this.hasGroundBeneath(pos, width)) {
        pos.z = prevZ;
      }
    }

    aabb = this.getPlayerAABB(pos, width, height);
    collisions = this.getIntersectingBlocks(aabb);

    if (collisions.length > 0) {
      let stepped = false;
      if (onGround) {
        const testPos = pos.clone();
        testPos.y += this.stepHeight;
        const stepAABB = this.getPlayerAABB(testPos, width, height);
        if (this.getIntersectingBlocks(stepAABB).length === 0) {
          pos.y += this.stepHeight;
          stepped = true;
        }
      }

      if (!stepped) {
        pos.z = prevZ;
        velocity.z = 0;
      }
    }

    return { onGround, inWater };
  }

  // Fast voxel raycast using Digital Differential Analyzer (DDA)
  raycast(origin, direction, maxDistance = 5.0) {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = Math.sign(direction.x);
    const stepY = Math.sign(direction.y);
    const stepZ = Math.sign(direction.z);

    const deltaX = direction.x !== 0 ? Math.abs(1 / direction.x) : 1e30;
    const deltaY = direction.y !== 0 ? Math.abs(1 / direction.y) : 1e30;
    const deltaZ = direction.z !== 0 ? Math.abs(1 / direction.z) : 1e30;

    let sideDistX = stepX > 0 ? (x + 1.0 - origin.x) * deltaX : (origin.x - x) * deltaX;
    let sideDistY = stepY > 0 ? (y + 1.0 - origin.y) * deltaY : (origin.y - y) * deltaY;
    let sideDistZ = stepZ > 0 ? (z + 1.0 - origin.z) * deltaZ : (origin.z - z) * deltaZ;

    let normal = [0, 1, 0];
    let distance = 0;

    while (distance < maxDistance) {
      if (sideDistX < sideDistY && sideDistX < sideDistZ) {
        x += stepX;
        distance = sideDistX;
        sideDistX += deltaX;
        normal = [-stepX, 0, 0];
      } else if (sideDistY < sideDistZ) {
        y += stepY;
        distance = sideDistY;
        sideDistY += deltaY;
        normal = [0, -stepY, 0];
      } else {
        z += stepZ;
        distance = sideDistZ;
        sideDistZ += deltaZ;
        normal = [0, 0, -stepZ];
      }

      if (distance > maxDistance) break;

      const block = this.world.getBlock(x, y, z);
      if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
        return {
          hit: true,
          point: origin.clone().add(direction.clone().multiplyScalar(distance)),
          distance,
          blockX: x,
          blockY: y,
          blockZ: z,
          blockId: block,
          faceNormal: normal,
          placeX: x + normal[0],
          placeY: y + normal[1],
          placeZ: z + normal[2],
        };
      }
    }

    return { hit: false };
  }

  // Camera raycast for Third-Person view to prevent camera clipping inside blocks/walls
  raycastCamera(origin, targetPos, radius = 0.15) {
    const dir = targetPos.clone().sub(origin);
    const maxDist = dir.length();
    if (maxDist < 0.01) return targetPos;
    dir.normalize();

    const hit = this.raycast(origin, dir, maxDist);
    if (hit && hit.hit) {
      const safeDist = Math.max(0.4, hit.distance - radius);
      return origin.clone().add(dir.multiplyScalar(safeDist));
    }
    return targetPos;
  }
}
