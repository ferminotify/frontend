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
    const banner = document.createElement('div')
    banner.classList.add('alertbanner', typeToClass(type))

    const safeMsg = escapeHtml(msg)
    const iconName = typeToMaterialIcon(type)

    banner.innerHTML = `
      <p id="alertmessage">
        <span class="material-symbols-outlined" style="vertical-align: -0.2em; margin-right: 6px;">${iconName}</span>
        ${safeMsg}
      </p>
    `

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
