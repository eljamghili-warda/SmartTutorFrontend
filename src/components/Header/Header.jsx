import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../UI'

const Header = ({ title, subtitle, onSearch }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const handleSearch = (e) => { e.preventDefault(); onSearch?.(q) }

  return (
    <header style={{
      height: 60, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      background: '#FFFFFF',
      borderBottom: '1px solid #E8D5A3',
      boxShadow: '0 1px 8px rgba(10,22,40,0.06)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <h1 style={{ fontWeight: 700, fontSize: 17, color: '#0A1628', lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: '#8B9CB5', fontWeight: 400 }}>{subtitle}</p>}
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
                border: '1.5px solid #E8D5A3', background: '#FAF4E4',
                color: '#0A1628', outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.12)' }}
              onBlur={e => { e.target.style.borderColor = '#E8D5A3'; e.target.style.boxShadow = 'none' }}
            />
          </form>
        )}

        {/* Notification dot déco */}
        <div style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => navigate('/dashboard/invitations')}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#FAF4E4', border: '1.5px solid #E8D5A3',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>✉️</div>
        </div>

        <button onClick={() => navigate('/dashboard/parametres')}
          style={{ borderRadius: '50%', overflow: 'hidden', border: '2px solid #E8D5A3',
            transition: 'border-color 0.2s', cursor: 'pointer', background: 'none', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#C5A059'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E8D5A3'}>
          <Avatar user={user} size="sm" />
        </button>
      </div>
    </header>
  )
}

export default Header