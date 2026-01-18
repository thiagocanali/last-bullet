<template>
  <div class="arena hide-cursor" @click="lockPointer">
    <Crosshair :hit="hitMarker" :spread="currentSpread" @move="updateAim" />

    <div class="hud">
      <div class="stats-box">
        <span class="label">ARMA:</span> <span class="value">{{ weapon.name }}</span>
      </div>
      <div class="stats-box">
        <span class="label">KILLS:</span> <span class="value">{{ kills }}</span>
      </div>
    </div>

    <div class="ammo-hud" :class="{ 'low-ammo': ammo <= 0 }">
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

      <div v-for="e in enemies" :key="e.id" class="enemy" :style="{ left: e.x + 'px', top: e.y + 'px' }">
        <div class="enemy-hp" :style="{ width: (e.life * 50) + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Crosshair from "../components/Crosshair.vue";
import { weapons } from "../assets/weapons";

const ENEMY_SIZE = 40;
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

// --- SISTEMA DE AUDIO ---
const audioCtx = {
  shoot: "https://actions.google.com/sounds/v1/weapons/firearm_pisto_shot.ogg",
  hit: "https://actions.google.com/sounds/v1/weapons/metal_clank.ogg",
  reload: "https://actions.google.com/sounds/v1/weapons/weapon_cocking.ogg",
  empty: "https://actions.google.com/sounds/v1/foley/door_handle_click.ogg"
};

function playSound(type) {
  const audio = new Audio(audioCtx[type]);
  audio.volume = 0.3;
  audio.play().catch(() => {}); // Catch para evitar erro de interação do browser
}

function lockPointer() {
  if (document.pointerLockElement !== document.body) document.body.requestPointerLock();
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
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      life: 1.0,
      color: color
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
  if (isReloading.value) return;
  
  if (ammo.value <= 0) {
    const now = Date.now();
    if (now - lastShot > 300) {
      playSound('empty');
      lastShot = now;
    }
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

function update() {
  currentSpread.value *= 0.9;
  enemies.value.forEach(e => {
    e.x += e.vx; e.y += e.vy;
    if (e.x <= 0 || e.x >= window.innerWidth - ENEMY_SIZE) e.vx *= -1;
    if (e.y <= 0 || e.y >= window.innerHeight - ENEMY_SIZE) e.vy *= -1;
  });
  particles.value.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.life -= 0.02;
  });
  particles.value = particles.value.filter(p => p.life > 0);
  if (shooting) shoot();
  raf = requestAnimationFrame(update);
}

onMounted(() => {
  for (let i = 0; i < 8; i++) spawnEnemy();
  raf = requestAnimationFrame(update);
  window.addEventListener("mousedown", (e) => e.button === 0 && (shooting = true));
  window.addEventListener("mouseup", (e) => e.button === 0 && (shooting = false));
  window.addEventListener("keydown", (e) => {
    if (e.key === "1") { weapon.value = weapons.pistol; ammo.value = weapon.value.maxAmmo; playSound('reload'); }
    if (e.key === "2") { weapon.value = weapons.rifle; ammo.value = weapon.value.maxAmmo; playSound('reload'); }
    if (e.key === "3") { weapon.value = weapons.sniper; ammo.value = weapon.value.maxAmmo; playSound('reload'); }
    if (e.key.toLowerCase() === "r") reload();
  });
});

onUnmounted(() => cancelAnimationFrame(raf));
</script>

<style scoped>
/* Mantém o mesmo estilo do anterior */
.arena { width: 100vw; height: 100vh; background: #050505; overflow: hidden; position: relative; }
.world { position: absolute; width: 100%; height: 100%; transition: filter 0.05s; }
.grid-layer { position: absolute; width: 100%; height: 100%; background-image: linear-gradient(#151515 1px, transparent 1px), linear-gradient(90deg, #151515 1px, transparent 1px); background-size: 60px 60px; }
.enemy { position: absolute; width: 40px; height: 40px; background: #ff3b3b; border-radius: 50%; box-shadow: 0 0 20px rgba(255, 59, 59, 0.6); border: 2px solid #fff; z-index: 2; }
.particle-effect { position: absolute; width: 4px; height: 4px; border-radius: 50%; pointer-events: none; z-index: 1; }
.enemy-hp { position: absolute; top: -10px; height: 4px; background: #2ecc71; transition: width 0.1s; }
.hud { position: fixed; top: 20px; left: 20px; z-index: 10; display: flex; gap: 20px; }
.stats-box { background: rgba(0, 0, 0, 0.8); padding: 10px 20px; border-bottom: 3px solid #e74c3c; color: white; font-family: sans-serif; }
.label { color: #888; font-size: 0.7rem; display: block; }
.value { font-weight: bold; font-size: 1.1rem; }
.ammo-hud { position: fixed; bottom: 40px; right: 40px; z-index: 10; width: 220px; }
.ammo-text { font-family: monospace; font-size: 1.8rem; color: white; text-align: right; margin-bottom: 5px; }
.ammo-bar-bg { width: 100%; height: 6px; background: rgba(255,255,255,0.1); }
.ammo-bar-fill { height: 100%; background: #e74c3c; transition: width 0.1s; }
</style>