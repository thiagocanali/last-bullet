<template>
  <div
    class="arena hide-cursor"
    @mousemove="moveMouse"
    @click="shoot"
  >
    <Crosshair :x="mouse.x" :y="mouse.y" />

    <div
      v-for="t in targets"
      :key="t.id"
      class="target"
      :style="{ left: t.x + 'px', top: t.y + 'px' }"
    ></div>

    <div class="hud">
      Score: {{ score }} | Accuracy: {{ accuracy }}%
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import Crosshair from "../components/Crosshair.vue";
import { weapons } from "../assets/weapons";

const mouse = ref({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
const targets = ref([]);
const score = ref(0);
const shots = ref(0);
const hits = ref(0);
const lastShot = ref(0);

const player = JSON.parse(localStorage.getItem("lastbullet_player"));
const weapon = weapons[player.weapon];

const accuracy = computed(() =>
  shots.value ? Math.round((hits.value / shots.value) * 100) : 0
);

function moveMouse(e) {
  mouse.value.x = e.clientX;
  mouse.value.y = e.clientY;
}

function spawn() {
  targets.value.push({
    id: Math.random(),
    x: Math.random() * (window.innerWidth - 40),
    y: Math.random() * (window.innerHeight - 40),
  });
}

function shoot() {
  const now = Date.now();
  if (now - lastShot.value < weapon.fireRate) return;
  lastShot.value = now;
  shots.value++;

  targets.value.forEach(t => {
    if (
      mouse.value.x > t.x &&
      mouse.value.x < t.x + 40 &&
      mouse.value.y > t.y &&
      mouse.value.y < t.y + 40
    ) {
      targets.value = targets.value.filter(x => x.id !== t.id);
      score.value++;
      hits.value++;
      spawn();
    }
  });
}

onMounted(() => {
  for (let i = 0; i < 3; i++) spawn();
});
</script>

<style scoped>
.arena {
  height: 100vh;
  position: relative;
}

.target {
  width: 40px;
  height: 40px;
  background: red;
  border-radius: 50%;
  position: absolute;
}

.hud {
  position: fixed;
  top: 10px;
  left: 10px;
}
</style>
