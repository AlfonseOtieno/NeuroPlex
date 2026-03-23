/**
 * NeuroPlex — Peripheral Vision Tracking
 * Track highlighted ball with peripheral vision while fixating center.
 */

(function PeripheralExercise() {
  'use strict';

  const act = ACTIVITIES.find(a => a.id === 'peripheral');
  if (act) {
    document.getElementById('act-icon').textContent = act.icon;
    document.getElementById('chip-row').innerHTML = act.chips.map(c=>`<span class="chip">${c}</span>`).join('');
    document.getElementById('benefits-list').innerHTML = act.benefits.map(b=>`<li>${b}</li>`).join('');
    document.getElementById('instructions-list').innerHTML = act.instructions.map(i=>`<li>${i}</li>`).join('');
  }

  const CONFIGS = { easy:{nBalls:2,speed:2.2}, medium:{nBalls:4,speed:3}, hard:{nBalls:7,speed:4} };
  let level='easy', running=false, animId=null, balls=[];

  const ctrlRow = document.getElementById('ctrl-row');
  const exBody  = document.getElementById('exercise-body');

  ctrlRow.innerHTML=`
    <button class="btn btn-primary btn-sm" id="toggle-btn">▶ Start</button>
    <button class="btn btn-ghost btn-sm"   id="reset-btn">↺ Reset</button>`;

  exBody.innerHTML=`
    <canvas id="peri-canvas" class="ex-canvas" height="320" aria-label="Peripheral tracking canvas"></canvas>
    <div style="margin-top:12px;font-size:0.8rem;color:var(--text-muted);text-align:center;">
      Keep eyes on the center <strong style="color:var(--cyan)">✛</strong>. Track the <strong style="color:var(--green)">green ball</strong> without looking at it.
    </div>`;

  const canvas = document.getElementById('peri-canvas');
  const ctx    = canvas.getContext('2d');

  function resize(){ canvas.width = canvas.offsetWidth; }
  resize(); window.addEventListener('resize',resize);

  document.getElementById('toggle-btn').addEventListener('click',toggle);
  document.getElementById('reset-btn').addEventListener('click',reset);

  document.querySelectorAll('.diff-btn[data-level]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.diff-btn[data-level]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      level=btn.dataset.level; reset();
    });
  });

  function initBalls(){
    const cfg=CONFIGS[level], W=canvas.width, H=canvas.height;
    balls=Array.from({length:cfg.nBalls},(_,i)=>({
      x:60+Math.random()*(W-120), y:40+Math.random()*(H-80),
      vx:(Math.random()-0.5)*cfg.speed*2, vy:(Math.random()-0.5)*cfg.speed*2,
      r:10, target:i===0
    }));
  }

  function animate(){
    if(!running) return;
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#04070f'; ctx.fillRect(0,0,W,H);

    balls.forEach(b=>{
      b.x+=b.vx; b.y+=b.vy;
      if(b.x<b.r||b.x>W-b.r) b.vx*=-1;
      if(b.y<b.r||b.y>H-b.r) b.vy*=-1;

      ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
      ctx.fillStyle = b.target ? '#06ffa5' : 'rgba(58,85,112,0.8)';
      if(b.target){ ctx.shadowColor='#06ffa5'; ctx.shadowBlur=14; }
      else ctx.shadowBlur=0;
      ctx.fill(); ctx.shadowBlur=0;
      if(b.target){ ctx.strokeStyle='rgba(6,255,165,0.4)'; ctx.lineWidth=2; ctx.stroke(); }
    });

    /* Center cross */
    const cx=W/2, cy=H/2;
    ctx.strokeStyle='rgba(0,229,255,0.85)'; ctx.lineWidth=2;
    [[-18,-6],[6,18],[0,0],[0,0]].forEach(()=>{});
    ctx.beginPath(); ctx.moveTo(cx-18,cy); ctx.lineTo(cx-6,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+6,cy);  ctx.lineTo(cx+18,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy-18); ctx.lineTo(cx,cy-6);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy+6);  ctx.lineTo(cx,cy+18); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,3,0,Math.PI*2);
    ctx.fillStyle='rgba(0,229,255,0.95)';
    ctx.shadowColor='rgba(0,229,255,0.7)'; ctx.shadowBlur=10;
    ctx.fill(); ctx.shadowBlur=0;

    animId=requestAnimationFrame(animate); NeuroPlex.addTimer(animId);
  }

  function toggle(){
    if(running){ running=false; cancelAnimationFrame(animId); document.getElementById('toggle-btn').textContent='▶ Resume'; }
    else { if(!balls.length) initBalls(); running=true; document.getElementById('toggle-btn').textContent='⏸ Pause'; animate(); }
  }

  function reset(){
    running=false; cancelAnimationFrame(animId); balls=[];
    document.getElementById('toggle-btn').textContent='▶ Start';
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  initBalls();
})();
