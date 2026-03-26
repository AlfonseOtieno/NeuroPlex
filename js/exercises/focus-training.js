/**
 * NeuroPlex — Focus & Distraction Training (v2)
 *
 * Concept: A fixed crosshair sits at the center. Distractions
 * POP UP suddenly at random positions and fade out — like real
 * world interruptions (notifications, movement, noise). The user
 * keeps their eyes locked on the center the entire time.
 *
 * Nothing moves continuously. Everything is a sudden appearance.
 * That sudden appearance is what triggers the attentional pull.
 * Resisting it is the training.
 */

(function FocusTrainingExercise() {
  'use strict';

  /* ── Metadata ────────────────────────────────────────────── */
  const act = ACTIVITIES.find(a => a.id === 'focus-training');
  if (act) {
    document.getElementById('act-icon').textContent = act.icon;
    document.getElementById('chip-row').innerHTML =
      act.chips.map(c => `<span class="chip">${c}</span>`).join('');
    document.getElementById('benefits-list').innerHTML =
      act.benefits.map(b => `<li>${b}</li>`).join('');
    document.getElementById('instructions-list').innerHTML =
      act.instructions.map(i => `<li>${i}</li>`).join('');
  }

  /* ── Distraction content pools ───────────────────────────── */
  /*
   * These are grouped by type so each difficulty introduces
   * a new category of distraction — not just more of the same.
   */
  const POOL = {
    emoji:        ['🔥','💥','⚡','🎉','👀','😱','🚨','💡','🎯','🌀'],
    notification: ['📱 New message','🔔 Someone liked your post',
                   '📧 You have mail','💬 3 new replies',
                   '🔴 Live now','📲 Missed call','🛎 Reminder'],
    movement:     ['●','◆','▲','★','✦','◉','▶'],
    flash:        ['⚠️','🚫','❗','‼️','🆘','📛']
  };

  /* ── Difficulty configs ──────────────────────────────────── */
  /*
   * spawnIntervalMs — how often a new distraction appears (ms)
   * visibleMs       — how long each distraction stays visible
   * maxOnScreen     — maximum distractions visible at once
   * duration        — session length in seconds
   * types           — which distraction pools are active
   * avoidCenter     — radius around center where nothing spawns
   */
  const CONFIGS = {
    easy: {
      spawnIntervalMs: 1800,
      visibleMs:       1200,
      maxOnScreen:     2,
      duration:        30,
      types:           ['emoji'],
      avoidCenter:     80
    },
    medium: {
      spawnIntervalMs: 1100,
      visibleMs:       900,
      maxOnScreen:     4,
      duration:        40,
      types:           ['emoji', 'notification', 'movement'],
      avoidCenter:     60
    },
    hard: {
      spawnIntervalMs: 600,
      visibleMs:       700,
      maxOnScreen:     6,
      duration:        50,
      types:           ['emoji', 'notification', 'movement', 'flash'],
      avoidCenter:     40
    }
  };

  /* ── State ───────────────────────────────────────────────── */
  let level        = 'easy';
  let running      = false;
  let elapsed      = 0;
  let lastTs       = null;
  let animId       = null;
  let spawnId      = null;
  let distractions = [];   // active distraction objects on canvas

  /* ── DOM ─────────────────────────────────────────────────── */
  const ctrlRow = document.getElementById('ctrl-row');
  const exBody  = document.getElementById('exercise-body');

  ctrlRow.innerHTML = `
    <button class="btn btn-primary btn-sm" id="toggle-btn">▶ Start</button>
    <button class="btn btn-ghost btn-sm"   id="reset-btn">↺ Reset</button>`;

  document.getElementById('toggle-btn').addEventListener('click', toggleRun);
  document.getElementById('reset-btn').addEventListener('click', resetExercise);

  document.querySelectorAll('.diff-btn[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn[data-level]').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      level = btn.dataset.level;
      resetExercise();
    });
  });

  /* ── Build canvas ────────────────────────────────────────── */
  exBody.innerHTML = `
    <canvas id="focus-canvas" class="ex-canvas" height="340"
      aria-label="Focus training canvas"></canvas>
    <p style="margin-top:12px;font-size:0.8rem;color:var(--text-muted);
              text-align:center;line-height:1.6;">
      Lock your eyes on the <strong style="color:var(--cyan)">crosshair</strong>.
      Do not look at anything that appears around it.
    </p>`;

  const canvas = document.getElementById('focus-canvas');
  const ctx    = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
  }
  resizeCanvas();
  window.addEventListener('resize', () => { resizeCanvas(); });

  /* ══════════════════════════════════════════════════════════
     DISTRACTION SPAWNING
     ══════════════════════════════════════════════════════════ */
  function spawnDistraction() {
    const cfg = CONFIGS[level];
    if (distractions.length >= cfg.maxOnScreen) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    /* Pick a random position that avoids the center zone */
    let x, y, attempts = 0;
    do {
      x = 24 + Math.random() * (W - 48);
      y = 24 + Math.random() * (H - 48);
      attempts++;
    } while (
      Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < cfg.avoidCenter
      && attempts < 20
    );

    /* Pick a random type from the active pools */
    const type = cfg.types[Math.floor(Math.random() * cfg.types.length)];
    const pool = POOL[type];
    const text = pool[Math.floor(Math.random() * pool.length)];

    /*
     * Each distraction has its own lifetime (bornAt + visibleMs).
     * opacity goes 0 → 1 → 0 over that lifetime for a pop effect.
     */
    distractions.push({
      x, y, text, type,
      bornAt:    performance.now(),
      visibleMs: cfg.visibleMs,
      size:      type === 'notification' ? 11 : 20 + Math.random() * 10
    });
  }

  /* ══════════════════════════════════════════════════════════
     ANIMATION LOOP
     ══════════════════════════════════════════════════════════ */
  function animate(ts) {
    if (!running) return;

    const cfg = CONFIGS[level];
    const W   = canvas.width;
    const H   = canvas.height;
    const now = performance.now();

    if (lastTs !== null) elapsed += Math.min((ts - lastTs) / 1000, 0.1);
    lastTs = ts;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#04070f';
    ctx.fillRect(0, 0, W, H);

    /* ── Draw & age distractions ────────────────────────── */
    distractions = distractions.filter(d => {
      const age     = now - d.bornAt;
      const lifeRatio = age / d.visibleMs;

      if (lifeRatio >= 1) return false;  // expired — remove

      /*
       * Opacity curve: fast fade-in (first 20% of life),
       * hold, then fade-out (last 30% of life).
       * This creates the "pop" feel.
       */
      let opacity;
      if (lifeRatio < 0.2) {
        opacity = lifeRatio / 0.2;          // fade in
      } else if (lifeRatio < 0.7) {
        opacity = 1;                         // hold
      } else {
        opacity = 1 - (lifeRatio - 0.7) / 0.3; // fade out
      }

      ctx.globalAlpha = Math.max(0, opacity);

      if (d.type === 'notification') {
        /* Notification style — pill with text */
        const padding  = 10;
        ctx.font       = `${d.size}px DM Sans, sans-serif`;
        const tw       = ctx.measureText(d.text).width;
        const boxW     = tw + padding * 2;
        const boxH     = d.size + padding;
        const bx       = d.x - boxW / 2;
        const by       = d.y - boxH / 2;

        ctx.fillStyle    = 'rgba(15,29,51,0.92)';
        ctx.strokeStyle  = 'rgba(0,229,255,0.3)';
        ctx.lineWidth    = 1;
        roundRect(ctx, bx, by, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle    = '#e8f4f8';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.text, d.x, d.y);

      } else if (d.type === 'flash') {
        /* Flash — large, red-tinted urgent symbol */
        ctx.font         = `${d.size}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor  = 'rgba(255,80,80,0.6)';
        ctx.shadowBlur   = 10;
        ctx.fillText(d.text, d.x, d.y);
        ctx.shadowBlur   = 0;

      } else if (d.type === 'movement') {
        /* Movement — geometric shape, slightly drifts */
        ctx.font         = `bold ${d.size}px serif`;
        ctx.fillStyle    = `hsl(${180 + Math.random() * 60}, 70%, 65%)`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.text, d.x, d.y);

      } else {
        /* Emoji */
        ctx.font         = `${d.size}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.text, d.x, d.y);
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
      return true;  // keep alive
    });

    /* ── Central crosshair ──────────────────────────────── */
    drawCrosshair(W / 2, H / 2);

    /* ── Progress bar ───────────────────────────────────── */
    const pct = Math.min(elapsed / cfg.duration, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(16, H - 18, W - 32, 3);
    ctx.fillStyle = 'rgba(0,229,255,0.6)';
    ctx.fillRect(16, H - 18, (W - 32) * pct, 3);

    /* Time remaining */
    ctx.fillStyle    = 'rgba(255,255,255,0.2)';
    ctx.font         = '11px DM Sans, sans-serif';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${Math.max(0, Math.ceil(cfg.duration - elapsed))}s`, W - 16, H - 24);

    /* ── Session end ────────────────────────────────────── */
    if (elapsed >= cfg.duration) {
      running = false;
      clearInterval(spawnId);
      showComplete();
      return;
    }

    animId = requestAnimationFrame(animate);
    NeuroPlex.addTimer(animId);
  }

  /* ══════════════════════════════════════════════════════════
     CROSSHAIR DRAWING
     ══════════════════════════════════════════════════════════ */
  function drawCrosshair(cx, cy) {
    /* Outer ring */
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,229,255,0.85)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    /* Center dot */
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle   = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur  = 10;
    ctx.fill();
    ctx.shadowBlur  = 0;

    /* Cross lines */
    const lines = [
      [cx - 26, cy, cx - 16, cy],
      [cx + 16, cy, cx + 26, cy],
      [cx, cy - 26, cx, cy - 16],
      [cx, cy + 16, cx, cy + 26]
    ];
    ctx.strokeStyle = 'rgba(0,229,255,0.4)';
    ctx.lineWidth   = 1;
    lines.forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  }

  /* ── Rounded rect helper ─────────────────────────────────── */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ══════════════════════════════════════════════════════════
     SESSION COMPLETE
     ══════════════════════════════════════════════════════════ */
  function showComplete() {
    const cfg      = CONFIGS[level];
    const toggleBtn = document.getElementById('toggle-btn');
    if (toggleBtn) toggleBtn.textContent = '▶ Start';

    /* Draw completion state on canvas */
    const W  = canvas.width;
    const H  = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#04070f';
    ctx.fillRect(0, 0, W, H);
    drawCrosshair(W / 2, H / 2);

    /* Overlay message */
    ctx.fillStyle    = 'rgba(6,255,165,0.9)';
    ctx.font         = `bold 15px DM Sans, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Session complete — ${cfg.duration}s held`, W / 2, H / 2 + 42);
  }

  /* ══════════════════════════════════════════════════════════
     CONTROLS
     ══════════════════════════════════════════════════════════ */
  function toggleRun() {
    if (running) {
      running = false;
      cancelAnimationFrame(animId);
      clearInterval(spawnId);
      document.getElementById('toggle-btn').textContent = '▶ Resume';
    } else {
      if (elapsed === 0) distractions = [];
      running  = true;
      lastTs   = null;
      document.getElementById('toggle-btn').textContent = '⏸ Pause';

      /* Start spawning distractions on an interval */
      const cfg = CONFIGS[level];
      clearInterval(spawnId);
      spawnId = setInterval(spawnDistraction, cfg.spawnIntervalMs);
      NeuroPlex.addTimer(spawnId);

      animId = requestAnimationFrame(animate);
      NeuroPlex.addTimer(animId);
    }
  }

  function resetExercise() {
    running = false;
    cancelAnimationFrame(animId);
    clearInterval(spawnId);
    distractions = [];
    elapsed      = 0;
    lastTs       = null;
    document.getElementById('toggle-btn').textContent = '▶ Start';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#04070f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawCrosshair(canvas.width / 2, canvas.height / 2);
  }

  /* ── Boot ────────────────────────────────────────────────── */
  resizeCanvas();
  ctx.fillStyle = '#04070f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCrosshair(canvas.width / 2, canvas.height / 2);

})();