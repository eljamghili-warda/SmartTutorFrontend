import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sallesAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Badge, Card, Modal, EmptyState, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const roleBadge = {
  ADMIN:    { v:'primary', label:'👑 Admin' },
  CO_ADMIN: { v:'warning', label:'🤝 Co-admin' },
  MEMBRE:   { v:'default', label:'👤 Membre' }
}

export default function MesSalles() {
  const [salles, setSalles]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [confirmSalle, setConfirm]  = useState(null) // salle à quitter/supprimer
  const navigate = useNavigate()
  const { toasts, success, error } = useToast()

  useEffect(() => {
    sallesAPI.getMesSalles().then(({ data }) => setSalles(data)).finally(() => setLoading(false))
  }, [])

  const handleQuitterClick = (e, salle) => {
    e.stopPropagation()
    setConfirm(salle)
  }

  const handleConfirmerQuitter = async () => {
    const salle = confirmSalle
    setConfirm(null)
    try {
      await sallesAPI.quitter(salle.id)
      setSalles(prev => prev.filter(s => s.id !== salle.id))
      if (salle.mon_role === 'ADMIN') {
        success('La salle a été supprimée.')
      } else {
        success('Vous avez quitté la salle.')
      }
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
                    {/* ✅ Bouton Quitter visible pour TOUS (même admin) */}
                    <Btn variant="danger" size="sm" onClick={(e) => handleQuitterClick(e, s)}>
                      {s.mon_role === 'ADMIN' ? '🗑️ Supprimer' : 'Quitter'}
                    </Btn>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmation quitter/supprimer */}
      <Modal
        open={!!confirmSalle}
        onClose={() => setConfirm(null)}
        title={confirmSalle?.mon_role === 'ADMIN' ? '⚠️ Supprimer la salle' : '⚠️ Quitter la salle'}
      >
        <div className="flex flex-col gap-5">
          {confirmSalle?.mon_role === 'ADMIN' ? (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex gap-3">
              <span className="text-2xl flex-shrink-0">🚨</span>
              <div>
                <p className="text-sm font-semibold text-rose-400 mb-1">Vous êtes l'admin de cette salle</p>
                <p className="text-sm text-slate-400">
                  Si vous quittez <span className="text-white font-medium">"{confirmSalle?.nom}"</span>,
                  la salle sera <span className="text-rose-400 font-semibold">définitivement supprimée</span> avec
                  tous ses messages, fichiers et participants.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Êtes-vous sûr de vouloir quitter <span className="text-white font-medium">"{confirmSalle?.nom}"</span> ?
              Vous devrez demander une nouvelle invitation pour y revenir.
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Btn variant="secondary" onClick={() => setConfirm(null)}>Annuler</Btn>
            <Btn variant="danger" onClick={handleConfirmerQuitter}>
              {confirmSalle?.mon_role === 'ADMIN' ? '🗑️ Supprimer définitivement' : '🚪 Quitter la salle'}
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  )
}