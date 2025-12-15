<template>
  <div class="section" id="faq-view">
    <Title title="FAQ" subtitle="Scopri come funziona Fermi Notify." />
    <TagIntro />
    <Status />
    <FaqSections />
  </div>
</template>

<script setup>
  import { onMounted, nextTick } from 'vue'
  import { useRouter } from 'vue-router'

  import Title from '@/components/Title.vue'
  import TagIntro from '@/components/TagIntro.vue'
  import Status from '@/components/Status.vue'
  import FaqSections from '@/components/FaqSections.vue'

  const router = useRouter()

  onMounted(async () => {
    // Replicate legacy EJS behavior: read `page` and `s` params, scroll to container/section, then clean URL
    const params = new URLSearchParams(window.location.search)
    const page = params.get('page')
    const section = params.get('s')
    const validPages = ['generali', 'configurazione', 'privacy']

    if (page && validPages.includes(page)) {
      // Wait for FaqSections to render and react to route.query.page (it watches the route)
      await nextTick()
      const container = document.getElementById(`${page}Container`)
      if (container) {
        const scroll = container.getBoundingClientRect().top + window.scrollY - 100
        window.scrollTo({ top: scroll, behavior: 'smooth' })
      }
    }

    if (section) {
      // Scroll to named section (offset similar to legacy code)
      await nextTick()
      const elem = document.getElementById(section)
      if (elem) {
        const scroll = elem.getBoundingClientRect().top + window.scrollY - 75
        window.scrollTo({ top: scroll, behavior: 'smooth' })
      }
    }

    // Remove query params from URL (replace state without navigation)
    try {
      // Prefer router.replace when available to keep SPA state consistent
      router.replace({ name: 'faq' })
    } catch (e) {
      // Fallback to history.replaceState
      history.replaceState({}, document.title, '/faq')
    }
  })
</script>

<style src="@/assets/css/page.css"></style>
<style src="@/assets/css/faq.css"></style>