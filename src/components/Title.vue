<template>
  <div class="rounded-container">
    <div class="rounded-inner">
      <h1 class="firstTitle">{{ title }}</h1>
      <p class="firstSubtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup>
  defineProps({
    title: String,
    subtitle: String,
  })
</script>
