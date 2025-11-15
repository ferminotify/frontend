

export function togglePasswordVisibility(passwordInputOrEl, iconElOrId) {
  const input =
    typeof passwordInputOrEl === 'string'
      ? document.getElementById(passwordInputOrEl)
      : passwordInputOrEl
  const iconEl = typeof iconElOrId === 'string' ? document.getElementById(iconElOrId) : iconElOrId

  if (!input) return

  if (input.type === 'password') {
    input.type = 'text'
    if (iconEl)
      iconEl.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true">visibility</span>'
  } else {
    input.type = 'password'
    if (iconEl)
      iconEl.innerHTML =
        '<span class="material-symbols-outlined" aria-hidden="true">visibility_off</span>'
  }
}

export function initPasswordIconForEdge(iconElOrId) {
  try {
    const agent = window.navigator.userAgent.toLowerCase()
    if (agent.indexOf('edg/') > -1) {
      const iconEl =
        typeof iconElOrId === 'string' ? document.getElementById(iconElOrId) : iconElOrId
      if (iconEl) iconEl.style.display = 'none'
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('initPasswordIconForEdge failed', e)
  }
}
