/**
 * NeuroPlex — Grid Memory Challenge
 * Visual and positional working memory training.
 */

(function MemoryGridExercise() {
  'use strict';

  /* ── Populate metadata from activities.js ───────────────── */
  const act = ACTIVITIES.find(a => a.id === 'memory-grid');
  if (act) {
    document.getElementById('act-icon').textContent = act.icon;
    document.getElementById('chip-row').innerHTML = act.chips.map(c => `<span class="chip">${c}</span>`).join('');
    document.getElementById('benefits-list').innerHTML = act.benefits.map(b => `<li>${b}</li>`).join('');
    document.getElementById('instructions-list').innerHTML = act.instructions.map(i => `<li>${i}</li>`).join('');
  }

  /* ── Emoji pool ──────────────────────────────────────────── */
  const EMOJIS = ['🍎','🐶','⭐','🌊','🔥','🌙','🦋','🎸','🍕','🌈','🐸','💎','🚀','🌺','🦁','🍦','🎯','🌍','🏆','🎪'];

  /* ── Config per difficulty ──────────────────────────────── */
  const CONFIGS = {
    easy:   { cols: 3, rows: 2, studyMs: 4000 },
    medium: { cols: 4, rows: 3, studyMs: 4000 },
    hard:   { cols: 5, rows: 4, studyMs: 3500 }
  };

  /* ── State ──────────────────────────────────────────────── */
  let level       = 'easy';
  let cfg         = CONFIGS[level];
  let items       = [];        // { emoji, idx }
  let highlighted = [];        // indices to remember
  let phase       = 'idle';    // idle | study | recall | done
  let recallIdx   = 0;

  /* ── DOM ─────────────────────────────────────────────────── */
  const ctrlRow = document.getElementById('ctrl-row');
  const exBody  = document.getElementById('exercise-body');

  ctrlRow.innerHTML = `<button class="btn btn-ghost btn-sm" id="start-btn">▶ Start</button>`;
  document.getElementById('start-btn').addEventListener('click', initGame);

  /* ── Difficulty ─────────────────────────────────────────── */
  document.querySelectorAll('.diff-btn[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn[data-level]').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      level = btn.dataset.level;
      cfg = CONFIGS[level];
      phase = 'idle';
      renderIdle();
    });
  });

  /* ── Game flow ───────────────────────────────────────────── */
  function initGame() {
    NeuroPlex.clearTimers();
    cfg = CONFIGS[level];
    const total = cfg.cols * cfg.rows;
    const pool = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, total);
    items = pool.map((emoji, idx) => ({ emoji, idx }));

    // Pick random subset to highlight (half the cells)
    const shuffledIdx = Array.from({ length: total }, (_, i) => i);
    NeuroPlex.shuffle(shuffledIdx);
    highlighted = shuffledIdx.slice(0, Math.ceil(total / 2));

    recallIdx = 0;
    phase = 'study';
    renderGrid();

    const timer = setTimeout(() => {
      phase = 'recall';
      renderGrid();
    }, cfg.studyMs);
    NeuroPlex.addTimer(timer);
  }

  /* ── Render ──────────────────────────────────────────────── */
  function renderIdle() {
    exBody.innerHTML = `
      <div class="memory-outer" style="padding:28px 0;">
        <p style="color:var(--text-dim);font-size:0.9rem;text-align:center;margin-bottom:20px;">Press Start to begin a new round.</p>
        <div style="text-align:center;">
          <button class="btn btn-primary" id="start-btn-inner">▶ Start</button>
        </div>
      </div>`;
    document.getElementById('start-btn-inner').addEventListener('click', initGame);
  }

  function renderGrid() {
    const msgMap = {
      study:  `Memorize the highlighted positions — ${(cfg.studyMs / 1000).toFixed(0)}s`,
      recall: `Tap the highlighted cells in order (${recallIdx + 1} / ${highlighted.length})`,
      done:   '✓ Complete! 🧠'
    };

    exBody.innerHTML = `
      <div class="memory-outer">
        <p class="memory-phase-msg" aria-live="polite">${msgMap[phase] || ''}</p>
        <div class="memory-grid" id="mem-grid"
             style="grid-template-columns:repeat(${cfg.cols},1fr);margin-bottom:16px;"></div>
        <button class="btn btn-ghost btn-sm" id="restart-btn">↺ New Round</button>
      </div>`;

    const grid = document.getElementById('mem-grid');

    items.forEach(({ emoji, idx }) => {
      const cell = document.createElement('div');
      const isHighlighted = highlighted.includes(idx);
      cell.className = 'mem-cell';

      if (phase === 'study') {
        cell.textContent = emoji;
        if (isHighlighted) cell.classList.add('highlighted');
      } else if (phase === 'recall') {
        cell.classList.add('hidden');
        cell.addEventListener('click', () => handleRecallClick(idx, cell));
      } else if (phase === 'done') {
        cell.textContent = emoji;
        if (isHighlighted) cell.classList.add('correct');
      }

      grid.appendChild(cell);
    });

    document.getElementById('restart-btn').addEventListener('click', initGame);
  }

  function renderIdle() {
    exBody.innerHTML = `
      <div class="memory-outer" style="padding:24px 0;text-align:center;">
        <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:18px;">Select difficulty above, then press Start.</p>
        <button class="btn btn-primary" id="start-btn-idle">▶ Start</button>
      </div>`;
    document.getElementById('start-btn-idle').addEventListener('click', initGame);
  }

  function handleRecallClick(idx, cell) {
    if (phase !== 'recall') return;

    const expected = highlighted[recallIdx];

    if (idx === expected) {
      cell.classList.remove('hidden');
      cell.classList.add('correct');
      cell.textContent = items[idx].emoji;
      recallIdx++;

      if (recallIdx >= highlighted.length) {
        phase = 'done';
        setTimeout(renderGrid, 400);
      }
    } else {
      cell.classList.add('wrong');
      setTimeout(() => cell.classList.remove('wrong'), 400);
    }
  }

  /* ── Boot ─────────────────────────────────────────────────── */
  renderIdle();

})();
