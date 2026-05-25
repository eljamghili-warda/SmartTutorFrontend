import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { examensAPI } from '../../services/api'
import { Btn, Spinner } from '../../components/UI'

export default function ExamenResultats() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    examensAPI.getMesExamensEtudiant()
      .then(({ data: examens }) => {
        const found = examens.find(e => String(e.id) === String(id))
        if (!found || !found.nb_tentatives_faites) {
          setError('Aucune tentative trouvée pour cet examen.')
        } else {
          setData(found)
        }
      })
      .catch(() => setError('Impossible de charger cet examen.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
      <div className="bg-ink-800 border border-ink-600 rounded-3xl p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <p className="text-amber-400 text-lg mb-4">⏳ {error}</p>
            <Btn variant="ghost" onClick={() => navigate('/dashboard/examens')}>
              ← Retour aux examens
            </Btn>
          </>
        ) : (
          <>
            <p className="text-slate-300 mb-4">Examen : {data?.titre}</p>
            <Btn variant="ghost" onClick={() => navigate('/dashboard/examens')}>
              ← Retour aux examens
            </Btn>
          </>
        )}
      </div>
    </div>
  )
}