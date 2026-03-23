/**
 * NeuroPlex — Bimanual Hand Signs (Offline Exercise)
 * Motor-cognitive integration through independent bilateral hand control.
 */

(function BimanualExercise() {
  'use strict';

  const act = ACTIVITIES.find(a => a.id === 'bimanual');
  if (!act) return;

  document.getElementById('act-icon').textContent = act.icon;
  document.getElementById('act-desc').textContent = act.desc;
  document.getElementById('chip-row').innerHTML   = act.chips.map(c => `<span class="chip">${c}</span>`).join('');
  document.getElementById('func-trained').textContent = act.functionTrained;
  document.getElementById('benefits-list').innerHTML  = act.benefits.map(b => `<li>${b}</li>`).join('');

  /* ── Sign pairs data ─────────────────────────────────────── */
  const SIGN_PAIRS = [
    { left: '✌️ Peace',     right: '👍 Thumbs Up' },
    { left: '🤞 Crossed',  right: '✋ Open Palm' },
    { left: '👆 Point Up', right: '✌️ Peace' },
    { left: '🤙 Hang Loose',right: '👊 Fist' },
    { left: '👌 OK',       right: '🤞 Crossed' },
    { left: '✋ Open Palm', right: '👆 Point Up' },
    { left: '👊 Fist',     right: '🤙 Hang Loose' },
    { left: '👍 Thumbs Up', right: '👌 OK' },
  ];

  const PROGRAMS = [
    {
      level: 'Beginner',
      title: 'Static Hold Pairs',
      description: 'Hold two different signs simultaneously. Build independent hand control.',
      steps: [
        'Sit in front of a mirror so you can verify both hands.',
        'Form the LEFT hand sign shown in each pair below.',
        'Simultaneously form the RIGHT hand sign.',
        'Hold both signs for 5 seconds. Release. Repeat.',
        'Complete all 8 pairs without resting between them.',
        'If one hand defaults to the other\'s sign, that is the training signal — hold it there.'
      ],
      duration: 5,
      pairs: SIGN_PAIRS.slice(0, 4)
    },
    {
      level: 'Intermediate',
      title: 'Dynamic Switch Sequence',
      description: 'Switch between sign pairs on a timed beat. Build reaction speed and bilateral independence.',
      steps: [
        'Set a phone timer or use an online metronome at 60 BPM.',
        'On each beat, switch to the next sign pair in the sequence.',
        'Both hands must change simultaneously.',
        'Complete the full 8-pair loop 3 times without stopping.',
        'Increase to 80 BPM when 3 loops feel fluent.',
        'Track which transitions cause the most hesitation — those are your priority targets.'
      ],
      duration: 2,
      pairs: SIGN_PAIRS
    },
    {
      level: 'Advanced',
      title: 'Asymmetric Sequence',
      description: 'One hand holds static. The other cycles through a sequence. Ultimate bilateral independence.',
      steps: [
        'Left hand holds a fixed sign (e.g., OK) for the entire exercise.',
        'Right hand cycles through all 8 signs in sequence, one every 2 seconds.',
        'Left hand must not move or change during the full right-hand cycle.',
        'Switch roles: right hand holds static, left hand cycles.',
        'Final challenge: both hands independently cycle through different sequences at the same time.',
        'Record video of your hands to objectively assess bilateral independence.'
      ],
      duration: 2,
      pairs: SIGN_PAIRS
    }
  ];

  /* ── Interval display feature ────────────────────────────── */
  let displayTimer = null;
  let currentPairIdx = 0;
  let isRunning = false;

  const container = document.getElementById('offline-content');

  container.innerHTML = `
    <section aria-labelledby="inst-h" style="margin-bottom:28px;">
      <h2 class="info-block-label" id="inst-h">General Instructions</h2>
      <ol class="styled-ol">
        ${act.instructions.map(i => `<li>${i}</li>`).join('')}
      </ol>
    </section>

    <div style="margin-bottom:20px;">
      <p class="info-block-label">Choose Level</p>
      <div class="difficulty-selector" role="group" id="prog-tabs">
        ${PROGRAMS.map((p, i) => `
          <button class="diff-btn${i===0?' active':''}" data-prog="${i}"
            aria-pressed="${i===0?'true':'false'}">${p.level}</button>
        `).join('')}
      </div>
    </div>

    <div id="program-content"></div>
  `;

  function renderProgram(idx) {
    const prog = PROGRAMS[idx];
    clearTimeout(displayTimer);
    isRunning = false;
    currentPairIdx = 0;

    document.getElementById('program-content').innerHTML = `
      <div class="offline-guide">
        <span class="badge badge-offline" style="margin-bottom:16px;">🤲 Offline Practice — ${prog.level}</span>
        <h3 style="font-family:var(--font-display);font-weight:700;font-size:1.05rem;margin-bottom:8px;">${prog.title}</h3>
        <p style="color:var(--text-dim);font-size:0.88rem;line-height:1.65;margin-bottom:18px;">${prog.description}</p>

        <ol class="styled-ol" style="margin-bottom:22px;">
          ${prog.steps.map(s => `<li>${s}</li>`).join('')}
        </ol>

        <!-- Interactive Pair Display -->
        <p class="info-block-label" style="margin-bottom:12px;">Sign Pair Reference</p>
        <div style="background:var(--bg);border:1px solid var(--border-md);border-radius:var(--r-md);padding:24px;margin-bottom:18px;text-align:center;">
          <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;margin-bottom:18px;">
            <div>
              <p style="font-size:0.7rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">LEFT HAND</p>
              <p id="left-sign" style="font-family:var(--font-display);font-weight:800;font-size:1.3rem;color:var(--cyan);">
                ${prog.pairs[0].left}
              </p>
            </div>
            <div style="color:var(--text-muted);font-size:1.2rem;">+</div>
            <div>
              <p style="font-size:0.7rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">RIGHT HAND</p>
              <p id="right-sign" style="font-family:var(--font-display);font-weight:800;font-size:1.3rem;color:var(--green);">
                ${prog.pairs[0].right}
              </p>
            </div>
          </div>
          <p id="pair-counter" style="font-size:0.78rem;color:var(--text-muted);margin-bottom:14px;">
            Pair 1 of ${prog.pairs.length}
          </p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="auto-cycle-btn">▶ Auto Cycle (${prog.duration}s)</button>
            <button class="btn btn-ghost btn-sm"   id="prev-btn">← Prev</button>
            <button class="btn btn-ghost btn-sm"   id="next-btn">Next →</button>
          </div>
          <p id="cycle-status" style="font-size:0.78rem;color:var(--text-dim);margin-top:10px;min-height:18px;"></p>
        </div>

        <div class="pro-tip">
          <strong>💡 Elite cue:</strong>
          The moment you notice one hand hesitating or copying the other — freeze.
          That gap between intention and execution is exactly where the neural growth
          happens. Hold the difficult combination for 3 extra seconds before releasing.
        </div>
      </div>
    `;

    function updatePairDisplay() {
      const pair = prog.pairs[currentPairIdx];
      const leftEl   = document.getElementById('left-sign');
      const rightEl  = document.getElementById('right-sign');
      const countEl  = document.getElementById('pair-counter');
      if (leftEl)  leftEl.textContent  = pair.left;
      if (rightEl) rightEl.textContent = pair.right;
      if (countEl) countEl.textContent = `Pair ${currentPairIdx + 1} of ${prog.pairs.length}`;
    }

    document.getElementById('prev-btn').addEventListener('click', () => {
      stopCycle();
      currentPairIdx = (currentPairIdx - 1 + prog.pairs.length) % prog.pairs.length;
      updatePairDisplay();
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      stopCycle();
      currentPairIdx = (currentPairIdx + 1) % prog.pairs.length;
      updatePairDisplay();
    });

    document.getElementById('auto-cycle-btn').addEventListener('click', () => {
      if (isRunning) { stopCycle(); return; }
      startCycle(prog);
    });

    function startCycle(p) {
      isRunning = true;
      document.getElementById('auto-cycle-btn').textContent = '⏸ Stop';
      const statusEl = document.getElementById('cycle-status');
      if (statusEl) statusEl.textContent = 'Cycling…';

      function cycle() {
        currentPairIdx = (currentPairIdx + 1) % p.pairs.length;
        updatePairDisplay();
        if (isRunning) {
          displayTimer = setTimeout(cycle, p.duration * 1000);
          NeuroPlex.addTimer(displayTimer);
        }
      }

      displayTimer = setTimeout(cycle, p.duration * 1000);
      NeuroPlex.addTimer(displayTimer);
    }

    function stopCycle() {
      isRunning = false;
      clearTimeout(displayTimer);
      const btn = document.getElementById('auto-cycle-btn');
      if (btn) btn.textContent = `▶ Auto Cycle (${prog.duration}s)`;
      const statusEl = document.getElementById('cycle-status');
      if (statusEl) statusEl.textContent = '';
    }
  }

  document.querySelectorAll('#prog-tabs .diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#prog-tabs .diff-btn').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      renderProgram(parseInt(btn.dataset.prog, 10));
    });
  });

  renderProgram(0);

})();
