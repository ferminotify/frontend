import { describe, it, expect } from 'vitest'
import { describeCell, cellEnd, hourNumber, weekRangeLabel, groupEntities, prettySubject } from '../timetable'

const base = { start: '09:00', slots: ['09:00'], span: 1, subject: 'MATEMATICA', detail: 'Aula 94', color: '#fff', occupant: null }
const v = (o) => ({ uid: 'x', kind: 'change', label: null, summary: '', classes: ['3F'], room: null, teachers: [], absent: [], ...o })

describe('describeCell (class)', () => {
  it('regular lesson shows subject and room', () => {
    expect(describeCell({ ...base, status: 'regular', variations: [] }, 'class')).toMatchObject({
      tone: 'regular', badge: null, title: 'Matematica', lines: ['Aula 94'],
    })
  })

  it('room change strikes the original room and lists teachers/absent', () => {
    const cell = { ...base, status: 'changed', variations: [v({ room: 'Aula 46', teachers: ['Rossi'], absent: ['Bianchi'] })] }
    expect(describeCell(cell, 'class')).toMatchObject({
      tone: 'changed', badge: 'Variazione', lines: ['Aula 46', 'Prof. Rossi', 'Assente: Bianchi'], original: 'Aula 94',
    })
  })

  it('substitution in the same room does not strike anything', () => {
    const cell = { ...base, status: 'changed', variations: [v({ room: 'AULA 94', teachers: ['Rossi', 'Verdi'] })] }
    const d = describeCell(cell, 'class')
    expect(d.original).toBeNull()
    expect(d.lines).toContain('Proff. Rossi, Verdi')
  })

  it('cancelled lesson uses the variation label as badge', () => {
    const cell = { ...base, status: 'cancelled', variations: [v({ kind: 'exit', label: 'Uscita anticipata' })] }
    expect(describeCell(cell, 'class')).toMatchObject({ tone: 'cancelled', badge: 'Uscita anticipata', title: 'Matematica' })
  })

  it('added activity in a free hour', () => {
    const cell = { ...base, subject: null, detail: null, status: 'added', variations: [v({ kind: 'study', label: 'Studio autonomo', room: 'Aula 40' })] }
    expect(describeCell(cell, 'class')).toMatchObject({ tone: 'added', title: 'Studio autonomo', lines: ['Studio autonomo', 'Aula 40'] })
  })
})

describe('describeCell (room)', () => {
  const roomCell = { ...base, detail: '3F' }
  it('freed room explains why', () => {
    const cell = { ...roomCell, status: 'freed', variations: [v({ room: 'Aula 916' })] }
    expect(describeCell(cell, 'room')).toMatchObject({ tone: 'freed', badge: 'Aula libera', lines: ['3F: spostata in Aula 916'] })
  })
  it('class moving in shows the occupant and strikes the original lesson', () => {
    const cell = { ...roomCell, status: 'changed', occupant: '2B', variations: [v({ classes: ['2B'], teachers: ['Rossi'] })] }
    expect(describeCell(cell, 'room')).toMatchObject({ tone: 'changed', title: '2B', original: 'Matematica · 3F' })
  })
})

describe('helpers', () => {
  it('cellEnd uses the next slot or +55 minutes', () => {
    const times = ['08:05', '09:00', '10:05']
    expect(cellEnd({ slots: ['08:05', '09:00'] }, times)).toBe('10:05')
    expect(cellEnd({ slots: ['10:05'] }, times)).toBe('11:00')
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
