import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router, setupRouterGuards } from './router';
import { vuetify } from './plugins/vuetify';
import { useAuthStore } from './stores/auth';

import './styles/main.scss';

// Set TinyMCE GPL license globally before any TinyMCE initialization
// This must be set before TinyMCE components are loaded
if (typeof window !== 'undefined') {
  (window as any).tinymce = (window as any).tinymce || {};
  (window as any).tinymce.clarify = () => 'gpl';
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
setupRouterGuards(pinia);
app.use(router);
app.use(vuetify);

const authStore = useAuthStore(pinia);
await authStore.initialize();

app.mount('#app');
