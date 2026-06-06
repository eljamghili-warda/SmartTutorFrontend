import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { examensAPI } from '../../services/api'
import { Btn, Spinner } from '../../components/UI'

const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '—'

// ─── Affichage d'une question corrigée ───────────────────────────────────────
function QuestionCorrigee({ q, idx }) {
  const correct = q.est_correcte
  const repChoisie = q.reponse_choisie
  const reponsesArr = Array.isArray(q.toutes_reponses) ? q.toutes_reponses : []

  return (
    <div style={{
      background: correct === true ? '#ECFDF5' : correct === false ? '#FEF2F2' : '#FAF4E4',
      border: `1.5px solid ${correct === true ? '#A7F3D0' : correct === false ? '#FECACA' : '#E8D5A3'}`,
      borderRadius: 14, padding: '16px 18px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: correct === true ? '#D1FAE5' : correct === false ? '#FEE2E2' : '#F2E8CC',
          border: `1px solid ${correct === true ? '#6EE7B7' : correct === false ? '#FCA5A5' : '#E8D5A3'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: correct === true ? '#065F46' : correct === false ? '#991B1B' : '#8B6914',
        }}>
          {idx + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: q.type === 'QCM' ? 'rgba(74,144,226,0.1)' : 'rgba(197,160,89,0.1)',
              color: q.type === 'QCM' ? '#1E3A6E' : '#8B6914',
              border: `1px solid ${q.type === 'QCM' ? 'rgba(74,144,226,0.2)' : 'rgba(197,160,89,0.2)'}`,
            }}>{q.type}</span>
            <span style={{ fontSize: 11, color: '#8B6914', fontWeight: 600 }}>{q.points} pt{q.points > 1 ? 's' : ''}</span>
            <span style={{ fontSize: 12, marginLeft: 'auto', fontWeight: 700,
              color: correct === true ? '#065F46' : correct === false ? '#991B1B' : '#8B6914' }}>
              {correct === true ? '✅ Correct' : correct === false ? '❌ Incorrect' : '—'}
            </span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0A1628', lineHeight: 1.5 }}>{q.texte}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 38 }}>
        {reponsesArr.filter(r => r && r.id).map(r => {
          const isChoisie  = String(r.id) === String(repChoisie)
          const isCorrecte = r.est_correcte

          let bg = '#FFFFFF', border = '#E8D5A3', color = '#4A6080'
          if (isCorrecte && isChoisie) { bg = '#D1FAE5'; border = '#6EE7B7'; color = '#065F46' }
          else if (isCorrecte)         { bg = '#ECFDF5'; border = '#A7F3D0'; color = '#065F46' }
          else if (isChoisie)          { bg = '#FEE2E2'; border = '#FCA5A5'; color = '#991B1B' }

          return (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 8,
              background: bg, border: `1px solid ${border}`,
            }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>
                {isCorrecte && isChoisie ? '✅' : isCorrecte ? '✓' : isChoisie ? '✗' : '○'}
              </span>
              <span style={{ fontSize: 13, color, fontWeight: isCorrecte ? 600 : 400 }}>{r.texte}</span>
              {isChoisie && !isCorrecte && (
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#991B1B', fontWeight: 600 }}>Votre réponse</span>
              )}
              {isCorrecte && (
                <span style={{ marginLeft: isChoisie ? 0 : 'auto', fontSize: 10, color: '#065F46', fontWeight: 600 }}>Bonne réponse</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ExamenResultats() {
  const { id: examenId } = useParams()
  const navigate = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        // 1) Récupérer mes tentatives pour cet examen
        const { data: tentatives } = await examensAPI.getMesTentatives(examenId)
        if (!tentatives || tentatives.length === 0) {
          setError("Aucune tentative trouvée pour cet examen.")
          return
        }
        // Prendre la plus récente tentative terminée
        const tentative = tentatives.find(t => t.statut !== 'EN_COURS') || tentatives[0]

        // 2) Récupérer les infos de l'examen
        const { data: examens } = await examensAPI.getMesExamensEtudiant()
        const examen = examens.find(e => String(e.id) === String(examenId))

        // 3) Essayer de charger le corrigé détaillé
        let questions = null
        let tentativeDetail = null
        try {
          const { data: res } = await examensAPI.getResultats(tentative.id)
          questions = res.questions
          tentativeDetail = res.tentative
        } catch {
          // Résultats pas encore visibles (date_affichage_resultats)
        }

        setData({ tentative, examen, questions, tentativeDetail })
      } catch (err) {
        setError("Impossible de charger les résultats.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [examenId])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size="lg" />
    </div>
  )

  if (error || !data) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{
        background: '#FFFFFF', border: '1px solid #E8D5A3', borderRadius: 20,
        padding: 32, maxWidth: 440, width: '100%', textAlign: 'center',
        boxShadow: '0 8px 32px rgba(10,22,40,0.1)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
        <p style={{ color: '#C5A059', fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Résultats non disponibles</p>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
          {error || "Le corrigé n'est pas encore disponible ou vous n'avez pas encore passé cet examen."}
        </p>
        <Btn onClick={() => navigate('/dashboard/examens')}>← Retour aux examens</Btn>
      </div>
    </div>
  )

  const { tentative, examen, questions, tentativeDetail } = data
  const reussi   = tentative.statut === 'REUSSI'
  const echoue   = tentative.statut === 'ECHOUE'
  const score    = tentative.pourcentage != null ? parseFloat(tentative.pourcentage).toFixed(1) : null
  const notePass = examen?.note_passage || tentativeDetail?.note_passage || 70

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E6', padding: '24px 16px', overflowY: 'auto' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* En-tête résultat */}
        <div style={{
          background: reussi
            ? 'linear-gradient(135deg, #065F46 0%, #059669 100%)'
            : echoue
            ? 'linear-gradient(135deg, #991B1B 0%, #DC2626 100%)'
            : 'linear-gradient(135deg, #0F2040 0%, #162B55 100%)',
          borderRadius: 20, padding: '32px 28px', marginBottom: 20,
          color: '#FFFFFF', textAlign: 'center',
          boxShadow: reussi ? '0 8px 32px rgba(5,150,105,0.3)' : '0 8px 32px rgba(10,22,40,0.3)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{reussi ? '🏆' : echoue ? '😔' : '⏳'}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            {reussi ? 'Félicitations !' : echoue ? 'Pas cette fois…' : 'En cours'}
          </h1>
          <p style={{ opacity: 0.85, fontSize: 15, marginBottom: 20 }}>
            {examen?.titre || tentativeDetail?.examen_titre}
          </p>

          {/* Stats en ligne */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Résultat', value: reussi ? '✅ Réussi' : echoue ? '❌ Échoué' : '⏰ Expiré' },
              score && { label: 'Score', value: `${score}%` },
              { label: 'Note de passage', value: `${notePass}%` },
            ].filter(Boolean).map(({ label, value }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: 12,
                padding: '10px 18px', minWidth: 100,
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>{value}</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificat si réussi */}
        {reussi && (
          <div style={{
            background: '#FAF4E4', border: '1.5px solid #C5A059', borderRadius: 14,
            padding: '16px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>🎓</span>
            <div>
              <p style={{ fontWeight: 700, color: '#8B6914', fontSize: 14 }}>Certificat disponible !</p>
              <p style={{ fontSize: 12, color: '#C5A059', marginTop: 2 }}>Consultez la section "Mes Certificats" pour le télécharger.</p>
            </div>
            <Btn size="sm" variant="gold" onClick={() => navigate('/dashboard/certificats')} style={{ marginLeft: 'auto' }}>
              🏆 Voir
            </Btn>
          </div>
        )}

        {/* Corrigé détaillé */}
        {questions && questions.length > 0 ? (
          <div style={{ background: '#FFFFFF', border: '1px solid #E8D5A3', borderRadius: 20, padding: '20px 20px 8px', boxShadow: '0 2px 12px rgba(10,22,40,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #F2E8CC' }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: '#0A1628' }}>Corrigé détaillé</h2>
              <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 4 }}>{questions.length} question{questions.length > 1 ? 's' : ''}</span>
            </div>
            {questions.map((q, idx) => (
              <QuestionCorrigee key={q.id} q={q} idx={idx} />
            ))}
          </div>
        ) : (
          <div style={{
            background: '#FAF4E4', border: '1px solid #E8D5A3', borderRadius: 14,
            padding: '20px', textAlign: 'center', marginBottom: 16,
          }}>
            <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>🔒</span>
            <p style={{ color: '#8B6914', fontWeight: 600, fontSize: 14 }}>Corrigé non disponible pour l'instant</p>
            <p style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
              Le tuteur a configuré une date d'affichage pour le corrigé.
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <Btn onClick={() => navigate('/dashboard/examens')} className="flex-1">
            ↩ Retour aux examens
          </Btn>
          {reussi && (
            <Btn variant="gold" onClick={() => navigate('/dashboard/certificats')}>
              🏆 Mes certificats
            </Btn>
          )}
        </div>
      </div>
    </div>
  )
}