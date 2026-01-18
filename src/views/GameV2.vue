<template>
  <div class="arena hide-cursor" @click="lockPointer">
    <Crosshair :hit="hitMarker" />

    <div class="hud">
      <div>Kills: {{ kills }}</div>
    </div>

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
const SIZE = 40;
const sensitivity = 0.4;

const cam = ref({ x: 0, y: 0 });
const enemies = ref([]);
const kills = ref(0);
const hitMarker = ref(false);

let lastShot = 0;
let animationId = null;

function lockPointer() {
  document.body.requestPointerLock();
}

function clampCamera() {
  const maxX = Math.max(0, MAP_SIZE - window.innerWidth);
  const maxY = Math.max(0, MAP_SIZE - window.innerHeight);

  cam.value.x = Math.max(0, Math.min(cam.value.x, maxX));
  cam.value.y = Math.max(0, Math.min(cam.value.y, maxY));
}

function spawnEnemy() {
  enemies.value.push({
    id: Math.random(),
    x: Math.random() * (MAP_SIZE - SIZE),
    y: Math.random() * (MAP_SIZE - SIZE),
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    life: 2,
  });
}

function showHit() {
  hitMarker.value = true;
  setTimeout(() => (hitMarker.value = false), 80);
}

function shoot() {
  const now = Date.now();
  if (now - lastShot < 200) return;
  lastShot = now;

  const cx = cam.value.x + window.innerWidth / 2;
  const cy = cam.value.y + window.innerHeight / 2;

  enemies.value.forEach(e => {
    if (
      cx > e.x &&
      cx < e.x + SIZE &&
      cy > e.y &&
      cy < e.y + SIZE
    ) {
      e.life--;
      showHit();
      if (e.life <= 0) {
        kills.value++;
        enemies.value = enemies.value.filter(x => x.id !== e.id);
        spawnEnemy();
      }
    }
  });
}

function update() {
  enemies.value.forEach(e => {
    e.x += e.vx;
    e.y += e.vy;

    if (e.x <= 0 || e.x >= MAP_SIZE - SIZE) e.vx *= -1;
    if (e.y <= 0 || e.y >= MAP_SIZE - SIZE) e.vy *= -1;
  });

  animationId = requestAnimationFrame(update);
}

function onMouseMove(e) {
  cam.value.x += e.movementX * sensitivity;
  cam.value.y += e.movementY * sensitivity;
  clampCamera();
}

function onMouseDown(e) {
  if (e.button === 0) shoot();
}

onMounted(() => {
  for (let i = 0; i < 6; i++) spawnEnemy();
  animationId = requestAnimationFrame(update);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", onMouseDown);
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mousedown", onMouseDown);
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
  background: #ff5555;
  border-radius: 6px;
}

.hud {
  position: fixed;
  top: 10px;
  right: 10px;
}
</style>
