/**
 * NeuroPlex — Bimanual Hand Signs (v3)
 * Emoji-based visual signs. Two signs swap between hands on a timer.
 */

(function BimanualExercise() {
  'use strict';

  /* ── Metadata ────────────────────────────────────────────── */
  const act = ACTIVITIES.find(a => a.id === 'bimanual');
  if (!act) return;

  document.getElementById('act-icon').textContent      = act.icon;
  document.getElementById('act-desc').textContent      = act.desc;
  document.getElementById('chip-row').innerHTML        = act.chips.map(c => `<span class="chip">${c}</span>`).join('');
  document.getElementById('func-trained').textContent  = act.functionTrained;
  document.getElementById('benefits-list').innerHTML   = act.benefits.map(b => `<li>${b}</li>`).join('');

  /* ── Sign library — emojis only ──────────────────────────── */
  const SIGNS = {
    FIST:      { emoji: '✊' },
    OPEN_PALM: { emoji: '✋' },
    POINT:     { emoji: '☝️' },
    THUMBS_UP: { emoji: '👍' },
    PEACE:     { emoji: '✌️' },
    OK:        { emoji: '👌' }
  };

  /*
   * Three pairs chosen for maximum motor asymmetry:
   *  Pair 1 — FIST vs OPEN PALM: all fingers closed vs all extended
   *  Pair 2 — POINT vs THUMBS UP: different single-digit extension
   *  Pair 3 — PEACE vs OK: two-finger vs circle formation
   */
  const SIGN_PAIRS = [
    { a: SIGNS.FIST,  b: SIGNS.OPEN_PALM },
    { a: SIGNS.POINT, b: SIGNS.THUMBS_UP },
    { a: SIGNS.PEACE, b: SIGNS.OK        }
  ];

  /* ── Difficulty configs ──────────────────────────────────── */
  const CONFIGS = {
    easy:   { holdMs: 6000, label: 'Beginner',     description: '6 seconds per position — enough time to consciously form each sign before the swap.' },
    medium: { holdMs: 4000, label: 'Intermediate', description: '4 seconds — the swap comes before the sign feels fully comfortable. That discomfort is the training.' },
    hard:   { holdMs: 2500, label: 'Advanced',     description: '2.5 seconds — fast enough that you must pre-plan the next sign while holding the current one.' }
  };

  /* ── State ───────────────────────────────────────────────── */
  let level       = 'easy';
  let currentPair = 0;
  let swapped     = false;
  let running     = false;
  let swapTimer   = null;
  let sessionTimer= null;
  let elapsed     = 0;
  const SESSION_DURATION = 120;

  /* ── Container ───────────────────────────────────────────── */
  const container = document.getElementById('offline-content');

  container.innerHTML = `

    <!-- Science note -->
    <div style="background:rgba(0,229,255,0.05);border:1px solid var(--border);
                border-radius:var(--r-md);padding:14px 18px;margin-bottom:28px;">
      <p style="font-size:0.82rem;color:var(--text-dim);line-height:1.7;">
        <strong style="color:var(--cyan);">🧠 Why this causes neuroplastic change:</strong>
        Swapping two signs between hands forces the brain to reassign motor programs
        to opposite hemispheres — overriding the default tendency to mirror both hands.
        This asymmetric bimanual training activates the supplementary motor area,
        primary motor cortex, and corpus callosum simultaneously.
        The resistance you feel when one hand wants to copy the other IS the training signal.
      </p>
    </div>

    <!-- Instructions -->
    <section style="margin-bottom:28px;">
      <h2 class="info-block-label">How to Do This Exercise</h2>
      <ol class="styled-ol">
        <li>Sit with both hands visible — or use a mirror.</li>
        <li>Form the sign shown on the LEFT side with your left hand.</li>
        <li>Form the sign shown on the RIGHT side with your right hand simultaneously.</li>
        <li>Hold both signs until the bar empties — then swap your hands to match the new display.</li>
        <li>Do not rush the swap. That 1–2 second reorganization moment is the training.</li>
        <li>When one hand wants to copy the other — hold the asymmetry. Do not let it.</li>
      </ol>
    </section>

    <!-- Speed selector -->
    <div style="margin-bottom:16px;">
      <p class="info-block-label">Speed</p>
      <div class="difficulty-selector" id="diff-tabs">
        ${Object.entries(CONFIGS).map(([key, cfg], i) => `
          <button class="diff-btn${i===0?' active':''}" data-level="${key}"
            aria-pressed="${i===0?'true':'false'}">${cfg.label}</button>`
        ).join('')}
      </div>
      <p id="diff-desc"
         style="font-size:0.78rem;color:var(--text-muted);margin-top:8px;line-height:1.6;">
        ${CONFIGS.easy.description}
      </p>
    </div>

    <!-- Sign pair selector -->
    <div style="margin-bottom:20px;">
      <p class="info-block-label">Sign Pair</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;" id="pair-tabs">
        ${SIGN_PAIRS.map((_, i) => `
          <button class="diff-btn${i===0?' active':''}" data-pair="${i}"
            aria-pressed="${i===0?'true':'false'}">Pair ${i + 1}</button>`
        ).join('')}
      </div>
    </div>

    <!-- Exercise display -->
    <div style="background:var(--bg-2);border:1px solid var(--border-md);
                border-radius:var(--r-lg);padding:24px;margin-bottom:20px;">

      <div id="sign-display"
           style="display:grid;grid-template-columns:1fr auto 1fr;
                  gap:16px;align-items:center;margin-bottom:20px;">
      </div>

      <!-- Hold bar -->
      <div style="background:var(--surface-2);border-radius:4px;
                  height:5px;margin-bottom:16px;overflow:hidden;">
        <div id="hold-bar"
             style="height:100%;width:100%;border-radius:4px;
                    background:linear-gradient(90deg,var(--cyan),var(--green));"></div>
      </div>

      <!-- Controls -->
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-primary" id="start-stop-btn">▶ Start</button>
        <button class="btn btn-ghost btn-sm" id="reset-btn-ex">↺ Reset</button>
      </div>

      <p id="session-status"
         style="text-align:center;font-size:0.78rem;color:var(--text-muted);
                margin-top:10px;min-height:18px;" aria-live="polite"></p>
    </div>

    <!-- Pro tip -->
    <div class="pro-tip">
      <strong>💡 The key moment:</strong>
      The instant the display swaps and your hands must reorganize —
      that 1–2 second window is where the neuroplastic change happens.
      Sit in that moment deliberately. Do not rush past it.
    </div>
  `;

  /* ── Event listeners ─────────────────────────────────────── */
  document.querySelectorAll('#diff-tabs .diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#diff-tabs .diff-btn').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      level = btn.dataset.level;
      const descEl = document.getElementById('diff-desc');
      if (descEl) descEl.textContent = CONFIGS[level].description;
      stopSession(); resetDisplay();
    });
  });

  document.querySelectorAll('#pair-tabs .diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#pair-tabs .diff-btn').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      currentPair = parseInt(btn.dataset.pair);
      stopSession(); resetDisplay();
    });
  });

  document.getElementById('start-stop-btn').addEventListener('click', () => {
    if (running) stopSession(); else startSession();
  });

  document.getElementById('reset-btn-ex').addEventListener('click', () => {
    stopSession(); resetDisplay();
  });

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */
  function renderSigns() {
    const pair      = SIGN_PAIRS[currentPair];
    const leftSign  = swapped ? pair.b : pair.a;
    const rightSign = swapped ? pair.a : pair.b;
    const display   = document.getElementById('sign-display');
    if (!display) return;

    display.innerHTML = `

      <!-- Left hand -->
      <div style="text-align:center;">
        <p style="font-size:0.68rem;font-weight:600;letter-spacing:0.1em;
                  text-transform:uppercase;color:var(--cyan);margin-bottom:10px;">
          ← Left Hand
        </p>
        <div style="background:var(--surface-2);border:1.5px solid rgba(0,229,255,0.28);
                    border-radius:var(--r-md);padding:16px;display:inline-block;
                    font-size:3.5rem;line-height:1;">
          ${leftSign.emoji}
        </div>
      </div>

      <!-- Divider -->
      <div style="text-align:center;color:var(--text-muted);font-size:1.2rem;">⇄</div>

      <!-- Right hand -->
      <div style="text-align:center;">
        <p style="font-size:0.68rem;font-weight:600;letter-spacing:0.1em;
                  text-transform:uppercase;color:var(--green);margin-bottom:10px;">
          Right Hand →
        </p>
        <div style="background:var(--surface-2);border:1.5px solid rgba(6,255,165,0.28);
                    border-radius:var(--r-md);padding:16px;display:inline-block;
                    font-size:3.5rem;line-height:1;">
          ${rightSign.emoji}
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════════
     SESSION
     ══════════════════════════════════════════════════════════ */
  function startSession() {
    running = true;
    elapsed = 0;
    swapped = false;
    document.getElementById('start-stop-btn').textContent = '⏸ Pause';
    renderSigns();
    scheduleSwap();
    startSessionTimer();
  }

  function scheduleSwap() {
    const cfg = CONFIGS[level];
    animateHoldBar(cfg.holdMs);
    swapTimer = setTimeout(() => {
      if (!running) return;
      swapped = !swapped;
      renderSigns();
      scheduleSwap();
    }, cfg.holdMs);
    NeuroPlex.addTimer(swapTimer);
  }

  function animateHoldBar(durationMs) {
    const bar = document.getElementById('hold-bar');
    if (!bar) return;
    bar.style.transition = 'none';
    bar.style.width      = '100%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = `width ${durationMs}ms linear`;
        bar.style.width      = '0%';
      });
    });
  }

  function startSessionTimer() {
    const statusEl = document.getElementById('session-status');
    sessionTimer = setInterval(() => {
      elapsed++;
      const remaining = SESSION_DURATION - elapsed;
      if (statusEl) {
        statusEl.textContent = remaining > 0
          ? `${remaining}s remaining`
          : 'Session complete — rest 60 seconds before repeating.';
      }
      if (elapsed >= SESSION_DURATION) {
        stopSession();
        document.getElementById('start-stop-btn').textContent = '▶ Start';
      }
    }, 1000);
    NeuroPlex.addTimer(sessionTimer);
  }

  function stopSession() {
    running = false;
    clearTimeout(swapTimer);
    clearInterval(sessionTimer);
    document.getElementById('start-stop-btn').textContent = '▶ Start';
    const bar = document.getElementById('hold-bar');
    if (bar) { bar.style.transition = 'none'; bar.style.width = '100%'; }
  }

  function resetDisplay() {
    swapped = false;
    elapsed = 0;
    renderSigns();
    const statusEl = document.getElementById('session-status');
    if (statusEl) statusEl.textContent = '';
    const bar = document.getElementById('hold-bar');
    if (bar) { bar.style.transition = 'none'; bar.style.width = '100%'; }
  }

  /* ── Boot ────────────────────────────────────────────────── */
  renderSigns();

})();