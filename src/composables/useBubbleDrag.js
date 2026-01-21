import { ref, onMounted, onUnmounted } from 'vue';

export function useBubbleDrag(containerRef, bubbleRefs) {
    const dragging = ref(null);
    const dragOffset = ref({ x: 0, y: 0 });
    const dragSection = ref(null);

    const getRandomOffset = (range = 60) => {
        // Random offset between -range/2% and range/2% from center
        return (Math.random() - 0.5) * range;
    };

    const getRandomRotation = (range = 6) => {
        // Random slight rotation between -range/2 and range/2 degrees
        return (Math.random() - 0.5) * range;
    };

    // Mouse light effect
    const handleMouseMove = (event, index, section = null) => {
        const key = section ? `${section}-${index}` : index;
        const bubble = bubbleRefs.value[key];
        if (!bubble) return;
        
        // Skip during drag
        if (section) {
            if (dragging.value === index && dragSection.value === section) return;
        } else {
            if (dragging.value === index) return;
        }
        
        const rect = bubble.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        bubble.style.setProperty('--mouse-x', `${x}px`);
        bubble.style.setProperty('--mouse-y', `${y}px`);
    };

    // Drag functions
    const startDrag = (event, index, list, section = null) => {
        // Don't start drag if clicking on a link
        if (event.target.tagName === 'A' || event.target.closest('a')) return;
        
        event.preventDefault();
        dragging.value = index;
        dragSection.value = section;
        
        const key = section ? `${section}-${index}` : index;
        const bubble = bubbleRefs.value[key];
        
        if (!bubble) return;
        
        const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX;
        const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY;
        
        // Store initial mouse position and current drag offset
        dragOffset.value = {
            startX: clientX,
            startY: clientY,
            initialDragX: list.value[index].dragX || 0,
            initialDragY: list.value[index].dragY || 0
        };
        
        bubble.classList.add('dragging');
    };

    const onDrag = (event, getList) => {
        if (dragging.value === null) return;
        
        // Prevent scrolling on touch devices while dragging
        if (event.type === 'touchmove') {
            event.preventDefault();
        }
        
        const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX;
        const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY;
        
        // Calculate delta from start position
        const deltaX = clientX - dragOffset.value.startX;
        const deltaY = clientY - dragOffset.value.startY;
        
        const list = getList(dragSection.value);
        list.value[dragging.value].dragX = dragOffset.value.initialDragX + deltaX;
        list.value[dragging.value].dragY = dragOffset.value.initialDragY + deltaY;
    };

    const endDrag = () => {
        if (dragging.value !== null) {
            const key = dragSection.value ? `${dragSection.value}-${dragging.value}` : dragging.value;
            const bubble = bubbleRefs.value[key];
            if (bubble) {
                bubble.classList.remove('dragging');
            }
        }
        dragging.value = null;
        dragSection.value = null;
    };

    const setupDragListeners = (getList) => {
        const handleDrag = (e) => onDrag(e, getList);
        
        window.addEventListener('mousemove', handleDrag);
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchmove', handleDrag, { passive: false });
        window.addEventListener('touchend', endDrag);
        
        return () => {
            window.removeEventListener('mousemove', handleDrag);
            window.removeEventListener('mouseup', endDrag);
            window.removeEventListener('touchmove', handleDrag);
            window.removeEventListener('touchend', endDrag);
        };
    };

    const processItem = (item, index, totalItems, extraProps = {}) => ({
        ...item,
        offsetX: getRandomOffset(),
        rotation: getRandomRotation(),
        delay: index * 0.1,
        zIndex: totalItems - index,
        dragX: 0,
        dragY: 0,
        ...extraProps
    });

    return {
        dragging,
        dragOffset,
        dragSection,
        getRandomOffset,
        getRandomRotation,
        handleMouseMove,
        startDrag,
        onDrag,
        endDrag,
        setupDragListeners,
        processItem
    };
}
