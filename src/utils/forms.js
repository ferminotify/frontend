// Common form utilities: submit loading and password visibility toggle

function computeSize(el) {
  const styles = window.getComputedStyle(el)
  return {
    width: styles.getPropertyValue('width'),
    height: styles.getPropertyValue('height'),
  }
}

export function loading(target) {
  try {
    let btn = null
    if (typeof target === 'number') {
      btn = document.getElementsByClassName('submit-btn')[target]
    } else if (target && target.nodeType === 1) {
      btn = target
    }
    if (!btn) return

    const { width, height } = computeSize(btn)
    btn.style.width = width
    btn.style.height = height
    btn.innerHTML =
      "<div class='submit-lds-grid'><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>"
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('loading() failed', e)
  }
}

export function saveBtnParams(target) {
  let btn = null
  if (typeof target === 'number') {
    btn = document.getElementsByClassName('submit-btn')[target]
  } else if (target && target.nodeType === 1) {
    btn = target
  }
  if (!btn) return { html: '', width: '', height: '' }
  return { html: btn.innerHTML, width: btn.style.width, height: btn.style.height }
}

export function resetLoading(target, params) {
  try {
    let btn = null
    if (typeof target === 'number') {
      btn = document.getElementsByClassName('submit-btn')[target]
    } else if (target && target.nodeType === 1) {
      btn = target
    }
    if (!btn || !params) return
    btn.style.width = params.width
    btn.style.height = params.height
    btn.innerHTML = params.html
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('resetLoading() failed', e)
  }
}

export function togglePasswordVisibility(passwordInputOrEl, iconElOrId) {
  const input =
    typeof passwordInputOrEl === 'string'
      ? document.getElementById(passwordInputOrEl)
      : passwordInputOrEl
  const iconEl =
    typeof iconElOrId === 'string' ? document.getElementById(iconElOrId) : iconElOrId

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
