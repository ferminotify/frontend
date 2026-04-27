<template>
    <div
        ref="panelRef"
        class="sondaggio"
        :class="{ dragging: isDragging, collapsed: !showFeedback }"
        :style="panelStyle"
        @wheel.prevent="onWheel"
    >
        <div class="sondaggio-inner">
            <h2>Racconta la <span style="white-space: nowrap;">tua esperienza</span></h2>
            <p>Aiutaci a migliorare con questo breve sondaggio <span style="white-space: nowrap;">(< 1 minuto)</span></p>
            <RouterLink to="/feedback" class="btn filled" style="margin-top: 5px;">
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
                {{ handleIcon }}
            </span>
        </div>
    </div>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const STORAGE_KEY = 'show_feedback';

const panelRef = ref(null);
const indicatorRef = ref(null);
const isDragging = ref(false);
const showFeedback = ref(true);

let dragStartY = 0;
let dragDeltaY = 0;

const handleIcon = computed(() => (showFeedback.value ? 'keyboard_arrow_up' : 'keyboard_arrow_down'));

const panelStyle = computed(() => (showFeedback.value ? { transform: 'translateY(0)' } : { transform: 'translateY(0)' }));

const persistVisibility = () => {
    localStorage.setItem(STORAGE_KEY, String(showFeedback.value));
};

const setVisibility = (visible) => {
    if (showFeedback.value === visible) {
        return;
    }

    showFeedback.value = visible;
    persistVisibility();
};

const onToggleClick = () => {
    setVisibility(!showFeedback.value);
};

const onWheel = (event) => {
    if (event.deltaY > 0) {
        setVisibility(false);
    } else if (event.deltaY < 0) {
        setVisibility(true);
    }
};

const onPointerMove = (event) => {
    dragDeltaY = event.clientY - dragStartY;
};

const onPointerUp = () => {
    const minSwipeDistance = 16;
    isDragging.value = false;

    if (dragDeltaY > minSwipeDistance) {
        setVisibility(false);
    } else if (dragDeltaY < -minSwipeDistance) {
        setVisibility(true);
    }

    dragDeltaY = 0;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
};

const onPointerDown = (event) => {
    isDragging.value = true;
    dragStartY = event.clientY;
    dragDeltaY = 0;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
};

onMounted(() => {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (storedValue === 'false') {
        showFeedback.value = false;
    } else if (storedValue === 'true') {
        showFeedback.value = true;
    } else {
        localStorage.setItem(STORAGE_KEY, 'true');
        showFeedback.value = true;
    }
});

onBeforeUnmount(() => {
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
}
@media (max-width: 1048px), (max-height: 829px) {
    .sondaggio{
        position: relative;
        left: 0;
        width: 100%;
        margin-left: auto;
        margin-right: auto;
        padding-bottom: 18px;
        z-index: 1;
        color: var(--on-surface);
        display: block;
        cursor: default;
        transition: transform 0.25s ease;
        will-change: transform;
        max-width: 500px;
    }
    .sondaggio-inner{
        border-right: 1px solid var(--primary);
        border-left: 1px solid var(--primary);
        border-bottom: 1px solid var(--primary);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--surface-variant);
        padding: 20px;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        text-align: center;
        gap: 10px;
        max-height: 250px;
        overflow: hidden;
        opacity: 1;
        transition: max-height 0.25s ease, padding 0.25s ease, opacity 0.2s ease, border-width 0.2s ease;
    }
    .sondaggio.collapsed .sondaggio-inner{
        max-height: 14px;
        padding-top: 2px;
        padding-bottom: 2px;
        opacity: 1;
        pointer-events: none;
    }
    .sondaggio.collapsed .sondaggio-inner > *{
        opacity: 0;
        transform: translateY(-8px);
        transition: opacity 0.15s ease, transform 0.2s ease;
    }
    .toggle-arrow{
        position: absolute;
        left: 50%;
        bottom: 0;
        z-index: 121;
        transform: translateX(-50%);
        border-bottom: 1px solid var(--primary);
        background: var(--surface-variant);
        color: var(--on-surface);
        padding: 3px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        cursor: ns-resize;
        touch-action: pan-x;
        user-select: none;
        overflow: hidden;
    }
    .toggle-arrow::before,
    .toggle-arrow::after{
        content: '';
        position: absolute;
        bottom: 0;
        width: 1px;
        height: 56%;
        background: var(--primary);
        pointer-events: none;
    }
    .toggle-arrow::before{
        left: 0;
    }
    .toggle-arrow::after{
        right: 0;
    }
    .toggle-arrow .material-symbols-outlined{
        font-size: 22px;
    }
}

</style>