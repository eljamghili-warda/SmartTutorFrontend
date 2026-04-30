import React, { useEffect, useState } from 'react'
import { tuteursAPI, invitationsAPI, sallesAPI, evaluationsAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Badge, Card, Avatar, Stars, Modal, FormGroup, EmptyState, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const TuteurCard = ({ t, onInvite, onEval }) => (
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
      <Btn size="sm" onClick={() => onInvite(t)} className="flex-1 justify-center">✉️ Inviter</Btn>
      <Btn size="sm" variant="secondary" onClick={() => onEval(t)} className="flex-1 justify-center">⭐ Évaluer</Btn>
    </div>
  </Card>
)

export default function Tuteurs() {
  const [tuteurs, setTuteurs]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [mesSalles, setMesSalles] = useState([])
  const [inviteTarget, setInvite] = useState(null)
  const [evalTarget, setEval]     = useState(null)
  const [selectedSalle, setSalle] = useState('')
  const [evalNote, setEvalNote]   = useState(5)
  const [evalComment, setEvalCmt] = useState('')
  const { toasts, success, error } = useToast()

  useEffect(() => {
    tuteursAPI.getAll().then(({ data }) => setTuteurs(data)).finally(() => setLoading(false))
    sallesAPI.getMesSalles().then(({ data }) => setMesSalles(data.filter(s => s.mon_role === 'ADMIN')))
  }, [])

  const handleSearch = (q) => {
    tuteursAPI.getAll({ search: q }).then(({ data }) => setTuteurs(data))
  }

  const handleInvite = async () => {
    if (!selectedSalle) return error('Choisissez une salle')
    try {
      await invitationsAPI.send({ salleId: selectedSalle, destinataireId: inviteTarget.id, typeInvitation: 'VERS_TUTEUR' })
      success(`Invitation envoyée à ${inviteTarget.prenom} !`)
      setInvite(null); setSalle('')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
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
      <Header title="Tuteurs" onSearch={handleSearch} />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : tuteurs.length === 0 ? (
          <EmptyState icon="👨‍🏫" title="Aucun tuteur disponible" desc="Revenez plus tard." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tuteurs.map(t => <TuteurCard key={t.id} t={t} onInvite={setInvite} onEval={setEval} />)}
          </div>
        )}
      </div>

      {/* Modal Inviter */}
      <Modal open={!!inviteTarget} onClose={() => setInvite(null)}
        title={`Inviter ${inviteTarget?.prenom || ''} ${inviteTarget?.nom || ''}`}>
        <div className="flex flex-col gap-4">
          <FormGroup label="Choisir une salle (dont vous êtes admin)">
            <select value={selectedSalle} onChange={e => setSalle(e.target.value)}>
              <option value="">Sélectionner une salle...</option>
              {mesSalles.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </FormGroup>
          {mesSalles.length === 0 && (
            <p className="text-sm text-slate-500 bg-ink-700 rounded-xl p-3">
              Vous n'administrez aucune salle. Créez-en une d'abord depuis l'accueil.
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Btn variant="secondary" onClick={() => setInvite(null)}>Annuler</Btn>
            <Btn onClick={handleInvite} disabled={!selectedSalle}>Envoyer l'invitation</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal Évaluer */}
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
  )
}