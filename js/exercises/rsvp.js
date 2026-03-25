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

  let words        = [];
  let idx          = 0;
  let wpm          = 200;
  let startWpm     = 200;  // remember starting speed for stats
  let running      = false;
  let intervalId   = null;
  let autoIncrease = false;

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
    wpm = startWpm;
    wpmBadge.textContent = `${wpm} WPM`;
    slider.value = wpm;
    loadPassage();
    playBtn.textContent = '▶ Start';
  });

  /* Auto-increase toggle button — added below the slider in the HTML */
  const autoBtn = document.getElementById('auto-increase-btn');
  if (autoBtn) {
    autoBtn.addEventListener('click', () => {
      autoIncrease = !autoIncrease;
      autoBtn.textContent   = autoIncrease ? '⚡ Auto On'  : '⚡ Auto Off';
      autoBtn.style.borderColor = autoIncrease ? 'var(--green)' : '';
      autoBtn.style.color       = autoIncrease ? 'var(--green)' : '';
    });
  }

  /* ── Passage ─────────────────────────────────────────────── */
  function loadPassage() {
    const text = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    words = text.split(' ').filter(Boolean);
    idx   = 0;
    wordEl.innerHTML = '<span style="color:var(--text-muted)">Ready</span>';
    fillEl.style.width = '0%';
  }

  /*
   * renderWord — splits the word at the Optimal Recognition Point (ORP).
   * Research shows your eye naturally anchors ~30% into a word.
   * Highlighting that letter in cyan trains your eye to land there
   * instantly, reducing the micro-movements that slow reading down.
   */
  function renderWord(word) {
    if (word.length <= 1) {
      wordEl.innerHTML = `<span style="color:var(--cyan)">${word}</span>`;
      return;
    }

    /* ORP = roughly 30% into the word, minimum index 0 */
    const orp    = Math.max(0, Math.floor(word.length * 0.3) - 1);
    const before = word.slice(0, orp);
    const focus  = word[orp];
    const after  = word.slice(orp + 1);

    wordEl.innerHTML =
      `<span style="color:var(--text-dim)">${before}</span>` +
      `<span style="color:var(--cyan);text-decoration:underline;
        text-underline-offset:4px;">${focus}</span>` +
      `<span style="color:var(--text)">${after}</span>`;
  }

  /* ── Playback ────────────────────────────────────────────── */
  function startRSVP() {
    running = true;
    scheduleNext();
  }

  function scheduleNext() {
    if (!running) return;

    if (idx >= words.length) {
      stopRSVP();
      showComprehensionCheck();
      return;
    }

    const word    = words[idx];
    const baseMs  = Math.round(60000 / wpm);

    /* Pause longer on punctuation — brain needs time to process meaning */
    const hasPause = word.endsWith('.') || word.endsWith(',') ||
                     word.endsWith('?') || word.endsWith('!') ||
                     word.endsWith(';') || word.endsWith(':');
    const delay = hasPause ? baseMs * 2.2 : baseMs;

    renderWord(word);
    fillEl.style.width = ((idx / words.length) * 100).toFixed(1) + '%';
    idx++;

    /* Auto speed increase every 10 words */
    if (idx % 10 === 0 && autoIncrease) {
      wpm = Math.min(wpm + 15, 700);
      wpmBadge.textContent = `${wpm} WPM`;
      slider.value = wpm;
    }

    intervalId = setTimeout(scheduleNext, delay);
    NeuroPlex.addTimer(intervalId);
  }

  function stopRSVP() {
    running = false;
    clearInterval(intervalId);
    intervalId = null;
  }
  
  
  /* ── Comprehension questions per passage ─────────────────── */
  const QUESTIONS = [
    {
      passage: 0,
      questions: [
        { q: 'What physically changes in the brain with practice?',
          options: ['Blood flow', 'Neuron connections', 'Brain size', 'Skull density'],
          answer: 1 },
        { q: 'Training your attention is described as what kind of investment?',
          options: ['Financial', 'Social', 'High leverage', 'Low risk'],
          answer: 2 }
      ]
    },
    {
      passage: 1,
      questions: [
        { q: 'What does deliberate practice require beyond repetition?',
          options: ['More time', 'Focused attention and feedback', 'A teacher', 'Natural talent'],
          answer: 1 },
        { q: 'Where does growth happen according to the passage?',
          options: ['Inside the comfort zone', 'During rest', 'At the edge of competence', 'With age'],
          answer: 2 }
      ]
    },
    {
      passage: 2,
      questions: [
        { q: 'What was once thought about the brain after childhood?',
          options: ['It grows faster', 'It was fixed and unchangeable', 'It becomes more creative', 'It shrinks'],
          answer: 1 },
        { q: 'What is your brain described as in the passage?',
          options: ['A computer', 'A muscle', 'Raw material you shape', 'A fixed organ'],
          answer: 2 }
      ]
    }
  ];

  let currentPassageIdx = 0;
  let comprehensionScore = 0;
  let questionStep = 0;

  function showComprehensionCheck() {
    stopRSVP();
    playBtn.textContent = '▶ Start';

    const peakWpm   = wpm;
    const questions = QUESTIONS[currentPassageIdx].questions;
    comprehensionScore = 0;
    questionStep = 0;

    function renderQuestion() {
      if (questionStep >= questions.length) {
        renderFinalStats(peakWpm, questions.length);
        return;
      }

      const q = questions[questionStep];
      wordEl.style.fontSize = '1rem';

      /* Replace the word display area with the question */
      const stage = wordEl.closest('.rsvp-stage') || wordEl.parentElement;
      stage.innerHTML = `
        <div style="text-align:center;padding:8px 0;">
          <p style="font-size:0.72rem;color:var(--text-muted);letter-spacing:0.08em;
                    text-transform:uppercase;margin-bottom:10px;">
            Comprehension — Question ${questionStep + 1} of ${questions.length}
          </p>
          <p style="font-family:var(--font-display);font-weight:700;
                    font-size:1rem;color:var(--text);margin-bottom:18px;
                    line-height:1.5;">
            ${q.q}
          </p>
          <div style="display:flex;flex-direction:column;gap:8px;max-width:340px;margin:0 auto;">
            ${q.options.map((opt, i) => `
              <button class="comp-opt" data-idx="${i}"
                style="padding:10px 16px;border-radius:var(--r-md);
                       border:1.5px solid var(--border);background:var(--surface-2);
                       color:var(--text);font-family:var(--font-body);
                       font-size:0.88rem;cursor:pointer;text-align:left;
                       transition:all 0.2s;">
                ${opt}
              </button>`).join('')}
          </div>
        </div>`;

      stage.querySelectorAll('.comp-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          const selected = parseInt(btn.dataset.idx, 10);
          if (selected === q.answer) {
            comprehensionScore++;
            btn.style.background    = 'rgba(6,255,165,0.15)';
            btn.style.borderColor   = 'var(--green)';
            btn.style.color         = 'var(--green)';
          } else {
            btn.style.background    = 'rgba(255,107,53,0.1)';
            btn.style.borderColor   = 'rgba(255,107,53,0.5)';
            /* Show correct */
            stage.querySelectorAll('.comp-opt')[q.answer].style.background  = 'rgba(6,255,165,0.1)';
            stage.querySelectorAll('.comp-opt')[q.answer].style.borderColor = 'var(--green)';
          }
          stage.querySelectorAll('.comp-opt').forEach(b => b.disabled = true);
          setTimeout(() => { questionStep++; renderQuestion(); }, 900);
        });
      });
    }

    renderQuestion();
  }

  function renderFinalStats(peakWpm, totalQ) {
    const accuracy = Math.round((comprehensionScore / totalQ) * 100);
    const stage    = document.querySelector('.rsvp-stage') || exBody;

    stage.innerHTML = `
      <div style="text-align:center;padding:16px 0;">
        <p style="font-family:var(--font-display);font-weight:800;
                  font-size:1.2rem;color:var(--green);margin-bottom:4px;">
          Reading Complete
        </p>
        <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:20px;">
          ${accuracy === 100 ? 'Perfect comprehension.' : accuracy >= 50 ? 'Good focus. Push the speed next time.' : 'Slow down slightly to improve comprehension.'}
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;
                    max-width:300px;margin:0 auto 20px;">
          <div style="background:var(--surface-2);border:1px solid var(--border);
                      border-radius:var(--r-md);padding:14px 8px;">
            <p style="font-family:var(--font-display);font-weight:800;
                      font-size:1.5rem;color:var(--cyan);">${peakWpm}</p>
            <p style="font-size:0.7rem;color:var(--text-muted);
                      text-transform:uppercase;letter-spacing:0.06em;
                      margin-top:3px;">Peak WPM</p>
          </div>
          <div style="background:var(--surface-2);border:1px solid var(--border);
                      border-radius:var(--r-md);padding:14px 8px;">
            <p style="font-family:var(--font-display);font-weight:800;
                      font-size:1.5rem;color:var(--green);">${accuracy}%</p>
            <p style="font-size:0.7rem;color:var(--text-muted);
                      text-transform:uppercase;letter-spacing:0.06em;
                      margin-top:3px;">Comprehension</p>
          </div>
        </div>

        <button class="btn btn-primary" id="rsvp-restart-btn">↺ New Passage</button>
      </div>`;

    document.getElementById('rsvp-restart-btn').addEventListener('click', () => {
      wpm = startWpm;
      wpmBadge.textContent = `${wpm} WPM`;
      slider.value = wpm;
      currentPassageIdx = (currentPassageIdx + 1) % PASSAGES.length;
      loadPassage();
      /* Rebuild the original stage layout */
      location.reload();
    });
  }

  /* ── also track which passage is loaded ─────────────────── */
  const _origLoad = loadPassage;

  /* ── Boot ────────────────────────────────────────────────── */
  loadPassage();

})();
