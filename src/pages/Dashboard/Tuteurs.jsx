import React, { useEffect, useState } from 'react'
import { tuteursAPI, evaluationsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import { Btn, Badge, Card, Avatar, Stars, Modal, FormGroup, EmptyState, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

// Carte tuteur pour étudiant (bouton Évaluer uniquement — l'invitation se fait depuis la salle)
const TuteurCardEtudiant = ({ t, onEval }) => (
  <Card className="flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <Avatar user={t} size="lg" />
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-white truncate">{t.prenom} {t.nom}</p>
        <Stars note={t.note_moyenne || 0} />
      </div>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {(t.specialites || []).map(s => <Badge key={s} variant="primary">{s}</Badge>)}
    </div>
    {t.biographie && (
      <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{t.biographie}</p>
    )}
    <div className="flex gap-2 pt-2 border-t border-ink-700 mt-auto">
      <Btn size="sm" variant="secondary" onClick={() => onEval(t)} className="w-full justify-center">⭐ Évaluer</Btn>
    </div>
  </Card>
)

// Carte tuteur pour tuteur (vue simple, sans actions)
const TuteurCardTuteur = ({ t }) => (
  <Card className="flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <Avatar user={t} size="lg" />
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-white truncate">{t.prenom} {t.nom}</p>
        <Stars note={t.note_moyenne || 0} />
      </div>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {(t.specialites || []).map(s => <Badge key={s} variant="primary">{s}</Badge>)}
    </div>
    {t.biographie && (
      <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{t.biographie}</p>
    )}
    <div className="pt-2 border-t border-ink-700 mt-auto">
      <p className="text-xs text-slate-600 text-center">
        ⭐ {t.note_moyenne ? Number(t.note_moyenne).toFixed(1) : 'Pas encore évalué'}
      </p>
    </div>
  </Card>
)

export default function Tuteurs() {
  const { user } = useAuth()
  const isTuteur = user?.role === 'tuteur'

  const [tuteurs, setTuteurs]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [evalTarget, setEval]     = useState(null)
  const [evalNote, setEvalNote]   = useState(5)
  const [evalComment, setEvalCmt] = useState('')
  const { toasts, success, error } = useToast()

  useEffect(() => {
    tuteursAPI.getAll().then(({ data }) => setTuteurs(data)).finally(() => setLoading(false))

  }, [isTuteur])

  const handleSearch = (q) => {
    tuteursAPI.getAll({ search: q }).then(({ data }) => setTuteurs(data))
  }

  const handleEval = async () => {
    try {
      await evaluationsAPI.create({ tuteurId: evalTarget.id, note: evalNote, commentaire: evalComment })
      success('Évaluation envoyée !')
      setEval(null); setEvalNote(5); setEvalCmt('')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  return (
    <>
      <Header title={isTuteur ? 'Explorer les tuteurs' : 'Tuteurs'} onSearch={handleSearch} />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6">
        {isTuteur && (
          <p className="text-sm text-slate-500 mb-4">
            Découvrez les autres tuteurs de la plateforme.
          </p>
        )}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : tuteurs.length === 0 ? (
          <EmptyState icon="👨‍🏫" title="Aucun tuteur disponible" desc="Revenez plus tard." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tuteurs.map(t =>
              isTuteur
                ? <TuteurCardTuteur key={t.id} t={t} />
                : <TuteurCardEtudiant key={t.id} t={t} onEval={setEval} />
            )}
          </div>
        )}
      </div>

      {/* Modal Inviter — étudiant seulement */}
      {!isTuteur && (
        <>
          <Modal open={!!evalTarget} onClose={() => setEval(null)}
            title={`Évaluer ${evalTarget?.prenom || ''} ${evalTarget?.nom || ''}`}>
            <div className="flex flex-col gap-4">
              <FormGroup label="Note">
                <div className="flex gap-2 items-center py-1">
                  <Stars note={evalNote} interactive onChange={setEvalNote} />
                  <span className="text-sm text-slate-400 ml-2">{evalNote}/5</span>
                </div>
              </FormGroup>
              <FormGroup label="Commentaire (optionnel)">
                <textarea rows={3} value={evalComment} onChange={e => setEvalCmt(e.target.value)} placeholder="Votre retour sur ce tuteur..." />
              </FormGroup>
              <div className="flex gap-3 justify-end">
                <Btn variant="secondary" onClick={() => setEval(null)}>Annuler</Btn>
                <Btn onClick={handleEval}>Envoyer</Btn>
              </div>
            </div>
          </Modal>
        </>
      )}
    </>
  )
}