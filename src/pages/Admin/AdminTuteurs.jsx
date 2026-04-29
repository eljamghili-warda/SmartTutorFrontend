import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Badge, Avatar, Stars, Spinner, EmptyState, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const statutConfig = {
  PENDING:   { v: 'warning', label: '⏳ En attente' },
  ACTIVE:    { v: 'success', label: '✓ Validé'      },
  REJECTED:  { v: 'danger',  label: '✕ Refusé'      },
  SUSPENDED: { v: 'danger',  label: '🔒 Suspendu'   },
}

export default function AdminTuteurs() {
  const [tuteurs,  setTuteurs]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('ALL')
  const { toasts, success, error } = useToast()

  useEffect(() => {
    adminAPI.getUtilisateurs({ role: 'tuteur' })
      .then(({ data }) => setTuteurs(data))
      .finally(() => setLoading(false))
  }, [])

  const valider = async (id, accepte) => {
    try {
      await adminAPI.validerTuteur(id, accepte)
      setTuteurs(prev => prev.map(t =>
        t.id === id ? { ...t, statut_tuteur: accepte ? 'ACTIVE' : 'REJECTED' } : t
      ))
      success(accepte ? '✅ Tuteur validé !' : 'Tuteur refusé.')
    } catch { error('Erreur') }
  }

  const filtered = tuteurs.filter(t =>
    filter === 'ALL' || t.statut_tuteur === filter
  )

  const counts = {
    ALL:      tuteurs.length,
    PENDING:  tuteurs.filter(t => t.statut_tuteur === 'PENDING').length,
    ACTIVE:   tuteurs.filter(t => t.statut_tuteur === 'ACTIVE').length,
    REJECTED: tuteurs.filter(t => t.statut_tuteur === 'REJECTED').length,
  }

  return (
    <>
      <Header title="Gestion des tuteurs" />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { v: 'ALL',      label: 'Tous'         },
            { v: 'PENDING',  label: '⏳ En attente' },
            { v: 'ACTIVE',   label: '✓ Validés'    },
            { v: 'REJECTED', label: '✕ Refusés'    },
          ].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border flex items-center gap-2
                ${filter === f.v
                  ? 'bg-violet-600/15 text-violet-400 border-violet-600/30'
                  : 'bg-ink-800 text-slate-400 border-ink-700 hover:border-ink-600'}`}>
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full
                ${filter === f.v ? 'bg-violet-600/30 text-violet-300' : 'bg-ink-700 text-slate-500'}`}>
                {counts[f.v]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="👨‍🏫" title="Aucun tuteur" desc="Aucun tuteur dans cette catégorie." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(t => {
              const sc = statutConfig[t.statut_tuteur] || statutConfig.PENDING
              return (
                <div key={t.id}
                  className="bg-ink-800 border border-ink-700 rounded-2xl p-5 flex flex-col gap-4 hover:border-ink-600 transition-colors">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <Avatar user={t} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-bold text-white">{t.prenom} {t.nom}</p>
                        <Badge variant={sc.v}>{sc.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{t.email}</p>
                      <Stars note={t.note_moyenne || 0} />
                    </div>
                  </div>

                  {/* Spécialités */}
                  {(t.specialites || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {t.specialites.map(s => (
                        <span key={s} className="px-2.5 py-0.5 rounded-full bg-violet-600/15 text-violet-400 text-xs border border-violet-600/25">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Inscription */}
                  <p className="text-xs text-slate-600">
                    Inscrit le {new Date(t.date_inscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>

                  {/* Actions */}
                  {t.statut_tuteur === 'PENDING' && (
                    <div className="flex gap-2 pt-1 border-t border-ink-700">
                      <Btn variant="success" size="sm" onClick={() => valider(t.id, true)}  className="flex-1 justify-center">✓ Valider</Btn>
                      <Btn variant="danger"  size="sm" onClick={() => valider(t.id, false)} className="flex-1 justify-center">✕ Refuser</Btn>
                    </div>
                  )}
                  {t.statut_tuteur === 'ACTIVE' && (
                    <div className="pt-1 border-t border-ink-700">
                      <Btn variant="danger" size="sm" onClick={() => valider(t.id, false)} className="w-full justify-center">
                        Révoquer la validation
                      </Btn>
                    </div>
                  )}
                  {t.statut_tuteur === 'REJECTED' && (
                    <div className="pt-1 border-t border-ink-700">
                      <Btn variant="success" size="sm" onClick={() => valider(t.id, true)} className="w-full justify-center">
                        Valider quand même
                      </Btn>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}