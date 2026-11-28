import { useUserStore } from '@/stores/user'
import { setRouter } from '@/utils/navigation'
import { saveRedirect, consumeRedirect } from '@/utils/redirect'

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
const OrarioView = () => import('../views/OrarioView.vue')
const SegnalaView = () => import('../views/SegnalaView.vue')
const AuthCallbackView = () => import('../views/AuthCallbackView.vue')
const CompleteProfileView = () => import('../views/CompleteProfileView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')

export const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
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
    path: '/auth/callback',
    name: 'auth-callback',
    component: AuthCallbackView,
    meta: {
      title: 'Accesso · Fermi Notify',
      description: 'Completamento accesso con Google.',
      robots: 'noindex,nofollow',
    },
  },
  {
    path: '/collega-moodle',
    name: 'link-moodle',
    component: () => import('@/views/LinkMoodleView.vue'),
    meta: {
      title: 'Collega Moodle · Fermi Notify',
      description: 'Collega il tuo account Moodle a Fermi Notify.',
      robots: 'noindex,nofollow',
    },
  },
  {
    path: '/complete-profile',
    name: 'complete-profile',
    component: CompleteProfileView,
    meta: {
      title: 'Completa il profilo · Fermi Notify',
      description: 'Completa i dati del tuo profilo Fermi Notify.',
      robots: 'noindex,nofollow',
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
    // Email footer link (and GET on the backend's one-click URL): disable notification emails
    path: '/auth/unsubscribe',
    name: 'unsubscribe',
    component: () => import('@/views/UnsubscribeView.vue'),
    meta: {
      title: 'Disattiva le email · Fermi Notify',
      description: 'Disattiva le notifiche via email di Fermi Notify.',
      robots: 'noindex,nofollow',
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
    path: '/orario/segnala',
    name: 'orario-segnala',
    component: SegnalaView,
    meta: {
      title: 'Segnala un problema · Fermi Notify',
      description: 'Segnala un errore nell’orario di Fermi Notify.',
      robots: 'noindex,follow',
    },
  },
  {
    path: '/orario/:type(classe|aula|docente)?/:ref?',
    name: 'orario',
    component: OrarioView,
    meta: {
      title: 'Orario · Fermi Notify',
      description:
        "Orario settimanale di tutte le classi, le aule e i docenti dell'IS E. Fermi di Mantova con sostituzioni, cambi aula e variazioni del calendario giornaliero già applicate.",
      breadcrumb: [{ name: 'Orario', path: '/orario' }],
    },
  },
  {
    path: '/faq',
    name: 'faq',
    component: FaqView,
    meta: {
      title: 'Domande frequenti · Fermi Notify',
      description:
        'Come funzionano Fermi Notify, le notifiche Daily e Last Minute, le keyword, l\'orario con le variazioni e l\'accesso con Moodle. Informativa privacy inclusa.',
      schemaType: 'FAQPage',
      breadcrumb: [{ name: 'FAQ', path: '/faq' }],
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
        "Installa Fermi Notify come app sul telefono o sul computer: orario e variazioni dell'IS E. Fermi di Mantova sempre a portata di mano, con notifiche push.",
      breadcrumb: [{ name: "Installa l'app", path: '/app' }],
    },
  },
  {
    path: '/supporters',
    name: 'supporters',
    component: SupportersView,
    meta: {
      title: 'Sostenitori · Fermi Notify',
      description:
        'Le persone che sostengono Fermi Notify, il progetto gratuito e senza pubblicità degli studenti dell\'IS E. Fermi di Mantova. Offrici un caffè!',
      breadcrumb: [{ name: 'Sostenitori', path: '/supporters' }],
    },
  },
  {
    path: '/team',
    name: 'team',
    component: TeamView,
    meta: {
      title: 'Team · Fermi Notify',
      description:
        'Gli studenti ed ex studenti dell\'IS E. Fermi di Mantova che hanno creato e sviluppano Fermi Notify, progetto open source senza scopo di lucro.',
      schemaType: 'AboutPage',
      breadcrumb: [{ name: 'Team', path: '/team' }],
    },
  },
  {
    path: '/feedback',
    name: 'feedback',
    component: FeedbackView,
    meta: {
      title: 'Feedback · Fermi Notify',
      description: 'Racconta la tua esperienza con Fermi Notify.',
      robots: 'noindex,follow',
    },
  },
  {
    path: '/archive',
    name: 'archive',
    component: ArchiveView,
    meta: {
      title: 'Archivio · Fermi Notify',
      description:
        'Archivio di Fermi Notify: poster, grafiche e risorse open source prodotte dal progetto per gli studenti dell\'IS E. Fermi di Mantova.',
      schemaType: 'CollectionPage',
      breadcrumb: [{ name: 'Archivio', path: '/archive' }],
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
    meta: { title: 'Instagram · Fermi Notify', robots: 'noindex,follow' },
  },
  {
    path: '/gh',
    name: 'gh',
    beforeEnter() {
      if (typeof window !== 'undefined') {
        window.location.href = 'https://github.com/ferminotify'
      }
    },
    meta: { title: 'GitHub · Fermi Notify', robots: 'noindex,follow' },
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
  {
    // Unknown URLs
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: {
      title: 'Pagina non trovata · Fermi Notify',
      description: 'La pagina che cerchi non esiste o è stata spostata.',
      robots: 'noindex,follow',
    },
  },
]

export function setupRouter(router) {
  // Expose the instance for non-component navigation (e.g. alert banner links).
  setRouter(router)

  router.beforeEach((to) => {
    // localStorage is not available in Node.js SSG — skip auth check
    // Use typeof check AND verify getItem exists (vite-ssg may inject a broken stub)
    if (typeof localStorage === 'undefined' || typeof localStorage?.getItem !== 'function') return

    const token = localStorage.getItem('token')
    // Already logged in: /login only to log in again with Moodle (teachers on /orario)
    if (token && to.query.moodle !== '1' && (to.path === '/login' || to.path === '/register')) {
      return consumeRedirect()
    }
    // A Moodle signup completes its profile before any account (and token) exists.
    const moodleSignup = to.path.startsWith('/complete-profile') && to.query.moodle === '1'
    if (!token && !moodleSignup && (to.path.startsWith('/dashboard') || to.path.startsWith('/complete-profile'))) {
      saveRedirect(to.fullPath)
      return '/login'
    }
    // A logged-in user with an unfinished Google signup can browse freely, but
    // the dashboard requires finishing the completion step first.
    if (token && to.path.startsWith('/dashboard')) {
      const store = useUserStore()
      if (store.user?.profile_complete === false) {
        return '/complete-profile'
      }
    }
  })
}
