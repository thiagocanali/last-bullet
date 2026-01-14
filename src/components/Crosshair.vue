<template>
  <div
    class="crosshair"
    :style="{ left: x + 'px', top: y + 'px' }"
  >
    <span />
    <span />
    <span />
    <span />
  </div>
</template>

<script setup>
defineProps({
  x: Number,
  y: Number,
});
</script>

<style scoped>
.crosshair {
  position: fixed;
  width: 28px;
  height: 28px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.crosshair span {
  position: absolute;
  background: #00ff88;
}

.crosshair span:nth-child(1) {
  width: 2px;
  height: 10px;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.crosshair span:nth-child(2) {
  width: 2px;
  height: 10px;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

.crosshair span:nth-child(3) {
  width: 10px;
  height: 2px;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

.crosshair span:nth-child(4) {
  width: 10px;
  height: 2px;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}
</style>
