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
          <!-- Login/Register sadece subdomain'lerde gösterilir -->
          <template v-if="isSubdomain()">
            <v-btn variant="text" to="/login">Giriş Yap</v-btn>
            <v-btn color="primary" to="/register">Kayıt Ol</v-btn>
          </template>
        </div>
        <v-menu class="d-md-none">
          <template #activator="{ props }">
            <v-btn icon="mdi-menu" v-bind="props" />
          </template>
          <v-list>
            <v-list-item to="/" title="Anasayfa" />
            <v-list-item to="/corporate" title="Kurumsal" />
            <v-list-item to="/contact" title="İletişim" />
            <!-- Login/Register sadece subdomain'lerde gösterilir -->
            <template v-if="isSubdomain()">
              <v-list-item to="/login" title="Giriş Yap" />
              <v-list-item to="/register" title="Kayıt Ol" />
            </template>
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
        <v-app-bar-nav-icon @click="drawer = !drawer" />
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
        <div style="width: 90%; max-width: 90%; margin: 0 auto; padding: 8px 0;">
          <RouterView />
        </div>
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

/**
 * Check if current hostname is a subdomain
 * Examples:
 *   - saastour360.com -> false (main domain)
 *   - berg.saastour360.com -> true (subdomain)
 *   - sunset.local.saastour360.test -> true (subdomain)
 */
function isSubdomain(): boolean {
  const hostname = window.location.hostname;
  const cleanHostname = hostname.split(':')[0];
  const parts = cleanHostname.split('.');
  
  // Check if it's a subdomain pattern
  // Main domain: saastour360.com (2 parts)
  // Subdomain: berg.saastour360.com (3+ parts) or sunset.local.saastour360.test (4+ parts)
  if (parts.length >= 3) {
    const firstPart = parts[0];
    // Validate first part is not www
    if (firstPart === 'www') {
      return false; // www is treated as main domain
    }
    // Check if it matches subdomain pattern (not main domain)
    const slugRegex = /^[a-z0-9-]+$/;
    if (slugRegex.test(firstPart)) {
      return true; // It's a subdomain
    }
  }
  
  return false; // Main domain
}

const layout = computed(() => {
  // Ana domain'de her zaman public layout
  if (!isSubdomain()) {
    return 'public';
  }
  // Subdomain'de route meta'dan layout al
  return (route.meta.layout as string) ?? (route.meta.requiresAuth ? 'admin' : 'public');
});
const tenantName = computed(() => auth.tenant?.name ?? 'SaaS Yönetim Paneli');

const navigationItems = computed(() => {
  const items = [
    { title: 'Genel Bakış', to: '/app/dashboard', icon: 'mdi-view-dashboard-outline' },
    { title: 'Diller', to: '/app/languages', icon: 'mdi-translate' },
    { title: 'Destinasyonlar', to: '/app/destinations', icon: 'mdi-map-marker-radius' },
    { title: 'Oteller', to: '/app/hotels', icon: 'mdi-bed' },
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

  // VIP Transfer modülü (rentacar kullanıcıları için)
  if (auth.tenant?.category === 'rentacar') {
    items.push({ title: 'VIP Transfer', to: '/app/transfer', icon: 'mdi-car-limousine' });
  }

  // Chat / Agency menüsü (tüm tenant'lar için)
  items.push({ title: 'Chat / Agency', to: '/app/chat', icon: 'mdi-chat-outline' });

  // Ortak menü öğeleri
  items.push({ title: 'Master Lokasyonlar', to: '/app/master-locations', icon: 'mdi-map-marker-multiple' });
  items.push({ title: 'Kullanıcılar', to: '/app/users', icon: 'mdi-account-group-outline' });
  items.push({ title: 'Anketler', to: '/app/surveys', icon: 'mdi-clipboard-text-outline' });
  items.push({ title: 'Mail Şablonları', to: '/app/email-templates', icon: 'mdi-email-multiple-outline' });
  items.push({ title: 'Ayarlar', to: '/app/settings', icon: 'mdi-cog-outline' });
  items.push({ title: 'Admin Dashboard', to: '/app/admin', icon: 'mdi-monitor-dashboard' });

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
