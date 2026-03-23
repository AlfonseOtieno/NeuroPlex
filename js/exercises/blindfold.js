/**
 * NeuroPlex — Blindfold Tasks (Offline Exercise)
 * Proprioception and motor memory training without visual feedback.
 */

(function BlindfoldExercise() {
  'use strict';

  const act = ACTIVITIES.find(a => a.id === 'blindfold');
  if (!act) return;

  document.getElementById('act-icon').textContent = act.icon;
  document.getElementById('act-desc').textContent = act.desc;
  document.getElementById('chip-row').innerHTML   = act.chips.map(c => `<span class="chip">${c}</span>`).join('');
  document.getElementById('func-trained').textContent = act.functionTrained;
  document.getElementById('benefits-list').innerHTML  = act.benefits.map(b => `<li>${b}</li>`).join('');

  const TASKS = [
    {
      level: 'Beginner',
      title: 'Letter & Number Writing',
      icon: '✏️',
      description: 'Build clean motor programs for the most fundamental writing strokes.',
      steps: [
        'Take a sheet of lined paper. Close your eyes or put on a sleep mask.',
        'Write the numbers 1 through 20 in a single row from left to right.',
        'Open your eyes and assess: are they legible? Spaced evenly? On the line?',
        'Identify the 3 most malformed characters — these are your weak motor programs.',
        'Repeat the exercise focusing specifically on those characters.',
        'Progress target: all 20 numbers legible and evenly spaced on a single line.'
      ],
      bonus: 'Try writing the alphabet A–Z. Letters with diagonal strokes (k, x, z) are hardest.'
    },
    {
      level: 'Intermediate',
      title: 'Blindfold Typing',
      icon: '⌨️',
      description: 'Build a complete, visual-independent typing motor program.',
      steps: [
        'Open any text editor. Increase font size so results are easy to read.',
        'Cover your hands and keyboard with a cloth, or simply close your eyes.',
        'Type this sentence from memory: "The quick brown fox jumps over the lazy dog."',
        'Do not correct mistakes as you go — finish the sentence entirely.',
        'Open your eyes, read back the result, and note every error.',
        'Repeat 5 times. Track your accuracy rate across repetitions.'
      ],
      bonus: 'Advanced: type 3 full sentences back-to-back without opening your eyes between them.'
    },
    {
      level: 'Advanced',
      title: 'Complex Shape Tracing',
      icon: '📐',
      description: 'Trace complex spatial forms entirely from proprioceptive memory.',
      steps: [
        'Draw a reference shape on paper: a 5-pointed star, a house outline, or a hexagon.',
        'Study it for 10 seconds, then flip it face-down.',
        'Close your eyes. On a blank sheet, attempt to reproduce the shape from memory using only your sense of hand position.',
        'Open your eyes and compare the two shapes — assess size accuracy, proportions, and closure.',
        'Aim for 5 consecutive reproductions that match the original within 80% accuracy.',
        'Upgrade: trace multi-element diagrams (simple floor plans, circuit symbols).'
      ],
      bonus: 'The elite version: reproduce a short code snippet (3–4 lines) on paper from memory with eyes closed.'
    }
  ];

  const container = document.getElementById('offline-content');

  container.innerHTML = `
    <section aria-labelledby="inst-h" style="margin-bottom:28px;">
      <h2 class="info-block-label" id="inst-h">General Instructions</h2>
      <ol class="styled-ol">
        ${act.instructions.map(i => `<li>${i}</li>`).join('')}
      </ol>
    </section>

    <div style="margin-bottom:20px;">
      <p class="info-block-label">Choose Task</p>
      <div class="difficulty-selector" role="group" id="task-tabs">
        ${TASKS.map((t, i) => `
          <button class="diff-btn${i===0?' active':''}" data-task="${i}"
            aria-pressed="${i===0?'true':'false'}">${t.icon} ${t.level}</button>
        `).join('')}
      </div>
    </div>

    <div id="task-content"></div>
  `;

  function renderTask(idx) {
    const t = TASKS[idx];
    document.getElementById('task-content').innerHTML = `
      <div class="offline-guide">
        <span class="badge badge-offline" style="margin-bottom:16px;">🙈 Offline Practice — ${t.level}</span>
        <h3 style="font-family:var(--font-display);font-weight:700;font-size:1.05rem;margin-bottom:8px;">${t.icon} ${t.title}</h3>
        <p style="color:var(--text-dim);font-size:0.88rem;line-height:1.65;margin-bottom:18px;">${t.description}</p>

        <ol class="styled-ol" style="margin-bottom:18px;">
          ${t.steps.map(s => `<li>${s}</li>`).join('')}
        </ol>

        <div class="pro-tip">
          <strong>💡 Bonus challenge:</strong> ${t.bonus}
        </div>

        <div style="margin-top:18px;background:rgba(255,107,53,0.06);border:1px solid rgba(255,107,53,0.18);
          border-radius:var(--r-md);padding:14px 18px;">
          <p style="font-size:0.82rem;color:var(--text-dim);line-height:1.65;">
            <strong style="color:var(--orange);">⚠️ Remember:</strong>
            The goal is not to perform perfectly — it is to build motor programs independent of visual
            feedback. Errors are data, not failures. Study them carefully.
          </p>
        </div>
      </div>
    `;
  }

  document.querySelectorAll('#task-tabs .diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#task-tabs .diff-btn').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      renderTask(parseInt(btn.dataset.task, 10));
    });
  });

  renderTask(0);

})();
