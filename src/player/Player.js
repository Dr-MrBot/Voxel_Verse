import * as THREE from 'three';
import { Physics } from './Physics.js';
import { BlockInteractions } from './BlockInteractions.js';
import { audioManager } from '../core/AudioManager.js';
import { itemRegistry } from '../items/ItemRegistry.js';
import { BLOCK } from '../blocks/BlockRegistry.js';
import { PlayerModel } from './PlayerModel.js';
import { DroppedItem } from '../items/DroppedItem.js';

export class Player {
  constructor(game, world, scene, camera) {
    this.game = game;
    this.world = world;
    this.scene = scene;
    this.camera = camera;

    this.physics = new Physics(world);
    this.interactions = new BlockInteractions(game, world, scene, this);
    this.model = new PlayerModel(scene, camera);

    // Game Mode & Camera Mode
    this.gameMode = 'survival'; // 'survival' | 'creative'
    this.cameraMode = 0; // 0 = first-person, 1 = third-person
    this.isFlying = false;
    this.flightSpeed = 9.5;
    this.lastSpaceTime = 0;
    this.keyF5Pressed = false;
    this.keyQPressed = false;
    this.keyFPressed = false;

    // Transform
    this.position = new THREE.Vector3(0, 32, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;

    // Movement attributes
    this.walkSpeed = 4.3;
    this.sprintSpeed = 6.8;
    this.sneakSpeed = 1.8;
    this.jumpSpeed = 8.5;

    // States
    this.onGround = false;
    this.inWater = false;
    this.isSprinting = false;
    this.isSneaking = false;
    this.fallStartHeight = 0;
    this.footstepTimer = 0;

    // Player Stats
    this.maxHealth = 20;
    this.health = 20;
    this.maxHunger = 20;
    this.hunger = 20;
    this.hungerTimer = 0;
    this.healTimer = 0;
    this.level = 1;
    this.xp = 0;
    this.xpForNextLevel = 10;

    // Spawn point
    this.spawnPoint = new THREE.Vector3(0, 32, 0);

    // Inventory: 36 slots (0-8: Hotbar, 9-35: Main Inventory)
    this.inventory = new Array(36).fill(null);
    this.selectedHotbarSlot = 0;

    this.giveStarterItems();
  }

  giveStarterItems() {
    // Starter kit: wooden pickaxe, wood axe, 16 oak logs, 8 apples
    this.inventory[0] = { id: 'wooden_pickaxe', count: 1, durability: 60 };
    this.inventory[1] = { id: 'wooden_axe', count: 1, durability: 60 };
    this.inventory[2] = { id: BLOCK.WOOD_OAK, count: 16 };
    this.inventory[3] = { id: 'apple', count: 8 };
    this.inventory[4] = { id: BLOCK.TORCH, count: 12 };
  }

  setSpawnPoint(x, y, z) {
    this.spawnPoint.set(x, y, z);
  }

  getSelectedItem() {
    return this.inventory[this.selectedHotbarSlot];
  }

  consumeSelectedItem() {
    const item = this.getSelectedItem();
    if (!item) return;
    item.count--;
    if (item.count <= 0) {
      this.inventory[this.selectedHotbarSlot] = null;
    }
  }

  addItem(itemId, count = 1) {
    const itemDef = itemRegistry.get(itemId);
    const maxStack = itemDef ? itemDef.maxStack : 64;
    let remaining = count;

    // 1. Try stacking into existing slots
    for (let i = 0; i < 36; i++) {
      const slot = this.inventory[i];
      if (slot && slot.id === itemId && slot.count < maxStack) {
        const canAdd = Math.min(remaining, maxStack - slot.count);
        slot.count += canAdd;
        remaining -= canAdd;
        if (remaining <= 0) return count;
      }
    }

    // 2. Find empty slot
    for (let i = 0; i < 36; i++) {
      if (!this.inventory[i]) {
        const canAdd = Math.min(remaining, maxStack);
        this.inventory[i] = { id: itemId, count: canAdd };
        remaining -= canAdd;
        if (remaining <= 0) return count;
      }
    }

    return count - remaining; // Number of items added
  }

  addXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpForNextLevel) {
      this.xp -= this.xpForNextLevel;
      this.level++;
      this.xpForNextLevel = Math.floor(this.xpForNextLevel * 1.5);
      audioManager.playLevelUp();
      this.game.ui.showNotification(`Level Up! You are now level ${this.level}`);
    }
  }

  eatFood(nutrition) {
    this.hunger = Math.min(this.maxHunger, this.hunger + nutrition);
  }

  takeDamage(amount) {
    if (this.gameMode === 'creative') return; // Creative mode invulnerability

    this.health = Math.max(0, this.health - amount);
    audioManager.playHurt();
    this.model.flashHurt();

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.game.onPlayerDied();
  }

  respawn() {
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.position.copy(this.spawnPoint);
    this.velocity.set(0, 0, 0);
  }

  dropSelectedItem() {
    const item = this.getSelectedItem();
    if (!item) return;

    // Remove 1 item
    item.count--;
    const dropId = item.id;
    if (item.count <= 0) {
      this.inventory[this.selectedHotbarSlot] = null;
    }

    // Spawn 3D dropped item entity in front of player
    const spawnPos = this.position.clone();
    spawnPos.y += 1.3;
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    const dropVel = forward.multiplyScalar(4.5);
    dropVel.y += 2.0;

    const dropped = new DroppedItem(this.world, this.scene, spawnPos, dropId, 1, dropVel);
    this.game.droppedItems.push(dropped);
    audioManager.playDig();
  }

  update(delta, input, allowControl = true) {
    // 1. Update Camera Rotation (only if pointer locked)
    if (allowControl && input.isPointerLocked) {
      const mouse = input.getAndClearMouseDelta();
      this.yaw -= mouse.x;
      this.pitch -= mouse.y;
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
    }

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;

    // F5: Toggle Camera Mode (First Person / Third Person)
    if (input.keys.get('F5')) {
      if (!this.keyF5Pressed) {
        this.cameraMode = (this.cameraMode + 1) % 2;
        this.keyF5Pressed = true;
      }
    } else {
      this.keyF5Pressed = false;
    }

    // F: Toggle Creative Flight
    if (input.keys.get('KeyF')) {
      if (!this.keyFPressed) {
        if (this.gameMode === 'creative') {
          this.isFlying = !this.isFlying;
          this.velocity.y = 0;
          this.game.ui.showNotification(this.isFlying ? 'Flight Enabled (Space=Up, Shift=Down)' : 'Flight Disabled');
        }
        this.keyFPressed = true;
      }
    } else {
      this.keyFPressed = false;
    }

    // Q: Drop selected item
    if (input.keys.get('KeyQ')) {
      if (!this.keyQPressed && allowControl) {
        this.dropSelectedItem();
        this.keyQPressed = true;
      }
    } else {
      this.keyQPressed = false;
    }

    // 2. Hotbar Slot Selection (Wheel + 1-9 keys)
    const wheel = input.getAndClearWheelDelta();
    if (wheel !== 0) {
      this.selectedHotbarSlot = (this.selectedHotbarSlot + wheel + 9) % 9;
    }
    for (let i = 1; i <= 9; i++) {
      if (input.keys.get(`Digit${i}`)) {
        this.selectedHotbarSlot = i - 1;
      }
    }

    // 3. Movement input
    const forward = input.isActionPressed('forward');
    const backward = input.isActionPressed('backward');
    const left = input.isActionPressed('left');
    const right = input.isActionPressed('right');
    const jump = input.isActionPressed('jump');
    const sprint = input.isActionPressed('sprint');
    const sneak = input.isActionPressed('sneak');

    this.isSprinting = sprint && forward && !sneak && (this.gameMode === 'creative' || this.hunger > 6);
    this.isSneaking = sneak && this.onGround && !this.isFlying;

    let speed = this.walkSpeed;
    if (this.isFlying) speed = this.flightSpeed;
    else if (this.isSprinting) speed = this.sprintSpeed;
    else if (this.isSneaking) speed = this.sneakSpeed;
    if (this.inWater && !this.isFlying) speed *= 0.65;

    // Direction vector in horizontal plane
    const moveDir = new THREE.Vector3();
    if (forward) moveDir.z -= 1;
    if (backward) moveDir.z += 1;
    if (left) moveDir.x -= 1;
    if (right) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      if (this.onGround && !this.isFlying) {
        this.footstepTimer += delta * (this.isSprinting ? 1.6 : 1.0);
        if (this.footstepTimer > 0.38) {
          this.footstepTimer = 0;
          audioManager.playFootstep();
        }
      }
    } else {
      this.velocity.x *= 0.75;
      this.velocity.z *= 0.75;
    }

    // Vertical Movement (Flight vs Walking/Jumping)
    if (this.isFlying) {
      if (jump) {
        this.velocity.y = 7.0;
      } else if (sneak) {
        this.velocity.y = -7.0;
      } else {
        this.velocity.y = 0;
      }
    } else {
      if (jump) {
        if (this.inWater) {
          this.velocity.y = 3.5;
        } else if (this.onGround) {
          this.velocity.y = this.jumpSpeed;
          audioManager.playJump();
          this.fallStartHeight = this.position.y;
        }
      }

      // Fall damage tracking (only in survival)
      if (this.gameMode !== 'creative' && !this.onGround && this.velocity.y < 0 && this.fallStartHeight === 0) {
        this.fallStartHeight = this.position.y;
      }
    }

    // Physics update
    const result = this.physics.move(this.position, this.velocity, delta, this.isFlying);
    this.onGround = result.onGround;
    this.inWater = result.inWater;

    // Fall damage calculation (Survival only)
    if (this.gameMode !== 'creative' && this.onGround && this.fallStartHeight > 0) {
      const fallDist = this.fallStartHeight - this.position.y;
      if (fallDist > 3.5) {
        const dmg = Math.floor(fallDist - 3);
        this.takeDamage(dmg);
      }
      this.fallStartHeight = 0;
    }

    // Camera follow (1st person vs 3rd person)
    const eyeHeight = this.isSneaking ? 1.4 : 1.62;
    if (this.cameraMode === 1) {
      // Third-person over shoulder
      const camDist = 3.4;
      const offsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * camDist;
      const offsetY = -Math.sin(this.pitch) * camDist + 0.35;
      const offsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * camDist;
      this.camera.position.set(
        this.position.x + offsetX,
        this.position.y + eyeHeight + offsetY,
        this.position.z + offsetZ
      );
    } else {
      // First-person directly at eye position
      this.camera.position.set(this.position.x, this.position.y + eyeHeight, this.position.z);
    }

    // Update 3D Character Model and Hand Visuals
    this.model.setEquippedItem(this.getSelectedItem());
    this.model.update(delta, this, this.cameraMode === 1);

    // Underwater camera tint / fog adjustment
    if (this.physics.isHeadInWater(this.position)) {
      this.world.scene.fog.density = 0.08;
      this.world.scene.fog.color.setHex(0x1a457a);
    } else {
      this.world.scene.fog.density = 0.015;
    }

    // 4. Hunger & Health regeneration (Survival only)
    if (this.gameMode !== 'creative') {
      this.hungerTimer += delta;
      if (this.hungerTimer > 12.0) {
        this.hungerTimer = 0;
        if (this.isSprinting || moveDir.lengthSq() > 0) {
          this.hunger = Math.max(0, this.hunger - 1);
        }
      }

      this.healTimer += delta;
      if (this.healTimer > 4.0) {
        this.healTimer = 0;
        if (this.hunger >= 18 && this.health < this.maxHealth) {
          this.health = Math.min(this.maxHealth, this.health + 1);
        } else if (this.hunger === 0) {
          this.takeDamage(1); // Starvation
        }
      }
    }

    // 5. Block targeting & interactions
    this.interactions.update(delta, input);
  }
}
