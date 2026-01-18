<template>
  <div class="arena hide-cursor" @click="lockPointer">
    <Crosshair />

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

const enemies = ref([]);
const kills = ref(0);

const cam = ref({ x: 0, y: 0 });
const sensitivity = 0.3;

let lastShot = 0;
let animationId = null;

function lockPointer() {
  document.body.requestPointerLock();
}

function spawnEnemy() {
  enemies.value.push({
    id: Math.random(),
    x: Math.random() * 2000,
    y: Math.random() * 2000,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    life: 2,
  });
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
  });

  animationId = requestAnimationFrame(update);
}

function onMouseMove(e) {
  cam.value.x += e.movementX * sensitivity;
  cam.value.y += e.movementY * sensitivity;
}

function onMouseDown(e) {
  if (e.button === 0) shoot();
}

onMounted(() => {
  for (let i = 0; i < 5; i++) spawnEnemy();
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
  width: 4000px;
  height: 4000px;
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
