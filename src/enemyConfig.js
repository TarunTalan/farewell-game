/**
 * Enemy configurations for each year.
 * Keep shape aligned with GameScene's sprite generation and spawn logic.
 */

export const YEAR_ENEMIES = [
  [
    { label: 'Lost Syllabus', hp: 2, speed: 55, color: 0x6688cc, w: 26, h: 26, score: 30 },
    { label: 'Hostel Ragging', hp: 3, speed: 68, color: 0xcc4466, w: 28, h: 28, score: 40 },
    { label: 'Dean Notice', hp: 2, speed: 48, color: 0xccaa00, w: 24, h: 24, score: 30 },
    { label: 'Attendance%', hp: 4, speed: 75, color: 0xff6644, w: 30, h: 30, score: 50 },
  ],
  [
    { label: 'Segfault', hp: 3, speed: 60, color: 0x44cc44, w: 26, h: 26, score: 50 },
    { label: 'Viva Exam', hp: 4, speed: 82, color: 0x88ff44, w: 28, h: 28, score: 60 },
    { label: 'Lab Report', hp: 2, speed: 50, color: 0x44ffaa, w: 24, h: 24, score: 40 },
    { label: 'Compiler', hp: 5, speed: 95, color: 0xff4444, w: 32, h: 32, score: 70 },
  ],
  [
    { label: 'Deadline', hp: 4, speed: 72, color: 0xff8800, w: 28, h: 28, score: 70 },
    { label: 'No WiFi', hp: 3, speed: 62, color: 0xffaa00, w: 26, h: 26, score: 60 },
    { label: 'Client', hp: 5, speed: 88, color: 0xff5500, w: 30, h: 30, score: 80 },
    { label: 'Git Conflict', hp: 6, speed: 98, color: 0xff3300, w: 34, h: 34, score: 100 },
  ],
  [
    { label: 'HR Round', hp: 5, speed: 80, color: 0xdd0000, w: 28, h: 28, score: 90 },
    { label: 'DSA Sheet', hp: 6, speed: 92, color: 0xbb0000, w: 30, h: 30, score: 110 },
    { label: 'Resume Gap', hp: 4, speed: 70, color: 0xff2200, w: 26, h: 26, score: 80 },
    { label: 'Ghosted', hp: 7, speed: 104, color: 0x880022, w: 34, h: 34, score: 130 },
  ],
]
