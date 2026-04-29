import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Badge, Spinner, EmptyState, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const statutConfig = {
  ACTIVE_AVEC_TUTEUR:  { v: 'primary', label: '👨‍🏫 Avec tuteur'  },
  ACTIVE_SANS_TUTEUR:  { v: 'success', label: '📚 Sans tuteur'   },
  HORS_LIGNE:          { v: 'warning', label: '💤 Hors ligne'    },
  FERMEE:              { v: 'danger',  label: '🔴 Fermée'        },
}

export default function AdminSalles() {
  const [salles,   setSalles]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('ALL')
  const { toasts, success, error } = useToast()

  useEffect(() => {
    adminAPI.getSalles().then(({ data }) => setSalles(data)).finally(() => setLoading(false))
  }, [])

  const fermer = async (id) => {
    if (!confirm('Forcer la fermeture de cette salle ?')) return
    try {
      await adminAPI.fermerSalle(id)
      setSalles(prev => prev.map(s => s.id === id ? { ...s, statut: 'FERMEE' } : s))
      success('Salle fermée.')
    } catch { error('Erreur') }
  }

  const filtered = salles.filter(s => filter === 'ALL' || s.statut === filter)

  return (
    <>
      <Header title="Gestion des salles" />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

        {/* Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          {[
            { v:'ALL',                 label:'Toutes'       },
            { v:'ACTIVE_AVEC_TUTEUR',  label:'Avec tuteur'  },
            { v:'ACTIVE_SANS_TUTEUR',  label:'Sans tuteur'  },
            { v:'FERMEE',              label:'Fermées'      },
          ].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
                ${filter === f.v
                  ? 'bg-violet-600/15 text-violet-400 border-violet-600/30'
                  : 'bg-ink-800 text-slate-400 border-ink-700 hover:border-ink-600'}`}>
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-slate-500">{filtered.length} salle{filtered.length > 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🚪" title="Aucune salle" />
        ) : (
          <div className="bg-ink-800 border border-ink-700 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] px-4 py-2.5 bg-ink-900 border-b border-ink-700 text-xs font-semibold text-slate-500 uppercase tracking-wide gap-3">
              {['Salle','Type','Statut','Participants','Créateur','Action'].map(h => <div key={h}>{h}</div>)}
            </div>
            {filtered.map((s, i) => {
              const sc = statutConfig[s.statut] || statutConfig.FERMEE
              return (
                <div key={s.id}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] px-4 py-3.5 items-center gap-3 text-sm
                    ${i < filtered.length - 1 ? 'border-b border-ink-700/50' : ''}
                    hover:bg-ink-900/40 transition-colors`}>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{s.nom}</p>
                    {s.matiere && <p className="text-xs text-violet-400 mt-0.5">📖 {s.matiere}</p>}
                  </div>
                  <div>
                    <Badge variant={s.type === 'PUBLIQUE' ? 'public' : 'private'}>
                      {s.type === 'PUBLIQUE' ? '🔓 Publique' : '🔒 Privée'}
                    </Badge>
                  </div>
                  <div><Badge variant={sc.v}>{sc.label}</Badge></div>
                  <div className="text-slate-400 text-xs">👥 {s.nb_participants}</div>
                  <div className="text-slate-500 text-xs truncate">{s.createur_nom || '—'}</div>
                  <div>
                    {s.statut !== 'FERMEE' && (
                      <Btn variant="danger" size="sm" onClick={() => fermer(s.id)}>Fermer</Btn>
                    )}
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