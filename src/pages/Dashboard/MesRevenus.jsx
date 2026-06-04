import React, { useState, useEffect } from 'react'
import { paiementsAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Spinner } from '../../components/UI'

const STATUT = {
  COMPLETE:  { label: 'Reçu',      color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  REMBOURSE: { label: 'Remboursé', color: 'text-rose-500',    bg: 'bg-rose-50',     border: 'border-rose-200'    },
}

export default function MesRevenus() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [erreur,  setErreur]  = useState('')

  useEffect(() => {
    paiementsAPI.getMesRevenus()
      .then(({ data }) => setData(data))
      .catch(() => setErreur('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const stats     = data?.stats     || {}
  const paiements = data?.paiements || []

  return (
    <div className="flex flex-col h-full">
      <Header title="Mes Revenus" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">

          {/* ── Titre ── */}
          <div>
            <h1 className="font-bold text-xl text-ink-800">💰 Mes Revenus</h1>
            <p className="text-sm text-slate-500 mt-0.5">Historique de vos gains sur SmartEdu</p>
          </div>

          {loading && <div className="flex justify-center py-16"><Spinner /></div>}
          {erreur  && <p className="text-rose-500 text-center">{erreur}</p>}

          {!loading && data && (<>

            {/* ── Stats cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Gains totaux',   value: `${parseFloat(stats.total_gains     || 0).toFixed(2)} DH`, icon: '🎉', border: 'border-t-blue-600'   },
                { label: 'Séances payées', value:  stats.nb_paiements || 0,                                  icon: '📚', border: 'border-t-blue-400'   },
                { label: 'Remboursements', value: `${parseFloat(stats.total_rembourse || 0).toFixed(2)} DH`, icon: '↩️', border: 'border-t-amber-400'  },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl border border-blue-200 bg-white shadow-sm p-5 border-t-4 ${s.border}`}>
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="font-black text-2xl text-ink-800">{s.value}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── Info commission ── */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              ℹ️ Vos gains représentent <strong>85%</strong> du montant total de chaque séance. Les 15% restants constituent la commission de la plateforme.
            </div>

            {/* ── Historique ── */}
            <div className="rounded-2xl border border-blue-200 bg-white shadow-sm overflow-hidden">

              {/* Header */}
              <div className="px-5 py-3 bg-blue-50 border-b border-blue-200">
                <h2 className="font-bold text-sm text-ink-800">Historique des paiements</h2>
              </div>

              {paiements.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                  <span className="text-4xl">📭</span>
                  <p className="text-sm">Aucun paiement reçu pour l'instant</p>
                </div>
              ) : paiements.map((p, i) => {
                const st = STATUT[p.statut] || STATUT.COMPLETE
                return (
                  <div key={p.id}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-blue-50/50 transition-colors
                      ${i < paiements.length - 1 ? 'border-b border-blue-100' : ''}`}
                  >
                    {/* Icône */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                      ${st.bg} border ${st.border}`}>
                      {p.statut === 'REMBOURSE' ? '↩️' : '💸'}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-ink-800 text-sm truncate">{p.seance_titre}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {p.salle_nom} · {p.matiere || '—'} · {p.payeur_prenom} {p.payeur_nom}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(p.date_paiement).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    {/* Montant */}
                    <div className="text-right flex-shrink-0">
                      <p className={`font-black text-lg ${st.color}`}>
                        {p.statut === 'REMBOURSE' ? '-' : '+'}{parseFloat(p.gain_tuteur).toFixed(2)} DH
                      </p>
                      <p className="text-xs text-slate-400">Total: {p.montant_total} DH</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${st.bg} ${st.color} border ${st.border}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>)}

        </div>
      </div>
    </div>
  )
}