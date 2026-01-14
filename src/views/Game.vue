<template>
  <div class="arena" @click="shoot">
    <div
      v-for="e in enemies"
      :key="e.id"
      class="enemy"
      :style="{ left: e.x + 'px', top: e.y + 'px' }"
      @click.stop="kill(e.id)"
    ></div>

    <div class="hud">
      Kills: {{ kills }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const enemies = ref([]);
const kills = ref(0);

function spawnEnemy() {
  enemies.value.push({
    id: Math.random(),
    x: Math.random() * (window.innerWidth - 40),
    y: Math.random() * (window.innerHeight - 40),
  });
}

function kill(id) {
  enemies.value = enemies.value.filter(e => e.id !== id);
  kills.value++;
  spawnEnemy();
}

function shoot() {}

onMounted(() => {
  for (let i = 0; i < 5; i++) spawnEnemy();
});
</script>

<style scoped>
.arena {
  height: 100vh;
  position: relative;
  cursor: crosshair;
}

.enemy {
  width: 35px;
  height: 35px;
  background: orange;
  position: absolute;
}

.hud {
  position: fixed;
  top: 10px;
  right: 10px;
}
</style>
