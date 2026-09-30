// Post-login redirect, kept in sessionStorage so it survives the Google OAuth
// round-trip (full page navigation) as well as the in-app login form.
const KEY = 'postLoginRedirect'
const DEFAULT = '/dashboard'

const storage = () => {
  try {
    return typeof sessionStorage !== 'undefined' && typeof sessionStorage.getItem === 'function' ? sessionStorage : null
  } catch (e) {
    return null
  }
}

export function saveRedirect(fullPath) {
  // Same-origin, in-app paths only (blocks "//evil.com" and auth pages)
  if (typeof fullPath !== 'string' || !fullPath.startsWith('/') || fullPath.startsWith('//')) return
  if (/^\/(login|register|auth)/.test(fullPath)) return
  storage()?.setItem(KEY, fullPath)
}

export function consumeRedirect(fallback = DEFAULT) {
  const s = storage()
  const path = s?.getItem(KEY)
  s?.removeItem(KEY)
  return path && path.startsWith('/') && !path.startsWith('//') ? path : fallback
}
