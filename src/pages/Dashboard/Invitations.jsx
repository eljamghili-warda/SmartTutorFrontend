import React, { useEffect, useState } from 'react'
import { invitationsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import { Btn, Badge, EmptyState, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const statutConfig = {
  EN_ATTENTE: { variant: 'warning',  label: '⏳ En attente' },
  ACCEPTEE:   { variant: 'success',  label: '✅ Acceptée' },
  REFUSEE:    { variant: 'danger',   label: '❌ Refusée' },
  EXPIREE:    { variant: 'default',  label: '⌛ Expirée' },
}

export default function Invitations() {
  const { user } = useAuth()
  const [recues,   setRecues]   = useState([])
  const [envoyees, setEnvoyees] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('recues')
  const { toasts, success, error } = useToast()

  const load = () => {
    setLoading(true)
    invitationsAPI.getMes()
      .then(({ data }) => {
        // Séparer reçues vs envoyées selon l'utilisateur connecté
        setRecues(data.filter(i => i.destinataire_id === user.id))
        setEnvoyees(data.filter(i => i.expediteur_id === user.id))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const accepter = async (id) => {
    try {
      await invitationsAPI.accepter(id)
      success('Invitation acceptée !')
      load()
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const refuser = async (id) => {
    try {
      await invitationsAPI.refuser(id)
      success('Invitation refusée.')
      load()
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const tabs = [
    { id: 'recues',   label: '📬 Reçues',   count: recues.filter(i => i.statut === 'EN_ATTENTE').length },
    { id: 'envoyees', label: '📤 Envoyées',  count: envoyees.length },
  ]

  const InvCard = ({ inv, isRecue }) => {
    const sc = statutConfig[inv.statut] || statutConfig.EN_ATTENTE
    return (
      <div className="bg-ink-800 border border-ink-700 rounded-2xl p-5 flex items-center gap-4 animate-slide-up">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-xl flex-shrink-0">
          {inv.type_invitation === 'VERS_TUTEUR' ? '👨‍🏫' : '👤'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-white">{inv.salle_nom}</p>
          <p className="text-sm text-slate-400 mt-0.5">
            {isRecue
              ? <>De <span className="text-slate-300 font-medium">{inv.expediteur_nom}</span></>
              : <>À <span className="text-slate-300 font-medium">{inv.destinataire_nom}</span></>
            }
            {' · '}
            <Badge variant={inv.type_invitation === 'VERS_TUTEUR' ? 'primary' : 'default'}>
              {inv.type_invitation === 'VERS_TUTEUR' ? 'Tuteur' : 'Membre'}
            </Badge>
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {inv.date_envoi && <>Envoyée le {new Date(inv.date_envoi).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}</>}
          </p>
        </div>
        <div className="flex-shrink-0">
          {isRecue && inv.statut === 'EN_ATTENTE' ? (
            <div className="flex gap-2">
              <Btn variant="success" size="sm" onClick={() => accepter(inv.id)}>✓ Accepter</Btn>
              <Btn variant="danger"  size="sm" onClick={() => refuser(inv.id)}>✕ Refuser</Btn>
            </div>
          ) : (
            <Badge variant={sc.variant}>{sc.label}</Badge>
          )}
        </div>
      </div>
    )
  }

  const current = tab === 'recues' ? recues : envoyees

  return (
    <>
      <Header title="Invitations" />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-ink-800 border border-ink-700 rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
                ${tab === t.id ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${tab === t.id ? 'bg-white/20' : 'bg-violet-600/30 text-violet-400'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : current.length === 0 ? (
          <EmptyState
            icon={tab === 'recues' ? '📭' : '📤'}
            title={tab === 'recues' ? 'Aucune invitation reçue' : 'Aucune invitation envoyée'}
            desc={tab === 'recues' ? "Vous n'avez aucune invitation pour le moment." : "Vous n'avez encore invité personne."}
          />
        ) : (
          <div className="flex flex-col gap-3 max-w-2xl">
            {current.map(inv => (
              <InvCard key={inv.id} inv={inv} isRecue={tab === 'recues'} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}