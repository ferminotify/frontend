<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    
        <div class="sidebar">
        <div class="sidebar-inner">
            <a class="sidebar-link" id="cercaeventi" href="/">
                <span class="material-symbols-outlined">
                    search
                </span>
                <span class="sidebar-link-text">Filtra Eventi</span>
            </a>

            <a class="sidebar-link" id="login" href="/login">
                <span class="material-symbols-outlined">
                    login
                </span>
                <span class="sidebar-link-text">Accesso</span>
            </a>

            <a class="sidebar-link" id="faq" href="/faq">
                <span class="material-symbols-outlined">
                    help_center
                </span>
                <span class="sidebar-link-text">FAQ</span>
            </a>
            
            <div class="sidebar-link sidebar-menu" id="manu">
                <a class="hamburger">
                    <span class="line"></span>
                    <span class="line"></span>
                    <span class="line"></span>
                </a>
                <div class="nav-links">
                    <ul>
                        <li>
                            <a onclick="changeTheme()" class="sidebar-menu-link sidebar-menu-theme flex-center"><span class="material-symbols-outlined sidebar-theme-btn">
                                light_mode
                            </span></a>
                        </li>
                        <li>
                            <div class="sidebar-link sidebar-contatti">
                                <a href="https://www.instagram.com/ferminotify/" target="_blank"><font-awesome-icon :icon="['fab', 'instagram']" /></a>
                                <a href="https://github.com/ferminotify" target="_blank"><font-awesome-icon :icon="['fab', 'github']" /></a>
                            </div>
                        </li>
                    </ul>
                </div>
                <span class="sidebar-link-text">Menu</span>
            </div>
        </div>
        <div class="sidebar-theme-container sidebar-desktop">
            <a onclick="changeTheme()" class="sidebar-theme"><span class="material-symbols-outlined sidebar-theme-btn">
                light_mode
            </span></a>
            <div class="sidebar-link sidebar-contatti sidebar-desktop">
                <a href="https://www.instagram.com/ferminotify/" target="_blank"><font-awesome-icon :icon="['fab', 'instagram']" /></a>
                <a href="https://github.com/ferminotify" target="_blank"><font-awesome-icon :icon="['fab', 'github']" /></a>
            </div>
        </div>
    </div>

  </header>

</template>