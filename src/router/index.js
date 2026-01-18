import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/Home.vue";
import Training from "../views/Training.vue";
import Game from "../views/Game.vue";
import Game2D from "../views/Game2D.vue";
import Game2D4 from "../views/Game2D4.vue";

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/training", component: Training },
    { path: "/game", component: Game },
    { path: "/game2d", component: Game2D },
    { path: "/game2d4", component: Game2D4 },
  ],
});
