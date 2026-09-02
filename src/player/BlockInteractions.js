import * as THREE from 'three';
import { BLOCK, blockRegistry } from '../blocks/BlockRegistry.js';
import { itemRegistry } from '../items/ItemRegistry.js';
import { audioManager } from '../core/AudioManager.js';

export class BlockInteractions {
  constructor(game, world, scene, player) {
    this.game = game;
    this.world = world;
    this.scene = scene;
    this.player = player;

    this.target = null;
    this.breakProgress = 0; // 0 to 1
    this.breakingBlock = null;
    this.hitSoundTimer = 0;
    this.swingTimer = 0;
    this.creativeBreakCooldown = 0;

    this.initSelectionBox();
    this.initCrackOverlay();
  }

  initSelectionBox() {
    const geo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.selectionBox = new THREE.LineSegments(edges, mat);
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);
  }

  initCrackOverlay() {
    const geo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      depthTest: true,
    });
    this.crackMesh = new THREE.Mesh(geo, mat);
    this.crackMesh.visible = false;
    this.scene.add(this.crackMesh);
  }

  update(delta, input) {
    if (this.creativeBreakCooldown > 0) {
      this.creativeBreakCooldown -= delta;
    }

    // 1. Raycast from player camera
    const origin = this.player.camera.position.clone();
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.camera.quaternion);

    const hit = this.player.physics.raycast(origin, dir, 5.0);
    this.target = hit;

    if (hit.hit) {
      this.targetedBlockDef = blockRegistry.get(hit.blockId);
      this.selectionBox.position.set(hit.blockX + 0.5, hit.blockY + 0.5, hit.blockZ + 0.5);
      this.selectionBox.visible = true;

      // Handle mining (Left Click hold)
      if (input.mouseButtons.left) {
        this.handleMining(hit, delta);
      } else {
        this.resetMining();
      }

      // Handle block placement / interaction (Right Click)
      if (input.consumeRightClick()) {
        this.handleUseOrPlace(hit);
      }
    } else {
      this.target = null;
      this.targetedBlockDef = null;
      this.selectionBox.visible = false;
      this.resetMining();
    }
  }

  resetMining() {
    this.breakProgress = 0;
    this.breakingBlock = null;
    this.crackMesh.visible = false;
    this.hitSoundTimer = 0;
    this.swingTimer = 0;
  }

  handleMining(hit, delta) {
    const blockDef = blockRegistry.get(hit.blockId);
    if (blockDef.hardness < 0) return; // Bedrock is unbreakable

    // Creative mode: Instant Break with controlled 0.22s cooldown per block
    if (this.player.gameMode === 'creative') {
      if (this.creativeBreakCooldown <= 0) {
        this.creativeBreakCooldown = 0.22;
        this.player.model.triggerSwing();
        this.breakBlock(hit, blockDef, false);
        this.resetMining();
      }
      return;
    }

    const blockKey = `${hit.blockX},${hit.blockY},${hit.blockZ}`;
    if (this.breakingBlock !== blockKey) {
      this.breakingBlock = blockKey;
      this.breakProgress = 0;
      this.hitSoundTimer = 0;
      this.swingTimer = 0;
    }

    const selectedItem = this.player.getSelectedItem();
    let speedMultiplier = 1.0;
    let canHarvest = true;

    if (selectedItem) {
      const itemDef = itemRegistry.get(selectedItem.id);
      if (itemDef && itemDef.toolType && itemDef.toolType === blockDef.toolType) {
        speedMultiplier = itemDef.toolSpeed;
        if (blockDef.toolLevel && itemDef.toolLevel < blockDef.toolLevel) {
          canHarvest = false;
        }
      } else {
        // Wrong tool penalty (e.g. mining stone with wood axe)
        speedMultiplier = 0.5;
        if (blockDef.toolType === 'pickaxe') {
          canHarvest = false;
        }
      }
    } else {
      // Bare hands penalty on stone and ores
      if (blockDef.toolType === 'pickaxe') {
        speedMultiplier = 0.35;
        canHarvest = false;
      }
    }

    // Realistic physics-based break time calculation:
    // Dirt: ~0.9s bare hands, ~0.25s with shovel
    // Wood logs: ~2.8s bare hands, ~1.4s wooden axe, ~0.7s stone axe
    // Stone: ~6.5s bare hands (no drop), ~1.6s wooden pickaxe, ~0.8s stone pickaxe
    const baseMultiplier = (blockDef.toolType === 'pickaxe' && (!selectedItem || itemRegistry.get(selectedItem.id)?.toolType !== 'pickaxe')) ? 2.2 : 1.5;
    const breakTime = Math.max(0.2, (blockDef.hardness * baseMultiplier) / speedMultiplier);

    this.breakProgress += delta / breakTime;

    // Rhythmic visual arm/tool swing every 0.32 seconds
    this.swingTimer -= delta;
    if (this.swingTimer <= 0) {
      this.swingTimer = 0.32;
      this.player.model.triggerSwing();
    }

    // Progressive cracking overlay
    this.crackMesh.position.set(hit.blockX + 0.5, hit.blockY + 0.5, hit.blockZ + 0.5);
    this.crackMesh.visible = true;
    this.crackMesh.material.opacity = Math.min(0.85, Math.max(0.15, this.breakProgress * 0.9));

    // Rhythmic chipping sounds every 0.28 seconds
    this.hitSoundTimer -= delta;
    if (this.hitSoundTimer <= 0) {
      this.hitSoundTimer = 0.28;
      audioManager.playBreak(blockDef.sound);
    }

    if (this.breakProgress >= 1.0) {
      // Block broken!
      this.breakBlock(hit, blockDef, canHarvest);
      this.resetMining();
    }
  }

  breakBlock(hit, blockDef, canHarvest) {
    audioManager.playBreak(blockDef.sound);

    // Remove block from world
    this.world.setBlock(hit.blockX, hit.blockY, hit.blockZ, BLOCK.AIR);

    // Spawn item drops if harvestable (Survival only)
    if (this.player.gameMode !== 'creative' && canHarvest && blockDef.drops) {
      for (const drop of blockDef.drops) {
        if (drop.chance && Math.random() > drop.chance) continue;
        const count = drop.min ? Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min : (drop.count || 1);
        this.game.spawnDroppedItem(
          hit.blockX + 0.5,
          hit.blockY + 0.5,
          hit.blockZ + 0.5,
          drop.id,
          count
        );
      }
    }

    // Award XP if ore (Survival only)
    if (this.player.gameMode !== 'creative') {
      if (hit.blockId === BLOCK.COAL_ORE) this.player.addXP(1);
      else if (hit.blockId === BLOCK.IRON_ORE || hit.blockId === BLOCK.COPPER_ORE) this.player.addXP(2);
      else if (hit.blockId === BLOCK.GOLD_ORE) this.player.addXP(3);
      else if (hit.blockId === BLOCK.GEM_ORE) this.player.addXP(7);
    }

    // Reduce tool durability if tool was used (Survival only)
    if (this.player.gameMode !== 'creative') {
      const selectedItem = this.player.getSelectedItem();
      if (selectedItem) {
        const itemDef = itemRegistry.get(selectedItem.id);
        if (itemDef && itemDef.maxDurability) {
          selectedItem.durability = (selectedItem.durability || itemDef.maxDurability) - 1;
          if (selectedItem.durability <= 0) {
            // Tool broke!
            this.player.consumeSelectedItem();
            audioManager.playBreak('glass');
            this.game.ui.showNotification(`Your ${itemDef.name} broke!`);
          }
        }
      }
    }
  }

  handleUseOrPlace(hit) {
    const selectedItem = this.player.getSelectedItem();
    const itemDef = selectedItem ? itemRegistry.get(selectedItem.id) : null;

    // 1. Interactive Block Clicks
    if (hit.blockId === BLOCK.CRAFTING_TABLE) {
      this.game.openCraftingTable();
      return;
    }

    if (hit.blockId === BLOCK.FURNACE || hit.blockId === BLOCK.FURNACE_ACTIVE) {
      this.game.openFurnace(hit.blockX, hit.blockY, hit.blockZ);
      return;
    }

    if (hit.blockId === BLOCK.CHEST) {
      this.game.openChest(hit.blockX, hit.blockY, hit.blockZ);
      return;
    }

    if (hit.blockId === BLOCK.BED) {
      this.player.setSpawnPoint(hit.blockX + 0.5, hit.blockY + 1.2, hit.blockZ + 0.5);
      if (this.game.sky.time > 12500 || this.game.sky.time < 23500) {
        this.game.sky.time = 0; // Morning!
        this.game.ui.showNotification('Respawn point set. Good morning!');
      } else {
        this.game.ui.showNotification('Respawn point set.');
      }
      return;
    }

    // Wooden Door Open / Close Toggle
    if (hit.blockId === BLOCK.WOOD_DOOR || hit.blockId === BLOCK.WOOD_DOOR_CLOSED) {
      this.world.setBlock(hit.blockX, hit.blockY, hit.blockZ, BLOCK.WOOD_DOOR_OPEN);
      audioManager.playBreak('wood');
      return;
    }
    if (hit.blockId === BLOCK.WOOD_DOOR_OPEN) {
      this.world.setBlock(hit.blockX, hit.blockY, hit.blockZ, BLOCK.WOOD_DOOR_CLOSED);
      audioManager.playBreak('wood');
      return;
    }

    // 2. Hoe Tilling (Grass/Dirt -> Farmland)
    if (itemDef && itemDef.toolType === 'hoe') {
      if (hit.blockId === BLOCK.GRASS || hit.blockId === BLOCK.DIRT) {
        this.world.setBlock(hit.blockX, hit.blockY, hit.blockZ, BLOCK.FARMLAND);
        audioManager.playBreak('dirt');
        this.player.model.triggerSwing();
        return;
      }
    }

    // 3. Planting Seeds on Farmland
    if (selectedItem && selectedItem.id === 'seeds_wheat') {
      if (hit.blockId === BLOCK.FARMLAND || hit.blockId === BLOCK.FARMLAND_WET) {
        const aboveY = hit.blockY + 1;
        if (this.world.getBlock(hit.blockX, aboveY, hit.blockZ) === BLOCK.AIR) {
          this.world.setBlock(hit.blockX, aboveY, hit.blockZ, BLOCK.CROPS_WHEAT_0);
          if (this.player.gameMode !== 'creative') {
            this.player.consumeSelectedItem();
          }
          this.player.model.triggerSwing();
          audioManager.playPlace('grass');
          return;
        }
      }
    }

    // 4. Food eating
    if (itemDef && itemDef.isFood) {
      if (this.player.gameMode === 'creative' || this.player.hunger < 20) {
        this.player.eatFood(itemDef.nutrition);
        if (this.player.gameMode !== 'creative') {
          this.player.consumeSelectedItem();
        }
        audioManager.playEat();
        return;
      }
    }

    // 5. Place Block
    if (itemDef && itemDef.isBlock) {
      const px = hit.placeX;
      const py = hit.placeY;
      const pz = hit.placeZ;

      // Prevent placing inside player's bounding box
      const playerBox = this.player.physics.getPlayerAABB(this.player.position);
      const newBlockBox = new THREE.Box3(
        new THREE.Vector3(px, py, pz),
        new THREE.Vector3(px + 1, py + 1, pz + 1)
      );

      const placeBlockDef = blockRegistry.get(itemDef.blockId);
      if (placeBlockDef.solid && playerBox.intersectsBox(newBlockBox)) {
        return; // Collision with player body
      }

      this.world.setBlock(px, py, pz, itemDef.blockId);
      if (this.player.gameMode !== 'creative') {
        this.player.consumeSelectedItem();
      }
      this.player.model.triggerSwing();
      audioManager.playPlace(placeBlockDef.sound);
    }
  }
}
