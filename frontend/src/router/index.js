import { createRouter, createWebHistory } from 'vue-router';
import Landing from '../views/Landing.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ForgotPassword from '../views/ForgotPassword.vue';
import ResetPassword from '../views/ResetPassword.vue';
import Dashboard from '../views/Dashboard.vue';
import Settings from '../views/Settings.vue';
import Shares from '../views/Shares.vue';
import Trash from '../views/Trash.vue';
import AppLayout from '../components/AppLayout.vue';
import AdminLayout from '../views/Admin/AdminLayout.vue';
import AdminDashboard from '../views/Admin/AdminDashboard.vue';
import Users from '../views/Admin/Users.vue';
import AuditLogs from '../views/Admin/AuditLogs.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: Landing,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
      },
      {
        path: 'shares',
        name: 'Shares',
        component: Shares,
      },
      {
        path: 'trash',
        name: 'Trash',
        component: Trash,
      },
    ],
  },
  {
    path: '/admin',
    component: AppLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        component: AdminLayout,
        children: [
          {
            path: '',
            name: 'AdminDashboard',
            component: AdminDashboard,
          },
          {
            path: 'users',
            name: 'AdminUsers',
            component: Users,
          },
          {
            path: 'audit-logs',
            name: 'AdminAuditLogs',
            component: AuditLogs,
          },
        ],
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let isInitialized = false;

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (!isInitialized) {
    isInitialized = true;
    await authStore.init();
    await authStore.fetchUser();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
    return;
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    next('/dashboard');
    return;
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/dashboard');
    return;
  }

  next();
});

router.afterEach(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

export default router;
