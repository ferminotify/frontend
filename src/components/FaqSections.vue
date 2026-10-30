<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { FAQ_TABS } from '@/utils/config.js'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

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
					Fermi Notify ti avvisa via email, Telegram o notifica push quando sul <a href="https://www.fermimn.edu.it/variazioni-orario/" class="link">calendario giornaliero</a> compare una variazione dell'orario o un evento che ti riguarda, come una sostituzione, un cambio aula o un'uscita anticipata.
				</p>
				<p class="answer answer-staccato">
					Puoi anche cercare gli eventi in <RouterLink to="/" class="link">Cerca eventi</RouterLink> e vedere l'orario settimanale di classi e aule, con le variazioni gi&agrave; applicate in <RouterLink to="/orario" class="link">Orario</RouterLink>.
				</p>
			</div>
			<div class="question">
				<h3>2. Come faccio a registrarmi?</h3>
				<p class="answer">
					Per registrarti clicca <RouterLink to="/register" class="link">qui</RouterLink> con email, Google o Moodle.
				</p>
				<p class="answer answer-staccato">
					L'email che indichi &egrave; quella che riceve le notifiche. Prima di poter usare l'account devi confermarla con il link che ti mandiamo.
				</p>
			</div>
			<div class="question">
				<h3>3. Come funziona l'accesso con Moodle?</h3>
				<p class="answer">
					Utilizza username e la password di Moodle Fermi. Vengono controllati direttamente sul sito del Fermi. Viene salviato su Fermi Notify solo il nome utente: la password <span class="primary-text">non viene mai salvata</span>.
				</p>
				<p class="answer answer-staccato">
					I docenti che effettuano l'accesso con Moodle possono visualizzare l'orario dei docenti con le variazioni applicate. Usiamo la tua sessione del tuo ultimo accesso con Moodle finch&eacute; &egrave; valida (al massimo 13 giorni) per accedere all'orario; quando scale, dovrai riaccedere con Moodle.
				</p>
				<p class="answer answer-staccato">
					Hai gi&agrave; un account con email? Accedi con Moodle e indica quell'email per collegarla.
				</p>
			</div>
			<div class="question">
				<h3>4. Come viene protetta la password?</h3>
				<p class="answer">
					La password di Fermi Notify viene criptata attraverso un processo di hashing ricorsivi a un numero adeguato di round, un algoritmo impossibile da decifrare. La password di Moodle viene inviata direttamente al sito del Fermi e non viene mai salvata. 
				</p>
			</div>
			<div class="question">
				<h3>5. Quando arrivano le notifiche?</h3>
				<p class="answer">
					Se l'evento che ti riguarda &egrave; pubblicato prima del giorno stesso, ricevi una <i>Daily Notification</i> che raccoglie tutti gli eventi della giornata, di default alle <span class="primary-text">6:00</span>. Puoi cambiare l'orario nella <RouterLink to="/dashboard" class="link">Dashboard</RouterLink>. Maggiori informazioni nella sezione <RouterLink to="/faq?page=configurazione" class="link">Configurazione</RouterLink>.
				</p>
				<p class="answer answer-staccato">
					Se l'evento viene pubblicato dopo la Daily Notification, per esempio una sostituzione dell'ultimo minuto, ricevi una <i>Last Minute Notification</i> <span class="primary-text">entro pochi minuti</span>: il calendario viene controllato ogni 5 minuti.
				</p>
			</div>
			<div class="question">
				<h3>6. Come funziona la pagina Orario?</h3>
				<p class="answer">
					In <RouterLink to="/orario" class="link">Orario</RouterLink> trovi l'orario settimanale di ogni classe e aula, con le variazioni del calendario applicate in modo dinamico.
				</p>
				<p class="answer answer-staccato">
					L'orario dei docenti dinamico con le variazioni applicate &egrave; disponibile solo per chi ha l'account abilitato per visualizzarli sul sito del Fermi.
				</p>
			</div>
			<div class="question">
				<h3>7. Come funziona Cerca eventi?</h3>
				<p class="answer">
					In <RouterLink to="/" class="link">Cerca eventi</RouterLink> scrivi una o pi&ugrave; keyword e vedi tutti gli eventi in programma che le riguardano, con le stesse regole usate per le notifiche (vedi <RouterLink to="/faq?page=configurazione" class="link">Cosa sono le keywords</RouterLink>). Le keyword cercate restano salvate solo sul tuo dispositivo.
				</p>
			</div>
			<div class="question">
				<h3>8. Fermi Notify e l'Istituto Superiore "Enrico Fermi" Mantova.</h3>
				<p class="answer">
					Fermi Notify non &egrave; un servizio ufficiale dell'Istituto Superiore "Enrico Fermi" di Mantova e non &egrave; riconosciuto dalla presidenza. Eventuali malfunzionamenti sono a carico dello staff e non sono valide giustificazioni in uffici di segreteria e presidenza.
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
					Le <span class="primary-text">keywords</span> sono le parole chiave che inserisci nella tua lista per ricevere la notifica se è presente un evento che la riguarda nel calendario giornaliero. Ti consigliamo di aggiungere la tua <span class="primary-text">classe</span> e il tuo <span class="primary-text">cognome</span>.
				</p>
				<ul style="line-height: 1.5em;">
					<li style="margin: 6px 0"><span class="primary-text">classe</span> (es. <code>4CIIN</code>): gli eventi della classe e quelli per tutto il suo anno o gruppo (es. <i>CLASSI QUARTE</i>, <i>TRIENNIO</i>).</li>
					<li style="margin: 6px 0"><span class="primary-text">cognome</span>: gli eventi in cui &egrave; nominato (es. <i>PEER TUTORING</i>, <i>ASSENTE</i>);</li>
					<li style="margin: 6px 0"><span class="primary-text">aula</span>: gli eventi in quell'aula;</li>
					<li style="margin: 6px 0">qualsiasi altra <span class="primary-text">parola</span> (es. <code>Corso FUSION</code>): gli eventi che la contengono nel titolo.</li>
				</ul>
			</div>
			<div class="question">
				<h3>2. Come aggiungo le keywords?</h3>
				<p class="answer">
					Puoi aggiungere le keywords nella tua <RouterLink to="/dashboard" class="link">Dashboard</RouterLink>.
				</p>
			</div>
			<div class="question">
				<h3>3. Come rimuovo le keywords?</h3>
				<p class="answer">
					Nella <RouterLink to="/dashboard" class="link">Dashboard</RouterLink> premi il pulsante di modifica accanto alla lista, poi tocca la keyword per rimuoverla.
				</p>
			</div>
			<div class="question">
				<h3>4. Cosa sono le attivit&agrave; facoltative?</h3>
				<p class="answer">
					Sportelli, peer tutoring, olimpiadi e incontri per i rappresentanti sono attivit&agrave; che non riguardano tutta la classe o sono attività opzionali. Verrai notificato solo se hai attivato quella categoria in <RouterLink to="/dashboard#facoltative" class="link">Attivit&agrave; facoltative</RouterLink>.
				</p>
				<!--p class="answer answer-staccato"> TODO rivedere
					Se il titolo nomina proprio la tua classe, la notifica arriva comunque. In Orario e in Cerca eventi queste attivit&agrave; si vedono sempre.
				</p-->
			</div>
			<div class="question">
				<h3>5. Come funziona la notifica tramite Telegram?</h3>
				<p class="answer">
					Per essere notificat&#601; su Telegram, invia il <span class="primary-text">codice</span> presente nella <RouterLink to="/dashboard#Telegram" class="link">Dashboard</RouterLink> al bot <a href="https://t.me/FermiNotifierBot" class="link">@FermiNotifierBot</a>.
				</p>
			</div>
			<div class="question">
				<h3>6. Come funzionano le notifiche push?</h3>
				<p class="answer">
					Attiva le notifiche push nella <RouterLink to="/dashboard" class="link">Dashboard</RouterLink>, quindi approva il popup del browser per consentire le notifiche <b>in modo permanente</b>, altrimenti le notifiche si disattivano automaticamente da solo.
				</p>
			</div>
			<div class="question">
				<h3>7. Come cambio l'orario di invio delle Daily Notification?</h3>
				<p class="answer">
					La Daily Notification viene inviata di default alle <span class="primary-text">6:00</span> del giorno stesso delle variazioni (es. <u>marted&igrave;</u> <i>Entrata posticipata</i> <i class="fa-solid fa-arrow-right"></i> notifica alle 6:00 di <u>marted&igrave;</u>). Puoi impostarla:
				</p>
				<ul style="line-height: 1.5em;">
					<li style="margin: 6px 0">alla <span class="primary-text">mattina</span>, tra le <span class="primary-text">00:00</span> e le <span class="primary-text">8:10</span>, con tutte le variazioni del giorno (es. <u>luned&igrave;</u> <i>Entrata posticipata</i>, <i>Riunione MyFermi</i> <i class="fa-solid fa-arrow-right"></i> notifica alle 6:30 di <u>luned&igrave;</u>);</li>
					<li style="margin: 6px 0">il <span class="primary-text">giorno prima</span>, fino alle 23:55, con le variazioni del giorno successivo (es. <u>luned&igrave;</u> <i>Entrata posticipata</i>, <i>Riunione MyFermi</i> <i class="fa-solid fa-arrow-right"></i> notifica alle 19:30 di <u>domenica</u>).</li>
				</ul>
				<p class="answer answer-staccato">
					Tutte le variazioni aggiunte dopo l'orario scelto (negli esempi, dopo le 6:30 e le 19:30) arrivano come Last Minute Notification. Per cambiare l'orario vai nella <RouterLink to="/dashboard" class="link">Dashboard</RouterLink>.
				</p>
			</div>
			<div class="question" id="emailSpam">
				<h3>8. Le email sono contrassegnate come SPAM</h3>
				<p class="answer">
					Le email vengono inviate tramite servizi di invio email esterni (Microsoft Azure e Mailgun), ma alcuni provider come Gmail o Outlook potrebbero comunque metterle nella cartella <span class="primary-text">SPAM</span> o <span class="primary-text">Promozioni</span>.<br>
					Se trovi una notifica l&igrave;, contrassegnala come <i>non spam</i> per spostarla nella <span class="primary-text">Posta in arrivo</span>. In alternativa usa l'email istituzionale <i>@fermimn.edu.it</i> oppure ricevi le notifiche su Telegram o come notifiche push.
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
					Questa informativa descrive quali dati personali tratta Fermi Notify, perch&eacute; e con chi, ai sensi del Regolamento (UE) 2016/679 (GDPR). Il servizio &egrave; gestito dal <RouterLink to="/team" class="link">team</RouterLink> di Fermi Notify; per qualsiasi richiesta scrivi a <a href="mailto:mail@fn.lkev.in" class="link">mail@fn.lkev.in</a>.
				</p>
			</div>
			<div class="question">
				<h3>1. Quali dati raccogliamo</h3>
				<p class="answer">
					Cerca eventi e Orario si usano senza registrazione. Se crei un account raccogliamo solo quello che serve al servizio:
				</p>
				<ul style="line-height: 1.5em;">
					<li style="margin: 6px 0"><span class="primary-text">account</span>: nome, cognome, email, genere, l'hash della password (se ne imposti una), la data dell'ultimo accesso;</li>
					<li style="margin: 6px 0"><span class="primary-text">preferenze</span>: keywords, canali e orario delle notifiche, attivit&agrave; facoltative scelte;</li>
					<li style="margin: 6px 0"><span class="primary-text">accesso con Google</span>: l'identificativo dell'account Google;</li>
					<li style="margin: 6px 0"><span class="primary-text">accesso con Moodle</span>: il nome utente Moodle e, se la scuola ti fa vedere i docenti, la sessione del tuo ultimo accesso (cifrata). La password viene inviata solo al sito della scuola per verificarla e non viene salvata;</li>
					<li style="margin: 6px 0"><span class="primary-text">Telegram</span>, se lo colleghi: il tuo ID Telegram;</li>
					<li style="margin: 6px 0"><span class="primary-text">notifiche push</span>, per ogni dispositivo su cui le attivi: l'indirizzo e le chiavi per inviarle, un identificativo del dispositivo e una sua breve descrizione (es. browser e sistema);</li>
					<li style="margin: 6px 0"><span class="primary-text">notifiche inviate</span>: quali eventi ti abbiamo gi&agrave; notificato, per non mandarli due volte;</li>
					<li style="margin: 6px 0"><span class="primary-text">segnalazioni</span>: se usi <i>Segnala un problema</i>, il testo, l'email facoltativa per risponderti e lo screenshot facoltativo;</li>
					<li style="margin: 6px 0"><span class="primary-text">log tecnici</span>: l'indirizzo IP e l'ora di accessi e tentativi, usati per sicurezza e per limitare gli abusi (es. troppi tentativi di accesso).</li>
				</ul>
			</div>
			<div class="question">
				<h3>2. Perch&eacute; li usiamo</h3>
				<p class="answer">
					I dati dell'account servono a fornirti il servizio che chiedi: trovare gli eventi che ti riguardano e avvisarti sui canali che scegli. I log tecnici servono a proteggere il servizio e gli account. Non usiamo i dati per pubblicit&agrave; e non li vendiamo.
				</p>
			</div>
			<div class="question">
				<h3>3. Chi pu&ograve; accedere ai dati</h3>
				<p class="answer">
					I dati sono accessibili solo al team interno di Fermi Notify. Per funzionare usiamo alcuni fornitori, che trattano i dati solo per conto nostro:
				</p>
				<ul style="line-height: 1.5em;">
					<li style="margin: 6px 0"><span class="primary-text">Microsoft Azure</span>: database (Italia, Italy North) e invio delle email;</li>
					<li style="margin: 6px 0"><span class="primary-text">Mailgun</span>: invio delle email;</li>
					<li style="margin: 6px 0"><span class="primary-text">Render</span> e <span class="primary-text">Oracle Cloud</span>: server, hosting;</li>
					<li style="margin: 6px 0"><span class="primary-text">Telegram</span>: invio dei messaggi, se colleghi il tuo account;</li>
					<li style="margin: 6px 0"><span class="primary-text">servizi push dei browser</span> (es. Google, Mozilla, Apple): consegna delle notifiche push;</li>
					<li style="margin: 6px 0"><span class="primary-text">Google</span>: accesso con Google, se lo usi, e la casella Gmail del progetto, dove arrivano le segnalazioni di <i>Segnala un problema</i>;</li>
					<li style="margin: 6px 0"><span class="primary-text">fermimn.edu.it</span>: verifica delle credenziali Moodle, se accedi con Moodle.</li>
				</ul>
				<p class="answer answer-staccato">
					L'impiego dell'intelligenza artificiale &egrave; limitato al supporto tecnico e allo sviluppo.
				</p>
			</div>
			<div class="question">
				<h3>4. Dati dei docenti</h3>
				<p class="answer">
					L'orario dei docenti viene dall'area riservata del sito della scuola e lo mostriamo solo a chi accede con Moodle con un account che la scuola abilita a vederlo. Per gli utenti pubblici suggeriamo come keyword solo i cognomi gi&agrave; scritti nel calendario Google delle variazioni.
				</p>
			</div>
			<div class="question">
				<h3>5. Cookie e dati salvati nel browser</h3>
				<p class="answer">
					Usiamo un cookie tecnico per tenerti connesso, valido fino a un anno, che il sito non pu&ograve; leggere da JavaScript. Nella memoria del browser (localStorage) salviamo:
				</p>
				<ul style="line-height: 1.5em;">
					<li style="margin: 6px 0">il token di accesso;</li>
					<li style="margin: 6px 0">la sessione Moodle cifrata, se accedi con Moodle;</li>
					<li style="margin: 6px 0">i dati della notifica push di quel dispositivo, se le attivi;</li>
					<li style="margin: 6px 0">le keywords e i filtri di Cerca eventi;</li>
					<li style="margin: 6px 0">alcune preferenze dell'interfaccia (es. avvisi chiusi).</li>
				</ul>
				<p class="answer answer-staccato">
					Puoi cancellare questi dati dalle impostazioni del browser; alcune funzioni potrebbero smettere di funzionare finch&eacute; non accedi di nuovo.
				</p>
			</div>
			<div class="question">
				<h3>6. Per quanto tempo conserviamo i dati</h3>
				<p class="answer">
					I dati dell'account restano finch&eacute; l'account esiste e vengono eliminati quando ne chiedi la cancellazione. La sessione Moodle (nel browser e nel tuo account) dura al massimo 13 giorni; il link <i>Collega Moodle</i> scade dopo 30 minuti.
				</p>
			</div>
			<div class="question">
				<h3>7. Come proteggiamo i dati</h3>
				<p class="answer">
					Le password sono salvate come hash (bcrypt), le comunicazioni passano su connessioni cifrate (HTTPS) e la sessione Moodle, nel browser e sul server, &egrave; cifrata (AES-256-GCM), cos&igrave; nessuno pu&ograve; leggerla o modificarla. I dati degli account sono in un database protetto di Microsoft Azure, in Italia (Italy North).
				</p>
			</div>
			<div class="question">
				<h3>8. I tuoi diritti</h3>
				<p class="answer">
					Puoi chiedere in qualsiasi momento di accedere ai tuoi dati, correggerli, riceverne una copia, opporti al loro uso o cancellare l'account, scrivendo a <a href="mailto:mail@fn.lkev.in" class="link">mail@fn.lkev.in</a>. Molte preferenze (keywords, canali, notifiche push) si cambiano direttamente nella <RouterLink to="/dashboard" class="link">Dashboard</RouterLink>. Hai anche il diritto di presentare reclamo al <a href="https://www.garanteprivacy.it" class="link">Garante per la protezione dei dati personali</a>.
				</p>
			</div>
			<div class="question">
				<h3>9. Modifiche a questa informativa</h3>
				<p class="answer">
					Se cambiamo il modo in cui trattiamo i dati aggiorniamo questa pagina. Ultimo aggiornamento: ottobre 2026.
				</p>
			</div>
			<div class="question">
				<h3 class="flex-y-center">
					10. Open Source&nbsp;<a class="flex-y-center" href="https://creativecommons.org/licenses/by-sa/4.0/"
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
					><FontAwesomeIcon icon="fa-brands fa-instagram" class="material-space-right" /> ferminotify</a
				>
				<RouterLink class="btn outlined flex-center" to="/orario/segnala"><span class="material-symbols-outlined material-space-right">report</span> Segnala</RouterLink>
			</div>
			<RouterLink to="/team" class="btn filled flex-center" style="margin-top: 10px;">Team</RouterLink>
		</div>
	</section>
</template>

<style scoped>
.faq-sections {
	width: 100%;
}
</style>

