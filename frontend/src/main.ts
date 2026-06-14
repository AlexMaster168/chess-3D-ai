import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { store, storeKey } from './store';
import { initLocale } from './i18n';
import './styles/global.css';

initLocale();

const app = createApp(App);
app.use(router);
app.use(store, storeKey);
app.mount('#app');
