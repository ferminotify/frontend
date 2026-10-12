import { describe, it, expect } from 'vitest'
import { describeCell, cellEnd, hourNumber, weekRangeLabel, groupEntities, prettySubject } from '../timetable'

const base = { start: '09:00', slots: ['09:00'], span: 1, subject: 'MATEMATICA', detail: 'Aula 94', color: '#fff', occupant: null }
const texts = (d) => d.lines.map((l) => l.text)
const v = (o) => ({ uid: 'x', kind: 'change', label: null, summary: '', classes: ['3F'], room: null, teachers: [], absent: [], ...o })

describe('describeCell (class)', () => {
  it('regular lesson shows subject and room', () => {
    const d = describeCell({ ...base, status: 'regular', variations: [] }, 'class')
    expect(d).toMatchObject({ tone: 'regular', badge: null, title: 'Matematica' })
    expect(texts(d)).toEqual(['Aula 94'])
  })

  it('room change strikes the original room; absent teachers struck after the present ones', () => {
    const cell = { ...base, status: 'changed', variations: [v({ room: 'Aula 46', teachers: ['Esempio'], absent: ['Ipotetico'] })] }
    const d = describeCell(cell, 'class')
    expect(d).toMatchObject({ tone: 'changed', badge: 'Variazione' })
    expect(d.lines).toEqual([
      { text: 'Aula 46', was: 'Aula 94' },
      { text: 'Esempio', was: 'Ipotetico', list: true }, // both, the absent one struck
    ])
  })

  it('two events for one lesson: the room that differs wins, absences add up', () => {
    const absent = v({ uid: 'a', room: 'Aula 94', teachers: ['Esempio'], absent: ['Ipotetico'] })
    const moved = v({ uid: 'b', room: 'Sala Eros' })
    for (const variations of [[absent, moved], [moved, absent]]) {
      const d = describeCell({ ...base, status: 'changed', variations }, 'class')
      expect(d.lines).toEqual([
        { text: 'Sala Eros', was: 'Aula 94' },
        { text: 'Esempio', was: 'Ipotetico', list: true },
      ])
    }
  })

  it('substitution in the same room does not strike anything', () => {
    const cell = { ...base, status: 'changed', variations: [v({ room: 'AULA 94', teachers: ['Esempio', 'Anonimo'] })] }
    const d = describeCell(cell, 'class')
    expect(d.original).toBeNull()
    expect(d.lines.every((l) => !l.was)).toBe(true)
    expect(texts(d)).toContain('Esempio, Anonimo')
  })

  it('cancelled lesson uses the variation label as badge', () => {
    const cell = { ...base, status: 'cancelled', variations: [v({ kind: 'exit', label: 'Uscita anticipata' })] }
    expect(describeCell(cell, 'class')).toMatchObject({ tone: 'cancelled', badge: 'Uscita anticipata', title: 'Matematica' })
  })

  it('added activity in a free hour', () => {
    const cell = { ...base, subject: null, detail: null, status: 'added', variations: [v({ kind: 'study', label: 'Studio autonomo', room: 'Aula 40' })] }
    const d = describeCell(cell, 'class')
    expect(d).toMatchObject({ tone: 'added', title: 'Studio autonomo' })
    expect(texts(d)).toEqual(['Studio autonomo', 'Aula 40'])
  })
})

describe('describeCell (room)', () => {
  const roomCell = { ...base, detail: '3F' }
  it('freed room: the event that moves the class explains why', () => {
    const variations = [v({ uid: 'b', room: 'Sala Eros' }), v({ uid: 'a', room: 'Aula 94', absent: ['Ipotetico'] })]
    const d = describeCell({ ...roomCell, status: 'freed', movedTo: 'Sala Eros', variations }, 'room')
    expect(texts(d)[0]).toMatch(/spostata in Sala Eros$/)
  })

  it('freed room explains why', () => {
    const cell = { ...roomCell, status: 'freed', variations: [v({ room: 'Aula 916' })] }
    const d = describeCell(cell, 'room')
    expect(d).toMatchObject({ tone: 'freed', badge: 'Aula libera' })
    expect(texts(d)).toEqual(['3F: spostata in Aula 916'])
  })
  it('class moving in shows the occupant and strikes the original lesson', () => {
    const cell = { ...roomCell, status: 'changed', occupant: '2B', variations: [v({ classes: ['2B'], teachers: ['Esempio'] })] }
    expect(describeCell(cell, 'room')).toMatchObject({ tone: 'changed', title: '2B', original: 'Matematica · 3F' })
  })
})

describe('describeCell (teacher)', () => {
  it('substitution in another class is a change, not an addition', () => {
    const cell = { ...base, detail: '3F · Aula 94', status: 'added', occupant: '2B', variations: [v({ classes: ['2B'], room: 'Aula 12', teachers: ['Esempio'] })] }
    expect(describeCell(cell, 'teacher')).toMatchObject({ tone: 'changed', badge: 'Supplenza', title: '2B' })
  })
})

describe('helpers', () => {
  it('cellEnd: lessons last 55 minutes, evening ones 50', () => {
    const times = ['08:05', '09:00', '10:05']
    expect(cellEnd({ slots: ['08:05', '09:00'] }, times)).toBe('09:55')
    expect(cellEnd({ slots: ['10:05'] }, times)).toBe('11:00')
    expect(cellEnd({ slots: ['13:00'] }, times)).toBe('13:55')
    expect(cellEnd({ slots: ['19:05'] }, times)).toBe('19:55')
  })
  it('hourNumber numbers day and evening slots', () => {
    expect(hourNumber('08:05')).toBe(1)
    expect(hourNumber('14:15')).toBe(7)
    expect(hourNumber('19:05')).toBe(2)
    expect(hourNumber('07:00')).toBeNull()
  })
  it('weekRangeLabel handles month boundaries', () => {
    expect(weekRangeLabel([{ date: '2026-10-05' }, { date: '2026-10-09' }])).toBe('5 – 9 ottobre')
    expect(weekRangeLabel([{ date: '2026-09-28' }, { date: '2026-10-02' }])).toBe('28 settembre – 2 ottobre')
  })
  it('groupEntities groups classes by year and rooms by kind', () => {
    const g = groupEntities([{ name: '1A' }, { name: '1B' }, { name: '2A' }], 'classe')
    expect(g.map((x) => x.label)).toEqual(['Classi 1ª', 'Classi 2ª'])
    const r = groupEntities([{ name: 'Aula 4' }, { name: 'Lab 610 Fisica 1' }, { name: 'AULA 381' }], 'aula')
    expect(r.map((x) => x.label)).toEqual(['Aula', 'Lab'])
  })
  it('prettySubject sentence-cases', () => {
    expect(prettySubject('LINGUA E LETTERATURA ITALIANA')).toBe('Lingua e letteratura italiana')
  })
})

describe('cellEnd with events out of the lessons', () => {
  const times = ['12:05', '13:00', '15:30']
  it('uses the event end and skips extra rows for lessons', () => {
    expect(cellEnd({ slots: ['15:30'], end: '17:30' }, times, ['15:30'])).toBe('17:30')
    expect(cellEnd({ slots: ['13:00'] }, times, ['15:30'])).toBe('13:55')
    expect(cellEnd({ slots: ['12:05'] }, times, ['15:30'])).toBe('13:00')
  })
})

describe('describeCell with real times', () => {
  it('says the times of an off-grid variation, not for an extra row', () => {
    const v = { uid: 'r', kind: 'change', summary: 'CLASSE 1A - AULA 40', classes: ['1A'], room: 'AULA 40', teachers: [], absent: [], start: '10:30', end: '11:30', offGrid: true }
    const cell = { ...base, status: 'changed', variations: [v] }
    expect(texts(describeCell(cell, 'class'))).toContain('Dalle 10:30 alle 11:30')
    expect(texts(describeCell({ ...cell, end: '11:30' }, 'class'))).not.toContain('Dalle 10:30 alle 11:30')
  })
})

describe('describeCell: substitution and anticipated lesson', () => {
  const v = { uid: 's', kind: 'change', summary: 'CLASSE 1A - AULA 94 - PROF. VERDI', classes: ['1A'], room: 'AULA 94', teachers: ['Verdi'], absent: [] }
  it('a substitution strikes the subject, then ~~absent~~ substitute', () => {
    const d = describeCell({ ...base, status: 'changed', role: 'substitute', variations: [v] }, 'class')
    expect(d.title).toBe('Matematica')
    expect(d.titleStruck).toBe(true)
    expect(d.badge).toBe('Supplenza')
    const line = d.lines.find((l) => l.text === 'Verdi')
    expect(line).toBeTruthy()
    expect(line.wasFirst).toBe(true)
  })
  it('an anticipated lesson shows the subject it brings forward', () => {
    const d = describeCell({ ...base, status: 'changed', role: 'early', roleSubject: 'STORIA', variations: [v] }, 'class')
    expect(d.title).toBe('Storia')
    expect(d.badge).toBe('Anticipata')
    expect(d.lines[0]).toEqual({ text: '', was: 'Matematica', wasFirst: true }) // the lesson it replaces, struck
  })
  it('same teacher: the lesson itself', () => {
    expect(describeCell({ ...base, status: 'changed', variations: [v] }, 'class').title).toBe('Matematica')
  })
})

describe('describeCell: substituted teacher', () => {
  it('struck before the substitute: own teachers, else the absent ones', () => {
    const v = { uid: 's', kind: 'change', summary: 'x', classes: ['1A'], room: null, teachers: ['Verdi'], absent: ['Bianchi'] }
    const cell = { ...base, status: 'changed', role: 'substitute', variations: [v] }
    expect(describeCell(cell, 'class').lines.find((l) => l.text === 'Verdi').was).toBe('Bianchi')
    expect(describeCell({ ...cell, teachers: ['Rossi Mario'] }, 'class').lines.find((l) => l.text === 'Verdi').was).toBe('Rossi Mario')
  })
})

describe('describeCell: only an absent teacher', () => {
  it('shows the name struck, no prefix', () => {
    const v = { uid: 'x', kind: 'change', summary: 'CLASSE 1A - AULA 94 (PROF. ROSSI ASSENTE)', classes: ['1A'], room: 'AULA 94', teachers: [], absent: ['Rossi'] }
    const d = describeCell({ ...base, status: 'changed', variations: [v] }, 'class')
    expect(d.lines).toContainEqual({ text: '', was: 'Rossi', wasFirst: true })
  })
})

describe('describeCell: possible variation', () => {
  it('the lesson as it is, flagged', () => {
    const v = { uid: 'm', kind: 'change', summary: 'CLASSE 3MENE - SALA EROS', classes: ['3MENE'], room: 'SALA EROS', teachers: [], absent: [], maybe: true }
    const d = describeCell({ ...base, status: 'maybe', variations: [v] }, 'class')
    expect(d).toMatchObject({ badge: 'Variazione', tone: 'maybe', title: 'Matematica' })
    expect(texts(d)).toContain('Aula 94')
  })
})

describe('describeCell: possible variation in a free hour', () => {
  it('shows the event', () => {
    const v = { uid: 'm', kind: 'change', summary: 'CLASSE 3MENEITEL - SALA EROS - PROF. RONCONI', classes: ['3MENEITEL'], room: 'SALA EROS', teachers: ['Ronconi'], absent: [], maybe: true }
    const d = describeCell({ start: '10:05', slots: ['10:05'], span: 1, subject: null, detail: null, status: 'maybe', variations: [v] }, 'class')
    expect(d).toMatchObject({ badge: 'Variazione', title: '3MENEITEL', tone: 'maybe' })
    expect(texts(d)).toEqual(['SALA EROS', 'Ronconi'])
  })
})

describe('describeCell: joint class hour', () => {
  it('says which part it is shared with', () => {
    expect(texts(describeCell({ ...base, status: 'regular', variations: [], jointWith: '3Itel' }, 'class'))).toContain('Con 3Itel')
  })
})
