<template>
  <v-app>
    <RouterView v-if="layout === 'auth'" />
    <template v-else-if="layout === 'public'">
      <v-app-bar flat color="surface" class="px-6">
        <v-toolbar-title class="font-weight-bold">SaaS Travel</v-toolbar-title>
        <v-spacer />
        <div class="d-none d-md-flex align-center gap-2">
          <v-btn variant="text" to="/">Anasayfa</v-btn>
          <v-btn variant="text" to="/corporate">Kurumsal</v-btn>
          <v-btn variant="text" to="/contact">İletişim</v-btn>
          <v-btn variant="text" to="/login">Giriş Yap</v-btn>
          <v-btn color="primary" to="/register">Kayıt Ol</v-btn>
        </div>
        <v-menu class="d-md-none">
          <template #activator="{ props }">
            <v-btn icon="mdi-menu" v-bind="props" />
          </template>
          <v-list>
            <v-list-item to="/" title="Anasayfa" />
            <v-list-item to="/corporate" title="Kurumsal" />
            <v-list-item to="/contact" title="İletişim" />
            <v-list-item to="/login" title="Giriş Yap" />
            <v-list-item to="/register" title="Kayıt Ol" />
          </v-list>
        </v-menu>
      </v-app-bar>
      <v-main>
        <RouterView />
      </v-main>
      <v-footer class="px-6 py-4 text-center text-medium-emphasis">
        © {{ new Date().getFullYear() }} SaaS Travel Platformu. Tüm hakları saklıdır.
      </v-footer>
    </template>
    <v-layout v-else>
      <v-navigation-drawer v-model="drawer" app color="surface" class="pa-4">
        <div class="drawer-header mb-6">
          <h2 class="text-h6 font-weight-bold mb-1">{{ tenantName }}</h2>
          <p class="text-caption text-medium-emphasis">Yönetim Modülleri</p>
        </div>
        <v-list nav density="comfortable">
          <v-list-item
            v-for="item in navigationItems"
            :key="item.to"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            :active="route.path === item.to"
            rounded="lg"
          />
        </v-list>
      </v-navigation-drawer>

      <v-app-bar flat color="surface" app>
        <v-app-bar-nav-icon class="d-lg-none" @click="drawer = !drawer" />
        <v-toolbar-title>{{ tenantName }}</v-toolbar-title>
        <v-spacer />
        <div class="d-flex align-center gap-4 pr-4" v-if="auth.user">
          <div class="text-right mr-4">
            <div class="font-weight-medium">{{ auth.user.name }}</div>
            <small class="text-medium-emphasis">{{ auth.user.email }}</small>
          </div>
          <v-btn icon="mdi-logout" variant="text" @click="handleLogout" />
        </div>
      </v-app-bar>

      <v-main>
        <v-container class="py-6">
          <RouterView />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const drawer = ref(true);

const layout = computed(() => (route.meta.layout as string) ?? (route.meta.requiresAuth ? 'admin' : 'public'));
const tenantName = computed(() => auth.tenant?.name ?? 'SaaS Yönetim Paneli');

const navigationItems = computed(() => {
  const items = [
    { title: 'Genel Bakış', to: '/app/dashboard', icon: 'mdi-view-dashboard-outline' },
    { title: 'Diller', to: '/app/languages', icon: 'mdi-translate' },
    { title: 'Destinasyonlar', to: '/app/destinations', icon: 'mdi-map-marker-radius' },
    { title: 'Oteller', to: '/app/hotels', icon: 'mdi-hotel' },
    { title: 'Blog', to: '/app/blogs', icon: 'mdi-file-document-outline' },
  ];

  if (auth.tenant?.category === 'tour') {
    items.push({ title: 'Turlar', to: '/app/tours', icon: 'mdi-airballoon' });
  }

  if (auth.tenant?.category === 'rentacar') {
    items.push({ title: 'Rent A Car', to: '/app/rentacar', icon: 'mdi-car-sports' });
    items.push({ title: 'Müşteriler', to: '/app/customers', icon: 'mdi-account-multiple' });
    items.push({ title: 'CRM', to: '/app/crm', icon: 'mdi-account-group' });
    items.push({ title: 'Rezervasyonlar', to: '/app/reservations', icon: 'mdi-calendar-check' });
  }

  return items;
});

const handleLogout = () => {
  auth.logout();
  router.replace({ name: 'login' });
};

watch(
  () => route.path,
  () => {
    if (layout.value === 'admin' && window.innerWidth < 1280) {
      drawer.value = false;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.drawer-header {
  display: flex;
  flex-direction: column;
}

</style>
