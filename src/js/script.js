/* game.js - vollständige Version */

// === Konstanten ===
const TILE_COUNT = 30;
const START_VEL = 6;
const OBSTACLE_MIN = 1;
const OBSTACLE_MAX = 7;
let OBSTACLE_COUNT = getRandomInt(OBSTACLE_MIN, OBSTACLE_MAX);

// === Elemente ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const motionBtn = document.getElementById("motionPermissionBtn");
const touchArrows = document.querySelectorAll(".touch-arrows .arrow");

// === Variablen ===
let tileSize = 0;
let snake = [];
let dir = { x: 1, y: 0 };
let lastDir = { x: 1, y: 0 };
let food = null;
let obstacles = [];
let score = 0;
let vel = START_VEL;
let paused = false;
let gameOver = false;
let lastTime = 0;

// Motion
let tiltX = 0;
let tiltY = 0;
let tiltSmooth = 0.2;
let tiltThreshold = 3.5;

// === Setup ===
window.addEventListener("resize", onResize);

function onResize() {
  const displayWidth = Math.min(canvas.parentElement.clientWidth, 480);
  canvas.style.width = displayWidth + "px";
  canvas.style.height = displayWidth + "px";
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(displayWidth * dpr);
  canvas.height = Math.floor(displayWidth * dpr);
  tileSize = canvas.width / TILE_COUNT;
  draw();
}

// === Game Loop ===
function gameLoop(t) {
  if (paused || gameOver) {
    draw();
    requestAnimationFrame(gameLoop);
    return;
  }

  const delta = t - lastTime;
  if (delta > 1000 / vel) {
    update();
    lastTime = t;
  }

  draw();
  requestAnimationFrame(gameLoop);
}

function update() {
  lastDir = { ...dir };
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (
    head.x < 0 ||
    head.x >= TILE_COUNT ||
    head.y < 0 ||
    head.y >= TILE_COUNT
  ) {
    return endGame();
  }

  if (snake.some((p) => p.x === head.x && p.y === head.y)) {
    return endGame();
  }

  if (obstacles.some((o) => o.x === head.x && o.y === head.y)) {
    return endGame();
  }

  snake.unshift(head);

  if (food && head.x === food.x && head.y === food.y) {
    score++;
    updateScore();
    vel += 0.15;
    placeFood();
  } else {
    snake.pop();
  }
}

function endGame() {
  gameOver = true;
}

// === Platzierungen ===
function placeObstacles() {
  obstacles = [];
  for (let i = 0; i < OBSTACLE_COUNT; i++) {
    let pos;
    do {
      pos = randPos();
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
    obstacles.push(pos);
  }
}

function placeFood() {
  let pos;
  do {
    pos = randPos();
  } while (
    snake.some((s) => s.x === pos.x && s.y === pos.y) ||
    obstacles.some((o) => o.x === pos.x && o.y === pos.y)
  );
  food = pos;
}

function randPos() {
  return {
    x: Math.floor(Math.random() * TILE_COUNT),
    y: Math.floor(Math.random() * TILE_COUNT),
  };
}

// === Zeichnen ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  obstacles.forEach((o) => drawCell(o.x, o.y, "#b02b2b"));
  if (food) drawCell(food.x, food.y, "#ffd166");
  snake.forEach((s, i) =>
    drawCell(s.x, s.y, i === 0 ? "#6ee7b7" : "#2bd17a", i === 0)
  );

  if (paused) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = `${Math.round(tileSize)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);
  }

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = `24px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 12);
    ctx.font = `16px sans-serif`;
    ctx.fillText("Neustart drücken", canvas.width / 2, canvas.height / 2 + 14);
  }
}

function drawCell(cx, cy, color, head = false) {
  const padding = Math.max(1, Math.round(tileSize * 0.06));
  const x = Math.round(cx * tileSize) + padding;
  const y = Math.round(cy * tileSize) + padding;
  const size = Math.round(tileSize) - padding * 2;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  if (head) {
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(
      x + Math.round(size * 0.12),
      y + Math.round(size * 0.12),
      Math.round(size * 0.22),
      Math.round(size * 0.22)
    );
  }
}

function updateScore() {
  scoreEl.textContent = score;
}

// === Steuerung ===
function setupControls() {
  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
      e.preventDefault();
    if (gameOver) return;
    switch (e.key) {
      case "ArrowUp":
        setDir(0, -1);
        break;
      case "ArrowDown":
        setDir(0, 1);
        break;
      case "ArrowLeft":
        setDir(-1, 0);
        break;
      case "ArrowRight":
        setDir(1, 0);
        break;
    }
  });

  // Hilfsfunktion: handle input
  const handleInput = (btn) => (evt) => {
    // Debug: bei Bedarf einschalten
    // console.log('touch event', evt.type, btn.dataset.dir);

    // Verhindere Scroll/Zoom/etc. wenn möglich
    if (evt.cancelable) evt.preventDefault();
    evt.stopPropagation();

    const d = btn.dataset.dir;
    switch (d) {
      case "up":
        setDir(0, -1);
        break;
      case "down":
        setDir(0, 1);
        break;
      case "left":
        setDir(-1, 0);
        break;
      case "right":
        setDir(1, 0);
        break;
      default:
        break;
    }
  };

  touchArrows.forEach((btn) => {
    // Stelle sicher, dass button kein submit macht
    if (btn.tagName.toLowerCase() === "button" && !btn.hasAttribute("type")) {
      btn.setAttribute("type", "button");
    }

    // CSS: disable default touch actions auf Button selbst (kann auch in CSS gesetzt werden)
    btn.style.touchAction = "none"; // wichtig für pointer events / scroll blocking

    // Pointer events (modern, inkl. iOS Safari 13+)
    try {
      btn.addEventListener("pointerdown", handleInput(btn), { passive: false });
    } catch (e) {
      // falls browser die Optionen nicht unterstützt
      btn.addEventListener("pointerdown", handleInput(btn));
    }

    // Fallbacks: Touch & Mouse (ältere iOS / Android)
    try {
      btn.addEventListener("touchstart", handleInput(btn), { passive: false });
    } catch (e) {
      btn.addEventListener("touchstart", handleInput(btn));
    }
    btn.addEventListener("mousedown", handleInput(btn));

    // Optional: kurze visuelle Rückmeldung bei pointerdown/up
    btn.addEventListener("pointerdown", () => btn.classList.add("active"), {
      passive: true,
    });
    btn.addEventListener("pointerup", () => btn.classList.remove("active"), {
      passive: true,
    });
    btn.addEventListener(
      "pointercancel",
      () => btn.classList.remove("active"),
      { passive: true }
    );
  });

  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    if (!paused) lastTime = performance.now();
  });

  restartBtn.addEventListener("click", () => {
    resetGame();
  });

  motionBtn.addEventListener("click", requestMotionPermission);
}

function requestMotionPermission() {
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    DeviceMotionEvent.requestPermission()
      .then((state) => {
        if (state === "granted") activateTilt();
      })
      .catch(console.warn);
  } else activateTilt();
}

function activateTilt() {
  window.addEventListener("devicemotion", (e) => {
    if (!e.accelerationIncludingGravity) return;
    const ax = e.accelerationIncludingGravity.x;
    const ay = e.accelerationIncludingGravity.y;

    tiltX = tiltX * (1 - tiltSmooth) + ax * tiltSmooth;
    tiltY = tiltY * (1 - tiltSmooth) + ay * tiltSmooth;

    const t = tiltThreshold;
    if (tiltY < -t) setDir(0, 1);
    else if (tiltY > t) setDir(0, -1);
    else if (tiltX > t) setDir(1, 0);
    else if (tiltX < -t) setDir(-1, 0);
  });
}

function setDir(x, y) {
  if (x === -dir.x && y === -dir.y) return;
  dir = { x, y };
}

function resetGame() {
  score = 0;
  updateScore();
  vel = START_VEL;
  gameOver = false;
  paused = false;
  snake = [{ x: 8, y: 8 }];
  dir = { x: 1, y: 0 };
  lastDir = { ...dir };
  placeObstacles();
  placeFood();
  lastTime = performance.now();
  draw();
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// === Start ===
setupControls();
resetGame();
onResize();
requestAnimationFrame(gameLoop);
