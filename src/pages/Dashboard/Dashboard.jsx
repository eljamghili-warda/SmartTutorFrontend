import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sallesAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Badge, Card, Modal, FormGroup, EmptyState, Spinner } from '../../components/UI'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/UI'

const SalleCard = ({ salle, onEnter }) => (
  <Card onClick={() => onEnter(salle)} className="flex flex-col gap-3 group">
    <div className="flex items-start justify-between gap-2">
      <div className="flex gap-2 flex-wrap">
        <Badge variant={salle.type === 'PUBLIQUE' ? 'public' : 'private'}>
          {salle.type === 'PUBLIQUE' ? '🔓 Publique' : '🔒 Privée'}
        </Badge>
        <Badge variant={salle.statut === 'ACTIVE_AVEC_TUTEUR' ? 'primary' : 'default'}>
          {salle.statut === 'ACTIVE_AVEC_TUTEUR' ? '👨‍🏫 Avec tuteur' : '📚 Sans tuteur'}
        </Badge>
      </div>
    </div>
    <h3 className="font-display font-bold text-white text-base leading-tight group-hover:text-violet-400 transition-colors">{salle.nom}</h3>
    {salle.matiere && <p className="text-xs text-violet-400 font-medium">📖 {salle.matiere}</p>}
    <p className="text-sm text-slate-500 flex-1 line-clamp-2">{salle.description || 'Aucune description.'}</p>
    <div className="flex items-center justify-between pt-3 border-t border-ink-700 text-xs text-slate-500">
      <span>👥 {salle.nb_participants} participants</span>
      <span>par {salle.createur_nom}</span>
    </div>
  </Card>
)

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
            {[{ v:'PUBLIQUE', icon:'🔓', label:'Publique', desc:'Accès libre' },{ v:'PRIVEE', icon:'🔒', label:'Privée', desc:'Sur invitation' }].map(t => (
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
  const [salles, setSalles]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [showCreate, setCreate] = useState(false)
  const navigate = useNavigate()
  const { toasts, success, error } = useToast()

  const load = (search = '') =>
    sallesAPI.getAll({ search }).then(({ data }) => setSalles(data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleEnter = async (salle) => {
    try {
      if (!salle.est_membre || parseInt(salle.est_membre) === 0) await sallesAPI.rejoindre(salle.id)
      navigate(`/salle/${salle.id}`)
    } catch (err) {
      if (err.response?.status === 409 || err.response?.status === 403) navigate(`/salle/${salle.id}`)
      else error(err.response?.data?.error || 'Erreur')
    }
  }

  const handleCreate = async (form) => {
    try {
      const { data } = await sallesAPI.create(form)
      setCreate(false)
      success('Salle créée !')
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
          <p className="text-sm text-slate-500">{salles.length} salle{salles.length > 1 ? 's' : ''} disponible{salles.length > 1 ? 's' : ''}</p>
          <Btn onClick={() => setCreate(true)}>➕ Créer une salle</Btn>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : salles.length === 0 ? (
          <EmptyState icon="🏠" title="Aucune salle disponible"
            desc="Créez la première salle collaborative ou attendez qu'une salle soit partagée."
            action={<Btn onClick={() => setCreate(true)}>Créer une salle</Btn>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {salles.map(s => <SalleCard key={s.id} salle={s} onEnter={handleEnter} />)}
          </div>
        )}
      </div>

      <CreateModal open={showCreate} onClose={() => setCreate(false)} onCreate={handleCreate} />
    </>
  )
}