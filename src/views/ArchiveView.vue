<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { faArrowUpRightFromSquare, faFilePdf, faHeart } from '@fortawesome/free-solid-svg-icons'
import Title from '@/components/common/Title.vue';

const STORAGE_KEY = 'archiveStyleMode'
const THEME_CLASSES = ['archive-theme-old', 'archive-theme-current']

function readSavedMode() {
	try {
		return localStorage.getItem(STORAGE_KEY)
	} catch {
		return null
	}
}

const styleMode = ref(readSavedMode() === 'current' ? 'current' : 'old')
const styleLabel = computed(() => (styleMode.value === 'old' ? 'Stile originale' : 'Stile attuale'))

function toggleStyleMode() {
	styleMode.value = styleMode.value === 'old' ? 'current' : 'old'
	try {
		localStorage.setItem(STORAGE_KEY, styleMode.value)
	} catch {
		return
	}
}

function applyPageTheme(mode) {
	for (const el of [document.documentElement, document.body]) {
		el.classList.remove(...THEME_CLASSES)
		if (mode) el.classList.add(`archive-theme-${mode}`)
	}
}

onMounted(() => applyPageTheme(styleMode.value))
watch(styleMode, applyPageTheme)
onBeforeUnmount(() => applyPageTheme(null))

function displayUrl(item) {
	if (item.url.startsWith('/')) return `${item.type}, ${item.url.split('/').pop()}`
	const { hostname, pathname } = new URL(item.url)
	const host = hostname.replace(/^www\./, '')
	const segments = pathname.split('/').filter(Boolean)
	if (segments.length === 0) return host
	if (segments.length > 2) return `${host}/${segments[0]}`
	return `${host}/${segments.join('/')}`
}

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
				type: 'REPO',
			},
			{
				name: 'Notifier',
				url: 'https://github.com/ferminotify/notifier',
				type: 'REPO',
			},
			{
				name: 'Tutto di Fermi Notify',
				url: 'https://github.com/ferminotify',
				type: 'GITHUB',
			},
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
				type: 'WEBAPP',
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
			},
		],
	},
]
</script>

<template>
	<section class="archive-page" :class="`mode-${styleMode}`">
		<header class="archive-head">
			<Title title="Archivio Fermi Notify" subtitle="Una raccolta di risorse prodotte da Fermi Notify" :showVideo="'archive'" />
			<button
				class="style-switch"
				type="button"
				:aria-pressed="styleMode === 'current'"
				@click="toggleStyleMode"
			>
				{{ styleLabel }}
			</button>
		</header>

		<div class="archive-index">
			<section
				v-for="(section, i) in archiveSections"
				:key="section.title"
				class="archive-group"
				:style="{ '--i': i }"
			>
				<div class="group-head">
					<h2>
						{{ section.title }}
						<span v-if="section.year" class="group-year">{{ section.year }}</span>
					</h2>
					<p>{{ section.description }}</p>
				</div>

				<ul class="links-list">
					<li v-for="item in section.items" :key="item.url">
						<a :href="item.url" target="_blank" rel="noopener noreferrer" class="archive-link">
							<span class="link-body">
								<strong>{{ item.name }}</strong>
								<small>{{ displayUrl(item) }}</small>
							</span>
							<font-awesome-icon
								class="link-icon"
								:icon="item.type === 'PDF' ? faFilePdf : faArrowUpRightFromSquare"
								aria-hidden="true"
							/>
						</a>
					</li>
				</ul>
			</section>
		</div>

		<footer class="archive-foot">
			<p>
				Grazie per aver utilizzato Fermi Notify!
				<font-awesome-icon class="foot-heart" :icon="faHeart" aria-hidden="true" />
			</p>
			<RouterLink to="/team" class="team-cta">Scopri il team</RouterLink>
		</footer>
	</section>
</template>

<style scoped>
.archive-page {
	--archive-radius: 10px;
	min-height: calc(100dvh - 180px);
	padding: 2.5rem 1rem 3rem;
	color: var(--archive-text);
}

/* Original 2023 palette */
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
	--archive-accent: #ff9800;
	--archive-text: #ffffff;
	--archive-text-muted: #cfcfcf;
	--archive-line: #ffffff;
	--archive-fill: #ff9800;
	--archive-fill-hover: #e56900;
	--archive-on-fill: #101010;
}

.archive-page.mode-current {
	--archive-accent: var(--on-surface-primary, #c2e7ff);
	--archive-text: var(--on-surface, #e3e3e3);
	--archive-text-muted: var(--on-surface-variant, #c4c7c5);
	--archive-line: var(--on-surface-variant, #c4c7c5);
	--archive-fill: var(--primary, #004a77);
	--archive-fill-hover: var(--primary-hover, #125680);
	--archive-on-fill: var(--on-primary, #c2e7ff);
}

.archive-head,
.archive-index,
.archive-foot {
	max-width: 980px;
	margin: 0 auto;
}

.archive-head {
	display: grid;
	justify-items: end;
	gap: 0.75rem;
	margin-bottom: 3rem;
}

.style-switch {
	font-family: 'Source Code Pro', monospace;
	font-size: 0.85rem;
	color: var(--archive-accent);
	background: transparent;
	border: none;
	padding: 0.5rem 0.25rem;
	cursor: pointer;
}

.style-switch:hover {
	text-decoration: underline;
}

.style-switch:focus-visible,
.archive-link:focus-visible,
.team-cta:focus-visible {
	outline: 2px solid var(--archive-accent);
	outline-offset: 3px;
}

.archive-index {
	display: grid;
	gap: 3rem;
}

.group-head {
	border-left: 1px solid var(--archive-line);
	padding-left: 1rem;
	margin-bottom: 1.25rem;
}

.group-head h2 {
	margin: 0 0 0.35rem;
	font-size: 1.5rem;
	font-weight: 800;
	display: flex;
	align-items: center;
	gap: 0.6rem;
}

.group-year {
	background-color: #ffffff;
	color: #101010;
	padding: 4px 9px;
	font-size: 0.75rem;
	font-weight: 700;
	border-radius: 10px;
}

.group-head p {
	margin: 0;
	font-size: 0.95rem;
	line-height: 1.5;
	color: var(--archive-text-muted);
}

.links-list {
	margin: 0;
	padding: 0;
	list-style: none;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	gap: 12px;
}

.archive-link {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	height: 100%;
	box-sizing: border-box;
	padding: 14px 16px;
	border: 1px solid var(--archive-line);
	border-radius: var(--archive-radius);
	color: inherit;
	transition: background-color 0.2s var(--m3-standard), border-color 0.2s var(--m3-standard), color 0.2s var(--m3-standard);
}

.archive-link:hover {
	background-color: var(--archive-fill);
	border-color: var(--archive-fill);
	color: var(--archive-on-fill);
}

.archive-link:active {
	transform: scale(0.98);
}

.link-body {
	min-width: 0;
}

.link-body strong {
	display: block;
	font-weight: 600;
	font-size: 1rem;
	line-height: 1.25;
}

.link-body small {
	display: block;
	margin-top: 0.3rem;
	font-family: 'Source Code Pro', monospace;
	font-size: 0.75rem;
	opacity: 0.75;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.link-icon {
	flex-shrink: 0;
	font-size: 0.85rem;
	color: var(--archive-accent);
	transition: transform 0.2s var(--m3-standard);
}

.archive-link:hover .link-icon {
	color: inherit;
	transform: translate(2px, -2px);
}

.archive-foot {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
	margin-top: 4rem;
	text-align: center;
}

.archive-foot p {
	margin: 0;
	font-size: 1.15rem;
	font-weight: 700;
}

.foot-heart {
	margin-left: 0.35rem;
	color: var(--archive-accent);
}

.team-cta {
	font-size: 1.1rem;
	font-weight: 600;
	padding: 13px 25px;
	border-radius: 48px;
	background-color: var(--archive-fill);
	color: var(--archive-on-fill);
	transition: background-color 0.2s var(--m3-standard);
}

.team-cta:hover {
	background-color: var(--archive-fill-hover);
	color: var(--archive-on-fill);
}

.team-cta:active {
	transform: scale(0.98);
}

@media (prefers-reduced-motion: no-preference) {
	.archive-group {
		animation: groupReveal 0.6s var(--m3-emph-decel) both;
		animation-delay: calc(var(--i) * 60ms);
	}
}

@media (max-width: 560px) {
	.archive-page {
		padding: 2rem 1rem 2.5rem;
	}

	.links-list {
		grid-template-columns: 1fr;
	}
}

@keyframes groupReveal {
	from {
		opacity: 0;
		transform: translateY(12px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
