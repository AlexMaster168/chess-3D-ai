import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { store, storeKey } from './store';
import './styles/global.css';

const app = createApp(App);
app.use(router);
app.use(store, storeKey);
app.mount('#app');
