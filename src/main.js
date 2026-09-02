import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  try {
    // Verify WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;color:#ff4444;font-family:sans-serif;text-align:center;padding:20px;">
          <h1>WebGL Not Available</h1>
          <p>Your browser or graphics card does not appear to support WebGL. Please enable hardware acceleration in your browser settings to play VoxelVerse.</p>
        </div>
      `;
      return;
    }

    const game = new Game();
    window.game = game; // Expose for debugging & inspection
  } catch (err) {
    console.error('Fatal initialization error:', err);
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;color:#ff4444;font-family:sans-serif;text-align:center;padding:20px;">
        <h1>Game Load Error</h1>
        <p>${err.message}</p>
      </div>
    `;
  }
});
