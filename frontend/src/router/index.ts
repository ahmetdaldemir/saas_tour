import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import type { Pinia } from 'pinia';
import HomeView from '../views/public/HomeView.vue';
import CorporateView from '../views/public/CorporateView.vue';
import ContactView from '../views/public/ContactView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DashboardView from '../views/DashboardView.vue';
import ToursView from '../views/ToursView.vue';
import TourDetailView from '../views/TourDetailView.vue';
import RentacarView from '../views/RentacarView.vue';
import CrmView from '../views/CrmView.vue';
import ReservationsView from '../views/ReservationsView.vue';
import LanguagesView from '../views/LanguagesView.vue';
import DestinationsView from '../views/DestinationsView.vue';
import HotelsView from '../views/HotelsView.vue';
import BlogsView from '../views/BlogsView.vue';
import CustomersView from '../views/CustomersView.vue';
import SettingsView from '../views/SettingsView.vue';
import SurveysView from '../views/SurveysView.vue';
import EmailTemplatesView from '../views/EmailTemplatesView.vue';
import UsersView from '../views/UsersView.vue';
import TransferView from '../views/TransferView.vue';
import ChatView from '../views/ChatView.vue';
import AdminDashboard from '../views/AdminDashboard.vue';
import MasterLocationsView from '../views/MasterLocationsView.vue';
import CountriesView from '../views/CountriesView.vue';
import FinanceView from '../views/FinanceView.vue';
import TripsView from '../views/TripsView.vue';
import CrmPagesView from '../views/CrmPagesView.vue';
import { useAuthStore } from '../stores/auth';

/**
 * Check if current hostname is a subdomain
 * Examples:
 *   - saastour360.com -> false (main domain)
 *   - berg.saastour360.com -> true (subdomain)
 *   - sunset.local.saastour360.test -> true (subdomain)
 */
function isSubdomain(): boolean {
  const hostname = window.location.hostname;
  
  // Remove port if present
  const cleanHostname = hostname.split(':')[0];
  
  // Split by dots
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

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { layout: 'public', isPublicSite: true },
  },
  {
    path: '/corporate',
    name: 'corporate',
    component: CorporateView,
    meta: { layout: 'public' },
  },
  {
    path: '/contact',
    name: 'contact',
    component: ContactView,
    meta: { layout: 'public' },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { layout: 'auth' },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { layout: 'public' },
  },
  {
    path: '/app',
    redirect: '/app/dashboard',
  },
  {
    path: '/app/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/languages',
    name: 'languages',
    component: LanguagesView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/destinations',
    name: 'destinations',
    component: DestinationsView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/hotels',
    name: 'hotels',
    component: HotelsView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/blogs',
    name: 'blogs',
    component: BlogsView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/tours',
    name: 'tours',
    component: ToursView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/tours/:id',
    name: 'tour-detail',
    component: TourDetailView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/rentacar',
    name: 'rentacar',
    component: RentacarView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/customers',
    name: 'customers',
    component: CustomersView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/crm',
    name: 'crm',
    component: CrmView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/crm/pages',
    name: 'crm-pages',
    component: CrmPagesView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/reservations',
    name: 'reservations',
    component: ReservationsView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/master-locations',
    name: 'master-locations',
    component: MasterLocationsView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/countries',
    name: 'countries',
    component: CountriesView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/finance',
    name: 'finance',
    component: FinanceView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/trips',
    name: 'trips',
    component: TripsView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/surveys',
    name: 'surveys',
    component: SurveysView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/email-templates',
    name: 'email-templates',
    component: EmailTemplatesView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/users',
    name: 'users',
    component: UsersView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/transfer',
    name: 'transfer',
    component: TransferView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/chat',
    name: 'chat',
    component: ChatView,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/app/admin',
    name: 'admin-dashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, layout: 'admin' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

export const setupRouterGuards = (pinia: Pinia) => {
  router.beforeEach(async (to, _from, next) => {
    const auth = useAuthStore(pinia);
    const isSubdomainRoute = isSubdomain();
    
    // Ana domain (saastour360.com) için: Sadece public sayfalar erişilebilir
    if (!isSubdomainRoute) {
      // Ana domain'de login/register/admin route'larına erişim yok
      if (to.name === 'login' || to.name === 'register' || to.meta.requiresAuth) {
        // Ana domain'de bu route'lara erişim yok, home'a yönlendir
        return next({ name: 'home' });
      }
      // Public sayfalara erişim izni ver
      return next();
    }
    
    // Subdomain (berg.saastour360.com) için: Login gerekli
    await auth.ensureSession();

    // Subdomain'de ana sayfa (/) login'e yönlendir
    if (to.name === 'home' && !auth.isAuthenticated) {
      return next({ name: 'login' });
    }

    // Auth gerektiren route'lar için kontrol
    if (to.meta.requiresAuth === true && !auth.isAuthenticated) {
      return next({ name: 'login', query: { redirect: to.fullPath } });
    }

    // Role-based authorization check
    if (to.meta.requiresAuth === true && auth.isAuthenticated && auth.user) {
      const requiredPermission = to.meta.requiredPermission as string | undefined;
      const requiredRole = to.meta.requiredRole as string | string[] | undefined;
      
      // Check permission if specified
      if (requiredPermission) {
        const { hasPermission } = await import('../utils/permissions');
        if (!hasPermission(auth.user, requiredPermission as any)) {
          // User doesn't have required permission, redirect to dashboard
          return next({ name: 'dashboard' });
        }
      }
      
      // Check role if specified
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(auth.user.role)) {
          // User doesn't have required role, redirect to dashboard
          return next({ name: 'dashboard' });
        }
      }
    }

    // Login sayfasındayken zaten authenticated ise dashboard'a yönlendir
    if (to.name === 'login' && auth.isAuthenticated) {
      return next({ name: 'dashboard' });
    }

    return next();
  });
};
