<template>
  <div class="arena hide-cursor" @click="lockPointer">
    <!-- HUD -->
    <Crosshair :hit="hitMarker" />

    <div class="hud">
      <div>Kills: {{ kills }}</div>
    </div>

    <!-- WORLD -->
    <div
      class="world"
      :style="{ transform: `translate(${-cam.x}px, ${-cam.y}px)` }"
    >
      <div
        v-for="e in enemies"
        :key="e.id"
        class="enemy"
        :style="{ left: e.x + 'px', top: e.y + 'px' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Crosshair from "../components/Crosshair.vue";

const MAP_SIZE = 2000;
const ENEMY_SIZE = 40;

/* CAMERA */
const cam = ref({ x: 0, y: 0 });
const mouseDelta = { x: 0, y: 0 };
const sensitivity = 0.25;

/* RECOIL */
const recoil = { x: 0, y: 0 };
const recoilStrength = 1.4;
const recoilRecover = 0.12;

/* GAME */
const enemies = ref([]);
const kills = ref(0);
const hitMarker = ref(false);

let shooting = false;
let lastShot = 0;
let raf = null;

/* POINTER LOCK */
function lockPointer() {
  if (document.pointerLockElement !== document.body) {
    document.body.requestPointerLock();
  }
}

/* CAMERA LIMIT */
function clampCamera() {
  const maxX = MAP_SIZE - window.innerWidth;
  const maxY = MAP_SIZE - window.innerHeight;

  cam.value.x = Math.max(0, Math.min(cam.value.x, maxX));
  cam.value.y = Math.max(0, Math.min(cam.value.y, maxY));
}

/* ENEMY */
function spawnEnemy() {
  enemies.value.push({
    id: Math.random(),
    x: Math.random() * (MAP_SIZE - ENEMY_SIZE),
    y: Math.random() * (MAP_SIZE - ENEMY_SIZE),
    vx: (Math.random() - 0.5) * 1.4,
    vy: (Math.random() - 0.5) * 1.4,
    life: 2,
  });
}

/* HIT */
function hitFlash() {
  hitMarker.value = true;
  setTimeout(() => (hitMarker.value = false), 60);
}

/* SHOOT */
function shoot() {
  const now = Date.now();
  if (now - lastShot < 120) return;
  lastShot = now;

  recoil.y += recoilStrength;
  recoil.x += (Math.random() - 0.5) * 0.8;

  const cx = cam.value.x + window.innerWidth / 2;
  const cy = cam.value.y + window.innerHeight / 2;

  enemies.value.forEach(e => {
    if (
      cx > e.x &&
      cx < e.x + ENEMY_SIZE &&
      cy > e.y &&
      cy < e.y + ENEMY_SIZE
    ) {
      e.life--;
      hitFlash();

      if (e.life <= 0) {
        kills.value++;
        enemies.value = enemies.value.filter(x => x.id !== e.id);
        spawnEnemy();
      }
    }
  });
}

/* MAIN LOOP */
function update() {
  /* aplica mouse */
  cam.value.x += mouseDelta.x * sensitivity + recoil.x;
  cam.value.y += mouseDelta.y * sensitivity + recoil.y;

  mouseDelta.x = 0;
  mouseDelta.y = 0;

  /* recoil recovery */
  recoil.x *= 1 - recoilRecover;
  recoil.y *= 1 - recoilRecover;

  clampCamera();

  /* move enemies */
  enemies.value.forEach(e => {
    e.x += e.vx;
    e.y += e.vy;

    if (e.x <= 0 || e.x >= MAP_SIZE - ENEMY_SIZE) e.vx *= -1;
    if (e.y <= 0 || e.y >= MAP_SIZE - ENEMY_SIZE) e.vy *= -1;
  });

  if (shooting) shoot();

  raf = requestAnimationFrame(update);
}

/* INPUT */
function onMouseMove(e) {
  if (document.pointerLockElement !== document.body) return;
  mouseDelta.x += e.movementX;
  mouseDelta.y += e.movementY;
}

function onMouseDown(e) {
  if (e.button === 0) shooting = true;
}

function onMouseUp(e) {
  if (e.button === 0) shooting = false;
}

/* LIFECYCLE */
onMounted(() => {
  for (let i = 0; i < 6; i++) spawnEnemy();

  raf = requestAnimationFrame(update);

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
});

onUnmounted(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mousedown", onMouseDown);
  window.removeEventListener("mouseup", onMouseUp);
});
</script>

<style scoped>
.arena {
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
  position: relative;
}

.world {
  position: absolute;
  width: 2000px;
  height: 2000px;
}

.enemy {
  position: absolute;
  width: 40px;
  height: 40px;
  background: #ff3b3b;
  border-radius: 6px;
}

.hud {
  position: fixed;
  top: 10px;
  right: 10px;
  font-size: 14px;
}
</style>
