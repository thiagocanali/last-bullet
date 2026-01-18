<template>
  <div
    class="crosshair"
    :class="{ hit }"
    :style="{ left: x + 'px', top: y + 'px' }"
  >
    <span></span>
    <span></span>
    <span></span>
    <span></span>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

defineProps({
  hit: Boolean,
});

const x = ref(window.innerWidth / 2);
const y = ref(window.innerHeight / 2);

function move(e) {
  x.value += e.movementX;
  y.value += e.movementY;

  x.value = Math.max(0, Math.min(x.value, window.innerWidth));
  y.value = Math.max(0, Math.min(y.value, window.innerHeight));
}

onMounted(() => {
  window.addEventListener("mousemove", move);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", move);
});
</script>

<style scoped>
.crosshair {
  position: fixed;
  width: 20px;
  height: 20px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 9999;
}

.crosshair span {
  position: absolute;
  background: white;
}

.crosshair span:nth-child(1) {
  top: 0;
  left: 9px;
  width: 2px;
  height: 6px;
}

.crosshair span:nth-child(2) {
  bottom: 0;
  left: 9px;
  width: 2px;
  height: 6px;
}

.crosshair span:nth-child(3) {
  left: 0;
  top: 9px;
  width: 6px;
  height: 2px;
}

.crosshair span:nth-child(4) {
  right: 0;
  top: 9px;
  width: 6px;
  height: 2px;
}

.crosshair.hit span {
  background: red;
}
</style>
