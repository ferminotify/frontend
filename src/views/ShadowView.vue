<template>
  <div class="section shadow">
    <header class="sh-head">
      <div>
        <h1>Confronto notifiche</h1>
        <p class="sh-sub">
          Prod ({{ data?.prod_version || 'notifier' }}) e staging, stesse keyword e stessi eventi. Non viene inviato niente.
        </p>
      </div>
      <div class="sh-run">
        <span v-if="status" class="sh-run-meta">
          <template v-if="status.running">Confronto in corso…</template>
          <template v-else-if="data">Ultimo: {{ fmtDateTime(data.at) }} · {{ (data.ms / 1000).toFixed(1) }} s</template>
        </span>
        <button class="btn filled" type="button" :disabled="status?.running || queued" @click="runNow">
          {{ queued ? 'In coda…' : 'Esegui ora' }}
        </button>
      </div>
    </header>

    <p v-if="error" class="sh-alert bad">{{ error }}</p>
    <p v-if="status?.last_error" class="sh-alert bad">Ultimo errore: {{ status.last_error }}</p>
    <p v-if="loading && !data" class="sh-empty">Caricamento…</p>

    <template v-if="data">
      <section class="sh-verdict" :class="lostAll ? 'bad' : 'ok'" aria-live="polite">
        <span class="material-symbols-outlined" aria-hidden="true">{{ lostAll ? 'error' : 'check_circle' }}</span>
        <div>
          <strong v-if="lostAll">{{ lostAll }} notific{{ lostAll === 1 ? 'a' : 'he' }} che prod invia e staging no</strong>
          <strong v-else>Nessuna notifica persa</strong>
          <span>
            Su {{ data.events.all }} eventi in calendario e {{ data.users.active }} utenti attivi.
            <template v-if="seenLost">Dal primo run: {{ seenLost }} perse in totale.</template>
          </span>
        </div>
      </section>

      <dl class="sh-stats">
        <div>
          <dt>Eventi notificati</dt>
          <dd>{{ data.notified_events.prod }} <span class="arrow">→</span> {{ data.notified_events.staging }}</dd>
          <small>prod → staging, almeno un destinatario</small>
        </div>
        <div>
          <dt>Notifiche invariate</dt>
          <dd>{{ n(data.pairs.same) }}</dd>
          <small>utente × evento uguali nei due</small>
        </div>
        <div :class="{ bad: data.pairs.lost }">
          <dt>Perse</dt>
          <dd>{{ n(data.pairs.lost) }}</dd>
          <small>solo prod</small>
        </div>
        <div :class="{ warn: data.pairs.added }">
          <dt>Nuove</dt>
          <dd>{{ n(data.pairs.added) }}</dd>
          <small>solo staging</small>
        </div>
        <div>
          <dt>Utenti con differenze</dt>
          <dd>{{ data.users.changed }} <span class="of">/ {{ data.users.active }}</span></dd>
          <small>{{ data.users.unconfirmed }} non confermati esclusi da staging</small>
        </div>
      </dl>

      <section class="sh-panel">
        <h2>Oggi e domani</h2>
        <p class="sh-note">
          Gli eventi che il notifier sta considerando adesso: {{ data.events.now }}.
          <template v-if="data.events.now">
            Invariate {{ n(data.pairs_now.same) }}, perse {{ n(data.pairs_now.lost) }}, nuove {{ n(data.pairs_now.added) }}.
          </template>
        </p>
        <h2>Verifica su quanto prod ha inviato davvero</h2>
        <p v-if="!data.sent_check.total" class="sh-note">
          Prod non ha ancora inviato notifiche per gli eventi in calendario: si riempie dal mattino dei giorni di scuola.
        </p>
        <template v-else>
          <p class="sh-note">
            {{ n(data.sent_check.total) }} notifiche inviate da prod per eventi ancora in calendario:
            {{ n(data.sent_check.prod_sim_ok) }} riprodotte dalla simulazione prod,
            <strong :class="{ 'txt-bad': data.sent_check.staging_ok < data.sent_check.total }">{{ n(data.sent_check.staging_ok) }} anche da staging</strong>.
          </p>
          <ul v-if="data.sent_check.missing.length" class="sh-missing">
            <li v-for="m in data.sent_check.missing" :key="m.sub + m.uid">
              <span class="pill" :class="m.reason === 'persa da staging' ? 'bad' : 'muted'">{{ m.reason }}</span>
              <span class="who">#{{ m.sub }}</span>
              <span class="ev">{{ fmtDay(m.date) }} · {{ m.summary }}</span>
              <span class="kws">{{ m.keywords.join(', ') }}</span>
            </li>
          </ul>
        </template>
      </section>

      <section v-if="data.optin?.length" class="sh-panel">
        <h2>Attività facoltative (solo a chi le attiva)</h2>
        <p class="sh-note">
          Eventi per anno o gruppo che staging non manda a tutta l'annata: arrivano solo a chi ha attivato la categoria,
          o se il titolo nomina la classe.
        </p>
        <ul class="sh-missing">
          <li v-for="o in data.optin" :key="o.category">
            <span class="pill muted">{{ o.category }}</span>
            <span>{{ o.events }} eventi</span>
            <span class="kws">{{ o.users }} utenti interessati · {{ o.opted }} l'hanno attivata</span>
            <details class="sh-titles">
              <summary>Titoli</summary>
              <span v-for="t in o.titles" :key="t" class="meta">{{ t }}</span>
            </details>
          </li>
        </ul>
      </section>

      <div class="sh-tabs" role="tablist" aria-label="Vista">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          role="tab"
          class="chip sh-tab"
          :class="{ active: tab === t.id }"
          :aria-selected="tab === t.id"
          @click="tab = t.id"
        >
          {{ t.label }}<span v-if="t.count != null" class="count">{{ t.count }}</span>
        </button>
      </div>

      <div class="sh-filters">
        <input v-model.trim="q" class="sh-search" type="search" placeholder="Cerca evento, keyword o #utente" aria-label="Cerca" />
        <label v-if="tab !== 'storico'" class="sh-check">
          <input v-model="onlyDiff" type="checkbox" /> Solo con differenze
        </label>
        <select v-if="tab === 'diff'" v-model="kindFilter" aria-label="Tipo">
          <option value="">Tutte</option>
          <option value="lost">Perse</option>
          <option value="added">Nuove</option>
          <option value="unconfirmed">Non confermati</option>
        </select>
      </div>

      <!-- Per evento: same title (recurring) grouped -->
      <div v-if="tab === 'eventi'" class="sh-table-wrap">
        <table class="sh-table">
          <thead>
            <tr>
              <th>Evento</th>
              <th class="num">Volte</th>
              <th class="num">Destinatari prod → staging</th>
              <th class="num">Perse</th>
              <th class="num">Nuove</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="g in shown(eventGroups)" :key="g.summary">
              <tr class="row" :class="{ open: openKey === 'e' + g.summary }" @click="toggle('e' + g.summary)">
                <td class="cell-main">
                  <span class="title">{{ g.summary }}</span>
                  <span class="meta">{{ g.dates }}</span>
                </td>
                <td class="num" data-label="volte">{{ g.count }}</td>
                <td class="num" data-label="destinatari">{{ g.prod }} <span class="arrow">→</span> {{ g.staging }}</td>
                <td class="num" data-label="perse" :class="{ 'txt-bad': g.lost, zero: !g.lost }">{{ g.lost || '' }}</td>
                <td class="num" data-label="nuove" :class="{ 'txt-warn': g.added, zero: !g.added }">{{ g.added || '' }}</td>
              </tr>
              <tr v-if="openKey === 'e' + g.summary" class="detail">
                <td colspan="5">
                  <p v-if="!g.who.length" class="sh-note">Stessi destinatari.</p>
                  <ul v-else class="sh-who">
                    <li v-for="w in g.who" :key="w.kind + w.sub">
                      <span class="pill" :class="kindClass(w.kind)">{{ kindLabel(w.kind) }}</span>
                      <span class="who">#{{ w.sub }}</span>
                      <span>per <b>{{ w.kw.join(', ') }}</b></span>
                      <span class="kws">keyword: {{ (data.user_keywords[w.sub] || []).join(', ') }}</span>
                    </li>
                  </ul>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <button v-if="limit < filteredLength(eventGroups)" class="btn text sh-more" type="button" @click="limit += 100">Mostra altri</button>
      </div>

      <!-- Per keyword -->
      <div v-else-if="tab === 'keyword'" class="sh-table-wrap">
        <table class="sh-table">
          <thead>
            <tr>
              <th>Keyword</th>
              <th class="num">Utenti</th>
              <th class="num">Eventi prod → staging</th>
              <th class="num">Persi</th>
              <th class="num">Nuovi</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="k in shown(keywordRows)" :key="k.keyword">
              <tr class="row" :class="{ open: openKey === 'k' + k.keyword }" @click="toggle('k' + k.keyword)">
                <td class="cell-main"><span class="title mono">{{ k.keyword }}</span></td>
                <td class="num" data-label="utenti">{{ k.users }}</td>
                <td class="num" data-label="eventi">{{ k.prod }} <span class="arrow">→</span> {{ k.staging }}</td>
                <td class="num" data-label="persi" :class="{ 'txt-bad': k.lost.length, zero: !k.lost.length }">{{ k.lost.length || '' }}</td>
                <td class="num" data-label="nuovi" :class="{ 'txt-warn': k.added.length, zero: !k.added.length }">{{ k.added.length || '' }}</td>
              </tr>
              <tr v-if="openKey === 'k' + k.keyword" class="detail">
                <td colspan="5">
                  <p v-if="!k.lost.length && !k.added.length" class="sh-note">Stessi eventi.</p>
                  <ul v-else class="sh-who">
                    <li v-for="t in titlesOf(k)" :key="t.kind + t.summary">
                      <span class="pill" :class="kindClass(t.kind)">{{ kindLabel(t.kind) }}</span>
                      <span class="ev">{{ t.summary }}</span>
                      <span v-if="t.count > 1" class="kws">×{{ t.count }}</span>
                    </li>
                  </ul>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <button v-if="limit < filteredLength(keywordRows)" class="btn text sh-more" type="button" @click="limit += 100">Mostra altri</button>
      </div>

      <!-- Every difference ever seen (diffs.json): events leave the calendar, the record stays -->
      <div v-else-if="tab === 'diff'" class="sh-table-wrap">
        <p class="sh-note">Tutte le differenze viste dal primo run, anche per eventi già passati.</p>
        <table class="sh-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Utente</th>
              <th>Evento</th>
              <th>Match</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in shown(diffRows)" :key="d.sub + d.uid">
              <td><span class="pill" :class="kindClass(d.kind)">{{ kindLabel(d.kind) }}</span></td>
              <td class="mono">#{{ d.sub }}</td>
              <td class="cell-main">
                <span class="title">{{ d.summary }}</span>
                <span class="meta">{{ fmtDay(d.date) }}{{ d.start ? ' · ' + d.start : '' }}<template v-if="d.sent"> · inviata da prod</template></span>
              </td>
              <td class="mono" data-label="match">{{ (d.kind === 'added' ? d.staging_kw : d.prod_kw).join(', ') }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!filteredLength(diffRows)" class="sh-empty">Nessuna differenza.</p>
        <button v-if="limit < filteredLength(diffRows)" class="btn text sh-more" type="button" @click="limit += 100">Mostra altri</button>
      </div>

      <div v-else class="sh-table-wrap">
        <table class="sh-table">
          <thead>
            <tr>
              <th>Run</th>
              <th class="num">Eventi</th>
              <th class="num">Invariate</th>
              <th class="num">Perse</th>
              <th class="num">Nuove</th>
              <th class="num">Inviate da prod / riprodotte</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in shown(historyRows)" :key="h.at">
              <td class="cell-main">{{ fmtDateTime(h.at) }}</td>
              <td class="num" data-label="eventi">{{ h.events.all }} <span class="meta-inline">({{ h.events.now }} ora)</span></td>
              <td class="num" data-label="invariate">{{ n(h.pairs.same) }}</td>
              <td class="num" data-label="perse" :class="{ 'txt-bad': h.pairs.lost }">{{ n(h.pairs.lost) }}</td>
              <td class="num" data-label="nuove">{{ n(h.pairs.added) }}</td>
              <td class="num" data-label="inviate / riprodotte" :class="{ 'txt-bad': h.sent_check.staging_ok < h.sent_check.total }">
                {{ n(h.sent_check.total) }} / {{ n(h.sent_check.staging_ok) }}
              </td>
            </tr>
          </tbody>
        </table>
        <button v-if="limit < filteredLength(historyRows)" class="btn text sh-more" type="button" @click="limit += 100">Mostra altri</button>
      </div>
    </template>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useHead } from '@unhead/vue'

  useHead({ title: 'Confronto notifiche · Fermi Notify', meta: [{ name: 'robots', content: 'noindex,nofollow' }] })

  // Staging only: the shadow service (staging/shadow) behind Caddy basic auth, same origin.
  const BASE = '/shadow-api'

  const data = ref(null)
  const diffs = ref({})
  const history = ref([])
  const status = ref(null)
  const loading = ref(true)
  const error = ref('')
  const queued = ref(false)

  const tab = ref('eventi')
  const q = ref('')
  const onlyDiff = ref(true)
  const kindFilter = ref('')
  const openKey = ref('')
  const limit = ref(100)

  async function get(path) {
    const res = await fetch(BASE + path, { credentials: 'same-origin', cache: 'no-store' })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(res.status === 401 ? 'Accesso negato (credenziali staging).' : `Errore ${res.status}`)
    return res.json()
  }

  async function load() {
    try {
      const [latest, all, hist, st] = await Promise.all([get('/latest'), get('/diffs'), get('/history'), get('/status')])
      data.value = latest
      diffs.value = all || {}
      history.value = hist || []
      const wasRunning = status.value?.running
      status.value = st
      if (wasRunning && !st?.running) queued.value = false
      error.value = latest ? '' : 'Nessun confronto ancora: premi "Esegui ora".'
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function runNow() {
    queued.value = true
    try {
      await fetch(BASE + '/run', { method: 'POST', credentials: 'same-origin' })
      status.value = { ...status.value, running: true }
    } catch (e) {
      queued.value = false
      error.value = e.message
    }
  }

  let timer
  onMounted(() => {
    load()
    timer = setInterval(load, 15000)
  })
  onUnmounted(() => clearInterval(timer))

  watch([tab, q, onlyDiff, kindFilter], () => {
    limit.value = 100
    openKey.value = ''
  })

  const nf = new Intl.NumberFormat('it-IT')
  const n = (v) => nf.format(v || 0)
  const dayFmt = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
  const dtFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const fmtDay = (d) => (d ? dayFmt.format(new Date(d + 'T12:00:00')) : '')
  const fmtDateTime = (d) => (d ? dtFmt.format(new Date(d)) : '')
  const kindLabel = (k) => ({ lost: 'persa', added: 'nuova', unconfirmed: 'non confermato' })[k] || k
  const kindClass = (k) => ({ lost: 'bad', added: 'warn', unconfirmed: 'muted' })[k]

  const allDiffs = computed(() => Object.values(diffs.value))
  const lostAll = computed(() => data.value?.pairs.lost || 0)
  const seenLost = computed(() => allDiffs.value.filter((d) => d.kind === 'lost').length)

  const needle = computed(() => q.value.toUpperCase())
  const has = (...texts) => !needle.value || texts.some((t) => String(t ?? '').toUpperCase().includes(needle.value))

  const eventGroups = computed(() => {
    if (!data.value) return []
    const byTitle = new Map()
    for (const e of data.value.events_list) {
      const g = byTitle.get(e.summary) || { summary: e.summary, count: 0, prod: 0, staging: 0, lost: 0, added: 0, days: new Set(), uids: new Set() }
      g.count++
      g.prod = Math.max(g.prod, e.prod)
      g.staging = Math.max(g.staging, e.staging)
      g.lost += e.lost
      g.added += e.added
      if (e.date) g.days.add(e.date)
      g.uids.add(e.uid)
      byTitle.set(e.summary, g)
    }
    const who = new Map()
    for (const d of data.value.diffs) {
      const title = data.value.event_titles[d.uid]
      const key = title + '|' + d.kind + '|' + d.sub
      if (!who.has(key)) who.set(key, { title, kind: d.kind, sub: d.sub, kw: d.kind === 'added' ? d.staging_kw : d.prod_kw })
    }
    const whoOf = new Map()
    for (const w of who.values()) (whoOf.get(w.title) || whoOf.set(w.title, []).get(w.title)).push(w)
    return [...byTitle.values()]
      .map((g) => {
        const days = [...g.days].sort()
        return {
          ...g,
          dates: days.length > 2 ? `${fmtDay(days[0])} – ${fmtDay(days.at(-1))}` : days.map(fmtDay).join(', '),
          who: (whoOf.get(g.summary) || []).sort((a, b) => (a.kind === 'lost' ? -1 : 0) - (b.kind === 'lost' ? -1 : 0) || a.sub - b.sub),
        }
      })
      .filter((g) => (!onlyDiff.value || g.lost || g.added) && has(g.summary, ...g.who.map((w) => '#' + w.sub), ...g.who.flatMap((w) => w.kw)))
      .sort((a, b) => b.lost - a.lost || b.added - a.added || b.staging - a.staging)
  })

  const keywordRows = computed(() =>
    (data.value?.keywords_list || []).filter((k) => (!onlyDiff.value || k.lost.length || k.added.length) && has(k.keyword)),
  )

  function titlesOf(k) {
    const out = new Map()
    for (const [kind, uids] of [['lost', k.lost], ['added', k.added]]) {
      for (const uid of uids) {
        const summary = data.value.event_titles[uid] || uid
        const key = kind + summary
        const t = out.get(key) || { kind, summary, count: 0 }
        t.count++
        out.set(key, t)
      }
    }
    return [...out.values()]
  }

  const diffRows = computed(() =>
    allDiffs.value
      .filter((d) => (!kindFilter.value || d.kind === kindFilter.value) && has(d.summary, '#' + d.sub, ...d.prod_kw, ...d.staging_kw))
      .sort((a, b) => (a.kind === 'lost' ? 0 : 1) - (b.kind === 'lost' ? 0 : 1) || (b.date || '').localeCompare(a.date || '') || a.sub - b.sub),
  )

  const historyRows = computed(() => [...history.value].reverse())

  const shown = (rows) => rows.slice(0, limit.value)
  const filteredLength = (rows) => rows.length
  const toggle = (key) => (openKey.value = openKey.value === key ? '' : key)

  const tabs = computed(() => [
    { id: 'eventi', label: 'Per evento', count: data.value ? eventGroups.value.length : null },
    { id: 'keyword', label: 'Per keyword', count: data.value ? keywordRows.value.length : null },
    { id: 'diff', label: 'Differenze', count: allDiffs.value.length },
    { id: 'storico', label: 'Storico', count: history.value.length },
  ])
</script>

<style scoped>
  .shadow {
    max-width: 1100px;
    margin: 25px auto;
    padding: 0 16px;
    box-sizing: border-box;
    color: var(--on-surface);
    font-variant-numeric: tabular-nums;
  }
  .sh-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px 24px;
    margin-bottom: 20px;
  }
  .sh-head h1 {
    margin: 0 0 4px;
    font-size: 1.75rem;
  }
  .sh-sub {
    margin: 0;
    color: var(--on-surface-variant);
    font-size: 0.875rem;
  }
  .sh-run {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sh-run .btn {
    white-space: nowrap;
  }
  .sh-run-meta {
    font-size: 0.8125rem;
    color: var(--on-surface-variant);
  }

  .sh-alert {
    margin: 0 0 12px;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 0.875rem;
  }
  .sh-alert.bad {
    background: color-mix(in srgb, var(--error) 14%, transparent);
    color: var(--error-soft);
  }
  .sh-empty {
    color: var(--on-surface-variant);
    font-size: 0.875rem;
  }

  .sh-verdict {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 16px 18px;
    border-radius: 16px;
    margin-bottom: 16px;
  }
  .sh-verdict .material-symbols-outlined {
    font-size: 28px;
  }
  .sh-verdict strong {
    display: block;
    font-size: 1.0625rem;
    margin-bottom: 2px;
  }
  .sh-verdict span:not(.material-symbols-outlined) {
    font-size: 0.875rem;
    color: var(--on-surface-variant);
  }
  .sh-verdict.ok {
    background: color-mix(in srgb, var(--success) 12%, transparent);
  }
  .sh-verdict.ok .material-symbols-outlined {
    color: var(--success);
  }
  .sh-verdict.bad {
    background: color-mix(in srgb, var(--error) 14%, transparent);
  }
  .sh-verdict.bad .material-symbols-outlined {
    color: var(--error);
  }

  .sh-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin: 0 0 16px;
  }
  .sh-stats > div {
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--surface-variant);
    border: 1px solid transparent;
  }
  .sh-stats > div.bad {
    border-color: var(--error);
  }
  .sh-stats > div.warn {
    border-color: color-mix(in srgb, var(--warning) 50%, transparent);
  }
  .sh-stats dt {
    font-size: 0.8125rem;
    color: var(--on-surface-variant);
  }
  .sh-stats dd {
    margin: 4px 0 2px;
    font-size: 1.5rem;
    font-weight: 700;
    white-space: nowrap;
  }
  .sh-stats small {
    font-size: 0.75rem;
    color: var(--muted);
  }
  .arrow,
  .of {
    color: var(--muted);
    font-weight: 500;
  }

  .sh-panel {
    padding: 4px 18px 6px;
    border-radius: 16px;
    border: 1px solid var(--divider);
    margin-bottom: 24px;
  }
  .sh-panel h2 {
    font-size: 0.9375rem;
    margin: 14px 0 4px;
  }
  .sh-note {
    margin: 0 0 10px;
    font-size: 0.875rem;
    color: var(--on-surface-variant);
  }
  .sh-missing,
  .sh-who {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.8125rem;
  }
  .sh-missing li,
  .sh-who li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
  }
  .who {
    font-family: 'Source Code Pro', monospace;
    color: var(--on-surface-primary);
  }
  .kws {
    color: var(--muted);
  }

  .pill {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .pill.bad {
    background: color-mix(in srgb, var(--error) 22%, transparent);
    color: var(--error-soft);
  }
  .pill.warn {
    background: color-mix(in srgb, var(--warning) 18%, transparent);
    color: var(--warning-soft);
  }
  .pill.muted {
    background: color-mix(in srgb, var(--muted) 25%, transparent);
    color: var(--on-surface-variant);
  }
  .txt-bad {
    color: var(--error-soft);
    font-weight: 600;
  }
  .txt-warn {
    color: var(--warning-soft);
  }

  .sh-titles {
    flex-basis: 100%;
  }
  .sh-titles summary {
    cursor: pointer;
    color: var(--on-surface-primary);
    font-size: 0.75rem;
  }
  .sh-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    margin-bottom: 12px;
  }
  .sh-tab {
    flex: none;
    padding: 7px 14px;
    border-radius: 999px;
    color: var(--on-surface-variant);
    font-size: 0.875rem;
    -webkit-tap-highlight-color: transparent;
  }
  .sh-tab.active {
    background: var(--primary);
    border-color: var(--primary);
    color: var(--on-primary);
  }
  .sh-tab .count {
    margin-left: 6px;
    opacity: 0.75;
  }

  .sh-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    margin-bottom: 12px;
  }
  .sh-search,
  .sh-filters select {
    font: inherit;
    font-size: 0.875rem;
    color: var(--on-surface);
    background: var(--surface-variant);
    border: 1px solid var(--divider);
    border-radius: 10px;
    padding: 8px 12px;
  }
  .sh-search {
    flex: 1 1 260px;
    min-width: 0;
  }
  .sh-check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    color: var(--on-surface-variant);
  }

  .sh-table-wrap {
    overflow-x: auto;
  }
  .sh-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  .sh-table th {
    text-align: left;
    font-weight: 600;
    font-size: 0.75rem;
    color: var(--on-surface-variant);
    padding: 8px 10px;
    border-bottom: 1px solid var(--divider);
    white-space: nowrap;
  }
  .sh-table td {
    padding: 9px 10px;
    border-bottom: 1px solid color-mix(in srgb, var(--divider) 50%, transparent);
    vertical-align: top;
  }
  .sh-table .num {
    text-align: right;
    white-space: nowrap;
  }
  .sh-table tr.row {
    cursor: pointer;
  }
  .sh-table tr.row:hover,
  .sh-table tr.row.open {
    background: var(--surface-variant);
  }
  .sh-table tr.detail td {
    background: var(--surface-variant);
    padding: 4px 14px 10px;
  }
  .title {
    display: block;
    overflow-wrap: anywhere;
  }
  .meta,
  .meta-inline {
    font-size: 0.75rem;
    color: var(--muted);
  }
  .meta {
    display: block;
    margin-top: 2px;
  }
  .mono {
    font-family: 'Source Code Pro', monospace;
  }
  .sh-more {
    margin: 12px auto;
    display: block;
  }

  @media (max-width: 640px) {
    .sh-stats {
      grid-template-columns: 1fr 1fr;
    }
    .sh-stats dd {
      font-size: 1.25rem;
      white-space: nowrap;
    }
    .sh-stats > div:last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
    .sh-run {
      width: 100%;
      justify-content: space-between;
    }
    .shadow {
      padding: 0;
    }
    .sh-head h1 {
      font-size: 1.5rem;
    }
    .sh-panel {
      padding: 2px 14px 4px;
    }

    /* Tables become stacked rows: title on its own line, numbers as labelled chips below */
    .sh-table-wrap {
      overflow-x: visible;
    }
    .sh-table,
    .sh-table tbody {
      display: block;
    }
    .sh-table thead {
      display: none;
    }
    .sh-table tr {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      align-content: flex-start;
      height: auto;
      gap: 4px 14px;
      padding: 10px 8px;
      border-bottom: 1px solid color-mix(in srgb, var(--divider) 50%, transparent);
    }
    .sh-table td {
      display: block;
      padding: 0;
      border: 0;
    }
    .sh-table td.cell-main,
    .sh-table tr.detail td {
      flex-basis: 100%;
    }
    .sh-table td.zero {
      display: none;
    }
    .sh-table .num {
      text-align: left;
    }
    .sh-table td[data-label]::before {
      content: attr(data-label) ' ';
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--muted);
    }
    .sh-table tr.detail {
      padding: 0;
      border-bottom: 0;
    }
    .sh-table tr.detail td {
      padding: 6px 10px 10px;
    }
    .sh-table tr.row.open {
      border-bottom: 0;
    }
  }
</style>
