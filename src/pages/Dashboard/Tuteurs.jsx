import React, { useEffect, useState } from 'react'
import { tuteursAPI, evaluationsAPI, tarifsAPI, seancesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import { Btn, Badge, Card, Avatar, Stars, Modal, FormGroup, EmptyState, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const JOURS_COURT = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const JOURS_LONG  = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

// Bloc disponibilités réutilisable
const DisposBlock = ({ tuteurId }) => {
  const [dispos,  setDispos]  = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [open,    setOpen]    = React.useState(false)

  React.useEffect(() => {
    seancesAPI.getDisponibilites(tuteurId)
      .then(({ data }) => setDispos(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tuteurId])

  const byJour = JOURS_LONG.map((long, idx) => ({
    idx, long, court: JOURS_COURT[idx],
    plages: dispos.filter(d => d.jour_semaine === idx)
                  .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut)),
  })).filter(j => j.idx >= 1)

  const joursActifs = byJour.filter(j => j.plages.length > 0)

  if (loading) return (
    <div className="bg-blue-50 rounded-xl p-2.5 text-center">
      <p className="text-xs text-slate-400">Chargement des disponibilités…</p>
    </div>
  )

  if (joursActifs.length === 0) return (
    <div className="bg-blue-50 rounded-xl p-2.5 text-center border border-blue-100">
      <p className="text-xs text-slate-400">🗓️ Aucune disponibilité renseignée</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-3 py-2 transition-colors"
      >
        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
          🗓️ Disponibilités · {joursActifs.length} jour{joursActifs.length > 1 ? 's' : ''}
        </span>
        <span className="text-xs text-blue-500 font-bold">{open ? '▲ Masquer' : '▼ Voir'}</span>
      </button>

      {open && (
        <div className="rounded-xl border border-blue-200 bg-white overflow-hidden">
          {joursActifs.map((jour, i) => (
            <div key={jour.idx}
              className={`flex items-start gap-3 px-3 py-2.5
                ${i < joursActifs.length - 1 ? 'border-b border-blue-100' : ''}`}
            >
              {/* Badge jour */}
              <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-black text-blue-700">{jour.court}</span>
              </div>
              {/* Plages */}
              <div className="flex-1">
                <p className="text-xs font-semibold text-ink-800 mb-1.5">{jour.long}</p>
                <div className="flex flex-wrap gap-1.5">
                  {jour.plages.map(p => (
                    <span key={p.id}
                      className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700">
                      {p.heure_debut.slice(0, 5)} – {p.heure_fin.slice(0, 5)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Carte tuteur pour étudiant — avec tarifs + disponibilités
const TuteurCardEtudiant = ({ t, onEval }) => {
  const [tarifs, setTarifs] = React.useState([])
  React.useEffect(() => {
    tarifsAPI.getByTuteur(t.id).then(({ data }) => setTarifs(data)).catch(() => {})
  }, [t.id])

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar user={t} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-ink-800 truncate">{t.prenom} {t.nom}</p>
          <Stars note={t.note_moyenne || 0} />
          <p className="text-xs text-slate-500 mt-0.5">
            ⭐ {t.note_moyenne ? Number(t.note_moyenne).toFixed(1) : 'Non évalué'}
          </p>
        </div>
      </div>

      {/* Spécialités */}
      <div className="flex flex-wrap gap-1.5">
        {(t.specialites || []).map(s => <Badge key={s} variant="primary">{s}</Badge>)}
      </div>

      {/* Biographie */}
      {t.biographie && (
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{t.biographie}</p>
      )}

      {/* ── Tarifs ── */}
      {tarifs.length > 0 ? (
        <div className="bg-blue-100/50 rounded-xl p-3 flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">💰 Tarifs</p>
          <div className="flex flex-col gap-1.5">
            {tarifs.map(tarif => (
              <div key={tarif.id} className="flex items-center justify-between">
                <span className="text-xs text-blue-800">{tarif.matiere}</span>
                <span className="text-xs font-bold text-blue-700">{Number(tarif.tarif_heure).toLocaleString('fr-FR')} DH/h</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-blue-100/30 rounded-xl p-2.5 text-center">
          <p className="text-xs text-slate-400">Tarifs non renseignés</p>
        </div>
      )}

      {/* ── Disponibilités ── */}
      <DisposBlock tuteurId={t.id} />

      <div className="flex gap-2 pt-2 border-t border-blue-200 mt-auto">
        <Btn size="sm" variant="secondary" onClick={() => onEval(t)} className="w-full justify-center">⭐ Évaluer</Btn>
      </div>
    </Card>
  )
}

// Carte tuteur pour tuteur (vue simple, avec tarifs + disponibilités)
const TuteurCardTuteur = ({ t }) => {
  const [tarifs, setTarifs] = React.useState([])
  React.useEffect(() => {
    tarifsAPI.getByTuteur(t.id).then(({ data }) => setTarifs(data)).catch(() => {})
  }, [t.id])

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar user={t} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-ink-800 truncate">{t.prenom} {t.nom}</p>
          <Stars note={t.note_moyenne || 0} />
          <p className="text-xs text-slate-500 mt-0.5">
            ⭐ {t.note_moyenne ? Number(t.note_moyenne).toFixed(1) : 'Non évalué'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(t.specialites || []).map(s => <Badge key={s} variant="primary">{s}</Badge>)}
      </div>
      {t.biographie && (
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{t.biographie}</p>
      )}
      {tarifs.length > 0 && (
        <div className="bg-blue-100/50 rounded-xl p-3 flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">💰 Tarifs</p>
          {tarifs.map(tarif => (
            <div key={tarif.id} className="flex items-center justify-between">
              <span className="text-xs text-blue-800">{tarif.matiere}</span>
              <span className="text-xs font-bold text-blue-700">{Number(tarif.tarif_heure).toLocaleString('fr-FR')} DH/h</span>
            </div>
          ))}
        </div>
      )}
      {/* ── Disponibilités ── */}
      <DisposBlock tuteurId={t.id} />
    </Card>
  )
}

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
                  <span className="text-sm text-slate-500 ml-2">{evalNote}/5</span>
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