<template>
  <Transition name="feedback-prompt">
    <aside v-if="visible" class="feedback-prompt" aria-labelledby="feedback-prompt-title">
      <div class="feedback-prompt-header">
        <span class="material-symbols-outlined feedback-prompt-icon" aria-hidden="true">rate_review</span>
        <h2 id="feedback-prompt-title">Racconta la <span style="white-space: nowrap;">tua esperienza</span></h2>
        <p>con questo breve sondaggio <span style="white-space: nowrap;">(&lt; 1 min)</span></p>
      </div>
      <div class="feedback-prompt-actions">
        <button type="button" class="btn text" @click="snooze">Non ora</button>
        <RouterLink to="/feedback" class="btn filled">Partecipa</RouterLink>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useFeedbackPrompt } from '@/composables/useFeedbackPrompt'

  const { visible, init, snooze } = useFeedbackPrompt()
  onMounted(init)
</script>

<style scoped>
  .feedback-prompt {
    display: none;
  }

  h2 {
    margin: 0;
    font-size: 1.2rem;
    line-height: 1.25;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
  }

  .feedback-prompt-header {
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
  .feedback-prompt-header .feedback-prompt-icon {
      grid-area: icon;
  }
  .feedback-prompt-header h2 {
      grid-area: title;
      align-self: end;
  }
  .feedback-prompt-header p {
      grid-area: sub;
      align-self: start;
      color: var(--on-surface-variant);
  }

  .feedback-prompt-icon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--on-surface-primary) 16%, transparent);
    color: var(--on-surface-primary);
    font-size: 19px;
  }

  @media (max-width: 1048px), (max-height: 829px) {
    .feedback-prompt {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: center;
      gap: 14px;
      margin: 8px auto 28px;
      max-width: 500px;
      padding: 18px 20px 14px;
      border: 1px solid var(--primary);
      border-radius: 8px;
      background: var(--surface-variant);
      color: var(--on-surface);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .feedback-prompt-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
  }

  .feedback-prompt-actions .btn.text {
    padding: 10px 4px;
  }

  .feedback-prompt-enter-active {
    transition:
      opacity 300ms cubic-bezier(0.05, 0.7, 0.1, 1),
      transform 400ms cubic-bezier(0.05, 0.7, 0.1, 1);
  }
  .feedback-prompt-leave-active {
    transition:
      opacity 150ms cubic-bezier(0.3, 0, 0.8, 0.15),
      transform 150ms cubic-bezier(0.3, 0, 0.8, 0.15);
  }
  .feedback-prompt-enter-from {
    opacity: 0;
    transform: translateY(12px);
  }
  .feedback-prompt-leave-to {
    opacity: 0;
    transform: scale(0.96);
  }

  @media (prefers-reduced-motion: reduce) {
    .feedback-prompt-enter-active,
    .feedback-prompt-leave-active {
      transition-duration: 0s;
    }
  }
</style>
