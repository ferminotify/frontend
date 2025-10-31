import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'

// Lazy-loaded views
const LoginView = () => import('../views/LoginView.vue')
const FaqView = () => import('../views/FaqView.vue')

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
    },
    {
      path: '/faq',
      name: 'faq',
      component: FaqView,
    },
  ],
})

export default router
