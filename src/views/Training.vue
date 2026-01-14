<template>
  <div class="arena" @click="shoot">
    <div
      class="target"
      v-for="t in targets"
      :key="t.id"
      :style="{ left: t.x + 'px', top: t.y + 'px' }"
      @click.stop="hit(t.id)"
    ></div>

    <div class="hud">
      Score: {{ score }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const targets = ref([]);
const score = ref(0);

function spawn() {
  targets.value.push({
    id: Math.random(),
    x: Math.random() * (window.innerWidth - 40),
    y: Math.random() * (window.innerHeight - 40),
  });
}

function hit(id) {
  targets.value = targets.value.filter(t => t.id !== id);
  score.value++;
  spawn();
}

function shoot() {
  // miss shot
}

onMounted(() => {
  for (let i = 0; i < 3; i++) spawn();
});
</script>

<style scoped>
.arena {
  height: 100vh;
  position: relative;
  cursor: crosshair;
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
