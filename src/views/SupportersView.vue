<script setup>
import Title from '@/components/common/Title.vue';
import Donate from '@/components/common/Donate.vue';
import Supporters from '@/components/Supporters.vue';
</script>

<template>

    <div class="section" id="supporters-view">
        <Title title="Sostenitori di Fermi Notify" subtitle="GRAZIE ❤️" :showVideo="'supporter'" />
        <div class="supporter-content">
            <div style="text-align: center;">
                <Donate hide-donators="true"/>
            </div>
            <Supporters />
        </div>
    </div>
</template>

<style src="@/assets/css/page.css"></style>
<style scoped>
    .supporter-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
    @media screen and (max-width: 820px) {
        .supporter-content {
            grid-template-columns: 1fr;
        }
    }
</style>