
"use strict";

// ==========================================
// TOWER OF HANOI — PROLOG LAB
// Complete JavaScript Application
// ==========================================

// DOM ELEMENTS
const $ = (id) => document.getElementById(id);

const diskCount = $("diskCount");
const speed = $("speed");

const stacks = {
  left: $("left"),
  middle: $("middle"),
  right: $("right")
};

const colors = [
  "#a8f06a",
  "#73c9ed",
  "#b59aff",
  "#ffb86c",
  "#ff829e",
  "#70dfc4",
  "#e8d477",
  "#8da9ff",
  "#e59be9",
  "#b8d5a1"
];

const speeds = [1500, 950, 600, 350, 160];

// ==========================================
// GAME STATE
// ==========================================

let count = Number(diskCount.value);

let moves = [];
let moveIndex = 0;
let movesMade = 0;

let playing = false;
let timer = null;

let selectedPeg = null;
let manualMode = false;

let towers = {
  left: [],
  middle: [],
  right: []
};

// ==========================================
// MESSAGE AND STATUS
// ==========================================

function setMessage(message) {
  const element = $("gameMessage");

  if (element) {
    element.textContent = message;
  }
}

function setStatus(connected) {
  const status = $("status");

  if (!status) return;

  status.textContent = connected
    ? "● Prolog backend connected"
    : "● Cannot connect to Prolog backend";

  status.style.color = connected
    ? "#a8f06a"
    : "#ff7777";
}

// ==========================================
// INITIALIZE GAME
// ==========================================

function initializeTowers() {
  towers = {
    left: Array.from(
      { length: count },
      (_, i) => count - i
    ),
    middle: [],
    right: []
  };

  moveIndex = 0;
  movesMade = 0;
  selectedPeg = null;
  manualMode = false;

  render();
}

// ==========================================
// RENDER DISKS AND GAME INFORMATION
// ==========================================

function render() {

  Object.entries(stacks).forEach(([peg, element]) => {

    if (!element) return;

    element.innerHTML = "";

    element.classList.toggle(
      "selected",
      selectedPeg === peg
    );

    towers[peg].forEach(disk => {

      const block = document.createElement("div");

      block.className = "disk";
      block.title = `Disk ${disk}`;

      const width = 25 + (disk / count) * 65;

      block.style.width = `${width}%`;

      block.style.background =
        colors[(disk - 1) % colors.length];

      block.dataset.disk = disk;

      element.appendChild(block);

    });

  });

  // MOVE COUNTER
  $("movesMade").textContent = movesMade;

  // OPTIMAL SOLUTION
  const optimal = 2 ** count - 1;

  $("optimalMoves").textContent = optimal;

  // PROGRESS
  const percentage = Math.min(
    100,
    Math.round((movesMade / optimal) * 100)
  );

  $("progress").textContent = `${percentage}%`;

  $("progressBar").style.width =
    `${percentage}%`;

  // COMPLEXITY
  $("complexity").textContent =
    `2${count.toString().replace(
      /\d/g,
      n => "⁰¹²³⁴⁵⁶⁷⁸⁹"[n]
    )} − 1 = ${optimal} moves`;

  // BUTTON STATES
  $("stepBack").disabled =
    playing || manualMode || moveIndex === 0;

  $("stepForward").disabled =
    playing ||
    manualMode ||
    moveIndex >= moves.length ||
    moves.length === 0;

  $("stepBack").style.opacity =
    $("stepBack").disabled ? "0.4" : "1";

  $("stepForward").style.opacity =
    $("stepForward").disabled ? "0.4" : "1";
}

// ==========================================
// FETCH PROLOG SOLUTION
// ==========================================

async function fetchSolution() {

  const response = await fetch("/api/solve", {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      disks: count
    })
  });

  if (!response.ok) {
    throw new Error(
      "Prolog could not calculate the solution."
    );
  }

  const data = await response.json();

  if (
    !Array.isArray(data.moves) ||
    data.moves.length !== (2 ** count - 1)
  ) {
    throw new Error(
      "Invalid solution received from Prolog."
    );
  }

  moves = data.moves;

  console.log("Prolog solution loaded:", moves);

  return data;
}

// ==========================================
// STOP PLAYBACK
// ==========================================

function updatePlayButton() {

  const button = $("playPause");

  if (!button) return;

  button.innerHTML = playing
    ? 'Ⅱ <span id="playText">Pause</span>'
    : '▶ <span id="playText">Play solution</span>';
}

function stopPlayback() {

  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }

  playing = false;

  updatePlayButton();

  render();
}

// ==========================================
// VALIDATE AND APPLY AUTOMATIC MOVE
// ==========================================

function applyMove(move) {

  const source = towers[move.from];
  const destination = towers[move.to];

  if (!source || !destination || source.length === 0) {
    throw new Error("Invalid source or destination pole.");
  }

  const disk = source[source.length - 1];

  if (disk !== move.disk) {
    throw new Error("Invalid disk movement.");
  }

  const topDisk =
    destination[destination.length - 1];

  if (topDisk !== undefined && topDisk < disk) {
    throw new Error(
      "Cannot place a larger disk on a smaller disk."
    );
  }

  source.pop();
  destination.push(disk);

  moveIndex++;
  movesMade++;

  render();

  setMessage(
    `Disk ${disk}: ${move.from} → ${move.to}`
  );

  if (moveIndex >= moves.length) {

    stopPlayback();

    setMessage(
      "Puzzle solved! Congratulations!"
    );
  }
}

// ==========================================
// MANUAL DISK MOVEMENT
// CLICK SOURCE POLE, THEN DESTINATION POLE
// ==========================================

function handlePegClick(pegName) {

  if (playing) return;

  // FIRST CLICK: SELECT SOURCE POLE

  if (selectedPeg === null) {

    if (towers[pegName].length === 0) {

      setMessage(
        "This pole is empty. Select a pole with a disk."
      );

      return;
    }

    selectedPeg = pegName;

    render();

    const disk =
      towers[pegName][towers[pegName].length - 1];

    setMessage(
      `Disk ${disk} selected. Choose a destination pole.`
    );

    return;
  }

  // CLICK SAME POLE: CANCEL SELECTION

  if (selectedPeg === pegName) {

    selectedPeg = null;

    render();

    setMessage("Selection cancelled.");

    return;
  }

  // SECOND CLICK: MOVE DISK

  const source = towers[selectedPeg];
  const destination = towers[pegName];

  const disk =
    source[source.length - 1];

  const topDisk =
    destination[destination.length - 1];

  // CHECK HANOI RULES

  if (topDisk !== undefined && topDisk < disk) {

    setMessage(
      "Invalid move! A larger disk cannot go on a smaller disk."
    );

    return;
  }

  // EXECUTE MANUAL MOVE

  source.pop();
  destination.push(disk);

  movesMade++;

  manualMode = true;

  const previousPeg = selectedPeg;

  selectedPeg = null;

  render();

  setMessage(
    `Disk ${disk} moved: ${previousPeg} → ${pegName}`
  );

  // CHECK VICTORY

  if (towers.right.length === count) {

    stopPlayback();

    setMessage(
      `Congratulations! You solved the puzzle in ${movesMade} moves!`
    );

    return;
  }

}

// ==========================================
// CONNECT MANUAL CLICK EVENTS
// ==========================================

Object.entries(stacks).forEach(
  ([pegName, element]) => {

    if (!element) return;

    const pegArea = element.parentElement;

    if (!pegArea) return;

    pegArea.addEventListener("click", () => {
      handlePegClick(pegName);
    });

  }
);

// ==========================================
// NEXT MOVE
// ==========================================

function nextMove() {

  if (playing || manualMode) return;

  if (moveIndex >= moves.length) return;

  try {

    applyMove(moves[moveIndex]);

  } catch (error) {

    setMessage(error.message);

    console.error(error);

  }
}

// ==========================================
// PREVIOUS MOVE
// ==========================================

function previousMove() {

  if (playing || manualMode || moveIndex <= 0) {
    return;
  }

  const move = moves[moveIndex - 1];

  const source = towers[move.to];
  const destination = towers[move.from];

  if (!source || !destination || source.length === 0) {
    return;
  }

  const disk = source[source.length - 1];

  if (disk !== move.disk) {
    setMessage("Cannot reverse this move.");
    return;
  }

  source.pop();
  destination.push(disk);

  moveIndex--;
  movesMade--;

  render();

  setMessage(
    `Reversed disk ${disk}: ${move.to} → ${move.from}`
  );
}

// ==========================================
// AUTOMATIC PLAYBACK
// ==========================================

function scheduleNext() {

  if (!playing) return;

  if (moveIndex >= moves.length) {

    stopPlayback();

    setMessage("Puzzle solved!");

    return;
  }

  const delay =
    speeds[Number(speed.value) - 1];

  timer = setTimeout(() => {

    if (!playing) return;

    try {

      applyMove(moves[moveIndex]);

      if (playing) {
        scheduleNext();
      }

    } catch (error) {

      stopPlayback();

      setMessage(error.message);

      console.error(error);

    }

  }, delay);
}

// ==========================================
// PLAY / PAUSE BUTTON
// ==========================================

async function playPause() {

  if (playing) {

    stopPlayback();

    setMessage("Animation paused.");

    return;
  }

  try {

    // If manual gameplay has started,
    // restart before automatic playback.

    if (manualMode || movesMade > 0) {

      initializeTowers();

    }

    if (moves.length === 0) {

      await fetchSolution();

    }

    if (moveIndex >= moves.length) {

      initializeTowers();

    }

    playing = true;

    updatePlayButton();

    render();

    setMessage("Solving Tower of Hanoi...");

    scheduleNext();

  } catch (error) {

    stopPlayback();

    setMessage(error.message);

    console.error(error);

  }
}

// ==========================================
// NEW PUZZLE
// ==========================================

async function newPuzzle() {

  stopPlayback();

  count = Number(diskCount.value);

  moves = [];

  initializeTowers();

  setMessage("Calculating solution with Prolog...");

  try {

    await fetchSolution();

    setStatus(true);

    render();

    setMessage("New puzzle ready. Click a pole to move disks.");

  } catch (error) {

    setStatus(false);

    setMessage(error.message);

    console.error(error);

  }
}

// ==========================================
// RESET GAME
// ==========================================

function resetGame() {

  stopPlayback();

  initializeTowers();

  setMessage("Puzzle reset. Ready to play!");

}

// ==========================================
// SOLVE WITH PROLOG
// ==========================================

async function solveWithProlog() {

  stopPlayback();

  initializeTowers();

  try {

    if (moves.length === 0) {
      await fetchSolution();
    }

    setMessage("Starting Prolog solution...");

    await playPause();

  } catch (error) {

    stopPlayback();

    setMessage(error.message);

    console.error(error);

  }
}

// ==========================================
// BUTTON EVENT LISTENERS
// ==========================================

$("newGame").addEventListener(
  "click",
  newPuzzle
);

$("reset").addEventListener(
  "click",
  resetGame
);

$("solve").addEventListener(
  "click",
  solveWithProlog
);

$("playPause").addEventListener(
  "click",
  playPause
);

$("stepForward").addEventListener(
  "click",
  nextMove
);

$("stepBack").addEventListener(
  "click",
  previousMove
);

// DISK COUNT

diskCount.addEventListener(
  "change",
  newPuzzle
);

// ANIMATION SPEED

speed.addEventListener("input", () => {

  const labels = [
    "Very slow",
    "Slow",
    "Normal",
    "Fast",
    "Very fast"
  ];

  $("speedLabel").textContent =
    labels[Number(speed.value) - 1];

});

// ==========================================
// CHECK PROLOG BACKEND
// ==========================================

async function checkBackend() {

  try {

    const response = await fetch("/api/health");

    if (!response.ok) {
      throw new Error("Backend connection failed.");
    }

    setStatus(true);

    await newPuzzle();

  } catch (error) {

    setStatus(false);

    setMessage(
      "Cannot connect to Prolog backend."
    );

    console.error(error);

  }

}

// ==========================================
// START APPLICATION
// ==========================================

initializeTowers();

updatePlayButton();

setMessage("Connecting to Prolog...");

checkBackend();
