// Remplace le composant InviteTuteurModal dans Salle.jsx
// L'admin choisit le tuteur → voit le tarif → paie → invitation envoyée

import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' })
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// ─── Étapes du modal ──────────────────────────────────────────────────────────
// 1. CHOIX_TUTEUR   → l'admin choisit le tuteur
// 2. CHOIX_SEANCE   → choisir la matière et la durée (ou séance existante)
// 3. RECAPITULATIF  → afficher le montant total avant de payer
// 4. PAIEMENT       → redirection Chargily ou attente

export default function InviteTuteurAvecPaiement({ salleId, hasTuteur, invitations, onClose, onSuccess, onError }) {
  const [etape,       setEtape]       = useState('CHOIX_TUTEUR')
  const [tuteurs,     setTuteurs]     = useState([])
  const [tarifs,      setTarifs]      = useState([])   // tarifs du tuteur sélectionné
  const [loading,     setLoading]     = useState(true)
  const [paying,      setPaying]      = useState(false)
  const [confirmed,   setConfirmed]   = useState(false)

  // Sélections
  const [tuteur,      setTuteur]      = useState(null)   // { id, prenom, nom, specialites, note_moyenne }
  const [matiere,     setMatiere]     = useState('')
  const [dureeHeures, setDureeHeures] = useState(1)

  // Calculs
  const tarifSelectionne = tarifs.find(t => t.matiere === matiere)
  const montant       = tarifSelectionne ? Math.round(tarifSelectionne.tarif_heure * dureeHeures * 100) / 100 : 0
  const commission    = Math.round(montant * 0.10 * 100) / 100
  const montantTuteur = Math.round((montant - commission) * 100) / 100

  // Charger les tuteurs
  useEffect(() => {
    API.get('/tuteurs').then(({ data }) => setTuteurs(data)).finally(() => setLoading(false))
  }, [])

  // Charger les tarifs quand on sélectionne un tuteur
  useEffect(() => {
    if (!tuteur) return
    setTarifs([]); setMatiere('')
    API.get(`/tarifs/${tuteur.id}`).then(({ data }) => setTarifs(data))
  }, [tuteur])

  // ── Étape 1 : Choisir tuteur ──────────────────────────────────────────────
  const renderChoixTuteur = () => (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-400">Choisissez un tuteur à inviter dans votre salle :</p>
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tuteurs.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">Aucun tuteur disponible</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {tuteurs.map(t => (
            <button key={t.id} type="button"
              onClick={() => { setTuteur(t); setEtape('CHOIX_SEANCE') }}
              className="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all border-ink-600 hover:border-violet-500 hover:bg-violet-600/5">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-400 flex-shrink-0">
                {t.prenom?.[0]}{t.nom?.[0]}
              </div>
              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{t.prenom} {t.nom}</p>
                {t.specialites?.length > 0 && (
                  <p className="text-xs text-slate-500 truncate">{t.specialites.slice(0,3).join(', ')}</p>
                )}
              </div>
              {/* Note */}
              {t.note_moyenne && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-amber-400 text-xs">⭐</span>
                  <span className="text-xs text-slate-400">{Number(t.note_moyenne).toFixed(1)}</span>
                </div>
              )}
              <span className="text-slate-600 flex-shrink-0">→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // ── Étape 2 : Choisir matière + durée ────────────────────────────────────
  const renderChoixSeance = () => (
    <div className="flex flex-col gap-4">
      {/* Tuteur sélectionné */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-600/10 border border-violet-500/20">
        <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300">
          {tuteur.prenom?.[0]}{tuteur.nom?.[0]}
        </div>
        <p className="text-sm font-semibold text-white">{tuteur.prenom} {tuteur.nom}</p>
        <button onClick={() => { setEtape('CHOIX_TUTEUR'); setTuteur(null) }}
          className="ml-auto text-xs text-slate-500 hover:text-slate-300">Changer</button>
      </div>

      {/* Matière */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Matière</label>
        {tarifs.length === 0 ? (
          <div className="flex flex-col gap-2">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400">
                ⚠️ Ce tuteur n'a pas encore défini ses tarifs. Il ne peut pas être invité via paiement.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {tarifs.map(t => (
              <button key={t.id} type="button"
                onClick={() => setMatiere(t.matiere)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${matiere === t.matiere ? 'border-violet-500 bg-violet-600/10' : 'border-ink-600 hover:border-ink-500'}`}>
                <p className="text-xs font-semibold text-white">{t.matiere}</p>
                <p className="text-sm font-bold text-violet-400 mt-1">{Number(t.tarif_heure).toLocaleString()} MAD/h</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Durée */}
      {matiere && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Durée de la séance
          </label>
          <div className="flex items-center gap-3 bg-ink-700 rounded-xl px-4 py-3">
            <button type="button"
              onClick={() => setDureeHeures(h => Math.max(0.5, h - 0.5))}
              className="w-8 h-8 rounded-lg bg-ink-600 hover:bg-ink-500 text-white font-bold text-lg flex items-center justify-center transition-all">
              −
            </button>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-white">{dureeHeures}h</p>
              <p className="text-xs text-slate-500">
                {dureeHeures === 1 ? '1 heure' : `${dureeHeures} heures`}
              </p>
            </div>
            <button type="button"
              onClick={() => setDureeHeures(h => Math.min(8, h + 0.5))}
              className="w-8 h-8 rounded-lg bg-ink-600 hover:bg-ink-500 text-white font-bold text-lg flex items-center justify-center transition-all">
              +
            </button>
          </div>
        </div>
      )}

      {/* Boutons */}
      <div className="flex gap-3 justify-end pt-1 border-t border-ink-700">
        <button type="button" onClick={() => setEtape('CHOIX_TUTEUR')}
          className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-all">
          ← Retour
        </button>
        <button type="button"
          disabled={!matiere || tarifs.length === 0}
          onClick={() => setEtape('RECAPITULATIF')}
          className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          Continuer →
        </button>
      </div>
    </div>
  )

  // ── Étape 3 : Récapitulatif avant paiement ────────────────────────────────
  const renderRecapitulatif = () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">Vérifiez les détails avant de procéder au paiement :</p>

      {/* Carte récap */}
      <div className="bg-ink-700 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3 pb-3 border-b border-ink-600">
          <div className="w-10 h-10 rounded-full bg-violet-600/30 flex items-center justify-center text-sm font-bold text-violet-300">
            {tuteur.prenom?.[0]}{tuteur.nom?.[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{tuteur.prenom} {tuteur.nom}</p>
            <p className="text-xs text-slate-500">Tuteur — {matiere}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Matière</span>
            <span className="text-white font-medium">{matiere}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Durée</span>
            <span className="text-white font-medium">{dureeHeures}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tarif horaire</span>
            <span className="text-white font-medium">{Number(tarifSelectionne?.tarif_heure).toLocaleString()} MAD/h</span>
          </div>
          <div className="h-px bg-ink-600 my-1" />
          <div className="flex justify-between">
            <span className="text-slate-400">Sous-total</span>
            <span className="text-white">{montant.toLocaleString()} MAD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Commission plateforme (10%)</span>
            <span className="text-rose-400">- {commission.toLocaleString()} MAD</span>
          </div>
          <div className="h-px bg-ink-600 my-1" />
          <div className="flex justify-between text-base font-bold">
            <span className="text-slate-200">Total à payer</span>
            <span className="text-violet-400">{montant.toLocaleString()} MAD</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Le tuteur recevra</span>
            <span className="text-emerald-400">{montantTuteur.toLocaleString()} MAD</span>
          </div>
        </div>
      </div>

      {/* Warning si déjà un tuteur */}
      {hasTuteur && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2">
          <span>⚠️</span>
          <p className="text-xs text-amber-400">
            Cette salle a déjà un tuteur. Il sera remplacé dès que le nouveau accepte l'invitation.
          </p>
        </div>
      )}

      {/* Info paiement */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>🔒</span>
        <span>Paiement sécurisé par <strong className="text-slate-400">Chargily Pay</strong> — CIB ou EDAHABIA</span>
      </div>

      {/* Boutons */}
      <div className="flex gap-3 justify-end pt-1 border-t border-ink-700">
        <button type="button" onClick={() => setEtape('CHOIX_SEANCE')}
          className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-all">
          ← Retour
        </button>
        <button type="button"
          disabled={paying}
          onClick={handlePayer}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-50 transition-all">
          {paying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Préparation...
            </>
          ) : (
            <>💳 Payer {montant.toLocaleString()} MAD</>
          )}
        </button>
      </div>
    </div>
  )

  // ── Lancer le paiement ────────────────────────────────────────────────────
  const handlePayer = async () => {
    setPaying(true)
    try {
      // 1. Créer d'abord l'invitation en DB (statut EN_ATTENTE_PAIEMENT)
      const invRes = await API.post('/invitations', {
        salleId,
        destinataireId: tuteur.id,
        typeInvitation: 'VERS_TUTEUR',
      })
      const invitationId = invRes.data.id

      // 2. Initier le paiement Chargily
      const paiRes = await API.post('/paiements/initier', {
        invitationId,
        tuteurId:    tuteur.id,
        matiere,
        dureeHeures,
      })

      // 3. Rediriger vers la page de paiement Chargily
      window.location.href = paiRes.data.checkoutUrl

    } catch (err) {
      onError(err.response?.data?.error || 'Erreur lors de l\'initialisation du paiement')
      setPaying(false)
    }
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-2 mb-3">
        {[
          { id: 'CHOIX_TUTEUR',   label: 'Tuteur' },
          { id: 'CHOIX_SEANCE',   label: 'Séance' },
          { id: 'RECAPITULATIF',  label: 'Paiement' },
        ].map((e, i, arr) => {
          const etapes  = ['CHOIX_TUTEUR', 'CHOIX_SEANCE', 'RECAPITULATIF']
          const current = etapes.indexOf(etape)
          const idx     = etapes.indexOf(e.id)
          const done    = idx < current
          const active  = idx === current
          return (
            <React.Fragment key={e.id}>
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${done   ? 'bg-emerald-500 text-white' :
                    active ? 'bg-violet-600 text-white' :
                             'bg-ink-700 text-slate-500'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium transition-all
                  ${active ? 'text-violet-400' : done ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {e.label}
                </span>
              </div>
              {i < arr.length - 1 && <div className={`flex-1 h-px ${done ? 'bg-emerald-500/40' : 'bg-ink-600'}`} />}
            </React.Fragment>
          )
        })}
      </div>

      {etape === 'CHOIX_TUTEUR'  && renderChoixTuteur()}
      {etape === 'CHOIX_SEANCE'  && renderChoixSeance()}
      {etape === 'RECAPITULATIF' && renderRecapitulatif()}
    </div>
  )
}