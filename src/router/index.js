import { createRouter, createWebHistory } from 'vue-router'

const SITE_URL = 'https://fn.lkev.in'
const DEFAULT_TITLE = 'Fermi Notify'
const DEFAULT_DESCRIPTION =
  'Resta aggiornato sulle variazioni dell\'orario giornaliero dell\'IS E. Fermi Mantova con Fermi Notify. L\'app user-friendly creata dagli studenti con notifiche e funzioni avanzate.'

function upsertMetaByName(name, content) {
  let element = document.head.querySelector(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertMetaByProperty(property, content) {
  let element = document.head.querySelector(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', url)
}

// Lazy-loaded views
const HomeView = () => import('../views/HomeView.vue')
const LoginView = () => import('../views/LoginView.vue')
const FaqView = () => import('../views/FaqView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const ResetPasswordView = () => import('../views/ResetPasswordView.vue')
const AppView = () => import('../views/AppView.vue')
const SupportersView = () => import('../views/SupportersView.vue')
const TeamView = () => import('../views/TeamView.vue')
const ArchiveView = () => import('../views/ArchiveView.vue')
const TestView = () => import('../views/TestView.vue')
const FeedbackView = () => import('../views/FeedbackView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Fermi Notify',
        description:
          'Resta aggiornato sulle variazioni dell\'orario giornaliero dell\'IS E. Fermi Mantova con Fermi Notify. L\'app user-friendly creata dagli studenti con notifiche e funzioni avanzate.',
      },
    },
    {
      path: '/CercaEventi',
      name: 'cerca-eventi',
      redirect: '/',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: 'Accesso · Fermi Notify',
        description: 'Accedi a Fermi Notify per gestire notifiche e preferenze personali.',
        robots: 'noindex,follow',
      },
    },
    {
      path: '/register',
      name: 'register',
      component: LoginView,
      meta: {
        title: 'Registrazione · Fermi Notify',
        description: 'Crea un account su Fermi Notify per ricevere aggiornamenti sulle variazioni dell\'orario.',
        robots: 'noindex,follow',
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: 'Dashboard · Fermi Notify',
        description: 'Area personale per configurare canali, preferenze e dispositivi di notifica del tuo account.',
        robots: 'noindex,follow',
      },
    },
    {
      path: '/password_reset',
      name: 'password-reset',
      component: ResetPasswordView,
      meta: {
        title: 'Reset Password · Fermi Notify',
        description: 'Reimposta la password del tuo account Fermi Notify in sicurezza.',
        robots: 'noindex,follow',
      },
    },
    {
      path: '/password-otp',
      name: 'password-otp',
      component: ResetPasswordView,
      meta: {
        title: 'OTP Password · Fermi Notify',
        description: 'Verifica il codice OTP per completare il recupero password su Fermi Notify.',
        robots: 'noindex,follow',
      },
    },
    {
      path: '/faq',
      name: 'faq',
      component: FaqView,
      meta: {
        title: 'FAQ · Fermi Notify',
        description: 'Domande frequenti su utilizzo, notifiche, privacy e funzionamento di Fermi Notify.',
      },
    },
    {
      path: '/user/auth/register/confirmation/:code',
      name: 'email-confirmation',
      component: LoginView,
      meta: {
        title: 'Conferma Email · Fermi Notify',
        description: 'Conferma il tuo indirizzo email per attivare l\'account Fermi Notify.',
        robots: 'noindex,follow',
      },
    },
    {
      path: '/app',
      name: 'app',
      component: AppView,
      meta: {
        title: "Installa l'app · Fermi Notify",
        description:
          'Installa l\'app Fermi Notify sul tuo dispositivo.',
      },
    },
    {
      path: '/supporters',
      name: 'supporters',
      component: SupportersView,
      meta: {
        title: 'Sostenitori · Fermi Notify',
        description: 'Conosci i sostenitori e i contributori che supportano il progetto Fermi Notify.',
      },
    },
    {
      path: '/team',
      name: 'team',
      component: TeamView,
      meta: {
        title: 'Team · Fermi Notify',
        description: 'Scopri il team che sviluppa e mantiene Fermi Notify.',
      },
    },
    {
      path: '/feedback',
      name: 'feedback',
      component: FeedbackView,
      meta: { title: 'Feedback · Fermi Notify' },
    },
    {
      path: '/archive',
      name: 'archive',
      component: ArchiveView,
      meta: {
        title: 'Archivio · Fermi Notify',
        description: 'Consulta l\'archivio dei contenuti storici di Fermi Notify.',
      },
    },
    {
      path: '/ig',
      name: 'ig',
      beforeEnter() {
        window.location.href = 'https://www.instagram.com/ferminotify/'
      },
      meta: { title: 'Instagram · Fermi Notify' },
    },
    {
      path: '/gh',
      name: 'gh',
      beforeEnter() {
        window.location.href = 'https://github.com/ferminotify'
      },
      meta: { title: 'GitHub · Fermi Notify' },
    },
    {
      path: '/test',
      name: 'test',
      component: TestView,
      meta: {
        title: 'Test · Fermi Notify',
        description: 'Pagina di test interno per nuove feature e verifiche tecniche di Fermi Notify.',
        robots: 'noindex,nofollow',
      },
    },
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
  const title = to.meta.title || DEFAULT_TITLE
  const description = to.meta.description || DEFAULT_DESCRIPTION
  const robots = to.meta.robots || 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
  const canonicalPath = to.meta.canonical || to.path
  const canonicalUrl = new URL(canonicalPath, SITE_URL).toString()

  document.title = title
  upsertMetaByName('description', description)
  upsertMetaByName('robots', robots)

  upsertMetaByProperty('og:title', title)
  upsertMetaByProperty('og:description', description)
  upsertMetaByProperty('og:url', canonicalUrl)

  upsertMetaByName('twitter:title', title)
  upsertMetaByName('twitter:description', description)

  upsertCanonical(canonicalUrl)
})

export default router
