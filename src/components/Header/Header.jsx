import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../UI'

const Header = ({ title, subtitle, onSearch }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const isAdmin = user?.role === 'admin'

  const handleSearch = (e) => { e.preventDefault(); onSearch?.(q) }

  const bg = isAdmin ? '#171923' : '#FFFFFF'
  const border = isAdmin ? 'rgba(99,102,241,0.2)' : '#E8D5A3'
  const titleColor = isAdmin ? '#F1F5F9' : '#0A1628'
  const subtitleColor = isAdmin ? '#64748B' : '#8B9CB5'
  const searchBg = isAdmin ? '#0F1117' : '#FAF4E4'
  const searchBorder = isAdmin ? 'rgba(99,102,241,0.2)' : '#E8D5A3'
  const searchFocus = isAdmin ? '#6366F1' : '#C5A059'
  const iconBg = isAdmin ? 'rgba(99,102,241,0.1)' : '#FAF4E4'
  const iconBorder = isAdmin ? 'rgba(99,102,241,0.2)' : '#E8D5A3'

  return (
    <header style={{
      height: 60, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      background: bg,
      borderBottom: `1px solid ${border}`,
      boxShadow: isAdmin ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 8px rgba(10,22,40,0.06)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <h1 style={{ fontWeight: 700, fontSize: 17, color: titleColor, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: subtitleColor, fontWeight: 400 }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onSearch && (
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 13 }}>🔍</span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Rechercher..."
              style={{
                paddingLeft: 34, paddingRight: 14, paddingTop: 7, paddingBottom: 7,
                width: 200, fontSize: 13, borderRadius: 10,
                border: `1.5px solid ${searchBorder}`, background: searchBg,
                color: titleColor, outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = searchFocus; e.target.style.boxShadow = `0 0 0 3px ${searchFocus}20` }}
              onBlur={e => { e.target.style.borderColor = searchBorder; e.target.style.boxShadow = 'none' }}
            />
          </form>
        )}

        <div style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => navigate(isAdmin ? '/admin' : '/dashboard/invitations')}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: iconBg, border: `1.5px solid ${iconBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>{isAdmin ? '⚙️' : '✉️'}</div>
        </div>

        <button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard/parametres')}
          style={{ borderRadius: '50%', overflow: 'hidden', border: `2px solid ${iconBorder}`,
            transition: 'border-color 0.2s', cursor: 'pointer', background: 'none', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = searchFocus}
          onMouseLeave={e => e.currentTarget.style.borderColor = iconBorder}>
          <Avatar user={user} size="sm" />
        </button>
      </div>
    </header>
  )
}

export default Header