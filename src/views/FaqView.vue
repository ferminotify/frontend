<template>
  <div class="section" id="faq-view">
    <Title title="FAQ" subtitle="Scopri come funziona Fermi Notify." />
    <TagIntro />
    <Status />
    <FaqSections />
  </div>
</template>

<script setup>
  import Title from '@/components/Title.vue';
  import TagIntro from '@/components/TagIntro.vue';
  import Status from '@/components/Status.vue';
  import FaqSections from '@/components/FaqSections.vue';
</script>

<style src="@/assets/css/page.css"></style>
<style src="@/assets/css/faq.css"></style>