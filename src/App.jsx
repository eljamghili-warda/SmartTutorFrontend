import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import Auth           from './pages/Auth/Auth'
import DashboardLayout from './components/DashboardLayout/DashboardLayout'
import Dashboard      from './pages/Dashboard/Dashboard'
import MesSalles      from './pages/Dashboard/MesSalles'
import Tuteurs        from './pages/Dashboard/Tuteurs'
import Fichiers       from './pages/Dashboard/Fichiers'
import Invitations    from './pages/Dashboard/Invitations'
import EmploiDuTemps  from './pages/Dashboard/EmploiDuTemps'
import Parametres     from './pages/Dashboard/Parameters'
import MesRevenus     from './pages/Dashboard/MesRevenus'
import MesTarifs          from './pages/Dashboard/MesTarifs'
import MesDisponibilites  from './pages/Dashboard/MesDisponibilites'
import Salle          from './pages/Salle/Salle'
import AdminDashboard from './pages/Admin/Admindashboard'
import AdminUsers     from './pages/Admin/Adminusers'
import AdminTuteurs   from './pages/Admin/AdminTuteurs'
import AdminSalles    from './pages/Admin/AdminSalles'
import AdminSeances   from './pages/Admin/AdminSeances'
import AdminRevenus   from './pages/Admin/AdminRevenus'

 function App() {
  return (
    
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"     element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />

          {/* Salle (plein écran) */}
          <Route path="/salle/:id" element={<Salle />} />

          {/* Dashboard étudiant / tuteur */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard"              element={<Dashboard />} />
            <Route path="/dashboard/mes-salles"   element={<MesSalles />} />
            <Route path="/dashboard/tuteurs"      element={<Tuteurs />} />
            <Route path="/dashboard/fichiers"     element={<Fichiers />} />
            <Route path="/dashboard/invitations"  element={<Invitations />} />
            <Route path="/dashboard/emploi"       element={<EmploiDuTemps />} />
            <Route path="/dashboard/parametres"   element={<Parametres />} />
            <Route path="/dashboard/mes-revenus"  element={<MesRevenus />} />
            <Route path="/dashboard/mes-tarifs"        element={<MesTarifs />} />
            <Route path="/dashboard/disponibilites"    element={<MesDisponibilites />} />
          </Route>

          {/* Admin */}
          <Route element={<DashboardLayout adminOnly />}>
            <Route path="/admin"                  element={<AdminDashboard />} />
            <Route path="/admin/utilisateurs"     element={<AdminUsers />} />
            <Route path="/admin/tuteurs"          element={<AdminTuteurs />} />
            <Route path="/admin/salles"           element={<AdminSalles />} />
            <Route path="/admin/seances"          element={<AdminSeances />} />
            <Route path="/admin/revenus"          element={<AdminRevenus />} />
          </Route>

          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App