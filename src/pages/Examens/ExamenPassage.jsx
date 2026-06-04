import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { examensAPI } from '../../services/api'
import { Btn, Spinner } from '../../components/UI'

// ─── Timer ────────────────────────────────────────────────────────────────────
function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const diff = Math.max(0, new Date(expiresAt) - new Date())
      setRemaining(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (remaining === null) return { mins: 0, secs: 0, isUrgent: false, expired: false, remaining: null }

  const mins     = Math.floor(remaining / 60000)
  const secs     = Math.floor((remaining % 60000) / 1000)
  const isUrgent = remaining < 5 * 60 * 1000 && remaining > 0
  const expired  = remaining === 0
  return { mins, secs, isUrgent, expired, remaining }
}

// ─── Barre progression ────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 transition-all duration-300 rounded-full"
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 flex-shrink-0">{current}/{total}</span>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ExamenPassage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Un seul objet d'état pour éviter les renders partiels
  const [state, setState] = useState({
    phase:      'loading', // loading | confirm | examen | result
    examen:     null,
    tentative:  null,
    questions:  [],
    result:     null,
    error:      '',
  })

  const [reponses,    setReponses]    = useState({}) // { questionId: reponseId }
  const [currentIdx,  setCurrentIdx]  = useState(0)
  const [confirmEnd,  setConfirmEnd]  = useState(false)
  const [submitting,  setSubmitting]  = useState(false)

  const { mins, secs, isUrgent, expired } = useCountdown(state.tentative?.expiresAt)

  // Auto-soumettre si temps écoulé
  const autoSubmittedRef = useRef(false)
  useEffect(() => {
    if (expired && state.phase === 'examen' && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      handleSoumettre(true)
    }
  }, [expired, state.phase])

  // Charger l'examen au départ
  useEffect(() => {
    examensAPI.getById(id)
      .then(({ data }) => {
        setState(s => ({ ...s, examen: data, phase: 'confirm' }))
      })
      .catch(() => setState(s => ({ ...s, error: 'Examen introuvable ou non disponible.', phase: 'loading' })))
  }, [id])

  // ─── Démarrer ─────────────────────────────────────────────────────────────
  const handleDemarrer = async () => {
    setState(s => ({ ...s, error: '' }))
    try {
      // 1. Créer la tentative
      const { data: tentData } = await examensAPI.demarrer(id)
      const tent      = tentData.tentative || tentData
      const expiresAt = tentData.expiresAt || tent.expires_at

      // 2. Charger les questions (après création tentative pour avoir les droits)
      const { data: examData } = await examensAPI.getById(id)
      const qs = (examData.questions || []).map(q => ({
        ...q,
        // Garantir que chaque réponse a un id numérique
        reponses: (q.reponses || []).map(r => ({
          ...r,
          id: Number(r.id),
        })),
      }))

      console.log(`📋 Questions reçues: ${qs.length}`)
      if (qs.length > 0) {
        console.log(`   Q1: "${qs[0].texte}" → ${qs[0].reponses.length} réponses`)
      }

      if (!qs.length) {
        setState(s => ({ ...s, error: 'Cet examen ne contient aucune question.' }))
        return
      }

      // 3. Tout en un seul setState atomique → un seul re-render
      setState(s => ({
        ...s,
        tentative: { ...tent, expiresAt },
        questions: qs,
        phase: 'examen',
        error: '',
      }))
      setCurrentIdx(0)
      setReponses({})

    } catch (err) {
      const msg = err.response?.data?.error || 'Impossible de démarrer l\'examen.'
      setState(s => ({ ...s, error: msg }))
    }
  }

  // ─── Soumettre ────────────────────────────────────────────────────────────
  const handleSoumettre = useCallback(async (auto = false) => {
    if (submitting) return
    setSubmitting(true)
    setConfirmEnd(false)
    try {
      const reponsesArr = Object.entries(reponses).map(([questionId, reponseId]) => ({
        questionId: parseInt(questionId),
        reponseId:  parseInt(reponseId),
      }))
      const { data } = await examensAPI.soumettre(state.tentative.id, reponsesArr)
      setState(s => ({ ...s, result: data, phase: 'result' }))
    } catch (err) {
      setState(s => ({ ...s, error: err.response?.data?.error || 'Erreur lors de la soumission.' }))
    } finally {
      setSubmitting(false)
    }
  }, [reponses, state.tentative, submitting])

  const selectReponse = (questionId, reponseId) => {
    setReponses(r => ({ ...r, [String(questionId)]: Number(reponseId) }))
  }

  const { phase, examen, tentative, questions, result, error } = state
  const questionsRepondues = Object.keys(reponses).length
  const question           = questions[currentIdx]

  // ─── Écran de chargement / erreur ─────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      {error ? (
        <div className="text-center p-8">
          <p className="text-rose-400 text-lg mb-4">{error}</p>
          <Btn variant="ghost" onClick={() => navigate(-1)}>← Retour</Btn>
        </div>
      ) : <Spinner size="lg" />}
    </div>
  )

  // ─── Confirmation avant démarrage ─────────────────────────────────────────
  if (phase === 'confirm') return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-700/20 border border-violet-500/30 flex items-center justify-center text-3xl mx-auto mb-4">📝</div>
          <h1 className="text-xl font-bold text-slate-100">{examen?.titre}</h1>
          <p className="text-sm text-slate-500 mt-1">{examen?.description}</p>
        </div>

        {error && (
          <p className="text-rose-400 text-sm text-center mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: '⏱', label: 'Durée',         value: `${examen?.duree_minutes} min` },
            { icon: '🎯', label: 'Pour réussir',  value: `${examen?.note_passage}%` },
            { icon: '❓', label: 'Questions',     value: examen?.questions?.length ?? '—' },
            { icon: '🔁', label: 'Tentatives max',value: examen?.max_tentatives || 'Illimité' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="bg-blue-100 rounded-2xl p-3 text-center">
              <p className="text-lg">{icon}</p>
              <p className="text-sm font-bold text-slate-100 mt-1">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 text-xs text-amber-400">
          ⚠️ Une fois démarré, le chronomètre ne peut pas être mis en pause.
        </div>

        <div className="flex gap-3">
          <Btn variant="ghost" onClick={() => navigate(-1)} className="flex-1">Annuler</Btn>
          <Btn onClick={handleDemarrer} className="flex-1">▶ Commencer</Btn>
        </div>
      </div>
    </div>
  )

  // ─── Résultat ─────────────────────────────────────────────────────────────
  if (phase === 'result') return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-8 max-w-md w-full text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4
          ${result?.reussi ? 'bg-emerald-500/20 border-2 border-emerald-500/40' : 'bg-rose-500/20 border-2 border-rose-500/40'}`}>
          {result?.reussi ? '🏆' : '😔'}
        </div>

        <h2 className={`text-2xl font-bold mb-1 ${result?.reussi ? 'text-emerald-400' : 'text-rose-400'}`}>
          {result?.reussi ? 'Félicitations !' : 'Dommage…'}
        </h2>
        <p className="text-slate-500 text-sm mb-6">{examen?.titre}</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-100 rounded-2xl p-3">
            <p className="text-xl font-bold text-slate-100">{result?.scoreObtenu ?? '—'}</p>
            <p className="text-xs text-slate-500">Points obtenus</p>
          </div>
          <div className="bg-blue-100 rounded-2xl p-3">
            <p className="text-xl font-bold text-blue-700">{parseFloat(result?.pourcentage || 0).toFixed(0)}%</p>
            <p className="text-xs text-slate-500">Score</p>
          </div>
          <div className="bg-blue-100 rounded-2xl p-3">
            <p className="text-xl font-bold text-slate-100">{result?.scoreMax ?? '—'}</p>
            <p className="text-xs text-slate-500">Points max</p>
          </div>
        </div>

        {result?.reussi && result?.certificat && (
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 mb-6">
            <p className="text-amber-400 font-semibold text-sm">🎓 Certificat obtenu !</p>
            <p className="text-xs text-amber-400/70 mt-1">N° {result.certificat.numero_certificat}</p>
            <p className="text-xs text-slate-500 mt-1">Vous recevrez un email de confirmation.</p>
          </div>
        )}

        {result?.resultatsVisibles === false && (
          <div className="bg-blue-100 rounded-xl p-3 mb-4 text-xs text-slate-500">
            ⏳ Le corrigé sera disponible le{' '}
            {new Date(result?.dateAffichageResultats).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Btn onClick={() => navigate('/dashboard/examens')}>↩ Retour aux examens</Btn>
          {result?.resultatsVisibles && tentative && (
            <Btn variant="ghost" onClick={() => navigate(`/examens/${id}/resultats`)}>
              📊 Voir le corrigé
            </Btn>
          )}
        </div>
      </div>
    </div>
  )

  // ─── Examen en cours ──────────────────────────────────────────────────────
  const isListeComplete = examen?.mode_affichage === 'LISTE_COMPLETE'

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">

      {/* Barre fixe */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b
        ${isUrgent ? 'bg-rose-950 border-rose-800' : 'bg-white border-blue-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-700/20 border border-violet-500/30 flex items-center justify-center text-sm">📝</div>
          <div>
            <p className="text-xs font-semibold text-blue-900 leading-none truncate max-w-48">{examen?.titre}</p>
            <p className="text-xs text-slate-500 mt-0.5">{questionsRepondues}/{questions.length} répondues</p>
          </div>
        </div>

        {tentative?.expiresAt && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-sm
            ${isUrgent
              ? 'text-rose-400 bg-rose-500/20 border border-rose-500/30 animate-pulse'
              : 'text-blue-900 bg-blue-50 border border-blue-200'}`}>
            ⏱ {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
          </div>
        )}

        <Btn size="sm" onClick={() => setConfirmEnd(true)} disabled={submitting}>
          {submitting ? '…' : '✅ Terminer'}
        </Btn>
      </div>

      {/* Contenu */}
      <div className="flex-1 pt-16 pb-8 overflow-y-auto">

        {/* Garde-fou : aucune question chargée */}
        {questions.length === 0 && (
          <div className="max-w-2xl mx-auto p-8 text-center">
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6">
              <p className="text-rose-400 text-sm font-semibold">Aucune question chargée.</p>
              <p className="text-slate-500 text-xs mt-1">Rechargez la page ou contactez votre tuteur.</p>
            </div>
          </div>
        )}

        {questions.length > 0 && (
          isListeComplete ? (
            /* ── Mode liste complète ── */
            <div className="max-w-2xl mx-auto p-4 flex flex-col gap-6">
              <ProgressBar current={questionsRepondues} total={questions.length} />
              {questions.map((q, idx) => (
                <QuestionBlock
                  key={q.id}
                  question={q}
                  idx={idx}
                  selected={reponses[String(q.id)]}
                  onSelect={(rId) => selectReponse(q.id, rId)}
                />
              ))}
            </div>
          ) : (
            /* ── Mode une par une ── */
            <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
              <ProgressBar current={currentIdx + 1} total={questions.length} />

              {question && (
                <QuestionBlock
                  key={question.id}
                  question={question}
                  idx={currentIdx}
                  selected={reponses[String(question.id)]}
                  onSelect={(rId) => selectReponse(question.id, rId)}
                />
              )}

              {/* Navigation */}
              <div className="flex justify-between gap-3 mt-2">
                <Btn variant="ghost" disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(i => i - 1)}>
                  ← Précédent
                </Btn>
                {currentIdx < questions.length - 1 ? (
                  <Btn onClick={() => setCurrentIdx(i => i + 1)}>Suivant →</Btn>
                ) : (
                  <Btn onClick={() => setConfirmEnd(true)}>✅ Terminer et envoyer</Btn>
                )}
              </div>

              {/* Points de navigation */}
              {questions.length > 1 && (
                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  {questions.map((q, i) => (
                    <button key={q.id} onClick={() => setCurrentIdx(i)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all
                        ${i === currentIdx
                          ? 'bg-blue-700 text-white'
                          : reponses[String(q.id)]
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-100 text-slate-500 hover:bg-blue-200'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Modal confirmation fin */}
      {confirmEnd && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Terminer l'examen ?</h3>
            <p className="text-sm text-slate-500 mb-1">
              Vous avez répondu à{' '}
              <strong className="text-blue-900">{questionsRepondues}/{questions.length}</strong> questions.
            </p>
            {questionsRepondues < questions.length && (
              <p className="text-xs text-amber-400 mb-4">
                ⚠️ {questions.length - questionsRepondues} question(s) sans réponse.
              </p>
            )}
            <p className="text-xs text-slate-500 mb-5">
              Après validation, vous ne pourrez plus modifier vos réponses.
            </p>
            <div className="flex gap-3">
              <Btn variant="ghost" onClick={() => setConfirmEnd(false)} className="flex-1">Annuler</Btn>
              <Btn onClick={() => handleSoumettre(false)} disabled={submitting} className="flex-1">
                {submitting ? 'Envoi…' : 'Confirmer'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Bloc question + réponses ─────────────────────────────────────────────────
function QuestionBlock({ question, idx, selected, onSelect }) {
  if (!question) return null
  const reponses = question.reponses || []

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
      {/* En-tête question */}
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-7 h-7 rounded-xl bg-blue-700/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-blue-700">
          {idx + 1}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold
              ${question.type === 'QCM' ? 'bg-blue-600/20 text-blue-700' : 'bg-cyan-500/20 text-cyan-400'}`}>
              {question.type}
            </span>
            <span className="text-xs text-amber-400">
              {question.points} pt{question.points > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-100 leading-relaxed">{question.texte}</p>
        </div>
      </div>

      {/* Réponses */}
      {reponses.length === 0 ? (
        <p className="text-xs text-rose-400 pl-10">⚠️ Aucune réponse disponible pour cette question.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {reponses.map((r) => {
            const rId     = Number(r.id)
            const isChosen = selected === rId
            return (
              <button
                key={rId}
                onClick={() => onSelect(rId)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all border w-full
                  ${isChosen
                    ? 'bg-blue-700/20 border-violet-500/50 text-blue-700'
                    : 'bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-200 hover:border-slate-500'}`}>
                <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                  ${isChosen ? 'bg-blue-600 border-violet-500' : 'border-slate-600'}`}>
                  {isChosen && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                <span className="flex-1">{r.texte}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}