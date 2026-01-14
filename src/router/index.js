import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/Home.vue";
import Training from "../views/Training.vue";
import Game from "../views/Game.vue";

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/training", component: Training },
    { path: "/game", component: Game },
  ],
});
