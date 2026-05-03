import { H, GROUND_Y } from '../constants.js'

export const GROUND_Y_FRAC = GROUND_Y / H

// Shared persistent state across levels
export const GS = {
  health: 100,
  maxHealth: 100,
  score: 0,
  cgpa: 10.0,
  year: 0,
  totalKills: 0,
  powerupType: null,
  powerupTimer: 0,
  hasResumeBoost: false,
}

export const YEAR_VARIANTS = [
  {
    enemyCount: 8,
    pickupXs: [480, 950, 1430, 1910, 2380],
    powerupX: 750,
    speedMul: 1.0,
    movingPlatforms: false,
    surgeEvery: 0,
    surgeMul: 1.0,
  },
  {
    enemyCount: 9,
    pickupXs: [430, 870, 1320, 1770, 2230, 2670],
    powerupX: 980,
    speedMul: 1.0,
    movingPlatforms: true,
    surgeEvery: 0,
    surgeMul: 1.0,
  },
  {
    enemyCount: 10,
    pickupXs: [460, 910, 1360, 1810, 2260, 2700],
    powerupX: 1310,
    speedMul: 1.05,
    movingPlatforms: false,
    surgeEvery: 8000,
    surgeMul: 1.15,
  },
  {
    enemyCount: 8,
    pickupXs: [420, 760, 1110, 1490, 1890, 2290, 2690],
    powerupX: 1590,
    speedMul: 1.08,
    movingPlatforms: true,
    surgeEvery: 6000,
    surgeMul: 1.2,
  },
]

// Boss config — appears in Year 4 (index 3)
export const BOSS_CFG = {
  hp: 20, w: 80, h: 80,
  phases: [
    { threshold: 1.0,  color: 0xff2222, speed: 50,  shootInterval: 3500, shots: 1 },
    { threshold: 0.55, color: 0xff6600, speed: 70,  shootInterval: 2500, shots: 2 },
    { threshold: 0.25, color: 0xffcc00, speed: 90,  shootInterval: 1600, shots: 3 },
  ],
}
