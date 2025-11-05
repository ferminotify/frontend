<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="sidebar">
      <div class="sidebar-inner">
        <RouterLink class="sidebar-link" id="cercaeventi" to="/">
          <span class="material-symbols-outlined"> search </span>
          <span class="sidebar-link-text">Cerca Eventi</span>
        </RouterLink>

        <RouterLink class="sidebar-link" id="login" to="/login">
          <span class="material-symbols-outlined"> login </span>
          <span class="sidebar-link-text">Accesso</span>
        </RouterLink>

        <RouterLink class="sidebar-link" id="faq" to="/faq">
          <span class="material-symbols-outlined"> help_center </span>
          <span class="sidebar-link-text">FAQ</span>
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
