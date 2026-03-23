/**
 * NeuroPlex — Focus & Distraction Training
 * Selective attention training against moving distractors.
 */

(function FocusTrainingExercise() {
  'use strict';

  /* ── Populate metadata ───────────────────────────────────── */
  const act = ACTIVITIES.find(a => a.id === 'focus-training');
  if (act) {
    document.getElementById('act-icon').textContent = act.icon;
    document.getElementById('chip-row').innerHTML = act.chips.map(c => `<span class="chip">${c}</span>`).join('');
    document.getElementById('benefits-list').innerHTML = act.benefits.map(b => `<li>${b}</li>`).join('');
    document.getElementById('instructions-list').innerHTML = act.instructions.map(i => `<li>${i}</li>`).join('');
  }

  /* ── Config ─────────────────────────────────────────────── */
  const CONFIGS = {
    easy:   { count: 5,  speed: 1.8, duration: 25 },
    medium: { count: 10, speed: 2.5, duration: 35 },
    hard:   { count: 18, speed: 3.5, duration: 45 }
  };

  const EMOJIS = ['🔴','🟠','🟡','🟢','🔵','🟣','⬛','🟤','🌀','💫'];

  /* ── State ──────────────────────────────────────────────── */
  let level    = 'easy';
  let running  = false;
  let animId   = null;
  let objects  = [];
  let elapsed  = 0;
  let lastTs   = null;

  /* ── Build UI ───────────────────────────────────────────── */
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
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      level = btn.dataset.level;
      resetExercise();
    });
  });

  /* ── Canvas ─────────────────────────────────────────────── */
  exBody.innerHTML = `
    <canvas id="focus-canvas" class="ex-canvas" height="320" aria-label="Focus training canvas"></canvas>
    <div style="margin-top:12px;font-size:0.8rem;color:var(--text-muted);text-align:center;">
      Keep your eyes on the <strong style="color:var(--cyan)">glowing crosshair</strong> in the center.
    </div>`;

  const canvas = document.getElementById('focus-canvas');
  const ctx    = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  /* ── Objects ─────────────────────────────────────────────── */
  function initObjects() {
    const cfg = CONFIGS[level];
    const W = canvas.width, H = canvas.height;
    objects = Array.from({ length: cfg.count }, () => ({
      x:     20 + Math.random() * (W - 40),
      y:     20 + Math.random() * (H - 40),
      vx:    (Math.random() - 0.5) * cfg.speed * 2,
      vy:    (Math.random() - 0.5) * cfg.speed * 2,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      size:  22 + Math.random() * 14
    }));
    elapsed = 0;
    lastTs  = null;
  }

  /* ── Animation ───────────────────────────────────────────── */
  function animate(ts) {
    if (!running) return;

    const W = canvas.width, H = canvas.height;
    const cfg = CONFIGS[level];

    if (lastTs !== null) elapsed += Math.min((ts - lastTs) / 1000, 0.1);
    lastTs = ts;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#04070f';
    ctx.fillRect(0, 0, W, H);

    /* Distractors */
    objects.forEach(o => {
      o.x += o.vx; o.y += o.vy;
      if (o.x < 15 || o.x > W - 15) o.vx *= -1;
      if (o.y < 15 || o.y > H - 15) o.vy *= -1;

      ctx.globalAlpha = 0.75;
      ctx.font        = `${o.size}px serif`;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.emoji, o.x, o.y);
      ctx.globalAlpha = 1;
    });

    /* Central target */
    const cx = W / 2, cy = H / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,229,255,0.9)';
    ctx.lineWidth   = 2;
    ctx.stroke();

    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle   = 'rgba(0,229,255,1)';
    ctx.shadowColor = 'rgba(0,229,255,0.8)';
    ctx.shadowBlur  = 12;
    ctx.fill();
    ctx.shadowBlur  = 0;

    ['moveTo','lineTo','moveTo','lineTo','moveTo','lineTo','moveTo','lineTo'].forEach((fn, i) => {
      ctx.strokeStyle = 'rgba(0,229,255,0.3)';
      ctx.lineWidth = 1;
      if (i === 0) { ctx.beginPath(); ctx.moveTo(cx-28,cy); }
      if (i === 1) { ctx.lineTo(cx-17,cy); ctx.stroke(); }
      if (i === 2) { ctx.beginPath(); ctx.moveTo(cx+17,cy); }
      if (i === 3) { ctx.lineTo(cx+28,cy); ctx.stroke(); }
      if (i === 4) { ctx.beginPath(); ctx.moveTo(cx,cy-28); }
      if (i === 5) { ctx.lineTo(cx,cy-17); ctx.stroke(); }
      if (i === 6) { ctx.beginPath(); ctx.moveTo(cx,cy+17); }
      if (i === 7) { ctx.lineTo(cx,cy+28); ctx.stroke(); }
    });

    /* Progress bar */
    const pct = Math.min(elapsed / cfg.duration, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(16, H - 20, W - 32, 4);
    ctx.fillStyle = 'rgba(0,229,255,0.65)';
    ctx.fillRect(16, H - 20, (W - 32) * pct, 4);

    /* Time remaining */
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '11px DM Sans, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.max(0, Math.ceil(cfg.duration - elapsed))}s`, W - 16, H - 26);

    if (elapsed >= cfg.duration) {
      running = false;
      document.getElementById('toggle-btn').textContent = '▶ Start';
      return;
    }

    animId = requestAnimationFrame(animate);
    NeuroPlex.addTimer(animId);
  }

  /* ── Controls ───────────────────────────────────────────── */
  function toggleRun() {
    if (running) {
      running = false;
      cancelAnimationFrame(animId);
      document.getElementById('toggle-btn').textContent = '▶ Resume';
    } else {
      if (elapsed === 0) initObjects();
      running = true;
      document.getElementById('toggle-btn').textContent = '⏸ Pause';
      animId = requestAnimationFrame(animate);
      NeuroPlex.addTimer(animId);
    }
  }

  function resetExercise() {
    running = false;
    cancelAnimationFrame(animId);
    initObjects();
    document.getElementById('toggle-btn').textContent = '▶ Start';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#04070f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /* ── Boot ────────────────────────────────────────────────── */
  initObjects();

})();
