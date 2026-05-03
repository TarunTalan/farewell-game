/**
 * Enemy configurations for each year.
 * Year 1: Freshman Confusion — spooky campus enemies
 * Year 2: Lab Hell — "SI Probation" as key monster + lab bugs
 * Year 3: Project Panic — "Juniors se Party" swarm monsters
 * Year 4: Placements — corporate nightmare enemies + BOSS
 */

export const YEAR_ENEMIES = [
  // Year 1 — Freshman Confusion
  [
    { label: 'Maths-2 ki back',      hp: 2, speed: 45, color: 0x6688cc, w: 28, h: 28, score: 30 },
    { label: 'Physics ki derivation', hp: 2, speed: 55, color: 0xcc4466, w: 30, h: 30, score: 40 },
    { label: 'DC Raaj',              hp: 2, speed: 42, color: 0xccaa00, w: 26, h: 26, score: 30 },
    { label: 'Societies ke events',  hp: 3, speed: 58, color: 0xff6644, w: 28, h: 28, score: 50 },
  ],
  // Year 2 — Lab Hell (SI Probation is the big one!)
  [
    { label: '⚠ SI PROBATION',  hp: 6, speed: 48, color: 0x8833cc, w: 38, h: 38, score: 120 },
    { label: 'Segfault',        hp: 2, speed: 50, color: 0x44cc44, w: 26, h: 26, score: 50 },
    { label: 'Viva Exam',       hp: 3, speed: 60, color: 0x88ff44, w: 28, h: 28, score: 60 },
    { label: 'Compiler Error',  hp: 3, speed: 65, color: 0xff4444, w: 30, h: 30, score: 70 },
  ],
  // Year 3 — Project Panic ("Juniors se Party" everywhere!)
  [
    { label: '🎉 Juniors Party', hp: 3, speed: 55, color: 0xff00aa, w: 30, h: 30, score: 60 },
    { label: '🎉 Juniors Party', hp: 3, speed: 60, color: 0xff44cc, w: 28, h: 28, score: 60 },
    { label: 'Deadline',         hp: 3, speed: 52, color: 0xff8800, w: 28, h: 28, score: 70 },
    { label: 'Git Conflict',     hp: 4, speed: 68, color: 0xff3300, w: 32, h: 32, score: 80 },
  ],
  // Year 4 — Placements (corporate nightmare)
  [
    { label: 'HR Round',     hp: 3, speed: 55, color: 0xdd0000, w: 28, h: 28, score: 80 },
    { label: 'DSA Sheet',    hp: 4, speed: 62, color: 0xbb0000, w: 30, h: 30, score: 90 },
    { label: 'Resume Gap',   hp: 3, speed: 50, color: 0xff2200, w: 26, h: 26, score: 70 },
    { label: 'Ghosted 👻',  hp: 4, speed: 68, color: 0x880022, w: 32, h: 32, score: 100 },
  ],
]
