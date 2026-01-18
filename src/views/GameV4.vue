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

    <div class="world" :style="{ 
      transform: `translate(${-cam.x}px, ${-cam.y}px)`,
      filter: muzzleFlash ? 'brightness(1.2)' : 'none' 
    }">
      <div class="grid-layer"></div>
      
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

const MAP_SIZE = 2500;
const ENEMY_SIZE = 40;

const cam = ref({ x: 0, y: 0 });
const mouseDelta = { x: 0, y: 0 };
const sensitivity = 0.5;

const aim = ref({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
const weaponKey = ref("rifle");
const weapon = ref(weapons[weaponKey.value]);

const ammo = ref(weapon.value.maxAmmo);
const isReloading = ref(false);
const muzzleFlash = ref(false);

const recoil = { x: 0, y: 0 };
const currentSpread = ref(0);
const enemies = ref([]);
const kills = ref(0);
const hitMarker = ref(false);

let shooting = false;
let lastShot = 0;
let raf = null;

function lockPointer() {
  if (document.pointerLockElement !== document.body) {
    document.body.requestPointerLock();
  }
}

function updateAim(pos) { aim.value = pos; }

function clampCamera() {
  cam.value.x = Math.max(0, Math.min(cam.value.x, MAP_SIZE - window.innerWidth));
  cam.value.y = Math.max(0, Math.min(cam.value.y, MAP_SIZE - window.innerHeight));
}

function spawnEnemy() {
  enemies.value.push({
    id: Math.random(),
    x: Math.random() * (MAP_SIZE - ENEMY_SIZE),
    y: Math.random() * (MAP_SIZE - ENEMY_SIZE),
    vx: (Math.random() - 0.5) * 2.5,
    vy: (Math.random() - 0.5) * 2.5,
    life: 2,
  });
}

function reload() {
  if (isReloading.value || ammo.value === weapon.value.maxAmmo) return;
  isReloading.value = true;
  setTimeout(() => {
    ammo.value = weapon.value.maxAmmo;
    isReloading.value = false;
  }, weapon.value.reloadTime);
}

function shoot() {
  if (isReloading.value || ammo.value <= 0) {
    if (ammo.value <= 0) reload();
    return;
  }

  const now = Date.now();
  if (now - lastShot < weapon.value.fireRate) return;
  
  lastShot = now;
  ammo.value--;
  
  // Feedback Visual
  muzzleFlash.value = true;
  setTimeout(() => muzzleFlash.value = false, 30);
  currentSpread.value = Math.min(currentSpread.value + 10, weapon.value.spreadMax);

  // Recoil
  recoil.y += weapon.value.recoil.y;
  recoil.x += (Math.random() - 0.5) * weapon.value.recoil.x;

  const worldX = cam.value.x + aim.value.x;
  const worldY = cam.value.y + aim.value.y;

  enemies.value.forEach(e => {
    if (worldX >= e.x && worldX <= e.x + ENEMY_SIZE && worldY >= e.y && worldY <= e.y + ENEMY_SIZE) {
      e.life -= weapon.value.damage;
      hitMarker.value = true;
      setTimeout(() => (hitMarker.value = false), 60);

      if (e.life <= 0) {
        kills.value++;
        enemies.value = enemies.value.filter(x => x.id !== e.id);
        spawnEnemy();
      }
    }
  });
}

function update() {
  currentSpread.value *= 0.9;
  cam.value.x += mouseDelta.x * sensitivity + recoil.x;
  cam.value.y += mouseDelta.y * sensitivity + recoil.y;

  mouseDelta.x = 0; mouseDelta.y = 0;
  recoil.x *= 0.8; recoil.y *= 0.8;

  clampCamera();

  enemies.value.forEach(e => {
    e.x += e.vx; e.y += e.vy;
    if (e.x <= 0 || e.x >= MAP_SIZE - ENEMY_SIZE) e.vx *= -1;
    if (e.y <= 0 || e.y >= MAP_SIZE - ENEMY_SIZE) e.vy *= -1;
  });

  if (shooting) shoot();
  raf = requestAnimationFrame(update);
}

function onMouseMove(e) {
  if (document.pointerLockElement !== document.body) return;
  mouseDelta.x += e.movementX;
  mouseDelta.y += e.movementY;
}

onMounted(() => {
  for (let i = 0; i < 8; i++) spawnEnemy();
  raf = requestAnimationFrame(update);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", (e) => e.button === 0 && (shooting = true));
  window.addEventListener("mouseup", (e) => e.button === 0 && (shooting = false));
  window.addEventListener("keydown", (e) => {
    if (e.key === "1") { weaponKey.ref = "pistol"; weapon.value = weapons.pistol; ammo.value = weapon.value.maxAmmo; }
    if (e.key === "2") { weaponKey.ref = "rifle"; weapon.value = weapons.rifle; ammo.value = weapon.value.maxAmmo; }
    if (e.key === "3") { weaponKey.ref = "sniper"; weapon.value = weapons.sniper; ammo.value = weapon.value.maxAmmo; }
    if (e.key.toLowerCase() === "r") reload();
  });
});

onUnmounted(() => cancelAnimationFrame(raf));
</script>

<style scoped>
.arena {
  width: 100vw; height: 100vh;
  background: #050505; overflow: hidden; position: relative;
}

.world {
  position: absolute; width: 2500px; height: 2500px;
  transition: filter 0.05s;
}

.grid-layer {
  position: absolute; width: 100%; height: 100%;
  background-image: linear-gradient(#151515 1px, transparent 1px), linear-gradient(90deg, #151515 1px, transparent 1px);
  background-size: 80px 80px;
}

.enemy {
  position: absolute; width: 40px; height: 40px;
  background: #ff3b3b; border-radius: 4px;
  box-shadow: 0 0 15px rgba(255, 59, 59, 0.4);
}

.enemy-hp {
  position: absolute; top: -10px; height: 4px;
  background: #2ecc71; transition: width 0.2s;
}

.hud {
  position: fixed; top: 20px; left: 20px; z-index: 10;
  display: flex; gap: 20px;
}

.stats-box {
  background: rgba(0, 0, 0, 0.7); padding: 10px 20px;
  border-left: 4px solid #e74c3c; color: white; font-family: monospace;
}

.label { color: #888; font-size: 0.8rem; margin-right: 8px; }
.value { font-weight: bold; font-size: 1.2rem; }

.ammo-hud {
  position: fixed; bottom: 40px; right: 40px; z-index: 10;
  width: 200px; text-align: right;
}

.ammo-text {
  font-family: monospace; font-size: 1.5rem; color: white;
  margin-bottom: 5px; text-shadow: 0 2px 4px black;
}

.ammo-bar-bg { width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; }
.ammo-bar-fill { height: 100%; background: #e74c3c; border-radius: 4px; transition: width 0.1s; }

.low-ammo .ammo-text { color: #ff3b3b; animation: blink 0.5s infinite; }
@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
</style>