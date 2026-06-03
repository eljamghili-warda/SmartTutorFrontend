import React, { useEffect, useState } from 'react'
import { invitationsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
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
    { id: 'recues',   label: '📬 Reçues',  count: recues.filter(i => i.statut === 'EN_ATTENTE').length },
    { id: 'envoyees', label: '📤 Envoyées', count: envoyees.length },
  ]

  // ── Carte invitation ────────────────────────────────────────────────────────
  const InvCard = ({ inv, isRecue }) => {
    const sc            = statutConfig[inv.statut] || statutConfig.EN_ATTENTE
    const isTuteurInvit = inv.type_invitation === 'VERS_TUTEUR'
    const hasPaiement   = inv.montant_paye != null
    const paiementOk    = inv.paiement_confirme

    return (
      <div className="bg-ink-800 border border-ink-700 rounded-2xl p-5 flex flex-col gap-4 animate-slide-up">

        {/* Ligne principale */}
        <div className="flex items-start gap-4">
          {/* Icône */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
            ${isTuteurInvit ? 'bg-violet-600/20' : 'bg-blue-600/20'}`}>
            {isTuteurInvit ? '👨‍🏫' : '👤'}
          </div>

          {/* Infos salle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display font-bold text-ink-800">{inv.salle_nom}</p>
              <Badge variant={isTuteurInvit ? 'primary' : 'default'}>
                {isTuteurInvit ? 'Invitation tuteur' : 'Invitation membre'}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              {isRecue
                ? <>De <span className="text-slate-300 font-medium">{inv.expediteur_nom}</span></>
                : <>À <span className="text-slate-300 font-medium">{inv.destinataire_nom}</span></>
              }
              {' · '}
              <span className="text-slate-500 text-xs">
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
          <div className="bg-ink-700 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Détails de la mission
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Matière */}
              {inv.matiere && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-500">Matière</span>
                  <span className="text-sm font-semibold text-ink-800">📚 {inv.matiere}</span>
                </div>
              )}
              {/* Durée */}
              {inv.duree_heures && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-500">Durée prévue</span>
                  <span className="text-sm font-semibold text-ink-800">
                    ⏱ {inv.duree_heures}h
                    <span className="text-slate-500 text-xs ml-1">
                      ({inv.duree_heures === 1 ? '1 heure' : `${inv.duree_heures} heures`})
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Rémunération */}
            {hasPaiement && (
              <div className="flex items-center justify-between pt-2 border-t border-ink-600">
                <div>
                  <p className="text-xs text-slate-500">Votre rémunération</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {Math.round(inv.montant_paye * 0.9).toLocaleString()} MAD
                    <span className="text-xs text-slate-500 font-normal ml-1">
                      (après commission 10%)
                    </span>
                  </p>
                </div>
                {/* Statut paiement */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                  ${paiementOk
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'}`}>
                  {paiementOk ? '✅ Paiement confirmé' : '⏳ Paiement en attente'}
                </div>
              </div>
            )}

            {/* Avertissement si paiement pas encore confirmé */}
            {hasPaiement && !paiementOk && isRecue && inv.statut === 'EN_ATTENTE' && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex gap-2 items-start">
                <span className="flex-shrink-0">⚠️</span>
                <p className="text-xs text-amber-400">
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
              <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                <span className="w-4 h-4 border-2 border-slate-600 border-t-violet-400 rounded-full animate-spin" />
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
    <>
      <Header title="Invitations" />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6">

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-ink-800 border border-ink-700 rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
                ${tab === t.id ? 'bg-violet-600 text-ink-800 shadow' : 'text-slate-400 hover:text-ink-600'}`}>
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
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-5xl">{tab === 'recues' ? '📭' : '📤'}</span>
            <p className="text-slate-300 font-semibold text-lg">
              {tab === 'recues' ? 'Aucune invitation reçue' : 'Aucune invitation envoyée'}
            </p>
            <p className="text-slate-500 text-sm">
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
    </>
  )
}