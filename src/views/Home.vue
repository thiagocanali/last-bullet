<template>
  <div class="home">
    <h1>LAST BULLET</h1>

    <input v-model="name" placeholder="Nome do jogador" />

    <select v-model="weapon">
      <option>Pistol</option>
      <option>Rifle</option>
      <option>Sniper</option>
    </select>

    <button @click="start('training')">Treinar</button>
    <button class="danger" @click="start('game')">Jogar</button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const name = ref("");
const weapon = ref("Pistol");

function start(mode) {
  localStorage.setItem(
    "lastbullet_player",
    JSON.stringify({ name: name.value, weapon: weapon.value })
  );
  router.push("/" + mode);
}
</script>

<style scoped>
.home {
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

input, select, button {
  padding: 10px;
  width: 200px;
}

button {
  cursor: pointer;
}

.danger {
  background: #e74c3c;
  color: white;
}
</style>
