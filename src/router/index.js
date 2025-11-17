import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

// Lazy-loaded views
const LoginView = () => import('../views/LoginView.vue')
const FaqView = () => import('../views/FaqView.vue')
const DashboardView = () => import('../views/DashboardView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: 'Accesso · Fermi Notify' },
    },
    {
      path: '/register',
      name: 'register',
      component: LoginView,
      meta: { title: 'Registrazione · Fermi Notify' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: 'Dashboard · Fermi Notify' },
    },
    {
      path: '/faq',
      name: 'faq',
      component: FaqView,
      meta: { title: 'FAQ · Fermi Notify' },
    },
    {
      path: '/user/auth/register/confirmation/:code',
      name: 'email-confirmation',
      component: LoginView,
      meta: { title: 'Conferma Email · Fermi Notify' },
    }
  ],
})

// Lightweight auth guard using persisted token
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (token && (to.path === '/login' || to.path === '/register')) {
    return '/dashboard'
  }
  if (!token && to.path.startsWith('/dashboard')) {
    return '/login'
  }
})

router.afterEach((to) => {
  document.title = to.meta.title || 'Fermi Notify'
})

export default router
