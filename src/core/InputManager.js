export class InputManager {
  constructor(domElement) {
    this.domElement = domElement;

    this.keys = new Map();
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseButtons = { left: false, right: false, middle: false };
    this.mouseClicks = { left: false, right: false };
    this.wheelDelta = 0;

    this.isPointerLocked = false;
    this.sensitivity = 0.0022;
    this.invertY = false;

    // Keybindings
    this.bindings = {
      forward: ['KeyW', 'ArrowUp'],
      backward: ['KeyS', 'ArrowDown'],
      left: ['KeyA', 'ArrowLeft'],
      right: ['KeyD', 'ArrowRight'],
      jump: ['Space'],
      sprint: ['ShiftLeft', 'ControlLeft'],
      sneak: ['ShiftLeft'],
      inventory: ['KeyE'],
      pause: ['Escape'],
      chat: ['KeyT'],
      drop: ['KeyQ'],
    };

    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouseDelta.x += e.movementX;
        this.mouseDelta.y += (this.invertY ? -1 : 1) * e.movementY;
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked) return;
      if (e.button === 0) {
        this.mouseButtons.left = true;
        this.mouseClicks.left = true;
      } else if (e.button === 2) {
        this.mouseButtons.right = true;
        this.mouseClicks.right = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseButtons.left = false;
      if (e.button === 2) this.mouseButtons.right = false;
    });

    window.addEventListener('wheel', (e) => {
      this.wheelDelta += Math.sign(e.deltaY);
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });

    // Disable context menu so right click works in-game
    window.addEventListener('contextmenu', (e) => {
      if (this.isPointerLocked) e.preventDefault();
    });
  }

  requestPointerLock() {
    if (this.domElement && this.domElement.requestPointerLock) {
      this.domElement.requestPointerLock();
    }
  }

  releasePointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  isActionPressed(action) {
    const codes = this.bindings[action];
    if (!codes) return false;
    return codes.some((code) => this.keys.get(code));
  }

  getAndClearMouseDelta() {
    const delta = { x: this.mouseDelta.x * this.sensitivity, y: this.mouseDelta.y * this.sensitivity };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return delta;
  }

  getAndClearWheelDelta() {
    const w = this.wheelDelta;
    this.wheelDelta = 0;
    return w;
  }

  consumeLeftClick() {
    const c = this.mouseClicks.left;
    this.mouseClicks.left = false;
    return c;
  }

  consumeRightClick() {
    const c = this.mouseClicks.right;
    this.mouseClicks.right = false;
    return c;
  }
}
