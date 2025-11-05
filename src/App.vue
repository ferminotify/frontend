<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
const isDashboard = computed(() => route.path.startsWith('/dashboard'))
const isAuthActive = computed(
  () => route.path === '/login' || route.path === '/register' || isDashboard.value,
)
const authTo = computed(() => (isDashboard.value ? '/dashboard' : '/login'))
const authIcon = computed(() => (isDashboard.value ? 'space_dashboard' : 'login'))
const authLabel = computed(() => (isDashboard.value ? 'Dashboard' : 'Accesso'))
</script>

<template>
  <header>
    <div class="sidebar">
      <div class="sidebar-inner">
        <RouterLink to="/" custom v-slot="{ href, navigate, isExactActive }">
          <a
            :href="href"
            @click="navigate"
            class="sidebar-link"
            id="cercaeventi"
            :class="{ active: isExactActive }"
          >
            <span class="material-symbols-outlined sidebar-icon"> search </span>
            <span class="sidebar-link-text">Cerca Eventi</span>
          </a>
        </RouterLink>

        <RouterLink :to="authTo" custom v-slot="{ href, navigate }">
          <a
            :href="href"
            @click="navigate"
            class="sidebar-link"
            id="login"
            :class="{ active: isAuthActive }"
          >
            <span class="material-symbols-outlined sidebar-icon"> {{ authIcon }} </span>
            <span class="sidebar-link-text">{{ authLabel }}</span>
          </a>
        </RouterLink>

        <RouterLink to="/faq" custom v-slot="{ href, navigate, isExactActive }">
          <a
            :href="href"
            @click="navigate"
            class="sidebar-link"
            id="faq"
            :class="{ active: isExactActive }"
          >
            <span class="material-symbols-outlined sidebar-icon"> help_center </span>
            <span class="sidebar-link-text">FAQ</span>
          </a>
        </RouterLink>

        <div class="sidebar-link sidebar-contatti">
          <a href="https://www.instagram.com/ferminotify/" target="_blank"
            ><font-awesome-icon :icon="['fab', 'instagram']"
          /></a>
          <a href="https://github.com/ferminotify" target="_blank"
            ><font-awesome-icon :icon="['fab', 'github']"
          /></a>
        </div>

        <div class="sidebar-link sidebar-menu" id="manu">
          <a class="hamburger">
            <span class="line"></span>
            <span class="line"></span>
            <span class="line"></span>
          </a>
          <div class="nav-links">
            <ul>
              <li>
                <div class="sidebar-link sidebar-contatti">
                  <a href="https://www.instagram.com/ferminotify/" target="_blank"
                    ><font-awesome-icon :icon="['fab', 'instagram']"
                  /></a>
                  <a href="https://github.com/ferminotify" target="_blank"
                    ><font-awesome-icon :icon="['fab', 'github']"
                  /></a>
                </div>
              </li>
            </ul>
          </div>
          <span class="sidebar-link-text">Menu</span>
        </div>
      </div>
    </div>
  </header>

  <div class="main-container">
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>
