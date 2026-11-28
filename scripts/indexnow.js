#!/usr/bin/env node
const HOST = 'fn.lkev.in'
const KEY = '06a510f67dd47039a20dded6756a6033'

const sitemap = await fetch(`https://${HOST}/sitemap.xml`).then((r) => {
  if (!r.ok) throw new Error(`sitemap.xml: HTTP ${r.status}`)
  return r.text()
})
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
})
// 200 = accepted, 202 = accepted (key check pending)
console.log(`IndexNow: ${urlList.length} URLs -> HTTP ${res.status} ${res.statusText}`)
if (!res.ok) process.exit(1)
