/**
 * NeuroPlex — Multiple Object Tracking (MOT) Trainer (v2)
 *
 * Based on the validated 3D-MOT paradigm used in sports science.
 *
 * Round structure (3 phases):
 *  1. HIGHLIGHT  — targets flash cyan for 2s so brain encodes them
 *  2. TRACK      — all balls look identical, user tracks with eyes only
 *  3. ANSWER     — movement stops, user taps what they think are targets
 *                  then correct targets flash green / wrong ones flash red
 *
 * Science basis:
 *  - Max 4 targets matches visual working memory capacity limit
 *  - Overload principle: speed increases on success, drops on failure
 *  - Central fixation option trains peripheral awareness specifically
 */

(function PeripheralExercise() {
  'use strict';

  /* ── Metadata ────────────────────────────────────────────── */
  const act = ACTIVITIES.find(a => a.id === 'peripheral');
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
  /*
   * nBalls       — total balls on screen (targets + distractors)
   * nTargets     — how many to track (science max = 4)
   * trackMs      — how long the tracking phase lasts
   * baseSpeed    — starting ball speed in px/frame
   * fixedCenter  — if true, show a center cross to train peripheral vision
   */
  const CONFIGS = {
    easy:   { nBalls: 4,  nTargets: 1, trackMs: 30000, baseSpeed: 1.2, fixedCenter: false },
    medium: { nBalls: 6,  nTargets: 2, trackMs: 30000, baseSpeed: 2.2, fixedCenter: false },
    hard:   { nBalls: 8,  nTargets: 3, trackMs: 30000, baseSpeed: 3.8, fixedCenter: true  }
  };

  /* ── State ───────────────────────────────────────────────── */
  let level        = 'easy';
  let cfg          = CONFIGS[level];
  let phase        = 'idle';    // idle | highlight | track | answer | feedback
  let balls        = [];
  let animId       = null;
  let phaseTimer   = null;
  let speed        = 2.0;       // adaptive — increases on success
  let roundScore   = 0;
  let roundTotal   = 0;
  let userTaps     = [];        // ball indices the user tapped in answer phase
  let streak       = 0;        // consecutive correct rounds

  /* ── DOM ─────────────────────────────────────────────────── */
  const ctrlRow = document.getElementById('ctrl-row');
  const exBody  = document.getElementById('exercise-body');

  ctrlRow.innerHTML = `
    <button class="btn btn-primary btn-sm" id="start-btn">▶ Start Round</button>
    <button class="btn btn-ghost btn-sm"   id="reset-btn">↺ Reset</button>`;

  document.getElementById('start-btn').addEventListener('click', startRound);
  document.getElementById('reset-btn').addEventListener('click', resetAll);

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
      speed = cfg.baseSpeed;
      streak = 0;
      resetAll();
    });
  });

  /* ── Build canvas ────────────────────────────────────────── */
  exBody.innerHTML = `
    <div id="mot-status"
         style="text-align:center;font-family:var(--font-display);
                font-weight:700;font-size:0.95rem;color:var(--cyan);
                min-height:24px;margin-bottom:12px;"
         aria-live="polite"></div>

    <div style="position:relative;display:inline-block;width:100%;">
      <canvas id="mot-canvas" class="ex-canvas" height="340"
        aria-label="Object tracking canvas"
        style="display:block;border-radius:12px;background:#04070f;"></canvas>
    </div>

    <div id="mot-score"
         style="display:flex;gap:20px;justify-content:center;
                margin-top:14px;flex-wrap:wrap;">
      <span style="font-size:0.8rem;color:var(--text-muted);">
        Score: <span id="score-val" style="color:var(--cyan);font-family:var(--font-display);font-weight:700;">0/0</span>
      </span>
      <span style="font-size:0.8rem;color:var(--text-muted);">
        Streak: <span id="streak-val" style="color:var(--green);font-family:var(--font-display);font-weight:700;">0</span>
      </span>
      <span style="font-size:0.8rem;color:var(--text-muted);">
        Speed: <span id="speed-val" style="color:var(--orange);font-family:var(--font-display);font-weight:700;">${speed.toFixed(1)}x</span>
      </span>
    </div>

    <p style="margin-top:12px;font-size:0.78rem;color:var(--text-muted);
              text-align:center;line-height:1.65;">
      Memorize the highlighted balls → track them as they move →
      tap what you think are the targets when movement stops.
    </p>`;

  const canvas = document.getElementById('mot-canvas');
  const ctx    = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  /* ── Canvas tap handler ──────────────────────────────────── */
  canvas.addEventListener('click', e => {
    if (phase !== 'answer') return;
    const rect = canvas.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) * (canvas.width  / rect.width);
    const my   = (e.clientY - rect.top)  * (canvas.height / rect.height);
    handleTap(mx, my);
  });

  canvas.addEventListener('touchstart', e => {
    if (phase !== 'answer') return;
    e.preventDefault();
    const rect  = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx    = (touch.clientX - rect.left) * (canvas.width  / rect.width);
    const my    = (touch.clientY - rect.top)  * (canvas.height / rect.height);
    handleTap(mx, my);
  }, { passive: false });

  /* ══════════════════════════════════════════════════════════
     BALL CREATION
     ══════════════════════════════════════════════════════════ */
  function createBalls() {
    const W   = canvas.width;
    const H   = canvas.height;
    const R   = 18;
    const arr = [];

    for (let i = 0; i < cfg.nBalls; i++) {
      /* Ensure balls don't spawn on top of each other */
      let x, y, attempts = 0, overlap;
      do {
        x       = R + Math.random() * (W - R * 2);
        y       = R + Math.random() * (H - R * 2);
        overlap = arr.some(b => dist(b.x, b.y, x, y) < R * 3);
        attempts++;
      } while (overlap && attempts < 30);

      arr.push({
        x, y,
        vx:       (Math.random() - 0.5) * speed * 2,
        vy:       (Math.random() - 0.5) * speed * 2,
        r:        R,
        isTarget: i < cfg.nTargets,   // first nTargets are targets
        tapped:   false
      });
    }

    /* Shuffle so targets aren't always the same visual positions */
    NeuroPlex.shuffle(arr);
    /* Re-assign isTarget after shuffle to first nTargets */
    arr.forEach((b, i) => { b.isTarget = i < cfg.nTargets; });
    NeuroPlex.shuffle(arr);

    return arr;
  }

  function dist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  }

  /* ══════════════════════════════════════════════════════════
     ROUND FLOW
     ══════════════════════════════════════════════════════════ */

  /* Phase 1: HIGHLIGHT — targets glow cyan for 2 seconds */
  function startRound() {
    clearTimeout(phaseTimer);
    cancelAnimationFrame(animId);

    cfg      = CONFIGS[level];
    balls    = createBalls();
    userTaps = [];
    phase    = 'highlight';

    setStatus(`Memorize the ${cfg.nTargets === 1 ? 'target' : cfg.nTargets + ' targets'}…`, 'var(--cyan)');
    document.getElementById('start-btn').textContent  = '…';
    document.getElementById('start-btn').disabled     = true;

    drawFrame();

    /* After 2s, switch to track phase */
    phaseTimer = setTimeout(startTracking, 2000);
    NeuroPlex.addTimer(phaseTimer);
  }

  /* Phase 2: TRACK — all balls look identical, user watches */
  function startTracking() {
    phase = 'track';
    setStatus('Track them…', 'var(--text-dim)');
    animateBalls();

    /* After trackMs, stop and ask */
    phaseTimer = setTimeout(startAnswer, cfg.trackMs);
    NeuroPlex.addTimer(phaseTimer);
  }

  /* Phase 3: ANSWER — movement stops, user taps their choices */
  function startAnswer() {
    phase = 'answer';
    cancelAnimationFrame(animId);

    const needed = cfg.nTargets;
    setStatus(`Tap the ${needed === 1 ? 'target ball' : needed + ' target balls'}`, 'var(--orange)');
    drawFrame();
  }

  /* ══════════════════════════════════════════════════════════
     TAP HANDLING
     ══════════════════════════════════════════════════════════ */
  function handleTap(mx, my) {
    if (phase !== 'answer') return;

    /* Find which ball was tapped */
    const tapped = balls.find(b =>
      !b.tapped && dist(mx, my, b.x, b.y) <= b.r + 8
    );

    if (!tapped) return;

    tapped.tapped = true;
    userTaps.push(tapped);

    drawFrame();

    /* Once user has tapped enough balls, show feedback */
    if (userTaps.length >= cfg.nTargets) {
      setTimeout(showFeedback, 200);
    }
  }

  /* ══════════════════════════════════════════════════════════
     FEEDBACK
     ══════════════════════════════════════════════════════════ */
  function showFeedback() {
    phase = 'feedback';

    const correct = userTaps.filter(b => b.isTarget).length;
    const perfect = correct === cfg.nTargets;

    roundTotal++;
    if (perfect) {
      roundScore++;
      streak++;
      /* Adaptive speed — increase on success */
      speed = Math.min(speed + 0.2, 6.0);
    } else {
      streak = 0;
      /* Adaptive speed — decrease on failure */
      speed = Math.max(speed - 0.15, cfg.baseSpeed);
    }

    updateScoreDisplay();
    setStatus(
      perfect ? `Perfect! +speed` : `${correct}/${cfg.nTargets} correct`,
      perfect ? 'var(--green)' : 'var(--orange)'
    );

    drawFrame();  // draws with green/red feedback colors

    /* Re-enable start button after 1.8s */
    phaseTimer = setTimeout(() => {
      const btn = document.getElementById('start-btn');
      if (btn) {
        btn.textContent = '▶ Next Round';
        btn.disabled    = false;
      }
      setStatus('Ready for next round', 'var(--text-muted)');
    }, 1800);
    NeuroPlex.addTimer(phaseTimer);
  }

  /* ══════════════════════════════════════════════════════════
     ANIMATION LOOP (track phase only)
     ══════════════════════════════════════════════════════════ */
  function animateBalls() {
    if (phase !== 'track') return;

    const W = canvas.width;
    const H = canvas.height;

    balls.forEach(b => {
      b.x += b.vx * (speed / cfg.baseSpeed);
      b.y += b.vy * (speed / cfg.baseSpeed);

      /* Bounce off walls */
      if (b.x - b.r < 0)     { b.x = b.r;     b.vx = Math.abs(b.vx); }
      if (b.x + b.r > W)     { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
      if (b.y - b.r < 0)     { b.y = b.r;     b.vy = Math.abs(b.vy); }
      if (b.y + b.r > H)     { b.y = H - b.r; b.vy = -Math.abs(b.vy); }

      /* Collide with other balls */
      balls.forEach(other => {
        if (other === b) return;
        const d = dist(b.x, b.y, other.x, other.y);
        if (d < b.r + other.r) {
          const angle = Math.atan2(other.y - b.y, other.x - b.x);
          b.vx = -Math.cos(angle) * speed;
          b.vy = -Math.sin(angle) * speed;
        }
      });
    });

    drawFrame();
    animId = requestAnimationFrame(animateBalls);
    NeuroPlex.addTimer(animId);
  }

  /* ══════════════════════════════════════════════════════════
     DRAWING
     ══════════════════════════════════════════════════════════ */
  function drawFrame() {
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#04070f';
    ctx.fillRect(0, 0, W, H);

    balls.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);

      if (phase === 'highlight') {
        /* Targets glow cyan, distractors are dim */
        if (b.isTarget) {
          ctx.fillStyle   = 'rgba(0,229,255,0.25)';
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth   = 2.5;
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur  = 18;
        } else {
          ctx.fillStyle   = 'rgba(58,85,112,0.5)';
          ctx.strokeStyle = 'rgba(58,85,112,0.6)';
          ctx.lineWidth   = 1.5;
          ctx.shadowBlur  = 0;
        }
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

      } else if (phase === 'track') {
        /* All balls look identical — no way to cheat visually */
        ctx.fillStyle   = 'rgba(58,85,112,0.6)';
        ctx.strokeStyle = 'rgba(100,140,180,0.5)';
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 0;
        ctx.fill();
        ctx.stroke();

      } else if (phase === 'answer') {
        /*
         * During answer phase we already know which balls are targets
         * so we give immediate green/red feedback on each tap.
         * Untapped balls stay neutral grey.
         */
        if (b.tapped && b.isTarget) {
          /* Correct tap — green */
          ctx.fillStyle   = 'rgba(6,255,165,0.22)';
          ctx.strokeStyle = 'var(--green)';
          ctx.lineWidth   = 2.5;
          ctx.shadowColor = 'rgba(6,255,165,0.5)';
          ctx.shadowBlur  = 12;
        } else if (b.tapped && !b.isTarget) {
          /* Wrong tap — red */
          ctx.fillStyle   = 'rgba(255,80,80,0.2)';
          ctx.strokeStyle = 'rgba(255,80,80,0.8)';
          ctx.lineWidth   = 2.5;
          ctx.shadowColor = 'rgba(255,80,80,0.4)';
          ctx.shadowBlur  = 10;
        } else {
          /* Untapped — neutral */
          ctx.fillStyle   = 'rgba(58,85,112,0.6)';
          ctx.strokeStyle = 'rgba(100,140,180,0.5)';
          ctx.lineWidth   = 1.5;
          ctx.shadowBlur  = 0;
        }
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

      } else if (phase === 'feedback') {
        /* Reveal truth — green = target, red = wrong tap, dim = untapped distractor */
        if (b.isTarget && b.tapped) {
          ctx.fillStyle   = 'rgba(6,255,165,0.25)';
          ctx.strokeStyle = 'var(--green)';
          ctx.lineWidth   = 2.5;
          ctx.shadowColor = 'var(--green)';
          ctx.shadowBlur  = 14;
        } else if (b.isTarget && !b.tapped) {
          /* Missed target — flash green so user sees where it was */
          ctx.fillStyle   = 'rgba(6,255,165,0.12)';
          ctx.strokeStyle = 'rgba(6,255,165,0.6)';
          ctx.lineWidth   = 2;
          ctx.shadowBlur  = 0;
        } else if (!b.isTarget && b.tapped) {
          /* Wrong tap — red */
          ctx.fillStyle   = 'rgba(255,80,80,0.2)';
          ctx.strokeStyle = 'rgba(255,80,80,0.8)';
          ctx.lineWidth   = 2;
          ctx.shadowBlur  = 0;
        } else {
          ctx.fillStyle   = 'rgba(30,50,70,0.4)';
          ctx.strokeStyle = 'rgba(58,85,112,0.3)';
          ctx.lineWidth   = 1;
          ctx.shadowBlur  = 0;
        }
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    /* Central fixation cross (hard mode) */
    if (cfg.fixedCenter && (phase === 'track' || phase === 'answer')) {
      drawCross(W / 2, H / 2);
    }
  }

  function drawCross(cx, cy) {
    ctx.strokeStyle = 'rgba(0,229,255,0.55)';
    ctx.lineWidth   = 1.5;
    const arms = [
      [cx - 20, cy, cx - 10, cy],
      [cx + 10, cy, cx + 20, cy],
      [cx, cy - 20, cx, cy - 10],
      [cx, cy + 10, cx, cy + 20]
    ];
    arms.forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle   = 'rgba(0,229,255,0.7)';
    ctx.shadowColor = 'rgba(0,229,255,0.5)';
    ctx.shadowBlur  = 8;
    ctx.fill();
    ctx.shadowBlur  = 0;
  }

  /* ══════════════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════════════ */
  function setStatus(msg, color) {
    const el = document.getElementById('mot-status');
    if (el) { el.textContent = msg; el.style.color = color; }
  }

  function updateScoreDisplay() {
    const sv = document.getElementById('score-val');
    const stv = document.getElementById('streak-val');
    const spv = document.getElementById('speed-val');
    if (sv)  sv.textContent  = `${roundScore}/${roundTotal}`;
    if (stv) stv.textContent = streak;
    if (spv) spv.textContent = speed.toFixed(1) + 'x';
  }

  function resetAll() {
    clearTimeout(phaseTimer);
    cancelAnimationFrame(animId);
    balls    = [];
    userTaps = [];
    phase    = 'idle';
    speed    = CONFIGS[level].baseSpeed;
    streak   = 0;
    roundScore = 0;
    roundTotal = 0;
    updateScoreDisplay();
    setStatus('Press Start Round to begin', 'var(--text-muted)');
    const btn = document.getElementById('start-btn');
    if (btn) { btn.textContent = '▶ Start Round'; btn.disabled = false; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#04070f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /* ── Boot ────────────────────────────────────────────────── */
  resizeCanvas();
  ctx.fillStyle = '#04070f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setStatus('Press Start Round to begin', 'var(--text-muted)');

})();