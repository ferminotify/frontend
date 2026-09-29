<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useBubbleDrag } from '@/composables/useBubbleDrag';
import '@/assets/css/bubbles.css';

const roleIcons = {
    'Project Management': 'event_note',
    'Code': 'code',
    'Design': 'palette',
    'Hosting': 'dns',
    'Code Review': 'rate_review',
    'Business': 'work',
    'Testing': 'bug_report',
    'Side quests': 'explore'
};

const coreTeam = [
    {
        name: 'Liu Kevin',
        roles: ['Project Management', 'Code', 'Design', 'Hosting'],
        instagram: 'https://instagram.com/kev1nl1u',
        github: 'https://github.com/kev1nl1u'
    },
    {
        name: 'Sirico Davide',
        roles: ['Code', 'Hosting'],
        instagram: 'https://www.instagram.com/davidesirico05/',
        github: 'https://github.com/DavideSirico'
    }
];

const createdByTeam = [
    {
        name: 'Bini Matteo',
        roles: ['Project Management', 'Code', 'Code Review'],
        instagram: 'https://www.instagram.com/matteobini_/',
        github: 'https://github.com/MatteoBini'
    },
    {
        name: 'Liu Kevin',
        roles: ['Code', 'Design'],
        instagram: 'https://instagram.com/kev1nl1u',
        github: 'https://github.com/kev1nl1u'
    },
    {
        name: 'Sirico Davide',
        roles: ['Code'],
        instagram: 'https://www.instagram.com/davidesirico05/',
        github: 'https://github.com/DavideSirico'
    },
    {
        name: 'Casari Simone',
        roles: ['Business', 'Design'],
        instagram: 'https://www.instagram.com/simonecasari_/',
        github: 'https://github.com/SimoneCasari'
    },
    {
        name: 'Tardiani Simone',
        roles: ['Code'],
        instagram: 'https://www.instagram.com/simone_tardiani/',
        github: 'https://github.com/Captniz'
    },
    {
        name: 'Rastelli Francesco',
        roles: ['Testing'],
        instagram: 'https://www.instagram.com/francescoo_rastellii/',
        github: 'https://github.com/franchecco'
    }
];

const externalCollaborators = [
    {
        name: 'Malinverno Tommaso',
        roles: ['Code'],
        instagram: 'https://www.instagram.com/tommaso_malinverno/',
        github: 'https://github.com/lampaDario1543'
    },
    {
        name: 'Tellaroli Alberto',
        roles: ['Side quests'],
        instagram: 'https://www.instagram.com/albertotellarolii/',
        github: 'https://github.com/zAnimus'
    }
];

const extraCredits = [
    { name: 'OpenAI ChatGPT', link: 'https://chat.openai.com/' },
    { name: 'Anthropic Claude', link: 'https://www.anthropic.com/claude' },
    { name: 'Google Gemini', link: 'https://gemini.google.com/' }
];

const sections = [
    { key: 'core', title: 'Core', description: 'Sviluppatori e mantenitori attuali', members: coreTeam, layout: 'core' },
    { key: 'createdBy', title: 'Creato da', description: "Chi c'era al giorno 1 e il loro ruolo precedente", members: createdByTeam, layout: 'grid', inactive: true },
    { key: 'external', title: 'Collaboratori esterni', description: null, members: externalCollaborators, layout: 'pair', inactive: true }
];

const lists = {
    core: ref([]),
    createdBy: ref([]),
    external: ref([])
};
const bubbleRefs = ref({});
const containerRef = ref(null);
const showExtra = ref(false);

const {
    getRandomOffset,
    getRandomRotation,
    handleMouseMove,
    startDrag,
    setupDragListeners
} = useBubbleDrag(containerRef, bubbleRefs);

const githubAvatar = (url) => {
    const user = url?.replace(/\/+$/, '').split('/').pop();
    return user ? `https://github.com/${user}.png?size=160` : null;
};

const initials = (name) => name.split(' ').map((part) => part[0]).join('').slice(0, 2);

const processMember = (member, index, total) => ({
    ...member,
    avatar: member.github ? githubAvatar(member.github) : null,
    offsetX: getRandomOffset(16),
    offsetY: getRandomOffset(12),
    rotation: getRandomRotation(4),
    delay: index * 0.06,
    zIndex: total - index,
    dragX: 0,
    dragY: 0
});

const getList = (section) => lists[section];

const onStartDrag = (event, index, section) => {
    startDrag(event, index, getList(section), section);
};

const bubbleStyle = (member) => ({
    '--offset-x': member.offsetX + 'px',
    '--offset-y': member.offsetY + 'px',
    '--rotation': member.rotation + 'deg',
    '--animation-delay': member.delay + 's',
    '--z-index': member.zIndex,
    '--drag-x': member.dragX + 'px',
    '--drag-y': member.dragY + 'px'
});

let cleanupListeners = null;

onMounted(() => {
    for (const section of sections) {
        lists[section.key].value = section.members.map((m, i) => processMember(m, i, section.members.length));
    }

    cleanupListeners = setupDragListeners(getList);
});

onUnmounted(() => {
    if (cleanupListeners) cleanupListeners();
});
</script>

<template>
<div class="team-container" ref="containerRef">
    <section v-for="section in sections" :key="section.key" class="team-section">
        <header class="section-head">
            <h2 class="section-subtitle">{{ section.title }}</h2>
            <p v-if="section.description" class="section-description">{{ section.description }}</p>
        </header>

        <div :class="['bubbles-grid', `bubbles-grid-${section.layout}`]">
            <div
                v-for="(member, index) in lists[section.key].value"
                :key="member.name"
                class="bubble-wrapper"
            >
                <div
                    :ref="el => bubbleRefs[`${section.key}-${index}`] = el"
                    :class="['bubble', { 'bubble-inactive': section.inactive, 'bubble-core': section.layout === 'core' }]"
                    :style="bubbleStyle(member)"
                    @mousemove="handleMouseMove($event, index, section.key)"
                    @mousedown="onStartDrag($event, index, section.key)"
                    @touchstart="onStartDrag($event, index, section.key)"
                >
                    <div class="bubble-glow"></div>
                    <div class="bubble-content member">
                        <img
                            v-if="member.avatar"
                            class="avatar"
                            :src="member.avatar"
                            alt=""
                            width="80"
                            height="80"
                            loading="lazy"
                            draggable="false"
                        />
                        <span v-else class="avatar avatar-fallback" aria-hidden="true">{{ initials(member.name) }}</span>
                        <div class="member-body">
                            <h3 class="name">{{ member.name }}</h3>
                            <ul class="roles">
                                <li v-for="role in member.roles" :key="role" class="role">
                                    <span class="material-symbols-outlined" aria-hidden="true">{{ roleIcons[role] }}</span>
                                    {{ role }}
                                </li>
                            </ul>
                            <div class="social-links">
                                <a v-if="member.instagram" class="social-link" :href="member.instagram" target="_blank" rel="noopener noreferrer" :aria-label="`Instagram di ${member.name}`">
                                    <font-awesome-icon :icon="['fab', 'instagram']" />
                                </a>
                                <a v-if="member.github" class="social-link" :href="member.github" target="_blank" rel="noopener noreferrer" :aria-label="`GitHub di ${member.name}`">
                                    <font-awesome-icon :icon="['fab', 'github']" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <div class="team-actions">
        <router-link to="/supporters" class="btn outlined btn-icon">
            <span class="material-symbols-outlined" aria-hidden="true">local_cafe</span>
            I nostri sostenitori
        </router-link>
        <button
            type="button"
            :class="['btn', 'btn-icon', showExtra ? 'filled' : 'text']"
            :aria-expanded="showExtra"
            aria-controls="team-extra"
            @click="showExtra = !showExtra"
        >
            <span class="material-symbols-outlined extra-chevron" :class="{ open: showExtra }" aria-hidden="true">expand_more</span>
            {{ showExtra ? 'Nascondi' : 'Altro' }}
        </button>
    </div>

    <transition name="slide">
        <p v-if="showExtra" id="team-extra" class="extra-line">
            Hanno scritto codice anche
            <template v-for="(credit, index) in extraCredits" :key="credit.name">
                <a class="link" :href="credit.link" target="_blank" rel="noopener noreferrer">{{ credit.name }}</a>{{ index < extraCredits.length - 2 ? ', ' : index === extraCredits.length - 2 ? ' e ' : '.' }}
            </template>
        </p>
    </transition>
</div>
</template>

<style scoped>
.team-container {
    padding: 8px 20px 60px;
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
}

.team-section {
    margin-top: 56px;
}

.team-section:first-child {
    margin-top: 32px;
}

.section-head {
    margin-bottom: 20px;
    text-align: center;
}

.section-subtitle {
    margin: 0;
    font-size: 1.6rem;
    letter-spacing: -0.01em;
    color: var(--on-surface);
}

.section-description {
    margin: 6px auto 0;
    max-width: 60ch;
    color: var(--on-surface-variant);
    line-height: 1.5;
}

.bubbles-grid {
    display: grid;
    gap: 18px;
}

.bubbles-grid-core {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
}

.bubbles-grid-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

/* Same card width as the 3-col grid above, without an empty third cell */
.bubbles-grid-pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: calc((100% - 36px) / 3 * 2 + 18px);
    margin-inline: auto;
}

/* Member card */
.bubble {
    container-type: inline-size;
}

/* Current team in blue, former members fall back to the grey of .bubble-inactive */
.bubble:not(.bubble-inactive) {
    --accent-rgb: 138, 180, 248;
}

.member {
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
}

/* Narrow cards: avatar on top so role chips get the full width */
@container (max-width: 240px) {
    .member {
        flex-direction: column;
        gap: 12px;
    }
}

.member-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
}

.avatar {
    flex: none;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
    background: var(--surface-variant);
    border: 2px solid rgb(var(--accent-rgb));
}

.avatar-fallback {
    display: grid;
    place-items: center;
    font-weight: 700;
    color: rgb(var(--accent-rgb));
    background: rgba(var(--accent-rgb), 0.15);
}

.bubble-core {
    padding: 28px;
}

.bubble-core .avatar {
    width: 80px;
    height: 80px;
}

.bubble-core .name {
    font-size: 1.45rem;
}

.bubble-inactive .avatar {
    filter: grayscale(0.6);
    border-width: 1px;
}

.roles {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.role {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px 3px 7px;
    border-radius: 999px;
    font-size: 0.8rem;
    line-height: 1.4;
    color: rgb(var(--accent-rgb));
    background: rgba(var(--accent-rgb), 0.12);
    border: 1px solid rgba(var(--accent-rgb), 0.25);
}

.role .material-symbols-outlined {
    font-size: 16px;
}

.social-links {
    display: flex;
    gap: 14px;
    position: relative;
    z-index: 10;
}

.social-link {
    display: inline-flex;
    align-items: center;
    font-size: 1.2rem;
    text-decoration: none;
    transition: color 0.2s ease, transform 0.2s ease;
}

.social-link:hover {
    transform: translateY(-1px);
}

/* Actions */
.team-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 56px;
}

.btn-icon {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    transition: background-color 220ms ease, color 220ms ease, transform 160ms ease;
}

.btn-icon .material-symbols-outlined {
    font-size: 20px;
}

.btn-icon:active {
    transform: scale(0.98);
}

.extra-chevron {
    transition: transform 0.25s ease;
}

.extra-chevron.open {
    transform: rotate(180deg);
}

.extra-line {
    margin: 20px auto 0;
    max-width: 60ch;
    text-align: center;
    line-height: 1.6;
    color: var(--on-surface-variant);
    font-size: 0.85rem;
}

.extra-line a {
    white-space: nowrap;
    text-decoration: underline;
    text-underline-offset: 3px;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
    transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

@media (prefers-reduced-motion: reduce) {
    .slide-enter-active,
    .slide-leave-active,
    .extra-chevron {
        transition: none;
    }
}

/* Responsive */
@media (max-width: 900px) {
    .bubbles-grid-grid,
    .bubbles-grid-pair {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .bubbles-grid-pair {
        max-width: none;
    }
}

@media (max-width: 768px) {
    .bubbles-grid-core {
        grid-template-columns: minmax(0, 1fr);
    }

    .bubble-core {
        padding: 22px;
    }

    .bubble-core .avatar {
        width: 64px;
        height: 64px;
    }
}

@media (max-width: 600px) {
    .team-container {
        padding: 0 16px 40px;
    }

    .bubbles-grid-grid,
    .bubbles-grid-pair {
        grid-template-columns: minmax(0, 1fr);
    }

    .section-subtitle {
        font-size: 1.35rem;
    }
}
</style>
