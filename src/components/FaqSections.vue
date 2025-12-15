<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { FAQ_TABS } from '@/utils/config.js'

const route = useRoute()

const activeTab = ref('generali')
const stickyContainer = ref(null)
const stickyOffset = ref(0)
const isSticked = ref(false)

const setTab = (tabId) => {
	activeTab.value = tabId
}

const handleScroll = () => {
	if (typeof window === 'undefined' || !stickyContainer.value) return
	isSticked.value = window.scrollY >= stickyOffset.value
}

onMounted(() => {
	if (typeof window === 'undefined') return

	// Initialize active tab from query param (?page=generali|configurazione|privacy)
	const page = route.query.page
	if (typeof page === 'string' && FAQ_TABS.includes(page)) {
		activeTab.value = page
	}

	if (stickyContainer.value) {
		const rect = stickyContainer.value.getBoundingClientRect()
		stickyOffset.value = rect.top + window.scrollY
	}
	window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
	if (typeof window === 'undefined') return
	window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
	<section class="faq-sections">
		<div ref="stickyContainer" class="btn-container faqIndex" :class="{ sticked: isSticked }">
			<a
				id="generali"
				href="#"
				class="btn tab indexElem generali"
				:class="{ active: activeTab === 'generali' }"
				@click.prevent="setTab('generali')"
			>
				Generali
			</a>
			<a
				id="configurazione"
				href="#"
				class="btn tab indexElem configurazione"
				:class="{ active: activeTab === 'configurazione' }"
				@click.prevent="setTab('configurazione')"
			>
				Configurazione
			</a>
			<a
				id="privacy"
				href="#"
				class="btn tab indexElem privacy"
				:class="{ active: activeTab === 'privacy' }"
				@click.prevent="setTab('privacy')"
			>
				Informativa privacy
			</a>
		</div>

		<div class="btn-container faqIndexMobile" :class="{ sticked: isSticked }">
			<a
				id="generali-mobile"
				href="#"
				class="btn tab indexElem generali"
				:class="{ active: activeTab === 'generali' }"
				@click.prevent="setTab('generali')"
			>
				Generali
			</a>
			<a
				id="configurazione-mobile"
				href="#"
				class="btn tab indexElem configurazione"
				:class="{ active: activeTab === 'configurazione' }"
				@click.prevent="setTab('configurazione')"
			>
				Config
			</a>
			<a
				id="privacy-mobile"
				href="#"
				class="btn tab indexElem privacy"
				:class="{ active: activeTab === 'privacy' }"
				@click.prevent="setTab('privacy')"
			>
				Privacy
			</a>
		</div>

		<div
			id="generaliContainer"
			class="indexElemContainer"
			:class="{ indexElemShow: activeTab === 'generali' }"
		>
			<div class="question">
				<h3>1. Cos'&egrave; Fermi Notify?</h3>
				<p class="answer">
					Fermi Notify &egrave; un servizio che ti permette di ricevere notifiche via email o via Telegram quando viene aggiunto un evento o una variazione dell'orario sul
					<a href="https://www.fermimn.edu.it/variazioni-orario/" class="link">calendario giornaliero</a>, come una sostituzione o un cambio aula.
				</p>
			</div>

			<div class="question">
				<h3>2. Come faccio a registrarmi?</h3>
				<p class="answer">
					Per registrarti clicca <a href="/register" class="link">qui</a>. L'email utilizzata nella registrazione sarà quella che riceverà le notifiche.
				</p>
			</div>

			<div class="question">
				<h3>3. Come viene protetta la password?</h3>
				<p class="answer">La password viene criptata attraverso un processo di hashing ricorsivi a un numero adeguato di round.</p>
			</div>

			<div class="question">
				<h3>4. Quando arrivano le notifiche?</h3>
				<p class="answer">
					Nel caso in cui l'evento che ti riguarda venga pubblicato in qualsiasi momento prima del giorno stesso, ti arriver&agrave; una notifica <i>Daily Notification</i> che racchiude tutti gli eventi in programma.<br>
					Le Daily Notification vengono inviate di default alle <span class="primary-text">6:00</span> del giorno stesso delle variazioni dell'orario.<br>
					Puoi cambiare l'orario di invio delle Daily Notification nella
					<a href="/dashboard" class="link">Dashboard</a>. Maggiori informazioni nella sezione
					<a href="/faq?page=configurazione" class="link">Configurazione</a>.
				</p>
				<p class="answer answer-staccato">
					Nel caso in cui l'evento che ti riguarda venga pubblicato la Daily Notification (come una sostituzione dell'ultimo minuto), riceverai la notifica <i>Last Minute Notification</i>
					<span class="primary-text">all'istante</span>.
				</p>
			</div>

			<div class="question">
				<h3>5. Fermi Notify e l'Istituto Superiore "Enrico Fermi" Mantova.</h3>
				<p class="answer">
					Fermi Notify non &egrave; un servizio ufficiale dell'Istituto Superiore "Enrico Fermi" di Mantova. Il sistema non è riconosciuto dalla presidenza. Eventuali malfunzionamenti sono a carico dello staff e non sono valide
					giustificazioni in uffici di segreteria e presidenza
				</p>
			</div>
		</div>

		<div
			id="configurazioneContainer"
			class="indexElemContainer"
			:class="{ indexElemShow: activeTab === 'configurazione' }"
		>
			<div class="question">
				<h3>1. Cosa sono le keywords?</h3>
				<p class="answer">
					Le <span class="primary-text">keywords</span> sono le parole chiave che inserisci nella tua lista per ricevere la notifica se &egrave; presente un evento che la riguarda nel calendario giornaliero.
				</p>
				<p class="answer answer-staccato">
					Esempio: se aggiungi <code>4CIIN</code> come keyword, riceverai una notifica se nel calendario giornaliero &egrave; presente un evento che contiene la parola <i>4CIIN</i>. Fai attenzione alla
					<span class="primary-text">formattazione</span> della keyword, dev'essere uguale a quella scritta nel calendario giornaliero (<code>4CIIN</code>, non "4 CIIN" o "4CIN")!
				</p>
				<p class="answer answer-staccato">
					Consiglio: aggiungi la tua <span class="primary-text">classe</span> per ricevere le notifiche riguardanti la classe (come una sostituzione o un cambio aula), puoi aggiungere anche:<br>
				<ul style="line-height: 1.5em; ">
					<li>
						il tuo <span class="primary-text">cognome</span> per le notifiche riguardanti solo te (come la prenotazione di un aula);
					</li>
					<li>
						il nome di un <span class="primary-text">corso</span> che segui per le notifiche riguardanti le attivit&agrave; extrascolastiche (es. <i>Corso FUSION</i>).
					</li>
				</ul>
				</p>
			</div>

			<div class="question">
				<h3>2. Come aggiungo le keywords?</h3>
				<p class="answer">
					Puoi aggiungere le keywords nella casella dedicata nella <a href="/dashboard">Dashboard</a>. Una volta aggiunte, appariranno nella lista. Le keywords <span class="primary-text">non</span> sono case sensitive, quindi puoi
					aggiungerle in maiuscolo o minuscolo (4CIIN o 4Ciin o 4ciin non cambia).
				</p>
			</div>

			<div class="question">
				<h3>3. Come rimuovo le keywords?</h3>
				<p class="answer">
					Per rimuovere una keyword, <span class="primary-text">riscrivila</span> nella casella che hai utilizzato per aggiungerla nella <a href="/dashboard" class="link">Dashboard</a>. Quindi la keyword verr&agrave; rimossa dalla lista.
				</p>
			</div>

			<div class="question">
				<h3>4. Come funziona la notifica tramite Telegram?</h3>
				<p class="answer">
					Per essere notificato su Telegram, invia il <span class="primary-text">codice</span> presente nella <a href="/dashboard#Telegram" class="link">Dashboard</a> al bot
					<a href="https://t.me/FermiNotifierBot" class="link">@FermiNotifierBot</a>.
				</p>
			</div>

			<div class="question">
				<h3>5. Come cambio l'orario di invio delle Daily Notification?</h3>
				<p class="answer">
					La Daily Notification viene inviata di default alle <span class="primary-text">6:00</span> del giorno stesso delle variazioni dell'orario (es. <u>marted&igrave;</u> <i>Entrata posticipata</i>
					<i class="fa-solid fa-arrow-right"></i> notifica alle 6:00 di <u>marted&igrave;</u>).<br>
					Puoi cambiare l'orario di invio delle Daily Notification e impostarla nei seguenti modi:
				<ul style="line-height: 1.5em; ">
					<li style="margin: 10px 0">
						Alla <span class="primary-text">mattina</span> tra le <span class="primary-text">00:00</span> e le <span class="primary-text">8:10</span> in cui verranno raggruppati le tutte variazioni del giorno (es. <u>luned&igrave;</u>
						<i>Entrata posticipata</i>, <i>Riunione MyFermi</i> <i class="fa-solid fa-arrow-right"></i> notifica alle 6:30 di <u>luned&igrave;</u>);
					</li>
					<li style="margin: 10px 0">
						Il <span class="primary-text">giorno prima</span> in cui verranno raggruppati le variazioni del giorno successivo (es. <u>luned&igrave;</u> <i>Entrata posticipata</i>, <i>Riunione MyFermi</i>
						<i class="fa-solid fa-arrow-right"></i> notifica alle 19:30 di <u>domenica</u>).
					</li>
				</ul>
					Tutte le variazioni aggiunte dopo l'orario specificato (negli esempi, dopo le 6:30 e le 19:30) verranno inviati come Last Minute Notification all'istante in cui vengono individuate nel calendario giornaliero.<br>
					Per cambiare l'orario di invio delle Daily Notification, vai nella <a href="/dashboard" class="link">Dashboard</a> e seleziona l'orario desiderato.
				</p>
			</div>

			<div class="question" id="emailSpam">
				<h3>6. Le email sono contrassegnate come SPAM</h3>
				<p class="answer">
					Tutte le nostre email vengono inviate dai nostri server <i>self-hosted</i> senza dipendere da servizi di terze parti. Pertanto, i provider di email come Gmail o Outlook potrebbero contrassegnare le email come SPAM o, in alcuni casi,
					bloccarle completamente.<br>
					Se trovi una notifica nella cartella <span class="primary-text">SPAM</span> o <span class="primary-text">Promozioni</span>, ti invitiamo a contrassegnarla come <i>non spam</i> per spostarla nella cartella
					<span class="primary-text">Posta in arrivo</span>.<br>
					Un'alternativa per evitare che le email vengano contrassegnate come SPAM &egrave; utilizzare l'email istituzionale <i>@fermimn.edu.it</i> o ricevere le notifiche tramite Telegram.
				</p>
			</div>
		</div>

		<div
			id="privacyContainer"
			class="indexElemContainer"
			:class="{ indexElemShow: activeTab === 'privacy' }"
		>
			<div class="question">
				<h3>Informativa privacy</h3>
				<p class="answer">
					La presente informativa descrive le modalità di gestione dei dati personali degli utenti che interagiscono con Fermi Notify. Ai sensi delle normative italiane ed europee in materia di protezione dei dati personali, la presente
					informativa è resa in ottemperanza al Regolamento (UE) 2016/679 del Parlamento Europeo e del Consiglio del 27 aprile 2016 (GDPR).
				</p>
			</div>
			<div class="question">
				<h3>1. Raccolta dei dati</h3>
				<p class="answer">
					Fermi Notify richiede la raccolta di dati personali specifici esclusivamente nel contesto della registrazione al servizio per usufruire delle funzionalità avanzate, come le notifiche. I dati necessari per la registrazione includono nome e
					cognome, indirizzo email e genere. Facoltativamente, l'utente può fornire il proprio Telegram ID. La raccolta di tali informazioni è vincolata alla volontà dell'utente di usufruire dei servizi di registrazione e notifica. La fruizione di
					altre funzionalità del servizio, che non implicano la registrazione, è consentita senza la necessità di fornire tali dati personali.
				</p>
			</div>
			<div class="question">
				<h3>2. Trattamento dei dati</h3>
				<p class="answer">
					I dati forniti sono accessibili esclusivamente al team interno di Fermi Notify, composto da persone fisiche presenti a <a href="/credits" class="link">questa pagina</a>. Collaboratori esterni e strumenti citati come "Extra" non hanno
					accesso ai dati sensibili degli utenti. L'impiego dell'intelligenza artificiale (OpenAI ChatGPT, Google Gemini e GitHub Copilot) è limitato al supporto tecnico e allo sviluppo.
				</p>
			</div>
			<div class="question">
				<h3>3. Conservazione e utilizzo dei dati</h3>
				<p class="answer">
					Fermi Notify utilizza tecnologie come i session cookie e localStorage per migliorare l'esperienza di navigazione. I session cookie sono essenziali per il funzionamento del sito e vengono eliminati automaticamente alla chiusura della
					sessione. Le informazioni memorizzate in localStorage riguardano esclusivamente le preferenze dell'utente e conserva informazioni riguardanti le keywords/parole chiave nella sezione "Filtra eventi" nella homepage e vengono salvati in modo
					locale sul dispositivo utilizzato per la navigazione.
				</p>
			</div>
			<div class="question">
				<h3>4. Protezione dei dati</h3>
				<p class="answer">
					Le informazioni personali fornite dagli utenti sono custodite in modo sicuro e non vengono condivise con terzi.<br>
					La password fornita per l'accesso degli gli utenti registrati è soggetta a un processo di hash mediante un numero adeguato di round. Tale procedura è finalizzata a migliorare la sicurezza dei dati dell'utente. L'hashing rappresenta una
					pratica crittografica che converte la password in una stringa di lunghezza fissa, rendendo impossibile risalire alla password originale a partire dal valore hash generato.<br>
					Attualmente, i dati degli utenti sono conservati in un database protetto proprietario di Microsoft Azure localizzato in Italy North. L'adozione di misure di sicurezza avanzate, tra cui crittografia dei dati e protocolli di sicurezza,
					garantisce la massima tutela delle informazioni personali degli utenti.
				</p>
			</div>
			<div class="question">
				<h3>5. Possibilità di modifica, disabilitazione e cancellazione dell'account</h3>
				<p class="answer">
					Gli utenti hanno la facoltà di cancellare i dati salvati in localStorage e disabilitare il salvataggio per il sito tramite le impostazioni del browser. Tuttavia, tale azione potrebbe limitare alcune funzionalità del servizio. Gli utenti
					registrati possono eliminare l'account inviando una richiesta via email a <a href="mailto:mail@fn.lkev.in" class="link">mail@fn.lkev.in</a>. Fermi Notify gestirà le richieste di cancellazione dell'account nel rispetto delle
					normative sulla protezione dei dati personali, assicurando la sicurezza e la privacy delle informazioni degli utenti.
				</p>
			</div>
			<div class="question">
				<h3>6. Gestione dei dati in conformità alle normative sulla privacy</h3>
				<p class="answer">
					La gestione dei dati di Fermi Notify è svolta con attenzione alle normative sulla privacy vigenti. Sebbene l'utilizzo di localStorage non coinvolga la memorizzazione di dati personali o sensibili, il nostro impegno è garantire il rispetto
					delle norme sulla protezione dei dati. Fermi Notify si adopera per condurre tutte le operazioni in conformità alle leggi italiane ed europee sulla privacy, assicurando che la gestione delle informazioni rispetti gli standard richiesti.
				</p>
			</div>
			<div class="question">
				<h3 class="flex-y-center">
					7. Open Source&nbsp;<a class="flex-y-center" href="https://creativecommons.org/licenses/by-sa/4.0/"
						><img src="https://creativecommons.org/images/deed/cc_icon_white_x2.png" style="height: 1em;" />
						<img src="https://creativecommons.org/images/deed/attribution_icon_white_x2.png" style="height: 1em;" />
						<img src="https://creativecommons.org/images/deed/sa_white_x2.png" style="height: 1em;" /></a
					>
				</h3>
				<p class="answer">
					Si specifica che il progetto è un'iniziativa open source, conforme alla licenza Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), rendendo il codice sorgente accessibile al pubblico a
					<a href="https://github.com/search?q=topic%3Aferminotify+org%3Aferminotify&type=Repositories" class="link">questo link</a>. La licenza adottata consente agli utenti di condividere, adattare e utilizzare liberamente il software, a
					condizione che venga fornito l'attributo appropriato e che eventuali opere derivate siano soggette alla stessa licenza. Questo approccio riflette l'impegno per la condivisione della conoscenza e la collaborazione aperta, invitando gli
					sviluppatori a contribuire al progetto nel rispetto delle condizioni di licenza stabilite. Gli utenti sono incoraggiati a esplorare i repository, ad apportare miglioramenti e a condividere le proprie modifiche con la community,
					contribuendo così alla crescita e all'evoluzione dell'applicazione in conformità con i principi della licenza CC BY-SA 4.0.
				</p>
			</div>
		</div>

		<div class="flex-col-center" style="margin: 25px 0;">
			<p style="margin: 10px 0;">Per supporto o informazioni, contatta:</p>
			<div class="flex-center" style="gap: 10px">
				<a class="btn outlined flex-center" href="https://www.instagram.com/ferminotify/"
					><i class="fa-brands fa-instagram material-space-right"></i> ferminotify</a
				>
				<!--
				<a class="btn outlined flex-center" href="mailto:ferminotify@gmail.com"><span class="material-symbols-outlined material-space-right">mail</span> ferminotify@gmail.com</a>
				<a class="btn text flex-center" @click="copy('ferminotify@gmail.com')"><span class="material-symbols-outlined">content_copy</span></a>
				-->
			</div>
			<a href="/credits" class="btn filled flex-center" style="margin-top: 10px;">Team</a>
		</div>
	</section>
</template>

<style scoped>
.faq-sections {
	width: 100%;
}
</style>

