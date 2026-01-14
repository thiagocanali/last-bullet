<template>
  <div
    class="arena hide-cursor"
    @mousemove="moveMouse"
    @click="shoot"
  >
    <Crosshair :x="mouse.x" :y="mouse.y" />

    <div
      v-for="e in enemies"
      :key="e.id"
      class="enemy"
      :style="{ left: e.x + 'px', top: e.y + 'px' }"
    >
      <div class="life" :style="{ width: e.life + '%' }"></div>
    </div>

    <div class="hud">Kills: {{ kills }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Crosshair from "../components/Crosshair.vue";
import { weapons } from "../assets/weapons";

const mouse = ref({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
const enemies = ref([]);
const kills = ref(0);
const lastShot = ref(0);

const player = JSON.parse(localStorage.getItem("lastbullet_player"));
const weapon = weapons[player.weapon];

function moveMouse(e) {
  mouse.value.x = e.clientX;
  mouse.value.y = e.clientY;
}

function spawn() {
  enemies.value.push({
    id: Math.random(),
    x: Math.random() * (window.innerWidth - 40),
    y: Math.random() * (window.innerHeight - 40),
    dx: Math.random() > 0.5 ? 1 : -1,
    dy: Math.random() > 0.5 ? 1 : -1,
    life: 100,
  });
}

function moveEnemies() {
  enemies.value.forEach(e => {
    e.x += e.dx;
    e.y += e.dy;
    if (e.x <= 0 || e.x >= window.innerWidth - 40) e.dx *= -1;
    if (e.y <= 0 || e.y >= window.innerHeight - 40) e.dy *= -1;
  });
}

function shoot() {
  const now = Date.now();
  if (now - lastShot.value < weapon.fireRate) return;
  lastShot.value = now;

  enemies.value.forEach(e => {
    if (
      mouse.value.x > e.x &&
      mouse.value.x < e.x + 40 &&
      mouse.value.y > e.y &&
      mouse.value.y < e.y + 40
    ) {
      e.life -= weapon.damage;
      if (e.life <= 0) {
        enemies.value = enemies.value.filter(x => x.id !== e.id);
        kills.value++;
        spawn();
      }
    }
  });
}

onMounted(() => {
  for (let i = 0; i < 5; i++) spawn();
  setInterval(moveEnemies, 16);
});
</script>

<style scoped>
.arena {
  height: 100vh;
  position: relative;
}

.enemy {
  width: 40px;
  height: 40px;
  background: orange;
  position: absolute;
}

.life {
  height: 4px;
  background: red;
  position: absolute;
  bottom: -6px;
}

.hud {
  position: fixed;
  top: 10px;
  right: 10px;
}
</style>
