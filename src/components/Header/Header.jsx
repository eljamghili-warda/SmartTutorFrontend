import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotif } from '../../context/NotifContext'
import { Avatar } from '../UI'

const Header = ({ title, onSearch }) => {
  const { user } = useAuth()
  const { count } = useNotif()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch?.(q)
  }

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 bg-ink-900 border-b border-ink-700">
      <h1 className="font-display font-bold text-lg text-white">{title}</h1>
      <div className="flex items-center gap-3">
        {onSearch && (
          <form onSubmit={handleSearch} className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Rechercher..."
              className="!pl-9 !py-2 !w-52 !text-sm !rounded-xl"
            />
          </form>
        )}

        {/* Enveloppe avec badge */}
        <button
          onClick={() => navigate('/dashboard/invitations')}
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          title="Invitations"
        >
          <span style={{ fontSize: 18 }}>✉️</span>
          {count > 0 && (
            <span style={{
              position: 'absolute',
              top: 0, right: 0,
              background: '#ef4444',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              borderRadius: 99,
              minWidth: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: 1,
              boxShadow: '0 0 0 2px #0f1117',
            }}>
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>

        <button onClick={() => navigate('/dashboard/parametres')}
          className="rounded-xl overflow-hidden hover:ring-2 hover:ring-violet-500/50 transition-all">
          <Avatar user={user} size="sm" />
        </button>
      </div>
    </header>
  )
}

export default Header