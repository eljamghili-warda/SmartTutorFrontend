import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sallesAPI, seancesAPI, tuteursAPI, invitationsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { getSocket, joinSalle, leaveSalle, sendMessage, startCall, endCall, joinCall, toggleMute, sendOffer, sendAnswer, sendIce } from '../../services/socket'
import Chat from '../../components/Chat/Chat'
import Whiteboard from '../../components/Whiteboard/Whiteboard'
import { Avatar, Badge, Btn, Spinner, Modal, FormGroup, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

// ─── Hook: timer d'appel ──────────────────────────────────────────────────────
function useCallTimer(active) {
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (active) {
      setSeconds(0)
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
      setSeconds(0)
    }
    return () => clearInterval(intervalRef.current)
  }, [active])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// ─── Composant: panneau d'appel actif (style Zoom/WhatsApp) ──────────────────
function CallPanel({ callParticipants, isMuted, onToggleMute, onEnd, onLeave, canEnd, callTime }) {
  return (
    <div className="fixed bottom-4 right-4 z-40 bg-ink-800 border border-emerald-500/30 rounded-2xl shadow-2xl p-4 w-72 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Appel en cours</span>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-ink-700 px-2 py-0.5 rounded-lg">{callTime}</span>
      </div>

      {/* Participants dans l'appel */}
      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
        {callParticipants.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-2">En attente de participants…</p>
        ) : (
          callParticipants.map(p => (
            <div key={p.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-ink-700">
              <div className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
                {p.prenom?.[0]?.toUpperCase()}{p.nom?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {p.prenom} {p.nom}
                  {p.isMe && <span className="text-violet-400 ml-1">(vous)</span>}
                </p>
              </div>
              {/* Indicateur micro */}
              <span className="text-xs flex-shrink-0">
                {p.muted ? '🔇' : '🎙️'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Contrôles */}
      <div className="flex items-center gap-2 pt-1 border-t border-ink-600">
        {/* Mute */}
        <button
          onClick={onToggleMute}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all
            ${isMuted
              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
              : 'bg-ink-700 border border-ink-600 text-slate-300 hover:bg-ink-600'
            }`}>
          {isMuted ? '🔇 Micro coupé' : '🎙️ Micro actif'}
        </button>

        {/* Terminer / Quitter */}
        {canEnd ? (
          <button
            onClick={onEnd}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 transition-all">
            📵 Terminer
          </button>
        ) : (
          <button
            onClick={onLeave}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-ink-700 border border-ink-600 text-slate-300 hover:bg-ink-600 transition-all">
            🚪 Quitter
          </button>
        )}
      </div>
    </div>
  )
}

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

  const [salle,            setSalle]           = useState(null)
  const [participants,     setParticipants]    = useState([])
  const [messages,         setMessages]        = useState([])
  const [fichiers,         setFichiers]        = useState([])
  const [seances,          setSeances]         = useState([])
  const [loading,          setLoading]         = useState(true)
  const [myRole,           setMyRole]          = useState(null)
  const [rightTab,         setRightTab]        = useState('participants')
  const [activeCall,       setActiveCall]      = useState(null)   // sessionId | null
  const [callParticipants, setCallParticipants]= useState([])     // [{ id, prenom, nom, muted, isMe }]
  const [isMuted,          setIsMuted]         = useState(false)
  const [showPlan,         setShowPlan]        = useState(false)
  const [planForm,         setPlanForm]        = useState({ titre:'', matiere:'', dateDebut:'', duree:60 })
  const [showInviteTuteur, setShowInviteTuteur]= useState(false)
  const [selectedTuteur,   setSelectedTuteur]  = useState('')
  const [incomingCall,     setIncomingCall]    = useState(null)   // { sessionId, initiateurNom }

  const callTime = useCallTimer(!!activeCall)

  // ── Refs stables ──────────────────────────────────────────────────────────
  const peersRef        = useRef({})
  const streamRef       = useRef(null)
  const sessionRef      = useRef(null)
  const userRef         = useRef(null)
  const participantsRef = useRef([])
  const activeCallRef   = useRef(null)
  const acceptCallRef   = useRef(null)
  const refuseCallRef   = useRef(null)

  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { participantsRef.current = participants }, [participants])
  useEffect(() => { activeCallRef.current = activeCall }, [activeCall])

  // ── Chargement initial ────────────────────────────────────────────────────
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

  // ── WebRTC helpers ────────────────────────────────────────────────────────
  const getLocalStream = async () => {
    if (streamRef.current && streamRef.current.active) return streamRef.current
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    streamRef.current = stream
    return stream
  }

  const createPeerConnection = (targetUserId) => {
    if (peersRef.current[targetUserId]) {
      peersRef.current[targetUserId].close()
      delete peersRef.current[targetUserId]
    }
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]
    })
    pc.onicecandidate = (e) => { if (e.candidate) sendIce(targetUserId, e.candidate) }
    pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState === 'failed') pc.restartIce() }
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

  const callPeer = async (targetUserId, sessionId) => {
    try {
      const stream = await getLocalStream()
      const pc = createPeerConnection(targetUserId)
      stream.getTracks().forEach(t => pc.addTrack(t, stream))
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendOffer(targetUserId, offer, sessionId)
    } catch (err) { console.error('callPeer error:', err) }
  }

  const stopCall = useCallback(() => {
    Object.values(peersRef.current).forEach(pc => { try { pc.close() } catch (_) {} })
    peersRef.current = {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    sessionRef.current = null
    setCallParticipants([])
    document.querySelectorAll('[id^="remote-audio-"]').forEach(el => el.remove())
  }, [])

  // ── Helper: ajouter un participant à l'appel ──────────────────────────────
  const addToCallParticipants = useCallback((userId, muted = false) => {
    const allParticipants = participantsRef.current
    const p = allParticipants.find(p => String(p.id) === String(userId))
    if (!p) return
    const isMe = String(userId) === String(userRef.current?.id)
    setCallParticipants(prev => {
      if (prev.some(x => String(x.id) === String(userId))) return prev
      return [...prev, { id: userId, prenom: p.prenom, nom: p.nom, muted, isMe }]
    })
  }, [])

  // ── Socket events ─────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    joinSalle(id)

    const handleMessage       = (msg) => setMessages(prev => [...prev, msg])
    const handleJoin = ({ userId, prenom, nom }) => {
      setParticipants(prev => prev.some(p => p.id === userId) ? prev : [...prev, { id: userId, prenom, nom }])
    }
    const handleLeave = ({ userId }) => {
      setParticipants(prev => prev.filter(p => p.id !== userId))
      // Retirer aussi de l'appel si présent
      setCallParticipants(prev => prev.filter(p => String(p.id) !== String(userId)))
    }
    const handleSeanceUpdated = ({ seanceId, statut }) => {
      setSeances(prev => prev.map(s => s.id === seanceId ? { ...s, statut } : s))
    }

    socket.on('chat:message',      handleMessage)
    socket.on('salle:user-joined', handleJoin)
    socket.on('salle:user-left',   handleLeave)
    socket.on('seance:updated',    handleSeanceUpdated)

    // Appel déjà actif à l'entrée dans la salle
    const handleCallActive = ({ sessionId, initiateurNom }) => {
      if (!sessionRef.current) {
        setIncomingCall({ sessionId, initiateurNom: initiateurNom || 'Tuteur' })
      }
    }
    socket.on('call:active', handleCallActive)

    // Appel démarré — l'initiateur s'ajoute à callParticipants, les autres voient la fiche
    const handleCallStarted = ({ sessionId, initiateur, initiateurNom }) => {
      const myUserId = userRef.current?.id
      const isInitiateur = myUserId != null && String(initiateur) === String(myUserId)

      if (isInitiateur) {
        setActiveCall(sessionId)
        sessionRef.current = sessionId
        joinCall(id, sessionId)
        // Ajouter l'initiateur à callParticipants (après que participantsRef soit à jour)
        setTimeout(() => addToCallParticipants(myUserId, false), 100)
        getLocalStream().catch(err => {
          console.error('getUserMedia error:', err)
          error("Impossible d'accéder au microphone. Vérifiez les permissions.")
        })
      } else {
        if (!sessionRef.current) {
          setIncomingCall({ sessionId, initiateurNom: initiateurNom || 'Tuteur' })
        }
      }
    }

    // Un participant a accepté → l'initiateur lui envoie un offer + l'ajoute à la liste
    const handleCallUserJoined = async ({ userId }) => {
      if (!sessionRef.current) return
      const myId = userRef.current?.id
      if (!myId || String(myId) === String(userId)) return
      if (!activeCallRef.current) return

      // Ajouter à la liste visuelle
      addToCallParticipants(userId, false)

      if (peersRef.current[userId]) return
      await callPeer(userId, sessionRef.current)
    }

    // Recevoir un offer WebRTC
    const handleOffer = async ({ fromUserId, offer, sessionId }) => {
      try {
        const stream = await getLocalStream()
        const pc = createPeerConnection(fromUserId)
        stream.getTracks().forEach(t => pc.addTrack(t, stream))
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendAnswer(fromUserId, answer, sessionId)
      } catch (err) { console.error('handle offer error:', err) }
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
        if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) { console.error('handle ice error:', err) }
    }

    // Quelqu'un a coupé/activé son micro
    const handleUserMuted = ({ userId, muted }) => {
      setCallParticipants(prev => prev.map(p =>
        String(p.id) === String(userId) ? { ...p, muted } : p
      ))
    }

    // Un participant quitte l'appel (pas toute la salle)
    const handleUserDisconnected = ({ userId }) => {
      setCallParticipants(prev => prev.filter(p => String(p.id) !== String(userId)))
    }

    const handleCallEnded = () => {
      setActiveCall(null)
      setIncomingCall(null)
      stopCall()
    }

    const handleCallYouLeft = () => {
      setActiveCall(null)
      setIncomingCall(null)
      stopCall()
    }

    socket.on('call:started',           handleCallStarted)
    socket.on('call:user-joined',       handleCallUserJoined)
    socket.on('call:offer',             handleOffer)
    socket.on('call:answer',            handleAnswer)
    socket.on('call:ice-candidate',     handleIce)
    socket.on('call:user-muted',        handleUserMuted)
    socket.on('call:user-disconnected', handleUserDisconnected)
    socket.on('call:ended',             handleCallEnded)
    socket.on('call:you-left',          handleCallYouLeft)

    // Handlers accepter/refuser via refs (évite les stale closures)
    acceptCallRef.current = async (sessionId) => {
      setIncomingCall(null)
      setActiveCall(sessionId)
      sessionRef.current = sessionId
      joinCall(id, sessionId)
      // S'ajouter soi-même à callParticipants
      const myId = userRef.current?.id
      if (myId) setTimeout(() => addToCallParticipants(myId, false), 100)
      getSocket()?.emit('call:joined', { salleId: id, sessionId, userId: userRef.current?.id })
    }

    refuseCallRef.current = (sessionId) => {
      setIncomingCall(null)
      getSocket()?.emit('call:refused', { sessionId, userId: userRef.current?.id })
    }

    return () => {
      leaveSalle(id)
      stopCall()
      socket.off('chat:message',           handleMessage)
      socket.off('salle:user-joined',      handleJoin)
      socket.off('salle:user-left',        handleLeave)
      socket.off('seance:updated',         handleSeanceUpdated)
      socket.off('call:active',            handleCallActive)
      socket.off('call:started',           handleCallStarted)
      socket.off('call:user-joined',       handleCallUserJoined)
      socket.off('call:offer',             handleOffer)
      socket.off('call:answer',            handleAnswer)
      socket.off('call:ice-candidate',     handleIce)
      socket.off('call:user-muted',        handleUserMuted)
      socket.off('call:user-disconnected', handleUserDisconnected)
      socket.off('call:ended',             handleCallEnded)
      socket.off('call:you-left',          handleCallYouLeft)
    }
  }, [id, stopCall, addToCallParticipants])

  // ── Handlers UI ───────────────────────────────────────────────────────────
  const handleQuitter = async () => {
    const isAdmin = myRole === 'ADMIN'
    const msg = isAdmin
      ? 'Vous êtes admin. Quitter supprimera définitivement cette salle et toutes ses données. Confirmer ?'
      : 'Quitter cette salle ? Vous devrez demander une nouvelle invitation pour revenir.'
    if (!confirm(msg)) return
    try {
      await sallesAPI.quitter(id)
      navigate('/dashboard')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
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
      const dateStr = new Date(planForm.dateDebut).toLocaleString('fr-FR', {
        weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit'
      })
      sendMessage(id, `📅 Séance planifiée : ${planForm.titre} le ${dateStr} (${planForm.duree} min).`)
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  // Annuler une séance planifiée (tuteur uniquement)
  const handleAnnulerSeance = async (seanceId) => {
    if (!confirm('Annuler cette séance ? Cette action est irréversible.')) return
    try {
      await seancesAPI.annuler(seanceId)
      setSeances(prev => prev.map(s => s.id === seanceId ? { ...s, statut: 'ANNULEE' } : s))
      success('Séance annulée.')
      sendMessage(id, `❌ Séance annulée par le tuteur.`)
    } catch (err) { error(err.response?.data?.error || 'Erreur lors de l\'annulation') }
  }

  const handleToggleMute = () => {
    setIsMuted(m => {
      const newMuted = !m
      toggleMute(activeCall, newMuted)
      // Mettre à jour son propre état dans callParticipants
      const myId = userRef.current?.id
      if (myId) {
        setCallParticipants(prev => prev.map(p =>
          String(p.id) === String(myId) ? { ...p, muted: newMuted } : p
        ))
      }
      return newMuted
    })
  }

  const handleEndCall = () => {
    endCall(id, activeCall)
    setActiveCall(null)
    stopCall()
  }

  const handleLeaveCall = () => {
    getSocket()?.emit('call:leave', { sessionId: activeCall })
    setActiveCall(null)
    stopCall()
  }

  // ── Rôles ─────────────────────────────────────────────────────────────────
  const isTuteur  = user?.role === 'tuteur' && myRole === 'CO_ADMIN'
  const isAdmin   = myRole === 'ADMIN'
  const hasTuteur = salle?.statut === 'ACTIVE_AVEC_TUTEUR'
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

      {/* ── Panneau d'appel flottant (style Zoom/WhatsApp) ─────────────── */}
      {activeCall && (
        <CallPanel
          callParticipants={callParticipants}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onEnd={handleEndCall}
          onLeave={handleLeaveCall}
          canEnd={canCall}
          callTime={callTime}
        />
      )}

      {/* Top bar — sans le badge "Appel en cours" (remplacé par le panneau flottant) */}
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
          {/* Bouton Appel libre — visible uniquement si pas d'appel en cours */}
          {!activeCall && canCall && (
            <Btn variant="success" size="sm" onClick={() => startCall(id, null)}>
              📞 Appel
            </Btn>
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
              {isAdmin && (
                <Btn size="sm" variant="secondary" className="w-full justify-center mb-1"
                  onClick={() => setShowInviteTuteur(true)}>
                  ➕ Inviter un tuteur
                </Btn>
              )}
              {participants.map(p => {
                const inCall = callParticipants.some(cp => String(cp.id) === String(p.id))
                return (
                  <div key={p.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-ink-800 transition-colors">
                    <div className="relative flex-shrink-0">
                      <Avatar user={p} size="sm" />
                      {inCall && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border border-ink-900" title="Dans l'appel" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">
                        {p.prenom} {p.nom} {p.id === user?.id && <span className="text-violet-400">(vous)</span>}
                      </p>
                      <p className="text-xs text-slate-600 capitalize">{p.role_salle?.toLowerCase()}</p>
                    </div>
                    {inCall && <span className="text-xs text-emerald-400 flex-shrink-0">🎙️</span>}
                  </div>
                )
              })}
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
                <Btn size="sm" onClick={() => setShowPlan(true)} className="w-full justify-center">
                  ➕ Planifier une séance
                </Btn>
              )}
              {seances.map(s => (
                <div key={s.id} className="rounded-xl bg-ink-800 border border-ink-700 p-3 flex flex-col gap-1.5">
                  <p className="text-xs font-bold text-slate-200 leading-tight">{s.titre}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(s.date_debut).toLocaleString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                  <p className="text-xs text-slate-500">⏱ {s.duree} min</p>
                  <Badge variant={statutBadge[s.statut] || 'default'}>{s.statut}</Badge>

                  {/* PLANIFIEE → tuteur peut annuler */}
                  {s.statut === 'PLANIFIEE' && isTuteur && (
                    <button
                      onClick={() => handleAnnulerSeance(s.id)}
                      className="mt-1 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all">
                      ❌ Annuler la séance
                    </button>
                  )}

                  {/* EN_COURS → indicateur + bouton terminer pour le tuteur */}
                  {s.statut === 'EN_COURS' && (
                    <div className="flex flex-col gap-1 mt-0.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-xs text-emerald-400">Séance en cours</p>
                      </div>
                      {isTuteur && activeCall && (
                        <button
                          onClick={handleEndCall}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all">
                          ⏹ Terminer la séance
                        </button>
                      )}
                    </div>
                  )}

                  {/* REALISEE */}
                  {s.statut === 'REALISEE' && (
                    <p className="text-xs text-emerald-500 mt-0.5">✅ Séance réalisée</p>
                  )}

                  {/* ANNULEE */}
                  {s.statut === 'ANNULEE' && (
                    <p className="text-xs text-rose-400 mt-0.5">❌ Séance annulée</p>
                  )}
                </div>
              ))}
              {seances.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">Aucune séance planifiée</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Fiche d'appel entrant ──────────────────────────────────────────── */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-ink-800 border border-ink-600 rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl max-w-sm w-full mx-4">
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
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => refuseCallRef.current?.(incomingCall.sessionId)}
                className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 text-2xl flex items-center justify-center hover:bg-rose-500/40 transition-all active:scale-95">
                📵
              </button>
              <button
                onClick={() => acceptCallRef.current?.(incomingCall.sessionId)}
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