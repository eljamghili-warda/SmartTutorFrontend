import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { examensAPI } from '../../services/api'
import { Btn, Spinner, C } from '../../components/UI'

// ─── Timer ────────────────────────────────────────────────────────────────────
function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(null)
  useEffect(() => {
    if (!expiresAt) { setRemaining(null); return }
    const tick = () => {
      const diff = Math.max(0, new Date(expiresAt) - new Date())
      setRemaining(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  const mins = Math.floor((remaining || 0) / 60000)
  const secs = Math.floor(((remaining || 0) % 60000) / 1000)
  const isUrgent = remaining !== null && remaining < 5 * 60 * 1000 && remaining > 0
  const expired  = remaining !== null && remaining === 0
  return { mins, secs, isUrgent, expired, remaining }
}

// ─── Barre progression ────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div style={{ flex: 1, height: 6, background: '#D6E6F5', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${C.gold500}, ${C.gold400})`,
          borderRadius: 99,
          transition: 'width 0.3s ease'
        }} />
      </div>
      <span style={{ fontSize: 12, color: C.textSub, flexShrink: 0 }}>{current}/{total}</span>
    </div>
  )
}

// ─── Bloc question ────────────────────────────────────────────────────────────
function QuestionBlock({ question, idx, selected, onSelect }) {
  return (
    <div style={{
      background: C.white,
      border: `1px solid ${C.navy600}`,
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 2px 8px rgba(26,58,92,0.07)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <span style={{
          flexShrink: 0,
          width: 28, height: 28,
          borderRadius: 10,
          background: C.gold200,
          border: `1px solid ${C.gold300}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: C.navy900
        }}>
          {idx + 1}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 700,
              background: question.type === 'QCM' ? C.navy600 : C.gold200,
              color: question.type === 'QCM' ? C.navy800 : C.navy900,
            }}>
              {question.type}
            </span>
            <span style={{ fontSize: 12, color: C.gold500, fontWeight: 600 }}>
              {question.points} pt{question.points > 1 ? 's' : ''}
            </span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: C.textMain, lineHeight: 1.6 }}>{question.texte}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(question.reponses || []).map((r) => (
          <button key={r.id} onClick={() => onSelect(r.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', borderRadius: 12, fontSize: 14, textAlign: 'left',
              cursor: 'pointer', transition: 'all 0.15s',
              background: selected === r.id ? C.gold200 : C.ivory500,
              border: selected === r.id ? `1.5px solid ${C.gold500}` : `1.5px solid ${C.navy600}`,
              color: selected === r.id ? C.navy900 : C.textMain,
            }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: selected === r.id ? C.gold500 : 'transparent',
              border: selected === r.id ? `2px solid ${C.gold500}` : `2px solid ${C.navy700}`,
              transition: 'all 0.15s'
            }}>
              {selected === r.id && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.white }} />}
            </span>
            {r.texte}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ExamenPassage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // États principaux
  const [phase, setPhase]     = useState('loading') // loading | confirm | examen | result
  const [examen, setExamen]   = useState(null)
  const [tentative, setTentative] = useState(null)
  const [questions, setQuestions] = useState([])
  const [reponses, setReponses]   = useState({})   // { questionId: reponseId }
  const [currentIdx, setCurrentIdx] = useState(0)
  const [result, setResult]   = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [error, setError]     = useState('')

  const { mins, secs, isUrgent, expired } = useCountdown(tentative?.expiresAt)

  // Auto-soumettre si temps écoulé
  const autoSubmittedRef = useRef(false)
  useEffect(() => {
    if (expired && phase === 'examen' && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      handleSoumettre(true)
    }
  }, [expired, phase])

  // Charger l'examen au départ
  useEffect(() => {
    examensAPI.getById(id)
      .then(({ data }) => {
        setExamen(data)
        setPhase('confirm')
      })
      .catch(() => setError('Examen introuvable ou non disponible.'))
  }, [id])

  const handleDemarrer = async () => {
    setError('')
    try {
      const { data: tentData } = await examensAPI.demarrer(id)
      const tent      = tentData.tentative || tentData
      const expiresAt = tentData.expiresAt || tentData.expires_at || tent.expires_at

      if (expiresAt && new Date(expiresAt) <= new Date()) {
        setError('Ce passage est expiré. Contactez votre tuteur.')
        return
      }

      const { data: examData } = await examensAPI.getById(id)
      const qs = (examData.questions || []).map(q => ({
        ...q,
        id: Number(q.id),
        reponses: (q.reponses || []).map(r => ({ ...r, id: Number(r.id) }))
      }))

      if (!qs.length) {
        setError('Cet examen ne contient aucune question. Contactez votre tuteur.')
        return
      }

      autoSubmittedRef.current = false
      setTentative({ ...tent, id: tent.id, expiresAt })
      setQuestions(qs)
      setCurrentIdx(0)
      setReponses({})
      setPhase('examen')
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de démarrer l\'examen.')
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
      const { data } = await examensAPI.soumettre(tentative.id, reponsesArr)
      setResult(data)
      setPhase('result')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la soumission.')
      setSubmitting(false)
    }
  }, [reponses, tentative, submitting])

  const selectReponse = (questionId, reponseId) => {
    setReponses(r => ({ ...r, [questionId]: reponseId }))
  }

  const questionsRepondues = Object.keys(reponses).length
  const question = questions[currentIdx]

  // ─── Écran de chargement ──────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', background: C.ivory500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {error ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: C.error, fontSize: 16, marginBottom: 16 }}>{error}</p>
          <Btn variant="ghost" onClick={() => navigate(-1)}>← Retour</Btn>
        </div>
      ) : <Spinner size="lg" />}
    </div>
  )

  // ─── Écran de confirmation avant démarrage ────────────────────────────────
  if (phase === 'confirm') return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${C.navy900} 0%, #0D2137 50%, ${C.navy900} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: C.white,
        border: `1px solid ${C.navy600}`,
        borderRadius: 24,
        padding: 32,
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 24px 60px rgba(26,58,92,0.3)'
      }}>
        {/* Header avec accent doré */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: `linear-gradient(135deg, ${C.gold500}, ${C.gold400})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px',
            boxShadow: `0 8px 24px ${C.gold300}`
          }}>📝</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.navy900 }}>{examen?.titre}</h1>
          <p style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>{examen?.description}</p>
        </div>

        {error && (
          <p style={{
            color: C.error, fontSize: 13, textAlign: 'center', marginBottom: 16,
            background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: 12
          }}>{error}</p>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { icon: '⏱', label: 'Durée', value: `${examen?.duree_minutes} min` },
            { icon: '🎯', label: 'Pour réussir', value: `${examen?.note_passage}%` },
            { icon: '❓', label: 'Questions', value: examen?.questions?.length || '—' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{
              background: C.ivory500,
              border: `1px solid ${C.navy600}`,
              borderRadius: 14, padding: 12, textAlign: 'center'
            }}>
              <p style={{ fontSize: 18 }}>{icon}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.navy900, marginTop: 4 }}>{value}</p>
              <p style={{ fontSize: 11, color: C.textSub }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div style={{
          background: C.gold200,
          border: `1px solid ${C.gold300}`,
          borderRadius: 12, padding: 12, marginBottom: 24,
          fontSize: 12, color: C.navy900
        }}>
          ⚠️ Une fois démarré, le chronomètre ne peut pas être mis en pause. Assurez-vous d'être prêt !
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" onClick={() => navigate(-1)} style={{ flex: 1 }}>Annuler</Btn>
          <Btn variant="gold" onClick={handleDemarrer} style={{ flex: 1 }}>▶ Commencer l'examen</Btn>
        </div>
      </div>
    </div>
  )

  // ─── Écran de résultat ────────────────────────────────────────────────────
  if (phase === 'result') {
    const resultatsVisibles = result?.resultatsVisibles
    const dateAff = result?.dateAffichageResultats
      ? new Date(result.dateAffichageResultats).toLocaleDateString('fr-FR', {
          day: '2-digit', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : null

    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${C.navy900} 0%, #0D2137 50%, ${C.navy900} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
      }}>
        <div style={{
          background: C.white,
          border: `1px solid ${C.navy600}`,
          borderRadius: 24, padding: 32,
          maxWidth: 420, width: '100%',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(26,58,92,0.3)'
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.gold500}, ${C.gold400})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, margin: '0 auto 16px',
            boxShadow: `0 8px 24px ${C.gold300}`
          }}>
            ✅
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: C.navy900 }}>
            Vos réponses ont été envoyées avec succès !
          </h2>
          <p style={{ color: C.textSub, fontSize: 13, marginBottom: 24 }}>{examen?.titre}</p>

          {dateAff && !resultatsVisibles && (
            <div style={{
              background: C.navy600,
              border: `1px solid ${C.navy700}`,
              borderRadius: 16, padding: 16, marginBottom: 16
            }}>
              <p style={{ color: C.navy800, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>🔒 Résultats cachés</p>
              <p style={{ fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>
                Pour garantir l'équité, votre résultat et le corrigé seront révélés à tous les étudiants en même temps le
              </p>
              <p style={{ color: C.gold500, fontWeight: 700, fontSize: 13, marginTop: 8 }}>📅 {dateAff}</p>
            </div>
          )}

          {resultatsVisibles && result?.certificat && (
            <div style={{
              background: C.gold200,
              border: `1px solid ${C.gold300}`,
              borderRadius: 16, padding: 16, marginBottom: 16
            }}>
              <p style={{ color: C.gold500, fontWeight: 600, fontSize: 13 }}>🎓 Certificat obtenu !</p>
              <p style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>N° {result.certificat.numero_certificat}</p>
              <p style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>Vous recevrez un email de confirmation.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn variant="primary" onClick={() => navigate('/dashboard/examens')}>↩ Retour aux examens</Btn>
            {resultatsVisibles && (
              <Btn variant="ghost" onClick={() => navigate(`/examens/${id}/resultats`)}>
                📊 Voir le corrigé
              </Btn>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Écran examen ─────────────────────────────────────────────────────────
  const isListeComplete = examen?.mode_affichage === 'LISTE_COMPLETE'

  return (
    <div style={{ minHeight: '100vh', background: C.ivory500, display: 'flex', flexDirection: 'column' }}>
      {/* Header barre fixe */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: isUrgent ? '#7F1D1D' : C.navy900,
        borderBottom: isUrgent ? '1px solid #B91C1C' : `1px solid ${C.navy800}`,
        boxShadow: '0 2px 12px rgba(26,58,92,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: `linear-gradient(135deg, ${C.gold500}, ${C.gold400})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
          }}>📝</div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.white, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {examen?.titre}
            </p>
            <p style={{ fontSize: 11, color: C.navy600, marginTop: 1 }}>
              {questionsRepondues}/{questions.length} répondues
            </p>
          </div>
        </div>

        {/* Timer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 12,
          fontFamily: 'monospace', fontWeight: 700, fontSize: 14,
          background: isUrgent ? 'rgba(239,68,68,0.2)' : C.gold200,
          border: isUrgent ? '1px solid rgba(239,68,68,0.4)' : `1px solid ${C.gold300}`,
          color: isUrgent ? '#FCA5A5' : C.navy900,
          animation: isUrgent ? 'pulse 1s infinite' : 'none'
        }}>
          ⏱ {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
        </div>

        <Btn size="sm" variant="gold" onClick={() => setConfirmEnd(true)} disabled={submitting}>
          {submitting ? '…' : '✅ Terminer'}
        </Btn>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, paddingTop: 64, paddingBottom: 32, overflowY: 'auto' }}>
        {isListeComplete ? (
          /* Mode liste complète */
          <div style={{ maxWidth: 672, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ProgressBar current={questionsRepondues} total={questions.length} />
            {questions.map((q, idx) => (
              <QuestionBlock key={q.id} question={q} idx={idx} selected={reponses[q.id]}
                onSelect={(rId) => selectReponse(q.id, rId)} />
            ))}
          </div>
        ) : (
          /* Mode question par question */
          <div style={{ maxWidth: 672, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ProgressBar current={currentIdx + 1} total={questions.length} />

            {questions.length === 0 ? (
              <div style={{
                background: C.white, border: `1px solid #FCA5A5`,
                borderRadius: 16, padding: 24, textAlign: 'center'
              }}>
                <p style={{ color: C.error, fontSize: 13 }}>Aucune question chargée. Rechargez la page.</p>
              </div>
            ) : question ? (
              <QuestionBlock
                key={question.id}
                question={question}
                idx={currentIdx}
                selected={reponses[question.id]}
                onSelect={(rId) => selectReponse(question.id, rId)} />
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
              <Btn variant="ghost" disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(i => i - 1)}>
                ← Précédent
              </Btn>
              {currentIdx < questions.length - 1 ? (
                <Btn variant="primary" onClick={() => setCurrentIdx(i => i + 1)}>Suivant →</Btn>
              ) : (
                <Btn variant="gold" onClick={() => setConfirmEnd(true)}>✅ Terminer</Btn>
              )}
            </div>

            {/* Navigation dots */}
            {questions.length > 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                {questions.map((q, i) => (
                  <button key={i} onClick={() => setCurrentIdx(i)}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: i === currentIdx
                        ? `linear-gradient(135deg, ${C.navy800}, ${C.navy700})`
                        : reponses[q.id]
                          ? C.gold200
                          : C.ivory500,
                      border: i === currentIdx
                        ? 'none'
                        : reponses[q.id]
                          ? `1px solid ${C.gold400}`
                          : `1px solid ${C.navy600}`,
                      color: i === currentIdx
                        ? C.white
                        : reponses[q.id]
                          ? C.navy900
                          : C.textSub,
                    }}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal confirmation fin */}
      {confirmEnd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: C.white,
            border: `1px solid ${C.navy600}`,
            borderRadius: 24, padding: 24,
            maxWidth: 380, width: '100%',
            boxShadow: '0 24px 60px rgba(26,58,92,0.3)'
          }}>
            {/* Accent doré en haut */}
            <div style={{
              height: 4, borderRadius: '4px 4px 0 0',
              background: `linear-gradient(90deg, ${C.gold500}, ${C.gold400})`,
              margin: '-24px -24px 20px'
            }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.navy900, marginBottom: 8 }}>Terminer l'examen ?</h3>
            <p style={{ fontSize: 13, color: C.textSub, marginBottom: 4 }}>
              Vous avez répondu à <strong style={{ color: C.navy900 }}>{questionsRepondues}/{questions.length}</strong> questions.
            </p>
            {questionsRepondues < questions.length && (
              <p style={{ fontSize: 12, color: C.gold500, marginBottom: 16 }}>
                ⚠️ {questions.length - questionsRepondues} question(s) sans réponse.
              </p>
            )}
            <p style={{ fontSize: 11, color: C.textSub, marginBottom: 20 }}>Après validation, vous ne pourrez plus modifier vos réponses.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="ghost" onClick={() => setConfirmEnd(false)} style={{ flex: 1 }}>Annuler</Btn>
              <Btn variant="gold" onClick={() => handleSoumettre(false)} disabled={submitting} style={{ flex: 1 }}>
                {submitting ? 'Envoi…' : 'Confirmer'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}