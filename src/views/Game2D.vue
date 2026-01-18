<template>
  <div class="arena">
    <div v-if="gameState === 'START' || gameState === 'GAMEOVER'" class="overlay">
      <div class="menu-card">
        <h1 :class="{ 'dead-text': gameState === 'GAMEOVER' }">
          {{ gameState === 'START' ? 'LAST BULLET: SURVIVOR' : 'MISSION FAILED' }}
        </h1>
        <p v-if="gameState === 'GAMEOVER'">KILLS: {{ kills }} | LEVEL: {{ playerLevel }}</p>
        <button @click="startGame" class="btn-main">INITIALIZE REPLICATION</button>
      </div>
    </div>

    <div v-if="gameState === 'UPGRADE'" class="overlay">
      <div class="menu-card upgrade-card">
        <h2>CORE UPGRADE DETECTED</h2>
        <div class="upgrade-list">
          <button @click="applyUpgrade('fireRate')"><b>⚡ OVERCLOCK</b><br>Fire Rate +20%</button>
          <button @click="applyUpgrade('range')"><b>🔭 SENSOR ARRAY</b><br>Range +25%</button>
          <button @click="applyUpgrade('multiShot')"><b>🔫 SPLIT SHOT</b><br>+1 Projectile</button>
          <button @click="applyUpgrade('speed')"><b>🏃 TURBO</b><br>Movement Speed +15%</button>
        </div>
      </div>
    </div>

    <div class="game-hud" v-if="gameState !== 'START'">
      <div class="xp-bar"><div class="xp-fill" :style="{ width: (xp/xpNextLevel)*100 + '%' }"></div></div>
      <div class="stats-row">
        <span>LVL {{ playerLevel }}</span>
        <div class="hp-container">
          HP <div class="hp-bar-min"><div class="hp-fill-min" :style="{ width: playerHp + '%' }"></div></div>
        </div>
        <span>KILLS: {{ kills }}</span>
      </div>
    </div>

    <div class="world">
      <div class="grid-layer"></div>

      <div class="player" :style="{ left: player.x + 'px', top: player.y + 'px' }"></div>

      <div v-if="bossActive" class="boss-warning">BOSS DETECTED</div>

      <div v-for="e in enemies" :key="e.id" 
           :class="['enemy', { 'boss': e.isBoss }]" 
           :style="{ left: e.x + 'px', top: e.y + 'px', width: e.size+'px', height: e.size+'px' }">
      </div>

      <div v-for="b in bullets" :key="b.id" class="bullet" :style="{ left: b.x + 'px', top: b.y + 'px' }"></div>

      <div v-for="g in gems" :key="g.id" class="gem" :style="{ left: g.x + 'px', top: g.y + 'px' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';

const gameState = ref('START');
const bossActive = ref(false);
const player = reactive({ x: window.innerWidth/2, y: window.innerHeight/2, speed: 4, size: 30 });
const playerHp = ref(100);
const playerLevel = ref(1);
const xp = ref(0);
const xpNextLevel = ref(100);
const kills = ref(0);

// Status da Build
const stats = reactive({ fireRate: 600, projectiles: 1, range: 400 });

const enemies = ref([]);
const bullets = ref([]);
const gems = ref([]);
const keys = {};

let lastShot = 0;
let raf = null;

const screenW = window.innerWidth;
const screenH = window.innerHeight;

function startGame() {
  player.x = screenW/2; player.y = screenH/2;
  playerHp.value = 100; playerLevel.value = 1; xp.value = 0; xpNextLevel.value = 100;
  kills.value = 0; enemies.value = []; bullets.value = []; gems.value = [];
  stats.fireRate = 600; stats.projectiles = 1; stats.range = 400;
  bossActive.value = false;
  gameState.value = 'PLAYING';
  spawnEnemies(6);
}

function spawnEnemies(count, isBoss = false) {
  for(let i=0; i<count; i++) {
    enemies.value.push({
      id: Math.random(),
      isBoss: isBoss,
      size: isBoss ? 80 : 25,
      x: Math.random() * screenW,
      y: Math.random() * screenH,
      hp: isBoss ? 20 + (playerLevel.value * 5) : 2,
      speed: isBoss ? 1 : 1.5 + (playerLevel.value * 0.1)
    });
  }
}

function applyUpgrade(type) {
  if(type === 'fireRate') stats.fireRate *= 0.75;
  if(type === 'range') stats.range *= 1.3;
  if(type === 'multiShot') stats.projectiles += 1;
  if(type === 'speed') player.speed *= 1.15;
  gameState.value = 'PLAYING';
}

function wrap(obj, size = 0) {
  if (obj.x < -size) obj.x = screenW;
  if (obj.x > screenW) obj.x = -size;
  if (obj.y < -size) obj.y = screenH;
  if (obj.y > screenH) obj.y = -size;
}

function update() {
  if (gameState.value === 'PLAYING') {
    // 1. Movimento Jogador + Wrap
    if (keys['w'] || keys['arrowup']) player.y -= player.speed;
    if (keys['s'] || keys['arrowdown']) player.y += player.speed;
    if (keys['a'] || keys['arrowleft']) player.x -= player.speed;
    if (keys['d'] || keys['arrowright']) player.x += player.speed;
    wrap(player, 30);

    // 2. Auto-Ataque com Range
    const now = Date.now();
    if (now - lastShot > stats.fireRate && enemies.value.length > 0) {
      let closest = null;
      let minDist = stats.range;
      
      enemies.value.forEach(e => {
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < minDist) { minDist = d; closest = e; }
      });

      if (closest) {
        const angle = Math.atan2(closest.y - player.y, closest.x - player.x);
        for(let i=0; i < stats.projectiles; i++) {
          const spread = (i - (stats.projectiles-1)/2) * 0.2;
          bullets.value.push({
            id: Math.random(),
            x: player.x + 10, y: player.y + 10,
            vx: Math.cos(angle + spread) * 10,
            vy: Math.sin(angle + spread) * 10,
            dist: 0
          });
        }
        lastShot = now;
      }
    }

    // 3. Inimigos + Boss Logic
    enemies.value.forEach((e, ei) => {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);
      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;
      wrap(e, e.size);

      // Colisão Dano (Verde com Vermelho)
      if(dist < (e.size/2 + 15)) {
        playerHp.value -= e.isBoss ? 1 : 0.4;
        if(playerHp.value <= 0) gameState.value = 'GAMEOVER';
      }

      // Colisão Bala com Inimigo
      bullets.value.forEach((b, bi) => {
        if(Math.hypot(b.x - e.x, b.y - e.y) < e.size) {
          e.hp--;
          bullets.value.splice(bi, 1);
          if(e.hp <= 0) {
            if(e.isBoss) { bossActive.value = false; spawnEnemies(5); }
            // Dropa XP
            for(let j=0; j<(e.isBoss ? 10 : 1); j++) {
              gems.value.push({ id: Math.random(), x: e.x + Math.random()*20, y: e.y + Math.random()*20 });
            }
            enemies.value.splice(ei, 1);
            kills.value++;
            if(!bossActive.value && enemies.value.length < 4) spawnEnemies(2);
          }
        }
      });
    });

    // 4. Balas (Range limit)
    bullets.value.forEach((b, i) => {
      b.x += b.vx; b.y += b.vy;
      b.dist += 10;
      if(b.dist > stats.range) bullets.value.splice(i, 1);
    });

    // 5. Coleta de XP e Level Up
    gems.value.forEach((g, i) => {
      const d = Math.hypot(player.x - g.x, player.y - g.y);
      if(d < 150) { // Magnetismo
        g.x += (player.x - g.x) * 0.1;
        g.y += (player.y - g.y) * 0.1;
      }
      if(d < 30) {
        gems.value.splice(i, 1);
        xp.value += 20;
        if(xp.value >= xpNextLevel.value) {
          playerLevel.value++;
          xp.value = 0;
          xpNextLevel.value *= 1.25;
          gameState.value = 'UPGRADE';
          // Spawn Boss a cada 5 níveis
          if(playerLevel.value % 5 === 0) {
            bossActive.value = true;
            spawnEnemies(1, true);
          }
        }
      }
    });
  }
  raf = requestAnimationFrame(update);
}

onMounted(() => {
  window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
  update();
});
onUnmounted(() => cancelAnimationFrame(raf));
</script>

<style scoped>
.arena { width: 100vw; height: 100vh; background: #050505; color: white; overflow: hidden; position: relative; font-family: 'Orbitron', sans-serif; }
.world { width: 100%; height: 100%; }
.grid-layer { position: absolute; inset: 0; background-image: radial-gradient(#1a1a1a 1px, transparent 1px); background-size: 50px 50px; }

.player { position: absolute; width: 30px; height: 30px; background: #00ff88; border-radius: 4px; box-shadow: 0 0 20px #00ff88; z-index: 10; }
.enemy { position: absolute; background: #ff3b3b; border-radius: 50%; box-shadow: 0 0 15px #ff3b3b; z-index: 5; }
.enemy.boss { background: #ff00ff; box-shadow: 0 0 30px #ff00ff; border: 4px solid #fff; }

.bullet { position: absolute; width: 6px; height: 6px; background: #fff; border-radius: 50%; box-shadow: 0 0 10px #fff; }
.gem { position: absolute; width: 10px; height: 10px; background: #00d4ff; clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); box-shadow: 0 0 8px #00d4ff; }

.game-hud { position: fixed; top: 0; width: 100%; z-index: 100; pointer-events: none; }
.xp-bar { width: 100%; height: 6px; background: #111; }
.xp-fill { height: 100%; background: #00d4ff; box-shadow: 0 0 15px #00d4ff; transition: width 0.2s; }
.stats-row { display: flex; justify-content: space-between; padding: 15px 30px; background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); }

.hp-container { display: flex; align-items: center; gap: 10px; }
.hp-bar-min { width: 150px; height: 10px; background: #222; border: 1px solid #444; }
.hp-fill-min { height: 100%; background: #00ff88; transition: width 0.3s; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(5px); }
.menu-card { background: #111; padding: 40px; border: 2px solid #333; text-align: center; border-radius: 10px; max-width: 400px; }
.upgrade-list { display: grid; gap: 15px; margin-top: 20px; }
.upgrade-list button { background: #1a1a1a; border: 1px solid #00d4ff; color: white; padding: 15px; cursor: pointer; transition: 0.2s; }
.upgrade-list button:hover { background: #00d4ff; color: black; }

.btn-main { background: #00ff88; color: black; border: none; padding: 15px 30px; font-weight: bold; cursor: pointer; margin-top: 20px; }
.dead-text { color: #ff3b3b; font-size: 3rem; }
.boss-warning { position: fixed; top: 20%; left: 50%; transform: translateX(-50%); color: #ff00ff; font-size: 2rem; animation: blink 0.5s infinite; }

@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } }
</style>