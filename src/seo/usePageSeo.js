import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { absoluteUrl } from './site'

/**
 * @param {() => ({title?: string, description?: string, robots?: string, path?: string} | null)} getter
 */
export function usePageSeo(getter) {
  useHead(
    computed(() => {
      const page = getter()
      if (!page) return {}
      const meta = []
      const link = []
      if (page.title) {
        meta.push({ property: 'og:title', content: page.title }, { name: 'twitter:title', content: page.title })
      }
      if (page.description) {
        meta.push(
          { name: 'description', content: page.description },
          { property: 'og:description', content: page.description },
          { name: 'twitter:description', content: page.description },
        )
      }
      if (page.robots) meta.push({ name: 'robots', content: page.robots })
      if (page.path) {
        const url = absoluteUrl(page.path)
        meta.push({ property: 'og:url', content: url })
        link.push({ rel: 'canonical', href: url })
      }
      return { ...(page.title ? { title: page.title } : {}), meta, link }
    }),
  )
}
