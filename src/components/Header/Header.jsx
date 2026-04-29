import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../UI'

const Header = ({ title, onSearch }) => {
  const { user } = useAuth()
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
        <button onClick={() => navigate('/dashboard/parametres')}
          className="rounded-xl overflow-hidden hover:ring-2 hover:ring-violet-500/50 transition-all">
          <Avatar user={user} size="sm" />
        </button>
      </div>
    </header>
  )
}

export default Header