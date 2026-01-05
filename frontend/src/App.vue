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
      <v-navigation-drawer v-model="drawer" app color="surface" class="pa-3" width="280">
        <div class="drawer-header mb-6 px-2">
          <h2 class="text-h6 font-weight-bold mb-1">{{ tenantName }}</h2>
          <p class="text-body-2 text-medium-emphasis">Yönetim Modülleri</p>
        </div>
        <v-list nav density="comfortable" class="px-2">
          <template v-for="item in navigationItems" :key="item.to || item.title">
            <!-- Regular menu item -->
            <v-list-item
              v-if="!item.children"
              :to="item.to"
              :prepend-icon="item.icon"
              :title="item.title"
              :active="route.path === item.to"
              rounded="lg"
              class="mb-1 menu-item"
              :class="{ 'menu-item-active': route.path === item.to }"
            />
            <!-- Group menu item with children -->
            <v-list-group
              v-else
              :value="isGroupActive(item) ? item.value : undefined"
              :prepend-icon="item.icon"
              class="mb-1"
            >
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :title="item.title"
                  rounded="lg"
                  class="menu-group-header"
                />
              </template>
              <v-list-item
                v-for="child in item.children"
                :key="child.to"
                :to="child.to"
                :prepend-icon="child.icon"
                :title="child.title"
                :active="route.path === child.to"
                rounded="lg"
                class="ml-6 mb-1 menu-item-child"
                :class="{ 'menu-item-active': route.path === child.to }"
              />
            </v-list-group>
          </template>
        </v-list>
      </v-navigation-drawer>

      <v-app-bar flat color="surface" app>
        <v-app-bar-nav-icon @click="drawer = !drawer" />
        <v-toolbar-title>{{ tenantName }}</v-toolbar-title>
        <v-spacer />
        <div class="d-flex align-center gap-4 pr-4" v-if="adminAuth.user || auth.user">
          <div class="text-right mr-4" v-if="adminAuth.user">
            <div class="font-weight-medium">{{ adminAuth.user.name || adminAuth.user.username }}</div>
            <small class="text-medium-emphasis">Admin</small>
          </div>
          <div class="text-right mr-4" v-else-if="auth.user">
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
import { computed, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useAdminAuthStore } from './stores/admin-auth';
import { useFeaturesStore } from './stores/features';

const auth = useAuthStore();
const adminAuth = useAdminAuthStore();
const features = useFeaturesStore();
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
  // Ana domain'de her zaman public layout (admin route'ları hariç)
  if (!isSubdomain()) {
    if (route.meta.requiresAdminAuth) {
      return 'admin';
    }
    return 'public';
  }
  // Subdomain'de route meta'dan layout al
  return (route.meta.layout as string) ?? (route.meta.requiresAuth ? 'admin' : 'public');
});
const tenantName = computed(() => {
  if (adminAuth.isAuthenticated) {
    return 'Admin Panel';
  }
  return auth.tenant?.name ?? 'SaaS Yönetim Paneli';
});

const navigationItems = computed(() => {
  // Admin kullanıcıları için sadece admin dashboard
  if (adminAuth.isAuthenticated) {
    return [
      { title: 'Admin Dashboard', to: '/adminDashboard', icon: 'mdi-monitor-dashboard' },
    ];
  }

  const items: Array<{
    title: string;
    to?: string;
    icon: string;
    children?: Array<{ title: string; to: string; icon: string }>;
    value?: string;
  }> = [
    // Genel
    { title: 'Genel Bakış', to: '/app/dashboard', icon: 'mdi-view-dashboard-outline' },
    
    // İçerik Yönetimi
    {
      title: 'İçerik Yönetimi',
      icon: 'mdi-file-document-multiple-outline',
      value: 'content',
      children: [
        { title: 'Diller', to: '/app/languages', icon: 'mdi-translate' },
        { title: 'Ülkeler', to: '/app/countries', icon: 'mdi-earth' },
        { title: 'Destinasyonlar', to: '/app/destinations', icon: 'mdi-map-marker-radius' },
        { title: 'Oteller', to: '/app/hotels', icon: 'mdi-bed' },
        { title: 'Blog', to: '/app/blogs', icon: 'mdi-file-document-outline' },
      ],
    },
  ];

  // Tour kategorisi için
  if (auth.tenant?.category === 'tour') {
    items.push({ title: 'Turlar', to: '/app/tours', icon: 'mdi-airballoon' });
  }

  // Rent A Car kategorisi için
  if (auth.tenant?.category === 'rentacar') {
      const rentacarChildren = [
        { title: 'Araçlar', to: '/app/rentacar', icon: 'mdi-car-sports' },
        { title: 'Rezervasyonlar', to: '/app/reservations', icon: 'mdi-calendar-check' },
        { title: 'Rezervasyon Logları', to: '/app/reservation-logs', icon: 'mdi-file-document-alert-outline' },
        { title: 'VIP Transfer', to: '/app/transfer', icon: 'mdi-car-limousine' },
      ];
      
      // Add vehicle tracking only if feature is enabled
      // Check if features is initialized to avoid errors
      if (features.initialized && features.hasFeature('vehicleTracking')) {
        rentacarChildren.splice(3, 0, { title: 'Araç Takip', to: '/app/trips', icon: 'mdi-map-marker-path' });
      }
      
      items.push({
        title: 'Rent A Car',
        icon: 'mdi-car-sports',
        value: 'rentacar',
        children: rentacarChildren,
      });
      
      // Add Contracts and Marketplace to Rent A Car section
      items.push(
        { title: 'Sözleşmeler', to: '/app/contracts', icon: 'mdi-file-document-edit-outline' },
        { title: 'Marketplace', to: '/app/marketplace', icon: 'mdi-store-outline' }
      );

    items.push({
      title: 'CRM',
      icon: 'mdi-account-group',
      value: 'crm',
      children: [
        { title: 'Müşteriler', to: '/app/customers', icon: 'mdi-account-multiple' },
        { title: 'Sayfalar', to: '/app/crm/pages', icon: 'mdi-file-document-edit' },
        { title: 'Diğer', to: '/app/crm', icon: 'mdi-cog' },
      ],
    });

    // Feature-based menu items
    // Check if features is initialized to avoid errors
    if (features.initialized && features.hasFeature('finance')) {
      items.push({ title: 'Ön Muhasebe', to: '/app/finance', icon: 'mdi-cash-multiple' });
    }
  }

  // İletişim - Feature check
  // Check if features is initialized to avoid errors
  if (features.initialized && features.hasFeature('chat')) {
    items.push({ title: 'Chat / Agency', to: '/app/chat', icon: 'mdi-chat-outline' });
  }

  // Sistem
  items.push({
    title: 'Sistem',
    icon: 'mdi-cog-outline',
    value: 'system',
    children: [
      { title: 'Master Lokasyonlar', to: '/app/master-locations', icon: 'mdi-map-marker-multiple' },
      { title: 'Kullanıcılar', to: '/app/users', icon: 'mdi-account-group-outline' },
      { title: 'Anketler', to: '/app/surveys', icon: 'mdi-clipboard-text-outline' },
      { title: 'Mail Şablonları', to: '/app/email-templates', icon: 'mdi-email-multiple-outline' },
      { title: 'Ayarlar', to: '/app/settings', icon: 'mdi-cog-outline' },
    ],
  });

  return items;
});

const handleLogout = () => {
  if (adminAuth.isAuthenticated) {
    adminAuth.logout();
    router.replace({ name: 'adminLogin' });
  } else {
    auth.logout();
    router.replace({ name: 'login' });
  }
};

// Initialize features when authenticated
watch(() => auth.isAuthenticated, async (isAuth) => {
  if (isAuth && !features.initialized) {
    await features.initialize();
  }
}, { immediate: true });

onMounted(async () => {
  if (auth.isAuthenticated && !features.initialized) {
    await features.initialize();
  }
});

// Check if a menu group should be active (expanded) based on current route
const isGroupActive = (item: { value?: string; children?: Array<{ to: string }> }): boolean => {
  if (!item.children || !item.value) return false;
  return item.children.some(child => route.path === child.to || route.path.startsWith(child.to + '/'));
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

/* Menu item styling for better readability */
.menu-item,
.menu-group-header {
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  min-height: 44px !important;
  padding: 8px 12px !important;
}

.menu-item-child {
  font-size: 0.9rem !important;
  font-weight: 400 !important;
  min-height: 40px !important;
  padding: 6px 12px !important;
}

.menu-item-active {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
  color: rgb(var(--v-theme-primary)) !important;
  font-weight: 600 !important;
}

/* Group header styling */
.menu-group-header {
  font-weight: 600 !important;
  font-size: 0.95rem !important;
}

/* Icon spacing */
:deep(.v-list-item__prepend) {
  margin-inline-end: 12px !important;
}

/* Better spacing for child items */
.menu-item-child :deep(.v-list-item__prepend) {
  margin-inline-end: 10px !important;
}

/* List group styling */
:deep(.v-list-group__header) {
  font-weight: 600 !important;
}

/* Active state for list items */
:deep(.v-list-item--active) {
  background-color: rgba(var(--v-theme-primary), 0.12) !important;
  color: rgb(var(--v-theme-primary)) !important;
}

/* Hover effects */
.menu-item:hover,
.menu-item-child:hover {
  background-color: rgba(var(--v-theme-primary), 0.05) !important;
}

</style>
