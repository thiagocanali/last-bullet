<template>
  <div class="arena hide-cursor" @click="lockPointer">
    <Crosshair />

    <div class="hud">
      <div>Kills: {{ kills }}</div>
    </div>

    <div
      v-for="e in enemies"
      :key="e.id"
      class="enemy"
      :style="{ left: e.x + 'px', top: e.y + 'px' }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Crosshair from "../components/Crosshair.vue";

const enemies = ref([]);
const kills = ref(0);

const fireRate = 200;
let lastShot = 0;
let animationId = null;

function lockPointer() {
  document.body.requestPointerLock();
}

function spawnEnemy() {
  enemies.value.push({
    id: Math.random(),
    x: Math.random() * (window.innerWidth - 40),
    y: Math.random() * (window.innerHeight - 40),
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    life: 2,
  });
}

function shoot() {
  const now = Date.now();
  if (now - lastShot < fireRate) return;
  lastShot = now;

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  enemies.value.forEach(e => {
    if (
      cx > e.x &&
      cx < e.x + 40 &&
      cy > e.y &&
      cy < e.y + 40
    ) {
      e.life--;
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

    if (e.x <= 0 || e.x >= window.innerWidth - 40) e.vx *= -1;
    if (e.y <= 0 || e.y >= window.innerHeight - 40) e.vy *= -1;
  });

  animationId = requestAnimationFrame(update);
}

function onMouseDown(e) {
  if (e.button === 0) shoot();
}

onMounted(() => {
  spawnEnemy();
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
  background: #000;
  position: relative;
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
