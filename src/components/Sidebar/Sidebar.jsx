import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotif } from '../../context/NotifContext'
import { Avatar } from '../UI'

const navByRole = {
  etudiant: [
    { to: '/dashboard',             icon: '⊞',  label: 'Accueil'         },
    { to: '/dashboard/mes-salles',  icon: '🚪',  label: 'Mes salles'     },
    { to: '/dashboard/tuteurs',     icon: '👨‍🏫', label: 'Tuteurs'        },
    { to: '/dashboard/fichiers',    icon: '📁',  label: 'Fichiers'       },
    { to: '/dashboard/invitations', icon: '✉️',  label: 'Invitations'    },
    { to: '/dashboard/emploi',      icon: '📅',  label: 'Emploi du temps'},
    { to: '/dashboard/parametres',  icon: '⚙️',  label: 'Paramètres'    },
    { to: '/dashboard/examens',      icon: '📝',  label: 'Examens'       },
    { to: '/dashboard/certificats',  icon: '🎓',  label: 'Certificats'   },
  ],
  tuteur: [
    { to: '/dashboard',             icon: '⊞',  label: 'Mon profil'     },
    { to: '/dashboard/mes-salles',  icon: '🚪',  label: 'Mes salles'    },
    { to: '/dashboard/tuteurs',     icon: '🔍',  label: 'Explorer'      },
    { to: '/dashboard/emploi',      icon: '📅',  label: 'Emploi du temps'},
    { to: '/dashboard/invitations', icon: '✉️',  label: 'Demandes'      },
    { to: '/dashboard/mes-tarifs',        icon: '💰',  label: 'Mes tarifs'        },
    { to: '/dashboard/disponibilites',    icon: '🗓️',  label: 'Disponibilités'    },
    { to: '/dashboard/mes-revenus', icon: '📈',  label: 'Mes revenus'   },
    { to: '/dashboard/examens',     icon: '📝',  label: 'Examens'       },
    { to: '/dashboard/parametres',  icon: '⚙️',  label: 'Paramètres'   },
  ],
  admin: [
    { to: '/admin',                  icon: '📊', label: 'Vue d\'ensemble' },
    { to: '/admin/utilisateurs',     icon: '👥', label: 'Utilisateurs'   },
    { to: '/admin/tuteurs',          icon: '👨‍🏫',label: 'Tuteurs'        },
    { to: '/admin/salles',           icon: '🚪', label: 'Salles'         },
    { to: '/admin/seances',          icon: '📅', label: 'Séances'        },
    { to: '/admin/revenus',          icon: '💳', label: 'Revenus'        },
  ],
}

const Sidebar = () => {
  const { user, logout } = useAuth()
  const { count } = useNotif()
  const navigate = useNavigate()
  const items = navByRole[user?.role] || navByRole.etudiant

  const handleLogout = () => { logout(); navigate('/auth') }

  return (
    <aside className="w-56 flex-shrink-0 h-screen flex flex-col bg-ink-900 border-r border-ink-700">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-ink-700">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SmartEdu" className="w-10 h-10 object-contain rounded-xl" />
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-sm text-white">SmartEdu</span>
            <span className="text-xs text-slate-500">Apprendre Ensemble</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {items.map(({ to, icon, label }) => {
          const isInvitLink = to === '/dashboard/invitations'
          const showBadge = isInvitLink && count > 0
          return (
            <NavLink key={to} to={to} end={to === '/dashboard' || to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-violet-600/15 text-violet-400 border border-violet-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-ink-700'}`
              }>
              <span className="text-base w-5 text-center">{icon}</span>
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: 99,
                  minWidth: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 5px',
                  lineHeight: 1,
                  boxShadow: '0 0 0 2px #0f1117',
                }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-ink-700 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar user={user} size="sm" />
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.prenom} {user?.nom}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-150">
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

export default Sidebar