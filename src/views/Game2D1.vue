<template>
  <div class="arena hide-cursor" @click="lockPointer">
    <div class="shake-container" :style="{ transform: `translate(${shake.x}px, ${shake.y}px)` }">
      
      <Crosshair v-if="!isGameOver" :hit="hitMarker" :spread="currentSpread" @move="updateAim" />

      <div class="hud" v-if="!isGameOver">
        <div class="stats-box health-box">
          <span class="label">INTEGRIDADE:</span> 
          <div class="hp-bar-bg"><div class="hp-bar-fill" :style="{ width: playerHp + '%' }"></div></div>
        </div>
        <div class="stats-box">
          <span class="label">NÍVEL:</span> <span class="value" style="color: #f1c40f">{{ gameLevel }}</span>
        </div>
        <div class="stats-box">
          <span class="label">TEMPO:</span> 
          <span class="value" :class="{ 'critical-time': timeLeft <= 10 }">{{ timeLeft }}s</span>
        </div>
        <div class="stats-box">
          <span class="label">KILLS:</span> <span class="value">{{ kills }}</span>
        </div>
      </div>

      <div class="ammo-hud" v-if="!isGameOver">
        <div class="ammo-text">{{ isReloading ? 'RECARREGANDO...' : `${ammo} / ${weapon.maxAmmo}` }}</div>
        <div class="ammo-bar-bg"><div class="ammo-bar-fill" :style="{ width: (ammo / weapon.maxAmmo) * 100 + '%' }"></div></div>
      </div>

      <div class="world" :style="{ 
        filter: muzzleFlash ? 'brightness(1.3)' : 'none',
        backgroundColor: playerHitFlash ? '#440000' : '#050505'
      }">
        <div class="grid-layer"></div>
        
        <div v-for="p in particles" :key="p.id" class="particle-effect" :style="{ left: p.x + 'px', top: p.y + 'px', backgroundColor: p.color, opacity: p.life, width: p.size+'px', height: p.size+'px' }"></div>
        <div v-for="b in enemyBullets" :key="b.id" class="enemy-bullet" :style="{ left: b.x + 'px', top: b.y + 'px' }"></div>

        <div v-if="!isGameOver">
          <div v-for="e in enemies" :key="e.id" class="enemy" :style="{ left: e.x + 'px', top: e.y + 'px', border: e.isElite ? '2px solid #f1c40f' : '2px solid #fff' }">
            <div class="enemy-hp" :style="{ width: (e.life * (e.isElite ? 25 : 50)) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isGameOver" class="game-over-overlay">
      <div class="game-over-card">
        <h1 :style="{ color: playerHp <= 0 ? '#ff3b3b' : '#f1c40f' }">{{ playerHp <= 0 ? 'ABATIDO EM COMBATE' : 'MISSÃO CONCLUÍDA' }}</h1>
        <div class="final-stats">
          <div class="stat-item"><span>KILLS TOTAIS</span><span class="big-value">{{ kills }}</span></div>
          <div class="stat-item"><span>NÍVEL ALCANÇADO</span><span class="value">{{ gameLevel }}</span></div>
          <div v-if="newRecord" class="new-record-badge">NOVO RECORDE GLOBAL!</div>
        </div>
        <div class="actions">
          <button class="btn-primary" @click="restartGame">REIMPLANTAÇÃO</button>
          <button class="btn-secondary" @click="goToMenu">SAIR</button>
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

// Estados
const isGameOver = ref(false);
const timeLeft = ref(60);
const playerHp = ref(100);
const gameLevel = ref(1);
const playerHitFlash = ref(false);
const highLifeKills = ref(localStorage.getItem('lastbullet_highscore') || 0);
const newRecord = ref(false);
const shake = ref({ x: 0, y: 0 });

const aim = ref({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
const weapon = ref(weapons.rifle);
const ammo = ref(30);
const isReloading = ref(false);
const muzzleFlash = ref(false);
const currentSpread = ref(0);
const enemies = ref([]);
const particles = ref([]);
const enemyBullets = ref([]);
const kills = ref(0);
const hitMarker = ref(false);

let shooting = false;
let lastShot = 0;
let raf = null;
let timerInterval = null;

const audioLinks = {
  shoot: "https://actions.google.com/sounds/v1/weapons/firearm_pisto_shot.ogg",
  hit: "https://actions.google.com/sounds/v1/weapons/metal_clank.ogg",
  playerHit: "https://actions.google.com/sounds/v1/impacts/flesh_impact_heavy.ogg",
  reload: "https://actions.google.com/sounds/v1/weapons/weapon_cocking.ogg",
  levelUp: "https://actions.google.com/sounds/v1/science_fiction/beaming_up.ogg"
};

function playSound(type) { new Audio(audioLinks[type]).play().catch(()=>{}); }
function lockPointer() { if (!isGameOver.value) document.body.requestPointerLock(); }
function updateAim(pos) { aim.value = pos; }

// Função de Tremer a Câmara
function applyShake(intensity) {
  const s = intensity;
  shake.value = { x: (Math.random()-0.5)*s, y: (Math.random()-0.5)*s };
  setTimeout(() => shake.value = { x: 0, y: 0 }, 50);
}

function spawnEnemy() {
  const isElite = Math.random() < (gameLevel.value * 0.1); // Elites aparecem mais em níveis altos
  enemies.value.push({
    id: Math.random(),
    isElite,
    x: Math.random() * (window.innerWidth - ENEMY_SIZE),
    y: Math.random() * (window.innerHeight - ENEMY_SIZE),
    vx: (Math.random() - 0.5) * (4 + gameLevel.value),
    vy: (Math.random() - 0.5) * (4 + gameLevel.value),
    life: isElite ? 4 : 2,
    lastFired: Date.now() + Math.random() * 2000
  });
}

function shoot() {
  if (isReloading.value || isGameOver.value || ammo.value <= 0) return;
  const now = Date.now();
  if (now - lastShot < weapon.value.fireRate) return;
  
  lastShot = now; ammo.value--;
  playSound('shoot');
  applyShake(6); // Tremor ao disparar
  muzzleFlash.value = true; setTimeout(() => muzzleFlash.value = false, 30);
  currentSpread.value = Math.min(currentSpread.value + 10, weapon.value.spreadMax);

  enemies.value.forEach(e => {
    if (aim.value.x >= e.x && aim.value.x <= e.x + ENEMY_SIZE && aim.value.y >= e.y && aim.value.y <= e.y + ENEMY_SIZE) {
      e.life -= weapon.value.damage;
      hitMarker.value = true; playSound('hit');
      applyShake(10); // Mais tremor ao acertar
      if (e.life <= 0) {
        kills.value++;
        if (kills.value % 10 === 0) { gameLevel.value++; playSound('levelUp'); }
        enemies.value = enemies.value.filter(x => x.id !== e.id);
        spawnEnemy();
      }
    }
  });
}

function update() {
  if (!isGameOver.value) {
    currentSpread.value *= 0.9;
    const now = Date.now();

    enemies.value.forEach(e => {
      e.x += e.vx; e.y += e.vy;
      if (e.x <= 0 || e.x >= window.innerWidth - ENEMY_SIZE) e.vx *= -1;
      if (e.y <= 0 || e.y >= window.innerHeight - ENEMY_SIZE) e.vy *= -1;

      const fireRate = Math.max(1000, 3000 - (gameLevel.value * 200));
      if (now - e.lastFired > fireRate) {
        enemyBullets.value.push({ 
          id: Math.random(), 
          x: e.x + 20, y: e.y + 20, 
          vx: (aim.value.x - e.x) * 0.025, 
          vy: (aim.value.y - e.y) * 0.025 
        });
        e.lastFired = now;
      }
    });

    enemyBullets.value.forEach((b, index) => {
      b.x += b.vx; b.y += b.vy;
      if (Math.hypot(b.x - aim.value.x, b.y - aim.value.y) < 15) {
        playerHp.value -= 10;
        playerHitFlash.value = true;
        applyShake(25); // Tremor forte ao levar dano
        playSound('playerHit');
        setTimeout(() => playerHitFlash.value = false, 100);
        enemyBullets.value.splice(index, 1);
        if (playerHp.value <= 0) endGame();
      }
    });
    if (shooting) shoot();
  }
  raf = requestAnimationFrame(update);
}

function endGame() {
  isGameOver.value = true;
  document.exitPointerLock();
  if (kills.value > highLifeKills.value) {
    localStorage.setItem('lastbullet_highscore', kills.value);
    newRecord.value = true;
  }
}

function restartGame() {
  kills.value = 0; timeLeft.value = 60; playerHp.value = 100; gameLevel.value = 1;
  isGameOver.value = false; newRecord.value = false;
  enemies.value = []; enemyBullets.value = [];
  for (let i = 0; i < 6; i++) spawnEnemy();
}

function goToMenu() { router.push('/'); }

onMounted(() => {
  restartGame();
  raf = requestAnimationFrame(update);
  timerInterval = setInterval(() => { if (!isGameOver.value) timeLeft.value--; if (timeLeft.value <= 0) endGame(); }, 1000);
  window.addEventListener("mousedown", (e) => e.button === 0 && (shooting = true));
  window.addEventListener("mouseup", (e) => e.button === 0 && (shooting = false));
  window.addEventListener("keydown", (e) => {
    if (e.key === "1") weapon.value = weapons.pistol;
    if (e.key === "2") weapon.value = weapons.rifle;
    if (e.key === "r") {
      if (isReloading.value || ammo.value === weapon.value.maxAmmo) return;
      isReloading.value = true; playSound('reload');
      setTimeout(() => { ammo.value = weapon.value.maxAmmo; isReloading.value = false; }, weapon.value.reloadTime);
    }
  });
});

onUnmounted(() => { cancelAnimationFrame(raf); clearInterval(timerInterval); });
</script>

<style scoped>
.arena { width: 100vw; height: 100vh; background: #000; overflow: hidden; position: relative; }
.shake-container { width: 100%; height: 100%; transition: transform 0.05s; }
.world { width: 100%; height: 100%; position: relative; }
.grid-layer { position: absolute; inset: 0; background-image: linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px); background-size: 80px 80px; }

.enemy { position: absolute; width: 40px; height: 40px; background: #ff3b3b; border-radius: 4px; z-index: 2; box-shadow: 0 0 15px rgba(255, 59, 59, 0.5); }
.enemy-bullet { position: absolute; width: 8px; height: 8px; background: #f1c40f; border-radius: 50%; box-shadow: 0 0 15px #f1c40f; z-index: 3; }

.hud { position: fixed; top: 20px; left: 20px; z-index: 10; display: flex; gap: 15px; font-family: 'Courier New', Courier, monospace; }
.stats-box { background: rgba(0, 0, 0, 0.85); padding: 10px; border-left: 4px solid #e74c3c; color: white; min-width: 100px; }
.health-box { border-left-color: #2ecc71; width: 180px; }
.hp-bar-bg { width: 100%; height: 6px; background: #222; margin-top: 5px; }
.hp-bar-fill { height: 100%; background: #2ecc71; transition: width 0.2s; }

.ammo-hud { position: fixed; bottom: 30px; right: 30px; width: 180px; text-align: right; }
.ammo-text { color: white; font-size: 1.5rem; margin-bottom: 5px; }

.game-over-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; z-index: 100; }
.game-over-card { background: #0a0a0a; padding: 60px; border: 1px solid #222; text-align: center; }
.big-value { font-size: 4rem; color: #fff; display: block; }
.new-record-badge { color: #f1c40f; font-weight: bold; margin-top: 15px; letter-spacing: 2px; }

button { padding: 15px 30px; border: none; font-weight: bold; cursor: pointer; margin: 10px; text-transform: uppercase; letter-spacing: 1px; }
.btn-primary { background: #e74c3c; color: #fff; }
.btn-secondary { background: #222; color: #aaa; }
</style>