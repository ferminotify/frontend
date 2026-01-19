<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const teamMembers = ref([
    {
        name: 'Liu Kevin',
        roles: ['📆 Project Management', '💻 Code', '🎨 Design', '🚇 Hosting'],
        email: 'cliu@fermimn.edu.it'
    },
    {
        name: 'Sirico Davide',
        roles: ['💻 Code', '🚇 Hosting'],
        email: 'dsirico@fermimn.edu.it'
    },
    {
        name: 'Bini Matteo',
        roles: ['💻 Code', '👀 Code Review'],
        email: 'binim@fermimn.edu.it'
    },
    {
        name: 'Casari Simone',
        roles: ['💼 Business', '🎨 Design'],
        email: 'scasari@fermimn.edu.it'
    },
    {
        name: 'Rastelli Francesco',
        roles: ['⚠️ Testing'],
        email: 'frastelli@fermimn.edu.it'
    },
    {
        name: 'Tardiani Simone',
        roles: ['💻 Code'],
        email: 'stardiani@fermimn.edu.it'
    }
]);

const externalCollaborators = ref([
    {
        name: 'Malinverno Tommaso',
        roles: ['💻 Code'],
        email: 'tmalinverno@fermimn.edu.it'
    },
    {
        name: 'Tellaroli Alberto',
        roles: ['🔃 Miscellaneous'],
        email: 'atellaroli@fermimn.edu.it'
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

const showExtra = ref(false);

// Processed members with random offsets
const processedTeam = ref([]);
const processedExternal = ref([]);
const processedExtra = ref([]);
const bubbleRefs = ref([]);
const containerRef = ref(null);

// Dragging state
const dragging = ref(null);
const dragOffset = ref({ x: 0, y: 0 });
const dragSection = ref(null); // 'team', 'external', or 'extra'

const getRandomOffset = () => {
    // Random offset between -15% and 15% for subtle movement
    return (Math.random() - 0.5) * 30;
};

const getRandomRotation = () => {
    // Random slight rotation between -3 and 3 degrees
    return (Math.random() - 0.5) * 6;
};

const processMember = (member, index) => ({
    ...member,
    offsetX: getRandomOffset(),
    offsetY: getRandomOffset(),
    rotation: getRandomRotation(),
    delay: index * 0.08,
    dragX: 0,
    dragY: 0,
    isDragged: false,
    originalHeight: 0,
    zIndex: 50
});

// Mouse light effect
const handleMouseMove = (event, bubble) => {
    if (!bubble) return;
    const rect = bubble.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    bubble.style.setProperty('--mouse-x', `${x}px`);
    bubble.style.setProperty('--mouse-y', `${y}px`);
};

// Drag functions
const startDrag = (event, index, section) => {
    // Don't start drag if clicking on a link
    if (event.target.tagName === 'A' || event.target.closest('a')) return;
    
    event.preventDefault();
    dragging.value = index;
    dragSection.value = section;
    
    const bubble = bubbleRefs.value[`${section}-${index}`];
    if (!bubble || !containerRef.value) return;
    
    const rect = bubble.getBoundingClientRect();
    const containerRect = containerRef.value.getBoundingClientRect();
    
    const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX;
    const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY;
    
    dragOffset.value = {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
    
    const list = section === 'team' ? processedTeam : section === 'external' ? processedExternal : processedExtra;
    
    if (!list.value[index].isDragged) {
        list.value[index].originalHeight = rect.height;
        // Position relative to container
        list.value[index].dragX = rect.left - containerRect.left;
        list.value[index].dragY = rect.top - containerRect.top;
        list.value[index].isDragged = true;
    }
    
    // Calculate z-index based on vertical position (higher on page = bigger z-index)
    const maxZ = 10000;
    list.value[index].zIndex = Math.max(50, maxZ - Math.floor(rect.top + window.scrollY));
    
    bubble.classList.add('dragging');
};

const onDrag = (event) => {
    if (dragging.value === null || !dragSection.value || !containerRef.value) return;
    
    const bubble = bubbleRefs.value[`${dragSection.value}-${dragging.value}`];
    if (!bubble) return;
    
    const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX;
    const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY;
    
    const containerRect = containerRef.value.getBoundingClientRect();
    
    // Position relative to container
    const newX = clientX - containerRect.left - dragOffset.value.x;
    const newY = clientY - containerRect.top - dragOffset.value.y;
    
    const list = dragSection.value === 'team' ? processedTeam : dragSection.value === 'external' ? processedExternal : processedExtra;
    list.value[dragging.value].dragX = newX;
    list.value[dragging.value].dragY = newY;
};

const endDrag = () => {
    if (dragging.value !== null && dragSection.value) {
        const bubble = bubbleRefs.value[`${dragSection.value}-${dragging.value}`];
        if (bubble) {
            bubble.classList.remove('dragging');
        }
    }
    dragging.value = null;
    dragSection.value = null;
};

onMounted(() => {
    processedTeam.value = teamMembers.value.map(processMember);
    processedExternal.value = externalCollaborators.value.map((m, i) => processMember(m, i + teamMembers.value.length));
    processedExtra.value = extraCredits.value.map((m, i) => processMember(m, i));
    
    // Global mouse/touch events for dragging
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchmove', onDrag, { passive: false });
    window.addEventListener('touchend', endDrag);
});

onUnmounted(() => {
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', endDrag);
    window.removeEventListener('touchmove', onDrag);
    window.removeEventListener('touchend', endDrag);
});
</script>

<template>
<div class="team-container" ref="containerRef">
    <!-- Main Team -->
    <div class="bubbles-grid">
        <div 
            v-for="(member, index) in processedTeam" 
            :key="member.name"
            class="bubble-wrapper"
            :style="member.isDragged ? { '--placeholder-height': member.originalHeight + 'px' } : {}"
        >
            <div 
                :ref="el => bubbleRefs[`team-${index}`] = el"
                class="bubble"
                :class="{ 'is-dragged': member.isDragged }"
                :style="{
                    '--offset-x': member.offsetX + '%',
                    '--offset-y': member.offsetY + '%',
                    '--rotation': member.rotation + 'deg',
                    '--animation-delay': member.delay + 's',
                    '--drag-x': member.dragX + 'px',
                    '--drag-y': member.dragY + 'px',
                    '--z-index': member.zIndex
                }"
                @mousemove="handleMouseMove($event, bubbleRefs[`team-${index}`])"
                @mousedown="startDrag($event, index, 'team')"
                @touchstart="startDrag($event, index, 'team')"
            >
                <div class="bubble-glow"></div>
                <div class="bubble-content">
                    <h3 class="name">{{ member.name }}</h3>
                    <div class="roles">
                        <p v-for="role in member.roles" :key="role" class="role">{{ role }}</p>
                    </div>
                    <a v-if="member.email" class="link email-link" :href="'mailto:' + member.email">
                        <span class="material-symbols-outlined">mail</span>
                    </a>
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
            :style="member.isDragged ? { '--placeholder-height': member.originalHeight + 'px' } : {}"
        >
            <div 
                :ref="el => bubbleRefs[`external-${index}`] = el"
                class="bubble bubble-small"
                :class="{ 'is-dragged': member.isDragged }"
                :style="{
                    '--offset-x': member.offsetX + '%',
                    '--offset-y': member.offsetY + '%',
                    '--rotation': member.rotation + 'deg',
                    '--animation-delay': member.delay + 's',
                    '--drag-x': member.dragX + 'px',
                    '--drag-y': member.dragY + 'px',
                    '--z-index': member.zIndex
                }"
                @mousemove="handleMouseMove($event, bubbleRefs[`external-${index}`])"
                @mousedown="startDrag($event, index, 'external')"
                @touchstart="startDrag($event, index, 'external')"
            >
                <div class="bubble-glow"></div>
                <div class="bubble-content">
                    <h3 class="name">{{ member.name }}</h3>
                    <div class="roles">
                        <p v-for="role in member.roles" :key="role" class="role">{{ role }}</p>
                    </div>
                    <a v-if="member.email" class="link email-link" :href="'mailto:' + member.email">
                        <span class="material-symbols-outlined">mail</span>
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- Extra Credits Toggle -->
    <div class="extra-toggle">
        <button class="btn outlined" @click="showExtra = !showExtra">
            {{ showExtra ? 'Less' : 'More' }}
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
                    :style="member.isDragged ? { '--placeholder-height': member.originalHeight + 'px' } : {}"
                >
                    <div 
                        :ref="el => bubbleRefs[`extra-${index}`] = el"
                        class="bubble bubble-small"
                        :class="{ 'is-dragged': member.isDragged }"
                        :style="{
                            '--offset-x': member.offsetX + '%',
                            '--offset-y': member.offsetY + '%',
                            '--rotation': member.rotation + 'deg',
                            '--animation-delay': member.delay + 's',
                            '--drag-x': member.dragX + 'px',
                            '--drag-y': member.dragY + 'px',
                            '--z-index': member.zIndex
                        }"
                        @mousemove="handleMouseMove($event, bubbleRefs[`extra-${index}`])"
                        @mousedown="startDrag($event, index, 'extra')"
                        @touchstart="startDrag($event, index, 'extra')"
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

.bubble-wrapper {
    min-height: var(--placeholder-height, 0);
    display: flex;
    justify-content: center;
    align-items: start;
}

.bubble {
    --mouse-x: 50%;
    --mouse-y: 50%;
    --drag-x: 0px;
    --drag-y: 0px;
    
    position: relative;
    transform: translate(var(--offset-x), var(--offset-y)) rotate(var(--rotation));
    padding: 20px 25px;
    background: linear-gradient(135deg, 
        rgba(var(--primary-rgb, 99, 102, 241), 0.15) 0%, 
        rgba(var(--primary-rgb, 99, 102, 241), 0.05) 100%);
    border: 2px solid rgba(var(--primary-rgb, 99, 102, 241), 0.3);
    border-radius: 24px;
    box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.1),
        0 2px 8px rgba(var(--primary-rgb, 99, 102, 241), 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    animation: floatIn 0.6s ease-out backwards;
    animation-delay: var(--animation-delay);
    transition: box-shadow 0.3s ease;
    overflow: hidden;
    cursor: grab;
    user-select: none;
    width: fit-content;
}

.bubble.is-dragged {
    position: absolute;
    transform: rotate(var(--rotation));
    left: var(--drag-x);
    top: var(--drag-y);
    animation: none;
    margin: 0;
    z-index: var(--z-index, 50);
}

.bubble.dragging {
    cursor: grabbing;
    z-index: 100;
    box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.25),
        0 8px 20px rgba(var(--primary-rgb, 99, 102, 241), 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: translate(var(--offset-x), var(--offset-y)) rotate(var(--rotation)) scale(1.05);
}

.bubble.is-dragged.dragging {
    transform: rotate(var(--rotation)) scale(1.05);
    transform-origin: center center;
}

.bubble:hover {
    box-shadow: 
        0 12px 40px rgba(0, 0, 0, 0.15),
        0 4px 12px rgba(var(--primary-rgb, 99, 102, 241), 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* Mouse-following glow effect */
.bubble-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 22px;
    background: radial-gradient(
        circle 120px at var(--mouse-x) var(--mouse-y),
        rgba(var(--primary-rgb, 99, 102, 241), 0.4) 0%,
        transparent 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

.bubble:hover .bubble-glow {
    opacity: 1;
}

.bubble-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
}

.name {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--on-surface, #fff);
}

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

.extra-toggle {
    display: flex;
    justify-content: center;
    padding: 25px 0;
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

@keyframes floatIn {
    0% {
        opacity: 0;
        transform: translate(var(--offset-x), calc(var(--offset-y) + 30px)) rotate(var(--rotation)) scale(0.8);
    }
    100% {
        opacity: 1;
        transform: translate(var(--offset-x), var(--offset-y)) rotate(var(--rotation)) scale(1);
    }
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
    
    .bubble {
        --offset-x: calc(var(--offset-x) * 0.3) !important;
        --offset-y: calc(var(--offset-y) * 0.3) !important;
        --rotation: calc(var(--rotation) * 0.5) !important;
        padding: 15px 20px;
    }
    
    .name {
        font-size: 1rem;
    }
    
    .role {
        font-size: 0.8rem;
    }
}
</style>