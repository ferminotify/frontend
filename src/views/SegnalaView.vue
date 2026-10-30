<template>
  <div class="section page-narrow segnala">
    <RouterLink :to="backTo" class="back-link">
      <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
      Torna all’orario
    </RouterLink>

    <h1 class="segnala-title">Segnala un problema</h1>

    <form class="segnala-form" novalidate @submit.prevent="submit">
      <section v-if="cell" class="segnala-lesson" aria-label="Lezione segnalata">
        <p class="segnala-lesson-meta">{{ metaLine }}</p>
        <div class="segnala-lesson-card">
          <TimetableCell :cell="cell" :entity-type="cellEntityType" />
        </div>
      </section>

      <section v-else-if="contextRows.length" class="segnala-context" aria-label="Orario segnalato">
        <h2>Cosa stavi guardando</h2>
        <dl>
          <template v-for="row in contextRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </template>
        </dl>
      </section>

      <div class="material-textfield segnala-text">
        <textarea
          id="segnala-description"
          ref="descriptionEl"
          v-model="description"
          rows="4"
          required
          placeholder=" "
        ></textarea>
        <label for="segnala-description">Descrivi il problema</label>
      </div>

      <div class="segnala-field">
        <span id="segnala-shot-label">Screenshot <em>facoltativo</em></span>
        <div v-if="shot" class="segnala-shot">
          <img :src="shot.preview" alt="Anteprima dello screenshot" />
          <button type="button" class="btn text" @click="removeShot">
            <span class="material-symbols-outlined" aria-hidden="true">delete</span>
            Rimuovi
          </button>
        </div>
        <label v-else class="segnala-upload" :class="{ 'is-busy': shotBusy }">
          <span class="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span>
          {{ shotBusy ? 'Preparazione…' : 'Aggiungi un’immagine' }}
          <input type="file" accept="image/*" aria-labelledby="segnala-shot-label" :disabled="shotBusy" @change="pickShot" />
        </label>
      </div>

      <div class="material-textfield segnala-text">
        <input id="segnala-email" v-model="email" type="email" name="email" autocomplete="email" maxlength="200" placeholder=" " />
        <label for="segnala-email">Email (facoltativa)</label>
      </div>

      <!-- Honeypot: hidden from people, bots fill it in -->
      <label class="segnala-hp" aria-hidden="true">
        Sito web
        <input v-model="website" type="text" name="website" tabindex="-1" autocomplete="off" />
      </label>

      <p v-if="error" class="segnala-error" role="alert">{{ error }}</p>

      <div class="segnala-actions">
        <!-- Same loading grid as the login button; size kept while it spins -->
        <button ref="submitEl" type="submit" class="btn filled submit-btn" :style="busySize" :disabled="shotBusy" :aria-busy="busy">
          <div v-if="busy" class="submit-lds-grid" aria-label="Invio…"><div v-for="n in 9" :key="n"></div></div>
          <template v-else>Invia segnalazione</template>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import { sendTimetableReport } from '@/api/timetable'
  import TimetableCell from '@/components/orario/TimetableCell.vue'
  import { describeCell } from '@/utils/timetable'
  import { generateAlert } from '@/utils/alertbanner'

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()

  const q = (key) => (typeof route.query[key] === 'string' ? route.query[key].slice(0, 2000) : '')

  // Only back to the timetable (no open redirect through ?da=).
  const backTo = computed(() => (/^\/orario(\/|\?|$)/.test(q('da')) ? q('da') : '/orario'))

  const CONTEXT = [
    ['chi', 'entity', 'Orario'],
    ['giorno', 'date', 'Giorno'],
    ['ora', 'time', 'Ora'],
    ['materia', 'subject', 'Materia'],
    ['dettaglio', 'detail', 'Aula / classe'],
    ['docenti', 'teachers', 'Docenti'],
    ['stato', 'status', 'Stato'],
    ['variazioni', 'variations', 'Variazioni'],
  ]
  const contextRows = computed(() => CONTEXT.map(([key, , label]) => ({ label, value: q(key) })).filter((r) => r.value))

  // The lesson, as shown in the timetable: passed by the timetable page in history.state
  // (kept on reload). Missing when the page is opened from a link: then the text rows.
  const cell = ref(null)
  const cellEntityType = ref('class')
  const metaLine = computed(() => [q('chi'), q('giorno'), q('ora')].filter(Boolean).join(' · '))

  function readCell() {
    const state = typeof window !== 'undefined' ? window.history.state : null
    const c = state?.reportCell
    if (!c || typeof c !== 'object' || !Array.isArray(c.slots) || !Array.isArray(c.variations)) return
    cell.value = c
    cellEntityType.value = ['class', 'room', 'teacher'].includes(state.reportEntityType) ? state.reportEntityType : 'class'
  }

  /** Card data for the email (rendered by the backend with email-safe styles). */
  function cardForEmail() {
    if (!cell.value) return null
    const view = describeCell(cell.value, cellEntityType.value)
    return {
      badge: view.badge,
      title: view.title,
      titleStruck: Boolean(view.titleStruck),
      lines: view.lines,
      original: view.original,
      tone: view.tone,
      plain: Boolean(view.plain),
      color: cell.value.color,
      raw: cell.value.variations.map((v) => v.summary),
    }
  }

  const description = ref('')
  const email = ref('')
  const website = ref('')
  const busy = ref(false)
  const submitEl = ref(null)
  const busySize = ref(null)
  const error = ref('')
  const descriptionEl = ref(null)

  onMounted(async () => {
    readCell()
    if (userStore.token && !userStore.user) await userStore.fetchProfile().catch(() => {})
    if (!email.value && userStore.user?.email) email.value = userStore.user.email
  })

  // --- screenshot: shrunk in the browser (max 1920px, WebP/JPEG) to keep the email small ---
  const MAX_SIDE = 1920
  const MAX_BYTES = 3.5 * 1024 * 1024
  const shot = ref(null) // { data: base64, preview: objectURL }
  const shotBusy = ref(false)

  const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))
  const toBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result).split(',')[1])
      r.onerror = reject
      r.readAsDataURL(blob)
    })

  async function shrink(file) {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    for (const quality of [0.85, 0.7, 0.5]) {
      let blob = await toBlob(canvas, 'image/webp', quality)
      if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality) // Safari: no WebP encoder
      if (blob && blob.size <= MAX_BYTES) return blob
    }
    throw new Error('too big')
  }

  async function pickShot(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    error.value = ''
    if (!file.type.startsWith('image/')) {
      error.value = 'Scegli un’immagine (PNG, JPEG, …).'
      return
    }
    shotBusy.value = true
    try {
      const blob = await shrink(file)
      shot.value = { data: await toBase64(blob), preview: URL.createObjectURL(blob) }
    } catch {
      error.value = 'Non riesco a leggere questa immagine, prova con un’altra.'
    } finally {
      shotBusy.value = false
    }
  }
  function removeShot() {
    if (shot.value) URL.revokeObjectURL(shot.value.preview)
    shot.value = null
  }

  async function submit() {
    if (busy.value) return // not disabled while sending: keeps the filled look, like login
    error.value = ''
    if (!description.value.trim()) {
      error.value = 'Descrivi il problema.'
      await nextTick()
      descriptionEl.value?.focus()
      return
    }
    const { width, height } = submitEl.value?.getBoundingClientRect() || {}
    busySize.value = width ? { width: `${width}px`, height: `${height}px` } : null
    busy.value = true
    try {
      const context = Object.fromEntries(CONTEXT.map(([key, field]) => [field, q(key)]).filter(([, v]) => v))
      context.url = typeof window !== 'undefined' ? new URL(backTo.value, window.location.origin).href : backTo.value
      await sendTimetableReport({
        context,
        card: cardForEmail(),
        description: description.value,
        email: email.value.trim(),
        screenshot: shot.value ? { data: shot.value.data } : null,
        website: website.value,
      })
      removeShot()
      generateAlert('success', 'Segnalazione inviata')
      router.replace(backTo.value)
    } catch (e) {
      error.value = e.message
    } finally {
      busy.value = false
      busySize.value = null
    }
  }
</script>

<style scoped>
  .segnala-title {
    margin: 16px 0 24px;
    font-size: 1.75rem;
  }

  .segnala-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .segnala-lesson-meta {
    margin: 0 0 8px;
    font-size: 0.875rem;
    color: var(--on-surface-variant);
  }
  .segnala-lesson-card {
    max-width: 360px;
  }
  .segnala-context {
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid var(--divider);
    background: var(--surface-variant);
  }
  .segnala-context h2 {
    margin: 0 0 10px;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--on-surface-variant);
  }
  .segnala-context dl {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 6px 16px;
    margin: 0;
    font-size: 0.875rem;
  }
  .segnala-context dt {
    color: var(--on-surface-variant);
  }
  .segnala-context dd {
    margin: 0;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  .segnala-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  .segnala-field em {
    font-style: normal;
    font-weight: 400;
    color: var(--muted);
    margin-left: 4px;
  }
  .segnala-text input,
  .segnala-text textarea {
    width: 100%;
    box-sizing: border-box;
  }

  .segnala-upload {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 18px 12px;
    border-radius: 12px;
    border: 1px dashed var(--divider);
    color: var(--on-surface-variant);
    font-weight: 400;
    cursor: pointer;
    position: relative;
  }
  .segnala-upload:hover,
  .segnala-upload:focus-within {
    border-color: var(--on-surface-variant);
    color: var(--on-surface);
  }
  .segnala-upload.is-busy {
    cursor: progress;
  }
  .segnala-upload input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: inherit;
  }
  .segnala-shot {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }
  .segnala-shot img {
    max-width: min(100%, 320px);
    max-height: 240px;
    border-radius: 10px;
    border: 1px solid var(--divider);
    object-fit: contain;
  }
  .segnala-shot .btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .segnala-hp {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .segnala-error {
    margin: 0;
    color: var(--error);
    font-size: 0.875rem;
  }
  .segnala-actions {
    display: flex;
    justify-content: flex-end;
  }

</style>
