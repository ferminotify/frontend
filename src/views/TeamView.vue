<script setup>
    import Title from '@/components/common/Title.vue';
    import Team from '@/components/Team.vue';
</script>

<template>
    <div class="section" id="team-view">
        <Title title="Team" subtitle="Il Team di Fermi Notify" :showVideo="'team'" />
        <p style="line-height: 2.2rem">Fermi Notify è interamente sviluppato da studenti ed ex-studenti dell'IS E. Fermi Mantova senza scopo di lucro.</p>
        <p style="text-align: right;">Un progetto open source: <a href="https://github.com/ferminotify" target="_blank" rel="noopener noreferrer" class="link">GitHub</a>.</p>
        <Team />
    </div>
</template>

<style src="@/assets/css/page.css"></style>