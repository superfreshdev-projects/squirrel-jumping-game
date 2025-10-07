/*
  Eichhörnchen Running Game
  - Space to jump
  - Click Start to run automatically
  - Speed increases slightly every 10 passed obstacles
*/

(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayMsg = document.getElementById('overlayMsg');
  const overlayRestart = document.getElementById('overlayRestart');
  const scoreEl = document.getElementById('score');
  const passedEl = document.getElementById('passed');
  const speedDisplay = document.getElementById('speedDisplay');

  const W = canvas.width;
  const H = canvas.height;

  // Game constants
  const GROUND_H = 60;
  const SQUIRREL_WIDTH = 48;
  const SQUIRREL_HEIGHT = 36;
  const JUMP_V = -12.5;
  const GRAVITY = 0.6;

  let running = false;
  let gameOver = false;
  let lastTime = 0;
  let spawnTimer = 0;
  let spawnInterval = 1400; // ms
  let obstacles = [];
  let score = 0;
  let passed = 0;
  let baseSpeed = 4; // pixels/frame at speedMultiplier = 1
  let speedMultiplier = 1.0;

  // Squirrel state
  const squirrel = {
    x: 120,
    y: H - GROUND_H - SQUIRREL_HEIGHT,
    vy: 0,
    w: SQUIRREL_WIDTH,
    h: SQUIRREL_HEIGHT,
    onGround: true,
    color: '#b05a2d'
  };

  // Controls
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      jump();
    }
  });

  startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    restartBtn.disabled = false;
    startGame();
  });

  restartBtn.addEventListener('click', resetGame);
  overlayRestart.addEventListener('click', resetGame);

  function startGame() {
    resetState();
    running = true;
    gameOver = false;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function resetGame() {
    overlay.classList.add('hidden');
    startBtn.disabled = false;
    restartBtn.disabled = true;
    resetState();
    draw(); // draw initial frame
  }

  function resetState() {
    obstacles = [];
    score = 0;
    passed = 0;
    baseSpeed = 4;
    speedMultiplier = 1.0;
    spawnInterval = 1400;
    spawnTimer = 0;
    squirrel.y = H - GROUND_H - squirrel.h;
    squirrel.vy = 0;
    squirrel.onGround = true;
    gameOver = false;
    running = false;
    scoreEl.textContent = score;
    passedEl.textContent = passed;
    speedDisplay.textContent = speedMultiplier.toFixed(2);
  }

  function jump() {
    if (gameOver) return;
    if (squirrel.onGround) {
      squirrel.vy = JUMP_V;
      squirrel.onGround = false;
    }
  }

  function spawnObstacle() {
    // varying sizes
    const height = 24 + Math.random()*36;
    const width = 18 + Math.random()*30;
    const y = H - GROUND_H - height;
    obstacles.push({
      x: W + 10,
      y,
      w: width,
      h: height,
      passed: false,
      color: '#356859'
    });
  }

  function update(dt) {
    if (!running) return;

    // physics for squirrel
    squirrel.vy += GRAVITY;
    squirrel.y += squirrel.vy;
    if (squirrel.y >= H - GROUND_H - squirrel.h) {
      squirrel.y = H - GROUND_H - squirrel.h;
      squirrel.vy = 0;
      squirrel.onGround = true;
    }

    // spawn obstacles
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      spawnObstacle();
      // gradually decrease interval a little with difficulty
      spawnInterval = Math.max(700, spawnInterval * 0.98);
    }

    // move obstacles
    const speed = baseSpeed * speedMultiplier;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= speed;
      // check passed
      if (!ob.passed && ob.x + ob.w < squirrel.x) {
        ob.passed = true;
        passed++;
        score += 100;
        // every obstacle increases score and occasionally speed
        if (passed % 10 === 0) {
          // minimal faster every 10 obstacles
          speedMultiplier += 0.12;
        } else {
          // very small incremental increase
          speedMultiplier += 0.01;
        }
        // avoid runaway spawnInterval too small
        spawnInterval = Math.max(600, spawnInterval);
        scoreEl.textContent = score;
        passedEl.textContent = passed;
        speedDisplay.textContent = speedMultiplier.toFixed(2);
      }
      // remove off-screen
      if (ob.x + ob.w < -50) obstacles.splice(i,1);
    }

    // check collisions
    for (const ob of obstacles) {
      if (rectIntersect(squirrel.x, squirrel.y, squirrel.w, squirrel.h, ob.x, ob.y, ob.w, ob.h)) {
        endGame();
        break;
      }
    }
  }

  function rectIntersect(x1,y1,w1,h1,x2,y2,w2,h2) {
    return !(x2 > x1 + w1 ||
             x2 + w2 < x1 ||
             y2 > y1 + h1 ||
             y2 + h2 < y1);
  }

  function endGame() {
    gameOver = true;
    running = false;
    overlay.classList.remove('hidden');
    overlayTitle.textContent = 'Game Over';
    overlayMsg.textContent = `Du hast ${passed} Hindernisse geschafft. Score: ${score}`;
    startBtn.disabled = false;
    restartBtn.disabled = false;
  }

  function drawGround() {
    ctx.fillStyle = '#8dbb6b';
    ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
    // simple lines
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    for (let x=0;x<W;x+=30) {
      ctx.moveTo(x, H - GROUND_H);
      ctx.lineTo(x+10, H - GROUND_H - 6);
    }
    ctx.stroke();
  }

  function drawSquirrel() {
    // body
    ctx.fillStyle = squirrel.color;
    roundRect(ctx, squirrel.x, squirrel.y, squirrel.w, squirrel.h, 8, true, false);
    // tail
    ctx.beginPath();
    ctx.ellipse(squirrel.x + 10, squirrel.y + 8, 8, 14, Math.PI/3, 0, Math.PI*2);
    ctx.fillStyle = '#9b6b3a';
    ctx.fill();
    // eye
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(squirrel.x + squirrel.w - 18, squirrel.y + 10, 3, 0, Math.PI*2);
    ctx.fill();
  }

  function drawObstacles() {
    for (const ob of obstacles) {
      ctx.fillStyle = ob.color;
      roundRect(ctx, ob.x, ob.y, ob.w, ob.h, 6, true, false);
    }
  }

  function draw() {
    // background
    ctx.clearRect(0,0,W,H);
    // sky subtle gradient
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, '#cfefff');
    g.addColorStop(1, '#eaf7ff');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // parallax clouds (simple)
    drawClouds();

    // ground
    drawGround();

    // obstacles
    drawObstacles();

    // squirrel
    drawSquirrel();

    // HUD inside canvas (optional)
    ctx.fillStyle = '#214';
    ctx.font = '14px system-ui, Arial';
    ctx.fillText('Score: ' + score, 12, 22);
    ctx.fillText('Hindernisse: ' + passed, 12, 40);
  }

  function drawClouds() {
    // simple moving clouds based on time
    const t = performance.now() * 0.0002;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i=0;i<3;i++){
      const cx = (i*300 + (t*60) % 900) - 60;
      ctx.beginPath();
      ctx.ellipse(cx, 50 + i*10, 40 + i*8, 18, 0,0,Math.PI*2);
      ctx.fill();
    }
  }

  function loop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // helper: rounded rect
  function roundRect(ctx, x, y, w, h, r, fill, stroke){
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // initial draw
  resetState();
  draw();

})();
