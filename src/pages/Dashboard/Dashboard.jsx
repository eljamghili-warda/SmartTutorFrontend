import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sallesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import { Btn, Badge, Card, Modal, FormGroup, EmptyState, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const SalleCard = ({ salle, onRejoindre, onDemanderInvitation, onOuvrir, userRole, demandeEnvoyee }) => {
  const isPrivee  = salle.type === 'PRIVEE'
  const estMembre = salle.est_membre === true || salle.est_membre === 'true'

  return (
    <Card className="flex flex-col gap-3 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-2 flex-wrap">
          <Badge variant={isPrivee ? 'private' : 'public'}>
            {isPrivee ? '🔒 Privée' : '🔓 Publique'}
          </Badge>
          <Badge variant={salle.statut === 'ACTIVE_AVEC_TUTEUR' ? 'primary' : 'default'}>
            {salle.statut === 'ACTIVE_AVEC_TUTEUR' ? '👨‍🏫 Avec tuteur' : '📚 Sans tuteur'}
          </Badge>
          {estMembre && salle.mon_role && (
            <Badge variant="warning">
              {salle.mon_role === 'ADMIN' ? '👑 Admin' : salle.mon_role === 'CO_ADMIN' ? '🤝 Co-admin' : '👤 Membre'}
            </Badge>
          )}
        </div>
      </div>
      <h3 className="font-display font-bold text-white text-base leading-tight group-hover:text-violet-400 transition-colors">
        {salle.nom}
      </h3>
      {salle.matiere && <p className="text-xs text-violet-400 font-medium">📖 {salle.matiere}</p>}
      <p className="text-sm text-slate-500 flex-1 line-clamp-2">{salle.description || 'Aucune description.'}</p>
      <div className="flex items-center justify-between pt-3 border-t border-ink-700 text-xs text-slate-500">
        <span>👥 {salle.nb_participants} participants</span>
        <span>par {salle.createur_nom}</span>
      </div>
      <div>
        {estMembre ? (
          <Btn size="sm" className="w-full justify-center" onClick={() => onOuvrir(salle)}>
            🚪 Entrer dans la salle
          </Btn>
        ) : isPrivee ? (
          <Btn size="sm" variant="secondary" className="w-full justify-center"
            disabled={demandeEnvoyee}
            onClick={() => onDemanderInvitation(salle)}>
            {demandeEnvoyee ? '⏳ Demande envoyée' : '✉️ Demander une invitation'}
          </Btn>
        ) : (
          // Salle publique : étudiant → direct | tuteur → demande
          userRole === 'tuteur' ? (
            <Btn size="sm" variant="secondary" className="w-full justify-center"
              disabled={demandeEnvoyee}
              onClick={() => onDemanderInvitation(salle)}>
              {demandeEnvoyee ? '⏳ Demande envoyée' : '📨 Demander à rejoindre'}
            </Btn>
          ) : (
            <Btn size="sm" className="w-full justify-center"
              onClick={() => onRejoindre(salle)}>
              ➕ Rejoindre
            </Btn>
          )
        )}
      </div>
    </Card>
  )
}

const CreateModal = ({ open, onClose, onCreate }) => {
  const [form, setForm] = useState({ nom: '', type: 'PUBLIQUE', matiere: '', description: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const handleSubmit = async (e) => {
    e.preventDefault()
    await onCreate(form)
    setForm({ nom: '', type: 'PUBLIQUE', matiere: '', description: '' })
  }
  return (
    <Modal open={open} onClose={onClose} title="✨ Créer une salle">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormGroup label="Nom de la salle *">
          <input required value={form.nom} onChange={set('nom')} placeholder="ex: Maths Terminale S" />
        </FormGroup>
        <FormGroup label="Type de salle">
          <div className="grid grid-cols-2 gap-3">
            {[{ v:'PUBLIQUE', icon:'🔓', label:'Publique', desc:'Accès libre' },
              { v:'PRIVEE',   icon:'🔒', label:'Privée',   desc:'Sur invitation' }].map(t => (
              <button key={t.v} type="button" onClick={() => setForm(f => ({ ...f, type: t.v }))}
                className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all text-left
                  ${form.type === t.v ? 'border-violet-500 bg-violet-600/10 text-violet-400' : 'border-ink-600 text-slate-400 hover:border-ink-500'}`}>
                <div>{t.icon} {t.label}</div>
                <div className="text-xs font-normal mt-0.5 opacity-70">{t.desc}</div>
              </button>
            ))}
          </div>
        </FormGroup>
        <FormGroup label="Matière">
          <input value={form.matiere} onChange={set('matiere')} placeholder="ex: Mathématiques" />
        </FormGroup>
        <FormGroup label="Description">
          <textarea rows={3} value={form.description} onChange={set('description')} placeholder="Décrivez l'objectif de la salle..." />
        </FormGroup>
        <div className="flex gap-3 justify-end pt-1">
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
          <Btn type="submit">Créer la salle</Btn>
        </div>
      </form>
    </Modal>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const isTuteur = user?.role === 'tuteur'

  const [salles, setSalles]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setCreate]     = useState(false)
  const [demandesEnv, setDemandes]  = useState(new Set()) // IDs de salles avec demande envoyée
  const navigate = useNavigate()
  const { toasts, success, error } = useToast()

  const load = (search = '') =>
    sallesAPI.getAll({ search }).then(({ data }) => setSalles(data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleOuvrir = (salle) => navigate(`/salle/${salle.id}`)

  // Salle publique → rejoindre directement
  const handleRejoindre = async (salle) => {
    try {
      await sallesAPI.rejoindre(salle.id)
      success(`Vous avez rejoint "${salle.nom}" !`)
      navigate(`/salle/${salle.id}`)
    } catch (err) {
      if (err.response?.status === 409) navigate(`/salle/${salle.id}`)
      else error(err.response?.data?.error || 'Erreur')
    }
  }

  const handleDemanderInvitation = async (salle) => {
    if (demandesEnv.has(salle.id)) return // déjà envoyée
    try {
      await sallesAPI.demanderInvitation(salle.id)
      setDemandes(prev => new Set([...prev, salle.id]))
      success(`Demande envoyée à l'admin de "${salle.nom}" !`)
    } catch (err) {
      if (err.response?.status === 409) {
        setDemandes(prev => new Set([...prev, salle.id])) // marquer comme envoyée quand même
        error("Demande déjà envoyée, en attente de l'admin.")
      } else {
        error(err.response?.data?.error || 'Erreur')
      }
    }
  }

  const handleCreate = async (form) => {
    try {
      const { data } = await sallesAPI.create(form)
      setCreate(false)
      success('Salle créée ! Vous êtes admin.')
      navigate(`/salle/${data.id}`)
    } catch (err) {
      error(err.response?.data?.error || 'Erreur')
    }
  }

  return (
    <>
      <Header title="Salles disponibles" onSearch={load} />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            {salles.length} salle{salles.length > 1 ? 's' : ''} disponible{salles.length > 1 ? 's' : ''}
          </p>
          {/* ✅ Bouton créer salle masqué pour les tuteurs */}
          {!isTuteur && (
            <Btn onClick={() => setCreate(true)}>➕ Créer une salle</Btn>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : salles.length === 0 ? (
          <EmptyState icon="🏠" title="Aucune salle disponible"
            desc={isTuteur ? "Aucune salle disponible pour le moment." : "Créez la première salle collaborative."}
            action={!isTuteur && <Btn onClick={() => setCreate(true)}>Créer une salle</Btn>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {salles.map(s => (
              <SalleCard key={s.id} salle={s}
                userRole={user?.role}
                demandeEnvoyee={demandesEnv.has(s.id)}
                onRejoindre={handleRejoindre}
                onDemanderInvitation={handleDemanderInvitation}
                onOuvrir={handleOuvrir}
              />
            ))}
          </div>
        )}
      </div>
      {!isTuteur && (
        <CreateModal open={showCreate} onClose={() => setCreate(false)} onCreate={handleCreate} />
      )}
    </>
  )
}