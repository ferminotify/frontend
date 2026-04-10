<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const STORAGE_KEY = 'archiveStyleMode'

const savedMode = localStorage.getItem(STORAGE_KEY)
const styleMode = ref(savedMode === 'current' ? 'current' : 'old')

const styleLabel = computed(() => `> stile: ${styleMode.value}`)
const heartEmoji = computed(() => (styleMode.value === 'old' ? '💛' : '💙'))

function toggleStyleMode() {
	styleMode.value = styleMode.value === 'old' ? 'current' : 'old'
	localStorage.setItem(STORAGE_KEY, styleMode.value)
}

function applyPageTheme(mode) {
	const html = document.documentElement
	const body = document.body
	html.classList.remove('archive-theme-old', 'archive-theme-current')
	body.classList.remove('archive-theme-old', 'archive-theme-current')
	html.classList.add(`archive-theme-${mode}`)
	body.classList.add(`archive-theme-${mode}`)
}

onMounted(() => {
	applyPageTheme(styleMode.value)
})

watch(styleMode, (mode) => {
	applyPageTheme(mode)
})

onBeforeUnmount(() => {
	const html = document.documentElement
	const body = document.body
	html.classList.remove('archive-theme-old', 'archive-theme-current')
	body.classList.remove('archive-theme-old', 'archive-theme-current')
})

const archiveSections = [
	{
		title: 'Poster',
		description: 'Poster promozionali diffusi al Fermi #MadeByHumans',
        year: '2023',
		items: [
			{
				name: 'Poster informativi',
				url: '/archive/posters/5 copie.pdf',
				type: 'PDF',
			},
			{
				name: 'Poster promozionali',
				url: '/archive/posters/3 copie.pdf',
				type: 'PDF',
			},
		],
	},
	{
		title: 'Codice Sorgente',
		description: 'Link a repository e progetti correlati',
		items: [
			{
				name: 'Frontend attuale',
				url: 'https://github.com/ferminotify/frontend',
				type: 'REPO',
			},
			{
				name: 'Backend attuale',
				url: 'https://github.com/ferminotify/backend',
				type: 'REPO',
			},
			{
				name: 'Webapp v2',
				url: 'https://github.com/ferminotify/webapp',
				type: 'REPO',
			},
            {
                name: 'Webapp v1',
                url: 'https://github.com/ferminotify/old.webapp',
                type: 'REPO'
            },
            {
                name: 'Notifier',
                url: 'https://github.com/ferminotify/notifier',
                type: 'REPO'
            },
            {
                name: 'Tutto di Fermi Notify',
                url: 'https://github.com/ferminotify',
                type: 'GITHUB',
            }
		],
	},
	{
		title: 'Risorse online',
		description: 'Digital footprint di Fermi Notify',
		items: [
			{
				name: 'Articolo MyFermi',
				url: 'https://myfermi.fermimn.edu.it/voci-di-corridoio/fermi-notify/',
				type: 'ARTICLE',
			},
			{
				name: 'App attuale',
				url: 'https://fn.lkev.in',
				type: 'PWA',
			},
			{
				name: 'Webapp v2',
				url: 'https://node.fn.lkev.in',
				type: 'WEBAPP',
			},
            {
                name: 'Webapp v1',
                url: 'https://old.fn.lkev.in',
                type: 'WEBAPP'
            },
            {
                name: 'Status',
                url: 'https://status.fn.lkev.in',
                type: 'WEBAPP',
            },
			{
				name: 'Sorgente calendario',
				url: 'https://docs.google.com/spreadsheets/d/1ADaUVRQeYU078-suUxGk0u1aMj_GbcjsAzG11YlMp5g/export?format=csv&id=1ADaUVRQeYU078-suUxGk0u1aMj_GbcjsAzG11YlMp5g&gid=0',
				type: 'CSV',
			},
		],
	},
    {
        title: 'Social',
        description: 'Profili social di Fermi Notify',
        items: [
            {
                name: 'Instagram',
                url: 'https://www.instagram.com/ferminotify/',
                type: 'IG',
            }
        ],
    }
]
</script>

<template>
	<section class="archive-page" :class="`mode-${styleMode}`">
		<header class="hero">
			<button class="hero-kicker hero-switch" type="button" @click="toggleStyleMode">
				{{ styleLabel }}
			</button>
			<h1>
				Archivio
				<span>Fermi Notify</span>
			</h1>
			<p class="hero-copy">
				Una raccolta di risorse prodotte da Fermi Notify
			</p>
		</header>

		<div class="archive-grid">
			<article v-for="section in archiveSections" :key="section.title" class="archive-card">
				<div class="card-head">
					<p class="card-kicker">sezione {{ archiveSections.indexOf(section) + 1 }}</p>
					<h2>{{ section.title }}</h2>
					<p>{{ section.description }} <span v-if="section.year" class="pill">{{ section.year }}</span></p>
				</div>

				<ul class="links-list">
					<li v-for="item in section.items" :key="item.url">
						<a :href="item.url" target="_blank" rel="noopener noreferrer" class="archive-link">
							<span class="link-arrow">&gt;</span>
							<span class="link-body">
								<strong>{{ item.name }}</strong>
								<small>{{ item.url }}</small>
							</span>
							<span class="link-badge">{{ item.type }}</span>
						</a>
					</li>
				</ul>
			</article>
		</div>

        <div style="text-align: center; margin: 60px 0 30px; font-family: 'Montserrat', sans-serif; color: var(--archive-text-muted);">
			<h3>Grazie per aver utilizzato Fermi Notify! {{ heartEmoji }}</h3>
        </div>

        <div style="text-align: center; margin: 30px 0 60px;">
            <RouterLink to="/team" class="btn outlined">Scopri il team 🌐</RouterLink>
        </div>
	</section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Source+Code+Pro:wght@500;700&display=swap');

.archive-page {
	--archive-main-bg-color: #101010;
	--archive-surface: #181818;
	--archive-surface-hover: #202020;
	--archive-primary-color: #ff9800;
	--archive-text: #ffffff;
	--archive-text-muted: #cfcfcf;
	--archive-border: #cfcfcf;
	--card-radius: 16px;
	--link-radius: 10px;
	--hero-font: 'Montserrat', sans-serif;
	--hero-font-weight: 800;
	position: relative;
	min-height: calc(100dvh - 180px);
	padding: 2.5rem 1rem 3rem;
	color: var(--archive-text);
	background-color: transparent;
}

:global(html.archive-theme-old),
:global(body.archive-theme-old) {
	background-color: #101010;
	--surface: #101010;
	--surface-variant: #181818;
	--surface-variant-hover-bg: linear-gradient(0deg, rgba(255, 152, 0, 0.1), rgba(255, 152, 0, 0.1));
	--on-surface: #ffffff;
	--on-surface-variant: #cfcfcf;
	--on-surface-primary: #ff9800;
	--divider: #2a2a2a;
	--primary: #ff9800;
	--primary-hover: #f57c00;
	--primary-text-hover: #ffb74d;
	--on-primary: #101010;
}

:global(html.archive-theme-current),
:global(body.archive-theme-current) {
	background-color: var(--surface, #141314);
	--surface: #141314;
	--on-surface: #e3e3e3;
	--on-surface-primary: #c2e7ff;
	--divider: rgb(94, 98, 101);
	--primary: #004a77;
	--on-primary: #c2e7ff;
	--primary-hover: #125680;
	--primary-text-hover: #71bdec;
	--surface-variant: #211f21;
	--surface-variant-hover-bg: linear-gradient(0deg, rgba(196, 199, 197, 0.08), rgba(196, 199, 197, 0.08));
	--on-surface-variant: #c4c7c5;
}

.archive-page.mode-old {
	--archive-main-bg-color: #101010;
	--archive-surface: #181818;
	--archive-surface-hover: #202020;
	--archive-primary-color: #ff9800;
	--archive-text: #ffffff;
	--archive-text-muted: #cfcfcf;
	--archive-border: #505050;
	--card-radius: 16px;
	--link-radius: 10px;
	--hero-font: 'Montserrat', sans-serif;
	--hero-font-weight: 800;
}

.archive-page.mode-current {
	--archive-main-bg-color: var(--surface);
	--archive-surface: var(--surface-variant);
	--archive-surface-hover: var(--surface-variant-hover-bg, #211f21);
	--archive-primary-color: var(--on-surface-primary, #004a77);
	--archive-text: var(--on-surface, #e3e3e3);
	--archive-text-muted: var(--on-surface-variant, #c4c7c5);
	--archive-border: var(--divider, rgb(94, 98, 101));
	--card-radius: 18px;
	--link-radius: 12px;
	--hero-font: 'Montserrat', sans-serif;
	--hero-font-weight: 700;
}

.hero,
.archive-grid {
	max-width: 1120px;
	margin: 0 auto;
}

.hero {
	text-align: center;
	margin-bottom: 2rem;
	animation: fadeInUp 0.8s ease both;
}

.hero-kicker {
	font-family: 'Source Code Pro', monospace;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	font-size: 0.9rem;
	margin: 0;
	color: var(--archive-primary-color);
}

.hero-switch {
	background: transparent;
	border: 1px solid rgba(127, 127, 127, 0.35);
	border-radius: 999px;
	padding: 0.45rem 0.8rem;
	cursor: pointer;
	transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.hero-switch:hover {
	border-color: var(--archive-primary-color);
	background: color-mix(in srgb, var(--archive-primary-color) 10%, transparent);
}

.hero-switch:focus-visible {
	outline: 2px solid var(--archive-primary-color);
	outline-offset: 3px;
}

.hero h1 {
	font-family: var(--hero-font);
	font-weight: var(--hero-font-weight);
	font-size: clamp(2rem, 7vw, 4rem);
	line-height: 1.05;
	margin: 0.8rem 0;
}

.hero h1 span {
	color: var(--archive-primary-color);
}

.hero-copy {
	max-width: 760px;
	margin: 0 auto;
	font-family: 'Montserrat', sans-serif;
	font-size: 0.95rem;
	line-height: 1.6;
	color: var(--archive-text-muted);
}

.archive-grid {
	display: grid;
	gap: 1rem;
	grid-template-columns: 1fr;
}

.archive-card {
	grid-column: span 1;
	background: var(--archive-surface);
	border: 2px solid var(--archive-border);
	border-radius: var(--card-radius);
	padding: 1rem;
	box-shadow: 0 0 0 rgba(0, 0, 0, 0);
	transform: translateY(0);
	transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
	animation: cardReveal 0.75s ease both;
	will-change: transform;
}

.archive-card:nth-child(2) {
	animation-delay: 0.08s;
}

.archive-card:nth-child(3) {
	animation-delay: 0.16s;
}

.archive-card:nth-child(4) {
	animation-delay: 0.24s;
}

.archive-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 14px 32px rgba(0, 0, 0, 0.22);
	border-color: var(--archive-primary-color);
}

.card-head {
	border-bottom: 1px dashed color-mix(in srgb, var(--archive-border) 85%, transparent);
	padding-bottom: 0.9rem;
	margin-bottom: 0.8rem;
}

.card-kicker {
	margin: 0;
	font-family: 'Source Code Pro', monospace;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	font-size: 0.68rem;
	color: var(--archive-primary-color);
}

.card-head h2 {
	margin: 0.35rem 0;
	font-size: 1.25rem;
	font-family: 'Montserrat', sans-serif;
	font-weight: 700;
}

.card-head p {
	margin: 0;
	font-family: 'Montserrat', sans-serif;
	font-size: 0.9rem;
	line-height: 1.45;
	color: var(--archive-text-muted);
}

.pill {
	margin-left: 0.5rem;
	padding: 0.15rem 0.5rem;
	font-size: 0.8rem;
	line-height: 1;
	color: var(--archive-primary-color);
	border: 1px solid var(--archive-primary-color);
	border-radius: 999px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	vertical-align: middle;
}

.links-list {
	margin: 0;
	padding: 0;
	list-style: none;
	display: grid;
	gap: 0.65rem;
}

.archive-link {
	display: grid;
	grid-template-columns: auto 1fr auto;
	gap: 0.7rem;
	text-decoration: none;
	color: inherit;
	background: color-mix(in srgb, var(--archive-surface) 72%, var(--archive-main-bg-color));
	border: 1px solid color-mix(in srgb, var(--archive-border) 90%, transparent);
	border-radius: var(--link-radius);
	padding: 0.65rem;
	transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.archive-link:hover {
	transform: translateY(-1px);
	background: var(--archive-surface-hover);
	border-color: var(--archive-primary-color);
}

.link-arrow {
	font-family: 'Source Code Pro', monospace;
	font-size: 1.1rem;
	color: var(--archive-primary-color);
	line-height: 1;
	margin-top: 0.1rem;
}

.link-body {
	min-width: 0;
}

.link-body strong {
	display: block;
	font-family: 'Montserrat', sans-serif;
	font-weight: 600;
	font-size: 1rem;
	line-height: 1.15;
}

.link-body small {
	display: block;
	margin-top: 0.35rem;
	font-family: 'Source Code Pro', monospace;
	font-size: 0.72rem;
	color: var(--archive-text-muted);
	overflow-wrap: anywhere;
}

.link-badge {
	align-self: start;
	font-family: 'Source Code Pro', monospace;
	font-size: 0.7rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--archive-main-bg-color);
	background: var(--archive-primary-color);
	border-radius: 999px;
	padding: 0.25rem 0.5rem;
}



@media (max-width: 1000px) {
	.archive-card {
		grid-column: span 1;
	}
}

@media (max-width: 720px) {
	.archive-page {
		padding: 2rem 0.8rem 2.5rem;
	}

	.archive-card {
		grid-column: span 1;
	}

	.hero-copy {
		font-size: 0.88rem;
	}
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(14px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes cardReveal {
	from {
		opacity: 0;
		transform: translateY(18px) scale(0.98);
	}

	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}
</style>
