/**
 * NeuroPlex — Dual-Hand Drawing (v2)
 *
 * Offline exercise. No fake digital interaction.
 * The screen is a guide — the training happens on paper.
 *
 * Science basis:
 *  - Asymmetric bimanual coordination (different shapes per hand)
 *    places maximum demand on corpus callosum interhemispheric
 *    communication (Gooijers & Swinnen, 2014)
 *  - Non-dominant hand drawing training causes measurable
 *    neuroplastic change persisting 6 months post-training
 *    (Hamzei et al., 2016)
 *  - Antiphase > in-phase coordination for neuroplastic demand
 *    — different shapes per hand = antiphase
 *
 * Structure:
 *  - Visual SVG shape references shown side by side (left / right)
 *  - Shapes randomize each session — brain cannot predict
 *  - Within one session, same pair repeated 10x — motor consolidation
 *  - Difficulty = shape complexity, not just different shapes
 *  - Bug fix: shape pair cards now correctly label LEFT and RIGHT
 */

(function DualHandExercise() {
  'use strict';

  /* ── Metadata ────────────────────────────────────────────── */
  const act = ACTIVITIES.find(a => a.id === 'dual-hand');
  if (!act) return;

  document.getElementById('act-icon').textContent      = act.icon;
  document.getElementById('act-desc').textContent      = act.desc;
  document.getElementById('chip-row').innerHTML        = act.chips.map(c => `<span class="chip">${c}</span>`).join('');
  document.getElementById('func-trained').textContent  = act.functionTrained;
  document.getElementById('benefits-list').innerHTML   = act.benefits.map(b => `<li>${b}</li>`).join('');

  /* ══════════════════════════════════════════════════════════
     SHAPE LIBRARY
     Each shape has a name and an SVG path.
     Shapes are grouped by complexity tier.
     ══════════════════════════════════════════════════════════ */
  const SHAPES = {
    /* Tier 1 — basic closed forms */
    basic: [
      {
        name: 'Circle',
        svg: `<circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" stroke-width="3"/>`
      },
      {
        name: 'Square',
        svg: `<rect x="15" y="15" width="90" height="90" fill="none" stroke="currentColor" stroke-width="3"/>`
      },
      {
        name: 'Triangle',
        svg: `<polygon points="60,12 108,108 12,108" fill="none" stroke="currentColor" stroke-width="3"/>`
      },
      {
        name: 'Rectangle',
        svg: `<rect x="10" y="28" width="100" height="64" fill="none" stroke="currentColor" stroke-width="3"/>`
      }
    ],

    /* Tier 2 — moderate complexity */
    intermediate: [
      {
        name: 'Star',
        svg: `<polygon points="60,8 74,45 114,45 82,68 94,108 60,85 26,108 38,68 6,45 46,45"
               fill="none" stroke="currentColor" stroke-width="3"/>`
      },
      {
        name: 'Diamond',
        svg: `<polygon points="60,8 112,60 60,112 8,60"
               fill="none" stroke="currentColor" stroke-width="3"/>`
      },
      {
        name: 'Pentagon',
        svg: `<polygon points="60,8 112,44 92,108 28,108 8,44"
               fill="none" stroke="currentColor" stroke-width="3"/>`
      },
      {
        name: 'Hexagon',
        svg: `<polygon points="60,8 106,33 106,83 60,108 14,83 14,33"
               fill="none" stroke="currentColor" stroke-width="3"/>`
      }
    ],

    /* Tier 3 — high asymmetric complexity */
    advanced: [
      {
        name: 'Spiral',
        svg: `<path d="M60,60 m0,-40 a40,40 0 1,1 -1,0 m1,10 a30,30 0 1,1 -1,0 m1,10 a20,20 0 1,1 -1,0"
               fill="none" stroke="currentColor" stroke-width="3"/>`
      },
      {
        name: 'Figure-8',
        svg: `<path d="M60,30 a30,30 0 1,0 0,60 a30,30 0 1,0 0,-60"
               fill="none" stroke="currentColor" stroke-width="3"/>`
      },
      {
        name: 'Arrow',
        svg: `<path d="M10,60 L90,60 M65,35 L90,60 L65,85"
               fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`
      },
      {
        name: 'Cross',
        svg: `<path d="M60,15 L60,105 M15,60 L105,60"
               fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`
      }
    ]
  };

  /* ── Difficulty levels ───────────────────────────────────── */
  /*
   * Each level defines which shape tiers are used for each hand
   * and how many reps per session.
   * leftTier / rightTier — must be DIFFERENT shapes always
   * reps — repetitions before switching to next pair
   */
  const LEVELS = [
    {
      label:      'Beginner',
      leftTier:   'basic',
      rightTier:  'basic',
      reps:       10,
      science:    'Basic shapes on both hands. The asymmetry (different shape per hand) is enough to challenge the corpus callosum at this stage. Focus on keeping both hands moving simultaneously without pausing.'
    },
    {
      label:      'Intermediate',
      leftTier:   'intermediate',
      rightTier:  'basic',
      reps:       10,
      science:    'Complex shape on one hand, simple on the other. This asymmetry in motor complexity places the highest demand on interhemispheric coordination. Your dominant hemisphere must manage complexity while coordinating with the simpler movement.'
    },
    {
      label:      'Advanced',
      leftTier:   'advanced',
      rightTier:  'intermediate',
      reps:       15,
      science:    'Highly asymmetric shapes on both hands. Research shows antiphase coordination — where each hand performs a structurally different movement — maximizes corpus callosum activation. 15 reps per pair builds genuine motor consolidation.'
    }
  ];

  /* ── Container ───────────────────────────────────────────── */
  const container = document.getElementById('offline-content');

  container.innerHTML = `
    <!-- Science note -->
    <div style="background:rgba(0,229,255,0.05);border:1px solid var(--border);
                border-radius:var(--r-md);padding:14px 18px;margin-bottom:28px;">
      <p style="font-size:0.82rem;color:var(--text-dim);line-height:1.7;">
        <strong style="color:var(--cyan);">🧠 Why this causes neuroplastic change:</strong>
        Drawing different shapes simultaneously with each hand forces interhemispheric
        communication through the corpus callosum. Research shows this type of asymmetric
        bimanual training causes measurable white matter changes in the corpus callosum —
        and improvements persist up to 6 months after training ends.
      </p>
    </div>

    <!-- General instructions -->
    <section aria-labelledby="inst-h" style="margin-bottom:28px;">
      <h2 class="info-block-label" id="inst-h">How to Do This Exercise</h2>
      <ol class="styled-ol">
        <li>Place two sheets of paper side by side — one for each hand.</li>
        <li>Study the shape assigned to each hand in the guide below.</li>
        <li>Pick up a pen in each hand simultaneously.</li>
        <li>Begin drawing both shapes at the same time — do not pause one hand.</li>
        <li>Complete <strong>10 repetitions</strong> of the same pair before switching.</li>
        <li>The moment one hand wants to copy the other is the training stimulus — hold the difference.</li>
      </ol>
    </section>

    <!-- Level selector -->
    <div style="margin-bottom:20px;">
      <p class="info-block-label">Choose Level</p>
      <div class="difficulty-selector" role="group" id="level-tabs">
        ${LEVELS.map((l, i) => `
          <button class="diff-btn${i===0?' active':''}" data-lvl="${i}"
            aria-pressed="${i===0?'true':'false'}">${l.label}</button>`
        ).join('')}
      </div>
    </div>

    <div id="guide-content"></div>
  `;

  /* ── Render guide for selected level ─────────────────────── */
  function renderGuide(idx) {
    const lvl        = LEVELS[idx];
    const leftPool   = [...SHAPES[lvl.leftTier]];
    const rightPool  = [...SHAPES[lvl.rightTier]];

    /* Generate 3 random pairs — left and right always different shapes */
    const pairs = [];
    NeuroPlex.shuffle(leftPool);
    NeuroPlex.shuffle(rightPool);

    for (let i = 0; i < 3; i++) {
      let left  = leftPool[i % leftPool.length];
      let right = rightPool[i % rightPool.length];

      /* Ensure left and right are never the same shape */
      let attempts = 0;
      while (right.name === left.name && attempts < 10) {
        NeuroPlex.shuffle(rightPool);
        right = rightPool[i % rightPool.length];
        attempts++;
      }

      pairs.push({ left, right });
    }

    document.getElementById('guide-content').innerHTML = `
      <div class="offline-guide">

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
          <span class="badge badge-offline">📋 Offline Practice — ${lvl.label}</span>
          <span style="font-size:0.78rem;color:var(--text-muted);">${lvl.reps} reps per pair</span>
        </div>

        <!-- Science rationale -->
        <div style="background:rgba(0,229,255,0.04);border:1px solid var(--border);
                    border-radius:var(--r-md);padding:12px 16px;margin-bottom:22px;">
          <p style="font-size:0.8rem;color:var(--text-dim);line-height:1.65;">
            <strong style="color:var(--cyan);">Why this level:</strong> ${lvl.science}
          </p>
        </div>

        <!-- Shape pair cards -->
        <p class="info-block-label" style="margin-bottom:14px;">
          Shape Pair Assignments — draw one from each pair simultaneously
        </p>

        <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:22px;">
          ${pairs.map((pair, pairIdx) => `
            <div style="background:var(--bg-2);border:1px solid var(--border);
                        border-radius:var(--r-lg);padding:20px;overflow:hidden;">

              <!-- Pair label -->
              <p style="font-size:0.72rem;color:var(--text-muted);
                        letter-spacing:0.08em;text-transform:uppercase;
                        margin-bottom:14px;text-align:center;">
                Pair ${pairIdx + 1} · ${lvl.reps} repetitions
              </p>

              <!-- Two shapes side by side -->
              <div style="display:grid;grid-template-columns:1fr auto 1fr;
                          gap:12px;align-items:center;">

                <!-- LEFT HAND -->
                <div style="text-align:center;">
                  <p style="font-size:0.7rem;font-weight:600;letter-spacing:0.08em;
                            text-transform:uppercase;color:var(--cyan);margin-bottom:8px;">
                    ← Left Hand
                  </p>
                  <div style="background:var(--surface-2);border:1.5px solid rgba(0,229,255,0.25);
                              border-radius:var(--r-md);padding:8px;display:inline-block;">
                    <svg viewBox="0 0 120 120" width="90" height="90"
                         style="color:var(--cyan);" aria-label="${pair.left.name}">
                      ${pair.left.svg}
                    </svg>
                  </div>
                  <p style="font-family:var(--font-display);font-weight:700;
                            font-size:0.88rem;color:var(--cyan);margin-top:6px;">
                    ${pair.left.name}
                  </p>
                </div>

                <!-- Divider -->
                <div style="text-align:center;color:var(--text-muted);
                            font-size:1.2rem;font-weight:300;">+</div>

                <!-- RIGHT HAND -->
                <div style="text-align:center;">
                  <p style="font-size:0.7rem;font-weight:600;letter-spacing:0.08em;
                            text-transform:uppercase;color:var(--green);margin-bottom:8px;">
                    Right Hand →
                  </p>
                  <div style="background:var(--surface-2);border:1.5px solid rgba(6,255,165,0.25);
                              border-radius:var(--r-md);padding:8px;display:inline-block;">
                    <svg viewBox="0 0 120 120" width="90" height="90"
                         style="color:var(--green);" aria-label="${pair.right.name}">
                      ${pair.right.svg}
                    </svg>
                  </div>
                  <p style="font-family:var(--font-display);font-weight:700;
                            font-size:0.88rem;color:var(--green);margin-top:6px;">
                    ${pair.right.name}
                  </p>
                </div>

              </div>
            </div>
          `).join('')}
        </div>

        <!-- Randomize button -->
        <div style="text-align:center;margin-bottom:22px;">
          <button class="btn btn-ghost btn-sm" id="randomize-btn">
            🔀 New Shape Pairs
          </button>
          <p style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;line-height:1.6;">
            Shapes randomize each session so the brain cannot predict the motor program.
          </p>
        </div>

        <!-- Key principle -->
        <div class="pro-tip">
          <strong>💡 The key principle:</strong>
          The moment one hand wants to copy the other's shape — or freezes — is the exact
          moment the corpus callosum is being challenged. Do not stop. Hold the asymmetry.
          That resistance is the training. 10 reps of the same pair in one session
          allows the motor program to consolidate before switching.
        </div>

        <!-- Warning -->
        <div style="margin-top:16px;background:rgba(255,107,53,0.05);
                    border:1px solid rgba(255,107,53,0.18);
                    border-radius:var(--r-md);padding:14px 18px;">
          <p style="font-size:0.82rem;color:var(--text-dim);line-height:1.65;">
            <strong style="color:var(--orange);">⚠️ Do not switch shapes mid-session.</strong>
            Motor consolidation requires repetition of the same program.
            Switching too early prevents the corpus callosum adaptation from forming.
            Complete all ${lvl.reps} reps of one pair before moving to the next.
          </p>
        </div>

      </div>`;

    document.getElementById('randomize-btn').addEventListener('click', () => {
      renderGuide(idx);
    });
  }

  /* ── Level tab listeners ─────────────────────────────────── */
  document.querySelectorAll('#level-tabs .diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#level-tabs .diff-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      renderGuide(parseInt(btn.dataset.lvl, 10));
    });
  });

  /* ── Boot ────────────────────────────────────────────────── */
  renderGuide(0);

})();