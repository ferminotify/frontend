<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useBubbleDrag } from '@/composables/useBubbleDrag';
import '@/assets/css/bubbles.css';
import { colorAt } from '@/utils/palette';

const donators = [
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
        name: 'Cecilia Pincella',
        coffees: 5,
        message: 'Grazie per Ferminotify!',
        social: null
    },
    {
        name: 'Mariachiara Puviani',
        coffees: 5,
        message: 'Buon lavoro!',
        social: null
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
];

const totalCoffees = donators.reduce((sum, d) => sum + d.coffees, 0);

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

const initials = (name) => name.split(' ').map((part) => part[0]).join('').slice(0, 2);

const processDonator = (donator, index, total) => ({
    ...donator,
    color: colorAt(index, 1),
    offsetX: getRandomOffset(14),
    offsetY: getRandomOffset(10),
    rotation: getRandomRotation(4),
    delay: index * 0.06,
    zIndex: total - index,
    dragX: 0,
    dragY: 0
});

const getList = () => processedDonators;

const onStartDrag = (event, index) => {
    startDrag(event, index, processedDonators, 'donators');
};

let cleanupListeners = null;

onMounted(() => {
    processedDonators.value = donators.map((d, i) => processDonator(d, i, donators.length));
    cleanupListeners = setupDragListeners(getList);
});

onUnmounted(() => {
    if (cleanupListeners) cleanupListeners();
});
</script>

<template>
<div class="supporters-container" ref="containerRef">
    <p class="supporters-total">
        <span class="total-number">{{ totalCoffees }}</span>
        caffè offerti da {{ donators.length }} sostenitori
    </p>

    <div class="bubbles-grid">
        <div
            v-for="(donator, index) in processedDonators"
            :key="donator.name"
            :class="['bubble-wrapper', { 'bubble-wrapper-top': index === 0 }]"
        >
            <div
                :ref="el => bubbleRefs[`donators-${index}`] = el"
                class="bubble"
                :style="{
                    '--accent-rgb': donator.color,
                    '--offset-x': donator.offsetX + 'px',
                    '--offset-y': donator.offsetY + 'px',
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
                    <div class="donator-head">
                        <span class="monogram" aria-hidden="true">{{ initials(donator.name) }}</span>
                        <div class="donator-title">
                            <h3 class="name">{{ donator.name }}</h3>
                            <span class="coffees" :aria-label="`${donator.coffees} caffè`">
                                {{ donator.coffees }}
                                <span class="material-symbols-outlined" aria-hidden="true">local_cafe</span>
                            </span>
                        </div>
                    </div>
                    <p v-if="donator.message" class="message">“{{ donator.message }}”</p>
                    <a
                        v-if="donator.social"
                        class="social-link"
                        :href="donator.social.url"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <font-awesome-icon :icon="['fab', donator.social.platform]" />
                        <span class="handle">@{{ donator.social.handle }}</span>
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped>
.supporters-container {
    position: relative;
}

.supporters-total {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 0 0 20px;
    color: var(--on-surface-variant);
}

.total-number {
    font-size: 2.6rem;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
    color: #fcad70;
}

.bubbles-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

/* Top supporter spans the row; the last card fills the gap left by an odd remainder */
.bubble-wrapper-top,
.bubble-wrapper:last-child:nth-child(even) {
    grid-column: 1 / -1;
}

.bubble-wrapper-top .name {
    font-size: 1.35rem;
}

.bubble-wrapper-top .monogram {
    width: 52px;
    height: 52px;
    font-size: 1.1rem;
}

.donator-head {
    display: flex;
    align-items: center;
    gap: 12px;
}

.donator-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 10px;
    row-gap: 4px;
    min-width: 0;
}

.donator-title .name {
    overflow-wrap: anywhere;
}

.monogram {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 0.9rem;
    font-weight: 700;
    color: rgb(var(--accent-rgb));
    background: rgba(var(--accent-rgb), 0.15);
    border: 2px solid rgb(var(--accent-rgb));
}

.coffees {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 700;
    color: rgb(var(--accent-rgb));
    background: rgba(var(--accent-rgb), 0.14);
}

.coffees .material-symbols-outlined {
    font-size: 17px;
}

.message {
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--on-surface-variant);
    white-space: pre-line;
}

.social-link {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 6px;
    font-size: 0.85rem;
    text-decoration: none;
    position: relative;
    z-index: 10;
}

@media (max-width: 600px) {
    .bubbles-grid {
        grid-template-columns: minmax(0, 1fr);
    }

    .total-number {
        font-size: 2.1rem;
    }
}
</style>
