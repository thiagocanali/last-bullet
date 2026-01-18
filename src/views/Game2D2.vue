<template>
  <div class="arena">
    <div v-if="gameState === 'START'" class="overlay">
      <div class="menu-card">
        <h1 class="glitch-text">SELECT DIFFICULTY</h1>
        <div class="difficulty-grid">
          <button @click="startGame(1)" class="btn-diff easy">NORMAL</button>
          <button @click="startGame(2)" class="btn-diff hard">HARDCORE</button>
          <button @click="startGame(3)" class="btn-diff elite">NIGHTMARE</button>
        </div>
      </div>
    </div>

    <div v-if="gameState === 'PLAYING'" class="game-hud">
      <div class="xp-bar-container">
        <div class="xp-bar-fill" :style="{ width: (xp / xpNextLevel) * 100 + '%' }"></div>
        <span class="lvl-tag">LVL {{ playerLevel }}</span>
      </div>
      
      <div class="top-stats">
        <div class="stat">KILLS: {{ kills }}</div>
        <div class="stat">WAVE: {{ wave }}</div>
      </div>

      <div class="hp-circle">
        <svg viewBox="0 0 36 36" class="circular-chart">
          <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path class="circle" :style="{ strokeDasharray: playerHp + ', 100' }" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <div class="hp-text">{{ Math.ceil(playerHp) }}</div>
      </div>
    </div>

    <div v-if="gameState === 'PLAYING'" class="world">
      <div class="grid-layer"></div>

      <div class="player" :style="{ left: playerPos.x + 'px', top: playerPos.y + 'px' }">
        <div class="weapon-pivot" :style="{ transform: `rotate(${weaponAngle}deg)` }">
          <div class="muzzle-flash" v-if="muzzleFlash"></div>
        </div>
      </div>

      <div v-for="e in enemies" :key="e.id" class="enemy survivor-mob" :style="{ left: e.x + 'px', top: e.y + 'px' }"></div>

      <div v-for="b in bullets" :key="b.id" class="bullet" :style="{ left: b.x + 'px', top: b.y + 'px' }"></div>

      <div v-for="xp in gems" :key="xp.id" class="xp-gem" :style="{ left: xp.x + 'px', top: xp.y + 'px' }"></div>
    </div>

    <div v-if="gameState === 'GAMEOVER'" class="overlay">
      <div class="menu-card">
        <h1 class="dead-text">WASTED</h1>
        <p>KILLS: {{ kills }} | WAVE: {{ wave }}</p>
        <button @click="gameState = 'START'" class="btn-primary">TRY AGAIN</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from "vue";

// Configurações
const gameState = ref('START');
const playerPos = reactive({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
const playerHp = ref(100);
const playerLevel = ref(1);
const xp = ref(0);
const xpNextLevel = ref(100);
const kills = ref(0);
const wave = ref(1);
const difficulty = ref(1);

const enemies = ref([]);
const bullets = ref([]);
const gems = ref([]);
const muzzleFlash = ref(false);
const weaponAngle = ref(0);

const keys = reactive({});
let lastShot = 0;
let raf = null;

function startGame(diff) {
  difficulty.value = diff;
  playerHp.value = 100;
  playerLevel.value = 1;
  xp.value = 0;
  kills.value = 0;
  wave.value = 1;
  enemies.value = [];
  bullets.value = [];
  gems.value = [];
  gameState.value = 'PLAYING';
  spawnWave();
}

function spawnWave() {
  const count = 5 + (wave.value * 3 * difficulty.value);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 600 + Math.random() * 200;
    enemies.value.push({
      id: Math.random(),
      x: playerPos.x + Math.cos(angle) * dist,
      y: playerPos.y + Math.sin(angle) * dist,
      hp: 2 + (wave.value * 0.5),
      speed: 1.5 + (difficulty.value * 0.5)
    });
  }
}

function update() {
  if (gameState.value !== 'PLAYING') return;

  // 1. Movimentação WASD
  const speed = 4;
  if (keys['w'] || keys['ArrowUp']) playerPos.y -= speed;
  if (keys['s'] || keys['ArrowDown']) playerPos.y += speed;
  if (keys['a'] || keys['ArrowLeft']) playerPos.x -= speed;
  if (keys['d'] || keys['ArrowRight']) playerPos.x += speed;

  // 2. IA Inimiga (Seguir jogador)
  enemies.value.forEach(e => {
    const dx = playerPos.x - e.x;
    const dy = playerPos.y - e.y;
    const dist = Math.hypot(dx, dy);
    e.x += (dx / dist) * e.speed;
    e.y += (dy / dist) * e.speed;

    // Colisão com jogador
    if (dist < 30) {
      playerHp.value -= 0.2 * difficulty.value;
      if (playerHp.value <= 0) gameState.value = 'GAMEOVER';
    }
  });

  // 3. Auto-Ataque (Alvo mais próximo)
  if (enemies.value.length > 0) {
    const now = Date.now();
    if (now - lastShot > 400 - (playerLevel.value * 10)) {
      let closest = null;
      let minDist = Infinity;
      
      enemies.value.forEach(e => {
        const d = Math.hypot(e.x - playerPos.x, e.y - playerPos.y);
        if (d < minDist) { minDist = d; closest = e; }
      });

      if (closest && minDist < 500) {
        const angle = Math.atan2(closest.y - playerPos.y, closest.x - playerPos.x);
        weaponAngle.value = angle * 180 / Math.PI;
        bullets.value.push({
          id: Math.random(),
          x: playerPos.x + 20,
          y: playerPos.y + 20,
          vx: Math.cos(angle) * 10,
          vy: Math.sin(angle) * 10
        });
        lastShot = now;
        muzzleFlash.value = true;
        setTimeout(() => muzzleFlash.value = false, 50);
      }
    }
  }

  // 4. Balas e Colisões
  bullets.value.forEach((b, bIdx) => {
    b.x += b.vx; b.y += b.vy;
    enemies.value.forEach((e, eIdx) => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < 25) {
        e.hp -= 1;
        bullets.value.splice(bIdx, 1);
        if (e.hp <= 0) {
          gems.value.push({ id: Math.random(), x: e.x, y: e.y });
          enemies.value.splice(eIdx, 1);
          kills.value++;
          if (enemies.value.length === 0) { wave.value++; spawnWave(); }
        }
      }
    });
  });

  // 5. Coleta de XP
  gems.value.forEach((g, gIdx) => {
    if (Math.hypot(g.x - playerPos.x, g.y - playerPos.y) < 40) {
      xp.value += 20;
      gems.value.splice(gIdx, 1);
      if (xp.value >= xpNextLevel.value) {
        playerLevel.value++;
        xp.value = 0;
        xpNextLevel.value *= 1.2;
        playerHp.value = Math.min(100, playerHp.value + 20); // Cura ao upar
      }
    }
  });

  raf = requestAnimationFrame(update);
}

onMounted(() => {
  window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
  raf = requestAnimationFrame(update);
});

onUnmounted(() => cancelAnimationFrame(raf));
</script>

<style scoped>
.arena { width: 100vw; height: 100vh; background: #0a0a0a; overflow: hidden; position: relative; font-family: 'Orbitron', sans-serif; }
.world { width: 100%; height: 100%; position: absolute; }
.grid-layer { position: absolute; inset: 0; background-image: radial-gradient(#222 1px, transparent 1px); background-size: 40px 40px; }

/* HUD EXCLUSIVO SURVIVOR */
.game-hud { position: fixed; inset: 0; pointer-events: none; z-index: 100; }
.xp-bar-container { position: absolute; top: 0; left: 0; width: 100%; height: 10px; background: #111; }
.xp-bar-fill { height: 100%; background: #3498db; transition: width 0.3s; box-shadow: 0 0 15px #3498db; }
.lvl-tag { position: absolute; right: 20px; top: 15px; color: #3498db; font-weight: bold; }
.top-stats { position: absolute; top: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 40px; color: white; font-size: 1.2rem; }

.hp-circle { position: absolute; bottom: 30px; left: 30px; width: 80px; height: 80px; }
.hp-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
.circular-chart { filter: drop-shadow(0 0 5px #2ecc71); }
.circle-bg { fill: none; stroke: #222; stroke-width: 3.8; }
.circle { fill: none; stroke: #2ecc71; stroke-width: 3.8; stroke-linecap: round; transition: stroke-dasharray 0.3s; }

/* PERSONAGENS */
.player { position: absolute; width: 35px; height: 35px; background: #2ecc71; border-radius: 4px; box-shadow: 0 0 20px #2ecc71; z-index: 10; transition: transform 0.1s; }
.weapon-pivot { position: absolute; width: 50px; height: 4px; background: #fff; left: 50%; top: 50%; transform-origin: left center; }
.muzzle-flash { position: absolute; right: -20px; top: -8px; width: 20px; height: 20px; background: yellow; border-radius: 50%; filter: blur(5px); }

.survivor-mob { position: absolute; width: 30px; height: 30px; background: #e74c3c; border-radius: 50%; box-shadow: 0 0 15px #e74c3c; }
.bullet { position: absolute; width: 8px; height: 8px; background: #fff; border-radius: 50%; box-shadow: 0 0 10px #fff; }
.xp-gem { position: absolute; width: 10px; height: 10px; background: #3498db; transform: rotate(45deg); box-shadow: 0 0 10px #3498db; }

/* MENUS */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(10px); }
.menu-card { background: #111; padding: 50px; border: 1px solid #333; text-align: center; border-radius: 20px; }
.difficulty-grid { display: flex; gap: 20px; margin-top: 30px; }
.btn-diff { padding: 20px; border: none; cursor: pointer; font-weight: bold; transition: 0.3s; color: white; border-radius: 8px; }
.easy { background: #27ae60; }
.hard { background: #d35400; }
.elite { background: #c0392b; animation: pulse 1s infinite; }
@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
</style>