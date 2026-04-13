// ─────────────────────────────────────────────────────────────────────────────
// seniors.js — The 11 Seniors
//
// HOW TO ADD IMAGES:
//   1. Drop a photo/SVG in /public/images/seniors/
//   2. Set "image" to the filename, e.g. "paras.jpg"
//   3. If "image" is null, a colored emoji avatar is shown instead.
//
// FIELDS:
//   id         — unique key used internally
//   name       — display name on the card
//   title      — their funny "hero title"
//   bio        — 1-2 lines shown on the character card
//   power      — their special in-game ability description
//   emoji      — fallback avatar if no image
//   color      — card accent color (CSS hex)
//   image      — filename in /public/images/seniors/ or null
// ─────────────────────────────────────────────────────────────────────────────

export const SENIORS = [
  {
    id: 'paras',
    name: 'Paras U.',
    title: 'The One Who Had It Figured Out',
    bio: 'Nobody really knows how he does it.\nBut somehow, he always does.',
    power: '⚡ POWER: Auto-collects all nearby pickups',
    emoji: '😎',
    color: '#f0c040',
    image: "paras.jpg",  // → replace with 'paras.jpg'
  },
  {
    id: 'lakshya_goel',
    name: 'Lakshya Goel',
    title: 'The Silent Debugger',
    bio: 'Says nothing for hours.\nThen fixes everything in one line.',
    power: '🛡️ POWER: Immune to bug swarms for 10s',
    emoji: '🧠',
    color: '#70d0ff',
    image: "lakshya_goel.png",
  },
  {
    id: 'lakshay_bansal',
    name: 'Lakshay Bansal',
    title: 'The Presentation Whisperer',
    bio: 'His PPTs alone have saved\nentire semesters.',
    power: '📊 POWER: Stuns mini-bosses with slideshows',
    emoji: '📋',
    color: '#d070ff',
    image: "lakshay_bansal.png",
  },
  {
    id: 'lakshay',
    name: 'Lakshay',
    title: 'Just Lakshay. You Know.',
    bio: 'No last name needed.\nEveryone knows who you mean.',
    power: '🌀 POWER: Confuses enemies (they forget to attack)',
    emoji: '🌀',
    color: '#ff9070',
    image: "lakshay.png",
  },
  {
    id: 'harsh',
    name: 'Harsh',
    title: 'The Deadline Defier',
    bio: 'Submits at 11:59 PM.\nAlways full marks.',
    power: '⏱️ POWER: Freezes all timers for 8s',
    emoji: '⚡',
    color: '#ff5050',
    image: "harsh.png",
  },
  {
    id: 'yash',
    name: 'Yash',
    title: 'The Vibe Architect',
    bio: 'Somehow the lab is always\nbetter when he\'s around.',
    power: '🎵 POWER: Music boost — doubles jump height',
    emoji: '🎵',
    color: '#50ff90',
    image: "yash.png",
  },
  {
    id: 'kavita',
    name: 'Kavita',
    title: 'The One Who Read the Syllabus',
    bio: 'Literally the only person\nwho actually read it.',
    power: '📚 POWER: Reveals hidden paths & shortcuts',
    emoji: '📚',
    color: '#ff70b0',
    image: "kavita.png",
  },
  {
    id: 'ankit',
    name: 'Ankit',
    title: 'The Compiler Whisperer',
    bio: 'His code compiles on the first try.\nWe don\'t talk about it.',
    power: '💻 POWER: Destroys all error obstacles instantly',
    emoji: '💻',
    color: '#70fff0',
    image: "ankit.png",
  },
  {
    id: 'rachit',
    name: 'Rachit',
    title: 'The Last Minute Legend',
    bio: 'Joined the group project\nat 2 AM. Carried the whole thing.',
    power: '🚀 POWER: Speed boost — runs 2x faster',
    emoji: '🚀',
    color: '#ffa040',
    image: "rachit.png",
  },
  {
    id: 'aakarsh',
    name: 'Aakarsh',
    title: 'The Algorithm Overlord',
    bio: 'Solves DSA problems\nfor fun. Concerning.',
    power: '🔢 POWER: Optimal pathfinding — auto-dodges',
    emoji: '🔢',
    color: '#a0d0ff',
    image: "aakarsh.png",
  },
  {
    id: 'ayush',
    name: 'Ayush',
    title: 'The One With the Cheatsheet',
    bio: 'It wasn\'t cheating.\nIt was "efficient preparation".',
    power: '📝 POWER: Double score for 15s',
    emoji: '📝',
    color: '#d0ff70',
    image: "ayush.png",
  },
]
