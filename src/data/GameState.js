// ─────────────────────────────────────────────────────────────────────────────
// GameState.js — single shared state, passed to all systems and Phaser scenes
// ─────────────────────────────────────────────────────────────────────────────

export const gameState = {
  selectedSenior: null,       // { id, name, title, power, emoji, color, image }
  currentZone: 0,             // 0=Y1, 1=Y2, 2=Y3, 3=Y4/boss
  health: 100,
  maxHealth: 100,
  score: 0,
  powerupActive: false,
  powerupUsed: false,         // can only summon once
  bossDefeated: false,
  gameStarted: false,
}
