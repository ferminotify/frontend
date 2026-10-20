<template>
  <!-- Listbox for useKeywordSuggestions: the input owns focus, the list only takes clicks -->
  <ul v-show="show" :id="id" class="kw-suggestions" role="listbox" aria-label="Suggerimenti">
    <li
      v-for="(s, i) in suggestions"
      :id="`${id}-${i}`"
      :key="`${s.type}-${s.keyword}-${s.label}`"
      role="option"
      :aria-selected="i === activeIndex"
      class="kw-suggestion"
      :class="{ active: i === activeIndex }"
      @mousedown.prevent="emit('pick', s)"
      @mousemove="emit('hover', i)">
      <span class="material-symbols-outlined" aria-hidden="true">{{ s.type === 'teacher' ? 'person' : 'groups' }}</span>
      <span class="kw-suggestion-text">
        <strong>{{ s.keyword }}</strong>
        <small>{{ s.type === 'teacher' ? s.label : 'Classe' }}</small>
      </span>
    </li>
  </ul>
</template>

<script setup>
  defineProps({
    id: { type: String, required: true },
    show: { type: Boolean, default: false },
    suggestions: { type: Array, default: () => [] },
    activeIndex: { type: Number, default: -1 },
  })
  const emit = defineEmits(['pick', 'hover'])
</script>

<style scoped>
  .kw-suggestions {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 20;
    margin: 0;
    padding: 4px;
    list-style: none;
    text-align: left;
    border-radius: 12px;
    border: 1px solid var(--divider);
    background: var(--surface);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  }
  .kw-suggestion {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .kw-suggestion.active {
    background: var(--surface-variant);
  }
  .kw-suggestion .material-symbols-outlined {
    font-size: 20px;
    color: var(--on-surface-primary);
  }
  .kw-suggestion-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .kw-suggestion-text strong {
    font-weight: 600;
  }
  .kw-suggestion-text small {
    color: var(--on-surface-variant);
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
