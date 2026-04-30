import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sallesAPI, seancesAPI, tuteursAPI, invitationsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { getSocket, joinSalle, leaveSalle, sendMessage, startCall, endCall, joinCall, toggleMute } from '../../services/socket'
import Chat from '../../components/Chat/Chat'
import Whiteboard from '../../components/Whiteboard/Whiteboard'
import { Avatar, Badge, Btn, Spinner, Modal, FormGroup, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

// ─── Composant modal: inviter un tuteur ───────────────────────────────────────
function InviteTuteurModal({ salleId, hasTuteur, onClose, onSuccess, onError }) {
  const [tuteurs, setTuteurs]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState('')
  const [sending, setSending]     = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    tuteursAPI.getAll().then(({ data }) => setTuteurs(data)).finally(() => setLoading(false))
  }, [])

  const doSend = async () => {
    setSending(true)
    try {
      await invitationsAPI.send({ salleId, destinataireId: Number(selected), typeInvitation: 'VERS_TUTEUR' })
      onSuccess('Invitation envoyée au tuteur !')
      onClose()
    } catch (err) {
      onError(err.response?.data?.error || "Erreur lors de l'envoi")
    } finally { setSending(false) }
  }

  const handleSend = () => {
    if (!selected) return onError('Choisissez un tuteur')
    if (hasTuteur && !confirmed) { setConfirmed(true); return }
    doSend()
  }

  if (confirmed) return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 flex gap-3">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-amber-400 mb-1">Cette salle a déjà un tuteur</p>
          <p className="text-sm text-slate-400">L'ancien tuteur sera retiré dès que le nouveau accepte. Confirmer ?</p>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <Btn variant="secondary" onClick={() => setConfirmed(false)}>← Retour</Btn>
        <Btn onClick={doSend} disabled={sending}>{sending ? 'Envoi...' : '✅ Confirmer'}</Btn>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {hasTuteur && (
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-3 flex gap-2 items-center">
          <span>⚠️</span>
          <p className="text-xs text-amber-400">Cette salle a déjà un tuteur. Le sélectionner le remplacera.</p>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-4"><span className="text-slate-400 text-sm">Chargement...</span></div>
      ) : tuteurs.length === 0 ? (
        <p className="text-sm text-slate-500 bg-ink-700 rounded-xl p-3 text-center">Aucun tuteur disponible.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {tuteurs.map(t => (
            <button key={t.id} type="button" onClick={() => setSelected(String(t.id))}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${selected === String(t.id) ? 'border-violet-500 bg-violet-600/10' : 'border-ink-600 hover:border-ink-500'}`}>
              <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center text-sm font-bold text-violet-400 flex-shrink-0">
                {t.prenom?.[0]}{t.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{t.prenom} {t.nom}</p>
                {t.specialites?.length > 0 && <p className="text-xs text-slate-500 truncate">{t.specialites.slice(0,3).join(', ')}</p>}
              </div>
              {selected === String(t.id) && <span className="text-violet-400">✓</span>}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-3 justify-end pt-1 border-t border-ink-700">
        <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        <Btn onClick={handleSend} disabled={!selected || sending}>
          {sending ? 'Envoi...' : hasTuteur ? '🔄 Remplacer le tuteur' : "✉️ Envoyer l'invitation"}
        </Btn>
      </div>
    </div>
  )
}


export default function Salle() {
  const { id }        = useParams()
  const { user }      = useAuth()
  const navigate      = useNavigate()
  const { toasts, success, error } = useToast()

  const [salle,       setSalle]       = useState(null)
  const [participants,setParticipants]= useState([])
  const [messages,    setMessages]    = useState([])
  const [fichiers,    setFichiers]    = useState([])
  const [seances,     setSeances]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [myRole,      setMyRole]      = useState(null)
  const [rightTab,    setRightTab]    = useState('participants')
  const [activeCall,  setActiveCall]  = useState(null)
  const [isMuted,     setIsMuted]     = useState(false)
  const [showPlan,    setShowPlan]    = useState(false)
  const [planForm,    setPlanForm]    = useState({ titre:'', matiere:'', dateDebut:'', duree:60 })
  const [showInviteTuteur, setShowInviteTuteur] = useState(false)
  const [tuteurs,     setTuteurs]     = useState([])
  const [selectedTuteur, setSelectedTuteur] = useState('')
const [ready, setReady] = useState(false)
  useEffect(() => {
    const load = async () => {
      try {
        const [sr, mr, fr, seR] = await Promise.all([
          sallesAPI.getById(id),
          sallesAPI.getMessages(id),
          sallesAPI.getFichiers(id),
          seancesAPI.getAll({ salleId: id }),
        ])
        setSalle(sr.data); setMyRole(sr.data.mon_role)
        setParticipants(sr.data.participants || [])
        setMessages(mr.data); setFichiers(fr.data); setSeances(seR.data)
      } catch { navigate('/dashboard') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  useEffect(() => {
  const socket = getSocket()
  if (!socket) return

  setReady(false)

  joinSalle(id)

  const handleJoined = () => {
    console.log("✅ Joined room confirmed")
    setReady(true)
  }

  socket.on('salle:joined', handleJoined)

  const handleMessage = (msg) => {
    setMessages(prev => [...prev, msg])
  }

  socket.on('chat:message', handleMessage)

  const handleJoin = ({ userId, prenom, nom }) => {
    setParticipants(prev =>
      prev.some(p => p.id === userId)
        ? prev
        : [...prev, { id: userId, prenom, nom }]
    )
  }

  socket.on('salle:user-joined', handleJoin)

  const handleLeave = ({ userId }) => {
    setParticipants(prev => prev.filter(p => p.id !== userId))
  }

  socket.on('salle:user-left', handleLeave)

  return () => {
    leaveSalle(id)

    socket.off('salle:joined', handleJoined)
    socket.off('chat:message', handleMessage)
    socket.off('salle:user-joined', handleJoin)
    socket.off('salle:user-left', handleLeave)
  }
}, [id])

  const handleQuitter = async () => {
    if (!confirm('Quitter la salle ?')) return
    await sallesAPI.quitter(id)
    navigate('/dashboard')
  }

  const uploadFichier = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const fd = new FormData(); fd.append('fichier', file)
    try {
      const { data } = await sallesAPI.uploadFichier(id, fd)
      setFichiers(prev => [data, ...prev])
      success('Fichier uploadé !')
    } catch { error('Erreur upload') }
  }

  const handlePlanifier = async (e) => {
    e.preventDefault()
    try {
      const { data } = await seancesAPI.create({ ...planForm, salleId: id })
      setSeances(prev => [...prev, data])
      setShowPlan(false)
      success('Séance planifiée !')
      // Envoyer message automatique dans le chat
      const dateStr = new Date(planForm.dateDebut).toLocaleString('fr-FR', {
        weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit'
      })
      sendMessage(id, `📅 Séance planifiée : ${planForm.titre} le ${dateStr} (${planForm.duree} min).`)
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleLancer = async (seanceId) => {
    try {
      const { data } = await seancesAPI.lancer(seanceId)
      setSeances(prev => prev.map(s => s.id === seanceId ? { ...s, statut:'EN_COURS' } : s))
      startCall(id, seanceId)
      success('Séance lancée !')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleTerminer = async (seanceId) => {
    try {
      await seancesAPI.terminer(seanceId)
      setSeances(prev => prev.map(s => s.id === seanceId ? { ...s, statut:'REALISEE' } : s))
      if (activeCall) { endCall(id, activeCall); setActiveCall(null) }
      success('Séance terminée.')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }
const handleSend = (text) => {
  const socket = getSocket()

  if (!socket) {
    console.log("❌ socket not ready yet")
    return
  }

  console.log("📤 sending:", text)
  sendMessage(id, text)
}
  const isTuteur  = user?.role === 'tuteur' && myRole === 'CO_ADMIN'
  const isAdmin   = myRole === 'ADMIN'
  const hasTuteur = salle?.statut === 'ACTIVE_AVEC_TUTEUR'
  // Admin peut appeler uniquement si pas de tuteur dans la salle
  // Le tuteur peut toujours appeler
  const canCall   = isTuteur || (isAdmin && !hasTuteur)

  const statutBadge = {
    PLANIFIEE: 'warning', EN_COURS: 'primary', REALISEE: 'success', ANNULEE: 'danger'
  }

  if (loading) return (
    <div className="h-screen bg-ink-950 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-ink-950 overflow-hidden">
      <ToastContainer toasts={toasts} />

      {/* Top bar */}
      <div className="h-12 flex-shrink-0 flex items-center justify-between px-4 bg-ink-900 border-b border-ink-700">
        <div className="flex items-center gap-3 overflow-hidden">
          <Btn variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>← Retour</Btn>
          <div className="w-px h-5 bg-ink-700" />
          <h2 className="font-display font-bold text-white text-sm truncate">{salle?.nom}</h2>
          {salle?.matiere && <span className="text-xs text-violet-400 hidden sm:block">📖 {salle.matiere}</span>}
          <Badge variant={salle?.statut === 'ACTIVE_AVEC_TUTEUR' ? 'primary' : 'default'}>
            {salle?.statut === 'ACTIVE_AVEC_TUTEUR' ? '👨‍🏫 Avec tuteur' : '📚 Sans tuteur'}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {activeCall ? (
            <>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Appel en cours</span>
              </div>
              <Btn variant="secondary" size="sm" onClick={() => { setIsMuted(m => { toggleMute(activeCall, !m); return !m }) }}>
                {isMuted ? '🔇' : '🎙️'}
              </Btn>
              <Btn variant="danger" size="sm" onClick={() => { endCall(id, activeCall); setActiveCall(null) }}>📵 Terminer</Btn>
            </>
          ) : (
            canCall && <Btn variant="success" size="sm" onClick={() => startCall(id, null)}>📞 Appel</Btn>
          )}
          <Btn variant="secondary" size="sm" onClick={handleQuitter}>🚪 Quitter</Btn>
        </div>
      </div>

      {/* Body: 3 columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat */}
        <div className="w-64 flex-shrink-0 border-r border-ink-700 flex flex-col">
          <Chat messages={messages} onSend={(c) => sendMessage(id, c)} currentUser={user} />
        </div>

        {/* Center: Whiteboard */}
        <div className="flex-1 overflow-hidden">
          <Whiteboard salleId={id} isTuteur={isTuteur} />
        </div>

        {/* Right: Tabs panel */}
        <div className="w-60 flex-shrink-0 border-l border-ink-700 flex flex-col bg-ink-900">
          {/* Tab headers */}
          <div className="flex border-b border-ink-700 flex-shrink-0">
            {[
              { id:'participants', icon:'👥', label:`${participants.length}` },
              { id:'fichiers',     icon:'📁', label:`${fichiers.length}` },
              { id:'seances',      icon:'📅', label:`${seances.length}` },
            ].map(t => (
              <button key={t.id} onClick={() => setRightTab(t.id)}
                className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-xs transition-all border-b-2
                  ${rightTab === t.id ? 'border-violet-500 text-violet-400 bg-violet-600/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <span className="text-base">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Participants */}
          {rightTab === 'participants' && (
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
              {/* Bouton inviter tuteur — visible uniquement pour l'admin */}
              {isAdmin && (
                <Btn size="sm" variant="secondary" className="w-full justify-center mb-1"
                  onClick={() => setShowInviteTuteur(true)}>
                  ➕ Inviter un tuteur
                </Btn>
              )}
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-ink-800 transition-colors">
                  <Avatar user={p} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {p.prenom} {p.nom} {p.id === user?.id && <span className="text-violet-400">(vous)</span>}
                    </p>
                    <p className="text-xs text-slate-600 capitalize">{p.role_salle?.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fichiers */}
          {rightTab === 'fichiers' && (
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
              <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-ink-600 text-xs text-slate-500 hover:border-violet-500/50 hover:text-violet-400 transition-all cursor-pointer">
                ⬆️ Uploader un fichier
                <input type="file" className="hidden" onChange={uploadFichier} />
              </label>
              {fichiers.map(f => (
                <div key={f.id} className="flex items-center gap-2 px-2 py-2 rounded-xl bg-ink-800 border border-ink-700">
                  <span className="text-base">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 truncate font-medium">{f.nom_fichier}</p>
                    <p className="text-xs text-slate-600">{f.uploader_nom}</p>
                  </div>
                  <a href={`http://localhost:5000/${f.url_telechargement}`} download
                    className="text-xs px-1.5 py-1 rounded-lg bg-ink-700 text-violet-400 hover:bg-violet-600/20 transition-colors flex-shrink-0">⬇</a>
                </div>
              ))}
              {fichiers.length === 0 && <p className="text-xs text-slate-600 text-center py-4">Aucun fichier partagé</p>}
            </div>
          )}

          {/* Séances */}
          {rightTab === 'seances' && (
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
              {isTuteur && (
                <Btn size="sm" onClick={() => setShowPlan(true)} className="w-full justify-center">➕ Planifier</Btn>
              )}
              {seances.map(s => (
                <div key={s.id} className="rounded-xl bg-ink-800 border border-ink-700 p-3 flex flex-col gap-1.5">
                  <p className="text-xs font-bold text-slate-200 leading-tight">{s.titre}</p>
                  <p className="text-xs text-slate-500">{new Date(s.date_debut).toLocaleString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                  <p className="text-xs text-slate-500">⏱ {s.duree} min</p>
                  <Badge variant={statutBadge[s.statut] || 'default'}>{s.statut}</Badge>
                  {isTuteur && s.statut === 'PLANIFIEE' && (
                    <Btn size="sm" variant="success" onClick={() => handleLancer(s.id)} className="justify-center mt-1">▶ Lancer</Btn>
                  )}
                  {isTuteur && s.statut === 'EN_COURS' && (
                    <Btn size="sm" variant="danger" onClick={() => handleTerminer(s.id)} className="justify-center mt-1">⏹ Terminer</Btn>
                  )}
                </div>
              ))}
              {seances.length === 0 && <p className="text-xs text-slate-600 text-center py-4">Aucune séance planifiée</p>}
            </div>
          )}
        </div>
      </div>

      {/* Modal planifier séance */}
      <Modal open={showPlan} onClose={() => setShowPlan(false)} title="📅 Planifier une séance">
        <form onSubmit={handlePlanifier} className="flex flex-col gap-4">
          <FormGroup label="Titre *">
            <input required value={planForm.titre} onChange={e => setPlanForm(f => ({ ...f, titre: e.target.value }))} placeholder="ex: Cours d'Algèbre" />
          </FormGroup>
          <FormGroup label="Matière">
            <input value={planForm.matiere} onChange={e => setPlanForm(f => ({ ...f, matiere: e.target.value }))} placeholder="ex: Mathématiques" />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Date et heure *">
              <input type="datetime-local" required value={planForm.dateDebut} onChange={e => setPlanForm(f => ({ ...f, dateDebut: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Durée (min)">
              <input type="number" min={15} max={480} value={planForm.duree} onChange={e => setPlanForm(f => ({ ...f, duree: Number(e.target.value) }))} />
            </FormGroup>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <Btn variant="secondary" onClick={() => setShowPlan(false)}>Annuler</Btn>
            <Btn type="submit">Planifier</Btn>
          </div>
        </form>
      </Modal>

      {/* Modal inviter un tuteur */}
      <Modal open={showInviteTuteur} onClose={() => { setShowInviteTuteur(false); setSelectedTuteur('') }}
        title="👨‍🏫 Inviter un tuteur dans la salle">
        <InviteTuteurModal
          salleId={id}
          hasTuteur={hasTuteur}
          onClose={() => { setShowInviteTuteur(false); setSelectedTuteur('') }}
          onSuccess={(msg) => success(msg)}
          onError={(msg) => error(msg)}
        />
      </Modal>
    </div>
  )
}