<script setup>
import Title from '@/components/common/Title.vue';
import Donate from '@/components/common/Donate.vue';
import Supporters from '@/components/Supporters.vue';
</script>

<template>

    <div class="section" id="supporters-view">
        <Title title="Sostenitori di Fermi Notify" subtitle="GRAZIE ❤️" :showVideo="'supporter'" />
        <div class="supporter-content">
            <aside class="supporter-donate">
                <Donate :hide-donators="true" />
                <p class="removal-note">
                    Se desideri essere rimosso da questa lista, contattaci su
                    <a class="link" href="https://instagram.com/ferminotify" target="_blank" rel="noopener noreferrer"><font-awesome-icon :icon="['fab', 'instagram']" /> ferminotify</a>
                    o
                    <a class="link" href="mailto:mail@fn.lkev.in"><font-awesome-icon :icon="['fas', 'envelope']" /> mail@fn.lkev.in</a>.
                </p>
            </aside>
            <Supporters />
        </div>
        <div class="supporter-footer">
            <RouterLink to="/team" class="btn outlined btn-icon">
                <span class="material-symbols-outlined" aria-hidden="true">group</span>
                Scopri il team
            </RouterLink>
        </div>
    </div>
</template>

<style src="@/assets/css/page.css"></style>
<style scoped>
    .supporter-content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 40px;
        align-items: start;
        margin-top: 32px;
        padding: 0 20px;
    }
    .supporter-donate {
        position: sticky;
        top: 24px;
        text-align: center;
    }
    .removal-note {
        margin: 0;
        font-size: 0.85rem;
        line-height: 1.6;
        color: var(--on-surface-variant);
    }
    .removal-note a {
        white-space: nowrap;
        text-decoration: underline;
        text-underline-offset: 3px;
    }
    .supporter-footer {
        display: flex;
        justify-content: center;
        margin: 56px 0 60px;
    }
    .btn-icon {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
    }
    .btn-icon .material-symbols-outlined {
        font-size: 20px;
    }
    .btn-icon:active {
        transform: scale(0.98);
    }
    @media screen and (max-width: 900px) {
        .supporter-content {
            grid-template-columns: minmax(0, 1fr);
            padding: 0 16px;
        }
        .supporter-donate {
            position: static;
        }
    }
</style>
