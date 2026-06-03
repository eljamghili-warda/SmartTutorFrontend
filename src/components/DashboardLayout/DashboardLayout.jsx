import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../Sidebar/Sidebar'
import { Spinner } from '../UI'

const DashboardLayout = ({ adminOnly = false }) => {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0E6' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Spinner size="lg" />
        <p style={{ color: '#8B6914', fontSize: 13, fontWeight: 500 }}>Chargement…</p>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/auth" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  if (!adminOnly && user.role === 'admin') return <Navigate to="/admin" replace />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F5F0E6' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout