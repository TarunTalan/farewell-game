// ─────────────────────────────────────────────────────────────────────────────
// juniors.js — The Juniors (your squad)
//
// These characters appear in the dialogue scenes (Pokemon-style face close-ups)
// and in the power-up summoning sequence.
//
// HOW TO ADD IMAGES:
//   1. Drop photo/SVG in /public/images/juniors/
//   2. Set "image" to the filename, e.g. "agrim.jpg"
//
// Add as many juniors as you want. The game picks 3 randomly for the power-up.
// ─────────────────────────────────────────────────────────────────────────────

export const JUNIORS = [
  {
    id: 'junior_1',
    name: 'AGRIM',           // ← your name / change to whoever is sending this
    emoji: '👨‍💻',
    color: '#70d0ff',
    image: null,             // → 'agrim.jpg'
  },
  {
    id: 'junior_2',
    name: 'JUNIOR 2',        // ← fill in
    emoji: '🧑‍🎓',
    color: '#ff70b0',
    image: null,
  },
  {
    id: 'junior_3',
    name: 'JUNIOR 3',        // ← fill in
    emoji: '👨‍🔬',
    color: '#50ff90',
    image: null,
  },
  // Add more juniors here — same format
]

// The 3 juniors that always appear in the opening dialogue scene (in order)
export const DIALOGUE_JUNIORS = ['junior_1', 'junior_2', 'junior_3']
