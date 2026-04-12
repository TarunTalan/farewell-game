# 🎓 Operation Farewell — SI Lab

> A mobile-first, browser-based farewell invitation game for the juniors of SI Lab.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (opens at http://localhost:3000)
npm run dev

# Build for production
npm run build

# Deploy: drag the /dist folder to Vercel or Netlify
```

---

## Folder Structure

```
farewell-game/
├── index.html                    ← Single HTML file (UI overlays live here)
├── vite.config.js
├── package.json
│
├── public/
│   ├── images/
│   │   ├── seniors/              ← DROP SENIOR PHOTOS HERE
│   │   │   └── README.txt
│   │   ├── juniors/              ← DROP JUNIOR PHOTOS HERE
│   │   │   └── README.txt
│   │   ├── enemies/              ← future sprite assets
│   │   └── ui/                   ← future UI assets
│   ├── audio/                    ← background music / sfx
│   └── fonts/                    ← local fonts if needed
│
└── src/
    ├── main.js                   ← Phaser config + entry
    ├── data/
    │   ├── seniors.js            ← ALL 11 SENIOR PROFILES
    │   ├── juniors.js            ← Junior profiles (your squad)
    │   ├── dialogue.js           ← All dialogue scripts
    │   └── GameState.js          ← Shared game state
    ├── scenes/
    │   ├── BootScene.js          ← Asset generation + loading
    │   ├── PreludeScene.js       ← Opening cinematic
    │   └── GameScene.js          ← The main side-scroller
    └── systems/
        ├── DialogueSystem.js     ← Pokemon-style dialogue engine
        ├── CharacterSelect.js    ← Senior selection carousel
        ├── PowerupSystem.js      ← Junior squad summon
        ├── HUD.js                ← Health bar, zone label, score
        └── VideoSystem.js        ← Farewell video + end screen
```

---

## How to Add Senior Photos

1. Drop the photo in `/public/images/seniors/`
   - Supported: `.jpg`, `.png`, `.webp`, `.svg`
   - Recommended size: 200×200px, square crop, face centered

2. Open `/src/data/seniors.js`

3. Find the senior's entry and set `image`:
   ```js
   {
     id: 'paras',
     name: 'Paras U.',
     // ...
     image: 'paras.jpg',  // ← was null, now has a filename
   }
   ```

4. Save. The dev server hot-reloads automatically.

---

## How to Add Junior Photos (for dialogue scenes)

Same process — drop in `/public/images/juniors/` and set `image` in `/src/data/juniors.js`.

---

## How to Embed the Farewell Video

Open `/src/scenes/GameScene.js`, find these lines near the top of `create()`:

```js
// ← Set your video here:
// this.videoSys.setYouTube('YOUR_YOUTUBE_ID')
// this.videoSys.setLocal('/videos/farewell.mp4')
```

**Option A — YouTube:**
1. Upload your video to YouTube (can be unlisted)
2. Copy the video ID from the URL: `youtube.com/watch?v=XXXXXXXXXXXX`
3. Uncomment and fill in: `this.videoSys.setYouTube('XXXXXXXXXXXX')`

**Option B — Self-hosted:**
1. Drop the `.mp4` file in `/public/videos/farewell.mp4`
2. Uncomment: `this.videoSys.setLocal('/videos/farewell.mp4')`

---

## How to Edit Dialogue

Open `/src/data/dialogue.js`. Each dialogue script is an array of "beats":

```js
{
  speaker: 'JUNIOR 1',
  portrait: 'junior_1',        // must match an id in juniors.js or seniors.js
  text: 'Your dialogue here.',
  choices: [                   // optional — makes it feel interactive
    { label: 'Option A', next: 'next' },
    { label: 'Option B', next: 'next' },
  ]
}
```

`{senior_name}` anywhere in `text` gets replaced with the selected senior's name at runtime.

---

## How to Edit Senior Descriptions

Open `/src/data/seniors.js`. Each senior has:

| Field   | What it does                              |
|---------|-------------------------------------------|
| name    | Display name on card                      |
| title   | Their funny "hero title"                  |
| bio     | 2-line description (use `\n` for newline) |
| power   | Their special in-game ability             |
| emoji   | Fallback avatar if no image               |
| color   | Card accent color                         |
| image   | Filename in `/public/images/seniors/`     |

---

## Gameplay Overview

| Zone    | Theme              | Enemies                          |
|---------|--------------------|----------------------------------|
| Year 1  | Confusion Zone     | Lost Syllabus, Ragging, Dean Notice |
| Year 2  | Lab Survival       | Bugs, Seg Faults, Viva Surprises |
| Year 3  | Project Panic      | Deadlines, No Wifi, Backlog      |
| Year 4  | Placement Hell     | **PLACEMENTS BOSS** (3 phases)   |

**Controls (mobile):**
- Tap left half of screen → Jump (double jump supported)
- Tap right half of screen → Attack

**Controls (keyboard, for testing):**
- Arrow Up / Space → Jump
- Z → Attack

**Health:** Seniors don't die. Health floors at 1. No game over screen.

**Power-up:** After Year 2, a glowing orb spawns. Run over it to summon the Junior Squad for 15 seconds (speed boost + projectile immunity + double score).

---

## Deploying to Vercel

```bash
npm run build
# Then drag the /dist folder to vercel.com/new
# Or install Vercel CLI: npm i -g vercel && vercel
```

Share the link over WhatsApp. Done.

---

## Tech Stack

| Library     | Version | Purpose                        |
|-------------|---------|--------------------------------|
| Phaser      | 3.60    | Game engine (physics, scenes)  |
| Vite        | 5.x     | Dev server + build tool        |
| Google Fonts | —      | Press Start 2P + VT323 fonts   |

No other dependencies. No React. No backend. Pure browser game.
