// Holds the active vue-router instance so non-component code (e.g. the alert
// banner utility) can navigate without a full page reload.
let _router = null

export function setRouter(router) {
  _router = router
}

// SPA navigate to an internal path. Falls back to a hard navigation if the
// router isn't available yet (e.g. during SSG).
export function navigate(to) {
  if (_router) {
    _router.push(to)
    return
  }
  if (typeof window !== 'undefined') {
    window.location.href = to
  }
}
