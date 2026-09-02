import * as THREE from 'three';

export const WEATHER = {
  CLEAR: 'clear',
  RAIN: 'rain',
  STORM: 'storm',
};

export class SkyAndWeather {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    // Time of day: 0 = dawn, 6000 = noon, 12000 = dusk, 18000 = midnight (24000 = full day)
    this.time = 6000;
    this.dayDuration = 300; // seconds for a full 24h cycle
    this.weather = WEATHER.CLEAR;
    this.weatherTimer = 0;

    this.initLights();
    this.initStars();
    this.initCelestials();
    this.initRainParticles();
  }

  initLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    this.sunLight.position.set(50, 100, 50);
    this.scene.add(this.sunLight);

    // Fog
    this.fogColor = new THREE.Color(0x7cb5f7);
    this.scene.fog = new THREE.FogExp2(this.fogColor, 0.015);
    this.renderer.setClearColor(this.fogColor);
  }

  initCelestials() {
    // Sun mesh
    const sunGeo = new THREE.PlaneGeometry(16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffea78, side: THREE.DoubleSide });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sunMesh);

    // Moon mesh
    const moonGeo = new THREE.PlaneGeometry(12, 12);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe8ecf2, side: THREE.DoubleSide });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.scene.add(this.moonMesh);
  }

  initStars() {
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 250;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = Math.abs(r * Math.sin(phi) * Math.sin(theta)); // Keep in upper dome
      const z = r * Math.cos(phi);
      starPos.push(x, y, z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.0,
      transparent: true,
      opacity: 0.0,
    });
    this.starField = new THREE.Points(starGeo, this.starMaterial);
    this.scene.add(this.starField);
  }

  initRainParticles() {
    const count = 1200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainMaterial = new THREE.PointsMaterial({
      color: 0x90b8f0,
      size: 0.35,
      transparent: true,
      opacity: 0.7,
    });
    this.rainMesh = new THREE.Points(geo, this.rainMaterial);
    this.rainMesh.visible = false;
    this.scene.add(this.rainMesh);
  }

  setWeather(w) {
    this.weather = w;
    this.rainMesh.visible = (w === WEATHER.RAIN || w === WEATHER.STORM);
  }

  toggleWeather() {
    if (this.weather === WEATHER.CLEAR) this.setWeather(WEATHER.RAIN);
    else this.setWeather(WEATHER.CLEAR);
  }

  update(delta, playerPos) {
    // Advance time
    this.time = (this.time + (delta / this.dayDuration) * 24000) % 24000;

    // Time: 0 = sunrise, 6000 = midday noon, 12000 = sunset, 18000 = midnight
    const angle = (this.time / 24000) * Math.PI * 2;

    const sunDist = 200;
    const sunX = playerPos.x + Math.cos(angle) * sunDist;
    const sunY = playerPos.y + Math.sin(angle) * sunDist;
    const sunZ = playerPos.z + 20;

    const moonX = playerPos.x - Math.cos(angle) * sunDist;
    const moonY = playerPos.y - Math.sin(angle) * sunDist;
    const moonZ = playerPos.z - 20;

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.sunMesh.lookAt(playerPos.x, playerPos.y, playerPos.z);

    this.moonMesh.position.set(moonX, moonY, moonZ);
    this.moonMesh.lookAt(playerPos.x, playerPos.y, playerPos.z);

    this.starField.position.copy(playerPos);

    // Sun altitude factor: 1.0 at noon, 0 at sunrise/sunset, -1.0 at midnight
    const sunHeight = Math.sin(angle);

    // Light direction & intensities
    this.sunLight.position.set(sunX, sunY, sunZ);

    let skyColor = new THREE.Color(0x78b7ff);
    let ambientInt = 0.7;
    let sunInt = 1.2;

    if (sunHeight > 0.25) {
      // Full Vibrant Day
      skyColor.setHex(0x78b7ff);
      ambientInt = 0.7;
      sunInt = 1.2;
      this.starMaterial.opacity = 0.0;
    } else if (sunHeight > -0.15) {
      // Dawn / Dusk Golden Hour
      const t = (sunHeight + 0.15) / 0.4;
      const duskColor = new THREE.Color(0xf58249);
      const dayColor = new THREE.Color(0x78b7ff);
      skyColor.lerpColors(duskColor, dayColor, Math.max(0, Math.min(1, t)));
      ambientInt = THREE.MathUtils.lerp(0.25, 0.7, t);
      sunInt = THREE.MathUtils.lerp(0.2, 1.2, t);
      this.starMaterial.opacity = THREE.MathUtils.lerp(0.8, 0.0, t);
    } else {
      // Night
      skyColor.setHex(0x0c142b);
      ambientInt = 0.25;
      sunInt = 0.15;
      this.starMaterial.opacity = 0.85;
    }

    // Weather adjustments
    if (this.weather === WEATHER.RAIN || this.weather === WEATHER.STORM) {
      skyColor.setHex(0x3a4552);
      ambientInt *= 0.6;
      sunInt *= 0.4;

      // Animate rain drops
      this.rainMesh.position.set(playerPos.x, playerPos.y, playerPos.z);
      const positions = this.rainMesh.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= delta * 45;
        if (positions[i] < -10) positions[i] += 40;
      }
      this.rainMesh.geometry.attributes.position.needsUpdate = true;
    }

    this.ambientLight.intensity = ambientInt;
    this.sunLight.intensity = sunInt;
    this.scene.fog.color.copy(skyColor);
    this.renderer.setClearColor(skyColor);
  }
}
