<script setup>
    import Title from '@/components/common/Title.vue';
    import Team from '@/components/Team.vue';
</script>

<template>
    <div class="section" id="team-view">
        <Title title="Team" subtitle="Il Team di Fermi Notify" :showVideo="'team'" />

        <Team />
    </div>
</template>

<style src="@/assets/css/page.css"></style>