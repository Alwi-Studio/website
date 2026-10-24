// One toast for the whole app. Anything can call showToast or copyText without
// a provider; the single <Toast /> mounted at the root listens for messages.
export const listeners = new Set()

export function showToast(text) {
  listeners.forEach((listener) => listener(text))
}

export async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value)
    showToast(`Copied ${value}`)
  } catch {
    showToast(`Server IP: ${value}`)
  }
}

