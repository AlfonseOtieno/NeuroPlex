/**
 * NeuroPlex — Maze Memory Challenge
 * Spatial memory training: memorize then navigate blind.
 */

(function MazeExercise() {
  'use strict';

  const act = ACTIVITIES.find(a => a.id === 'maze');
  if (act) {
    document.getElementById('act-icon').textContent = act.icon;
    document.getElementById('chip-row').innerHTML = act.chips.map(c=>`<span class="chip">${c}</span>`).join('');
    document.getElementById('benefits-list').innerHTML = act.benefits.map(b=>`<li>${b}</li>`).join('');
    document.getElementById('instructions-list').innerHTML = act.instructions.map(i=>`<li>${i}</li>`).join('');
  }

  const CONFIGS = {
    easy:   { cols: 9,  rows: 7,  studyMs: 4000 },
    medium: { cols: 13, rows: 9,  studyMs: 3500 },
    hard:   { cols: 17, rows: 12, studyMs: 3000 }
  };

  let level = 'easy';
  let cfg   = CONFIGS[level];
  let grid  = [];
  let px = 0, py = 0;
  let phase = 'idle';  // idle | study | navigate | solved
  let solved = false;

  const CELL = 28;

  const ctrlRow = document.getElementById('ctrl-row');
  const exBody  = document.getElementById('exercise-body');

  ctrlRow.innerHTML = `
    <button class="btn btn-primary btn-sm" id="new-maze-btn">▶ New Maze</button>`;
  document.getElementById('new-maze-btn').addEventListener('click', initMaze);

  document.querySelectorAll('.diff-btn[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn[data-level]').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      level = btn.dataset.level;
      cfg = CONFIGS[level];
      initMaze();
    });
  });

  /* ── Maze generation (recursive backtracker) ─────────────── */
  function makeMaze(cols, rows) {
    const g = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        top: true, right: true, bottom: true, left: true, visited: false
      }))
    );

    function carve(x, y) {
      g[y][x].visited = true;
      const dirs = [[0,-1,'top','bottom'],[1,0,'right','left'],[0,1,'bottom','top'],[-1,0,'left','right']];
      NeuroPlex.shuffle(dirs);
      for (const [dx, dy, wall, opp] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !g[ny][nx].visited) {
          g[y][x][wall]   = false;
          g[ny][nx][opp]  = false;
          carve(nx, ny);
        }
      }
    }

    carve(0, 0);
    return g;
  }

  /* ── Init ────────────────────────────────────────────────── */
  function initMaze() {
    NeuroPlex.clearTimers();
    grid  = makeMaze(cfg.cols, cfg.rows);
    px    = 0;
    py    = 0;
    solved = false;
    phase = 'study';
    renderMaze();

    const t = setTimeout(() => {
      phase = 'navigate';
      renderMaze();
    }, cfg.studyMs);
    NeuroPlex.addTimer(t);
  }

  /* ── Render ──────────────────────────────────────────────── */
  function renderMaze() {
    const W = cfg.cols * CELL + 1;
    const H = cfg.rows * CELL + 1;

    const statusMessages = {
      study:    `Memorize the maze — ${cfg.studyMs / 1000}s`,
      navigate: 'Navigate with Arrow Keys or WASD',
      solved:   '✓ Solved! 🎉'
    };

    exBody.innerHTML = `
      <div>
        <p id="maze-status" style="font-size:0.85rem;color:var(--cyan);margin-bottom:12px;text-align:center;font-family:var(--font-display);font-weight:700;"
           aria-live="polite">
          ${statusMessages[phase] || ''}
        </p>
        <canvas id="maze-canvas"
          width="${W}" height="${H}"
          style="display:block;margin:0 auto;max-width:100%;border-radius:10px;background:#04070f;"
          aria-label="Maze navigation canvas">
        </canvas>
        <div style="display:flex;gap:10px;align-items:center;justify-content:center;margin-top:14px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" id="new-btn-inner">↺ New Maze</button>
          <span style="font-size:0.76rem;color:var(--text-muted);">Arrow keys / WASD to move</span>
        </div>
      </div>`;

    document.getElementById('new-btn-inner').addEventListener('click', initMaze);
    drawCanvas();
  }

  /* ── Canvas drawing ──────────────────────────────────────── */
  function drawCanvas() {
    const canvas = document.getElementById('maze-canvas');
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const W    = canvas.width;
    const H    = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#04070f';
    ctx.fillRect(0, 0, W, H);

    /* Wall color depends on phase */
    const wallColor = phase === 'study'
      ? 'rgba(0,229,255,0.55)'
      : 'rgba(0,229,255,0.18)';

    ctx.strokeStyle = wallColor;
    ctx.lineWidth   = 1.4;

    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {
        const cell = grid[y][x];
        const cx   = x * CELL;
        const cy   = y * CELL;

        if (cell.top)    { ctx.beginPath(); ctx.moveTo(cx, cy);          ctx.lineTo(cx + CELL, cy);          ctx.stroke(); }
        if (cell.right && x === cfg.cols - 1) { ctx.beginPath(); ctx.moveTo(cx+CELL, cy); ctx.lineTo(cx+CELL, cy+CELL); ctx.stroke(); }
        if (cell.bottom && y === cfg.rows - 1){ ctx.beginPath(); ctx.moveTo(cx, cy+CELL); ctx.lineTo(cx+CELL, cy+CELL); ctx.stroke(); }
        if (cell.left)   { ctx.beginPath(); ctx.moveTo(cx, cy);          ctx.lineTo(cx, cy + CELL);          ctx.stroke(); }
      }
    }

    /* Goal */
    const gx = (cfg.cols - 1) * CELL;
    const gy = (cfg.rows - 1) * CELL;
    ctx.fillStyle = 'rgba(6,255,165,0.12)';
    ctx.fillRect(gx + 2, gy + 2, CELL - 4, CELL - 4);
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏁', gx + CELL / 2, gy + CELL / 2);

    /* Player */
    const playerX = px * CELL + CELL / 2;
    const playerY = py * CELL + CELL / 2;
    ctx.beginPath();
    ctx.arc(playerX, playerY, 7, 0, Math.PI * 2);
    ctx.fillStyle   = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur  = 10;
    ctx.fill();
    ctx.shadowBlur  = 0;
  }

  /* ── Keyboard navigation ─────────────────────────────────── */
  document.addEventListener('keydown', e => {
    if (!document.getElementById('maze-canvas')) return;
    if (phase !== 'navigate' || solved) return;

    const moves = {
      ArrowLeft:  [-1,  0, 'left',   'right'],
      ArrowRight: [ 1,  0, 'right',  'left'],
      ArrowUp:    [ 0, -1, 'top',    'bottom'],
      ArrowDown:  [ 0,  1, 'bottom', 'top'],
      a: [-1,  0, 'left',   'right'],
      d: [ 1,  0, 'right',  'left'],
      w: [ 0, -1, 'top',    'bottom'],
      s: [ 0,  1, 'bottom', 'top'],
    };

    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();

    const [dx, dy, wall] = m;
    const cell = grid[py][px];

    if (!cell[wall]) {
      const nx = px + dx;
      const ny = py + dy;
      if (nx >= 0 && nx < cfg.cols && ny >= 0 && ny < cfg.rows) {
        px = nx; py = ny;

        if (px === cfg.cols - 1 && py === cfg.rows - 1 && !solved) {
          solved = true;
          phase  = 'solved';
          const s = document.getElementById('maze-status');
          if (s) s.textContent = '✓ Solved! 🎉';
        }

        drawCanvas();
      }
    }
  });

  /* ── Boot ────────────────────────────────────────────────── */
  exBody.innerHTML = `
    <div style="text-align:center;padding:28px 0;">
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:18px;">Select difficulty and press New Maze to begin.</p>
      <button class="btn btn-primary" id="boot-btn">▶ New Maze</button>
    </div>`;
  document.getElementById('boot-btn').addEventListener('click', initMaze);

})();
