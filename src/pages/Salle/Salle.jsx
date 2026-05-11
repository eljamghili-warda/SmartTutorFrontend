import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sallesAPI, seancesAPI, tuteursAPI, invitationsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { getSocket, joinSalle, leaveSalle, sendMessage, startCall, endCall, joinCall, toggleMute, sendOffer, sendAnswer, sendIce } from '../../services/socket'
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
  const [incomingCall, setIncomingCall] = useState(null) // { sessionId, initiateur: {prenom, nom} }
const [ready, setReady] = useState(false)
  // Garder userRef synchronisé pour les callbacks WebRTC
  React.useEffect(() => { userRef.current = user }, [user])

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

  // Refs WebRTC - Map userId → RTCPeerConnection pour multi-participants
  const peersRef   = React.useRef({})   // { userId: RTCPeerConnection }
  const streamRef  = React.useRef(null) // LocalStream
  const sessionRef = React.useRef(null) // sessionId courant
  const userRef    = React.useRef(null) // user courant (stable dans les callbacks)

  // Obtenir ou créer le stream local (micro)
  const getLocalStream = async () => {
    if (streamRef.current) return streamRef.current
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    streamRef.current = stream
    return stream
  }

  // Créer une RTCPeerConnection vers un pair spécifique
  const createPeerConnection = (targetUserId, sessionId) => {
    if (peersRef.current[targetUserId]) {
      peersRef.current[targetUserId].close()
    }
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]
    })

    // Envoyer les ICE candidates au bon pair
    pc.onicecandidate = (e) => {
      if (e.candidate) sendIce(targetUserId, e.candidate)
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce()
      }
    }

    // Audio distant → créer un élément audio par pair
    pc.ontrack = (e) => {
      const audioId = `remote-audio-${targetUserId}`
      let audio = document.getElementById(audioId)
      if (!audio) {
        audio = document.createElement('audio')
        audio.id = audioId
        audio.autoplay = true
        audio.setAttribute('playsinline', '')
        document.body.appendChild(audio)
      }
      audio.srcObject = e.streams[0]
    }

    peersRef.current[targetUserId] = pc
    return pc
  }

  // Démarrer un appel vers un pair (envoyer l'offer)
  const callPeer = async (targetUserId, sessionId) => {
    try {
      const stream = await getLocalStream()
      const pc = createPeerConnection(targetUserId, sessionId)
      stream.getTracks().forEach(t => pc.addTrack(t, stream))
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendOffer(targetUserId, offer, sessionId)
    } catch (err) {
      console.error('callPeer error:', err)
    }
  }

  const stopCall = () => {
    // Fermer toutes les connexions peer
    Object.values(peersRef.current).forEach(pc => pc.close())
    peersRef.current = {}
    // Arrêter le micro
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    sessionRef.current = null
    // Supprimer tous les éléments audio distants
    document.querySelectorAll('[id^="remote-audio-"]').forEach(el => el.remove())
  }

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    setReady(false)
    joinSalle(id)

    // ── Salle events ──────────────────────────────────────
    const handleJoined = () => { setReady(true) }
    const handleMessage = (msg) => setMessages(prev => [...prev, msg])
    const handleJoin = ({ userId, prenom, nom }) => {
      setParticipants(prev => prev.some(p => p.id === userId) ? prev : [...prev, { id: userId, prenom, nom }])
    }
    const handleLeave = ({ userId }) => setParticipants(prev => prev.filter(p => p.id !== userId))

    socket.on('salle:joined',      handleJoined)
    socket.on('chat:message',      handleMessage)
    socket.on('salle:user-joined', handleJoin)
    socket.on('salle:user-left',   handleLeave)

    // ── Mise à jour statut séance en temps réel (quand appel démarre/se termine)
    const handleSeanceUpdated = ({ seanceId, statut }) => {
      setSeances(prev => prev.map(s => s.id === seanceId ? { ...s, statut } : s))
    }
    socket.on('seance:updated', handleSeanceUpdated)

    // ── Call events ───────────────────────────────────────
    const handleCallStarted = async ({ sessionId, initiateur, initiateurNom }) => {
      const myUserId = userRef.current?.id

      if (String(initiateur) === String(myUserId)) {
        // Je suis l'initiateur → démarrer l'audio et appeler les participants
        setActiveCall(sessionId)
        sessionRef.current = sessionId
        joinCall(id, sessionId)
        try {
          const stream = await getLocalStream()
          // Appeler chaque participant présent dans la salle
          const others = participants.filter(p => String(p.id) !== String(myUserId))
          for (const p of others) {
            await callPeer(p.id, sessionId)
          }
        } catch (err) {
          console.error('getUserMedia error:', err)
          error("Impossible d'accéder au microphone. Vérifiez les permissions.")
        }
      } else {
        // Je ne suis pas l'initiateur → afficher notification incoming call
        setIncomingCall({ sessionId, initiateurNom: initiateurNom || 'Tuteur' })
      }
    }

    // Accepter l'appel entrant
    const handleAcceptCall = async (sessionId) => {
      setIncomingCall(null)
      setActiveCall(sessionId)
      sessionRef.current = sessionId
      joinCall(id, sessionId)
      // Notifier l'initiateur qu'on a rejoint → il nous enverra un offer
      getSocket()?.emit('call:joined', { salleId: id, sessionId, userId: userRef.current?.id })
    }

    // Refuser l'appel entrant
    const handleRefuseCall = (sessionId) => {
      setIncomingCall(null)
      getSocket()?.emit('call:refused', { sessionId, userId: userRef.current?.id })
    }

    // ── NOUVEAU: Appel déjà actif quand on entre dans la salle ───────
    // Envoyé par le serveur uniquement si un appel est en cours
    const handleCallActive = ({ sessionId, initiateurNom }) => {
      // Réutilise exactement le même state que incomingCall → même UI
      setIncomingCall({ sessionId, initiateurNom: initiateurNom || 'Tuteur' })
    }
    socket.on('call:active', handleCallActive)

    // Exposer les handlers pour le JSX (via ref)
    window.__acceptCall  = handleAcceptCall
    window.__refuseCall  = handleRefuseCall

    // Quand quelqu'un rejoint l'appel après son démarrage
    const handleCallUserJoined = async ({ userId }) => {
      if (!sessionRef.current) return
      // L'initiateur appelle le nouvel arrivant
      const myId = userRef.current?.id
      if (String(myId) === String(userId)) return
      if (peersRef.current[userId]) return // déjà connecté
      await callPeer(userId, sessionRef.current)
    }

    const handleOffer = async ({ fromUserId, offer, sessionId }) => {
      try {
        const stream = await getLocalStream()
        const pc = createPeerConnection(fromUserId, sessionId)
        stream.getTracks().forEach(t => pc.addTrack(t, stream))
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendAnswer(fromUserId, answer, sessionId)
      } catch (err) {
        console.error('handle offer error:', err)
      }
    }

    const handleAnswer = async ({ fromUserId, answer }) => {
      try {
        const pc = peersRef.current[fromUserId]
        if (pc && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer))
        }
      } catch (err) { console.error('handle answer error:', err) }
    }

    const handleIce = async ({ fromUserId, candidate }) => {
      try {
        const pc = peersRef.current[fromUserId]
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        }
      } catch (err) { console.error('handle ice error:', err) }
    }

    const handleCallEnded = () => {
      setActiveCall(null)
      stopCall()
    }

    const handleCallYouLeft = () => {
      setActiveCall(null)
      setIncomingCall(null)
      stopCall()
    }

    socket.on('call:started',       handleCallStarted)
    socket.on('call:user-joined',   handleCallUserJoined)
    socket.on('call:offer',         handleOffer)
    socket.on('call:answer',        handleAnswer)
    socket.on('call:ice-candidate', handleIce)
    socket.on('call:ended',         handleCallEnded)
    socket.on('call:you-left',      handleCallYouLeft)

    return () => {
      leaveSalle(id)
      stopCall()
      socket.off('salle:joined',      handleJoined)
      socket.off('chat:message',      handleMessage)
      socket.off('salle:user-joined', handleJoin)
      socket.off('salle:user-left',   handleLeave)
      socket.off('seance:updated',    handleSeanceUpdated)
      socket.off('call:active',       handleCallActive)
      socket.off('call:started',      handleCallStarted)
      socket.off('call:user-joined',  handleCallUserJoined)
      socket.off('call:offer',        handleOffer)
      socket.off('call:answer',       handleAnswer)
      socket.off('call:ice-candidate',handleIce)
      socket.off('call:ended',        handleCallEnded)
      socket.off('call:you-left',     handleCallYouLeft)
    }
  }, [id])

  const handleQuitter = async () => {
    const isAdmin = myRole === 'ADMIN'
    const msg = isAdmin
      ? 'Vous êtes admin. Quitter supprimera définitivement cette salle et toutes ses données. Confirmer ?'
      : 'Quitter cette salle ? Vous devrez demander une nouvelle invitation pour revenir.'
    if (!confirm(msg)) return
    try {
      await sallesAPI.quitter(id)
      navigate('/dashboard')
    } catch (err) {
      error(err.response?.data?.error || 'Erreur')
    }
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
      await seancesAPI.lancer(seanceId)
      setSeances(prev => prev.map(s => s.id === seanceId ? { ...s, statut:'EN_COURS' } : s))
      // Démarre l'appel socket → tous les membres reçoivent 'call:started'
      startCall(id, seanceId)
      success('Séance lancée ! Appel démarré.')
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
              {canCall ? (
                <Btn variant="danger" size="sm" onClick={() => { endCall(id, activeCall); setActiveCall(null); stopCall() }}>
                  📵 Terminer l'appel
                </Btn>
              ) : (
                <Btn variant="secondary" size="sm" onClick={() => {
                  getSocket()?.emit('call:leave', { sessionId: activeCall })
                  setActiveCall(null); stopCall()
                }}>
                  🚪 Quitter l'appel
                </Btn>
              )}
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
                  {s.statut === 'PLANIFIEE' && (
                    <p className="text-xs text-slate-600 mt-0.5">📞 Démarre automatiquement à l'appel</p>
                  )}
                  {s.statut === 'EN_COURS' && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-xs text-emerald-400">En cours</p>
                    </div>
                  )}
                </div>
              ))}
              {seances.length === 0 && <p className="text-xs text-slate-600 text-center py-4">Aucune séance planifiée</p>}
            </div>
          )}
        </div>
      </div>

      {/* ── Notification appel entrant ─────────────────────────────────── */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-ink-800 border border-ink-600 rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl max-w-sm w-full mx-4 animate-slide-up">
            {/* Avatar animé */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-violet-600/20 border-2 border-violet-500 flex items-center justify-center text-3xl">
                👨‍🏫
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-ink-800 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-1">Appel entrant</p>
              <p className="font-display font-bold text-white text-lg">{incomingCall.initiateurNom}</p>
              <p className="text-sm text-slate-500 mt-1">vous invite à rejoindre l'appel</p>
            </div>
            {/* Boutons accepter / refuser */}
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => window.__refuseCall(incomingCall.sessionId)}
                className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 text-2xl flex items-center justify-center hover:bg-rose-500/40 transition-all active:scale-95">
                📵
              </button>
              <button
                onClick={() => window.__acceptCall(incomingCall.sessionId)}
                className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 text-2xl flex items-center justify-center hover:bg-emerald-500/40 transition-all active:scale-95">
                📞
              </button>
            </div>
            <p className="text-xs text-slate-600">
              <span className="text-rose-400">📵 Refuser</span>
              {' '}·{' '}
              <span className="text-emerald-400">📞 Accepter</span>
            </p>
          </div>
        </div>
      )}

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