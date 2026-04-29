import { useState, useCallback } from 'react'

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const success = (msg) => toast(msg, 'success')
  const error   = (msg) => toast(msg, 'error')
  const info    = (msg) => toast(msg, 'info')

  return { toasts, toast, success, error, info }
}