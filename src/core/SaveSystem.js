export class SaveSystem {
  constructor() {
    this.dbName = 'VoxelVerseDB';
    this.dbVersion = 1;
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, fallback to localStorage');
        resolve(null);
        return;
      }
      const req = indexedDB.open(this.dbName, this.dbVersion);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('worlds')) {
          db.createObjectStore('worlds', { keyPath: 'name' });
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      req.onerror = () => {
        resolve(null);
      };
    });
  }

  async saveWorld(worldName, gameData) {
    if (!this.db) await this.initDB();

    const dataToSave = {
      name: worldName,
      date: Date.now(),
      seed: gameData.seed,
      player: {
        gameMode: gameData.player.gameMode || 'survival',
        x: gameData.player.position.x,
        y: gameData.player.position.y,
        z: gameData.player.position.z,
        yaw: gameData.player.yaw,
        pitch: gameData.player.pitch,
        health: gameData.player.health,
        hunger: gameData.player.hunger,
        level: gameData.player.level,
        xp: gameData.player.xp,
        spawnPoint: [gameData.player.spawnPoint.x, gameData.player.spawnPoint.y, gameData.player.spawnPoint.z],
        inventory: gameData.player.inventory,
      },
      modifiedBlocks: Array.from(gameData.world.modifiedBlocks.entries()),
      chests: Array.from(gameData.world.chests.entries()),
      furnaces: Array.from(gameData.world.furnaces.entries()),
      time: gameData.sky.time,
      weather: gameData.sky.weather,
    };

    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('worlds', 'readwrite');
        const store = tx.objectStore('worlds');
        store.put(dataToSave);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } else {
      try {
        localStorage.setItem(`voxelverse_world_${worldName}`, JSON.stringify(dataToSave));
        return true;
      } catch (e) {
        console.error('LocalStorage save error:', e);
        return false;
      }
    }
  }

  async loadWorld(worldName) {
    if (!this.db) await this.initDB();

    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('worlds', 'readonly');
        const store = tx.objectStore('worlds');
        const req = store.get(worldName);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } else {
      const item = localStorage.getItem(`voxelverse_world_${worldName}`);
      return item ? JSON.parse(item) : null;
    }
  }

  async listWorlds() {
    if (!this.db) await this.initDB();

    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('worlds', 'readonly');
        const store = tx.objectStore('worlds');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } else {
      const list = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('voxelverse_world_')) {
          try {
            list.push(JSON.parse(localStorage.getItem(key)));
          } catch {}
        }
      }
      return list;
    }
  }

  async deleteWorld(worldName) {
    if (!this.db) await this.initDB();
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('worlds', 'readwrite');
        const store = tx.objectStore('worlds');
        store.delete(worldName);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } else {
      localStorage.removeItem(`voxelverse_world_${worldName}`);
      return true;
    }
  }
}

export const saveSystem = new SaveSystem();
