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

const sortedDonators = ref([]);
const bubbleRefs = ref([]);
const containerRef = ref(null);

const { 
    getRandomOffset, 
    getRandomRotation, 
    handleMouseMove, 
    startDrag, 
    setupDragListeners 
} = useBubbleDrag(containerRef, bubbleRefs);

const getBubbleSize = (coffees, maxCoffees) => {
    const minSize = 140;
    const maxSize = 220;
    const ratio = coffees / maxCoffees;
    return minSize + (maxSize - minSize) * ratio;
};

let cleanupListeners = null;

onMounted(() => {
    const maxCoffees = Math.max(...donators.value.map(d => d.coffees));
    
    sortedDonators.value = [...donators.value]
        .sort((a, b) => b.coffees - a.coffees)
        .map((donator, index, array) => ({
            ...donator,
            offsetX: getRandomOffset(),
            rotation: getRandomRotation(),
            size: getBubbleSize(donator.coffees, maxCoffees),
            delay: index * 0.1,
            zIndex: array.length - index,
            dragX: 0,
            dragY: 0,
            isDragged: false,
            originalHeight: 0
        }));
    
    cleanupListeners = setupDragListeners(() => sortedDonators);
});

onUnmounted(() => {
    if (cleanupListeners) cleanupListeners();
});

const onStartDrag = (event, index) => {
    startDrag(event, index, sortedDonators);
};
</script>

<template>
<div class="bubbles-container" ref="containerRef">
    <div 
        v-for="(donator, index) in sortedDonators" 
        :key="donator.name"
        class="bubble-wrapper"
        :style="{
            '--placeholder-height': donator.isDragged ? donator.originalHeight + 'px' : 'auto'
        }"
    >
        <div 
            :ref="el => bubbleRefs[index] = el"
            class="bubble"
            :class="{ 'is-dragged': donator.isDragged }"
            :style="{
                '--offset-x': donator.offsetX + '%',
                '--rotation': donator.rotation + 'deg',
                '--bubble-size': donator.size + 'px',
                '--animation-delay': donator.delay + 's',
                '--z-index': donator.zIndex,
                '--drag-x': donator.dragX + 'px',
                '--drag-y': donator.dragY + 'px'
            }"
            @mousemove="handleMouseMove($event, index)"
            @mousedown="onStartDrag($event, index)"
            @touchstart="onStartDrag($event, index)"
        >
        <div class="bubble-glow"></div>
        <div class="bubble-content">
            <h3 class="name">{{ donator.name }}</h3>
            <p class="coffees">
                <b class="primary-text">
                    {{ donator.coffees }} 
                    <span class="material-symbols-outlined">local_cafe</span>
                </b>
            </p>
            <p v-if="donator.message" class="message">
                <span v-for="(line, i) in donator.message.split('\n')" :key="i">
                    {{ line }}<br v-if="i < donator.message.split('\n').length - 1">
                </span>
            </p>
            <a 
                v-if="donator.social" 
                class="link social-link" 
                :href="donator.social.url"
                target="_blank"
            >
                <font-awesome-icon :icon="['fab', donator.social.platform]" />
                {{ donator.social.handle }}
            </a>
        </div>
        </div>
    </div>
</div>
</template>

<style scoped>
.bubbles-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 25px;
    padding: 20px;
    min-height: 60vh;
    position: relative;
}

.bubble {
    min-width: var(--bubble-size);
    max-width: 90vw;
    touch-action: none;
}

.coffees {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
}

.coffees .primary-text {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 1.1rem;
}

.coffees .material-symbols-outlined {
    font-size: 1.2rem;
}

.social-link {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    margin-top: 5px;
    opacity: 0.9;
    transition: opacity 0.2s ease;
    cursor: pointer;
}

.social-link:hover {
    opacity: 1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .bubbles-container {
        gap: 20px;
        padding: 15px;
    }
    
    .bubble {
        --offset-x: calc(var(--offset-x) * 0.5) !important;
        min-width: min(var(--bubble-size), 85vw);
    }
}

@media (max-width: 480px) {
    .bubble {
        --offset-x: calc(var(--offset-x) * 0.3) !important;
    }
}
</style>