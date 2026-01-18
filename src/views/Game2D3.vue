<template>
  <div class="arena">
    <div v-if="gameState === 'START'" class="overlay">
      <div class="menu-card">
        <h1>LAST BULLET: SURVIVOR</h1>
        <div class="difficulty-grid">
          <button @click="startGame(1)" class="btn-diff easy">NORMAL</button>
          <button @click="startGame(2)" class="btn-diff hard">HARDCORE</button>
        </div>
      </div>
    </div>

    <div v-if="gameState === 'UPGRADE'" class="overlay">
      <div class="menu-card">
        <h2 style="color: #3498db">LEVEL UP! CHOOSE AN ABILITY</h2>
        <div class="upgrade-list">
          <button @click="applyUpgrade('fireRate')" class="btn-upgrade">
            <b>QUICKSHOT</b><br>-20% Cooldown
          </button>
          <button @click="applyUpgrade('moveSpeed')" class="btn-upgrade">
            <b>AGILITY</b><br>+15% Move Speed
          </button>
          <button @click="applyUpgrade('multiShot')" class="btn-upgrade">
            <b>DUAL BARREL</b><br>+1 Projectile
          </button>
        </div>
      </div>
    </div>

    <div v-if="gameState === 'PLAYING' || gameState === 'UPGRADE'" class="game-hud">
      <div class="xp-bar"><div class="xp-fill" :style="{ width: (xp/xpNextLevel)*100 + '%' }"></div></div>
      <div class="stats">
        <span>LVL: {{ playerLevel }}</span>
        <span>KILLS: {{ kills }}</span>
        <span :style="{color: playerHp < 30 ? 'red' : '#2ecc71'}">HP: {{ Math.ceil(playerHp) }}%</span>
      </div>
    </div>

    <div id="game-world" class="world">
      <div class="player" :style="{ left: player.x + 'px', top: player.y + 'px' }"></div>

      <div v-for="e in enemies" :key="e.id" class="enemy" :style="{ left: e.x + 'px', top: e.y + 'px' }"></div>

      <div v-for="b in bullets" :key="b.id" class="bullet" :style="{ left: b.x + 'px', top: b.y + 'px' }"></div>

      <div v-for="g in gems" :key="g.id" class="gem" :style="{ left: g.x + 'px', top: g.y + 'px' }"></div>
    </div>

    <div v-if="gameState === 'GAMEOVER'" class="overlay">
      <div class="menu-card">
        <h1 style="color: #e74c3c">WASTED</h1>
        <button @click="gameState = 'START'" class="btn-diff easy">RESTART</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';

const gameState = ref('START');
const player = reactive({ x: window.innerWidth/2, y: window.innerHeight/2, speed: 4, size: 30 });
const playerHp = ref(100);
const playerLevel = ref(1);
const xp = ref(0);
const xpNextLevel = ref(100);
const kills = ref(0);

// Status da Build
const stats = reactive({ fireRate: 500, projectiles: 1 });

const enemies = ref([]);
const bullets = ref([]);
const gems = ref([]);
const keys = {};

let lastShot = 0;
let raf = null;

function startGame(diff) {
  Object.assign(player, { x: window.innerWidth/2, y: window.innerHeight/2, speed: 4 });
  playerHp.value = 100; playerLevel.value = 1; xp.value = 0; kills.value = 0;
  enemies.value = []; bullets.value = []; gems.value = [];
  stats.fireRate = 500; stats.projectiles = 1;
  gameState.value = 'PLAYING';
  spawnEnemies(8);
}

function spawnEnemies(count) {
  for(let i=0; i<count; i++) {
    const side = Math.floor(Math.random()*4);
    let x, y;
    if(side === 0) { x = -50; y = Math.random()*window.innerHeight; }
    else if(side === 1) { x = window.innerWidth+50; y = Math.random()*window.innerHeight; }
    else if(side === 2) { x = Math.random()*window.innerWidth; y = -50; }
    else { x = Math.random()*window.innerWidth; y = window.innerHeight+50; }
    enemies.value.push({ id: Math.random(), x, y, hp: 2, speed: 1.5 + (playerLevel.value * 0.2) });
  }
}

function applyUpgrade(type) {
  if(type === 'fireRate') stats.fireRate *= 0.8;
  if(type === 'moveSpeed') player.speed *= 1.15;
  if(type === 'multiShot') stats.projectiles += 1;
  gameState.value = 'PLAYING';
}

function update() {
  if (gameState.value === 'PLAYING') {
    // Movimentação
    if (keys['w']) player.y -= player.speed;
    if (keys['s']) player.y += player.speed;
    if (keys['a']) player.x -= player.speed;
    if (keys['d']) player.x += player.speed;

    // Auto-Ataque
    const now = Date.now();
    if (now - lastShot > stats.fireRate && enemies.value.length > 0) {
      const target = enemies.value[0]; // Mira no primeiro da lista
      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      
      for(let i=0; i < stats.projectiles; i++) {
        const offset = (i - (stats.projectiles-1)/2) * 0.2;
        bullets.value.push({
          id: Math.random(),
          x: player.x + 15, y: player.y + 15,
          vx: Math.cos(angle + offset) * 8,
          vy: Math.sin(angle + offset) * 8
        });
      }
      lastShot = now;
    }

    // Lógica de Inimigos
    enemies.value.forEach((e, ei) => {
      const dist = Math.hypot(player.x - e.x, player.y - e.y);
      e.x += ((player.x - e.x) / dist) * e.speed;
      e.y += ((player.y - e.y) / dist) * e.speed;

      if(dist < 25) {
        playerHp.value -= 0.5;
        if(playerHp.value <= 0) gameState.value = 'GAMEOVER';
      }

      bullets.value.forEach((b, bi) => {
        if(Math.hypot(b.x - e.x, b.y - e.y) < 25) {
          e.hp--;
          bullets.value.splice(bi, 1);
          if(e.hp <= 0) {
            gems.value.push({ id: Math.random(), x: e.x, y: e.y });
            enemies.value.splice(ei, 1);
            kills.value++;
            if(enemies.value.length < 5) spawnEnemies(3);
          }
        }
      });
    });

    // Lógica de Balas e XP
    bullets.value.forEach((b, i) => {
      b.x += b.vx; b.y += b.vy;
      if(b.x < 0 || b.x > window.innerWidth || b.y < 0 || b.y > window.innerHeight) bullets.value.splice(i, 1);
    });

    gems.value.forEach((g, i) => {
      if(Math.hypot(player.x - g.x, player.y - g.y) < 40) {
        gems.splice(i, 1);
        xp.value += 25;
        if(xp.value >= xpNextLevel.value) {
          gameState.value = 'UPGRADE';
          playerLevel.value++;
          xp.value = 0;
          xpNextLevel.value *= 1.3;
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
.arena { width: 100vw; height: 100vh; background: #050505; color: white; overflow: hidden; position: relative; font-family: sans-serif; }
.world { width: 100%; height: 100%; position: absolute; }
.player { position: absolute; width: 30px; height: 30px; background: #2ecc71; border-radius: 4px; box-shadow: 0 0 15px #2ecc71; z-index: 10; }
.enemy { position: absolute; width: 25px; height: 25px; background: #e74c3c; border-radius: 50%; box-shadow: 0 0 10px #e74c3c; }
.bullet { position: absolute; width: 8px; height: 8px; background: #f1c40f; border-radius: 50%; }
.gem { position: absolute; width: 8px; height: 8px; background: #3498db; transform: rotate(45deg); }

.game-hud { position: fixed; top: 0; width: 100%; z-index: 50; }
.xp-bar { width: 100%; height: 8px; background: #222; }
.xp-fill { height: 100%; background: #3498db; transition: width 0.3s; }
.stats { display: flex; justify-content: space-around; padding: 10px; background: rgba(0,0,0,0.5); font-weight: bold; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 100; }
.menu-card { background: #111; padding: 40px; border-radius: 15px; border: 1px solid #333; text-align: center; }
.difficulty-grid, .upgrade-list { display: flex; flex-direction: column; gap: 15px; margin-top: 20px; }
button { padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; background: #333; color: white; transition: 0.2s; }
button:hover { transform: scale(1.05); background: #444; }
.btn-upgrade { background: #1a1a1a; border: 1px solid #3498db; }
.btn-upgrade:hover { background: #3498db; }
</style>