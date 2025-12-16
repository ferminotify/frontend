<template>
    <div class="section" id="app-view">
        <Title title="App di Fermi Notify" :showVideo="'app'" />
        <div class="content">
            <div class="section">
                <h2><span class="material-symbols-outlined">captive_portal</span> Web App</h2>
                        <div class="install-btns">
                            <button class="btn filled" @click="startInstall"><span class="material-symbols-outlined">download</span> Installa la Web App</button>
                        </div>
                    <span v-if="showInstallHelp">Installazione non riuscita? Controlla che il tuo browser supporti le Web App e che non sia già stata installata.</span>
            </div>
            <div class="section">
                <h2><span class="material-symbols-outlined">android</span> Android APK <span class="badge">COMING SOON</span></h2>
                <div class="install-btns">
                        <button class="btn filled" disabled><span class="material-symbols-outlined">apk_install</span> Scarica l'app APK</button>
                </div>
            </div>
            <div class="section">
                <h3><span class="material-symbols-outlined">help</span> Serve aiuto?</h3>
                <p style="margin: 20px 0">Contattaci su Instagram</p>
                <a href="https://www.instagram.com/ferminotify" class="btn outlined"><FontAwesomeIcon icon="fa-brands fa-instagram" class="material-space-right" /> ferminotify</a>
            </div>
        </div>
    </div>
</template>
<script setup>
    import { ref } from 'vue'
    import Title from '../components/Title.vue'
    import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

    const showInstallHelp = ref(false)

    const startInstall = async () => {
        // show the help message after the user clicks the install button
        showInstallHelp.value = true

        if (typeof window !== 'undefined' && typeof window.startPwaInstall === 'function') {
            try {
                await window.startPwaInstall()
            } catch (e) {
                console.warn('startPwaInstall failed', e)
                window.location.href = '/app'
            }
            return
        }
        // fallback
        window.location.href = '/app'
    }

</script>
<style src="@/assets/css/page.css"></style>
<style scoped>
.firstTitle, .firstSubtitle {
  color: #fff;
}
.content{
    margin-top: 50px;
}
.section{
    margin: 30px 0;
}
.section h2{
    display: flex;
    align-items: center;
    gap: 10px;
}
.section h2 .material-symbols-outlined, .section h3 .material-symbols-outlined{
    color: var(--on-surface-primary);
}
.install-btns {
    margin: 20px 30px;
}
.badge{
    background-color: var(--primary);
    color: var(--on-primary);
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 0.5em;
}
</style>