import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// ── Icônes SVG professionnelles (inline, pas d'emoji) ─────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    home:          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />,
    rooms:         <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />,
    tutors:        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
    files:         <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />,
    invitations:   <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />,
    calendar:      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
    exams:         <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />,
    certificate:   <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />,
    settings:      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />,
    explore:       <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />,
    pricing:       <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />,
    availability:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    revenue:       <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />,
    dashboard:     <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />,
    users:         <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
    sessions:      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />,
    logout:        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />,
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      {icons[name] || icons.home}
    </svg>
  )
}

// ── Navigation par rôle ───────────────────────────────────────────────────────
const navByRole = {
  etudiant: [
    { to: '/dashboard',             icon: 'home',         label: 'Accueil'          },
    { to: '/dashboard/mes-salles',  icon: 'rooms',        label: 'Mes salles'       },
    { to: '/dashboard/tuteurs',     icon: 'tutors',       label: 'Tuteurs'          },
    { to: '/dashboard/fichiers',    icon: 'files',        label: 'Fichiers'         },
    { to: '/dashboard/invitations', icon: 'invitations',  label: 'Invitations'      },
    { to: '/dashboard/emploi',      icon: 'calendar',     label: 'Emploi du temps'  },
    { to: '/dashboard/examens',     icon: 'exams',        label: 'Examens'          },
    { to: '/dashboard/certificats', icon: 'certificate',  label: 'Certificats'      },
    { to: '/dashboard/parametres',  icon: 'settings',     label: 'Paramètres'       },
  ],
  tuteur: [
    { to: '/dashboard',                icon: 'home',         label: 'Accueil'          },
    { to: '/dashboard/mes-salles',     icon: 'rooms',        label: 'Mes salles'       },
    { to: '/dashboard/tuteurs',        icon: 'explore',      label: 'Explorer'         },
    { to: '/dashboard/emploi',         icon: 'calendar',     label: 'Emploi du temps'  },
    { to: '/dashboard/invitations',    icon: 'invitations',  label: 'Demandes'         },
    { to: '/dashboard/mes-tarifs',     icon: 'pricing',      label: 'Mes tarifs'       },
    { to: '/dashboard/disponibilites', icon: 'availability', label: 'Disponibilités'   },
    { to: '/dashboard/mes-revenus',    icon: 'revenue',      label: 'Mes revenus'      },
    { to: '/dashboard/examens',        icon: 'exams',        label: 'Examens'          },
    { to: '/dashboard/parametres',     icon: 'settings',     label: 'Paramètres'       },
  ],
  admin: [
    { to: '/admin',                icon: 'dashboard',  label: "Vue d'ensemble" },
    { to: '/admin/utilisateurs',   icon: 'users',      label: 'Utilisateurs'   },
    { to: '/admin/tuteurs',        icon: 'tutors',     label: 'Tuteurs'        },
    { to: '/admin/salles',         icon: 'rooms',      label: 'Salles'         },
    { to: '/admin/seances',        icon: 'sessions',   label: 'Séances'        },
    { to: '/admin/revenus',        icon: 'revenue',    label: 'Revenus'        },
  ],
}

// ── Avatar ────────────────────────────────────────────────────────────────────
// Avatars SVG par rôle
const AVATAR_ETUDIANT = (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="url(#ge)"/>
    <defs><linearGradient id="ge" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#1E3A6E"/><stop offset="1" stopColor="#4A90E2"/></linearGradient></defs>
    <circle cx="20" cy="15" r="6" fill="#E8D5A3"/>
    <path d="M8 34c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#C5A059"/>
    <path d="M15 13l5-4 5 4v2h-10v-2z" fill="#4A90E2"/>
    <path d="M17 13h6v3h-6z" fill="#74ACEC"/>
  </svg>
)

const AVATAR_TUTEUR = (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="url(#gt)"/>
    <defs><linearGradient id="gt" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#5C3D0A"/><stop offset="1" stopColor="#C5A059"/></linearGradient></defs>
    <circle cx="20" cy="14" r="6" fill="#FDF9F0"/>
    <path d="M8 34c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#8B6914"/>
    <rect x="26" y="20" width="8" height="6" rx="1" fill="#E8D5A3"/>
    <line x1="29" y1="22" x2="31" y2="22" stroke="#8B6914" strokeWidth="1"/>
    <line x1="29" y1="24" x2="31" y2="24" stroke="#8B6914" strokeWidth="1"/>
  </svg>
)

const AVATAR_ADMIN = (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="url(#ga)"/>
    <defs><linearGradient id="ga" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#162B55"/><stop offset="1" stopColor="#2C5282"/></linearGradient></defs>
    <circle cx="20" cy="14" r="6" fill="#E8D5A3"/>
    <path d="M8 34c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#1E3A6E"/>
    <path d="M20 4l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" fill="#C5A059"/>
  </svg>
)

function SidebarAvatar({ user }) {
  if (user?.photo_profil) {
    return (
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        overflow: 'hidden', border: '1.5px solid rgba(197,160,89,0.3)',
      }}>
        <img src={user.photo_profil} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  const avatar = user?.role === 'tuteur' ? AVATAR_TUTEUR
               : user?.role === 'admin'  ? AVATAR_ADMIN
               : AVATAR_ETUDIANT
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', border: '1.5px solid rgba(197,160,89,0.3)',
    }}>
      {avatar}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = navByRole[user?.role] || navByRole.etudiant

  return (
    <aside style={{
      width: 220, flexShrink: 0, height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #0A1628 0%, #060D18 100%)',
      borderRight: '1px solid rgba(197,160,89,0.15)',
    }}>

      {/* Brand */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid rgba(197,160,89,0.12)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <img
          src="/logo.png"
          alt="SmartEdu"
          style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0 }}
          onError={e => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg, #C5A059, #E8D5A3)',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(197,160,89,0.35)',
          color: '#0A1628', display: 'none',
        }}>
          <Icon name="certificate" size={17} />
        </div>
        <div>
          <span style={{
            fontWeight: 800, fontSize: 15, color: '#FFFFFF',
            display: 'block', lineHeight: 1.2,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>SmartEdu</span>
          <span style={{
            fontSize: 9, color: '#C5A059',
            letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>Apprendre Ensemble</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 1,
        overflowY: 'auto',
      }}>
        {items.map(({ to, icon, label }) => (
          <NavLink
            key={to} to={to}
            end={to === '/dashboard' || to === '/admin'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 11px', borderRadius: 9,
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              textDecoration: 'none', transition: 'all 0.15s',
              color: isActive ? '#E8D5A3' : 'rgba(255,255,255,0.5)',
              background: isActive ? 'rgba(197,160,89,0.12)' : 'transparent',
              borderLeft: `2px solid ${isActive ? '#C5A059' : 'transparent'}`,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            })}
            onMouseEnter={e => {
              if (e.currentTarget.getAttribute('aria-current') !== 'page') {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
              }
            }}
            onMouseLeave={e => {
              if (e.currentTarget.getAttribute('aria-current') !== 'page') {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
              }
            }}
          >
            <span style={{ width: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={16} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(197,160,89,0.12)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '8px 10px', marginBottom: 5,
          background: 'rgba(255,255,255,0.04)', borderRadius: 9,
        }}>
          <SidebarAvatar user={user} />
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: '#E8D5A3',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>{user?.prenom} {user?.nom}</p>
            <p style={{
              fontSize: 10, color: 'rgba(255,255,255,0.35)',
              textTransform: 'capitalize',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/auth') }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 7,
            padding: '7px', borderRadius: 8, background: 'transparent',
            border: '1px solid transparent', cursor: 'pointer',
            fontSize: 12, fontWeight: 500,
            color: 'rgba(255,255,255,0.35)',
            transition: 'all 0.15s',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(220,38,38,0.12)'
            e.currentTarget.style.color = '#FCA5A5'
            e.currentTarget.style.borderColor = 'rgba(220,38,38,0.25)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <Icon name="logout" size={14} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar