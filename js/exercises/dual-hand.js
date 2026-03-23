/**
 * NeuroPlex — Dual-Hand Drawing (Offline Exercise)
 * Populates activity metadata and renders the offline practice guide.
 */

(function DualHandExercise() {
  'use strict';

  const act = ACTIVITIES.find(a => a.id === 'dual-hand');
  if (!act) return;

  /* ── Populate header metadata ────────────────────────────── */
  document.getElementById('act-icon').textContent = act.icon;
  document.getElementById('act-desc').textContent = act.desc;
  document.getElementById('chip-row').innerHTML   = act.chips.map(c => `<span class="chip">${c}</span>`).join('');
  document.getElementById('func-trained').textContent = act.functionTrained;
  document.getElementById('benefits-list').innerHTML  = act.benefits.map(b => `<li>${b}</li>`).join('');

  /* ── Offline guide ───────────────────────────────────────── */
  const LEVELS = [
    {
      label: 'Beginner',
      title: 'Simple Shape Pairs',
      steps: [
        'Prepare two sheets of paper and a pen or pencil for each hand.',
        'Left hand: draw a circle. Right hand: draw a triangle. Start both simultaneously.',
        'Keep both pens moving at the same pace — do not pause either hand.',
        'Complete 10 repetitions of the same shape pair before switching.',
        'Rest for 30 seconds, then repeat with new shapes.'
      ],
      shapes: [
        { left: 'Circle', right: 'Triangle' },
        { left: 'Square', right: 'Circle' },
        { left: 'Triangle', right: 'Square' }
      ]
    },
    {
      label: 'Intermediate',
      title: 'Complex Shape Pairs',
      steps: [
        'Use the same dual-paper setup from Beginner level.',
        'Left hand: draw a star. Right hand: draw a spiral simultaneously.',
        'Both hands must draw different shapes at the same time without pausing.',
        'Switch shape assignments between sets — left becomes right and vice versa.',
        'Aim for 15 reps per pair. Notice which combinations feel most difficult.'
      ],
      shapes: [
        { left: 'Star', right: 'Spiral' },
        { left: 'Figure-8', right: 'Rectangle' },
        { left: 'Pentagon', right: 'Diamond' }
      ]
    },
    {
      label: 'Advanced',
      title: 'Asymmetric Complexity',
      steps: [
        'Left hand draws complex shapes (star, spiral, polygon). Right hand draws simple shapes (circle, square).',
        'Add a timed element: complete 10 pairs in under 30 seconds.',
        'Try the exercise with your eyes closed — rely on proprioception alone.',
        'Alternate dominant/non-dominant roles: give the harder shape to your weaker hand.',
        'Ultimate challenge: both hands draw complex shapes simultaneously for 60 seconds.'
      ],
      shapes: [
        { left: 'Spiral', right: 'Circle' },
        { left: 'Star (5pt)', right: 'Triangle' },
        { left: 'Figure-8', right: 'Square' }
      ]
    }
  ];

  /* ── Render ──────────────────────────────────────────────── */
  const container = document.getElementById('offline-content');

  /* Instructions from data */
  container.innerHTML = `
    <section aria-labelledby="inst-h" style="margin-bottom:28px;">
      <h2 class="info-block-label" id="inst-h">General Instructions</h2>
      <ol class="styled-ol">
        ${act.instructions.map(i => `<li>${i}</li>`).join('')}
      </ol>
    </section>

    <!-- Level tabs -->
    <div style="margin-bottom:20px;">
      <p class="info-block-label">Choose Level</p>
      <div class="difficulty-selector" role="group" aria-label="Select practice level" id="level-tabs">
        ${LEVELS.map((l, i) => `
          <button class="diff-btn${i===0?' active':''}" data-lvl="${i}"
            aria-pressed="${i===0?'true':'false'}">${l.label}</button>
        `).join('')}
      </div>
    </div>

    <div id="guide-content"></div>
  `;

  function renderGuide(idx) {
    const lvl = LEVELS[idx];
    document.getElementById('guide-content').innerHTML = `
      <div class="offline-guide">
        <span class="badge badge-offline" style="margin-bottom:16px;">📋 Offline Practice — ${lvl.label}</span>
        <h3 style="font-family:var(--font-display);font-weight:700;font-size:1.05rem;margin-bottom:16px;">${lvl.title}</h3>

        <ol class="styled-ol" style="margin-bottom:22px;">
          ${lvl.steps.map(s => `<li>${s}</li>`).join('')}
        </ol>

        <p class="info-block-label" style="margin-bottom:12px;">Shape Pair Assignments</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;">
          ${lvl.shapes.map(pair => `
            <div class="info-block" style="text-align:center;">
              <p style="font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;letter-spacing:0.06em;">LEFT HAND</p>
              <p style="font-family:var(--font-display);font-weight:700;color:var(--cyan);font-size:0.95rem;margin-bottom:8px;">${pair.left}</p>
              <p style="font-size:0.7rem;color:var(--text-muted);margin-bottom:4px;">RIGHT HAND</p>
              <p style="font-family:var(--font-display);font-weight:700;color:var(--green);font-size:0.95rem;">${pair.right}</p>
            </div>
          `).join('')}
        </div>

        <div class="pro-tip">
          <strong>💡 Why this works:</strong>
          The feeling of one hand freezing or defaulting to the other's pattern
          <em>is</em> the training stimulus. Your corpus callosum is being forced to
          coordinate two independent motor programs simultaneously — exactly the
          adaptation you are building.
        </div>
      </div>
    `;
  }

  document.querySelectorAll('#level-tabs .diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#level-tabs .diff-btn').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      renderGuide(parseInt(btn.dataset.lvl, 10));
    });
  });

  renderGuide(0);

})();
