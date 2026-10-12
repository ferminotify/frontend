<template>
  <div class="section page-narrow otest">
    <RouterLink to="/orario" class="back-link">
      <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
      Orario
    </RouterLink>
    <h1 class="otest-title">Test variazioni</h1>

    <form class="otest-form" @submit.prevent="run">
      <div class="material-textfield otest-field otest-field--wide">
        <textarea
          id="otest-summary"
          v-model="summary"
          rows="2"
          maxlength="500"
          spellcheck="false"
          placeholder=" "
          @keydown.enter.exact.prevent="run"
        ></textarea>
        <label for="otest-summary">Titolo dell’evento</label>
      </div>
      <div class="otest-examples" aria-label="Eventi dal calendario">
        <button v-for="ex in examples" :key="ex.summary" type="button" class="chip otest-chip" :title="ex.summary" @click="useExample(ex)">
          {{ ex.summary }}
        </button>
        <button type="button" class="chip otest-chip otest-chip--icon" aria-label="Altri eventi" title="Altri eventi" :disabled="examplesLoading" @click="loadExamples">
          <span class="material-symbols-outlined" aria-hidden="true">shuffle</span>
        </button>
      </div>
      <div class="material-textfield otest-field otest-field--fixed">
        <input id="otest-date" v-model="date" type="date" required />
        <label for="otest-date">Giorno</label>
      </div>
      <div class="material-textfield otest-field otest-field--fixed">
        <input id="otest-start" v-model="start" type="time" step="300" :disabled="allDay" />
        <label for="otest-start">Dalle</label>
      </div>
      <div class="material-textfield otest-field otest-field--fixed">
        <input id="otest-end" v-model="end" type="time" step="300" :disabled="allDay" />
        <label for="otest-end">Alle</label>
      </div>
      <label class="otest-check">
        <input v-model="allDay" type="checkbox" />
        Tutto il giorno
      </label>
    </form>

    <p v-if="error" class="otest-error" role="alert">{{ error }}</p>
    <p v-else-if="loading && !result" class="otest-muted">Analisi…</p>

    <template v-if="result">
      <section class="otest-card" :class="{ 'is-loading': loading }">
        <h2>Affidabilità della lettura</h2>
        <div class="otest-score" :class="`otest-score--${scoreTone}`">
          <span class="otest-score-num">{{ result.reading.score }}%</span>
          <span class="otest-score-bar" aria-hidden="true"><span :style="{ width: `${result.reading.score}%` }"></span></span>
        </div>
        <ul v-if="result.reading.issues.length" class="otest-issues">
          <li v-for="i in result.reading.issues" :key="i.code + i.text">
            <span class="otest-penalty">−{{ i.penalty }}</span>
            {{ i.text }}
          </li>
        </ul>
        <p v-else class="otest-muted otest-small">Nessun problema: formato atteso, classi e aule trovate.</p>
        <p v-if="result.reading.score < result.uncertainBelow" class="otest-muted otest-small">
          Sotto il {{ result.uncertainBelow }}%: nell’orario la variazione è segnata come “lettura incerta”.
        </p>
      </section>

      <section class="otest-card" :class="{ 'is-loading': loading }">
        <h2>Come viene letto</h2>
        <dl class="otest-dl">
          <dt>Tipo</dt>
          <dd>{{ kindLabel }}<strong v-if="p.cancelled"> · annullata</strong></dd>
          <dt>Classi scritte</dt>
          <dd>
            <template v-if="p.classes.length">{{ p.classes.join(', ') }}</template>
            <span v-else class="otest-muted">nessuna</span>
          </dd>
          <template v-if="p.activity">
            <dt>Attività</dt>
            <dd>{{ p.activity }}</dd>
          </template>
          <template v-if="p.group">
            <dt>Solo</dt>
            <dd>{{ p.group }}</dd>
          </template>
          <dt>Aula</dt>
          <dd>
            <template v-if="p.room">{{ p.room }}<span v-if="p.roomNumber" class="otest-muted"> (n. {{ p.roomNumber }})</span></template>
            <span v-else class="otest-muted">nessuna</span>
          </dd>
          <dt>Docenti</dt>
          <dd>
            <template v-if="p.teachers.length">{{ p.teachers.join(', ') }}</template>
            <span v-else class="otest-muted">nessuno</span>
          </dd>
          <template v-if="p.absent.length">
            <dt>Assenti</dt>
            <dd>{{ p.absent.join(', ') }}</dd>
          </template>
          <dt>Ore toccate</dt>
          <dd>
            <template v-if="result.slots.length">{{ result.slots.map(hourText).join(', ') }}</template>
            <span v-else class="otest-muted">nessuna (nota del giorno)</span>
          </dd>
        </dl>

        <ul v-if="warnings.length" class="otest-warnings">
          <li v-for="w in warnings" :key="w">
            <span class="material-symbols-outlined" aria-hidden="true">warning</span>
            {{ w }}
          </li>
        </ul>
      </section>

      <section class="otest-card" :class="{ 'is-loading': loading }">
        <h2>Riguarda</h2>
        <p v-if="!result.matches.length" class="otest-muted">Nessuna classe, aula o docente dell’orario.</p>
        <ul v-else class="otest-matches">
          <li v-for="m in result.matches" :key="`${m.type}-${m.key}`">
            <RouterLink :to="entityLink(m)" class="chip otest-chip otest-chip--link">
              <span class="material-symbols-outlined" aria-hidden="true">{{ TYPE_ICON[m.type] }}</span>
              {{ m.name }}
            </RouterLink>
          </li>
        </ul>
        <p v-if="!result.matches.some((m) => m.type === 'teacher') && p.teachers.length + p.absent.length" class="otest-muted otest-small">
          I docenti si vedono solo con l’accesso ai docenti (account @fermimn.edu.it o Moodle).
        </p>
      </section>

      <section v-for="pv in previews" :key="`${pv.entity.type}-${pv.entity.key}`" class="otest-preview" :class="{ 'is-loading': loading }">
        <h2>
          <span class="material-symbols-outlined" aria-hidden="true">{{ TYPE_ICON[pv.entity.type] }}</span>
          {{ pv.entity.type === 'room' ? pv.entity.name : `${TYPE_LABEL[pv.entity.type]} ${pv.entity.name}` }}
        </h2>
        <p v-if="!pv.cells.length && !pv.notes.length" class="otest-muted">Nessuna lezione cambia.</p>
        <ol class="otest-cells">
          <li v-for="c in pv.cells" :key="c.start" class="otest-cell-row">
            <span class="otest-hour">{{ hoursOf(c, pv.times) }}</span>
            <TimetableCell :cell="c" :entity-type="pv.entity.type" />
          </li>
        </ol>
        <p v-for="n in pv.notes" :key="n.uid" class="otest-note">
          <span class="material-symbols-outlined" aria-hidden="true">info</span>
          In “Altre variazioni del giorno”: {{ n.summary }}
        </p>
      </section>
      <p v-if="result.more" class="otest-muted">E altre {{ result.more }} (anteprima solo per le prime).</p>

      <details class="otest-raw">
        <summary>Dati grezzi (JSON)</summary>
        <pre>{{ JSON.stringify(result, null, 2) }}</pre>
      </details>
    </template>
  </div>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import TimetableCell from '@/components/orario/TimetableCell.vue'
  import { fetchTimetableExamples, fetchTimetableTest } from '@/api/timetable'
  import { cellEnd, colorSubjects, hourNumber } from '@/utils/timetable'

  const route = useRoute()
  const router = useRouter()

  // Used when the calendar cannot be read.
  const FALLBACK_EXAMPLES = [
    'CLASSE 5EELEET (ALUNNI IRC) - SALA MENSA',
    'CLASSE 3AIIN - AULA 46 - PROF. ROSSI (PROF.ssa BIANCHI: ASSENTE)',
    'CLASSE 4EAU - USCITA ANTICIPATA',
    'CLASSI 5C, 5D - USCITA DIDATTICA - PROFF. ROSSI, VERDI',
  ].map((summary) => ({ summary }))

  const KIND_LABEL = {
    change: 'Variazione (aula, docente o attività)',
    entry: 'Entrata posticipata',
    exit: 'Uscita anticipata',
    trip: 'Uscita / viaggio / PCTO (classe fuori)',
    study: 'Studio autonomo',
  }
  const TYPE_LABEL = { class: 'Classe', room: 'Aula', teacher: 'Docente' }
  const TYPE_ICON = { class: 'groups', room: 'meeting_room', teacher: 'person' }
  const TYPE_PATH = { class: 'classe', room: 'aula', teacher: 'docente' }

  const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date())
  const qs = (k, d) => (typeof route.query[k] === 'string' ? route.query[k] : d)

  // State lives in the URL: a test can be shared as a link.
  const summary = ref(qs('evento', ''))
  const date = ref(qs('giorno', today()))
  const start = ref(qs('dalle', '08:00'))
  const end = ref(qs('alle', '09:00'))
  const allDay = ref(qs('tutto', '') === '1')

  const result = ref(null)
  const loading = ref(false)
  const error = ref('')
  let seq = 0

  const p = computed(() => result.value?.parsed)
  const kindLabel = computed(() => {
    const k = p.value.kind
    return p.value.label && k !== 'change' ? `${KIND_LABEL[k] || k} · “${p.value.label}”` : KIND_LABEL[k] || k
  })

  const scoreTone = computed(() => {
    const s = result.value?.reading.score ?? 100
    return s >= 90 ? 'good' : s >= result.value.uncertainBelow ? 'mid' : 'low'
  })

  const warnings = computed(() => {
    const r = result.value
    if (!r) return []
    const out = []
    const classMatches = r.matches.filter((m) => m.type === 'class')
    if (!p.value.classes.length && !p.value.room && !p.value.teachers.length && !p.value.absent.length) {
      out.push('Nessuna classe, aula o docente riconosciuto: l’evento non apparirà in nessun orario.')
    }
    if (p.value.classes.length && !classMatches.length) {
      out.push(`Classe “${p.value.classes.join(', ')}” non trovata nell’orario della scuola.`)
    }
    for (const c of p.value.classes) {
      const fuzzy = classMatches.filter((m) => m.key !== c && !m.key.startsWith(`${c}GRUPPO`))
      if (fuzzy.length) out.push(`“${c}” associata a ${fuzzy.map((m) => m.name).join(', ')} per somiglianza (nome quasi uguale).`)
    }
    if (p.value.room && !r.matches.some((m) => m.type === 'room')) {
      out.push(`Aula “${p.value.room}” non trovata nell’orario: la classe risulta spostata lì, ma la pagina dell’aula non cambia.`)
    }
    if (p.value.cancelled) out.push('Il titolo dice che è annullata: non viene applicata all’orario.')
    if (p.value.group) out.push(`Riguarda solo ${p.value.group}: nell’orario è mostrata come variazione per tutta la classe, con la nota “Solo ${p.value.group}”.`)
    return out
  })

  // Previews: colours as in the timetable (by subject).
  const previews = computed(() =>
    (result.value?.previews || []).map((pv) => {
      const week = colorSubjects({ days: [{ cells: pv.cells.map((c) => ({ ...c })) }] })
      return { ...pv, cells: week.days[0].cells }
    })
  )

  const hourText = (t) => {
    const n = hourNumber(t)
    return n ? `${n}ª (${t})` : t
  }
  function hoursOf(cell, times) {
    const a = hourNumber(cell.slots[0])
    const b = hourNumber(cell.slots[cell.slots.length - 1])
    const label = a ? (b && b !== a ? `${a}ª–${b}ª` : `${a}ª`) : ''
    return `${label} ${cell.slots[0]}–${cellEnd(cell, times)}`.trim()
  }
  const entityLink = (m) => ({ path: `/orario/${TYPE_PATH[m.type]}/${m.key.toLowerCase()}`, query: { settimana: date.value } })

  // Examples: random events from the calendar, with their own day and hours.
  const examples = ref([])
  const examplesLoading = ref(false)
  async function loadExamples() {
    examplesLoading.value = true
    try {
      const { examples: list } = await fetchTimetableExamples()
      examples.value = list.length ? list : FALLBACK_EXAMPLES
    } catch {
      if (!examples.value.length) examples.value = FALLBACK_EXAMPLES
    } finally {
      examplesLoading.value = false
    }
  }
  onMounted(loadExamples)

  function useExample(ex) {
    summary.value = ex.summary
    if (!ex.date) return
    date.value = ex.date
    allDay.value = ex.allDay || !ex.start
    if (ex.start) {
      start.value = ex.start
      end.value = ex.end || ex.start
    }
  }

  async function run() {
    const s = summary.value.trim()
    router.replace({
      query: s ? { evento: s, giorno: date.value, ...(allDay.value ? { tutto: '1' } : { dalle: start.value, alle: end.value }) } : {},
    })
    if (!s || !date.value) {
      result.value = null
      error.value = ''
      return
    }
    const id = ++seq
    loading.value = true
    try {
      const r = await fetchTimetableTest({ summary: s, date: date.value, start: start.value, end: end.value, allDay: allDay.value })
      if (id !== seq) return
      result.value = r
      error.value = ''
    } catch (e) {
      if (id !== seq) return
      error.value = e.message
    } finally {
      if (id === seq) loading.value = false
    }
  }

  // Live: re-run shortly after each change.
  let timer = null
  watch(
    [summary, date, start, end, allDay],
    () => {
      clearTimeout(timer)
      timer = setTimeout(run, 400)
    },
    { immediate: true }
  )
</script>

<style scoped>
  .otest {
    --page-max: 820px;
  }
  .otest-title {
    margin: 16px 0 24px;
    font-size: 1.75rem;
  }

  .otest-form {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    gap: 18px 12px;
    align-items: end;
    margin-bottom: 20px;
  }
  .otest-field {
    min-width: 0;
  }
  .otest-field--wide,
  .otest-examples {
    grid-column: 1 / -1;
  }
  .otest-field input,
  .otest-field textarea {
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
    color-scheme: light dark;
  }
  /* The site's .material-textfield textarea, in monospace: the title as typed in the calendar */
  .otest-field textarea {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.875rem;
  }
  .otest-field--fixed label {
    top: 0;
    transform: translateY(-50%) scale(0.9);
  }
  .otest-field input:disabled {
    opacity: 0.5;
  }
  .otest-check {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-bottom: 10px;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .otest-examples {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: -4px;
  }
  /* .chip (style.css) + the pill shape of this page */
  .otest-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 999px;
    color: var(--on-surface-variant);
    font-size: 0.75rem;
    text-decoration: none;
  }
  .otest-chip:hover {
    color: var(--on-surface);
    border-color: var(--on-surface-variant);
  }
  .otest-chip--link {
    font-size: 0.875rem;
    color: var(--on-surface);
  }
  .otest-chip--icon {
    padding: 4px 8px;
  }
  .otest-chip:disabled {
    opacity: 0.5;
    cursor: progress;
  }
  .otest-chip .material-symbols-outlined {
    font-size: 16px;
  }

  .otest-card,
  .otest-preview {
    margin-bottom: 16px;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid var(--divider);
    transition: opacity 150ms ease;
  }
  .is-loading {
    opacity: 0.6;
  }
  .otest-card h2,
  .otest-preview h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 12px;
    font-size: 1rem;
  }
  .otest-preview h2 .material-symbols-outlined {
    font-size: 20px;
    color: var(--on-surface-variant);
  }
  .otest-score {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .otest-score-num {
    font-size: 1.5rem;
    font-weight: 700;
    min-width: 3.5em;
  }
  .otest-score-bar {
    flex: 1;
    height: 8px;
    border-radius: 999px;
    background: var(--surface-variant);
    overflow: hidden;
  }
  .otest-score-bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--score);
    transition: width 200ms ease;
  }
  .otest-score--good {
    --score: var(--success);
  }
  .otest-score--mid {
    --score: var(--warning);
  }
  .otest-score--low {
    --score: var(--error);
  }
  .otest-issues {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.875rem;
  }
  .otest-penalty {
    display: inline-block;
    min-width: 2.6em;
    color: var(--error);
    font-variant-numeric: tabular-nums;
  }
  .otest-dl {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 6px 16px;
    margin: 0;
    font-size: 0.875rem;
  }
  .otest-dl dt {
    color: var(--on-surface-variant);
  }
  .otest-dl dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .otest-warnings {
    list-style: none;
    margin: 14px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.875rem;
  }
  .otest-warnings li {
    display: flex;
    gap: 6px;
    align-items: flex-start;
  }
  .otest-warnings .material-symbols-outlined {
    font-size: 18px;
    color: var(--warning);
  }
  .otest-matches {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .otest-cells {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .otest-cell-row {
    display: grid;
    grid-template-columns: 110px minmax(0, 360px);
    gap: 12px;
    align-items: start;
  }
  .otest-hour {
    padding-top: 10px;
    font-size: 0.8125rem;
    color: var(--on-surface-variant);
  }
  .otest-note {
    display: flex;
    gap: 6px;
    margin: 8px 0 0;
    font-size: 0.875rem;
    color: var(--on-surface-variant);
  }
  .otest-note .material-symbols-outlined {
    font-size: 18px;
  }
  .otest-muted {
    color: var(--muted);
  }
  .otest-small {
    margin: 10px 0 0;
    font-size: 0.8125rem;
  }
  .otest-error {
    color: var(--error);
  }
  .otest-raw {
    margin: 8px 0 40px;
    font-size: 0.8125rem;
    color: var(--on-surface-variant);
  }
  .otest-raw pre {
    max-height: 360px;
    overflow: auto;
    padding: 12px;
    border-radius: 12px;
    background: var(--surface-variant);
    font-size: 0.75rem;
  }

  @media (max-width: 600px) {
    .otest-form {
      grid-template-columns: 1fr 1fr;
    }
    .otest-form .otest-field:first-of-type + .otest-examples + .otest-field {
      grid-column: 1 / -1;
    }
    .otest-cell-row {
      grid-template-columns: 1fr;
      gap: 4px;
    }
    .otest-hour {
      padding-top: 0;
    }
  }
</style>
