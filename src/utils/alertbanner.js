// Lightweight alert banner utility for the frontend SPA
// Usage: generateAlert('info'|'success'|'warning'|'error', 'message')

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function typeToClass(type) {
  switch (type) {
    case 'error':
      return 'errorbanner'
    case 'success':
      return 'successbanner'
    case 'warning':
      return 'warningbanner'
    case 'info':
    default:
      return 'infobanner'
  }
}

function typeToMaterialIcon(type) {
  switch (type) {
    case 'error':
      return 'error'
    case 'success':
      return 'check_circle'
    case 'warning':
      return 'warning'
    case 'info':
    default:
      return 'info'
  }
}

export function generateAlert(type, msg) {
  try {
    const banner = document.createElement('p')
    banner.classList.add('alertbanner', typeToClass(type))

    const iconName = typeToMaterialIcon(type)

    // Render content depending on msg type:
    // - string: escaped text (default)
    // - { html: string }: treat as safe HTML and insert directly
    // - { node: Node }: append the provided DOM node
    const iconHtml = `<span class="material-symbols-outlined" style="margin-right: 6px; transform: translateY(0px);">${iconName}</span>`

    if (msg && typeof msg === 'object') {
      if (msg.node && msg.node instanceof Node) {
        banner.innerHTML = iconHtml
        banner.appendChild(msg.node)
      } else if (typeof msg.html === 'string') {
        banner.innerHTML = iconHtml + `<span>${msg.html}</span>`
      } else {
        const safeMsg = escapeHtml(String(msg))
        banner.innerHTML = iconHtml + `<span>${safeMsg}</span>`
      }
    } else {
      const safeMsg = escapeHtml(msg)
      banner.innerHTML = iconHtml + `<span>${safeMsg}</span>`
    }

    // Append after DOM is ready if needed
    const append = () => {
      document.body.appendChild(banner)
      banner.style.animation = 'showAlert 0.5s ease-in-out forwards'
      banner.addEventListener('click', function () {
        banner.style.animation = 'hideAlert 0.5s ease-in-out forwards'
      })
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', append, { once: true })
    } else {
      append()
    }
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.error('Failed to show alert banner', e)
  }
}
