/**
 * NeuroPlex — RSVP Speed Reading Exercise
 * Rapid Serial Visual Presentation for reading speed training.
 */

(function RSVPExercise() {
  'use strict';

  const PASSAGES = [
    `The brain is not static. It is a living dynamic organ that reshapes itself in response to experience thought and deliberate practice. Every challenge you undertake carves new grooves into your neural architecture. The connections you use grow stronger. The ones you neglect fade away. This is not metaphor this is biology. The neurons in your prefrontal cortex your hippocampus your cerebellum they physically change based on what you repeatedly do and think. Training your attention is therefore one of the highest leverage investments you can make in the quality of your mind and life.`,
    `Deliberate practice is the engine of all expert performance. It is not the same as simply doing something repeatedly. It requires focused attention a specific goal and immediate feedback. The pianist who plays scales mindlessly builds habit but not skill. The one who practices with intention noticing every error correcting in real time builds genuine mastery. The brain responds to challenge not to comfort. Growth happens at the edge of competence not inside the comfort zone. Push into difficulty consistently and your brain will adapt in remarkable ways.`,
    `Neuroplasticity is the capacity of neurons and neural networks in the brain to change their connections and behaviour in response to new information sensory stimulation development damage or dysfunction. It was once thought that the brain was fixed and unchangeable after childhood. Modern neuroscience has overturned this entirely. Every experience leaves a physical trace in your brain. Every skill you build makes a physical change. Your brain is not the limit of who you can become it is the raw material you shape through your choices every single day.`
  ];

  let words      = [];
  let idx        = 0;
  let wpm        = 200;
  let running    = false;
  let intervalId = null;

  const wordEl   = document.getElementById('rsvp-word');
  const fillEl   = document.getElementById('rsvp-fill');
  const wpmBadge = document.getElementById('wpm-badge');
  const slider   = document.getElementById('wpm-slider');
  const playBtn  = document.getElementById('play-btn');
  const resetBtn = document.getElementById('reset-btn');

  /* ── Difficulty preset buttons ──────────────────────────── */
  document.querySelectorAll('.diff-btn[data-wpm]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn[data-wpm]').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      wpm = parseInt(btn.dataset.wpm, 10);
      slider.value = wpm;
      wpmBadge.textContent = `${wpm} WPM`;
      if (running) { stopRSVP(); startRSVP(); }
    });
  });

  slider.addEventListener('input', () => {
    wpm = parseInt(slider.value, 10);
    wpmBadge.textContent = `${wpm} WPM`;
    if (running) { stopRSVP(); startRSVP(); }
  });

  playBtn.addEventListener('click', () => {
    if (running) {
      stopRSVP();
      playBtn.textContent = '▶ Resume';
    } else {
      if (idx >= words.length) loadPassage();
      startRSVP();
      playBtn.textContent = '⏸ Pause';
    }
  });

  resetBtn.addEventListener('click', () => {
    stopRSVP();
    loadPassage();
    playBtn.textContent = '▶ Start';
  });

  /* ── Passage ─────────────────────────────────────────────── */
  function loadPassage() {
    const text = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    words = text.split(' ').filter(Boolean);
    idx   = 0;
    wordEl.textContent = 'Ready';
    fillEl.style.width = '0%';
  }

  /* ── Playback ────────────────────────────────────────────── */
  function startRSVP() {
    running = true;
    const ms = Math.round(60000 / wpm);

    intervalId = setInterval(() => {
      if (idx >= words.length) {
        stopRSVP();
        wordEl.textContent = '✓ Complete';
        playBtn.textContent = '▶ Start';
        return;
      }
      wordEl.textContent = words[idx];
      fillEl.style.width = ((idx / words.length) * 100).toFixed(1) + '%';
      idx++;
    }, ms);

    NeuroPlex.addTimer(intervalId);
  }

  function stopRSVP() {
    running = false;
    clearInterval(intervalId);
    intervalId = null;
  }

  /* ── Boot ────────────────────────────────────────────────── */
  loadPassage();

})();
