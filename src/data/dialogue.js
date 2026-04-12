// ─────────────────────────────────────────────────────────────────────────────
// dialogue.js — All dialogue scripts
//
// Each script is an array of "beats". A beat is:
//   { speaker, text, portrait, choices? }
//
// portrait: a junior id (from juniors.js) or senior id (from seniors.js)
//           The system will load the right image/emoji automatically.
//
// choices: optional array of { label, next } — 'next' is ignored (all paths
//          continue to the next beat), but it makes the game feel interactive.
// ─────────────────────────────────────────────────────────────────────────────

export const DIALOGUES = {

  // ── Opening scene — juniors call for help ──────────────────────────────
  opening: [
    {
      speaker: 'SYSTEM',
      portrait: null,
      text: '[ SI Lab. 11:47 PM. Three days before end semester. ]',
    },
    {
      speaker: 'JUNIOR 1',
      portrait: 'junior_1',
      text: 'Bhai... it\'s bad. Really bad this time.',
    },
    {
      speaker: 'JUNIOR 1',
      portrait: 'junior_1',
      text: 'The code won\'t compile. Viva is tomorrow. And someone ate my maggi.',
      choices: [
        { label: '...who ate the maggi?', next: 'next' },
        { label: 'We\'ll figure it out.', next: 'next' },
      ],
    },
    {
      speaker: 'JUNIOR 2',
      portrait: 'junior_2',
      text: 'We need the seniors. Without them we are literally cooked.',
    },
    {
      speaker: 'JUNIOR 3',
      portrait: 'junior_3',
      text: 'They\'re out there somewhere. Still surviving. Somehow.',
    },
    {
      speaker: 'JUNIOR 1',
      portrait: 'junior_1',
      text: 'We have to call them back. One last time.',
      choices: [
        { label: 'Let\'s do it.', next: 'next' },
      ],
    },
    {
      speaker: 'SYSTEM',
      portrait: null,
      text: '[ Initiating Senior Recall Protocol... ]',
    },
  ],

  // ── After character selected ───────────────────────────────────────────
  selected: [
    {
      speaker: 'JUNIOR 1',
      portrait: 'junior_1',
      // NOTE: {senior_name} gets replaced at runtime with the selected senior's name
      text: '{senior_name} has entered the building. The vibes have shifted.',
    },
    {
      speaker: 'JUNIOR 2',
      portrait: 'junior_2',
      text: 'The path back to SI Lab is full of... memories. Not all good ones.',
    },
    {
      speaker: 'JUNIOR 1',
      portrait: 'junior_1',
      text: 'Year 1. You remember how lost you were? Yeah. Same energy. Let\'s go.',
    },
  ],

  // ── Zone 1 → Zone 2 transition ─────────────────────────────────────────
  zone2_start: [
    {
      speaker: 'JUNIOR 3',
      portrait: 'junior_3',
      text: 'Year 2 hits different. The bugs got bigger. The hope got smaller.',
    },
    {
      speaker: 'JUNIOR 2',
      portrait: 'junior_2',
      text: 'This is where the lab really started. Long nights. Broken terminals.',
      choices: [
        { label: 'I remember.', next: 'next' },
        { label: 'Don\'t remind me.', next: 'next' },
      ],
    },
  ],

  // ── Power-up summon (after Year 2 mini-boss) ───────────────────────────
  powerup_summon: [
    {
      speaker: 'JUNIOR 1',
      portrait: 'junior_1',
      text: 'WAIT. We\'re coming too. You think we\'d let you do this alone?',
    },
    {
      speaker: 'SYSTEM',
      portrait: null,
      text: '[ JUNIOR SQUAD ACTIVATED — 15 second boost! ]',
    },
  ],

  // ── Zone 2 → Zone 3 transition ─────────────────────────────────────────
  zone3_start: [
    {
      speaker: 'JUNIOR 2',
      portrait: 'junior_2',
      text: 'Year 3. Projects. Internship forms. Existential dread. The works.',
    },
    {
      speaker: 'JUNIOR 3',
      portrait: 'junior_3',
      text: 'Almost there. The lab is close. We can feel it.',
      choices: [
        { label: 'Keep going.', next: 'next' },
      ],
    },
  ],

  // ── Before final boss ──────────────────────────────────────────────────
  boss_intro: [
    {
      speaker: 'JUNIOR 1',
      portrait: 'junior_1',
      text: 'Year 4. One thing stands between you and SI Lab.',
    },
    {
      speaker: 'JUNIOR 2',
      portrait: 'junior_2',
      text: 'The thing that haunted your dreams. The thing that ended friendships.',
    },
    {
      speaker: 'JUNIOR 3',
      portrait: 'junior_3',
      text: '...PLACEMENTS.',
    },
    {
      speaker: 'JUNIOR 1',
      portrait: 'junior_1',
      text: 'This is it. Show them what four years looked like.',
      choices: [
        { label: 'Let\'s end this.', next: 'next' },
      ],
    },
  ],

  // ── Boss defeated ──────────────────────────────────────────────────────
  boss_defeated: [
    {
      speaker: 'SYSTEM',
      portrait: null,
      text: '[ OFFER LETTER OBTAINED. PLACEMENTS DEFEATED. ]',
    },
    {
      speaker: 'JUNIOR 3',
      portrait: 'junior_3',
      text: 'They actually did it. I can\'t believe they actually did it.',
    },
    {
      speaker: 'JUNIOR 1',
      portrait: 'junior_1',
      text: '{senior_name}... you made it. We knew you would.',
    },
  ],

  // ── Final scene — arrival at SI Lab ───────────────────────────────────
  final_arrival: [
    {
      speaker: 'JUNIOR 2',
      portrait: 'junior_2',
      text: 'You\'re here. Finally. SI Lab has been waiting.',
    },
    {
      speaker: 'JUNIOR 3',
      portrait: 'junior_3',
      text: 'We have something for you. All of you seniors.',
    },
    {
      speaker: 'JUNIOR 1',
      portrait: 'junior_1',
      text: 'There\'s a projector. And a play button. And... we really hope you come.',
      choices: [
        { label: '[ Press Play ]', next: 'next' },
      ],
    },
  ],
}
