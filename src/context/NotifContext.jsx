import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { invitationsAPI } from '../services/api'
import { useAuth } from './AuthContext'

const NotifContext = createContext({ count: 0, refresh: () => {} })

export function NotifProvider({ children }) {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!user) { setCount(0); return }
    try {
      const { data } = await invitationsAPI.getMes()
      // Invitations reçues EN_ATTENTE uniquement
      const pending = data.filter(i =>
        i.destinataire_id === user.id && i.statut === 'EN_ATTENTE'
      )
      setCount(pending.length)
    } catch {
      setCount(0)
    }
  }, [user])

  // Charger au montage et toutes les 30 secondes
  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <NotifContext.Provider value={{ count, refresh }}>
      {children}
    </NotifContext.Provider>
  )
}

export const useNotif = () => useContext(NotifContext)