<template>
  <div 
    class="particle" 
    :style="{ 
      left: x + 'px', 
      top: y + 'px', 
      backgroundColor: color,
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity: opacity
    }"
  ></div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps(['x', 'y', 'color']);
const scale = ref(1);
const opacity = ref(1);

onMounted(() => {
  // Animação simples de sumiço
  setTimeout(() => {
    scale.value = 0.2;
    opacity.value = 0;
  }, 10);
});
</script>

<style scoped>
.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 5;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
</style>