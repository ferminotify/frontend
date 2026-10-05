<template>
    <div
        v-if="!done"
        ref="panelRef"
        class="sondaggio"
        :class="{ dragging: isDragging || !boundsReady }"
        :style="panelStyle"
        @wheel.prevent="onWheel"
    >
        <div class="sondaggio-inner">
            <div class="sondaggio-header">
                <span class="material-symbols-outlined sondaggio-icon" aria-hidden="true">rate_review</span>
                <h2>Racconta la <span style="white-space: nowrap;">tua esperienza</span></h2>
                <p>con questo breve sondaggio <span style="white-space: nowrap;">(&lt; 1 min)</span></p>
            </div>
            <RouterLink to="/feedback" class="btn filled sondaggio-cta">
                Partecipa
            </RouterLink>
        </div>
        <div
            ref="indicatorRef"
            class="toggle-arrow"
            @pointerdown="onPointerDown"
            @click="onToggleClick"
        >
            <span class="material-symbols-outlined">
                drag_indicator
            </span>
        </div>
    </div>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useFeedbackPrompt } from '@/composables/useFeedbackPrompt';

const { done, init, isDesktopCollapsed, setDesktopCollapsed } = useFeedbackPrompt();

const panelRef = ref(null);
const indicatorRef = ref(null);
const isDragging = ref(false);
const translateX = ref(0);
const minTranslateX = ref(0);
// Until the first real measurement the saved collapsed state is applied without animating
const boundsReady = ref(false);
let restoreCollapsed = false;

let startPointerX = 0;
let startTranslateX = 0;
let hasDragged = false;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const panelStyle = computed(() => ({
    transform: `translateX(${translateX.value}px)`,
}));

const updateBounds = () => {
    if (!panelRef.value || !indicatorRef.value) {
        return;
    }

    const panelWidth = panelRef.value.offsetWidth;
    const indicatorWidth = indicatorRef.value.offsetWidth;
    if (!panelWidth) {
        return;
    }
    const wasCollapsed = restoreCollapsed
        || (translateX.value !== 0 && translateX.value === minTranslateX.value);
    restoreCollapsed = false;
    minTranslateX.value = -(panelWidth - indicatorWidth);
    translateX.value = wasCollapsed
        ? minTranslateX.value
        : clamp(translateX.value, minTranslateX.value, 0);
    if (!boundsReady.value) {
        requestAnimationFrame(() => { boundsReady.value = true; });
    }
};

// Persist open/collapsed once the panel settles (not mid-drag)
watch([translateX, isDragging], ([x, dragging]) => {
    if (dragging || !minTranslateX.value) {
        return;
    }
    if (x === minTranslateX.value) {
        setDesktopCollapsed(true);
    } else if (x === 0) {
        setDesktopCollapsed(false);
    }
});

const snapPanel = () => {
    const midpoint = minTranslateX.value / 2;
    translateX.value = translateX.value < midpoint ? minTranslateX.value : 0;
};

const onPointerMove = (event) => {
    if (!isDragging.value) {
        return;
    }
    const delta = event.clientX - startPointerX;
    if (Math.abs(delta) > 3) {
        hasDragged = true;
    }
    translateX.value = clamp(startTranslateX + delta, minTranslateX.value, 0);
};

const onPointerUp = () => {
    if (!isDragging.value) {
        return;
    }
    isDragging.value = false;
    snapPanel();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
};

const onPointerDown = (event) => {
    updateBounds();
    isDragging.value = true;
    hasDragged = false;
    startPointerX = event.clientX;
    startTranslateX = translateX.value;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
};

const onToggleClick = () => {
    if (hasDragged) {
        return;
    }
    updateBounds();
    translateX.value = translateX.value === 0 ? minTranslateX.value : 0;
};

const onWheel = (event) => {
    const horizontalDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    if (horizontalDelta === 0) {
        return;
    }
    updateBounds();

    translateX.value = clamp(
        translateX.value - horizontalDelta,
        minTranslateX.value,
        0,
    );
    snapPanel();
};

let resizeObserver = null;

onMounted(() => {
    init();
    restoreCollapsed = isDesktopCollapsed();
    updateBounds();
    if (typeof ResizeObserver !== 'undefined' && panelRef.value) {
        resizeObserver = new ResizeObserver(updateBounds);
        resizeObserver.observe(panelRef.value);
    }
    window.addEventListener('resize', updateBounds);
});

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    window.removeEventListener('resize', updateBounds);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
});
</script>
<style scoped>
.sondaggio{
    display: none;
}
h2{
    margin: 0;
    font-size: 1.2rem;
    line-height: 1.25;
}
.sondaggio-inner p{
    margin: 0;
    font-size: 0.875rem;
}
.sondaggio-header{
    display: grid;
    text-wrap: balance;
    grid-template-columns: auto 1fr;
    grid-template-areas:
        'icon title'
        'icon sub';
    column-gap: 12px;
    row-gap: 2px;
    align-items: center;
    text-align: left;
}
.sondaggio-header .sondaggio-icon{
    grid-area: icon;
}
.sondaggio-header h2{
    grid-area: title;
    align-self: end;
}
.sondaggio-header p{
    grid-area: sub;
    align-self: start;
    color: var(--on-surface-variant);
}
.sondaggio-cta{
    text-align: center;
}
.sondaggio-icon{
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--on-surface-primary) 16%, transparent);
    color: var(--on-surface-primary);
    font-size: 19px;
}
@media (min-width: 1049px) and (min-height: 830px) {
    .sondaggio{
        position: absolute;
        bottom: 10px;
        left: 0;
        width: 100%;
        z-index: 120;
        color: var(--on-surface);
        display: block;
        cursor: default;
        transition: transform 0.25s ease;
        will-change: transform;
    }
    .sondaggio.dragging{
        transition: none;
    }
    .sondaggio-inner{
        border-right: 1px solid var(--primary);
        border-top: 1px solid var(--primary);
        border-bottom: 1px solid var(--primary);
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: center;
        background: var(--surface-variant);
        padding: 18px 20px;
        border-bottom-right-radius: 8px;
        border-top-right-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        gap: 16px;
    }
    .toggle-arrow{
        position: absolute;
        top: 50%;
        right: -10px;
        z-index: 121;
        transform: translateY(-50%);
        border-right: 1px solid var(--primary);
        background: var(--surface-variant);
        color: var(--on-surface);
        padding: 3px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        cursor: grab;
        touch-action: pan-y;
        user-select: none;
        overflow: hidden;
    }
    .toggle-arrow::before,
    .toggle-arrow::after{
        content: '';
        position: absolute;
        right: 0;
        width: 33%;
        height: 1px;
        background: var(--primary);
        pointer-events: none;
    }
    .toggle-arrow::before{
        top: 0;
    }
    .toggle-arrow::after{
        bottom: 0;
    }
}

</style>