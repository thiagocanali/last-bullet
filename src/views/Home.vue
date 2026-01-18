<template>
  <div class="home">
    <h1>LAST BULLET</h1>
    <h2>Let's Make It Count</h2>

    <input v-model="name" placeholder="Nome do jogador" />

    <select v-model="weapon">
      <option>Pistol</option>
      <option>Rifle</option>
      <option>Sniper</option>
    </select>

    <button @click="start('training')">Treinar Mira</button>
    <button class="danger" @click="start('game')">Jogar FPS</button>
    <button class="warning" @click="start('game2d')">2D Survivor Edition</button>
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
  justify-content: center;
  align-items: center;
  gap: 14px;

  background: radial-gradient(circle at top, #1b1b1b, #050505);
  color: #fff;
  font-family: 'Orbitron', system-ui, sans-serif;
}

h1 {
  margin: 0;
  padding: 0;

  font-size: 3rem;
  letter-spacing: 4px;
  line-height: 1;

  color: #f1f1f1;
  text-shadow:
    0 0 10px rgba(231, 76, 60, 0.6),
    0 0 20px rgba(231, 76, 60, 0.4);
}

h2 {
  margin: 4px 0 18px; /* cola no h1 */
  padding: 0;

  font-size: 1.05rem;
  letter-spacing: 6px;
  line-height: 1;

  text-transform: uppercase;
  font-weight: 500;
  color: #e74c3c;

  text-shadow:
    0 0 6px rgba(231, 76, 60, 0.6);
}

input,
select {
  width: 220px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #333;
  background: #111;
  color: #fff;
  outline: none;
  transition: 0.2s ease;
}

input::placeholder {
  color: #777;
}

input:focus,
select:focus {
  border-color: #e74c3c;
  box-shadow: 0 0 8px rgba(231, 76, 60, 0.6);
}

button {
  width: 220px;
  padding: 12px;
  border-radius: 6px;
  border: none;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  background: #2c2c2c;
  color: #fff;
  transition: all 0.2s ease;
}

button:hover {
  transform: translateY(-2px);
  background: #3a3a3a;
}

button:active {
  transform: scale(0.97);
}

.danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  box-shadow: 0 0 12px rgba(231, 76, 60, 0.6);
}

.danger:hover {
  background: linear-gradient(135deg, #ff5e4d, #e74c3c);
  box-shadow: 0 0 18px rgba(231, 76, 60, 0.9);
}

.warning {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  box-shadow: 0 0 12px rgba(243, 156, 18, 0.6);
}

.warning:hover {
  background: linear-gradient(135deg, #f5b041, #f39c12);
  box-shadow: 0 0 18px rgba(243, 156, 18, 0.9);
}

</style>
