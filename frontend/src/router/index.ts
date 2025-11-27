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
import { useAuthStore } from '../stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { layout: 'public' },
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
    path: '/app/reservations',
    name: 'reservations',
    component: ReservationsView,
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
    await auth.ensureSession();

    if (to.meta.requiresAuth === true && !auth.isAuthenticated) {
      return next({ name: 'login', query: { redirect: to.fullPath } });
    }

    if (to.name === 'login' && auth.isAuthenticated) {
      return next({ name: 'dashboard' });
    }

    return next();
  });
};
