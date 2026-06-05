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
      <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-500 transition-all duration-300 rounded-full"
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

  const [state, setState] = useState({
    phase:      'loading',
    examen:     null,
    tentative:  null,
    questions:  [],
    result:     null,
    error:      '',
  })

  const [reponses,    setReponses]    = useState({})
  const [currentIdx,  setCurrentIdx]  = useState(0)
  const [confirmEnd,  setConfirmEnd]  = useState(false)
  const [submitting,  setSubmitting]  = useState(false)

  const { mins, secs, isUrgent, expired } = useCountdown(state.tentative?.expiresAt)

  const autoSubmittedRef = useRef(false)
  useEffect(() => {
    if (expired && state.phase === 'examen' && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      handleSoumettre(true)
    }
  }, [expired, state.phase])

  useEffect(() => {
    examensAPI.getById(id)
      .then(({ data }) => {
        setState(s => ({ ...s, examen: data, phase: 'confirm' }))
      })
      .catch(() => setState(s => ({ ...s, error: 'Examen introuvable ou non disponible.', phase: 'loading' })))
  }, [id])

  const handleDemarrer = async () => {
    setState(s => ({ ...s, error: '' }))
    try {
      const { data: tentData } = await examensAPI.demarrer(id)
      const tent      = tentData.tentative || tentData
      const expiresAt = tentData.expiresAt || tent.expires_at

      const { data: examData } = await examensAPI.getById(id)
      const qs = (examData.questions || []).map(q => ({
        ...q,
        reponses: (q.reponses || []).map(r => ({
          ...r,
          id: Number(r.id),
        })),
      }))

      if (!qs.length) {
        setState(s => ({ ...s, error: 'Cet examen ne contient aucune question.' }))
        return
      }

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
    <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
      {error ? (
        <div className="text-center p-8">
          <p className="text-rose-600 text-lg mb-4">{error}</p>
          <Btn variant="ghost" onClick={() => navigate(-1)}>← Retour</Btn>
        </div>
      ) : <Spinner size="lg" />}
    </div>
  )

  // ─── Confirmation avant démarrage ─────────────────────────────────────────
  if (phase === 'confirm') return (
    <div className="min-h-screen bg-ivory-50 flex items-center justify-center p-4">
      <div className="bg-white border border-amber-200 rounded-3xl p-8 max-w-md w-full shadow-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl mx-auto mb-4">📝</div>
          <h1 className="text-xl font-bold text-navy-800">{examen?.titre}</h1>
          <p className="text-sm text-slate-500 mt-1">{examen?.description}</p>
        </div>

        {error && (
          <p className="text-rose-600 text-sm text-center mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3">
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
            <div key={label} className="bg-amber-50 rounded-2xl p-3 text-center border border-amber-100">
              <p className="text-lg">{icon}</p>
              <p className="text-sm font-bold text-navy-800 mt-1">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs text-amber-700">
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
    <div className="min-h-screen bg-ivory-50 flex items-center justify-center p-4">
      <div className="bg-white border border-amber-200 rounded-3xl p-8 max-w-md w-full text-center shadow-sm">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4
          ${result?.reussi ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-rose-50 border-2 border-rose-200'}`}>
          {result?.reussi ? '🏆' : '😔'}
        </div>

        <h2 className={`text-2xl font-bold mb-1 ${result?.reussi ? 'text-emerald-600' : 'text-rose-600'}`}>
          {result?.reussi ? 'Félicitations !' : 'Dommage…'}
        </h2>
        <p className="text-slate-500 text-sm mb-6">{examen?.titre}</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100">
            <p className="text-xl font-bold text-navy-800">{result?.scoreObtenu ?? '—'}</p>
            <p className="text-xs text-slate-500">Points obtenus</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100">
            <p className="text-xl font-bold text-amber-600">{parseFloat(result?.pourcentage || 0).toFixed(0)}%</p>
            <p className="text-xs text-slate-500">Score</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100">
            <p className="text-xl font-bold text-navy-800">{result?.scoreMax ?? '—'}</p>
            <p className="text-xs text-slate-500">Points max</p>
          </div>
        </div>

        {result?.reussi && result?.certificat && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <p className="text-amber-700 font-semibold text-sm">🎓 Certificat obtenu !</p>
            <p className="text-xs text-amber-600 mt-1">N° {result.certificat.numero_certificat}</p>
            <p className="text-xs text-slate-500 mt-1">Vous recevrez un email de confirmation.</p>
          </div>
        )}

        {result?.resultatsVisibles === false && (
          <div className="bg-amber-50 rounded-xl p-3 mb-4 text-xs text-slate-500">
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
    <div className="min-h-screen bg-ivory-50 flex flex-col">

      {/* Barre fixe */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b
        ${isUrgent ? 'bg-rose-50 border-rose-200' : 'bg-white border-amber-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-sm">📝</div>
          <div>
            <p className="text-xs font-semibold text-navy-800 leading-none truncate max-w-48">{examen?.titre}</p>
            <p className="text-xs text-slate-500 mt-0.5">{questionsRepondues}/{questions.length} répondues</p>
          </div>
        </div>

        {tentative?.expiresAt && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-sm
            ${isUrgent
              ? 'text-rose-700 bg-rose-50 border border-rose-200'
              : 'text-navy-800 bg-amber-50 border border-amber-200'}`}>
            ⏱ {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
          </div>
        )}

        <Btn size="sm" onClick={() => setConfirmEnd(true)} disabled={submitting}>
          {submitting ? '…' : '✅ Terminer'}
        </Btn>
      </div>

      {/* Contenu */}
      <div className="flex-1 pt-16 pb-8 overflow-y-auto">

        {questions.length === 0 && (
          <div className="max-w-2xl mx-auto p-8 text-center">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
              <p className="text-rose-600 text-sm font-semibold">Aucune question chargée.</p>
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

              {questions.length > 1 && (
                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  {questions.map((q, i) => (
                    <button key={q.id} onClick={() => setCurrentIdx(i)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all
                        ${i === currentIdx
                          ? 'bg-amber-500 text-white'
                          : reponses[String(q.id)]
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-slate-500 hover:bg-amber-100 border border-amber-200'}`}>
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
        <div className="fixed inset-0 bg-navy-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white border border-amber-200 rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-navy-800 mb-2">Terminer l'examen ?</h3>
            <p className="text-sm text-slate-500 mb-1">
              Vous avez répondu à{' '}
              <strong className="text-amber-600">{questionsRepondues}/{questions.length}</strong> questions.
            </p>
            {questionsRepondues < questions.length && (
              <p className="text-xs text-amber-600 mb-4">
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
    <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
      {/* En-tête question */}
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xs font-bold text-amber-700">
          {idx + 1}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold
              ${question.type === 'QCM' ? 'bg-amber-100 text-amber-700' : 'bg-amber-100 text-amber-700'}`}>
              {question.type}
            </span>
            <span className="text-xs text-amber-600">
              {question.points} pt{question.points > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm font-medium text-navy-800 leading-relaxed">{question.texte}</p>
        </div>
      </div>

      {/* Réponses */}
      {reponses.length === 0 ? (
        <p className="text-xs text-rose-600 pl-10">⚠️ Aucune réponse disponible pour cette question.</p>
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
                    ? 'bg-amber-50 border-amber-400 text-navy-800'
                    : 'bg-ivory-50 border-amber-200 text-navy-800 hover:bg-amber-50 hover:border-amber-300'}`}>
                <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                  ${isChosen ? 'bg-amber-500 border-amber-500' : 'border-amber-300'}`}>
                  {isChosen && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                <span className="flex-1 text-navy-800">{r.texte}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}