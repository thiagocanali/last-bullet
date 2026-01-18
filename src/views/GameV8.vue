<template>
  <div class="arena hide-cursor" @click="lockPointer">
    <Crosshair v-if="!isGameOver" :hit="hitMarker" :spread="currentSpread" @move="updateAim" />

    <div class="hud" v-if="!isGameOver">
      <div class="stats-box">
        <span class="label">TEMPO:</span> 
        <span class="value" :class="{ 'critical-time': timeLeft <= 10 }">{{ timeLeft }}s</span>
      </div>
      <div class="stats-box">
        <span class="label">KILLS:</span> <span class="value">{{ kills }}</span>
      </div>
      <div class="stats-box">
        <span class="label">RECORDE:</span> <span class="value">{{ highLifeKills }}</span>
      </div>
    </div>

    <div class="ammo-hud" v-if="!isGameOver" :class="{ 'low-ammo': ammo <= 0 }">
      <div class="ammo-text">
        {{ isReloading ? 'RECARREGANDO...' : `${ammo} / ${weapon.maxAmmo}` }}
      </div>
      <div class="ammo-bar-bg">
        <div class="ammo-bar-fill" :style="{ width: (ammo / weapon.maxAmmo) * 100 + '%' }"></div>
      </div>
    </div>

    <div class="world" :style="{ filter: muzzleFlash ? 'brightness(1.4)' : 'none' }">
      <div class="grid-layer"></div>
      
      <div v-for="p in particles" :key="p.id" 
           class="particle-effect" 
           :style="{ left: p.x + 'px', top: p.y + 'px', backgroundColor: p.color, opacity: p.life }">
      </div>

      <div v-if="!isGameOver">
        <div v-for="e in enemies" :key="e.id" class="enemy" :style="{ left: e.x + 'px', top: e.y + 'px' }">
          <div class="enemy-hp" :style="{ width: (e.life * 50) + '%' }"></div>
        </div>
      </div>
    </div>

    <div v-if="isGameOver" class="game-over-overlay">
      <div class="game-over-card">
        <h1>TEMPO ESGOTADO</h1>
        <div class="final-stats">
          <div class="stat-item">
            <span>KILLS NESTA RUNDA</span>
            <span class="big-value">{{ kills }}</span>
          </div>
          <div class="stat-item" v-if="newRecord">
            <span class="new-record-badge">NOVO RECORDE!</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn-primary" @click="restartGame">TENTAR NOVAMENTE</button>
          <button class="btn-secondary" @click="goToMenu">MENU PRINCIPAL</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import Crosshair from "../components/Crosshair.vue";
import { weapons } from "../assets/weapons";

const router = useRouter();
const ENEMY_SIZE = 40;
const GAME_DURATION = 60; // 60 segundos de jogo

// Estados do Jogo
const isGameOver = ref(false);
const timeLeft = ref(GAME_DURATION);
const highLifeKills = ref(localStorage.getItem('lastbullet_highscore') || 0);
const newRecord = ref(false);

const aim = ref({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
const weaponKey = ref("rifle");
const weapon = ref(weapons[weaponKey.value]);
const ammo = ref(weapon.value.maxAmmo);
const isReloading = ref(false);
const muzzleFlash = ref(false);
const currentSpread = ref(0);
const enemies = ref([]);
const particles = ref([]);
const kills = ref(0);
const hitMarker = ref(false);

let shooting = false;
let lastShot = 0;
let raf = null;
let timerInterval = null;

// Áudios
const audioCtx = {
  shoot: "https://actions.google.com/sounds/v1/weapons/firearm_pisto_shot.ogg",
  hit: "https://actions.google.com/sounds/v1/weapons/metal_clank.ogg",
  reload: "https://actions.google.com/sounds/v1/weapons/weapon_cocking.ogg",
  empty: "https://actions.google.com/sounds/v1/foley/door_handle_click.ogg",
  gameOver: "https://actions.google.com/sounds/v1/alarms/alarm_clock_beeping.ogg"
};

function playSound(type) {
  const audio = new Audio(audioCtx[type]);
  audio.volume = 0.3;
  audio.play().catch(() => {});
}

function lockPointer() {
  if (!isGameOver.value && document.pointerLockElement !== document.body) {
    document.body.requestPointerLock();
  }
}

function updateAim(pos) { aim.value = pos; }

function spawnEnemy() {
  enemies.value.push({
    id: Math.random(),
    x: Math.random() * (window.innerWidth - ENEMY_SIZE),
    y: Math.random() * (window.innerHeight - ENEMY_SIZE),
    vx: (Math.random() - 0.5) * 6,
    vy: (Math.random() - 0.5) * 6,
    life: 2,
  });
}

function createExplosion(x, y, color) {
  for (let i = 0; i < 8; i++) {
    particles.value.push({
      id: Math.random(),
      x: x, y: y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      life: 1.0, color: color
    });
  }
}

function reload() {
  if (isReloading.value || ammo.value === weapon.value.maxAmmo) return;
  isReloading.value = true;
  playSound('reload');
  setTimeout(() => {
    ammo.value = weapon.value.maxAmmo;
    isReloading.value = false;
  }, weapon.value.reloadTime);
}

function shoot() {
  if (isReloading.value || isGameOver.value) return;
  if (ammo.value <= 0) {
    const now = Date.now();
    if (now - lastShot > 300) { playSound('empty'); lastShot = now; }
    return;
  }
  const now = Date.now();
  if (now - lastShot < weapon.value.fireRate) return;
  
  lastShot = now;
  ammo.value--;
  playSound('shoot');
  muzzleFlash.value = true;
  setTimeout(() => muzzleFlash.value = false, 30);
  currentSpread.value = Math.min(currentSpread.value + 10, weapon.value.spreadMax);

  const tx = aim.value.x;
  const ty = aim.value.y;

  enemies.value.forEach(e => {
    if (tx >= e.x && tx <= e.x + ENEMY_SIZE && ty >= e.y && ty <= e.y + ENEMY_SIZE) {
      e.life -= weapon.value.damage;
      hitMarker.value = true;
      playSound('hit');
      createExplosion(tx, ty, '#ff3b3b');
      setTimeout(() => (hitMarker.value = false), 60);
      if (e.life <= 0) {
        kills.value++;
        createExplosion(e.x + 20, e.y + 20, '#ffffff');
        enemies.value = enemies.value.filter(x => x.id !== e.id);
        spawnEnemy();
      }
    }
  });
}

function endGame() {
  isGameOver.value = true;
  document.exitPointerLock();
  playSound('gameOver');
  
  if (kills.value > highLifeKills.value) {
    highLifeKills.value = kills.value;
    localStorage.setItem('lastbullet_highscore', kills.value);
    newRecord.value = true;
  }
}

function restartGame() {
  kills.value = 0;
  timeLeft.value = GAME_DURATION;
  isGameOver.value = false;
  newRecord.value = false;
  ammo.value = weapon.value.maxAmmo;
  enemies.value = [];
  for (let i = 0; i < 8; i++) spawnEnemy();
}

function goToMenu() {
  router.push('/');
}

function update() {
  if (!isGameOver.value) {
    currentSpread.value *= 0.9;
    enemies.value.forEach(e => {
      e.x += e.vx; e.y += e.vy;
      if (e.x <= 0 || e.x >= window.innerWidth - ENEMY_SIZE) e.vx *= -1;
      if (e.y <= 0 || e.y >= window.innerHeight - ENEMY_SIZE) e.vy *= -1;
    });
    if (shooting) shoot();
  }
  
  particles.value.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.life -= 0.02;
  });
  particles.value = particles.value.filter(p => p.life > 0);
  
  raf = requestAnimationFrame(update);
}

onMounted(() => {
  for (let i = 0; i < 8; i++) spawnEnemy();
  raf = requestAnimationFrame(update);
  
  timerInterval = setInterval(() => {
    if (!isGameOver.value) {
      timeLeft.value--;
      if (timeLeft.value <= 0) endGame();
    }
  }, 1000);

  window.addEventListener("mousedown", (e) => e.button === 0 && (shooting = true));
  window.addEventListener("mouseup", (e) => e.button === 0 && (shooting = false));
  window.addEventListener("keydown", (e) => {
    if (isGameOver.value) return;
    if (e.key === "1") { weapon.value = weapons.pistol; ammo.value = weapon.value.maxAmmo; playSound('reload'); }
    if (e.key === "2") { weapon.value = weapons.rifle; ammo.value = weapon.value.maxAmmo; playSound('reload'); }
    if (e.key === "3") { weapon.value = weapons.sniper; ammo.value = weapon.value.maxAmmo; playSound('reload'); }
    if (e.key.toLowerCase() === "r") reload();
  });
});

onUnmounted(() => {
  cancelAnimationFrame(raf);
  clearInterval(timerInterval);
});
</script>

<style scoped>
.arena { width: 100vw; height: 100vh; background: #050505; overflow: hidden; position: relative; }
.world { position: absolute; width: 100%; height: 100%; transition: filter 0.05s; }
.grid-layer { position: absolute; width: 100%; height: 100%; background-image: linear-gradient(#151515 1px, transparent 1px), linear-gradient(90deg, #151515 1px, transparent 1px); background-size: 60px 60px; }
.enemy { position: absolute; width: 40px; height: 40px; background: #ff3b3b; border-radius: 50%; box-shadow: 0 0 20px rgba(255, 59, 59, 0.6); border: 2px solid #fff; z-index: 2; }
.particle-effect { position: absolute; width: 4px; height: 4px; border-radius: 50%; pointer-events: none; z-index: 1; }
.enemy-hp { position: absolute; top: -10px; height: 4px; background: #2ecc71; transition: width 0.1s; }

.hud { position: fixed; top: 20px; left: 20px; z-index: 10; display: flex; gap: 20px; }
.stats-box { background: rgba(0, 0, 0, 0.8); padding: 10px 20px; border-bottom: 3px solid #e74c3c; color: white; font-family: 'Orbitron', sans-serif; }
.critical-time { color: #ff3b3b; animation: pulse 1s infinite; }

.ammo-hud { position: fixed; bottom: 40px; right: 40px; z-index: 10; width: 220px; }
.ammo-text { font-family: monospace; font-size: 1.8rem; color: white; text-align: right; margin-bottom: 5px; }
.ammo-bar-bg { width: 100%; height: 6px; background: rgba(255,255,255,0.1); }
.ammo-bar-fill { height: 100%; background: #e74c3c; transition: width 0.1s; }

/* GAME OVER STYLES */
.game-over-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.9);
  display: flex; align-items: center; justify-content: center; z-index: 100;
  backdrop-filter: blur(5px);
}
.game-over-card {
  text-align: center; background: #111; padding: 50px; border: 1px solid #333;
  box-shadow: 0 0 30px rgba(231, 76, 60, 0.3); border-radius: 8px;
}
h1 { font-size: 3rem; color: #e74c3c; margin-bottom: 30px; letter-spacing: 5px; }
.final-stats { margin-bottom: 40px; }
.stat-item { display: flex; flex-direction: column; gap: 10px; }
.big-value { font-size: 4rem; font-weight: bold; color: #fff; }
.new-record-badge { background: #f1c40f; color: #000; padding: 5px 15px; font-weight: bold; border-radius: 20px; animation: scaleUp 0.5s ease-out; }

.actions { display: flex; gap: 20px; justify-content: center; }
button { padding: 15px 30px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-primary { background: #e74c3c; color: white; }
.btn-primary:hover { background: #c0392b; transform: translateY(-2px); }
.btn-secondary { background: #333; color: white; }

@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
@keyframes scaleUp { from { transform: scale(0); } to { transform: scale(1); } }
</style>