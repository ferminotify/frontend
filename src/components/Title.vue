<template>
  <div class="rounded-container title-with-video">
      <div v-if="videoSrc" class="video-bg">
        <video class="bg-video" autoplay muted loop playsinline>
          <source :src="videoSrc" type="video/mp4" />
        </video>
        <div class="video-overlay"></div>
      </div>

    <div class="rounded-inner">
      <h1 class="firstTitle">{{ title }}</h1>
      <p class="firstSubtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import bgVideoFaq from '@/assets/img/bg/Google_Mio_UsingMaterial_2400x3200.mp4'
  import bgVideoApp from '@/assets/img/bg/Google_Mio_DevelopInputOutput_1080x1080.mp4'

  const props = defineProps({
    title: String,
    subtitle: String,
    showVideo: { type: String, default: null },
  })

  const videoSrc = computed(() => {
    if (props.showVideo === 'faq') return bgVideoFaq
    if (props.showVideo === 'app') return bgVideoApp
    return null
  })
</script>

<style scoped>
.title-with-video {
  position: relative;
  overflow: hidden;
}
.video-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.bg-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.video-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35));
}
.rounded-inner {
  position: relative;
  z-index: 1;
  padding: 2rem;
}
</style>
