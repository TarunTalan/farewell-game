# Game Execution Flow & File Responsibilities

## 🎬 EXECUTION SEQUENCE (Screen Timeline)

### Phase 1: Browser Loads
```
index.html (entry point)
  ↓
  Loads Phaser from CDN
  Loads main.js (module)
```

---

### Phase 2: Game Initialization
```
main.js
  ├─ Imports all scenes
  ├─ Imports Phaser
  └─ Creates Phaser.Game() config with scene order
      ↓
      Phaser boots up with config
```

**Screen:** Black screen, then loading begins

---

### Phase 3: BootScene (Loading Screen)
```
BootScene.js (First scene - automatic)
  ├─ preload()
  │   ├─ _buildLoadingScreen()
  │   │   ├─ Dark background
  │   │   ├─ Progress bar
  │   │   ├─ Terminal-style loading text
  │   │   └─ Scanlines & visual effects
  │   │
  │   └─ _generateAllTextures()
  │       └─ Creates all in-game sprites & textures
  │
  └─ AUTO TRANSITION → PreludeScene
```

**Screen:** 
- Loading UI (terminal aesthetic)
- Progress bar fills to 100%
- Message: "SI-LAB // BOOT SEQUENCE"

---

### Phase 4: PreludeScene (Story/Cinematic)
```
PreludeScene.js (Story sequence)
  ├─ create() → Starts phase1_labScene()
  ├─ _phase1_labScene (0-4.8s)
  │   ├─ SI Lab background
  │   ├─ 4 members appear (Divyansh, Sachi, Shivansh, Srayanash)
  │   ├─ They chat with speech bubbles
  │   └─ Auto transition to phase 2
  │
  ├─ _phase2_disappear (4.8s-8s)
  │   ├─ Static glitch effect
  │   ├─ 3 members vanish → only Divyansh remains
  │   ├─ "3 MEMBERS MISSING" message
  │   └─ Auto transition to phase 3
  │
  ├─ _phase3_phoneCall (8s-16.5s)
  │   ├─ Phone ringing animation
  │   ├─ Unknown caller dialogue
  │   ├─ Ransom demand
  │   └─ Divyansh's response
  │
  ├─ _phase4_whoAreThey (16.5s-19.5s)
  │   ├─ "WHO ARE THEY ???" text
  │   ├─ Red pulse effect
  │   └─ Auto transition to phase 5
  │
  ├─ _phase5_theyReveal (19.5s-27s)
  │   ├─ Reveals "LEGENDS" message
  │   ├─ Atmospheric text sequences
  │   ├─ "T H E Y" finale
  │   ├─ "[TAP / ENTER]" prompt
  │   └─ Waits for user input
  │
  └─ _goToCharSelect() (on user input)
      └─ Fade out → CharSelectScene
```

**Screen:** 
- Cinematic cuts (multiple phases)
- Story unfolds with dialogue & effects
- Waits for player tap/Enter key

**Data Used:**
- None directly, but sets up game context

---

### Phase 5: CharSelectScene (Character Selection)
```
CharSelectScene.js (Pick your character)
  ├─ create()
  │   ├─ _buildBG()
  │   ├─ _buildTapeRail() → Film strip UI
  │   ├─ _buildCards() → Renders 5 senior cards
  │   ├─ _buildUI() → Arrow buttons, confirm button
  │   ├─ _buildInput() → Keyboard + Touch controls
  │   └─ _highlightCard(0) → Highlights first card
  │
  ├─ User input handling
  │   ├─ LEFT/RIGHT arrows → scroll through seniors
  │   ├─ SWIPE → scroll on mobile
  │   └─ ENTER/SELECT button → confirm choice
  │
  ├─ _confirm()
  │   ├─ Gets selected senior ID
  │   ├─ gameState.selectedSenior = senior.id
  │   ├─ Flash animation
  │   └─ Fade out
  │
  └─ Transition → GameScene
```

**Screen:**
- Film strip UI with 5 character cards
- Shows: Arjun, Priya, Rohit, Neha, Vikram
- Player scrolls and selects one

**Data Used:**
- CharSelectScene.js → SENIORS array (senior data)
- gameState.js → Stores selectedSenior choice

---

### Phase 6: GameScene (Main Game)
```
GameScene.js (Side-scrolling action)
  ├─ create()
  │   ├─ Reset gameState (health, score, etc)
  │   ├─ _createBackgrounds() → Parallax layers
  │   ├─ _createGround() → Collision geometry
  │   ├─ _createPlayer() → Player sprite & physics
  │   ├─ _spawnZoneEnemies(0) → Spawn zone 1 enemies
  │   ├─ _setupCamera() → Follow player
  │   ├─ _setupCollisions()
  │   ├─ _setupInput() → Keyboard/touch controls
  │   └─ HUD.show() → Display health bar
  │
  ├─ update() [EVERY FRAME - 60fps]
  │   ├─ _handleInput() → Read keyboard/touch
  │   ├─ _updatePlayer() → Movement physics
  │   ├─ _updateEnemies() → AI & collision
  │   ├─ _checkZoneTransition() → Change zones
  │   ├─ _updateHUD() → Health, score display
  │   └─ _checkGameOver()
  │
  ├─ Collision handling
  │   ├─ Player vs Ground → Platform physics
  │   ├─ Player vs Enemy → Damage player
  │   ├─ Player vs Powerup → Activate special
  │   └─ Projectile vs Enemy → Kill enemy
  │
  └─ Game Over
      ├─ VideoSystem.show() → Play farewell video
      ├─ Show end screen
      └─ Restart option
```

**Screen:**
- Player sprite (colored box)
- Parallax backgrounds (4 zone colors)
- Enemies (bullets/obstacles)
- HUD: Health bar, score, zone number
- Controls: Arrow keys or touch

**Systems Used:**
- HUD.js → Health/score display
- VideoSystem.js → Farewell video
- PowerupSystem.js → Special abilities  
- DialogueSystem.js → Scene dialogue

---

## 📁 FILE RESPONSIBILITIES

### Entry Point
| File | Role |
|------|------|
| `index.html` | HTML container, loads Phaser script |
| `main.js` | Phaser config, scene registry, game bootstrap |
| `vite.config.js` | Build configuration |

### Scenes (Sequential Execution)
| File | Purpose | Duration |
|------|---------|----------|
| `BootScene.js` | Loading & asset generation | ~2-3s |
| `PreludeScene.js` | Story cutscenes & cinematic | ~27s |
| `CharSelectScene.js` | Character picker UI | Manual (player choice) |
| `GameScene.js` | Main gameplay loop | Varies |
| `LabScene.js` | Alternative 3D scene (unused) | — |

### Systems (Game Logic)
| File | Handles |
|------|---------|
| `DialogueSystem.js` | Dialogue boxes, text display, choices |
| `HUD.js` | Health bar, score, UI display |
| `VideoSystem.js` | Farewell video playback |
| `PowerupSystem.js` | Special abilities, power-ups |

### Data & State Management
| File | Contains |
|------|----------|
| `GameState.js` | Global game state (health, score, selectedSenior) |
| `dialogue.js` | All dialogue strings indexed by scene |
| `juniors.js` | Junior character data |
| `seniors.js` | Senior character profiles + stats |

---

## 🔄 DATA FLOW

```
GameState.js (Shared)
├─ health: Updated by GameScene on damage
├─ score: Updated by GameScene on kill enemy
├─ selectedSenior: Set by CharSelectScene, read by GameScene
├─ powerupActive: Set by PowerupSystem
└─ currentZone: Set by GameScene on zone change

seniors.js (Senior Profiles)
├─ Used during CharSelectScene rendering
└─ Passed to GameScene if selectedSenior is used

dialogue.js (Story Text)
├─ Used by PreludeScene (story narration)
└─ Used by DialogueSystem (in-game dialogue)

juniors.js (Junior Data)
└─ Used for NPC rendering in LabScene
```

---

## 🎮 USER INTERACTION TIMELINE

```
Time     | Scene               | User Action          | What Happens
---------|---------------------|----------------------|------------------------
0s       | Browser             | Open game URL        | BootScene starts
2-3s     | BootScene          | (Automatic)          | → PreludeScene
3s       | PreludeScene       | Watch story          | Story plays automatically
27s      | PreludeScene       | Tap/Press Enter      | → CharSelectScene
27s+     | CharSelectScene    | Left/Right + Select  | Pick a senior
28s+     | GameScene          | Arrow keys / Touch   | Play the game
???      | GameScene          | Lose all health      | → End screen + video
```

---

## 🚀 Quick Reference: "What File Does What?"

**"I see a loading screen" →** `BootScene.js`

**"I see story cutscenes" →** `PreludeScene.js`

**"I see character cards with names & stats" →** `CharSelectScene.js`

**"I see a player moving left/right" →** `GameScene.js` (+ Physics system)

**"I see enemies" →** `GameScene.js` (_spawnZoneEnemies, _updateEnemies)

**"I see a health bar" →** `HUD.js` (renders it), `GameScene.js` (updates it)

**"I see dialogue text in a box" →** `DialogueSystem.js`

**"I see a video at the end" →** `VideoSystem.js`

**"Where are character stats stored?" →** `seniors.js` (power, speed, wisdom)

**"Where is the game state?" →** `GameState.js` (health, score, selectedSenior)

**"Where are story lines?" →** `dialogue.js` (all text organized by scene)

