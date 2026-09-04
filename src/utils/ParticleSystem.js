import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.maxParticles = 800;
    this.particles = [];
    this.activeCount = 0;

    // Pre-allocate geometry and instanced mesh for maximum performance (0 GC allocation per frame)
    this.geometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });

    this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxParticles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.frustumCulled = false;

    // Instance colors
    this.colorsArray = new Float32Array(this.maxParticles * 3);
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(this.colorsArray, 3);
    this.instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

    this.scene.add(this.instancedMesh);

    // Dummy helper object for computing matrix transformations
    this.dummy = new THREE.Object3D();
    this.colorHelper = new THREE.Color();

    // Pool data array
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        size: 0.08,
        r: 1,
        g: 1,
        b: 1,
        life: 0,
        maxLife: 1,
        gravity: 9.8,
      });

      // Hide off-screen initially
      this.dummy.position.set(0, -9999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  emit(options) {
    const {
      x = 0,
      y = 0,
      z = 0,
      count = 1,
      spread = 0.2,
      speed = 2.0,
      upBias = 1.0,
      color = 0xffffff,
      size = 0.08,
      life = 0.6,
      gravity = 9.8,
    } = options;

    this.colorHelper.set(color);

    for (let c = 0; c < count; c++) {
      // Find inactive particle in pool
      let p = null;
      for (let i = 0; i < this.maxParticles; i++) {
        if (!this.particles[i].active) {
          p = this.particles[i];
          p.index = i;
          break;
        }
      }

      // If pool is full, replace oldest
      if (!p) {
        p = this.particles[0];
        p.index = 0;
      }

      p.active = true;
      p.x = x + (Math.random() - 0.5) * spread;
      p.y = y + (Math.random() - 0.5) * spread;
      p.z = z + (Math.random() - 0.5) * spread;

      const angle = Math.random() * Math.PI * 2;
      const horizontalSpeed = (Math.random() * 0.7 + 0.3) * speed;
      p.vx = Math.cos(angle) * horizontalSpeed;
      p.vz = Math.sin(angle) * horizontalSpeed;
      p.vy = (Math.random() * 0.8 + 0.2) * speed * upBias;

      p.size = size * (Math.random() * 0.5 + 0.75);
      p.r = this.colorHelper.r;
      p.g = this.colorHelper.g;
      p.b = this.colorHelper.b;
      p.life = 0;
      p.maxLife = life * (Math.random() * 0.4 + 0.8);
      p.gravity = gravity;

      this.instancedMesh.setColorAt(p.index, this.colorHelper);
    }

    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  emitBlockBreak(x, y, z, color = 0x825532, count = 18) {
    this.emit({
      x: x + 0.5,
      y: y + 0.5,
      z: z + 0.5,
      count,
      spread: 0.6,
      speed: 3.2,
      upBias: 1.2,
      color,
      size: 0.09,
      life: 0.65,
      gravity: 12.0,
    });
  }

  emitBlockHit(x, y, z, color = 0x825532, count = 4) {
    this.emit({
      x: x + 0.5,
      y: y + 0.5,
      z: z + 0.5,
      count,
      spread: 0.3,
      speed: 1.8,
      upBias: 0.9,
      color,
      size: 0.06,
      life: 0.4,
      gravity: 10.0,
    });
  }

  emitBlockPlace(x, y, z, color = 0xa8804e, count = 10) {
    this.emit({
      x: x + 0.5,
      y: y + 0.1,
      z: z + 0.5,
      count,
      spread: 0.4,
      speed: 1.5,
      upBias: 0.6,
      color,
      size: 0.07,
      life: 0.45,
      gravity: 6.0,
    });
  }

  emitFootstep(x, y, z, color = 0x55a52d, count = 3) {
    this.emit({
      x,
      y: y + 0.05,
      z,
      count,
      spread: 0.25,
      speed: 0.9,
      upBias: 0.4,
      color,
      size: 0.05,
      life: 0.3,
      gravity: 5.0,
    });
  }

  emitItemPickup(x, y, z, count = 8) {
    this.emit({
      x,
      y: y + 0.2,
      z,
      count,
      spread: 0.3,
      speed: 1.6,
      upBias: 1.4,
      color: 0x00e5ff,
      size: 0.07,
      life: 0.5,
      gravity: -1.0, // Float upward
    });
  }

  emitWaterSplash(x, y, z, count = 14) {
    this.emit({
      x,
      y: y + 0.1,
      z,
      count,
      spread: 0.4,
      speed: 2.2,
      upBias: 1.5,
      color: 0x4fc3f7,
      size: 0.08,
      life: 0.55,
      gravity: 9.8,
    });
  }

  emitDamage(x, y, z, count = 12) {
    this.emit({
      x,
      y: y + 0.5,
      z,
      count,
      spread: 0.35,
      speed: 2.5,
      upBias: 1.0,
      color: 0xff2222,
      size: 0.08,
      life: 0.5,
      gravity: 8.0,
    });
  }

  update(delta) {
    let needsMatrixUpdate = false;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += delta;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.dummy.position.set(0, -9999, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        needsMatrixUpdate = true;
        continue;
      }

      // Physics update
      p.vy -= p.gravity * delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;

      // Scale down with age
      const progress = p.life / p.maxLife;
      const currentScale = p.size * (1.0 - progress * 0.8);

      this.dummy.position.set(p.x, p.y, p.z);
      this.dummy.scale.set(currentScale, currentScale, currentScale);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      needsMatrixUpdate = true;
    }

    if (needsMatrixUpdate) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }

  dispose() {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.instancedMesh && this.scene) {
      this.scene.remove(this.instancedMesh);
    }
  }
}
