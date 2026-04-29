import React, { useEffect, useState } from 'react'
import { invitationsAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Badge, EmptyState, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

export default function Invitations() {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading]         = useState(true)
  const { toasts, success, error }    = useToast()

  useEffect(() => {
    invitationsAPI.getMes().then(({ data }) => setInvitations(data)).finally(() => setLoading(false))
  }, [])

  const accepter = async (id) => {
    try {
      await invitationsAPI.accepter(id)
      setInvitations(prev => prev.filter(i => i.id !== id))
      success('Invitation acceptée !')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const refuser = async (id) => {
    try {
      await invitationsAPI.refuser(id)
      setInvitations(prev => prev.filter(i => i.id !== id))
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  return (
    <>
      <Header title="Invitations" />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : invitations.length === 0 ? (
          <EmptyState icon="📭" title="Aucune invitation en attente" desc="Vous n'avez aucune invitation pour le moment." />
        ) : (
          <div className="flex flex-col gap-3 max-w-2xl">
            {invitations.map(inv => (
              <div key={inv.id} className="bg-ink-800 border border-ink-700 rounded-2xl p-5 flex items-center gap-4 animate-slide-up">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-xl flex-shrink-0">
                  {inv.type_invitation === 'VERS_TUTEUR' ? '👨‍🏫' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-white">{inv.salle_nom}</p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Invitation de <span className="text-slate-300 font-medium">{inv.expediteur_nom}</span>
                    {' · '}
                    <Badge variant={inv.type_invitation === 'VERS_TUTEUR' ? 'primary' : 'default'}>
                      {inv.type_invitation === 'VERS_TUTEUR' ? 'En tant que tuteur' : 'En tant que membre'}
                    </Badge>
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Expire le {new Date(inv.date_expiration).toLocaleDateString('fr-FR', { day:'numeric', month:'long' })}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Btn variant="success" size="sm" onClick={() => accepter(inv.id)}>✓ Accepter</Btn>
                  <Btn variant="danger"  size="sm" onClick={() => refuser(inv.id)}>✕</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}