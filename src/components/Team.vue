<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useBubbleDrag } from '@/composables/useBubbleDrag';
import '@/assets/css/bubbles.css';

const coreTeam = ref([
    {
        name: 'Liu Kevin',
        roles: ['📆 Project Management', '💻 Code', '🎨 Design', '🚇 Hosting'],
        instagram: 'https://instagram.com/kev1nl1u',
        github: 'https://github.com/kev1nl1u'
    },
    {
        name: 'Sirico Davide',
        roles: ['💻 Code', '🚇 Hosting'],
        instagram: 'https://www.instagram.com/davidesirico05/',
        github: 'https://github.com/DavideSirico'
    }
]);

const createdByTeam = ref([
    {
        name: 'Bini Matteo',
        roles: ['📆 Project Management', '💻 Code', '👀 Code Review'],
        instagram: 'https://www.instagram.com/matteobini_/',
        github: 'https://github.com/MatteoBini'
    },
    {
        name: 'Liu Kevin',
        roles: ['💻 Code', '🎨 Design'],
        instagram: 'https://instagram.com/kev1nl1u',
        github: 'https://github.com/kev1nl1u'
    },
    {
        name: 'Sirico Davide',
        roles: ['💻 Code'],
        instagram: 'https://www.instagram.com/davidesirico05/',
        github: 'https://github.com/DavideSirico'
    },
    {
        name: 'Casari Simone',
        roles: ['💼 Business', '🎨 Design'],
        instagram: 'https://www.instagram.com/simonecasari_/',
        github: 'https://github.com/SimoneCasari'
    },
    {
        name: 'Tardiani Simone',
        roles: ['💻 Code'],
        instagram: 'https://www.instagram.com/simone_tardiani/',
        github: 'https://github.com/Captniz'
    },
    {
        name: 'Rastelli Francesco',
        roles: ['⚠️ Testing'],
        instagram: 'https://www.instagram.com/francescoo_rastellii/',
        github: 'https://github.com/franchecco'
    }
]);

const externalCollaborators = ref([
    {
        name: 'Malinverno Tommaso',
        roles: ['💻 Code'],
        instagram: 'https://www.instagram.com/tommaso_malinverno/',
        github: 'https://github.com/lampaDario1543'
    },
    {
        name: 'Tellaroli Alberto',
        roles: ['🔃 Side quests'],
        instagram: 'https://www.instagram.com/albertotellarolii/',
        github: 'https://github.com/zAnimus'
    }
]);

const extraCredits = ref([
    {
        name: 'OpenAI ChatGPT',
        roles: ['💻 Code'],
        link: 'https://chat.openai.com/'
    },
    {
        name: 'Anthropic Claude',
        roles: ['💻 Code'],
        link: 'https://www.anthropic.com/claude'
    },
    {
        name: 'Google Gemini',
        roles: ['💻 Code'],
        link: 'https://gemini.google.com/'
    }
]);

const processedCore = ref([]);
const processedCreatedBy = ref([]);
const processedExternal = ref([]);
const processedExtra = ref([]);
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

const processMember = (member, index, total) => ({
    ...member,
    offsetX: getRandomOffset(30),
    offsetY: getRandomOffset(30),
    rotation: getRandomRotation(6),
    delay: index * 0.08,
    zIndex: total - index,
    dragX: 0,
    dragY: 0
});

const getList = (section) => {
    if (section === 'core') return processedCore;
    if (section === 'createdBy') return processedCreatedBy;
    if (section === 'external') return processedExternal;
    return processedExtra;
};

const onStartDrag = (event, index, section) => {
    startDrag(event, index, getList(section), section);
};

let cleanupListeners = null;

onMounted(() => {
    processedCore.value = coreTeam.value.map((m, i) => processMember(m, i, coreTeam.value.length));
    processedCreatedBy.value = createdByTeam.value.map((m, i) => processMember(m, i, createdByTeam.value.length));
    processedExternal.value = externalCollaborators.value.map((m, i) => processMember(m, i, externalCollaborators.value.length));
    processedExtra.value = extraCredits.value.map((m, i) => processMember(m, i, extraCredits.value.length));
    
    cleanupListeners = setupDragListeners(getList);
});

onUnmounted(() => {
    if (cleanupListeners) cleanupListeners();
});
</script>

<template>
<div class="team-container" ref="containerRef">
    <!-- Core Team -->
    <h2 class="section-subtitle">Core</h2>
    <p class="section-description">Sviluppatori e mantenitori attuali</p>
    <div class="bubbles-grid">
        <div 
            v-for="(member, index) in processedCore" 
            :key="member.name"
            class="bubble-wrapper"
        >
            <div 
                :ref="el => bubbleRefs[`core-${index}`] = el"
                class="bubble"
                :style="{
                    '--offset-x': member.offsetX + '%',
                    '--offset-y': member.offsetY + '%',
                    '--rotation': member.rotation + 'deg',
                    '--animation-delay': member.delay + 's',
                    '--z-index': member.zIndex,
                    '--drag-x': member.dragX + 'px',
                    '--drag-y': member.dragY + 'px'
                }"
                @mousemove="handleMouseMove($event, index, 'core')"
                @mousedown="onStartDrag($event, index, 'core')"
                @touchstart="onStartDrag($event, index, 'core')"
            >
                <div class="bubble-glow"></div>
                <div class="bubble-content">
                    <h3 class="name">{{ member.name }}</h3>
                    <div class="roles">
                        <p v-for="role in member.roles" :key="role" class="role">{{ role }}</p>
                    </div>
                    <div class="social-links">
                        <a v-if="member.instagram" class="link social-link" :href="member.instagram" target="_blank" rel="noopener noreferrer">
                            <font-awesome-icon :icon="['fab', 'instagram']" />
                        </a>
                        <a v-if="member.github" class="link social-link" :href="member.github" target="_blank" rel="noopener noreferrer">
                            <font-awesome-icon :icon="['fab', 'github']" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Created By Team -->
    <h2 class="section-subtitle">Creato da</h2>
    <p class="section-description">Chi c'era al giorno 1 e il loro ruolo precedente</p>
    <div class="bubbles-grid">
        <div 
            v-for="(member, index) in processedCreatedBy" 
            :key="member.name"
            class="bubble-wrapper"
        >
            <div 
                :ref="el => bubbleRefs[`createdBy-${index}`] = el"
                class="bubble bubble-inactive"
                :style="{
                    '--offset-x': member.offsetX + '%',
                    '--offset-y': member.offsetY + '%',
                    '--rotation': member.rotation + 'deg',
                    '--animation-delay': member.delay + 's',
                    '--z-index': member.zIndex,
                    '--drag-x': member.dragX + 'px',
                    '--drag-y': member.dragY + 'px'
                }"
                @mousemove="handleMouseMove($event, index, 'createdBy')"
                @mousedown="onStartDrag($event, index, 'createdBy')"
                @touchstart="onStartDrag($event, index, 'createdBy')"
            >
                <div class="bubble-glow"></div>
                <div class="bubble-content">
                    <h3 class="name">{{ member.name }}</h3>
                    <div class="roles">
                        <p v-for="role in member.roles" :key="role" class="role">{{ role }}</p>
                    </div>
                    <div class="social-links">
                        <a v-if="member.instagram" class="link social-link" :href="member.instagram" target="_blank" rel="noopener noreferrer">
                            <font-awesome-icon :icon="['fab', 'instagram']" />
                        </a>
                        <a v-if="member.github" class="link social-link" :href="member.github" target="_blank" rel="noopener noreferrer">
                            <font-awesome-icon :icon="['fab', 'github']" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- External Collaborators -->
    <h2 class="section-subtitle">Collaboratori esterni</h2>
    <div class="bubbles-grid bubbles-grid-small">
        <div 
            v-for="(member, index) in processedExternal" 
            :key="member.name"
            class="bubble-wrapper"
        >
            <div 
                :ref="el => bubbleRefs[`external-${index}`] = el"
                class="bubble bubble-small bubble-inactive"
                :style="{
                    '--offset-x': member.offsetX + '%',
                    '--offset-y': member.offsetY + '%',
                    '--rotation': member.rotation + 'deg',
                    '--animation-delay': member.delay + 's',
                    '--z-index': member.zIndex,
                    '--drag-x': member.dragX + 'px',
                    '--drag-y': member.dragY + 'px'
                }"
                @mousemove="handleMouseMove($event, index, 'external')"
                @mousedown="onStartDrag($event, index, 'external')"
                @touchstart="onStartDrag($event, index, 'external')"
            >
                <div class="bubble-glow"></div>
                <div class="bubble-content">
                    <h3 class="name">{{ member.name }}</h3>
                    <div class="roles">
                        <p v-for="role in member.roles" :key="role" class="role">{{ role }}</p>
                    </div>
                    <div class="social-links">
                        <a v-if="member.instagram" class="link social-link" :href="member.instagram" target="_blank" rel="noopener noreferrer">
                            <font-awesome-icon :icon="['fab', 'instagram']" />
                        </a>
                        <a v-if="member.github" class="link social-link" :href="member.github" target="_blank" rel="noopener noreferrer">
                            <font-awesome-icon :icon="['fab', 'github']" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="supporters">
        <router-link to="/supporters" class="btn outlined">
            I nostri sostenitori ☕
        </router-link>
    </div>

    <!-- Extra Credits Toggle -->
    <div class="extra-toggle">
        <button :class="['btn', showExtra ? 'filled' : 'outlined']" @click="showExtra = !showExtra">
            <span class="btn-label">{{ showExtra ? 'Nascondi' : 'Altro' }}</span>
        </button>
    </div>

    <!-- Extra Credits -->
    <transition name="slide">
        <div v-if="showExtra" class="extra-section">
            <h2 class="section-subtitle" style="margin-top: 0;">Extra</h2>
            <div class="bubbles-grid bubbles-grid-small">
                <div 
                    v-for="(member, index) in processedExtra" 
                    :key="member.name"
                    class="bubble-wrapper"
                >
                    <div 
                        :ref="el => bubbleRefs[`extra-${index}`] = el"
                        class="bubble bubble-small"
                        :style="{
                            '--offset-x': member.offsetX + '%',
                            '--offset-y': member.offsetY + '%',
                            '--rotation': member.rotation + 'deg',
                            '--animation-delay': member.delay + 's',
                            '--z-index': member.zIndex,
                            '--drag-x': member.dragX + 'px',
                            '--drag-y': member.dragY + 'px'
                        }"
                        @mousemove="handleMouseMove($event, index, 'extra')"
                        @mousedown="onStartDrag($event, index, 'extra')"
                        @touchstart="onStartDrag($event, index, 'extra')"
                    >
                        <div class="bubble-glow"></div>
                        <div class="bubble-content">
                            <h3 class="name">{{ member.name }}</h3>
                            <div class="roles">
                                <p v-for="role in member.roles" :key="role" class="role">{{ role }}</p>
                            </div>
                            <a v-if="member.link" class="link email-link" :href="member.link" target="_blank">
                                <span class="material-symbols-outlined">link</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</div>
</template>

<style scoped>
.team-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
}

.bubbles-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 10px;
}

.bubbles-grid-small {
    max-width: 800px;
    margin: 0 auto;
}

/* Bubble variants moved to `src/assets/css/bubbles.css` */

.roles {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.role {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.85;
    line-height: 1.4;
}

.social-links {
    display: flex;
    gap: 12px;
    margin-top: 10px;
    justify-content: center;
    position: relative;
    z-index: 10;
}

.social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;
    transition: opacity 0.2s ease, transform 0.2s ease;
    font-size: 1.3rem;
    /* color handled by shared bubble styles when inside a bubble */
    text-decoration: none;
    pointer-events: auto;
}

.social-link:hover {
    opacity: 1;
    transform: scale(1.15);
}

.email-link {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 8px;
    opacity: 0.8;
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.email-link:hover {
    opacity: 1;
    transform: scale(1.1);
}

.email-link .material-symbols-outlined {
    font-size: 1.3rem;
}

.section-subtitle {
    text-align: center;
    margin: 40px 0 20px 0;
    color: var(--on-surface, #fff);
}

.section-description {
    text-align: center;
    margin: 0 0 20px 0;
    color: var(--on-surface, #ddd);
    opacity: 0.9;
}

.supporters {
    display: flex;
    justify-content: center;
    margin: 30px 0;
}

.extra-toggle {
    display: flex;
    justify-content: center;
    padding: 25px 0;
}

/* Button variants for More/Altro toggle */
.btn {
    transition: background-color 220ms ease, color 220ms ease, transform 160ms ease, box-shadow 220ms ease;
}

.extra-section {
    padding-top: 10px;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 900px) {
    .bubbles-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
    }
    
    .bubbles-grid-small {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 600px) {
    .team-container {
        padding: 15px;
    }
    
    .bubbles-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    
    .bubbles-grid-small {
        grid-template-columns: 1fr;
    }
    
    .name {
        font-size: 1rem;
    }
    
    .role {
        font-size: 0.8rem;
    }
}
</style>