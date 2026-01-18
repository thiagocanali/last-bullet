<template>
  <div class="crosshair">+</div>
</template>

<style scoped>
.crosshair {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: #00ff88;
  pointer-events: none;
  user-select: none;
}
</style>
