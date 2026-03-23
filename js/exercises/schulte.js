/**
 * NeuroPlex — Schulte Tables Exercise
 * Visual scanning speed training via sequential number search.
 */

(function SchulteExercise() {
  'use strict';

  /* ── State ─────────────────────────────────────────────── */
  let gridSize   = 5;
  let numbers    = [];
  let current    = 1;
  let startTime  = null;
  let running    = false;
  let intervalId = null;

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
    running   = false;
    startTime = null;

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
    const cellSize = gridSize === 7 ? '52px' : gridSize === 6 ? '58px' : '64px';
    const fontSize = gridSize === 7 ? '0.95rem' : gridSize === 6 ? '1.05rem' : '1.2rem';

    numbers.forEach(n => {
      const cell = document.createElement('button');
      cell.className   = 's-cell';
      cell.textContent = n;
      cell.setAttribute('aria-label', `Number ${n}`);
      cell.style.width    = cellSize;
      cell.style.height   = cellSize;
      cell.style.fontSize = fontSize;
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
        /* Puzzle complete */
        clearTimer();
        running = false;
        findNum.textContent = '';
        document.getElementById('find-label').innerHTML =
          `<span style="color:var(--green)">Done! 🎉</span>`;
      }
    } else {
      cell.classList.add('wrong');
      setTimeout(() => cell.classList.remove('wrong'), 380);
    }
  }

  /* ── HUD ─────────────────────────────────────────────────── */
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
