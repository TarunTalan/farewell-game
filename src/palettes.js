/**
 * Color palettes for each year/season
 */

export const PALETTES = [
  {
    sky: 0x0d1b4b,
    mid: 0x1a2e6e,
    ground: 0x2d4a8a,
    accent: 0x5b8cff,
    fog: 0x0a1235,
    name: 'YEAR 1 - CONFUSION',
  },
  {
    sky: 0x0a2a0a,
    mid: 0x0e3d0e,
    ground: 0x1a5c1a,
    accent: 0x39ff14,
    fog: 0x061806,
    name: 'YEAR 2 - LAB HELL',
  },
  {
    sky: 0x2a1a00,
    mid: 0x4a2d00,
    ground: 0x7a4a00,
    accent: 0xff8800,
    fog: 0x1a0d00,
    name: 'YEAR 3 - PROJECT PANIC',
  },
  {
    sky: 0x2a1200,
    mid: 0x5a3000,
    ground: 0x8a6520,
    accent: 0xffdd66,
    fog: 0x1a0a00,
    name: 'YEAR 4 - THE FINAL WALK',
  },
]

export function colorHex(value) {
  return `#${value.toString(16).padStart(6, '0')}`
}
