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

export const routes = [
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
      description: 'Installa l\'app Fermi Notify sul tuo dispositivo.',
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
      if (typeof window !== 'undefined') {
        window.location.href = 'https://www.instagram.com/ferminotify/'
      }
    },
    meta: { title: 'Instagram · Fermi Notify' },
  },
  {
    path: '/gh',
    name: 'gh',
    beforeEnter() {
      if (typeof window !== 'undefined') {
        window.location.href = 'https://github.com/ferminotify'
      }
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
]

export function setupRouter(router) {
  router.beforeEach((to) => {
    // localStorage is not available in Node.js SSG — skip auth check
    if (typeof localStorage === 'undefined') return

    const token = localStorage.getItem('token')
    if (token && (to.path === '/login' || to.path === '/register')) {
      return '/dashboard'
    }
    if (!token && to.path.startsWith('/dashboard')) {
      return '/login'
    }
  })
}
