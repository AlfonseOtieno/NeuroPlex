/**
 * NeuroPlex — Maze Memory Challenge (v2)
 * Spatial memory training: memorize → navigate under fog of war.
 *
 * Phases:
 *  study    → full maze visible, solution path highlighted, countdown timer
 *  navigate → fog of war active, D-pad + swipe controls
 *  solved   → stats shown
 */

(function MazeExercise() {
  'use strict';

  /* ── Populate metadata from activities.js ───────────────── */
  const act = ACTIVITIES.find(a => a.id === 'maze');
  if (act) {
    document.getElementById('act-icon').textContent = act.icon;
    document.getElementById('chip-row').innerHTML =
      act.chips.map(c => `<span class="chip">${c}</span>`).join('');
    document.getElementById('benefits-list').innerHTML =
      act.benefits.map(b => `<li>${b}</li>`).join('');
    document.getElementById('instructions-list').innerHTML =
      act.instructions.map(i => `<li>${i}</li>`).join('');
  }

  /* ── Difficulty configs ──────────────────────────────────── */
  const CONFIGS = {
    easy:   { cols: 7,  rows: 5,  studyMs: 6000, visionRadius: 2, label: 'Beginner'     },
    medium: { cols: 11, rows: 8,  studyMs: 4000, visionRadius: 2, label: 'Intermediate' },
    hard:   { cols: 15, rows: 11, studyMs: 2500, visionRadius: 1, label: 'Advanced'     }
  };

  /* ── State ───────────────────────────────────────────────── */
  let level        = 'easy';
  let cfg          = CONFIGS[level];
  let grid         = [];
  let solutionPath = [];   // array of {x,y} from start to end
  let px = 0, py = 0;     // player position
  let phase        = 'idle';
  let solved       = false;
  let wrongTurns   = 0;
  let totalMoves   = 0;
  let startTime    = null;
  let countdownId  = null;
  let studySecsLeft= 0;

  const CELL = 32;

  /* ── DOM ─────────────────────────────────────────────────── */
  const ctrlRow = document.getElementById('ctrl-row');
  const exBody  = document.getElementById('exercise-body');

  ctrlRow.innerHTML = `
    <button class="btn btn-primary btn-sm" id="new-maze-btn">▶ New Maze</button>`;
  document.getElementById('new-maze-btn').addEventListener('click', initMaze);

  /* ── Difficulty buttons ──────────────────────────────────── */
  document.querySelectorAll('.diff-btn[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn[data-level]').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      level = btn.dataset.level;
      cfg   = CONFIGS[level];
      initMaze();
    });
  });

  /* ══════════════════════════════════════════════════════════
     MAZE GENERATION — Recursive Backtracker (DFS)
     ══════════════════════════════════════════════════════════ */
  function makeMaze(cols, rows) {
    /* 1. Build empty grid — every wall closed */
    const g = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        top: true, right: true, bottom: true, left: true,
        visited: false
      }))
    );

    /* 2. Carve passages with DFS */
    function carve(x, y) {
      g[y][x].visited = true;
      const dirs = [
        [0, -1, 'top',   'bottom'],
        [1,  0, 'right', 'left'  ],
        [0,  1, 'bottom','top'   ],
        [-1, 0, 'left',  'right' ]
      ];
      NeuroPlex.shuffle(dirs);

      for (const [dx, dy, wall, opp] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !g[ny][nx].visited) {
          g[y][x][wall]  = false;   // remove wall on this side
          g[ny][nx][opp] = false;   // remove wall on neighbour's side
          carve(nx, ny);
        }
      }
    }

    carve(0, 0);
    return g;
  }

  /* ── BFS to find solution path ───────────────────────────── */
  /*
   * BFS (Breadth-First Search) always finds the SHORTEST path.
   * We start at (0,0) and expand outward level by level until
   * we reach the goal (cols-1, rows-1).
   * Each node stores its parent so we can trace back the route.
   */
  function findSolutionPath(g, cols, rows) {
    const goal  = { x: cols - 1, y: rows - 1 };
    const queue = [{ x: 0, y: 0, parent: null }];
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    visited[0][0] = true;

    const DIRS = [
      [0, -1, 'top'],
      [1,  0, 'right'],
      [0,  1, 'bottom'],
      [-1, 0, 'left']
    ];

    while (queue.length) {
      const node = queue.shift();

      if (node.x === goal.x && node.y === goal.y) {
        /* Trace back from goal to start */
        const path = [];
        let cur = node;
        while (cur) { path.push({ x: cur.x, y: cur.y }); cur = cur.parent; }
        return path.reverse();
      }

      for (const [dx, dy, wall] of DIRS) {
        const nx = node.x + dx;
        const ny = node.y + dy;
        if (
          nx >= 0 && nx < cols &&
          ny >= 0 && ny < rows &&
          !visited[ny][nx] &&
          !g[node.y][node.x][wall]   // no wall blocking
        ) {
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny, parent: node });
        }
      }
    }
    return []; // should never happen in a perfect maze
  }

  /* ══════════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════════ */
  function initMaze() {
    clearTimeout(countdownId);
    grid         = makeMaze(cfg.cols, cfg.rows);
    solutionPath = findSolutionPath(grid, cfg.cols, cfg.rows);
    px           = 0;
    py           = 0;
    phase        = 'study';
    solved       = false;
    wrongTurns   = 0;
    totalMoves   = 0;
    startTime    = null;
    studySecsLeft = Math.ceil(cfg.studyMs / 1000);

    renderLayout();
    drawCanvas();
    startCountdown();
  }

  /* ══════════════════════════════════════════════════════════
     STUDY COUNTDOWN
     ══════════════════════════════════════════════════════════ */
  function startCountdown() {
    updateStatus();

    countdownId = setInterval(() => {
      studySecsLeft--;
      updateStatus();

      if (studySecsLeft <= 0) {
        clearInterval(countdownId);
        phase     = 'navigate';
        startTime = Date.now();
        updateStatus();
        drawCanvas();
        showDpad();
      }
    }, 1000);
    NeuroPlex.addTimer(countdownId);
  }

  /* ══════════════════════════════════════════════════════════
     LAYOUT RENDER — builds the HTML shell once
     ══════════════════════════════════════════════════════════ */
  function renderLayout() {
    const W = cfg.cols * CELL + 1;
    const H = cfg.rows * CELL + 1;

    exBody.innerHTML = `
      <!-- Status bar -->
      <p id="maze-status"
         style="font-size:0.88rem;color:var(--cyan);margin-bottom:12px;
                text-align:center;font-family:var(--font-display);font-weight:700;
                min-height:22px;"
         aria-live="polite"></p>

      <!-- Stats row (hidden until navigate phase) -->
      <div id="maze-stats"
           style="display:none;justify-content:center;gap:24px;
                  margin-bottom:14px;flex-wrap:wrap;">
        <span style="font-size:0.78rem;color:var(--text-muted);">
          ⏱ <span id="stat-time">0s</span>
        </span>
        <span style="font-size:0.78rem;color:var(--text-muted);">
          ↩ Wrong turns: <span id="stat-wrong" style="color:var(--orange);">0</span>
        </span>
        <span style="font-size:0.78rem;color:var(--text-muted);">
          📍 Moves: <span id="stat-moves">0</span>
        </span>
      </div>

      <!-- Canvas -->
      <canvas id="maze-canvas"
        width="${W}" height="${H}"
        style="display:block;margin:0 auto;max-width:100%;
               border-radius:10px;background:#04070f;"
        aria-label="Maze navigation canvas">
      </canvas>

      <!-- Legend shown during study phase -->
      <div id="maze-legend"
           style="display:flex;gap:16px;justify-content:center;
                  margin-top:12px;flex-wrap:wrap;">
        <span style="font-size:0.75rem;color:var(--text-muted);">🟢 Start</span>
        <span style="font-size:0.75rem;color:var(--text-muted);">🔴 End</span>
        <span style="font-size:0.75rem;color:var(--text-muted);">
          <span style="color:rgba(6,255,165,0.6);">━━</span> Solution path
        </span>
      </div>

      <!-- D-pad (hidden until navigate phase) -->
      <div id="dpad" style="display:none;
           grid-template-areas:'. up .' 'left . right' '. down .';
           grid-template-columns:64px 64px 64px;
           grid-template-rows:64px 64px 64px;
           gap:6px;margin:20px auto 0;width:fit-content;">
        <button data-dir="up"
          style="grid-area:up;background:var(--surface-2);border:1.5px solid var(--border-md);
                 border-radius:12px;font-size:1.4rem;color:var(--cyan);cursor:pointer;">↑</button>
        <button data-dir="left"
          style="grid-area:left;background:var(--surface-2);border:1.5px solid var(--border-md);
                 border-radius:12px;font-size:1.4rem;color:var(--cyan);cursor:pointer;">←</button>
        <button data-dir="right"
          style="grid-area:right;background:var(--surface-2);border:1.5px solid var(--border-md);
                 border-radius:12px;font-size:1.4rem;color:var(--cyan);cursor:pointer;">→</button>
        <button data-dir="down"
          style="grid-area:down;background:var(--surface-2);border:1.5px solid var(--border-md);
                 border-radius:12px;font-size:1.4rem;color:var(--cyan);cursor:pointer;">↓</button>
      </div>

      <!-- Restart button -->
      <div style="text-align:center;margin-top:18px;">
        <button class="btn btn-ghost btn-sm" id="restart-btn">↺ New Maze</button>
      </div>
    `;

    document.getElementById('restart-btn').addEventListener('click', initMaze);
    wireDpad();
  }

  /* ══════════════════════════════════════════════════════════
     CANVAS DRAWING
     ══════════════════════════════════════════════════════════ */
  function drawCanvas() {
    const canvas = document.getElementById('maze-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W   = canvas.width;
    const H   = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#04070f';
    ctx.fillRect(0, 0, W, H);

    /* ── Build a fast lookup set for solution path cells ── */
    const pathSet = new Set(solutionPath.map(p => `${p.x},${p.y}`));

    /* ── Draw each cell ─────────────────────────────────── */
    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {

        /* Fog of war — skip cells outside vision radius during navigate */
        if (phase === 'navigate' || phase === 'solved') {
          const dist = Math.max(Math.abs(x - px), Math.abs(y - py));
          if (dist > cfg.visionRadius) continue;
        }

        const cell = grid[y][x];
        const cx   = x * CELL;
        const cy   = y * CELL;

        /* Cell background */
        if (phase === 'study' && pathSet.has(`${x},${y}`)) {
          /* Solution path highlight */
          ctx.fillStyle = 'rgba(6,255,165,0.08)';
          ctx.fillRect(cx + 1, cy + 1, CELL - 2, CELL - 2);
        }

        /* Walls */
        ctx.strokeStyle = phase === 'study'
          ? 'rgba(0,229,255,0.55)'
          : 'rgba(0,229,255,0.35)';
        ctx.lineWidth = 1.5;

        if (cell.top)    drawLine(ctx, cx,        cy,        cx + CELL, cy       );
        if (cell.bottom) drawLine(ctx, cx,        cy + CELL, cx + CELL, cy + CELL);
        if (cell.left)   drawLine(ctx, cx,        cy,        cx,        cy + CELL);
        if (cell.right)  drawLine(ctx, cx + CELL, cy,        cx + CELL, cy + CELL);
      }
    }

    /* ── Solution path line (study phase only) ──────────── */
    if (phase === 'study' && solutionPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6,255,165,0.55)';
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      solutionPath.forEach((p, i) => {
        const cx = p.x * CELL + CELL / 2;
        const cy = p.y * CELL + CELL / 2;
        i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    }

    /* ── Start marker ───────────────────────────────────── */
    drawMarker(ctx, 0, 0, '🟢');

    /* ── End marker ─────────────────────────────────────── */
    drawMarker(ctx, cfg.cols - 1, cfg.rows - 1, '🔴');

    /* ── Player ─────────────────────────────────────────── */
    const plx = px * CELL + CELL / 2;
    const ply = py * CELL + CELL / 2;
    ctx.beginPath();
    ctx.arc(plx, ply, CELL * 0.28, 0, Math.PI * 2);
    ctx.fillStyle   = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur  = 12;
    ctx.fill();
    ctx.shadowBlur  = 0;

    /* ── Fog overlay border (navigate phase) ────────────── */
    if (phase === 'navigate') {
      drawFogBorder(ctx, W, H);
    }
  }

  function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function drawMarker(ctx, gx, gy, emoji) {
    /* Only draw if within vision in navigate phase */
    if (phase === 'navigate' || phase === 'solved') {
      const dist = Math.max(Math.abs(gx - px), Math.abs(gy - py));
      if (dist > cfg.visionRadius) return;
    }
    ctx.font          = `${CELL * 0.6}px serif`;
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'middle';
    ctx.fillText(emoji, gx * CELL + CELL / 2, gy * CELL + CELL / 2);
  }

  /*
   * Fog border — draws a dark vignette around the visible area
   * so the transition between fog and visible feels natural.
   */
  function drawFogBorder(ctx, W, H) {
    const cx   = px * CELL + CELL / 2;
    const cy   = py * CELL + CELL / 2;
    const r    = (cfg.visionRadius + 0.8) * CELL;

    const grad = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.4);
    grad.addColorStop(0,   'rgba(4,7,15,0)');
    grad.addColorStop(1,   'rgba(4,7,15,0.97)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  /* ══════════════════════════════════════════════════════════
     MOVEMENT
     ══════════════════════════════════════════════════════════ */
  function tryMove(dx, dy, wall) {
    if (phase !== 'navigate' || solved) return;

    const cell = grid[py][px];

    if (!cell[wall]) {
      /* Valid move — wall was carved away */
      px += dx;
      py += dy;
      totalMoves++;
      updateStats();
      drawCanvas();

      /* Check win */
      if (px === cfg.cols - 1 && py === cfg.rows - 1) {
        phase  = 'solved';
        solved = true;
        showSolvedState();
      }
    } else {
      /* Wall hit — wrong turn */
      wrongTurns++;
      updateStats();
      flashWall();
    }
  }

  function flashWall() {
    const canvas = document.getElementById('maze-canvas');
    if (!canvas) return;
    canvas.style.boxShadow = '0 0 18px rgba(255,107,53,0.6)';
    setTimeout(() => { canvas.style.boxShadow = ''; }, 250);
  }

  /* ══════════════════════════════════════════════════════════
     D-PAD + SWIPE WIRING
     ══════════════════════════════════════════════════════════ */
  function wireDpad() {
    const DIRMAP = {
      up:    [0,  -1, 'top'   ],
      down:  [0,   1, 'bottom'],
      left:  [-1,  0, 'left'  ],
      right: [ 1,  0, 'right' ]
    };

    document.querySelectorAll('#dpad button').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = DIRMAP[btn.dataset.dir];
        if (m) tryMove(...m);
      });
    });
  }

  function showDpad() {
    const dpad = document.getElementById('dpad');
    const legend = document.getElementById('maze-legend');
    const stats  = document.getElementById('maze-stats');
    if (dpad)   dpad.style.display   = 'grid';
    if (legend) legend.style.display = 'none';
    if (stats)  stats.style.display  = 'flex';
    startStatsTimer();
  }

  /* ── Swipe ───────────────────────────────────────────────── */
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!document.getElementById('maze-canvas')) return;
    const dx    = e.changedTouches[0].clientX - touchStartX;
    const dy    = e.changedTouches[0].clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 28) return;

    if (absDx > absDy) {
      tryMove(dx > 0 ? 1 : -1, 0, dx > 0 ? 'right' : 'left');
    } else {
      tryMove(0, dy > 0 ? 1 : -1, dy > 0 ? 'bottom' : 'top');
    }
  }, { passive: true });

  /* ── Keyboard (desktop) ──────────────────────────────────── */
  document.addEventListener('keydown', e => {
    if (!document.getElementById('maze-canvas')) return;
    const map = {
      ArrowUp:    [0,  -1, 'top'   ],
      ArrowDown:  [0,   1, 'bottom'],
      ArrowLeft:  [-1,  0, 'left'  ],
      ArrowRight: [ 1,  0, 'right' ],
      w: [0, -1, 'top'], s: [0, 1, 'bottom'],
      a: [-1, 0, 'left'], d: [1, 0, 'right']
    };
    const m = map[e.key];
    if (m) { e.preventDefault(); tryMove(...m); }
  });

  /* ══════════════════════════════════════════════════════════
     STATS & STATUS
     ══════════════════════════════════════════════════════════ */
  let statsTimerId = null;

  function startStatsTimer() {
    if (statsTimerId) clearInterval(statsTimerId);
    statsTimerId = setInterval(() => {
      if (phase !== 'navigate') { clearInterval(statsTimerId); return; }
      updateStats();
    }, 1000);
    NeuroPlex.addTimer(statsTimerId);
  }

  function updateStats() {
    const timeEl  = document.getElementById('stat-time');
    const wrongEl = document.getElementById('stat-wrong');
    const movesEl = document.getElementById('stat-moves');
    if (timeEl && startTime) {
      const secs = Math.floor((Date.now() - startTime) / 1000);
      timeEl.textContent = secs + 's';
    }
    if (wrongEl) wrongEl.textContent = wrongTurns;
    if (movesEl) movesEl.textContent = totalMoves;
  }

  function updateStatus() {
    const el = document.getElementById('maze-status');
    if (!el) return;
    if (phase === 'study') {
      el.textContent = `Memorize the path — ${studySecsLeft}s`;
      el.style.color = 'var(--cyan)';
    } else if (phase === 'navigate') {
      el.textContent = 'Navigate from memory — fog of war active';
      el.style.color = 'var(--text-dim)';
    }
  }

  function showSolvedState() {
    clearInterval(statsTimerId);
    updateStats();

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const optimal   = solutionPath.length - 1;
    const efficiency = optimal > 0
      ? Math.round((optimal / Math.max(totalMoves, optimal)) * 100)
      : 100;

    const el = document.getElementById('maze-status');
    if (el) {
      el.innerHTML = `
        ✓ Solved in <strong style="color:var(--green)">${timeTaken}s</strong>
        &nbsp;·&nbsp;
        Efficiency <strong style="color:var(--green)">${efficiency}%</strong>
        &nbsp;·&nbsp;
        <span style="color:var(--orange)">${wrongTurns} wrong turns</span>
      `;
    }

    drawCanvas();
  }

  /* ══════════════════════════════════════════════════════════
     BOOT
     ══════════════════════════════════════════════════════════ */
  exBody.innerHTML = `
    <div style="text-align:center;padding:28px 0;">
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:18px;">
        Select difficulty and press New Maze.
      </p>
      <button class="btn btn-primary" id="boot-btn">▶ New Maze</button>
    </div>`;
  document.getElementById('boot-btn').addEventListener('click', initMaze);

})();