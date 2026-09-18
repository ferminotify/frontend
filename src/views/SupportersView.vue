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
                <p style="color: var(--muted)">Se desideri essere rimosso da questa lista, contattaci su <a href="https://instagram.com/ferminotify" style="white-space: nowrap;" target="_blank" rel="noopener noreferrer"><font-awesome-icon :icon="['fab', 'instagram']" /> <i><u>ferminotify</u></i></a> / <a href="mailto:mail@fn.lkev.in" style="white-space: nowrap;" target="_blank" rel="noopener noreferrer"><font-awesome-icon :icon="['fas', 'envelope']" /> <i><u>mail@fn.lkev.in</u></i></a>.</p>
            </div>
            <Supporters />
        </div>
        <div style="text-align: center; margin: 30px 0 60px;">
            <RouterLink to="/team" class="btn outlined">Scopri il team 🌐</RouterLink>
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