import React, { useEffect, useState } from 'react'
import { invitationsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useNotif } from '../../context/NotifContext'
import Header from '../../components/Header/Header'
import { Btn, Badge, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const statutConfig = {
  EN_ATTENTE: { variant: 'warning', label: '⏳ En attente' },
  ACCEPTEE:   { variant: 'success', label: '✅ Acceptée'   },
  REFUSEE:    { variant: 'danger',  label: '❌ Refusée'    },
  EXPIREE:    { variant: 'default', label: '⌛ Expirée'    },
}

export default function Invitations() {
  const { user } = useAuth()
  const { refresh: refreshNotif } = useNotif()
  const [recues,   setRecues]   = useState([])
  const [envoyees, setEnvoyees] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('recues')
  const { toasts, success, error } = useToast()

  const load = () => {
    setLoading(true)
    invitationsAPI.getMes()
      .then(({ data }) => {
        setRecues(data.filter(i => i.destinataire_id === user.id))
        setEnvoyees(data.filter(i => i.expediteur_id === user.id))
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const accepter = async (id) => {
    try {
      await invitationsAPI.accepter(id)
      success('Invitation acceptée ! Vous avez rejoint la salle.')
      load(); refreshNotif()
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const refuser = async (id) => {
    try {
      await invitationsAPI.refuser(id)
      success('Invitation refusée.')
      load(); refreshNotif()
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const tabs = [
    { id: 'recues',   label: '📬 Reçues',  count: recues.filter(i => i.statut === 'EN_ATTENTE').length },
    { id: 'envoyees', label: '📤 Envoyées', count: envoyees.length },
  ]

  // ── Carte invitation (version SmartEdu avec couleurs lisibles) ─────────────
  const InvCard = ({ inv, isRecue }) => {
    const sc            = statutConfig[inv.statut] || statutConfig.EN_ATTENTE
    const isTuteurInvit = inv.type_invitation === 'VERS_TUTEUR'
    const hasPaiement   = inv.montant_paye != null
    const paiementOk    = inv.paiement_confirme

    return (
      <div className="bg-white border border-amber-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">

        {/* Ligne principale */}
        <div className="flex items-start gap-4">
          {/* Icône */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
            ${isTuteurInvit ? 'bg-amber-100 border border-amber-200' : 'bg-navy-100 border border-navy-200'}`}>
            {isTuteurInvit ? '👨‍🏫' : '👤'}
          </div>

          {/* Infos salle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display font-bold text-gray-800 text-base">{inv.salle_nom}</p>
              <Badge variant={isTuteurInvit ? 'gold' : 'primary'}>
                {isTuteurInvit ? '👨‍🏫 Invitation tuteur' : '👤 Invitation membre'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">
              {isRecue
                ? <>De <span className="text-amber-700 font-semibold">{inv.expediteur_nom}</span></>
                : <>À <span className="text-amber-700 font-semibold">{inv.destinataire_nom}</span></>
              }
              {' · '}
              <span className="text-gray-400 text-xs">
                {new Date(inv.date_envoi).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </p>
          </div>

          {/* Statut (si pas EN_ATTENTE) */}
          {inv.statut !== 'EN_ATTENTE' && (
            <Badge variant={sc.variant} className="flex-shrink-0">{sc.label}</Badge>
          )}
        </div>

        {/* ── Détails matière / durée / paiement (pour VERS_TUTEUR) ── */}
        {isTuteurInvit && (inv.matiere || inv.duree_heures || hasPaiement) && (
          <div className="bg-amber-50 rounded-xl p-4 flex flex-col gap-3 border border-amber-100">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              📋 Détails de la mission
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Matière */}
              {inv.matiere && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-500">Matière</span>
                  <span className="text-sm font-semibold text-gray-800">📚 {inv.matiere}</span>
                </div>
              )}
              {/* Durée */}
              {inv.duree_heures && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-500">Durée prévue</span>
                  <span className="text-sm font-semibold text-gray-800">
                    ⏱ {inv.duree_heures}h
                    <span className="text-gray-400 text-xs ml-1">
                      ({inv.duree_heures === 1 ? '1 heure' : `${inv.duree_heures} heures`})
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Rémunération */}
            {hasPaiement && (
              <div className="flex items-center justify-between pt-2 border-t border-amber-200">
                <div>
                  <p className="text-xs text-gray-500">Votre rémunération</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {Math.round(inv.montant_paye * 0.9).toLocaleString()} MAD
                    <span className="text-xs text-gray-400 font-normal ml-1">
                      (après commission 10%)
                    </span>
                  </p>
                </div>
                {/* Statut paiement */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                  ${paiementOk
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                    : 'bg-amber-50 border border-amber-200 text-amber-600'}`}>
                  {paiementOk ? '✅ Paiement confirmé' : '⏳ Paiement en attente'}
                </div>
              </div>
            )}

            {/* Avertissement si paiement pas encore confirmé */}
            {hasPaiement && !paiementOk && isRecue && inv.statut === 'EN_ATTENTE' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex gap-2 items-start">
                <span className="flex-shrink-0 text-amber-500">⚠️</span>
                <p className="text-xs text-amber-600">
                  Le paiement de l'admin n'est pas encore confirmé. Vous pourrez accepter
                  cette invitation dès qu'il sera validé par Chargily.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Boutons Accepter / Refuser ── */}
        {isRecue && inv.statut === 'EN_ATTENTE' && (
          <div className="flex gap-3 justify-end">
            {/* Si paiement requis mais pas encore confirmé → désactiver Accepter */}
            {hasPaiement && !paiementOk ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                En attente de confirmation du paiement…
              </div>
            ) : (
              <>
                <Btn variant="danger"  size="sm" onClick={() => refuser(inv.id)}>✕ Refuser</Btn>
                <Btn variant="success" size="sm" onClick={() => accepter(inv.id)}>✓ Accepter</Btn>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const current = tab === 'recues' ? recues : envoyees

  return (
    <div className="flex flex-col h-full bg-ivory-50">
      <Header title="Invitations" subtitle="Gérez vos invitations" />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6">

        {/* Tabs - version SmartEdu */}
        <div className="flex gap-1 mb-6 bg-white border border-amber-200 rounded-xl p-1 w-fit shadow-sm">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
                ${tab === t.id 
                  ? 'bg-gradient-to-r from-navy-700 to-navy-800 text-white shadow-md' 
                  : 'text-gray-500 hover:text-navy-700 hover:bg-amber-50'}`}>
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${tab === t.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : current.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-4xl">
              {tab === 'recues' ? '📭' : '📤'}
            </div>
            <p className="text-gray-800 font-semibold text-lg">
              {tab === 'recues' ? 'Aucune invitation reçue' : 'Aucune invitation envoyée'}
            </p>
            <p className="text-gray-400 text-sm">
              {tab === 'recues'
                ? "Vous n'avez aucune invitation pour le moment."
                : "Vous n'avez encore invité personne."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-2xl">
            {current.map(inv => (
              <InvCard key={inv.id} inv={inv} isRecue={tab === 'recues'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}