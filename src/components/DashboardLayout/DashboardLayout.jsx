import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../Sidebar/Sidebar'
import { Spinner } from '../UI'

const DashboardLayout = ({ adminOnly = false }) => {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-ink-950">
      <Spinner size="lg" />
    </div>
  )

  if (!user) return <Navigate to="/auth" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  if (!adminOnly && user.role === 'admin') return <Navigate to="/admin" replace />

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout