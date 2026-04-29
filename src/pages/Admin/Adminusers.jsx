import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Badge, Avatar, Spinner, EmptyState, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const roleBadge = {
  etudiant: { v:'default', label:'👨‍🎓 Étudiant' },
  tuteur:   { v:'primary', label:'👨‍🏫 Tuteur'   },
  admin:    { v:'warning', label:'🛡️ Admin'      },
}

export default function AdminUsers() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')
  const { toasts, success, error } = useToast()

  const load = (search = '') => {
    setLoading(true)
    adminAPI.getUtilisateurs({ search }).then(({ data }) => setUsers(data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleBloquer = async (id, estBloque) => {
    try {
      await adminAPI.bloquer(id, !estBloque)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, est_bloque: !estBloque } : u))
      success(estBloque ? 'Utilisateur débloqué.' : 'Utilisateur bloqué.')
    } catch { error('Erreur') }
  }

  const handleSupprimer = async (id) => {
    if (!confirm('Supprimer définitivement cet utilisateur ?')) return
    try {
      await adminAPI.supprimer(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      success('Utilisateur supprimé.')
    } catch { error('Erreur') }
  }

  const filtered = users.filter(u =>
    !filter || u.role === filter
  )

  return (
    <>
      <Header title="Utilisateurs" onSearch={load} />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {/* Filters */}
        <div className="flex gap-2">
          {[{ v:'', label:'Tous' },{ v:'etudiant', label:'Étudiants' },{ v:'tuteur', label:'Tuteurs' },{ v:'admin', label:'Admins' }].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
                ${filter === f.v ? 'bg-violet-600/15 text-violet-400 border-violet-600/30' : 'bg-ink-800 text-slate-400 border-ink-700 hover:border-ink-600'}`}>
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-slate-500 self-center">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="👥" title="Aucun utilisateur" />
        ) : (
          <div className="bg-ink-800 border border-ink-700 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] px-4 py-2.5 bg-ink-900 border-b border-ink-700 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {['Utilisateur','Email','Rôle','Statut','Inscription','Actions'].map(h => (
                <div key={h}>{h}</div>
              ))}
            </div>
            {/* Rows */}
            {filtered.map((u, i) => {
              const rb = roleBadge[u.role] || roleBadge.etudiant
              return (
                <div key={u.id}
                  className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] px-4 py-3 items-center gap-2 text-sm
                    ${i < filtered.length - 1 ? 'border-b border-ink-700/50' : ''}
                    ${u.est_bloque ? 'opacity-50' : ''} hover:bg-ink-900/50 transition-colors`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar user={u} size="sm" />
                    <span className="font-medium text-slate-200 truncate">{u.prenom} {u.nom}</span>
                  </div>
                  <div className="text-slate-500 text-xs truncate">{u.email}</div>
                  <div><Badge variant={rb.v}>{rb.label}</Badge></div>
                  <div>
                    {u.est_bloque
                      ? <Badge variant="danger">🔒 Bloqué</Badge>
                      : <Badge variant="success">✓ Actif</Badge>
                    }
                    {u.statut_tuteur && u.statut_tuteur !== 'ACTIVE' && (
                      <Badge variant="warning" className="ml-1">{u.statut_tuteur}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-600">
                    {new Date(u.date_inscription).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex gap-1.5">
                    <Btn variant="secondary" size="sm" onClick={() => handleBloquer(u.id, u.est_bloque)}>
                      {u.est_bloque ? '🔓' : '🔒'}
                    </Btn>
                    <Btn variant="danger" size="sm" onClick={() => handleSupprimer(u.id)}>🗑</Btn>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}