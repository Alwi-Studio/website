import { useEffect, useState } from 'react'
import { listeners } from './toastBus.js'

// The single toast mounted at the root; see toastBus.js for showToast and copyText.
function Toast() {
  const [message, setMessage] = useState({ text: '', id: 0 })

  useEffect(() => {
    const listener = (text) => setMessage((current) => ({ text, id: current.id + 1 }))
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, [])

  useEffect(() => {
    if (!message.id) return undefined
    const timer = window.setTimeout(() => setMessage((current) => ({ ...current, id: 0 })), 1800)
    return () => window.clearTimeout(timer)
  }, [message])

  return (
    <div className={`toast${message.id ? ' is-on' : ''}`} role="status" aria-live="polite">
      {message.text}
    </div>
  )
}

export default Toast
