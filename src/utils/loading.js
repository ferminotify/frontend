
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
     
    console.error('resetLoading() failed', e)
  }
}