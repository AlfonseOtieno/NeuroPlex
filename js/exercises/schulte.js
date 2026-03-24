/**
 * NeuroPlex — Schulte Tables Exercise
 * Visual scanning speed training via sequential number search.
 */

(function SchulteExercise() {
  'use strict';

  /* ── State ─────────────────────────────────────────────── */
  function randomCellColor() {
  const palettes = {
    easy:   ['#e8f4f8', '#c8e6f5', '#d4f0e8', '#f0e8f4'],
    medium: ['#00e5ff', '#06ffa5', '#7c3aed', '#ff6b35', '#ffffff'],
    hard:   ['#ff6b35', '#00e5ff', '#06ffa5', '#ffdd44', '#ff44aa', '#44dddd']
  };
  const set = palettes[gridSize === 5 ? 'easy' : gridSize === 6 ? 'medium' : 'hard'];
  return set[Math.floor(Math.random() * set.length)];
}
  let gridSize   = 5;
  let numbers    = [];
  let current    = 1;
  let startTime  = null;
  let running    = false;
  let intervalId = null;
  let wrongClicks = 0;
  let bestTimes   = { 5: null, 6: null, 7: null };

  /* ── DOM refs ───────────────────────────────────────────── */
  const gridEl    = document.getElementById('schulte-grid');
  const findNum   = document.getElementById('find-num');
  const timerEl   = document.getElementById('timer-display');
  const newBtn    = document.getElementById('new-btn');

  /* ── Difficulty buttons ─────────────────────────────────── */
  document.querySelectorAll('.diff-btn[data-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn[data-size]').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      gridSize = parseInt(btn.dataset.size, 10);
      initGame();
    });
  });

  newBtn.addEventListener('click', initGame);

  /* ── Init ────────────────────────────────────────────────── */
  function initGame() {
    clearTimer();
    current   = 1;
    running      = false;
    startTime    = null;
    wrongClicks  = 0;
    updateWrongDisplay();

    const total = gridSize * gridSize;
    numbers = Array.from({ length: total }, (_, i) => i + 1);
    NeuroPlex.shuffle(numbers);

    renderGrid();
    updateHUD();
  }

  /* ── Render Grid ─────────────────────────────────────────── */
  function renderGrid() {
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    // Slightly smaller cells for larger grids
    const baseSize = gridSize === 7 ? 52 : gridSize === 6 ? 58 : 64;
    const variation = gridSize === 5 ? 0 : gridSize === 6 ? 4 : 8;
    const cellSizeNum = baseSize + Math.floor(Math.random() * variation) - Math.floor(variation / 2);
    const cellSize = cellSizeNum + 'px';

    const fontSizes = gridSize === 5
  ? [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.4, 1.6, 1.9, 2.2]
  : gridSize === 6
  ? [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.3, 1.5, 1.8, 2.0]
  : [0.55, 0.65, 0.75, 0.85, 0.95, 1.0, 1.2, 1.4, 1.7, 1.9];

numbers.forEach(n => {
  const cell = document.createElement('button');
  cell.className   = 's-cell';
  cell.textContent = n;
  cell.setAttribute('aria-label', `Number ${n}`);

  const randomFont = fontSizes[Math.floor(Math.random() * fontSizes.length)];

  cell.style.width    = cellSize;
  cell.style.height   = cellSize;
  cell.style.fontSize = randomFont + 'rem';
  cell.style.fontWeight = randomFont >= 1.6 ? '800' : randomFont >= 1.1 ? '700' : '500';
  cell.style.color = randomCellColor();
  cell.addEventListener('click', () => handleCellClick(n, cell));
  gridEl.appendChild(cell);
});
  }

  /* ── Handle Click ────────────────────────────────────────── */
  function handleCellClick(n, cell) {
    /* Start timer on first click */
    if (!running) {
      running   = true;
      startTime = Date.now();
      startTimer();
    }

    const total = gridSize * gridSize;

    if (n === current) {
      cell.classList.add('correct');
      cell.disabled = true;
      current++;
      updateHUD();

      if (current > total) {
       clearTimer();
  running = false;
     const finalTime = (Date.now() - startTime) / 1000;
     if (!bestTimes[gridSize] || finalTime < bestTimes[gridSize]) {
    bestTimes[gridSize] = finalTime;
  }
     const bestStr = NeuroPlex.formatTime(bestTimes[gridSize]);
  findNum.textContent = '';
  document.getElementById('find-label').innerHTML =
    `<span style="color:var(--green)">Done! 🎉</span>`;
  timerEl.innerHTML = `${NeuroPlex.formatTime(finalTime)} &nbsp;<span style="color:var(--green);font-size:0.72rem;">best: ${bestStr}</span>`;
    }
    } else {
      cell.classList.add('wrong');
wrongClicks++;
updateWrongDisplay();
setTimeout(() => cell.classList.remove('wrong'), 380);
    }
  }

  /* ── HUD ─────────────────────────────────────────────────── */
  function updateWrongDisplay() {
  let el = document.getElementById('wrong-count');
  if (!el) {
    el = document.createElement('p');
    el.id = 'wrong-count';
    el.style.cssText = 'font-size:0.82rem;color:rgba(255,107,53,0.8);font-family:var(--font-display);letter-spacing:0.04em;';
    document.querySelector('.schulte-hud').appendChild(el);
  }
  el.textContent = wrongClicks > 0 ? `${wrongClicks} wrong` : '';
}
  function updateHUD() {
    const total = gridSize * gridSize;
    if (current <= total) {
      findNum.textContent = current;
    }
  }

  /* ── Timer ───────────────────────────────────────────────── */
  function startTimer() {
    intervalId = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      timerEl.textContent = NeuroPlex.formatTime(elapsed);
    }, 100);
    NeuroPlex.addTimer(intervalId);
  }

  function clearTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    timerEl.textContent = '00:00.0';
  }

  /* ── Boot ────────────────────────────────────────────────── */
  initGame();

})();
