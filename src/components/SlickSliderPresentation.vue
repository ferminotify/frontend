<template>
    <div id="ComeFunzionaContainer">
        <div class="slider-container slideshow-box-hp" id="ComeFunziona">
            <Carousel
                ref="carouselRef"
                v-bind="carouselSettings"
                :breakpoints="breakpoints"
                class="slideshow-cards"
                :class="{ mousedown: isDragging }"
                @slide-start="onSlideStart"
                @slide-end="onSlideEnd"
                @drag-start="isDragging = true"
                @drag-end="isDragging = false"
                v-model="currentSlide"
            >
                <Slide v-for="(slide, index) in slides" :key="index">
                    <div 
                        class="card"
                        :class="{ 
                            'is-active': isActiveSlide(index),
                            'is-adjacent': isAdjacentSlide(index)
                        }"
                    >
                        <div class="content-card" :style="slide.style">
                            <p v-if="slide.icon" class="slider-card-icon">
                                <span class="material-symbols-outlined">{{ slide.icon }}</span>
                            </p>
                            <div v-if="slide.title || slide.subtitle" class="slider-card-text">
                                <h1 v-if="slide.isMainTitle" v-html="slide.title"></h1>
                                <h2 v-else-if="slide.title" :class="{ sliderTitolo: slide.isSectionTitle }" v-html="slide.title"></h2>
                                <p v-if="slide.subtitle">{{ slide.subtitle }}</p>
                            </div>
                            <!-- Logo slide -->
                            <svg v-if="slide.isLogo" version="1.1" viewBox="0 0 90 94" xmlns="http://www.w3.org/2000/svg" class="logo">
                                <circle cx="78.77" cy="10.95" r="9.6" class="logo-dot"/>
                                <path d="m69.13 6.05q-1.12 2.84-1.22 4.98-23.81-0.06-47.69-0.02-5.01 0.01-7.39 0.95c-5.43 2.15-7.88 7.02-7.87 12.82q0.05 26.12 0.02 52.89c-0.01 4.61 2.96 9.12 7.14 11.07q3.04 1.41 8.03 1.34 22.75-0.29 45.07 0.03c5.33 0.07 10.08-2.31 12.57-7.22q1.22-2.4 1.22-9.96-0.02-25.46-0.01-50.89 2.85-0.18 4.99-1.26 0.03 26.51-0.01 53.1-0.01 7.2-1.44 10.54-2.77 6.48-9.95 9.58h-61.18q-9.66-4.17-11.41-14.59v-57.96q2.05-10.48 10.83-14.07 3.38-1.38 10.02-1.38 24-0.03 48.28 0.05z"/>
                                <path d="m35.99 36.36 0.03 7.02a0.36 0.36 0 0 0 0.36 0.36h27.26a0.36 0.36 0 0 1 0.36 0.36l-0.01 10.28a0.36 0.36 0 0 1-0.36 0.36h-27.27a0.36 0.36 0 0 0-0.36 0.36v18.55a0.36 0.36 0 0 1-0.36 0.36l-14.76-0.02a0.36 0.36 0 0 1-0.36-0.36v-47.75a0.36 0.36 0 0 1 0.36-0.36h42.75a0.36 0.36 0 0 1 0.36 0.36l0.02 9.76a0.36 0.36 0 0 1-0.36 0.36h-27.3a0.36 0.36 0 0 0-0.36 0.36z"/>
                            </svg>
                        </div>
                    </div>
                </Slide>

                <template #addons>
                    <Navigation />
                </template>
            </Carousel>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Carousel, Slide, Navigation } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'

const carouselRef = ref(null)
const isDragging = ref(false)
const currentSlide = ref(0)
const isSliding = ref(false)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)

const carouselSettings = {
    itemsToShow: 3,
    snapAlign: 'center',
    wrapAround: false,
    transition: 500,
}

const breakpoints = {
    0: {
        itemsToShow: 1,
        snapAlign: 'center',
    },
    900: {
        itemsToShow: 2,
        snapAlign: 'start',
    },
    1200: {
        itemsToShow: 3,
        snapAlign: 'center',
    },
}

// Determine how many items are visible based on current breakpoint
const itemsVisible = computed(() => {
    if (windowWidth.value >= 1200) return 3
    if (windowWidth.value >= 900) return 2
    return 1
})

// Check if a slide is the center/active slide
const isActiveSlide = (index) => {
    if (itemsVisible.value === 1) {
        return index === currentSlide.value
    }
    if (itemsVisible.value === 3) {
        // Center mode - middle slide is active
        return index === currentSlide.value + 1
    }
    // 2 items - first visible is active
    return index === currentSlide.value
}

// Check if slide is adjacent to active
const isAdjacentSlide = (index) => {
    if (itemsVisible.value === 3) {
        const centerIndex = currentSlide.value + 1
        return index === centerIndex - 1 || index === centerIndex + 1
    }
    return false
}

const onSlideStart = () => {
    isSliding.value = true
}

const onSlideEnd = () => {
    isSliding.value = false
}

const handleResize = () => {
    windowWidth.value = window.innerWidth
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})

const slides = [
    {
        icon: 'settings',
        title: 'Come funziona<span class="slider-primary">?</span>',
        isMainTitle: true,
    },
    {
        icon: 'local_offer',
        title: 'Inserisci la keyword',
        subtitle: 'Inserisci le parole chiavi che ti riguardano',
    },
    {
        icon: 'event_available',
        title: 'Nuovo evento',
        subtitle: 'Cerchiamo automaticamente sul calendario giornaliero',
    },
    {
        icon: 'error_outline',
        title: 'Ti avvisiamo',
        subtitle: 'Se ci sono eventi o variazioni che ti interessano',
    },
    {
        icon: 'notifications',
        title: 'Tipi di notifiche',
        isSectionTitle: true,
    },
    {
        icon: 'send',
        title: 'Daily Notification',
        subtitle: 'Notifica che racchiude gli eventi e le variazioni in programma',
    },
    {
        icon: 'hourglass_top',
        title: 'Last Minute Notification',
        subtitle: 'Notifica istantanea per eventi o modifiche aggiunti durante la giornata',
    },
    {
        icon: 'explore',
        title: 'Esplora le funzionalità',
        isSectionTitle: true,
    },
    {
        icon: 'search',
        title: 'Cerca Eventi',
        subtitle: 'Cerca gli eventi e le variazioni dell\'orario previsti per i prossimi 3 giorni',
    },
    {
        icon: 'tune',
        title: 'Personalizza i canali',
        subtitle: 'Scegli quale canale di comunicazione preferisci',
    },
    {
        icon: 'send',
        title: 'Telegram',
        subtitle: 'Ti avvisiamo tramite il nostro bot su Telegram',
    },
    {
        icon: 'email',
        title: 'Email',
        subtitle: 'Ti avvisiamo con una semplice ed efficace email',
    },
    {
        icon: 'help_outline',
        title: 'Dubbi<span class="slider-primary">?</span>',
        subtitle: 'Visita la FAQ o contattaci',
    },
    {
        isLogo: true,
        style: { gridTemplateColumns: '1fr' },
    },
]
</script>

<style src="@/assets/css/faq.css"></style>
<style scoped>
.slider-container {
    position: relative;
    width: 100%;
    max-width: 1920px;
    margin: 0 auto;
    overflow-x: hidden;
}

.slideshow-cards {
    width: 100%;
    padding: 120px 0;
    box-sizing: border-box;
    z-index: 3;
}

/* Allow overflow for scale effect */
:deep(.carousel__viewport) {
    overflow: visible !important;
}

:deep(.carousel__track) {
    align-items: center;
}

.slideshow-cards.mousedown {
    cursor: grabbing;
}

.card {
    padding: 0 15px;
    box-sizing: border-box;
    height: 225px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    
    /* Smooth scale transition */
    transition: transform 0.3s ease-out;
}

/* Center card scale effect - like slick-center */
.card.is-active {
    transform: scale(1.15);
    z-index: 100;
}

.card.is-active .slider-card-icon .material-symbols-outlined,
.card.is-active :deep(.slider-primary) {
    color: var(--primary) !important;
    transition: color 0.2s ease-out;
}

/* Adjacent cards styling */
.card.is-adjacent {
    transform: scale(1);
    z-index: 50;
}

/* Dragging state */
.slideshow-cards.mousedown .card {
    transform: scale(0.95) !important;
    cursor: grabbing;
}

.slideshow-cards.mousedown .card .content-card {
    box-shadow: 0 0 0 rgba(0, 0, 0, 0.1) !important;
}

.slideshow-cards.mousedown .card .slider-card-icon .material-symbols-outlined {
    color: var(--on-surface) !important;
}

.content-card {
    display: grid;
    grid-template-columns: 0.5fr 1fr;
    place-items: center;
    gap: 5px;
    background: var(--surface-variant);
    border-radius: 10px;
    padding: 25px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: 1px solid var(--surface);
    
    /* Slick-like shadow and transitions */
    box-shadow: 0 7px 15px rgba(0, 0, 0, 0.1);
    transition: 
        transform 0.3s ease-out,
        box-shadow 0.3s ease-out;
}

.content-card:hover {
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
}

.slider-card-icon {
    width: 100%;
    height: 100%;
    font-size: 60px;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.slider-card-icon .material-symbols-outlined {
    font-size: 60px;
    color: var(--on-surface);
    transition: color 0.2s ease-out;
}

.slider-card-text {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    text-align: left;
}

.slider-card-text h1,
.slider-card-text h2 {
    margin: 0 0 8px 0;
    color: var(--on-surface);
    line-height: 1;
}

.slider-card-text h1 {
    font-size: 1.5rem;
}

.slider-card-text h2 {
    font-size: 1.1rem;
}

.slider-card-text h2:not(.sliderTitolo) {
    line-height: 1;
    margin: 5px 0;
}

.slider-card-text h2.sliderTitolo {
    font-size: 1.3rem;
}

.slider-card-text p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--on-surface-variant);
    line-height: 1.4;
}

:deep(.slider-primary) {
    color: var(--primary);
    transition: color 0.2s ease-out;
}

.logo {
    max-width: 60%;
    max-height: 60%;
    transform: translateX(3px) translateY(-3px);
}

.logo path {
    fill: var(--on-surface);
}

.logo-dot {
    fill: var(--primary);
}

/* Navigation buttons - positioned at top like slick */
:deep(.carousel__prev),
:deep(.carousel__next) {
    position: absolute;
    top: 40px;
    width: 60px;
    height: 60px;
    background-color: var(--surface-variant);
    border-radius: 50%;
    border: none;
    cursor: pointer;
    color: var(--on-surface);
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    /* Remove default transform */
    transform: none;
}

:deep(.carousel__prev) {
    left: 25%;
    margin-left: -30px;
}

:deep(.carousel__next) {
    left: calc(25% + 80px);
    margin-left: -30px;
}

/* Button hover effect with bouncy scale */
:deep(.carousel__prev)::before,
:deep(.carousel__next)::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: var(--surface-variant);
    border-radius: 50%;
    z-index: -1;
    transition: transform 0.3s cubic-bezier(0.23, 0.98, 0.62, 1.58);
}

:deep(.carousel__prev:hover)::before,
:deep(.carousel__next:hover)::before {
    transform: scale(1.1);
}

:deep(.carousel__prev svg),
:deep(.carousel__next svg) {
    width: 20px;
    height: 20px;
    position: relative;
    z-index: 1;
}

/* Disabled state */
:deep(.carousel__prev--disabled),
:deep(.carousel__next--disabled) {
    opacity: 0.4;
    cursor: not-allowed;
}

:deep(.carousel__prev--disabled:hover)::before,
:deep(.carousel__next--disabled:hover)::before {
    transform: none;
}

/* Responsive - 1200px and below */
@media (max-width: 1200px) {
    .card {
        width: 40%;
    }
    
    /* All icons get primary color when not in 3-col mode */
    .slider-card-icon .material-symbols-outlined {
        color: var(--primary);
    }
    
    :deep(.carousel__prev) {
        left: 20%;
    }
    
    :deep(.carousel__next) {
        left: calc(20% + 80px);
    }
}

/* Responsive - Mobile */
@media (max-width: 900px) {
    .slideshow-cards {
        padding: 90px 0 60px 0;
    }
    
    .card {
        height: 200px;
        padding: 0 10px;
    }
    
    /* Center buttons at top for mobile */
    :deep(.carousel__prev),
    :deep(.carousel__next) {
        top: 0 !important;
        -webkit-tap-highlight-color: transparent;
    }
    
    :deep(.carousel__prev) {
        left: 50% !important;
        margin-left: 0;
        transform: translateX(-70px);
    }
    
    :deep(.carousel__next) {
        left: 50% !important;
        margin-left: 0;
        transform: translateX(10px);
    }
    
    /* Disable hover scale on touch devices */
    :deep(.carousel__prev:hover)::before,
    :deep(.carousel__next:hover)::before {
        transform: none !important;
    }
    
    .content-card {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 15px;
    }
    
    .content-card h1 {
        margin: 0;
    }
    
    .slider-card-icon {
        width: auto;
        height: auto;
        font-size: 60px;
        display: block;
    }
    
    .slider-card-icon .material-symbols-outlined {
        font-size: 50px;
    }
    
    .slider-card-text {
        width: auto;
        height: auto;
        display: block;
        text-align: center;
        align-items: center;
    }
    
    /* All cards same scale on mobile */
    .card.is-active {
        transform: scale(1);
    }
    
    :deep(.carousel__prev),
    :deep(.carousel__next) {
        width: 50px;
        height: 50px;
    }
}
</style>