import * as THREE from 'three';
import { audioManager } from '../core/AudioManager.js';

export const MOB_TYPES = {
  // Passive
  BOAR: 'boar',
  STAG: 'stag',
  RAM: 'ram',
  // Hostile
  SHADOW_STALKER: 'shadow_stalker',
  BONE_ARCHER: 'bone_archer',
  TOXIC_SPORE: 'toxic_spore',
};

export class Mob {
  constructor(game, type, x, y, z) {
    this.game = game;
    this.type = type;
    this.world = game.world;
    this.scene = game.scene;

    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationY = Math.random() * Math.PI * 2;

    this.state = 'idle'; // 'idle', 'wander', 'chase', 'attack'
    this.stateTimer = 1.0 + Math.random() * 2.0;
    this.isHostile = (type === MOB_TYPES.SHADOW_STALKER || type === MOB_TYPES.BONE_ARCHER || type === MOB_TYPES.TOXIC_SPORE);

    this.health = this.isHostile ? 14 : 10;
    this.maxHealth = this.health;
    this.walkSpeed = this.isHostile ? 3.8 : 2.0;
    this.attackRange = 1.6;
    this.attackDamage = 3;
    this.attackCooldown = 0;
    this.isDead = false;

    // Detonation for Toxic Spore
    this.fuse = 0;

    this.walkCycle = 0;
    this.hurtTimer = 0;

    this.initModel();
  }

  initModel() {
    this.group = new THREE.Group();

    const box = (w, h, d, color) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshLambertMaterial({ color });
      return new THREE.Mesh(geo, mat);
    };

    this.limbs = [];

    if (this.type === MOB_TYPES.BOAR) {
      // Body
      const body = box(0.9, 0.7, 1.2, 0xd07c72);
      body.position.y = 0.6;
      this.group.add(body);

      // Head & Snout
      const head = box(0.6, 0.6, 0.6, 0xc26c62);
      head.position.set(0, 0.9, 0.8);
      const snout = box(0.4, 0.3, 0.3, 0xe08d85);
      snout.position.set(0, -0.1, 0.4);
      head.add(snout);
      this.group.add(head);

      // 4 Legs
      for (const [lx, lz] of [[-0.35, 0.4], [0.35, 0.4], [-0.35, -0.4], [0.35, -0.4]]) {
        const leg = box(0.24, 0.5, 0.24, 0x8a4b44);
        leg.position.set(lx, 0.25, lz);
        this.group.add(leg);
        this.limbs.push(leg);
      }
    } else if (this.type === MOB_TYPES.STAG) {
      // Slender deer
      const body = box(0.7, 0.7, 1.3, 0x9b673c);
      body.position.y = 0.95;
      this.group.add(body);

      const head = box(0.45, 0.5, 0.5, 0x82542e);
      head.position.set(0, 1.5, 0.7);
      // Antlers
      const antlerL = box(0.08, 0.5, 0.08, 0xd9cbb8);
      antlerL.position.set(-0.2, 0.4, -0.1);
      head.add(antlerL);
      const antlerR = box(0.08, 0.5, 0.08, 0xd9cbb8);
      antlerR.position.set(0.2, 0.4, -0.1);
      head.add(antlerR);
      this.group.add(head);

      for (const [lx, lz] of [[-0.25, 0.45], [0.25, 0.45], [-0.25, -0.45], [0.25, -0.45]]) {
        const leg = box(0.18, 0.85, 0.18, 0x6e4321);
        leg.position.set(lx, 0.42, lz);
        this.group.add(leg);
        this.limbs.push(leg);
      }
    } else if (this.type === MOB_TYPES.RAM) {
      // Woolly Ram
      const body = box(1.0, 0.8, 1.3, 0xebe8dc); // Fluffy wool
      body.position.y = 0.75;
      this.group.add(body);

      const head = box(0.5, 0.5, 0.5, 0x2b2927); // Dark face
      head.position.set(0, 1.0, 0.8);
      this.group.add(head);

      for (const [lx, lz] of [[-0.35, 0.4], [0.35, 0.4], [-0.35, -0.4], [0.35, -0.4]]) {
        const leg = box(0.2, 0.55, 0.2, 0x4a4744);
        leg.position.set(lx, 0.27, lz);
        this.group.add(leg);
        this.limbs.push(leg);
      }
    } else if (this.type === MOB_TYPES.SHADOW_STALKER) {
      // Tall slender shadow humanoid
      const body = box(0.5, 1.2, 0.35, 0x1b1424);
      body.position.y = 1.3;
      this.group.add(body);

      const head = box(0.5, 0.5, 0.5, 0x100a17);
      head.position.set(0, 2.15, 0);
      // Glowing violet eyes
      const eyes = box(0.35, 0.08, 0.08, 0xb03aff);
      eyes.position.set(0, 0.05, 0.26);
      head.add(eyes);
      this.group.add(head);

      for (const lx of [-0.18, 0.18]) {
        const leg = box(0.2, 1.2, 0.2, 0x140e1c);
        leg.position.set(lx, 0.6, 0);
        this.group.add(leg);
        this.limbs.push(leg);
      }
    } else if (this.type === MOB_TYPES.TOXIC_SPORE) {
      // Explosive green creeper-like plant creature
      const body = box(0.65, 1.0, 0.65, 0x388e3c);
      body.position.y = 0.8;
      this.group.add(body);

      const head = box(0.7, 0.7, 0.7, 0x2e7d32);
      head.position.set(0, 1.6, 0);
      this.group.add(head);

      for (const [lx, lz] of [[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]]) {
        const leg = box(0.22, 0.45, 0.22, 0x1b5e20);
        leg.position.set(lx, 0.22, lz);
        this.group.add(leg);
        this.limbs.push(leg);
      }
    } else {
      // Default Bone Archer
      const body = box(0.5, 0.9, 0.3, 0xd4d0c8);
      body.position.y = 1.1;
      this.group.add(body);

      const head = box(0.45, 0.45, 0.45, 0xbcb7ad);
      head.position.set(0, 1.8, 0);
      this.group.add(head);

      for (const lx of [-0.16, 0.16]) {
        const leg = box(0.18, 0.9, 0.18, 0xaba59b);
        leg.position.set(lx, 0.45, 0);
        this.group.add(leg);
        this.limbs.push(leg);
      }
    }

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  takeDamage(amount, knockbackDir) {
    this.health -= amount;
    this.hurtTimer = 0.2;
    audioManager.playHurt();

    // Knockback
    if (knockbackDir) {
      this.velocity.x += knockbackDir.x * 6;
      this.velocity.y += 3.5;
      this.velocity.z += knockbackDir.z * 6;
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    // Spawn drops
    if (this.type === MOB_TYPES.BOAR) {
      this.game.spawnDroppedItem(this.position.x, this.position.y + 0.5, this.position.z, 'raw_meat', 2);
    } else if (this.type === MOB_TYPES.STAG) {
      this.game.spawnDroppedItem(this.position.x, this.position.y + 0.5, this.position.z, 'raw_meat', 3);
    } else if (this.type === MOB_TYPES.SHADOW_STALKER) {
      this.game.spawnDroppedItem(this.position.x, this.position.y + 0.5, this.position.z, 'coal', 2);
      this.game.player.addXP(5);
    } else if (this.type === MOB_TYPES.BONE_ARCHER) {
      this.game.spawnDroppedItem(this.position.x, this.position.y + 0.5, this.position.z, 'stick', 2);
      this.game.player.addXP(4);
    } else if (this.type === MOB_TYPES.TOXIC_SPORE) {
      this.game.player.addXP(5);
    }

    this.dispose();
  }

  update(delta, player) {
    if (this.isDead) return;

    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // Hurt flash visual
    if (this.hurtTimer > 0) {
      this.hurtTimer -= delta;
      this.group.traverse((c) => {
        if (c.material && c.material.color) c.material.color.setHex(0xff2222);
      });
    }

    const distToPlayer = this.position.distanceTo(player.position);

    // AI Decision Tree
    if (this.isHostile && distToPlayer < 16.0) {
      this.state = 'chase';
    } else {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) {
        this.state = Math.random() < 0.4 ? 'idle' : 'wander';
        this.stateTimer = 1.5 + Math.random() * 3.0;
        if (this.state === 'wander') {
          this.rotationY += (Math.random() - 0.5) * Math.PI;
        }
      }
    }

    // AI Actions
    if (this.state === 'chase') {
      const dir = player.position.clone().sub(this.position).normalize();
      this.rotationY = Math.atan2(dir.x, dir.z);
      this.velocity.x = Math.sin(this.rotationY) * this.walkSpeed;
      this.velocity.z = Math.cos(this.rotationY) * this.walkSpeed;

      // Toxic Spore explosive behavior
      if (this.type === MOB_TYPES.TOXIC_SPORE && distToPlayer < 2.5) {
        this.fuse += delta;
        if (this.fuse > 1.4) {
          // Detonate!
          audioManager.playExplosion();
          player.takeDamage(8);
          this.die();
          return;
        }
      } else if (this.type === MOB_TYPES.TOXIC_SPORE) {
        this.fuse = Math.max(0, this.fuse - delta);
      }

      // Melee attack
      if (distToPlayer < this.attackRange && this.attackCooldown <= 0) {
        player.takeDamage(this.attackDamage);
        this.attackCooldown = 1.2;
      }
    } else if (this.state === 'wander') {
      this.velocity.x = Math.sin(this.rotationY) * this.walkSpeed;
      this.velocity.z = Math.cos(this.rotationY) * this.walkSpeed;
    } else {
      this.velocity.x *= 0.6;
      this.velocity.z *= 0.6;
    }

    // Gravity & Ground collision
    this.velocity.y -= 22.0 * delta;
    this.velocity.y = Math.max(this.velocity.y, -30.0);

    const nextY = this.position.y + this.velocity.y * delta;
    const blockBelow = this.world.getBlock(Math.floor(this.position.x), Math.floor(nextY), Math.floor(this.position.z));
    if (blockBelow !== 0) {
      this.position.y = Math.floor(nextY) + 1.0;
      this.velocity.y = 0;
    } else {
      this.position.y = nextY;
    }

    // Auto-jump over 1 block obstacles while moving
    const forwardX = this.position.x + Math.sin(this.rotationY) * 0.6;
    const forwardZ = this.position.z + Math.cos(this.rotationY) * 0.6;
    const obstacle = this.world.getBlock(Math.floor(forwardX), Math.floor(this.position.y + 0.4), Math.floor(forwardZ));
    if (obstacle !== 0 && this.velocity.y === 0) {
      this.velocity.y = 6.5; // Jump
    }

    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Limb walking animation
    const speedSq = this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z;
    if (speedSq > 0.05) {
      this.walkCycle += delta * 8.0;
      this.limbs.forEach((leg, idx) => {
        const sign = idx % 2 === 0 ? 1 : -1;
        leg.rotation.x = Math.sin(this.walkCycle) * 0.45 * sign;
      });
    } else {
      this.limbs.forEach((leg) => { leg.rotation.x = 0; });
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;
  }

  dispose() {
    if (this.group) {
      this.scene.remove(this.group);
      this.group.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
      });
      this.group = null;
    }
  }
}

export class MobManager {
  constructor(game) {
    this.game = game;
    this.mobs = [];
    this.spawnTimer = 0;
    this.maxMobs = 18;
  }

  spawnMob(type, x, y, z) {
    const mob = new Mob(this.game, type, x, y, z);
    this.mobs.push(mob);
    return mob;
  }

  update(delta, player) {
    // 1. Update active mobs
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];
      if (mob.isDead) {
        this.mobs.splice(i, 1);
        continue;
      }
      mob.update(delta, player);

      // Despawn distant mobs (> 60 blocks from player)
      if (mob.position.distanceTo(player.position) > 60.0) {
        mob.dispose();
        this.mobs.splice(i, 1);
      }
    }

    // 2. Periodic natural spawning
    this.spawnTimer += delta;
    if (this.spawnTimer > 4.0 && this.mobs.length < this.maxMobs) {
      this.spawnTimer = 0;
      this.trySpawnAroundPlayer(player);
    }
  }

  trySpawnAroundPlayer(player) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 18 + Math.random() * 22; // Spawn 18 to 40 blocks away
    const sx = Math.floor(player.position.x + Math.cos(angle) * dist);
    const sz = Math.floor(player.position.z + Math.sin(angle) * dist);

    const { height } = this.game.world.generator.getTerrainData(sx, sz);
    if (height < 25) return; // Don't spawn underwater

    const isNight = (this.game.sky.time > 13000 || this.game.sky.time < 23000);

    let type;
    if (isNight) {
      const hostiles = [MOB_TYPES.SHADOW_STALKER, MOB_TYPES.BONE_ARCHER, MOB_TYPES.TOXIC_SPORE];
      type = hostiles[Math.floor(Math.random() * hostiles.length)];
    } else {
      const passives = [MOB_TYPES.BOAR, MOB_TYPES.STAG, MOB_TYPES.RAM];
      type = passives[Math.floor(Math.random() * passives.length)];
    }

    this.spawnMob(type, sx + 0.5, height + 1.2, sz + 0.5);
  }

  clearAll() {
    for (const mob of this.mobs) {
      mob.dispose();
    }
    this.mobs = [];
  }
}
