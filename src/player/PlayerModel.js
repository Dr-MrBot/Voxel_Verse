import * as THREE from 'three';
import { itemRegistry } from '../items/ItemRegistry.js';
import { textureAtlas } from '../blocks/TextureAtlas.js';

export class PlayerModel {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.walkCycle = 0;
    this.swingProgress = 0;
    this.isSwinging = false;
    this.hurtTimer = 0;

    this.initThirdPersonModel();
    this.initFirstPersonHand();
  }

  initThirdPersonModel() {
    this.root = new THREE.Group();

    const makeBox = (w, h, d, color) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshLambertMaterial({ color });
      return new THREE.Mesh(geo, mat);
    };

    // 1. Torso (Blue adventurer tunic)
    this.torso = makeBox(0.6, 0.75, 0.35, 0x1e88e5);
    this.torso.position.y = 1.05;
    this.root.add(this.torso);

    // Belt
    const belt = makeBox(0.62, 0.12, 0.37, 0x5d4037);
    belt.position.y = -0.3;
    this.torso.add(belt);

    // 2. Head
    this.head = makeBox(0.5, 0.5, 0.5, 0xffcc80); // Skin
    this.head.position.set(0, 1.68, 0);
    // Hair
    const hair = makeBox(0.52, 0.2, 0.52, 0x4e342e);
    hair.position.set(0, 0.2, 0);
    this.head.add(hair);
    // Eyes
    const eyeL = makeBox(0.08, 0.08, 0.04, 0x1a237e);
    eyeL.position.set(-0.12, 0.02, 0.26);
    this.head.add(eyeL);
    const eyeR = makeBox(0.08, 0.08, 0.04, 0x1a237e);
    eyeR.position.set(0.12, 0.02, 0.26);
    this.head.add(eyeR);
    this.root.add(this.head);

    // 3. Left Arm
    this.armLeftGroup = new THREE.Group();
    this.armLeftGroup.position.set(-0.42, 1.4, 0);
    const armL = makeBox(0.24, 0.72, 0.24, 0x1e88e5);
    armL.position.y = -0.32;
    this.armLeftGroup.add(armL);
    this.root.add(this.armLeftGroup);

    // 4. Right Arm (Tool-holding arm)
    this.armRightGroup = new THREE.Group();
    this.armRightGroup.position.set(0.42, 1.4, 0);
    const armR = makeBox(0.24, 0.72, 0.24, 0x1e88e5);
    armR.position.y = -0.32;
    this.armRightGroup.add(armR);

    // Tool Anchor attached to right hand
    this.toolAnchor = new THREE.Group();
    this.toolAnchor.position.set(0, -0.65, 0.2);
    this.toolAnchor.rotation.x = Math.PI / 4;
    this.armRightGroup.add(this.toolAnchor);

    this.root.add(this.armRightGroup);

    // 5. Legs
    this.legLeft = makeBox(0.26, 0.75, 0.26, 0x37474f); // Dark pants
    this.legLeft.position.set(-0.16, 0.38, 0);
    this.root.add(this.legLeft);

    this.legRight = makeBox(0.26, 0.75, 0.26, 0x37474f);
    this.legRight.position.set(0.16, 0.38, 0);
    this.root.add(this.legRight);

    this.scene.add(this.root);
  }

  initFirstPersonHand() {
    // Hand and held tool attached directly to camera view
    this.fpGroup = new THREE.Group();

    // Right hand
    const handGeo = new THREE.BoxGeometry(0.16, 0.35, 0.16);
    const handMat = new THREE.MeshLambertMaterial({ color: 0xffcc80 });
    this.fpHand = new THREE.Mesh(handGeo, handMat);
    this.fpHand.position.set(0.35, -0.28, -0.45);
    this.fpHand.rotation.set(-0.35, -0.2, 0.3);
    this.fpGroup.add(this.fpHand);

    // Held item mesh in first-person
    this.fpToolAnchor = new THREE.Group();
    this.fpToolAnchor.position.set(0, 0.12, -0.1);
    this.fpToolAnchor.rotation.set(0.3, -0.2, -0.4);
    this.fpHand.add(this.fpToolAnchor);

    this.camera.add(this.fpGroup);
  }

  setEquippedItem(item) {
    // Update both 3rd person and 1st person tool visuals
    this.updateToolMesh(this.toolAnchor, item, false);
    this.updateToolMesh(this.fpToolAnchor, item, true);
  }

  updateToolMesh(anchor, item, isFP) {
    // Clear old tool mesh
    while (anchor.children.length > 0) {
      const child = anchor.children[0];
      anchor.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    if (!item) return;

    const itemDef = itemRegistry.get(item.id);
    if (!itemDef) return;

    const scale = isFP ? 1.0 : 0.8;

    if (itemDef.isBlock) {
      // Mini-block held in hand
      const geo = new THREE.BoxGeometry(0.22 * scale, 0.22 * scale, 0.22 * scale);
      const mat = new THREE.MeshLambertMaterial({
        map: textureAtlas.texture,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      anchor.add(mesh);
    } else {
      // Tool model (Handle + Head)
      const toolGroup = new THREE.Group();

      // Wooden stick handle
      const handleGeo = new THREE.BoxGeometry(0.04 * scale, 0.48 * scale, 0.04 * scale);
      const handleMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.y = 0.15 * scale;
      toolGroup.add(handle);

      // Tool Head
      const headColor = itemDef.color || 0xcccccc;
      const headMat = new THREE.MeshLambertMaterial({ color: headColor });

      if (itemDef.toolType === 'pickaxe') {
        const headGeo = new THREE.BoxGeometry(0.34 * scale, 0.08 * scale, 0.06 * scale);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.36 * scale;
        toolGroup.add(head);
      } else if (itemDef.toolType === 'axe') {
        const headGeo = new THREE.BoxGeometry(0.2 * scale, 0.16 * scale, 0.06 * scale);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0.08 * scale, 0.32 * scale, 0);
        toolGroup.add(head);
      } else if (itemDef.toolType === 'sword') {
        const bladeGeo = new THREE.BoxGeometry(0.08 * scale, 0.45 * scale, 0.04 * scale);
        const blade = new THREE.Mesh(bladeGeo, headMat);
        blade.position.y = 0.45 * scale;
        toolGroup.add(blade);
        const guardGeo = new THREE.BoxGeometry(0.22 * scale, 0.05 * scale, 0.05 * scale);
        const guard = new THREE.Mesh(guardGeo, headMat);
        guard.position.y = 0.22 * scale;
        toolGroup.add(guard);
      } else {
        // Shovel or generic
        const headGeo = new THREE.BoxGeometry(0.14 * scale, 0.18 * scale, 0.04 * scale);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.36 * scale;
        toolGroup.add(head);
      }

      anchor.add(toolGroup);
    }
  }

  triggerSwing() {
    this.isSwinging = true;
    this.swingProgress = 0;
  }

  update(delta, player, isThirdPerson) {
    // Visibility
    this.root.visible = isThirdPerson;
    this.fpGroup.visible = !isThirdPerson;

    // Third person model placement
    this.root.position.copy(player.position);
    this.root.rotation.y = player.yaw;

    // Head pitch in third-person
    this.head.rotation.x = player.pitch * 0.7;

    // Movement speeds
    const horizontalVel = new THREE.Vector2(player.velocity.x, player.velocity.z);
    const speed = horizontalVel.length();
    const isMoving = speed > 0.15;

    // Walk & Run limb animation
    if (isMoving && player.onGround) {
      const animSpeed = player.isSprinting ? 14.0 : 8.5;
      this.walkCycle += delta * animSpeed;
      const angle = Math.sin(this.walkCycle) * (player.isSprinting ? 0.65 : 0.45);

      this.legLeft.rotation.x = angle;
      this.legRight.rotation.x = -angle;

      if (!this.isSwinging) {
        this.armLeftGroup.rotation.x = -angle;
        this.armRightGroup.rotation.x = angle * 0.5;
      }
    } else {
      // Idle breathing
      const idleBob = Math.sin(performance.now() * 0.003) * 0.05;
      this.torso.position.y = 1.05 + idleBob;
      this.head.position.y = 1.68 + idleBob;
      this.legLeft.rotation.x = 0;
      this.legRight.rotation.x = 0;
      if (!this.isSwinging) {
        this.armLeftGroup.rotation.x = 0;
        this.armRightGroup.rotation.x = 0;
      }
    }

    // Jump pose
    if (!player.onGround && !player.inWater) {
      this.legLeft.rotation.x = 0.35;
      this.legRight.rotation.x = -0.25;
      if (!this.isSwinging) {
        this.armLeftGroup.rotation.x = -0.6;
        this.armRightGroup.rotation.x = -0.6;
      }
    }

    // Swing animation (Mining / Attacking)
    if (this.isSwinging) {
      this.swingProgress += delta * 7.5;
      const swingAngle = Math.sin(this.swingProgress * Math.PI) * 1.2;

      // 3rd person arm swing
      this.armRightGroup.rotation.x = -swingAngle;

      // 1st person hand & tool swing
      this.fpHand.position.z = -0.45 + Math.sin(this.swingProgress * Math.PI) * 0.15;
      this.fpHand.rotation.x = -0.35 - swingAngle * 0.8;
      this.fpHand.rotation.z = 0.3 + swingAngle * 0.4;

      if (this.swingProgress >= 1.0) {
        this.isSwinging = false;
        this.swingProgress = 0;
        this.fpHand.position.set(0.35, -0.28, -0.45);
        this.fpHand.rotation.set(-0.35, -0.2, 0.3);
      }
    } else if (isMoving && player.onGround) {
      // 1st person walking bob
      const bobX = Math.cos(this.walkCycle * 0.5) * 0.02;
      const bobY = Math.sin(this.walkCycle) * 0.02;
      this.fpHand.position.set(0.35 + bobX, -0.28 + bobY, -0.45);
    }

    // Damage hit flash
    if (this.hurtTimer > 0) {
      this.hurtTimer -= delta;
      this.root.traverse((child) => {
        if (child.material && child.material.color) {
          child.material.color.setHex(0xff3333);
        }
      });
    }
  }

  flashHurt() {
    this.hurtTimer = 0.2;
  }

  dispose() {
    if (this.root) {
      this.scene.remove(this.root);
      this.root.traverse((c) => { if (c.geometry) c.geometry.dispose(); });
      this.root = null;
    }
    if (this.fpGroup) {
      this.camera.remove(this.fpGroup);
      this.fpGroup.traverse((c) => { if (c.geometry) c.geometry.dispose(); });
      this.fpGroup = null;
    }
  }
}
