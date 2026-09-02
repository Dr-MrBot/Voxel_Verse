import * as THREE from 'three';
import { blockRegistry } from '../blocks/BlockRegistry.js';
import { itemRegistry } from '../items/ItemRegistry.js';
import { textureAtlas } from '../blocks/TextureAtlas.js';
import { audioManager } from '../core/AudioManager.js';

export class DroppedItem {
  constructor(world, scene, x, y, z, itemId, count = 1) {
    this.world = world;
    this.scene = scene;
    this.itemId = itemId;
    this.count = count;

    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      2.5 + Math.random() * 1.5,
      (Math.random() - 0.5) * 2
    );

    this.age = 0;
    this.maxAge = 300; // 5 minutes
    this.pickupDelay = 0.5; // seconds before player can pick up
    this.isDead = false;

    this.initMesh();
  }

  initMesh() {
    const itemDef = itemRegistry.get(this.itemId);
    const size = 0.28;
    const geo = new THREE.BoxGeometry(size, size, size);

    let mat;
    if (itemDef && itemDef.isBlock) {
      mat = new THREE.MeshLambertMaterial({
        map: textureAtlas.texture,
        transparent: true,
      });
    } else {
      mat = new THREE.MeshLambertMaterial({
        color: itemDef ? itemDef.color : 0xffffff,
      });
    }

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  update(delta, player) {
    if (this.isDead) return;
    this.age += delta;
    if (this.age > this.maxAge) {
      this.dispose();
      return;
    }

    // Apply gravity
    this.velocity.y -= 18.0 * delta;
    this.velocity.y = Math.max(this.velocity.y, -25.0);
    this.velocity.x *= 0.95;
    this.velocity.z *= 0.95;

    // Collide with ground
    const nextY = this.position.y + this.velocity.y * delta;
    const blockBelow = this.world.getBlock(
      Math.floor(this.position.x),
      Math.floor(nextY),
      Math.floor(this.position.z)
    );
    const def = blockRegistry.get(blockBelow);

    if (def && def.solid) {
      this.position.y = Math.floor(nextY) + 1.05;
      this.velocity.y = 0;
    } else {
      this.position.y = nextY;
    }

    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Bobbing and rotation
    this.mesh.rotation.y += delta * 2.5;
    const bob = Math.sin(this.age * 4.0) * 0.08;
    this.mesh.position.set(this.position.x, this.position.y + bob, this.position.z);

    // Player magnet and pickup
    if (this.age > this.pickupDelay) {
      const playerPos = player.position.clone();
      playerPos.y += 0.9;
      const dist = this.position.distanceTo(playerPos);

      if (dist < 2.2) {
        // Magnet pull toward player
        const dir = playerPos.clone().sub(this.position).normalize();
        this.position.add(dir.multiplyScalar(delta * 7.0));

        if (dist < 0.8) {
          const added = player.addItem(this.itemId, this.count);
          if (added > 0) {
            audioManager.playPop();
            if (player.game && player.game.hud) {
              player.game.hud.showItemPickup(this.itemId, added);
            }
            this.count -= added;
            if (this.count <= 0) {
              this.dispose();
            }
          }
        }
      }
    }
  }

  dispose() {
    this.isDead = true;
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
  }
}
