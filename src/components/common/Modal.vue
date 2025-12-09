<template>
    <div :class="['modal-out', { 'modal-out--visible': modalVisible }]">
        <div :class="['modal', { 'modal--visible': modalVisible }]" role="dialog" aria-modal="true" @keydown.esc.prevent="onCancel" ref="modalRef" tabindex="-1">
            <h1 class="modal-title">{{ title }}</h1>

            <div class="modal-body">
                <!-- allow parent to pass custom content via default slot -->
                <slot>
                    <p v-if="subject">{{ subject }}</p>
                    <p v-else>{{ text }}</p>
                </slot>
            </div>

            <div class="modal-actions">
                <button class="btn text" @click="onCancel">{{ cancelLabel }}</button>
                <button class="btn filled" @click="onConfirm">{{ confirmLabel }}</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted, onBeforeUnmount, ref, nextTick } from 'vue'

const props = defineProps({
    title: { type: String, default: 'Conferma' },
    text: { type: String, default: '' },
    subject: { type: String, default: '' },
    confirmLabel: { type: String, default: 'Conferma' },
    cancelLabel: { type: String, default: 'Annulla' }
})

const emit = defineEmits(['confirm', 'cancel'])

function onConfirm() {
    startClose('confirm')
}

function onCancel() {
    startClose('cancel')
}

// also listen globally for Escape in case focus is outside modal
function onKeydown(e) {
    if (e.key === 'Escape') onCancel()
}

onMounted(() => {
    window.addEventListener('keydown', onKeydown)
    document.body.classList.add('modal-open')
})
onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    document.body.classList.remove('modal-open')
})



// control entrance animation
const modalVisible = ref(false)

// helper: wait for a transition end (fallback to timeout)
function waitForTransitionEnd(el, timeout = 500) {
    return new Promise((resolve) => {
        if (!el) return setTimeout(resolve, 0)
        let called = false
        const handler = (e) => {
            if (e.propertyName && e.propertyName.indexOf('transform') !== -1) {
                if (!called) {
                    called = true
                    el.removeEventListener('transitionend', handler)
                    resolve()
                }
            }
        }
        el.addEventListener('transitionend', handler)
        // fallback
        setTimeout(() => {
            if (!called) {
                called = true
                el.removeEventListener('transitionend', handler)
                resolve()
            }
        }, timeout)
    })
}

// orchestrate closing: scroll modal down, play slide-down, then emit
async function startClose(action) {
    try {
        const el = modalRef && modalRef.value
        // start slide-down animation immediately so UI feels responsive
        modalVisible.value = false
        // optionally jump-scroll the modal content to bottom (no smooth) so it doesn't retain odd position
        try {
            if (el) {
                if (typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight || 0, behavior: 'auto' })
                else el.scrollTop = el.scrollHeight || 0
            }
        } catch (e) {
            // ignore
        }
        // wait for transition to finish
        await waitForTransitionEnd(el, 420)
    } catch (e) {
        // ignore
    }
    // finally emit the requested action
    if (action === 'confirm') emit('confirm')
    else emit('cancel')
}

onMounted(() => {
    // trigger CSS transition on next tick
    nextTick(() => {
        modalVisible.value = true
        // focus the dialog so it receives keyboard events and is announced by screen readers
        try {
            if (modalRef && modalRef.value && typeof modalRef.value.focus === 'function') {
                modalRef.value.focus()
            }
        } catch (e) {
            // ignore focus errors
        }
        // ensure the modal container scrolls to top so only modal content moves
        try {
            if (modalRef && modalRef.value && typeof modalRef.value.scrollTo === 'function') {
                modalRef.value.scrollTo({ top: 0, behavior: 'smooth' })
            } else if (modalRef && modalRef.value) {
                modalRef.value.scrollTop = 0
            }
        } catch (e) {
            // ignore
        }
    })
})

const modalRef = ref(null)
</script>

<style scoped>
.modal-out {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 999;
    transition: background-color 200ms ease-in;
}
.modal-out.modal-out--visible {
    background-color: rgba(0, 0, 0, 0.8);
}
.modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--surface);
    width: fit-content;
    max-width: 800px;
    padding: 35px 50px;
    border-radius: 15px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 250px;
    min-height: 150px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    color: var(--on-surface);
    transform: translateY(100%);
    margin-bottom: 10px;
    opacity: 0;
    transition: transform 320ms cubic-bezier(.2,.9,.2,1), opacity 200ms ease-in;
}

.modal-title {
    width: 100%;
    display: flex;
    align-items: flex-start;
    margin: 0 0 25px 0;
    font-size: 1.5em;
    color: var(--on-surface);
}

.modal.modal--visible {
    transform: translateY(0);
    opacity: 1;
}

.modal-actions{
    display: flex;
    justify-content: flex-end;
    width: 100%;
    gap: 15px;
    margin-top: 25px;
}
</style>

<style>
/* apply globally so body overflow is controlled while modal is open */
body.modal-open {
    overflow: hidden !important;
}
</style>