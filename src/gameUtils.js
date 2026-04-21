/**
 * Game-specific utility functions
 */

export const ZONE_LABELS = [
  [
    { x: 50, text: 'ORIENTATION' },
    { x: 800, text: 'FIRST SEMESTER' },
    { x: 1600, text: 'MID SEMS' },
    { x: 2400, text: 'END SEMS' },
  ],
  [
    { x: 50, text: 'LAB 1' },
    { x: 800, text: 'LAB 2' },
    { x: 1600, text: 'MINI PROJECT' },
    { x: 2400, text: 'LAB VIVA' },
  ],
  [
    { x: 50, text: 'IDEATION' },
    { x: 800, text: 'DEVELOPMENT' },
    { x: 1600, text: 'DEADLINES' },
    { x: 2400, text: 'DEMO DAY' },
  ],
  [
    { x: 50, text: 'RESUME' },
    { x: 800, text: 'APTITUDE' },
    { x: 1600, text: 'TECH ROUND' },
    { x: 2400, text: 'HR / BOSS' },
  ],
]

export const PLATFORM_CONFIGS = [
  [
    [350, 215],
    [600, 180],
    [900, 210],
    [1100, 170],
    [1400, 200],
    [1700, 220],
    [1900, 180],
    [2200, 205],
    [2500, 190],
    [2800, 215],
  ],
  [
    [300, 210],
    [550, 175],
    [750, 210],
    [1000, 190],
    [1300, 165],
    [1500, 200],
    [1800, 180],
    [2100, 215],
    [2400, 190],
    [2700, 170],
  ],
  [
    [400, 220],
    [650, 185],
    [900, 160],
    [1050, 200],
    [1300, 180],
    [1600, 215],
    [1900, 190],
    [2150, 170],
    [2450, 205],
    [2750, 185],
  ],
  [
    [300, 205],
    [500, 170],
    [700, 200],
    [1000, 175],
    [1300, 210],
    [1600, 185],
    [1900, 160],
    [2200, 200],
    [2500, 180],
    [2800, 205],
  ],
]

export const ENEMY_POSITIONS = []
export function generateEnemyPositions() {
  const positions = []
  const LEVEL_WIDTH = 3200
  const GROUND_Y = 222
  for (let i = 0; i < 12; i++) {
    positions.push(300 + i * 220 + Math.random() * 80 - 40)
  }
  return positions
}

export const PICKUP_POSITIONS = [450, 900, 1400, 1900, 2400]
