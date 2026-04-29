import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { initSocket, disconnectSocket } from '../services/socket'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    authAPI.getMe()
      .then(({ data }) => { setUser(data); initSocket(token) })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, motDePasse) => {
    const { data } = await authAPI.login({ email, motDePasse })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    initSocket(data.token)
    return data
  }

  const register = async (payload) => {
    const { data } = await authAPI.register(payload)
    if (data.token) { localStorage.setItem('token', data.token); setUser(data.user); initSocket(data.token) }
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    disconnectSocket()
  }

  const updateUser = (patch) => setUser(prev => ({ ...prev, ...patch }))

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}