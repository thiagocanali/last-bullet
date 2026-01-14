<template>
  <div class="hud">
    <h1>LAST BULLET</h1>

    <div class="panel">
      <label>
        Nome do jogador
        <input v-model="player" placeholder="Player" />
      </label>

      <label>
        Sensibilidade
        <input type="range" min="0.1" max="2" step="0.1" v-model="sens" />
      </label>

      <label>
        Arma
        <select v-model="weapon">
          <option>Pistol</option>
          <option>Rifle</option>
          <option>Sniper</option>
        </select>
      </label>

      <div class="actions">
        <button @click="goTrain">Treinar</button>
        <button class="danger" @click="goGame">Jogar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const player = ref("");
const sens = ref(1);
const weapon = ref("Pistol");

function save() {
  localStorage.setItem(
    "lastbullet_player",
    JSON.stringify({
      player: player.value,
      sens: sens.value,
      weapon: weapon.value,
    })
  );
}

function goTrain() {
  save();
  router.push("/training");
}

function goGame() {
  save();
  router.push("/game");
}
</script>

<style scoped>
.hud {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

h1 {
  margin-bottom: 20px;
  letter-spacing: 6px;
}

.panel {
  background: #111722;
  padding: 30px;
  border-radius: 10px;
  width: 320px;
}

label {
  display: block;
  margin-bottom: 15px;
}

input, select {
  width: 100%;
  margin-top: 5px;
  padding: 6px;
  background: #0b0f14;
  color: white;
  border: none;
}

.actions {
  display: flex;
  gap: 10px;
}

button {
  flex: 1;
  padding: 10px;
  cursor: pointer;
  background: #2ecc71;
  border: none;
  color: black;
  font-weight: bold;
}

button.danger {
  background: #e74c3c;
}
</style>
