import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sallesAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Badge, Card, EmptyState, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const roleBadge = {
  ADMIN:    { v:'primary', label:'👑 Admin' },
  CO_ADMIN: { v:'warning', label:'🤝 Co-admin' },
  MEMBRE:   { v:'default', label:'👤 Membre' }
}

export default function MesSalles() {
  const [salles, setSalles]   = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { toasts, success, error } = useToast()

  useEffect(() => {
    sallesAPI.getMesSalles().then(({ data }) => setSalles(data)).finally(() => setLoading(false))
  }, [])

  const handleQuitter = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Quitter cette salle définitivement ?')) return
    try {
      await sallesAPI.quitter(id)
      setSalles(prev => prev.filter(s => s.id !== id))
      success('Vous avez quitté la salle.')
    } catch (err) {
      error(err.response?.data?.error || 'Erreur')
    }
  }

  return (
    <>
      <Header title="Mes salles" />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : salles.length === 0 ? (
          <EmptyState icon="🚪" title="Aucune salle rejointe"
            desc="Rejoignez ou créez une salle depuis l'accueil."
            action={<Btn onClick={() => navigate('/dashboard')}>Explorer les salles</Btn>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {salles.map(s => {
              // ✅ FIX: utiliser mon_role (pas role)
              const rb = roleBadge[s.mon_role] || roleBadge.MEMBRE
              return (
                <Card key={s.id} onClick={() => navigate(`/salle/${s.id}`)} className="flex flex-col gap-3 group">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={s.type === 'PUBLIQUE' ? 'public' : 'private'}>
                      {s.type === 'PUBLIQUE' ? '🔓' : '🔒'} {s.type === 'PUBLIQUE' ? 'Publique' : 'Privée'}
                    </Badge>
                    <Badge variant={rb.v}>{rb.label}</Badge>
                  </div>
                  <h3 className="font-display font-bold text-white group-hover:text-violet-400 transition-colors">{s.nom}</h3>
                  {s.matiere && <p className="text-xs text-violet-400">📖 {s.matiere}</p>}
                  <p className="text-sm text-slate-500 flex-1 line-clamp-2">{s.description || 'Aucune description.'}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-ink-700">
                    <span className="text-xs text-slate-500">👥 {s.nb_participants}</span>
                    {s.mon_role !== 'ADMIN' && (
                      <Btn variant="danger" size="sm" onClick={(e) => handleQuitter(e, s.id)}>Quitter</Btn>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}