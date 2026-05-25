import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { examensAPI } from '../../services/api'
import { Btn, Spinner } from '../../components/UI'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '—'

export default function ExamenResultats() {
  const { id: examenId } = useParams()
  const navigate = useNavigate()
  const [data,    setData]    = useState(null)   // { tentative, questions }
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    // Récupérer la dernière tentative de l'étudiant pour cet examen
    examensAPI.getMesExamensEtudiant()
      .then(async ({ data: examens }) => {
        const examen = examens.find(e => String(e.id) === String(examenId))
        if (!examen || !examen.nb_tentatives_faites) {
          setError('Aucune tentative trouvée pour cet examen.')
          return
        }
        // Récupérer le dernier tentativeId via l'examen — on utilise getById pour avoir les infos
        // Le corrigé complet via /tentatives/:id/resultats
        // Pour l'instant on affiche les infos de l'examen + score stocké
        setData({ examen })
      })
      .catch(() => setError('Impossible de charger les résultats.'))
      .finally(() => setLoading(false))
  }, [examenId])

  if (loading) return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
      <div className="bg-ink-800 border border-ink-600 rounded-3xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-amber-400 text-lg mb-2">Résultats non disponibles</p>
        <p className="text-slate-500 text-sm mb-6">
          {error || 'Le corrigé n\'est pas encore disponible ou vous n\'avez pas encore passé cet examen.'}
        </p>
        <Btn variant="ghost" onClick={() => navigate('/dashboard/examens')}>
          ← Retour aux examens
        </Btn>
      </div>
    </div>
  )

  const { examen } = data
  const reussi = examen.deja_reussi > 0
  const score  = examen.meilleur_score ? parseFloat(examen.meilleur_score).toFixed(0) : null

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
      <div className="bg-ink-800 border border-ink-600 rounded-3xl p-8 max-w-lg w-full">

        {/* En-tête */}
        <div className="text-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4
            ${reussi ? 'bg-emerald-500/20 border-2 border-emerald-500/40' : 'bg-rose-500/20 border-2 border-rose-500/40'}`}>
            {reussi ? '🏆' : '😔'}
          </div>
          <h1 className="text-xl font-bold text-slate-100 mb-1">{examen.titre}</h1>
          <p className="text-sm text-slate-500">{examen.salle_nom}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-ink-700 rounded-2xl p-3 text-center">
            <p className={`text-xl font-bold ${reussi ? 'text-emerald-400' : 'text-rose-400'}`}>
              {reussi ? '✅' : '❌'}
            </p>
            <p className="text-xs text-slate-500 mt-1">{reussi ? 'Réussi' : 'Échoué'}</p>
          </div>
          {score && (
            <div className="bg-ink-700 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-violet-400">{score}%</p>
              <p className="text-xs text-slate-500 mt-1">Meilleur score</p>
            </div>
          )}
          <div className="bg-ink-700 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-slate-100">{examen.nb_tentatives_faites}</p>
            <p className="text-xs text-slate-500 mt-1">Tentative{examen.nb_tentatives_faites > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Certificat si réussi */}
        {reussi && (
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 mb-4 text-center">
            <p className="text-amber-400 font-semibold">🎓 Certificat disponible</p>
            <p className="text-xs text-amber-400/70 mt-1">Consultez la section "Mes Certificats"</p>
          </div>
        )}

        {/* Note de passage */}
        <div className="bg-ink-700/50 rounded-xl p-3 mb-6 text-sm text-slate-400 text-center">
          Note de passage requise : <strong className="text-slate-200">{examen.note_passage}%</strong>
        </div>

        <div className="flex flex-col gap-2">
          <Btn onClick={() => navigate('/dashboard/examens')}>
            ↩ Retour aux examens
          </Btn>
          {reussi && (
            <Btn variant="ghost" onClick={() => navigate('/dashboard/certificats')}>
              🏆 Voir mes certificats
            </Btn>
          )}
        </div>
      </div>
    </div>
  )
}