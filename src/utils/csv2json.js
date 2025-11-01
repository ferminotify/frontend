export default function csv2json(text, headers, quoteChar = '"', delimiter = ',') {
  const regex = new RegExp(`\\s*(${quoteChar})?(.*?)\\1\\s*(?:${delimiter}|$)`, 'gs')

  const match = line => [...line.matchAll(regex)]
    .map(m => m[2])
    .slice(0, -1)

  const lines = text.split('\n')
  const heads = headers ?? match(lines.shift())

  return lines.map(line => {
    return match(line).reduce((acc, cur, i) => {
      const val = cur.length <= 0 ? null : Number(cur) || cur
      const key = heads[i] ?? `extra_${i}`
      return { ...acc, [key]: val }
    }, {})
  })
}
