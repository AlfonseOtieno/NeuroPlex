/**
 * NeuroPlex — Stationary Object Focus
 * Sustained attention training through visual fixation.
 */

(function StationaryFocusExercise() {
  'use strict';

  const act = ACTIVITIES.find(a => a.id === 'stationary-focus');
  if (act) {
    document.getElementById('act-icon').textContent = act.icon;
    document.getElementById('chip-row').innerHTML = act.chips.map(c=>`<span class="chip">${c}</span>`).join('');
    document.getElementById('benefits-list').innerHTML = act.benefits.map(b=>`<li>${b}</li>`).join('');
    document.getElementById('instructions-list').innerHTML = act.instructions.map(i=>`<li>${i}</li>`).join('');
  }

  const DURATIONS = { easy:30, medium:90, hard:300 };
  let level='easy', duration=30, elapsed=0, running=false, animId=null, lastTs=null;

  const ctrlRow = document.getElementById('ctrl-row');
  const exBody  = document.getElementById('exercise-body');

  /* ── Difficulty labels ───────────────────────────────────── */
  const diffBtns = document.querySelectorAll('.diff-btn[data-level]');
  const labels   = ['Beginner (30s)', 'Intermediate (90s)', 'Advanced (5min)'];
  diffBtns.forEach((btn, i) => {
    btn.textContent = labels[i] || btn.textContent;
    btn.addEventListener('click', () => {
      diffBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      level = btn.dataset.level;
      duration = DURATIONS[level];
      reset();
    });
  });

  ctrlRow.innerHTML = `
    <button class="btn btn-primary btn-sm" id="toggle-btn">▶ Begin Focus</button>
    <button class="btn btn-ghost btn-sm"   id="reset-btn">↺ Reset</button>`;

  document.getElementById('toggle-btn').addEventListener('click', toggle);
  document.getElementById('reset-btn').addEventListener('click', reset);

  /* ── Render UI ───────────────────────────────────────────── */
  exBody.innerHTML = `
    <div class="focus-stage">
      <!-- Candle -->
      <div class="candle-wrap">
        <div class="flame"></div>
        <div class="candle-body"></div>
      </div>

      <!-- Circular countdown -->
      <div class="focus-ring-wrap" role="timer" aria-label="Focus timer">
        <svg width="116" height="116" viewBox="0 0 116 116">
          <circle cx="58" cy="58" r="50"
            stroke="rgba(0,229,255,0.1)" stroke-width="5" fill="none"/>
          <circle cx="58" cy="58" r="50"
            stroke="rgba(0,229,255,0.72)" stroke-width="5" fill="none"
            stroke-dasharray="${(2 * Math.PI * 50).toFixed(2)}"
            stroke-dashoffset="${(2 * Math.PI * 50).toFixed(2)}"
            stroke-linecap="round"
            id="focus-arc"
            style="transform:rotate(-90deg);transform-origin:58px 58px;transition:stroke-dashoffset 0.5s linear;"/>
        </svg>
        <div class="focus-ring-num" id="focus-num" aria-live="polite">
          ${duration}
        </div>
      </div>

      <p class="focus-hint">
        Fix your gaze on the flame. When your mind wanders, gently notice it and return.
        Each return is one repetition of the training.
      </p>
    </div>`;

  const arc      = document.getElementById('focus-arc');
  const numEl    = document.getElementById('focus-num');
  const CIRCUMF  = 2 * Math.PI * 50;

  function updateArc() {
    const pct = elapsed / duration;
    arc.setAttribute('stroke-dashoffset', (CIRCUMF * (1 - pct)).toFixed(2));
    const rem = Math.max(0, Math.ceil(duration - elapsed));
    numEl.textContent = elapsed >= duration ? '✓' : rem >= 60 ? `${Math.floor(rem/60)}m${rem%60}s` : `${rem}s`;
  }

  function animate(ts) {
    if (!running) return;
    if (lastTs !== null) elapsed += Math.min((ts - lastTs) / 1000, 0.1);
    lastTs = ts;
    updateArc();
    if (elapsed >= duration) {
      running = false;
      document.getElementById('toggle-btn').textContent = '▶ Begin Focus';
      return;
    }
    animId = requestAnimationFrame(animate);
    NeuroPlex.addTimer(animId);
  }

  function toggle() {
    if (running) {
      running = false;
      cancelAnimationFrame(animId);
      document.getElementById('toggle-btn').textContent = '▶ Resume';
    } else {
      running = true;
      lastTs  = null;
      document.getElementById('toggle-btn').textContent = '⏸ Pause';
      animId = requestAnimationFrame(animate);
      NeuroPlex.addTimer(animId);
    }
  }

  function reset() {
    running = false;
    elapsed = 0;
    lastTs  = null;
    duration = DURATIONS[level];
    cancelAnimationFrame(animId);
    document.getElementById('toggle-btn').textContent = '▶ Begin Focus';
    updateArc();
  }

  updateArc();
})();
