import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Badge, Spinner, EmptyState } from '../../components/UI'

const statutConfig = {
  PLANIFIEE: { v: 'warning', label: '⏳ Planifiée' },
  EN_COURS:  { v: 'primary', label: '▶ En cours'   },
  REALISEE:  { v: 'success', label: '✓ Réalisée'   },
  ANNULEE:   { v: 'danger',  label: '✕ Annulée'    },
}

export default function AdminSeances() {
  const [seances,  setSeances]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('ALL')

  useEffect(() => {
    adminAPI.getSeances().then(({ data }) => setSeances(data)).finally(() => setLoading(false))
  }, [])

  const filtered = seances.filter(s => filter === 'ALL' || s.statut === filter)

  const counts = {
    ALL:      seances.length,
    PLANIFIEE: seances.filter(s => s.statut === 'PLANIFIEE').length,
    EN_COURS:  seances.filter(s => s.statut === 'EN_COURS').length,
    REALISEE:  seances.filter(s => s.statut === 'REALISEE').length,
    ANNULEE:   seances.filter(s => s.statut === 'ANNULEE').length,
  }

  return (
    <>
      <Header title="Séances" />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { v:'ALL',       label:'Toutes'    },
            { v:'PLANIFIEE', label:'Planifiées'},
            { v:'EN_COURS',  label:'En cours'  },
            { v:'REALISEE',  label:'Réalisées' },
            { v:'ANNULEE',   label:'Annulées'  },
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
          <EmptyState icon="📅" title="Aucune séance" desc="Aucune séance dans cette catégorie." />
        ) : (
          <div className="bg-ink-800 border border-ink-700 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] px-4 py-2.5 bg-ink-900 border-b border-ink-700 text-xs font-semibold text-slate-500 uppercase tracking-wide gap-3">
              {['Titre','Salle','Tuteur','Date','Durée','Statut'].map(h => <div key={h}>{h}</div>)}
            </div>
            {filtered.map((s, i) => {
              const sc = statutConfig[s.statut] || statutConfig.PLANIFIEE
              return (
                <div key={s.id}
                  className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] px-4 py-3.5 items-center gap-3 text-sm
                    ${i < filtered.length - 1 ? 'border-b border-ink-700/50' : ''}
                    hover:bg-ink-900/40 transition-colors`}>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{s.titre}</p>
                    {s.matiere && <p className="text-xs text-violet-400 mt-0.5">{s.matiere}</p>}
                  </div>
                  <div className="text-slate-400 text-xs truncate">{s.salle_nom}</div>
                  <div className="text-slate-500 text-xs truncate">{s.tuteur_nom || '—'}</div>
                  <div className="text-slate-400 text-xs">
                    {new Date(s.date_debut).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                    <br />
                    <span className="text-slate-600">{new Date(s.date_debut).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</span>
                  </div>
                  <div className="text-slate-400 text-xs">⏱ {s.duree} min</div>
                  <div><Badge variant={sc.v}>{sc.label}</Badge></div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}