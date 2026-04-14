// ─────────────────────────────────────────────────────────────────────────────
// GameState.js — shared mutable game state
// ─────────────────────────────────────────────────────────────────────────────

export const gameState = {
  health:          100,
  score:           0,
  currentZone:     0,
  powerupActive:   false,
  powerupUsed:     false,
  bossDefeated:    false,
  selectedSenior:  null,   // set by CharSelectScene
}