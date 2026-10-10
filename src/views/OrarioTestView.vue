<template>
  <div class="section otest">
    <RouterLink to="/orario" class="otest-back">
      <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
      Orario
    </RouterLink>
    <h1 class="otest-title">Test variazioni</h1>
    <p class="otest-intro">
      Scrivi il titolo di un evento come nel calendario: vedi come viene letto, quali classi, aule e docenti riguarda e come
      appare nell’orario. L’evento è solo una prova: non viene salvato.
    </p>

    <form class="otest-form" @submit.prevent="run">
      <label class="otest-field otest-field--wide">
        <span>Titolo dell’evento</span>
        <textarea
          v-model="summary"
          rows="2"
          maxlength="500"
          spellcheck="false"
          placeholder="CLASSE 3AIIN - AULA 46 - PROF. ROSSI (PROF.ssa BIANCHI: ASSENTE)"
          @keydown.enter.exact.prevent="run"
        ></textarea>
      </label>
      <div class="otest-examples" aria-label="Esempi">
        <button v-for="ex in EXAMPLES" :key="ex" type="button" class="otest-chip" @click="useExample(ex)">{{ ex }}</button>
      </div>
      <label class="otest-field">
        <span>Giorno</span>
        <input v-model="date" type="date" required />
      </label>
      <label class="otest-field">
        <span>Dalle</span>
        <input v-model="start" type="time" step="300" :disabled="allDay" />
      </label>
      <label class="otest-field">
        <span>Alle</span>
        <input v-model="end" type="time" step="300" :disabled="allDay" />
      </label>
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
        <p v-if="['agree', 'disagree'].includes(result.reading.check?.state)" class="otest-ai">
          <span class="material-symbols-outlined" aria-hidden="true">{{ result.reading.check.state === 'agree' ? 'verified' : 'report' }}</span>
          <template v-if="result.reading.check.state === 'agree'">Doppio controllo AI: stessa lettura del parser</template>
          <template v-else>Doppio controllo AI: legge diversamente ({{ result.reading.check.diffs.join('; ') }})</template>
          <template v-if="result.reading.check.confidence != null"> · sicura al {{ result.reading.check.confidence }}%</template>.
        </p>
        <p v-if="result.aiBudget" class="otest-muted otest-small">
          Budget AI: {{ result.aiBudget.lastMinute }}/{{ result.aiBudget.perMinute }} al minuto, {{ result.aiBudget.today }}/{{ result.aiBudget.perDay }} nelle ultime 24 h, {{ result.aiBudget.queued }} in coda{{ result.aiBudget.paused ? ' · in pausa (limite del provider)' : '' }}.
        </p>
        <p class="otest-ai">
          <span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
          <template v-if="result.reading.ai">
            Sotto il {{ result.aiThreshold }}%: interpretato con l’AI ({{ result.reading.ai.model }}<template v-if="result.reading.ai.confidence != null">, sicura al {{ result.reading.ai.confidence }}%</template>).
            <em v-if="result.reading.ai.reason">“{{ result.reading.ai.reason }}”</em>
          </template>
          <template v-else-if="result.reading.score >= result.aiThreshold">AI non necessaria (soglia {{ result.aiThreshold }}%).</template>
          <template v-else-if="result.reading.aiRejected">
            Sotto il {{ result.aiThreshold }}%: chiesto all’AI, ma era sicura solo al {{ result.reading.aiRejected.confidence }}%, quindi resta la lettura del parser.
            <em v-if="result.reading.aiRejected.reason">“{{ result.reading.aiRejected.reason }}”</em>
          </template>
          <template v-else-if="!result.aiEnabled">Sotto il {{ result.aiThreshold }}%, ma l’AI non è configurata sul server.</template>
          <template v-else>Sotto il {{ result.aiThreshold }}%, ma l’AI non ha risposto: resta la lettura del parser.</template>
        </p>
      </section>

      <section class="otest-card" :class="{ 'is-loading': loading }">
        <h2>Come viene letto<template v-if="result.reading.ai"> (dall’AI)</template></h2>
        <dl class="otest-dl">
          <dt>Tipo</dt>
          <dd>{{ kindLabel }}</dd>
          <dt>Classi scritte</dt>
          <dd>
            <template v-if="p.classes.length">{{ p.classes.join(', ') }}</template>
            <span v-else class="otest-muted">nessuna</span>
          </dd>
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

        <details v-if="result.parser" class="otest-parser">
          <summary>Lettura del parser (sostituita dall’AI)</summary>
          <pre>{{ JSON.stringify(result.parser, null, 2) }}</pre>
        </details>

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
            <RouterLink :to="entityLink(m)" class="otest-chip otest-chip--link">
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
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import TimetableCell from '@/components/orario/TimetableCell.vue'
  import { fetchTimetableTest } from '@/api/timetable'
  import { cellEnd, colorSubjects, hourNumber } from '@/utils/timetable'

  const route = useRoute()
  const router = useRouter()

  const EXAMPLES = [
    'CLASSE 5EELEET (ALUNNI IRC) - SALA MENSA',
    'CLASSE 3AIIN - AULA 46 - PROF. ROSSI (PROF.ssa BIANCHI: ASSENTE)',
    'CLASSE 4EAU - USCITA ANTICIPATA',
    'CLASSI 5C, 5D - USCITA DIDATTICA - PROFF. ROSSI, VERDI',
  ]
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
    return s >= 90 ? 'good' : s >= result.value.aiThreshold ? 'mid' : 'low'
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

  function useExample(ex) {
    summary.value = ex
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
    max-width: 820px;
    margin: 25px auto;
    padding: 0 16px;
    box-sizing: border-box;
    color: var(--on-surface);
  }
  .otest-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--on-surface-variant);
    text-decoration: none;
    font-size: 0.875rem;
  }
  .otest-back .material-symbols-outlined {
    font-size: 18px;
  }
  .otest-title {
    margin: 16px 0 8px;
    font-size: 1.75rem;
  }
  .otest-intro {
    margin: 0 0 20px;
    color: var(--on-surface-variant);
    line-height: 1.5;
  }

  .otest-form {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    gap: 12px;
    align-items: end;
    margin-bottom: 20px;
  }
  .otest-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.8125rem;
    color: var(--on-surface-variant);
    min-width: 0;
  }
  .otest-field--wide,
  .otest-examples {
    grid-column: 1 / -1;
  }
  .otest-field textarea,
  .otest-field input {
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--divider);
    background: var(--surface);
    color: var(--on-surface);
    font: inherit;
    font-size: 0.9375rem;
    min-width: 0;
    color-scheme: light dark;
  }
  .otest-field textarea {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.875rem;
    resize: vertical;
  }
  .otest-field textarea:focus,
  .otest-field input:focus {
    outline: 2px solid var(--primary);
    outline-offset: -1px;
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
  .otest-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--divider);
    background: none;
    color: var(--on-surface-variant);
    font: inherit;
    font-size: 0.75rem;
    text-decoration: none;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .otest-chip:hover {
    color: var(--on-surface);
    border-color: var(--on-surface-variant);
  }
  .otest-chip--link {
    font-size: 0.875rem;
    color: var(--on-surface);
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
    --score: #66bb6a;
  }
  .otest-score--mid {
    --score: #f9a825;
  }
  .otest-score--low {
    --score: #ef5350;
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
    color: #ef5350;
    font-variant-numeric: tabular-nums;
  }
  .otest-ai {
    padding-left: 24px;
    text-indent: -24px;
    margin: 12px 0 0;
    font-size: 0.875rem;
    color: var(--on-surface-variant);
  }
  .otest-ai .material-symbols-outlined {
    width: 24px;
    text-indent: 0;
    font-size: 18px;
    vertical-align: -4px;
  }
  .otest-ai em {
    display: block;
    margin-top: 2px;
    text-indent: 0;
  }
  .otest-parser {
    margin-top: 10px;
    font-size: 0.8125rem;
    color: var(--on-surface-variant);
  }
  .otest-parser pre {
    padding: 10px;
    border-radius: 10px;
    background: var(--surface-variant);
    font-size: 0.75rem;
    overflow: auto;
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
    color: #f9a825;
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
    color: #ef5350;
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
