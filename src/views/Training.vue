<template>
  <div class="arena hide-cursor" @click="lockPointer">
    <Crosshair />

    <div class="hud">
      <div>Score: {{ score }}</div>
      <div>Hits: {{ hits }}</div>
      <div>Shots: {{ shots }}</div>
    </div>

    <div
      v-for="t in targets"
      :key="t.id"
      class="target"
      :style="{ left: t.x + 'px', top: t.y + 'px' }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Crosshair from "../components/Crosshair.vue";

const targets = ref([]);
const score = ref(0);
const hits = ref(0);
const shots = ref(0);

const fireRate = 150;
let lastShot = 0;
let animationId = null;

function lockPointer() {
  document.body.requestPointerLock();
}

function spawnTarget() {
  targets.value.push({
    id: Math.random(),
    x: Math.random() * (window.innerWidth - 40),
    y: Math.random() * (window.innerHeight - 40),
    vx: (Math.random() - 0.5) * 3,
    vy: (Math.random() - 0.5) * 3,
  });
}

function shoot() {
  const now = Date.now();
  if (now - lastShot < fireRate) return;
  lastShot = now;
  shots.value++;

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  targets.value.forEach(t => {
    if (
      cx > t.x &&
      cx < t.x + 40 &&
      cy > t.y &&
      cy < t.y + 40
    ) {
      hits.value++;
      score.value++;
      targets.value = targets.value.filter(x => x.id !== t.id);
      spawnTarget();
    }
  });
}

function update() {
  targets.value.forEach(t => {
    t.x += t.vx;
    t.y += t.vy;

    if (t.x <= 0 || t.x >= window.innerWidth - 40) t.vx *= -1;
    if (t.y <= 0 || t.y >= window.innerHeight - 40) t.vy *= -1;
  });

  animationId = requestAnimationFrame(update);
}

function onMouseDown(e) {
  if (e.button === 0) shoot();
}

onMounted(() => {
  spawnTarget();
  animationId = requestAnimationFrame(update);
  window.addEventListener("mousedown", onMouseDown);
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener("mousedown", onMouseDown);
});
</script>

<style scoped>
.arena {
  width: 100vw;
  height: 100vh;
  background: #111;
  position: relative;
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
  font-size: 14px;
}
</style>
