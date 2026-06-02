import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { examensAPI } from '../../services/api'
import { Btn, Spinner } from '../../components/UI'

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '—'

export default function ExamenResultats() {
  const { id: examenId } = useParams()
  const navigate = useNavigate()

  const [phase,   setPhase]   = useState('loading') // loading | attente | resultats | erreur
  const [data,    setData]    = useState(null)
  const [error,   setError]   = useState('')
  const [tab,     setTab]     = useState('resume') // resume | corrige

  useEffect(() => { load() }, [examenId])

  const load = async () => {
    setPhase('loading')
    try {
      // 1. Trouver la dernière tentative
      const { data: tent } = await examensAPI.getMaDerniereTentative(examenId)
      const tentativeId = tent.tentativeId

      // 2. Charger le corrigé
      const { data: resultats } = await examensAPI.getResultats(tentativeId)
      setData(resultats)
      setPhase('resultats')
    } catch (err) {
      const msg = err.response?.data?.error || ''
      if (err.response?.status === 403 && err.response?.data?.dateAffichage) {
        setData({ dateAffichage: err.response.data.dateAffichage })
        setPhase('attente')
      } else if (err.response?.status === 404) {
        setError('Aucune tentative trouvée pour cet examen.')
        setPhase('erreur')
      } else {
        setError(msg || 'Impossible de charger les résultats.')
        setPhase('erreur')
      }
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  // ── Erreur ─────────────────────────────────────────────────────────────────
  if (phase === 'erreur') return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
      <div className="bg-ink-800 border border-ink-600 rounded-3xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">❌</div>
        <p className="text-rose-400 font-semibold mb-2">{error}</p>
        <Btn variant="ghost" onClick={() => navigate('/dashboard/examens')}>← Retour</Btn>
      </div>
    </div>
  )

  // ── Résultats pas encore disponibles ──────────────────────────────────────
  if (phase === 'attente') return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
      <div className="bg-ink-800 border border-ink-600 rounded-3xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Résultats en attente</h2>
        <p className="text-slate-400 text-sm mb-4">
          Votre tuteur a configuré une date de publication des résultats.
        </p>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
          <p className="text-amber-400 text-sm font-semibold">
            📅 Disponible le {fmt(data?.dateAffichage)}
          </p>
        </div>
        <Btn variant="ghost" onClick={() => navigate('/dashboard/examens')}>← Retour aux examens</Btn>
      </div>
    </div>
  )

  // ── Résultats complets ─────────────────────────────────────────────────────
  const { tentative, questions = [] } = data
  const reussi  = tentative.statut === 'REUSSI'
  const pct     = parseFloat(tentative.pourcentage || 0)
  const bonnes  = questions.filter(q => q.est_correcte).length
  const mauvaises = questions.filter(q => q.est_correcte === false && q.reponse_choisie).length
  const sansSep = questions.filter(q => !q.reponse_choisie).length

  return (
    <div className="bg-ink-950" style={{ minHeight: '100vh', overflowY: 'auto' }}>

      {/* Header simple — pas sticky, pas fixed */}
      <div className="bg-ink-900 border-b border-ink-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/examens')}
          className="w-8 h-8 rounded-lg bg-ink-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500">Résultats</p>
          <p className="text-sm font-semibold text-slate-100 truncate">{tentative.examen_titre}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border
          ${reussi ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'}`}>
          {reussi ? '✅ Réussi' : '❌ Échoué'}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Score hero */}
        <div className={`rounded-3xl p-6 text-center border
          ${reussi
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-rose-500/10 border-rose-500/20'}`}>
          <div className="text-5xl mb-2">{reussi ? '🏆' : '😔'}</div>
          <div className={`text-5xl font-black mb-1 ${reussi ? 'text-emerald-400' : 'text-rose-400'}`}>
            {pct.toFixed(0)}%
          </div>
          <p className="text-slate-300 text-sm">
            {tentative.score_obtenu} / {tentative.score_max} points
          </p>
          <div className="mt-3 h-2 bg-ink-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${reussi ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">Note de passage : {tentative.note_passage}%</p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox value={bonnes}    label="Bonnes réponses" color="text-emerald-400" />
          <StatBox value={mauvaises} label="Mauvaises"       color="text-rose-400"   />
          <StatBox value={sansSep}   label="Sans réponse"    color="text-slate-400"  />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-ink-800 border border-ink-600 rounded-xl p-1">
          {[['resume','📊 Résumé'], ['corrige','📝 Voir le corrigé']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                ${tab === k ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Contenu tab */}
        {tab === 'resume' ? (
          <TabResume tentative={tentative} reussi={reussi} />
        ) : (
          <TabCorrige questions={questions} />
        )}

        {/* Bouton retour */}
        <div className="flex gap-3 pb-8">
          <Btn variant="ghost" onClick={() => navigate('/dashboard/examens')} className="flex-1">
            ← Retour aux examens
          </Btn>
          {tab === 'resume' && (
            <Btn onClick={() => setTab('corrige')} className="flex-1">
              📝 Voir le corrigé
            </Btn>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Résumé ───────────────────────────────────────────────────────────────────
function TabResume({ tentative, reussi }) {
  const dur = tentative.submitted_at && tentative.started_at
    ? Math.round((new Date(tentative.submitted_at) - new Date(tentative.started_at)) / 60000)
    : null

  return (
    <div className="space-y-3">
      {[
        { label: 'Statut',           value: reussi ? '✅ Réussi' : '❌ Échoué',
          color: reussi ? 'text-emerald-400' : 'text-rose-400' },
        { label: 'Score obtenu',     value: `${parseFloat(tentative.pourcentage || 0).toFixed(1)}%` },
        { label: 'Points',           value: `${tentative.score_obtenu} / ${tentative.score_max}` },
        { label: 'Date de passage',  value: tentative.started_at ? fmt(tentative.started_at) : '—' },
        { label: 'Durée utilisée',   value: dur ? `${dur} min` : '—' },
      ].map(({ label, value, color }) => (
        <div key={label} className="flex items-center justify-between py-3 border-b border-ink-700/50">
          <span className="text-sm text-slate-400">{label}</span>
          <span className={`text-sm font-semibold ${color || 'text-slate-100'}`}>{value}</span>
        </div>
      ))}

      {reussi && (
        <div className="bg-amber-500/10 border border-amber-400/20 rounded-2xl p-4 text-center mt-4">
          <p className="text-amber-400 font-semibold">🎓 Certificat disponible !</p>
          <p className="text-xs text-amber-400/70 mt-1">Consultez "Mes Certificats" dans le dashboard.</p>
        </div>
      )}
    </div>
  )
}

// ─── Corrigé ──────────────────────────────────────────────────────────────────
function TabCorrige({ questions }) {
  if (!questions.length) return (
    <p className="text-center text-slate-500 py-8">Aucune donnée de corrigé disponible.</p>
  )

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{questions.length} question{questions.length > 1 ? 's' : ''}</p>

      {questions.map((q, i) => {
        const reponses = Array.isArray(q.toutes_reponses) ? q.toutes_reponses.filter(Boolean) : []
        const aRepondu  = !!q.reponse_choisie
        const estBonne  = q.est_correcte === true

        return (
          <div key={q.id}
            className={`rounded-2xl border overflow-hidden
              ${!aRepondu
                ? 'border-slate-600 bg-ink-800'
                : estBonne
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-rose-500/30 bg-rose-500/5'}`}>

            {/* Header question */}
            <div className="flex items-start gap-3 p-4">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5
                ${!aRepondu ? 'bg-slate-600/30 text-slate-400'
                  : estBonne ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'}`}>
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-semibold">{q.type}</span>
                  <span className="text-xs text-amber-400">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                  <span className={`text-xs font-semibold
                    ${!aRepondu ? 'text-slate-500' : estBonne ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {!aRepondu ? '— Sans réponse' : estBonne ? '✅ Correcte' : '❌ Incorrecte'}
                  </span>
                </div>
                <p className="text-sm text-slate-100 font-medium leading-relaxed">{q.texte}</p>
              </div>
            </div>

            {/* Réponses */}
            <div className="px-4 pb-4 space-y-2">
              {reponses.map(r => {
                const estChoisie  = String(r.id) === String(q.reponse_choisie)
                const estCorrecte = r.est_correcte

                let style = 'bg-ink-700 border-ink-600 text-slate-400'
                if (estCorrecte && estChoisie)  style = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                else if (estCorrecte)            style = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                else if (estChoisie && !estCorrecte) style = 'bg-rose-500/20 border-rose-500/50 text-rose-300'

                return (
                  <div key={r.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm ${style}`}>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${estCorrecte && estChoisie ? 'bg-emerald-500 border-emerald-500 text-white'
                        : estCorrecte             ? 'border-emerald-500 text-emerald-400'
                        : estChoisie              ? 'bg-rose-500 border-rose-500 text-white'
                        : 'border-ink-500'}`}>
                      {estCorrecte ? '✓' : estChoisie ? '✗' : ''}
                    </span>
                    <span className="flex-1">{r.texte}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {estChoisie  && <span className="text-xs opacity-70">votre réponse</span>}
                      {estCorrecte && <span className="text-xs text-emerald-400 font-semibold">bonne réponse</span>}
                    </div>
                  </div>
                )
              })}

              {/* Explication si mauvaise réponse */}
              {aRepondu && !estBonne && (
                <div className="flex items-center gap-2 mt-1 text-xs text-emerald-400/80">
                  <span>✅ Bonne réponse :</span>
                  <span className="font-semibold">
                    {reponses.find(r => r.est_correcte)?.texte || '—'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StatBox({ value, label, color }) {
  return (
    <div className="bg-ink-800 border border-ink-600 rounded-2xl p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}