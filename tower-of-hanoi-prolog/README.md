# Tower of Hanoi — Prolog Logic Visualizer

Animated Tower of Hanoi web app with a SWI-Prolog backend. Prolog calculates the optimal recursive move sequence; JavaScript displays and animates it.

## Features
- Prolog recursion generates the optimal solution.
- Animated disks, 3–10 disk difficulty, play/pause, step forward/back, reset.
- Adjustable speed, move counter, optimal move count, progress indicator.

## Requirements
Install [SWI-Prolog](https://www.swi-prolog.org/) and use a modern browser.

## Run
1. Extract the ZIP and open a terminal in this folder.
2. Run `swipl -q -s server.pl`.
3. Open http://localhost:8080. Keep the terminal open. Press Ctrl+C to stop.

## Backend
`GET /api/health` checks the backend. `POST /api/solve` accepts `{"disks":3}` and returns a JSON move list. Valid disk count: 1–10.

The recursive algorithm moves N−1 disks to the auxiliary peg, moves the largest disk to the target, then moves N−1 disks onto it. Minimum moves: `2^N - 1`.

## Structure
- `server.pl` — Prolog HTTP server and recursive solver
- `public/index.html` — page structure
- `public/styles.css` — responsive visual design
- `public/app.js` — controls and animation
