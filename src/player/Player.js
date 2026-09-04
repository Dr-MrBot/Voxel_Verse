import * as THREE from 'three';
import { Physics } from './Physics.js';
import { BlockInteractions } from './BlockInteractions.js';
import { audioManager } from '../core/AudioManager.js';
import { itemRegistry } from '../items/ItemRegistry.js';
import { BLOCK, blockRegistry } from '../blocks/BlockRegistry.js';
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
    this.thirdPersonDistance = 3.5;
    this.isFlying = false;
    this.flightSpeed = 10.5;
    this.keyF5Pressed = false;
    this.keyQPressed = false;
    this.keyFPressed = false;

    // Transform
    this.position = new THREE.Vector3(0, 32, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;

    // Movement attributes
    this.walkSpeed = 4.4;
    this.sprintSpeed = 7.0;
    this.sneakSpeed = 1.9;
    this.jumpSpeed = 8.6;

    // States & Feedback
    this.onGround = false;
    this.wasOnGround = false;
    this.inWater = false;
    this.isSprinting = false;
    this.isSneaking = false;
    this.fallStartHeight = 0;
    this.footstepTimer = 0;
    this.landingBob = 0; // Smooth camera dip on landing
    this.headBobTimer = 0;

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
    // Starter kit: wooden pickaxe, wood axe, 16 oak logs, 8 apples, 12 torches
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

    return count - remaining;
  }

  addXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpForNextLevel) {
      this.xp -= this.xpForNextLevel;
      this.level++;
      this.xpForNextLevel = Math.floor(this.xpForNextLevel * 1.5);
      audioManager.playLevelUp();
      if (this.game.ui) {
        this.game.ui.showNotification(`Leveled Up! Reached Level ${this.level}`);
      }
    }
  }

  takeDamage(amount) {
    if (this.gameMode === 'creative') return; // Creative mode invulnerability

    this.health = Math.max(0, this.health - amount);
    audioManager.playHurt();
    this.model.triggerHurt();

    if (this.game.particles) {
      this.game.particles.emitDamage(this.position.x, this.position.y + 0.8, this.position.z, 10);
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  feed(amount) {
    this.hunger = Math.min(this.maxHunger, this.hunger + amount);
    audioManager.playEat();
  }

  die() {
    this.game.showDeathScreen(this.level);
  }

  respawn() {
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.velocity.set(0, 0, 0);
    this.position.copy(this.spawnPoint);
    this.fallStartHeight = 0;
  }

  dropSelectedItem() {
    const item = this.getSelectedItem();
    if (!item) return;

    const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const dropPos = this.camera.position.clone().add(lookDir.clone().multiplyScalar(0.75));
    const dropVel = lookDir.clone().multiplyScalar(4.5).add(new THREE.Vector3(0, 2.0, 0));

    new DroppedItem(
      this.scene,
      this.world,
      dropPos.x,
      dropPos.y,
      dropPos.z,
      item.id,
      1,
      dropVel
    );

    this.consumeSelectedItem();
    audioManager.playPop();
  }

  getGroundBlockDef() {
    const blockId = this.world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y - 0.2),
      Math.floor(this.position.z)
    );
    return blockRegistry.get(blockId) || { sound: 'grass' };
  }

  update(delta, input, allowControl = true) {
    if (allowControl && input) {
      // Mouse Look rotation
      const mouseDelta = input.getAndClearMouseDelta();
      this.yaw -= mouseDelta.x;
      this.pitch -= mouseDelta.y;

      const maxPitch = Math.PI / 2 - 0.01;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
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

    // Hotbar Slot Selection (Wheel + 1-9 keys)
    const wheel = input.getAndClearWheelDelta();
    if (wheel !== 0) {
      if (this.cameraMode === 1 && input.mouseButtons.right) {
        // Zoom camera distance in 3rd person if right-click is held
        this.thirdPersonDistance = Math.max(1.5, Math.min(6.5, this.thirdPersonDistance + wheel * 0.5));
      } else {
        this.selectedHotbarSlot = (this.selectedHotbarSlot + wheel + 9) % 9;
      }
    }
    for (let i = 1; i <= 9; i++) {
      if (input.keys.get(`Digit${i}`)) {
        this.selectedHotbarSlot = i - 1;
      }
    }

    // Movement input
    const forward = allowControl && input.isActionPressed('forward');
    const backward = allowControl && input.isActionPressed('backward');
    const left = allowControl && input.isActionPressed('left');
    const right = allowControl && input.isActionPressed('right');
    const jump = allowControl && input.isActionPressed('jump');
    const sprint = allowControl && input.isActionPressed('sprint');
    const sneak = allowControl && input.isActionPressed('sneak');

    this.isSprinting = sprint && forward && !sneak && (this.gameMode === 'creative' || this.hunger > 6);
    this.isSneaking = sneak && this.onGround && !this.isFlying;

    let targetSpeed = this.walkSpeed;
    if (this.isFlying) targetSpeed = this.flightSpeed;
    else if (this.isSprinting) targetSpeed = this.sprintSpeed;
    else if (this.isSneaking) targetSpeed = this.sneakSpeed;
    if (this.inWater && !this.isFlying) targetSpeed *= 0.65;

    // Direction vector in horizontal plane
    const moveDir = new THREE.Vector3();
    if (forward) moveDir.z -= 1;
    if (backward) moveDir.z += 1;
    if (left) moveDir.x -= 1;
    if (right) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

      // Smooth acceleration
      const accel = this.onGround ? 18.0 : 8.0;
      this.velocity.x += (moveDir.x * targetSpeed - this.velocity.x) * Math.min(1.0, accel * delta);
      this.velocity.z += (moveDir.z * targetSpeed - this.velocity.z) * Math.min(1.0, accel * delta);

      if (this.onGround && !this.isFlying) {
        this.footstepTimer += delta * (this.isSprinting ? 1.6 : 1.0);
        if (this.footstepTimer > 0.36) {
          this.footstepTimer = 0;
          const groundBlock = this.getGroundBlockDef();
          audioManager.playFootstep(groundBlock.sound || 'grass');

          if (this.game.particles && (this.isSprinting || Math.random() < 0.3)) {
            const color = groundBlock.textures?.top ? 0x55a52d : 0x825532;
            this.game.particles.emitFootstep(this.position.x, this.position.y, this.position.z, color, 3);
          }
        }
      }
    } else {
      // Smooth deceleration / friction
      const friction = this.onGround ? 14.0 : 3.0;
      this.velocity.x -= this.velocity.x * Math.min(1.0, friction * delta);
      this.velocity.z -= this.velocity.z * Math.min(1.0, friction * delta);
    }

    // Vertical Movement (Flight vs Walking/Jumping)
    if (this.isFlying) {
      if (jump) {
        this.velocity.y = 8.0;
      } else if (sneak) {
        this.velocity.y = -8.0;
      } else {
        this.velocity.y = 0;
      }
    } else {
      if (jump) {
        if (this.inWater) {
          this.velocity.y = 4.0;
          if (this.game.particles && Math.random() < 0.3) {
            this.game.particles.emitWaterSplash(this.position.x, this.position.y + 0.5, this.position.z, 4);
          }
        } else if (this.onGround) {
          this.velocity.y = this.jumpSpeed;
          audioManager.playJump();
          this.fallStartHeight = this.position.y;
        }
      }

      // Fall start height tracking (only in survival)
      if (this.gameMode !== 'creative' && !this.onGround && this.velocity.y < 0 && this.fallStartHeight === 0) {
        this.fallStartHeight = this.position.y;
      }
    }

    // Physics update with sneak protection
    this.wasOnGround = this.onGround;
    const result = this.physics.move(
      this.position,
      this.velocity,
      delta,
      this.isFlying,
      this.isSneaking
    );
    this.onGround = result.onGround;
    this.inWater = result.inWater;

    // Landing feedback (impact thud, particle dust, camera dip)
    if (!this.wasOnGround && this.onGround && !this.isFlying) {
      audioManager.playLanding();
      this.landingBob = 0.12;

      const groundBlock = this.getGroundBlockDef();
      if (this.game.particles) {
        this.game.particles.emitFootstep(this.position.x, this.position.y, this.position.z, 0x825532, 8);
      }
    }

    // Fall damage calculation (Survival only)
    if (this.gameMode !== 'creative' && this.onGround && this.fallStartHeight > 0) {
      const fallDist = this.fallStartHeight - this.position.y;
      if (fallDist > 3.8) {
        const dmg = Math.floor(fallDist - 3);
        this.takeDamage(dmg);
      }
      this.fallStartHeight = 0;
    }

    // Smooth landing bob decay
    if (this.landingBob > 0) {
      this.landingBob = Math.max(0, this.landingBob - delta * 0.8);
    }

    // Camera follow (1st person vs 3rd person collision-aware)
    const eyeHeight = (this.isSneaking ? 1.35 : 1.62) - this.landingBob;
    const playerEyePos = new THREE.Vector3(this.position.x, this.position.y + eyeHeight, this.position.z);

    if (this.cameraMode === 1) {
      // Third-person collision-aware camera
      const camDist = this.thirdPersonDistance;
      const offsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * camDist;
      const offsetY = -Math.sin(this.pitch) * camDist + 0.3;
      const offsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * camDist;

      const targetCamPos = new THREE.Vector3(
        playerEyePos.x + offsetX,
        playerEyePos.y + offsetY,
        playerEyePos.z + offsetZ
      );

      // Prevent camera from clipping through blocks behind the player
      const safeCamPos = this.physics.raycastCamera(playerEyePos, targetCamPos, 0.25);
      this.camera.position.copy(safeCamPos);
    } else {
      // First-person directly at eye position with subtle head-bob
      if (this.onGround && moveDir.lengthSq() > 0) {
        this.headBobTimer += delta * (this.isSprinting ? 14.0 : 9.0);
        const bobOffset = Math.sin(this.headBobTimer) * 0.04;
        playerEyePos.y += bobOffset;
      }
      this.camera.position.copy(playerEyePos);
    }

    // Update 3D Character Model and Hand Visuals
    this.model.setEquippedItem(this.getSelectedItem());
    this.model.update(delta, this, this.cameraMode === 1);

    // Underwater camera tint / fog adjustment
    if (this.physics.isHeadInWater(this.position)) {
      if (this.world.scene.fog) {
        this.world.scene.fog.density = 0.08;
        this.world.scene.fog.color.setHex(0x1a457a);
      }
    } else {
      if (this.world.scene.fog) {
        this.world.scene.fog.density = 0.015;
      }
    }

    // Hunger & Health regeneration (Survival only)
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
          this.heal(1);
        } else if (this.hunger === 0) {
          this.takeDamage(1); // Starvation damage
        }
      }
    }

    // Block targeting & interactions
    this.interactions.update(delta, input);
  }
}
