import "./style.css";
import { hasList, init } from "./app";
import { registerServiceWorker } from "./sw-register";

init();
registerServiceWorker(hasList);
