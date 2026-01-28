<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useBubbleDrag } from '@/composables/useBubbleDrag';
import '@/assets/css/bubbles.css';

const donators = ref([
    {
        name: 'Benzi',
        coffees: 10,
        message: 'Buon lavoro :)',
        social: null
    },
    {
        name: 'Mattia Antonacci',
        coffees: 6,
        message: 'uno va a me\nmadonna raga forza foggia',
        social: { platform: 'x-twitter', handle: 'antonacci.mattia', url: 'https://x.com/@antonacci.mattia' }
    },
    {
        name: 'Cecilia',
        coffees: 5,
        message: null,
        social: null
    },
    {
        name: 'Matteo Melara',
        coffees: 5,
        message: 'bravi, sito utilissimo e ben fatto',
        social: { platform: 'x-twitter', handle: 'matteomelara._', url: 'https://x.com/matteomelara._' }
    },
]);

const processedDonators = ref([]);
const bubbleRefs = ref({});
const containerRef = ref(null);

const { 
    getRandomOffset, 
    getRandomRotation, 
    handleMouseMove, 
    startDrag, 
    setupDragListeners 
} = useBubbleDrag(containerRef, bubbleRefs);

const processDonator = (donator, index, total) => ({
    ...donator,
    offsetX: getRandomOffset(30),
    offsetY: getRandomOffset(30),
    rotation: getRandomRotation(6),
    delay: index * 0.08,
    zIndex: total - index,
    dragX: 0,
    dragY: 0
});

const getList = (section) => {
    return processedDonators;
};

const onStartDrag = (event, index) => {
    startDrag(event, index, processedDonators, 'donators');
};

let cleanupListeners = null;

onMounted(() => {
    processedDonators.value = donators.value.map((d, i) => processDonator(d, i, donators.value.length));
    cleanupListeners = setupDragListeners(getList);
});

onUnmounted(() => {
    if (cleanupListeners) cleanupListeners();
});
</script>

<template>
<div class="supporters-container" ref="containerRef">
    <div class="bubbles-grid">
        <div 
            v-for="(donator, index) in processedDonators" 
            :key="donator.name"
            class="bubble-wrapper"
        >
            <div 
                :ref="el => bubbleRefs[`donators-${index}`] = el"
                class="bubble"
                :style="{
                    '--offset-x': donator.offsetX + '%',
                    '--offset-y': donator.offsetY + '%',
                    '--rotation': donator.rotation + 'deg',
                    '--animation-delay': donator.delay + 's',
                    '--z-index': donator.zIndex,
                    '--drag-x': donator.dragX + 'px',
                    '--drag-y': donator.dragY + 'px'
                }"
                @mousemove="handleMouseMove($event, index, 'donators')"
                @mousedown="onStartDrag($event, index)"
                @touchstart="onStartDrag($event, index)"
            >
                <div class="bubble-glow"></div>
                <div class="bubble-content">
                    <h3 class="name">{{ donator.name }}</h3>
                    <div class="coffees">
                        <span class="coffee-count">{{ donator.coffees }}</span> <span class="material-symbols-outlined">local_cafe</span>
                    </div>
                    <p v-if="donator.message" class="message">{{ donator.message }}</p>
                    <div v-if="donator.social" class="social-links">
                        <a class="link social-link" :href="donator.social.url" target="_blank" rel="noopener noreferrer">
                            <font-awesome-icon :icon="['fab', donator.social.platform]" />
                            <span class="handle">@{{ donator.social.handle }}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped>
.supporters-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
}

.bubble-wrapper {
    display: flex;
    justify-content: center;
    align-items: start;
}

.coffees{
    color: var(--on-surface-primary);
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
    gap: 6px;
    opacity: 0.9;
    transition: opacity 0.2s ease, transform 0.2s ease;
    font-size: 0.9rem;
    /* color handled by shared bubble styles when inside a bubble */
    text-decoration: none;
    pointer-events: auto;
}

.social-link:hover {
    opacity: 1;
    transform: scale(1.05);
}

.handle {
    font-size: 0.8rem;
}

/* Responsive */
@media (max-width: 900px) {
    .bubbles-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
    }
}

@media (max-width: 600px) {
    .supporters-container {
        padding: 15px;
    }
    
    .bubbles-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    
    .name {
        font-size: 1rem;
    }
    
    .message {
        font-size: 0.8rem;
        max-width: 180px;
    }
}
</style>