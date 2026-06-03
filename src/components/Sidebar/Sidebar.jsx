import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navByRole = {
  etudiant: [
    { to: '/dashboard',             icon: '⊞',  label: 'Accueil'          },
    { to: '/dashboard/mes-salles',  icon: '🚪',  label: 'Mes salles'      },
    { to: '/dashboard/tuteurs',     icon: '👨‍🏫', label: 'Tuteurs'         },
    { to: '/dashboard/fichiers',    icon: '📁',  label: 'Fichiers'        },
    { to: '/dashboard/invitations', icon: '✉️',  label: 'Invitations'     },
    { to: '/dashboard/emploi',      icon: '📅',  label: 'Emploi du temps' },
    { to: '/dashboard/examens',     icon: '📝',  label: 'Examens'         },
    { to: '/dashboard/certificats', icon: '🎓',  label: 'Certificats'     },
    { to: '/dashboard/parametres',  icon: '⚙️',  label: 'Paramètres'     },
  ],
  tuteur: [
    { to: '/dashboard',                icon: '⊞',  label: 'Mon profil'      },
    { to: '/dashboard/mes-salles',     icon: '🚪',  label: 'Mes salles'     },
    { to: '/dashboard/tuteurs',        icon: '🔍',  label: 'Explorer'       },
    { to: '/dashboard/emploi',         icon: '📅',  label: 'Emploi du temps'},
    { to: '/dashboard/invitations',    icon: '✉️',  label: 'Demandes'       },
    { to: '/dashboard/mes-tarifs',     icon: '💰',  label: 'Mes tarifs'     },
    { to: '/dashboard/disponibilites', icon: '🗓️',  label: 'Disponibilités' },
    { to: '/dashboard/mes-revenus',    icon: '📈',  label: 'Mes revenus'    },
    { to: '/dashboard/examens',        icon: '📝',  label: 'Examens'        },
    { to: '/dashboard/parametres',     icon: '⚙️',  label: 'Paramètres'    },
  ],
  admin: [
    { to: '/admin',                icon: '📊', label: "Vue d'ensemble"  },
    { to: '/admin/utilisateurs',   icon: '👥', label: 'Utilisateurs'    },
    { to: '/admin/tuteurs',        icon: '👨‍🏫',label: 'Tuteurs'         },
    { to: '/admin/salles',         icon: '🚪', label: 'Salles'          },
    { to: '/admin/seances',        icon: '📅', label: 'Séances'         },
    { to: '/admin/revenus',        icon: '💳', label: 'Revenus'         },
  ],
}

// Styles inline complets pour éviter tout override CSS global
const S = {
  aside: {
    width: 224,
    flexShrink: 0,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #0F2040 0%, #0A1628 100%)',
    borderRight: '1px solid rgba(197,160,89,0.2)',
  },
  brand: {
    padding: '18px 20px',
    borderBottom: '1px solid rgba(197,160,89,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg, #C5A059 0%, #E8D5A3 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, boxShadow: '0 4px 12px rgba(197,160,89,0.4)',
  },
  brandName: {
    fontWeight: 800, fontSize: 16,
    color: '#FFFFFF',        // blanc forcé
    display: 'block', lineHeight: 1.2,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  },
  brandSub: {
    fontSize: 9, color: '#C5A059',
    letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  },
  nav: {
    flex: 1, padding: '12px 10px',
    display: 'flex', flexDirection: 'column', gap: 2,
    overflowY: 'auto',
  },
  footer: {
    padding: '12px 10px',
    borderTop: '1px solid rgba(197,160,89,0.15)',
  },
  userBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', marginBottom: 6,
    background: 'rgba(255,255,255,0.04)', borderRadius: 10,
  },
  userName: {
    fontSize: 12, fontWeight: 600,
    color: '#E8D5A3',        // doré clair forcé
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  },
  userRole: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'capitalize',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  },
  logoutBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '8px', borderRadius: 8, background: 'transparent',
    border: '1px solid transparent', cursor: 'pointer',
    fontSize: 12, fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    transition: 'all 0.15s',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  },
}

// Mini avatar inline (sans dépendre du composant Avatar qui peut hériter des overrides)
function SidebarAvatar({ user }) {
  const initials = user ? ((user.prenom?.[0] || '') + (user.nom?.[0] || '')).toUpperCase() : '?'
  const gradients = [
    'linear-gradient(135deg,#162B55,#1E3A6E)',
    'linear-gradient(135deg,#4A90E2,#162B55)',
    'linear-gradient(135deg,#C5A059,#D4B06A)',
    'linear-gradient(135deg,#1E3A6E,#4A90E2)',
  ]
  const g = gradients[(user?.id || 0) % gradients.length]
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: user?.photo_profil ? 'transparent' : g,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#FFFFFF',
      overflow: 'hidden',
    }}>
      {user?.photo_profil
        ? <img src={user.photo_profil} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials
      }
    </div>
  )
}

const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = navByRole[user?.role] || navByRole.etudiant

  const handleLogout = () => { logout(); navigate('/auth') }

  return (
    <aside style={S.aside}>

      {/* ── Brand ─────────────────────────────────────── */}
      <div style={S.brand}>
        <div style={S.logoBox}>🎓</div>
        <div>
          <span style={S.brandName}>SmartTutor</span>
          <span style={S.brandSub}>Academy</span>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav style={S.nav}>
        {items.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard' || to === '/admin'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              transition: 'all 0.15s',
              color: isActive ? '#E8D5A3' : 'rgba(255,255,255,0.6)',
              background: isActive ? 'rgba(197,160,89,0.13)' : 'transparent',
              borderLeft: `3px solid ${isActive ? '#C5A059' : 'transparent'}`,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            })}
            onMouseEnter={e => {
              if (e.currentTarget.getAttribute('aria-current') !== 'page') {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.color = '#FFFFFF'
              }
            }}
            onMouseLeave={e => {
              if (e.currentTarget.getAttribute('aria-current') !== 'page') {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
              }
            }}
          >
            <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Footer ────────────────────────────────────── */}
      <div style={S.footer}>
        <div style={S.userBox}>
          <SidebarAvatar user={user} />
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={S.userName}>{user?.prenom} {user?.nom}</p>
            <p style={S.userRole}>{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={S.logoutBtn}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(220,38,38,0.15)'
            e.currentTarget.style.color = '#FCA5A5'
            e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          🚪 Déconnexion
        </button>
      </div>
    </aside>
  )
}

export default Sidebar