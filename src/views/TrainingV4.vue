<template>
  <div class="arena hide-cursor" @click="lockPointer">
    <Crosshair :hit="hitMarker" />

    <div class="hud">
      <div>Score: {{ score }}</div>
      <div>Hits: {{ hits }}</div>
      <div>Shots: {{ shots }}</div>
    </div>

    <div
      class="world"
      :style="{ transform: `translate(${-cam.x}px, ${-cam.y}px)` }"
    >
      <div
        v-for="t in targets"
        :key="t.id"
        class="target"
        :style="{ left: t.x + 'px', top: t.y + 'px' }"
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
const targets = ref([]);

const score = ref(0);
const hits = ref(0);
const shots = ref(0);
const hitMarker = ref(false);

let lastShot = 0;
let animationId = null;

function lockPointer() {
  document.body.requestPointerLock();
}

function clampCamera() {
  cam.value.x = Math.max(0, Math.min(cam.value.x, MAP_SIZE - window.innerWidth));
  cam.value.y = Math.max(0, Math.min(cam.value.y, MAP_SIZE - window.innerHeight));
}

function spawnTarget() {
  targets.value.push({
    id: Math.random(),
    x: Math.random() * (MAP_SIZE - SIZE),
    y: Math.random() * (MAP_SIZE - SIZE),
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
  });
}

function showHit() {
  hitMarker.value = true;
  setTimeout(() => (hitMarker.value = false), 80);
}

function shoot() {
  const now = Date.now();
  if (now - lastShot < 150) return;
  lastShot = now;
  shots.value++;

  const cx = cam.value.x + window.innerWidth / 2;
  const cy = cam.value.y + window.innerHeight / 2;

  targets.value.forEach(t => {
    if (
      cx > t.x &&
      cx < t.x + SIZE &&
      cy > t.y &&
      cy < t.y + SIZE
    ) {
      hits.value++;
      score.value++;
      showHit();
      targets.value = targets.value.filter(x => x.id !== t.id);
      spawnTarget();
    }
  });
}

function update() {
  targets.value.forEach(t => {
    t.x += t.vx;
    t.y += t.vy;

    if (t.x <= 0 || t.x >= MAP_SIZE - SIZE) t.vx *= -1;
    if (t.y <= 0 || t.y >= MAP_SIZE - SIZE) t.vy *= -1;
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
  for (let i = 0; i < 6; i++) spawnTarget();
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
  background: #111;
  overflow: hidden;
  position: relative;
}

.world {
  position: absolute;
  width: 2000px;
  height: 2000px;
}

.target {
  position: absolute;
  width: 40px;
  height: 40px;
  background: #ff3b3b;
  border-radius: 50%;
}

.hud {
  position: fixed;
  top: 10px;
  left: 10px;
}
</style>
