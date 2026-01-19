<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

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
        name: 'Matteo Melara',
        coffees: 5,
        message: 'bravi, sito utilissimo e ben fatto',
        social: { platform: 'x-twitter', handle: 'matteomelara._', url: 'https://x.com/matteomelara._' }
    },
    {
        name: 'Cecilia',
        coffees: 5,
        message: null,
        social: null
    }
]);

// Sort by coffees (most first) and assign random horizontal positions
const sortedDonators = ref([]);
const bubbleRefs = ref([]);

const getRandomOffset = () => {
    // Random offset between -30% and 30% from center
    return (Math.random() - 0.5) * 60;
};

const getBubbleSize = (coffees, maxCoffees) => {
    // Scale bubble size based on donation amount
    const minSize = 140;
    const maxSize = 220;
    const ratio = coffees / maxCoffees;
    return minSize + (maxSize - minSize) * ratio;
};

// Dragging state
const dragging = ref(null);
const dragOffset = ref({ x: 0, y: 0 });
const containerRef = ref(null);

// Mouse light effect
const handleMouseMove = (event, index) => {
    const bubble = bubbleRefs.value[index];
    if (!bubble || dragging.value === index) return;
    
    const rect = bubble.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    bubble.style.setProperty('--mouse-x', `${x}px`);
    bubble.style.setProperty('--mouse-y', `${y}px`);
};

// Drag functions
const startDrag = (event, index) => {
    // Don't start drag if clicking on a link
    if (event.target.tagName === 'A' || event.target.closest('a')) return;
    
    event.preventDefault();
    dragging.value = index;
    
    const bubble = bubbleRefs.value[index];
    const rect = bubble.getBoundingClientRect();
    const container = containerRef.value;
    const containerRect = container.getBoundingClientRect();
    
    const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX;
    const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY;
    
    // Store where we clicked relative to the bubble's top-left corner
    dragOffset.value = {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
    
    // Capture current position before switching to absolute
    if (!sortedDonators.value[index].isDragged) {
        sortedDonators.value[index].originalHeight = rect.height;
        // Calculate position relative to container
        sortedDonators.value[index].dragX = rect.left - containerRect.left;
        sortedDonators.value[index].dragY = rect.top - containerRect.top;
        sortedDonators.value[index].isDragged = true;
    }
    
    bubble.classList.add('dragging');
};

const onDrag = (event) => {
    if (dragging.value === null) return;
    
    const bubble = bubbleRefs.value[dragging.value];
    if (!bubble || !containerRef.value) return;
    
    const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX;
    const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY;
    
    const containerRect = containerRef.value.getBoundingClientRect();
    
    // New position = mouse position - container offset - where we grabbed on the bubble
    const newX = clientX - containerRect.left - dragOffset.value.x;
    const newY = clientY - containerRect.top - dragOffset.value.y;
    
    sortedDonators.value[dragging.value].dragX = newX;
    sortedDonators.value[dragging.value].dragY = newY;
};

const endDrag = () => {
    if (dragging.value !== null) {
        const bubble = bubbleRefs.value[dragging.value];
        if (bubble) {
            bubble.classList.remove('dragging');
        }
    }
    dragging.value = null;
};

onMounted(() => {
    const maxCoffees = Math.max(...donators.value.map(d => d.coffees));
    
    sortedDonators.value = [...donators.value]
        .sort((a, b) => b.coffees - a.coffees)
        .map((donator, index) => ({
            ...donator,
            offsetX: getRandomOffset(),
            size: getBubbleSize(donator.coffees, maxCoffees),
            delay: index * 0.1,
            dragX: 0,
            dragY: 0,
            isDragged: false,
            originalHeight: 0
        }));
    
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
                '--bubble-size': donator.size + 'px',
                '--animation-delay': donator.delay + 's',
                '--drag-x': donator.dragX + 'px',
                '--drag-y': donator.dragY + 'px'
            }"
            @mousemove="handleMouseMove($event, index)"
            @mousedown="startDrag($event, index)"
            @touchstart="startDrag($event, index)"
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

.bubble-wrapper {
    min-height: var(--placeholder-height);
    display: flex;
    justify-content: center;
    position: static;
}

.bubble {
    --mouse-x: 50%;
    --mouse-y: 50%;
    --drag-x: 0px;
    --drag-y: 0px;
    
    position: relative;
    transform: translateX(var(--offset-x));
    min-width: var(--bubble-size);
    max-width: 90vw;
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
    cursor: grab;
    user-select: none;
    overflow: hidden;
}

.bubble.is-dragged {
    position: absolute;
    transform: translate(var(--drag-x), var(--drag-y));
    left: 0;
    top: 0;
    animation: none;
    margin: 0;
}

.bubble.dragging {
    cursor: grabbing;
    z-index: 100;
    box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.25),
        0 8px 20px rgba(var(--primary-rgb, 99, 102, 241), 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: translateX(var(--offset-x)) scale(1.08);
}

.bubble.is-dragged.dragging {
    transform: translate(var(--drag-x), var(--drag-y)) scale(1.05);
    transform-origin: center center;
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

.bubble:hover {
    box-shadow: 
        0 12px 40px rgba(0, 0, 0, 0.15),
        0 4px 12px rgba(var(--primary-rgb, 99, 102, 241), 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
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
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-color, #fff);
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

.message {
    margin: 5px 0 0 0;
    font-size: 0.85rem;
    opacity: 0.8;
    line-height: 1.4;
    max-width: 200px;
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

@keyframes floatIn {
    0% {
        opacity: 0;
        transform: translateX(var(--offset-x)) translateY(30px) scale(0.8);
    }
    100% {
        opacity: 1;
        transform: translateX(var(--offset-x)) translateY(0) scale(1);
    }
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
        padding: 15px 20px;
    }
    
    .name {
        font-size: 1.1rem;
    }
    
    .message {
        font-size: 0.8rem;
        max-width: 180px;
    }
}

@media (max-width: 480px) {
    .bubble {
        --offset-x: calc(var(--offset-x) * 0.3) !important;
    }
}
</style>