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
      <!-- PrimeVue Sidebar -->
      <Sidebar v-model:visible="drawer" class="primevue-sidebar">
        <template #header>
          <div class="drawer-header">
            <h2 style="font-size: 0.875rem; font-weight: 600; margin: 0 0 4px 0;">{{ tenantName }}</h2>
            <p style="font-size: 0.65rem; color: #6b7280; margin: 0;">Yönetim Modülleri</p>
          </div>
        </template>
        <Menu :model="menuItems" class="w-full border-none" />
      </Sidebar>

      <v-app-bar flat color="surface" app>
        <v-app-bar-nav-icon @click="drawer = !drawer" />
        <v-toolbar-title>{{ tenantName }}</v-toolbar-title>
        <v-spacer />
        <div class="d-flex align-center gap-4 pr-4" v-if="auth.user">
          <div class="text-right mr-4">
            <div class="font-weight-medium" style="font-size: 0.75rem;">{{ auth.user.name }}</div>
            <small class="text-medium-emphasis" style="font-size: 0.65rem;">{{ auth.user.email }}</small>
          </div>
          <v-btn icon="mdi-logout" variant="text" size="small" @click="handleLogout" />
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
import Sidebar from 'primevue/sidebar';
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';

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

// PrimeVue Menu Items
const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    { 
      label: 'Genel Bakış', 
      icon: 'pi pi-th-large',
      command: () => router.push('/app/dashboard'),
      class: route.path === '/app/dashboard' ? 'p-menuitem-active' : ''
    },
    { 
      label: 'Diller', 
      icon: 'pi pi-language',
      command: () => router.push('/app/languages'),
      class: route.path === '/app/languages' ? 'p-menuitem-active' : ''
    },
    { 
      label: 'Ülkeler', 
      icon: 'pi pi-globe',
      command: () => router.push('/app/countries'),
      class: route.path === '/app/countries' ? 'p-menuitem-active' : ''
    },
    { 
      label: 'Destinasyonlar', 
      icon: 'pi pi-map-marker',
      command: () => router.push('/app/destinations'),
      class: route.path === '/app/destinations' ? 'p-menuitem-active' : ''
    },
    { 
      label: 'Oteller', 
      icon: 'pi pi-building',
      command: () => router.push('/app/hotels'),
      class: route.path === '/app/hotels' ? 'p-menuitem-active' : ''
    },
    { 
      label: 'Blog', 
      icon: 'pi pi-file',
      command: () => router.push('/app/blogs'),
      class: route.path === '/app/blogs' ? 'p-menuitem-active' : ''
    },
  ];

  if (auth.tenant?.category === 'tour') {
    items.push({ 
      label: 'Turlar', 
      icon: 'pi pi-send',
      command: () => router.push('/app/tours'),
      class: route.path === '/app/tours' ? 'p-menuitem-active' : ''
    });
  }

  if (auth.tenant?.category === 'rentacar') {
    items.push(
      { 
        label: 'Rent A Car', 
        icon: 'pi pi-car',
        command: () => router.push('/app/rentacar'),
        class: route.path === '/app/rentacar' ? 'p-menuitem-active' : ''
      },
      { 
        label: 'Müşteriler', 
        icon: 'pi pi-users',
        command: () => router.push('/app/customers'),
        class: route.path === '/app/customers' ? 'p-menuitem-active' : ''
      },
      { 
        label: 'CRM', 
        icon: 'pi pi-briefcase',
        command: () => router.push('/app/crm'),
        class: route.path === '/app/crm' ? 'p-menuitem-active' : ''
      },
      { 
        label: 'Rezervasyonlar', 
        icon: 'pi pi-calendar-check',
        command: () => router.push('/app/reservations'),
        class: route.path === '/app/reservations' ? 'p-menuitem-active' : ''
      },
      { 
        label: 'Ön Muhasebe', 
        icon: 'pi pi-money-bill',
        command: () => router.push('/app/finance'),
        class: route.path === '/app/finance' ? 'p-menuitem-active' : ''
      },
      { 
        label: 'VIP Transfer', 
        icon: 'pi pi-car',
        command: () => router.push('/app/transfer'),
        class: route.path === '/app/transfer' ? 'p-menuitem-active' : ''
      }
    );
  }

  // Chat / Agency menüsü (tüm tenant'lar için)
  items.push({ 
    label: 'Chat / Agency', 
    icon: 'pi pi-comments',
    command: () => router.push('/app/chat'),
    class: route.path === '/app/chat' ? 'p-menuitem-active' : ''
  });

  // Ortak menü öğeleri
  items.push(
    { 
      label: 'Master Lokasyonlar', 
      icon: 'pi pi-map',
      command: () => router.push('/app/master-locations'),
      class: route.path === '/app/master-locations' ? 'p-menuitem-active' : ''
    },
    { 
      label: 'Kullanıcılar', 
      icon: 'pi pi-user',
      command: () => router.push('/app/users'),
      class: route.path === '/app/users' ? 'p-menuitem-active' : ''
    },
    { 
      label: 'Anketler', 
      icon: 'pi pi-clipboard',
      command: () => router.push('/app/surveys'),
      class: route.path === '/app/surveys' ? 'p-menuitem-active' : ''
    },
    { 
      label: 'Mail Şablonları', 
      icon: 'pi pi-envelope',
      command: () => router.push('/app/email-templates'),
      class: route.path === '/app/email-templates' ? 'p-menuitem-active' : ''
    },
    { 
      label: 'Ayarlar', 
      icon: 'pi pi-cog',
      command: () => router.push('/app/settings'),
      class: route.path === '/app/settings' ? 'p-menuitem-active' : ''
    },
    { 
      label: 'Admin Dashboard', 
      icon: 'pi pi-desktop',
      command: () => router.push('/app/admin'),
      class: route.path === '/app/admin' ? 'p-menuitem-active' : ''
    }
  );

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
  padding: 12px;
}

/* PrimeVue Sidebar Styling */
:deep(.primevue-sidebar) {
  width: 280px !important;
  background: white;
  border-right: 1px solid #e5e7eb;
}

:deep(.primevue-sidebar .p-sidebar-header) {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.primevue-sidebar .p-sidebar-content) {
  padding: 8px;
}

:deep(.primevue-sidebar .p-menu) {
  border: none;
  background: transparent;
}

:deep(.primevue-sidebar .p-menuitem-link) {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  transition: all 0.2s;
}

:deep(.primevue-sidebar .p-menuitem-link:hover) {
  background: #f3f4f6;
}

:deep(.primevue-sidebar .p-menuitem-active .p-menuitem-link) {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 500;
}

:deep(.primevue-sidebar .p-menuitem-icon) {
  font-size: 0.875rem;
  margin-right: 8px;
}

</style>
