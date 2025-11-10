import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router, setupRouterGuards } from './router';
import { vuetify } from './plugins/vuetify';
import { useAuthStore } from './stores/auth';

import './styles/main.scss';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
setupRouterGuards(pinia);
app.use(router);
app.use(vuetify);

const authStore = useAuthStore(pinia);
await authStore.initialize();

app.mount('#app');
