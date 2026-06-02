import React, { useEffect, useState } from 'react'
import { examensAPI } from '../../services/api'
import { Spinner } from '../../components/UI'

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '—'

export default function PanelDetailsExamen({ examen, onClose }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('details') // details | questions | etudiants

  useEffect(() => {
    examensAPI.getStats(examen.id)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [examen.id])

  return (
    <div className="flex flex-col h-full max-h-[80vh]">

      {/* Tabs */}
      <div className="flex gap-1 px-6 pb-4 border-b border-ink-700">
        {[
          { key: 'details',   label: 'ℹ️ Détails' },
          { key: 'questions', label: '❓ Questions' },
          { key: 'etudiants', label: `👥 Étudiants${data ? ` (${data.stats.total})` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
              ${tab === t.key ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-ink-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !data ? (
          <p className="text-center text-rose-400 py-8">Impossible de charger les statistiques.</p>
        ) : tab === 'details' ? (
          <TabDetails examen={data.examen} stats={data.stats} />
        ) : tab === 'questions' ? (
          <TabQuestions questions={data.questions} />
        ) : (
          <TabEtudiants tentatives={data.tentatives} stats={data.stats} notePassage={data.examen.note_passage} />
        )}
      </div>
    </div>
  )
}

// ─── Onglet Détails ───────────────────────────────────────────────────────────
function TabDetails({ examen, stats }) {
  const infos = [
    { icon: '📅', label: 'Date de publication',       value: fmt(examen.published_at) },
    { icon: '🚦', label: 'Date de début',              value: fmt(examen.date_debut) },
    { icon: '⏰', label: 'Date limite',                value: fmt(examen.date_limite) },
    { icon: '📊', label: 'Affichage des résultats',   value: fmt(examen.date_affichage_resultats) },
    { icon: '⏱',  label: 'Durée',                     value: `${examen.duree_minutes} minutes` },
    { icon: '🎯', label: 'Note de passage',            value: `${examen.note_passage}%` },
    { icon: '🔁', label: 'Tentatives max',             value: examen.max_tentatives || 'Illimité' },
    { icon: '📋', label: 'Mode affichage',             value: examen.mode_affichage === 'LISTE_COMPLETE' ? 'Liste complète' : 'Question par question' },
    { icon: '🔀', label: 'Mélanger les questions',    value: examen.melanger_questions ? 'Oui' : 'Non' },
    { icon: '🔀', label: 'Mélanger les réponses',     value: examen.melanger_reponses  ? 'Oui' : 'Non' },
  ]

  const statCards = [
    { label: 'Tentatives',    value: stats.total,      color: 'text-slate-100' },
    { label: 'Terminées',     value: stats.terminees,  color: 'text-blue-400'  },
    { label: 'Réussies',      value: stats.reussies,   color: 'text-emerald-400' },
    { label: 'Échecs',        value: stats.echecs,     color: 'text-rose-400'  },
    { label: 'Taux réussite', value: stats.tauxReussite ? `${stats.tauxReussite}%` : '—', color: 'text-violet-400' },
    { label: 'Moy. score',    value: stats.moyenneScore ? `${stats.moyenneScore}%` : '—', color: 'text-amber-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">📈 Statistiques globales</h3>
        <div className="grid grid-cols-3 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="bg-ink-700 rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Infos détaillées */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">⚙️ Configuration</h3>
        <div className="space-y-2">
          {infos.map(({ icon, label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-ink-700/50">
              <span className="text-sm text-slate-400">{icon} {label}</span>
              <span className="text-sm font-semibold text-slate-200">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Onglet Questions ─────────────────────────────────────────────────────────
function TabQuestions({ questions }) {
  const [openIdx, setOpenIdx] = useState(null)

  if (!questions.length) return (
    <p className="text-center text-slate-500 py-8">Aucune question.</p>
  )

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">{questions.length} question{questions.length > 1 ? 's' : ''} au total</p>
      {questions.map((q, i) => {
        const isOpen = openIdx === i
        const reponses = Array.isArray(q.reponses) ? q.reponses : []
        const bonnes = reponses.filter(r => r.est_correcte)
        const totalPts = questions.reduce((sum, q2) => sum + parseFloat(q2.points || 0), 0)

        return (
          <div key={q.id} className="bg-ink-700 border border-ink-600 rounded-xl overflow-hidden">
            {/* Header question */}
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-ink-600/50 transition-colors">
              <span className="w-7 h-7 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-400 flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-semibold">{q.type}</span>
                  <span className="text-xs text-amber-400">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                  <span className="text-xs text-emerald-400">✅ {bonnes.length} bonne{bonnes.length > 1 ? 's' : ''} réponse{bonnes.length > 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm text-slate-100 font-medium leading-relaxed">{q.texte}</p>
              </div>
              <span className="text-slate-500 text-xs flex-shrink-0 mt-1">{isOpen ? '▲' : '▼'}</span>
            </button>

            {/* Réponses */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-2 border-t border-ink-600">
                <p className="text-xs text-slate-500 pt-3 mb-2">Réponses :</p>
                {reponses.map(r => (
                  <div key={r.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm
                      ${r.est_correcte
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-ink-800 border-ink-600 text-slate-400'}`}>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold
                      ${r.est_correcte ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-ink-500'}`}>
                      {r.est_correcte ? '✓' : ''}
                    </span>
                    <span className="flex-1">{r.texte}</span>
                    {r.est_correcte && <span className="text-xs text-emerald-400 font-semibold">✅ Correcte</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Onglet Étudiants ─────────────────────────────────────────────────────────
function TabEtudiants({ tentatives, stats, notePassage }) {
  if (!tentatives.length) return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">👥</div>
      <p className="text-slate-400 font-semibold">Aucun étudiant n'a encore passé cet examen.</p>
    </div>
  )

  // Grouper par étudiant — garder meilleure tentative
  const parEtudiant = {}
  tentatives.forEach(t => {
    const key = t.etudiant_id
    if (!parEtudiant[key]) {
      parEtudiant[key] = { ...t, toutes: [] }
    }
    parEtudiant[key].toutes.push(t)
    // Garder la meilleure tentative (ou la dernière REUSSI)
    if (t.statut === 'REUSSI' || (!parEtudiant[key].statut === 'REUSSI' && parseFloat(t.pourcentage) > parseFloat(parEtudiant[key].pourcentage || 0))) {
      parEtudiant[key] = { ...t, toutes: parEtudiant[key].toutes }
    }
  })
  const etudiants = Object.values(parEtudiant).sort((a, b) => parseFloat(b.pourcentage || 0) - parseFloat(a.pourcentage || 0))

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="bg-ink-700 rounded-xl p-3 flex items-center justify-between text-sm">
        <span className="text-slate-400">
          <strong className="text-slate-100">{etudiants.length}</strong> étudiant{etudiants.length > 1 ? 's' : ''} ont passé l'examen
        </span>
        <span className="text-slate-400">
          <strong className="text-emerald-400">{stats.reussies}</strong> réussite{stats.reussies > 1 ? 's' : ''}
        </span>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {etudiants.map((e, idx) => {
          const reussi  = e.statut === 'REUSSI'
          const pct     = parseFloat(e.pourcentage || 0)
          const nbTentatives = e.toutes.length

          return (
            <div key={e.etudiant_id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all
                ${reussi
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : e.statut === 'EN_COURS'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-ink-700 border-ink-600'}`}>

              {/* Rang */}
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${idx === 0 ? 'bg-amber-500/20 text-amber-400' : idx === 1 ? 'bg-slate-500/20 text-slate-400' : idx === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-ink-600 text-slate-500'}`}>
                {idx + 1}
              </span>

              {/* Avatar + nom */}
              <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-400 flex-shrink-0">
                {(e.etudiant_prenom?.[0] || '?').toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">
                  {e.etudiant_prenom} {e.etudiant_nom}
                </p>
                <p className="text-xs text-slate-500">
                  {nbTentatives} tentative{nbTentatives > 1 ? 's' : ''}
                  {e.statut === 'EN_COURS' && ' · En cours…'}
                </p>
              </div>

              {/* Score + barre */}
              <div className="flex-shrink-0 text-right">
                {e.statut === 'EN_COURS' ? (
                  <span className="text-xs text-amber-400 font-semibold">⏳ En cours</span>
                ) : (
                  <>
                    <p className={`text-lg font-bold ${reussi ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isNaN(pct) ? '—' : `${pct.toFixed(0)}%`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {reussi ? '✅ Réussi' : '❌ Échoué'}
                    </p>
                  </>
                )}
              </div>

              {/* Barre de score */}
              {e.statut !== 'EN_COURS' && !isNaN(pct) && (
                <div className="w-16 flex-shrink-0">
                  <div className="h-1.5 bg-ink-600 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${reussi ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <div className="flex justify-end mt-0.5">
                    <span className="text-[10px] text-slate-600">{notePassage}%</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}