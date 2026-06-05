import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sallesAPI, seancesAPI, tuteursAPI, invitationsAPI, tarifsAPI, examensAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  getSocket, joinSalle, leaveSalle, sendMessage,
  startCall, endCall, joinCall, toggleMute,
  sendOffer, sendAnswer, sendIce,
  startScreenShare, stopScreenShare, sendScreenOffer, sendScreenAnswer, sendScreenIce
} from '../../services/socket'
import Chat from '../../components/Chat/Chat'
import Whiteboard from '../../components/Whiteboard/Whiteboard'
import { Avatar, Badge, Btn, Spinner, Modal, FormGroup, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'
import PaiementModal from '../Paiement/PaiementModal'

// ─── Hook: timer ──────────────────────────────────────────────────────────────
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

// ─── Panneau d'appel flottant ─────────────────────────────────────────────────
function CallPanel({ callParticipants, isMuted, onToggleMute, onEnd, onLeave, canEnd, callTime, isSharing, onShareToggle, isTuteur }) {
  return (
    <div className="fixed bottom-4 right-4 z-40 bg-ink-800 border border-emerald-500/30 rounded-2xl shadow-2xl p-4 w-72 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Appel en cours</span>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-ink-700 px-2 py-0.5 rounded-lg">{callTime}</span>
      </div>

      {/* Participants */}
      <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
        {callParticipants.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-2">En attente de participants…</p>
        ) : callParticipants.map(p => (
          <div key={p.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-ink-700">
            <div className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
              {p.prenom?.[0]?.toUpperCase()}{p.nom?.[0]?.toUpperCase()}
            </div>
            <p className="text-xs font-semibold text-slate-200 flex-1 truncate">
              {p.prenom} {p.nom}{p.isMe && <span className="text-violet-400 ml-1">(vous)</span>}
            </p>
            <span className="text-xs flex-shrink-0">{p.muted ? '🔇' : '🎙️'}</span>
          </div>
        ))}
      </div>

      {/* Contrôles */}
      <div className="flex gap-2 pt-1 border-t border-ink-600">
        <button onClick={onToggleMute}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all
            ${isMuted ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400' : 'bg-ink-700 border border-ink-600 text-slate-300 hover:bg-ink-600'}`}>
          {isMuted ? '🔇' : '🎙️'}
        </button>

        {/* Bouton partage d'écran — tuteur seulement */}
        {isTuteur && (
          <button onClick={onShareToggle}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all
              ${isSharing
                ? 'bg-violet-500/30 border border-violet-400/60 text-violet-300 animate-pulse'
                : 'bg-ink-700 border border-ink-600 text-slate-300 hover:bg-ink-600'}`}>
            {isSharing ? '⏹ Écran' : '🖥️ Écran'}
          </button>
        )}

        {canEnd ? (
          <button onClick={onEnd}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 transition-all">
            📵
          </button>
        ) : (
          <button onClick={onLeave}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold bg-ink-700 border border-ink-600 text-slate-300 hover:bg-ink-600 transition-all">
            🚪
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Fenêtre de partage d'écran (vue étudiant) ───────────────────────────────
// ─── Fenêtre partage d'écran : 3 modes — plein écran / normal / minimisé ────
// Fonctionne aussi bien côté tuteur (voir sa propre diffusion) que côté étudiant
function ScreenShareViewer({ sharerNom, videoRef, onClose }) {
  // 'fullscreen' | 'normal' | 'minimized'
  const [mode, setMode] = useState('normal')
  const containerRef    = useRef(null)

  // Plein écran natif du navigateur
  const enterFullscreen = () => {
    containerRef.current?.requestFullscreen?.()
    setMode('fullscreen')
  }
  const exitFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    setMode('normal')
  }
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement && mode === 'fullscreen') setMode('normal')
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [mode])

  // ── MODE MINIMISÉ : petite vignette draggable ──────────────────────────
  const dragRef      = useRef(null)
  const isDragging   = useRef(false)
  const dragOffset   = useRef({ x: 0, y: 0 })
  const [pos, setPos] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 220 })

  const onMouseDown = (e) => {
    isDragging.current = true
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    }
    e.preventDefault()
  }
  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return
      setPos({
        x: Math.max(0, Math.min(window.innerWidth  - 320, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.current.y)),
      })
    }
    const onUp = () => { isDragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  // ── RENDU MINIMISÉ ─────────────────────────────────────────────────────
  if (mode === 'minimized') {
    return (
      <div
        ref={dragRef}
        style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9998, width: 300 }}
        className="rounded-2xl overflow-hidden shadow-2xl border-2 border-violet-500/50 bg-ink-900 select-none"
      >
        {/* Barre drag */}
        <div
          onMouseDown={onMouseDown}
          className="flex items-center justify-between px-3 py-1.5 bg-ink-800 cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-semibold text-violet-300 truncate max-w-[140px]">
              🖥️ {sharerNom}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Agrandir */}
            <button
              onClick={() => setMode('normal')}
              title="Agrandir"
              className="w-6 h-6 rounded-lg bg-ink-700 hover:bg-violet-600/30 text-slate-400 hover:text-violet-300 flex items-center justify-center text-xs transition-all">
              ⛶
            </button>
            {/* Fermer vignette (remet en normal) */}
            <button
              onClick={onClose}
              title="Fermer"
              className="w-6 h-6 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 flex items-center justify-center text-xs transition-all">
              ✕
            </button>
          </div>
        </div>

        {/* Mini vidéo */}
        <div className="relative bg-ink-950" style={{ height: 168 }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
          {/* Overlay click pour agrandir */}
          <div
            onClick={() => setMode('normal')}
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all cursor-pointer group"
          >
            <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">⛶</span>
          </div>
        </div>

        {/* Hint bas */}
        <div className="px-3 py-1 bg-ink-800 text-center">
          <p className="text-xs text-slate-600">Glisser pour déplacer · Cliquer pour agrandir</p>
        </div>
      </div>
    )
  }

  // ── RENDU NORMAL / PLEIN ÉCRAN ─────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col bg-black/92"
      style={{ zIndex: 9998 }}
    >
      {/* Barre du haut */}
      <div className="flex items-center justify-between px-4 py-2 bg-ink-900/90 backdrop-blur-sm flex-shrink-0 border-b border-ink-700/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-sm font-semibold text-white">
            🖥️ Écran partagé par <span className="text-violet-400">{sharerNom}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Minimiser → vignette draggable */}
          <button
            onClick={() => setMode('minimized')}
            title="Minimiser — accéder au tableau blanc"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs hover:bg-amber-500/25 transition-all font-medium">
            ▼ Minimiser
          </button>
          {/* Plein écran */}
          {mode !== 'fullscreen' ? (
            <button onClick={enterFullscreen}
              className="px-3 py-1.5 rounded-lg bg-ink-700 text-slate-300 text-xs hover:bg-ink-600 transition-all">
              ⛶ Plein écran
            </button>
          ) : (
            <button onClick={exitFullscreen}
              className="px-3 py-1.5 rounded-lg bg-ink-700 text-slate-300 text-xs hover:bg-ink-600 transition-all">
              ⊡ Réduire
            </button>
          )}
          {/* Fermer */}
          <button onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs hover:bg-rose-500/30 transition-all">
            ✕ Fermer
          </button>
        </div>
      </div>

      {/* Vidéo principale */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="max-w-full max-h-full rounded-xl shadow-2xl border border-ink-600/50 object-contain bg-ink-950"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Bas — info et accès tableau blanc */}
      <div className="flex items-center justify-center gap-4 py-2 flex-shrink-0 border-t border-ink-700/30">
        <p className="text-xs text-slate-600">Lecture seule</p>
        <span className="text-slate-700">·</span>
        <button
          onClick={() => setMode('minimized')}
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium">
          ▼ Minimiser pour accéder au tableau blanc
        </button>
      </div>
    </div>
  )
}

// ─── Modal inviter tuteur ─────────────────────────────────────────────────────
function InviteTuteurModal({ salleId, hasTuteur, onClose, onSuccess, onError }) {
  const [tuteurs, setTuteurs]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState('')
  const [sending, setSending]   = useState(false)
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
        <span className="text-xl">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-amber-400 mb-1">Cette salle a déjà un tuteur</p>
          <p className="text-sm text-slate-400">L'ancien tuteur sera retiré dès que le nouveau accepte.</p>
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
              className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
              style={{
                background: selected === String(t.id) ? 'rgba(124,58,237,0.15)' : '#1e1b2e',
                border: selected === String(t.id) ? '2px solid #7c3aed' : '2px solid #2d2d4a',
              }}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(124,58,237,0.2)',border:'1px solid rgba(124,58,237,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#a78bfa',flexShrink:0}}>
                {t.prenom?.[0]}{t.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{color:'#F1F5F9'}}>{t.prenom} {t.nom}</p>
                {t.specialites?.length > 0 && <p className="text-xs truncate" style={{color:'#64748b'}}>{t.specialites.slice(0,3).join(', ')}</p>}
              </div>
              {selected === String(t.id) && <span style={{color:'#a78bfa'}}>✓</span>}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-3 justify-end pt-1 border-t border-ink-700">
        <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        <Btn onClick={handleSend} disabled={!selected || sending}>
          {sending ? 'Envoi...' : hasTuteur ? '🔄 Remplacer' : "✉️ Inviter"}
        </Btn>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Salle() {
  const { id }        = useParams()
  const { user }      = useAuth()
  const navigate      = useNavigate()
  const { toasts, success, error } = useToast()

  // ── States ────────────────────────────────────────────────────────────────
  const [salle,            setSalle]           = useState(null)
  const [participants,     setParticipants]    = useState([])
  const [messages,         setMessages]        = useState([])
  const [fichiers,         setFichiers]        = useState([])
  const [seances,          setSeances]         = useState([])
  const [loading,          setLoading]         = useState(true)
  const [myRole,           setMyRole]          = useState(null)
  const [rightTab,         setRightTab]        = useState('participants')

  // Examens
  const [examens,          setExamens]         = useState([])
  const [examensLoaded,    setExamensLoaded]   = useState(false)
  // Vue tuteur — création/édition examen
  const [showCreateExamen, setShowCreateExamen]= useState(false)
  const [examForm,         setExamForm]        = useState({ titre:'', description:'', notePassage:70, dureeMinutes:30, maxTentatives:'', dateDebut:'', dateLimite:'', dateAffichageResultats:'', modeAffichage:'UNE_PAR_UNE' })
  const [editingExamen,    setEditingExamen]   = useState(null)  // examen en cours d'édition (questions)
  const [questionForm,     setQuestionForm]    = useState({ texte:'', type:'QCM', points:1, reponses:[{texte:'',estCorrecte:false},{texte:'',estCorrecte:false}] })
  const [savingExamen,     setSavingExamen]    = useState(false)
  // Vue étudiant — passage examen
  const [tentativeActive,  setTentativeActive] = useState(null)  // { tentative, examen, questions, currentIdx }
  const [reponsesEnCours,  setReponsesEnCours] = useState({})    // { questionId: reponseId }
  const [resultats,        setResultats]       = useState(null)  // résultat après soumission
  const [showConfirmSoum,  setShowConfirmSoum] = useState(false)
  const [timerLeft,        setTimerLeft]       = useState(null)

  // Appel audio
  const [activeCall,       setActiveCall]      = useState(null)
  const [callParticipants, setCallParticipants]= useState([])
  const [isMuted,          setIsMuted]         = useState(false)
  const [incomingCall,     setIncomingCall]    = useState(null)

  // Partage d'écran
  const [isSharing,        setIsSharing]       = useState(false)   // tuteur : je partage
  const [screenShare,      setScreenShare]     = useState(null)    // étudiant : { sharerId, sharerNom }
  const [screenStream,     setScreenStream]    = useState(null)    // stream local (tuteur)

  // UI
  const [showPlan,         setShowPlan]        = useState(false)
  const [planForm,         setPlanForm]        = useState({ titre:'', matiere:'', dateDebut:'', duree:60 })
  const [mesTarifs,        setMesTarifs]       = useState([])   // matières du tuteur
  const [mesDispos,        setMesDispos]       = useState([])   // disponibilités tuteur
  const [showInviteTuteur, setShowInviteTuteur]= useState(false)
  const [paiementSeanceId, setPaiementSeanceId]= useState(null)   // id séance à payer

  const callTime = useCallTimer(!!activeCall)

  // ── Refs stables ──────────────────────────────────────────────────────────
  const peersRef          = useRef({})   // audio WebRTC peers
  const screenPeersRef    = useRef({})   // screen WebRTC peers (un par étudiant)
  const streamRef         = useRef(null) // audio stream local
  const screenStreamRef   = useRef(null) // screen stream local (tuteur)
  const screenVideoRef    = useRef(null) // <video> pour afficher l'écran partagé (étudiant)
  const sessionRef        = useRef(null)
  const userRef           = useRef(null)
  const participantsRef   = useRef([])
  const activeCallRef     = useRef(null)
  const acceptCallRef     = useRef(null)
  const refuseCallRef     = useRef(null)

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
        // Charger les examens automatiquement pour afficher le bon compteur
        try {
          const { data: examData } = await examensAPI.getBySalle(id)
          setExamens(examData)
          setExamensLoaded(true)
        } catch { setExamensLoaded(true) }
      } catch { navigate('/dashboard') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  // ── WebRTC Audio helpers ──────────────────────────────────────────────────
  const getLocalStream = async () => {
    if (streamRef.current && streamRef.current.active) return streamRef.current
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    streamRef.current = stream
    return stream
  }

  const createPeerConnection = (targetUserId) => {
    if (peersRef.current[targetUserId]) { peersRef.current[targetUserId].close(); delete peersRef.current[targetUserId] }
    const pc = new RTCPeerConnection({ iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]})
    pc.onicecandidate = (e) => { if (e.candidate) sendIce(targetUserId, e.candidate) }
    pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState === 'failed') pc.restartIce() }
    pc.ontrack = (e) => {
      const audioId = `remote-audio-${targetUserId}`
      let audio = document.getElementById(audioId)
      if (!audio) { audio = document.createElement('audio'); audio.id = audioId; audio.autoplay = true; audio.setAttribute('playsinline',''); document.body.appendChild(audio) }
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
    Object.values(peersRef.current).forEach(pc => { try { pc.close() } catch(_){} })
    peersRef.current = {}
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    sessionRef.current = null
    setCallParticipants([])
    document.querySelectorAll('[id^="remote-audio-"]').forEach(el => el.remove())
  }, [])

  // ── WebRTC Screen sharing helpers ─────────────────────────────────────────

  // Créer une PeerConnection dédiée au screen sharing vers un étudiant
  const createScreenPeerConnection = (targetUserId) => {
    if (screenPeersRef.current[targetUserId]) {
      screenPeersRef.current[targetUserId].close()
      delete screenPeersRef.current[targetUserId]
    }
    const pc = new RTCPeerConnection({ iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]})
    pc.onicecandidate = (e) => { if (e.candidate) sendScreenIce(targetUserId, e.candidate) }
    // Côté étudiant — recevoir le stream vidéo de l'écran
    pc.ontrack = (e) => {
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = e.streams[0]
      }
    }
    screenPeersRef.current[targetUserId] = pc
    return pc
  }

  // Tuteur → envoyer l'écran à un étudiant spécifique
  const shareScreenToPeer = async (targetUserId) => {
    try {
      const stream = screenStreamRef.current
      if (!stream) return
      const pc = createScreenPeerConnection(targetUserId)
      stream.getTracks().forEach(t => pc.addTrack(t, stream))
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendScreenOffer(targetUserId, offer)
    } catch (err) { console.error('shareScreenToPeer error:', err) }
  }

  // Tuteur — démarrer le partage d'écran
  const handleStartScreenShare = async () => {
    try {
      // Demander la capture d'écran au navigateur
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 15, max: 30 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false, // pas d'audio système (évite les échos avec le micro)
      })

      screenStreamRef.current = stream
      setScreenStream(stream)
      setIsSharing(true)

      // Notifier le backend que le partage commence
      startScreenShare(id)

      // Envoyer l'offre à tous les participants actuels dans l'appel
      const myId = userRef.current?.id
      const others = participantsRef.current.filter(p => String(p.id) !== String(myId))
      for (const p of others) {
        await shareScreenToPeer(p.id)
      }

      // Si le tuteur arrête le partage via le navigateur (bouton "Stop sharing")
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        handleStopScreenShare()
      })

      success('Partage d\'écran démarré ! Les étudiants voient votre écran.')
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        error('Impossible de partager l\'écran.')
      }
      // NotAllowedError = l'utilisateur a annulé → pas d'erreur
    }
  }

  // Tuteur — arrêter le partage d'écran
  const handleStopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop())
      screenStreamRef.current = null
    }
    setScreenStream(null)
    setIsSharing(false)
    Object.values(screenPeersRef.current).forEach(pc => { try { pc.close() } catch(_){} })
    screenPeersRef.current = {}
    stopScreenShare(id)
    success('Partage d\'écran arrêté.')
  }, [id])

  const addToCallParticipants = useCallback((userId, muted = false) => {
    const p = participantsRef.current.find(p => String(p.id) === String(userId))
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

    const handleMessage   = (msg) => setMessages(prev => [...prev, msg])
    const handleJoin      = ({ userId, prenom, nom }) =>
      setParticipants(prev => prev.some(p => p.id === userId) ? prev : [...prev, { id: userId, prenom, nom }])
    const handleLeave     = ({ userId }) => {
      setParticipants(prev => prev.filter(p => p.id !== userId))
      setCallParticipants(prev => prev.filter(p => String(p.id) !== String(userId)))
    }
    const handleSeanceUpdated = ({ seanceId, statut }) =>
      setSeances(prev => prev.map(s => s.id === seanceId ? { ...s, statut } : s))

    socket.on('chat:message',       handleMessage)
    socket.on('salle:user-joined',  handleJoin)
    socket.on('salle:user-left',    handleLeave)
    socket.on('seance:updated',     handleSeanceUpdated)

    // ── Appel déjà actif à l'entrée ──
    // L'utilisateur vient d'arriver dans la salle et un appel est en cours
    socket.on('call:active', ({ sessionId, initiateurNom }) => {
      // Seulement si un appel est vraiment en cours (sessionId présent)
      // et qu'on n'est pas déjà dedans
      if (!sessionId) return
      if (!sessionRef.current && !activeCallRef.current) {
        setIncomingCall({
          sessionId,
          initiateurNom: initiateurNom || 'Tuteur',
          isOngoing: true,
        })
      }
    })

    // ── Appel démarré ──
    const handleCallStarted = ({ sessionId, initiateur, initiateurNom }) => {
      const myUserId = userRef.current?.id
      const isInitiateur = myUserId != null && String(initiateur) === String(myUserId)
      if (isInitiateur) {
        setActiveCall(sessionId); sessionRef.current = sessionId
        joinCall(id, sessionId)
        setTimeout(() => addToCallParticipants(myUserId, false), 100)
        getLocalStream().catch(() => error("Impossible d'accéder au microphone."))
      } else {
        if (!sessionRef.current) setIncomingCall({ sessionId, initiateurNom: initiateurNom || 'Tuteur' })
      }
    }

    // ── Un participant a accepté → l'initiateur lui envoie l'offer audio ──
    const handleCallUserJoined = async ({ userId }) => {
      if (!sessionRef.current) return
      const myId = userRef.current?.id
      if (!myId || String(myId) === String(userId)) return
      if (!activeCallRef.current) return
      addToCallParticipants(userId, false)
      if (peersRef.current[userId]) return
      await callPeer(userId, sessionRef.current)
      // Si on partage l'écran, envoyer aussi le stream vidéo au nouveau participant
      if (screenStreamRef.current) {
        await shareScreenToPeer(userId)
      }
    }

    // ── WebRTC Audio signaling ──
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
        if (pc && pc.signalingState !== 'stable') await pc.setRemoteDescription(new RTCSessionDescription(answer))
      } catch (err) { console.error('handle answer error:', err) }
    }

    const handleIce = async ({ fromUserId, candidate }) => {
      try {
        const pc = peersRef.current[fromUserId]
        if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) { console.error('handle ice error:', err) }
    }

    // ── Screen sharing signaling ──────────────────────────────────────────

    // Étudiant : le tuteur vient de démarrer le partage
    const handleScreenStarted = ({ sharerId, sharerNom }) => {
      const myId = userRef.current?.id
      if (String(sharerId) === String(myId)) return // c'est moi le tuteur
      setScreenShare({ sharerId, sharerNom })
    }

    // Étudiant : le tuteur a arrêté le partage
    const handleScreenStopped = () => {
      setScreenShare(null)
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null
      // Fermer les PeerConnections screen côté étudiant
      Object.values(screenPeersRef.current).forEach(pc => { try { pc.close() } catch(_){} })
      screenPeersRef.current = {}
    }

    // Étudiant : recevoir l'offer vidéo du tuteur
    const handleScreenOffer = async ({ fromUserId, offer }) => {
      try {
        const pc = createScreenPeerConnection(fromUserId)
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendScreenAnswer(fromUserId, answer)
      } catch (err) { console.error('screen offer error:', err) }
    }

    // Tuteur : recevoir l'answer de l'étudiant
    const handleScreenAnswer = async ({ fromUserId, answer }) => {
      try {
        const pc = screenPeersRef.current[fromUserId]
        if (pc && pc.signalingState !== 'stable') await pc.setRemoteDescription(new RTCSessionDescription(answer))
      } catch (err) { console.error('screen answer error:', err) }
    }

    // ICE candidates pour le screen sharing
    const handleScreenIce = async ({ fromUserId, candidate }) => {
      try {
        const pc = screenPeersRef.current[fromUserId]
        if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) { console.error('screen ice error:', err) }
    }

    // ── Micro ──
    const handleUserMuted = ({ userId, muted }) =>
      setCallParticipants(prev => prev.map(p => String(p.id) === String(userId) ? { ...p, muted } : p))

    const handleUserDisconnected = ({ userId }) =>
      setCallParticipants(prev => prev.filter(p => String(p.id) !== String(userId)))

    // ── Fin d'appel ──
    const handleCallEnded = () => { setActiveCall(null); setIncomingCall(null); stopCall(); handleStopScreenShare() }
    const handleCallYouLeft = () => { setActiveCall(null); setIncomingCall(null); stopCall() }

    socket.on('call:started',           handleCallStarted)
    socket.on('call:user-joined',       handleCallUserJoined)
    socket.on('call:offer',             handleOffer)
    socket.on('call:answer',            handleAnswer)
    socket.on('call:ice-candidate',     handleIce)
    socket.on('screen:started',         handleScreenStarted)
    socket.on('screen:stopped',         handleScreenStopped)
    socket.on('screen:offer',           handleScreenOffer)
    socket.on('screen:answer',          handleScreenAnswer)
    socket.on('screen:ice',             handleScreenIce)
    socket.on('call:user-muted',        handleUserMuted)
    socket.on('call:user-disconnected', handleUserDisconnected)
    socket.on('call:ended',             handleCallEnded)
    socket.on('call:you-left',          handleCallYouLeft)

    // Accepter / Refuser appel
    acceptCallRef.current = async (sessionId) => {
      setIncomingCall(null); setActiveCall(sessionId); sessionRef.current = sessionId
      joinCall(id, sessionId)
      const myId = userRef.current?.id
      if (myId) setTimeout(() => addToCallParticipants(myId, false), 100)
      getSocket()?.emit('call:joined', { salleId: id, sessionId, userId: myId })
    }
    refuseCallRef.current = (sessionId) => {
      setIncomingCall(null)
      getSocket()?.emit('call:refused', { sessionId, userId: userRef.current?.id })
    }

    return () => {
      leaveSalle(id); stopCall()
      socket.off('chat:message');       socket.off('salle:user-joined')
      socket.off('salle:user-left');    socket.off('seance:updated')
      socket.off('call:active');        socket.off('call:started')
      socket.off('call:user-joined');   socket.off('call:offer')
      socket.off('call:answer');        socket.off('call:ice-candidate')
      socket.off('screen:started');     socket.off('screen:stopped')
      socket.off('screen:offer');       socket.off('screen:answer')
      socket.off('screen:ice');         socket.off('call:user-muted')
      socket.off('call:user-disconnected'); socket.off('call:ended')
      socket.off('call:you-left')
    }
  }, [id, stopCall, addToCallParticipants, handleStopScreenShare])

  // ── Handlers UI ───────────────────────────────────────────────────────────
  const handleQuitter = async () => {
    const msg = myRole === 'ADMIN'
      ? 'Vous êtes admin. Quitter supprimera définitivement cette salle. Confirmer ?'
      : 'Quitter cette salle ? Vous devrez demander une nouvelle invitation pour revenir.'
    if (!confirm(msg)) return
    try { await sallesAPI.quitter(id); navigate('/dashboard') }
    catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const uploadFichier = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const fd = new FormData(); fd.append('fichier', file)
    try {
      const { data } = await sallesAPI.uploadFichier(id, fd)
      setFichiers(prev => [data, ...prev]); success('Fichier uploadé !')
    } catch { error('Erreur upload') }
  }

  // ── Examens : charger ──────────────────────────────────────────────────────
  const loadExamens = useCallback(async () => {
    try {
      const { data } = await examensAPI.getBySalle(id)
      setExamens(data)
      setExamensLoaded(true)
    } catch { setExamensLoaded(true) }
  }, [id])

  // ── Examens : créer / modifier ─────────────────────────────────────────────
  const handleSaveExamen = async (e) => {
    e.preventDefault()
    setSavingExamen(true)
    try {
      if (editingExamen && editingExamen.statut === 'BROUILLON' && editingExamen.id) {
        // Modifier
        const { data } = await examensAPI.update(editingExamen.id, { ...examForm })
        setExamens(prev => prev.map(ex => ex.id === editingExamen.id ? { ...ex, ...data } : ex))
        setEditingExamen({ ...editingExamen, ...data })
        success('Examen mis à jour')
      } else {
        // Créer
        const { data } = await examensAPI.create({ ...examForm, salleId: id })
        setExamens(prev => [data, ...prev])
        setEditingExamen(data)
        setShowCreateExamen(false)
        success('Examen créé — ajoutez vos questions')
      }
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
    setSavingExamen(false)
  }

  const handleDeleteExamen = async (examenId) => {
    if (!confirm('Supprimer cet examen ?')) return
    try {
      await examensAPI.delete(examenId)
      setExamens(prev => prev.filter(ex => ex.id !== examenId))
      if (editingExamen?.id === examenId) setEditingExamen(null)
      success('Examen supprimé')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handlePublierExamen = async (examenId) => {
    try {
      await examensAPI.publier(examenId)
      setExamens(prev => prev.map(ex => ex.id === examenId ? { ...ex, statut: 'PUBLIE' } : ex))
      if (editingExamen?.id === examenId) setEditingExamen(prev => ({ ...prev, statut: 'PUBLIE' }))
      success('🚀 Examen publié — visible par les étudiants !')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  // ── Questions ──────────────────────────────────────────────────────────────
  const handleAddQuestion = async (e) => {
    e.preventDefault()
    if (!editingExamen?.id) return
    const hasCorrect = questionForm.reponses.some(r => r.estCorrecte)
    if (!hasCorrect) { error('Cochez au moins une bonne réponse'); return }
    const reponsesFilled = questionForm.reponses.filter(r => r.texte.trim())
    if (reponsesFilled.length < 2) { error('Ajoutez au moins 2 réponses'); return }
    try {
      const { data } = await examensAPI.addQuestion(editingExamen.id, {
        texte: questionForm.texte, type: questionForm.type,
        points: questionForm.points, reponses: reponsesFilled
      })
      setEditingExamen(prev => ({ ...prev, questions: [...(prev.questions || []), data] }))
      setExamens(prev => prev.map(ex => ex.id === editingExamen.id ? { ...ex, nb_questions: (ex.nb_questions||0)+1 } : ex))
      setQuestionForm({ texte:'', type:'QCM', points:1, reponses:[{texte:'',estCorrecte:false},{texte:'',estCorrecte:false}] })
      success('Question ajoutée')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleDeleteQuestion = async (qid) => {
    try {
      await examensAPI.deleteQuestion(editingExamen.id, qid)
      setEditingExamen(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== qid) }))
      setExamens(prev => prev.map(ex => ex.id === editingExamen.id ? { ...ex, nb_questions: Math.max(0,(ex.nb_questions||1)-1) } : ex))
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  // ── Étudiant : démarrer examen ─────────────────────────────────────────────
  const handleDemarrerExamen = async (examenId) => {
    try {
      // 1. Créer la tentative
      const { data } = await examensAPI.demarrer(examenId)
      const tentative = data.tentative
      const examen    = data.examen

      // 2. Charger les questions via getById (demarrer ne les inclut pas)
      const { data: examDetail } = await examensAPI.getById(examenId)
      const questions = (examDetail.questions || []).map(q => ({
        ...q,
        reponses: (q.reponses || []).map(r => ({ ...r, id: Number(r.id) })),
      }))

      if (!questions.length) {
        error('Cet examen ne contient aucune question.')
        return
      }

      setTentativeActive({
        tentative,
        examen: { ...examen, mode_affichage: examDetail.mode_affichage },
        questions,
        currentIdx: 0,
        expiresAt: new Date(tentative.expires_at),
      })
      setReponsesEnCours({})
      setResultats(null)
      const msLeft = new Date(tentative.expires_at) - Date.now()
      setTimerLeft(Math.max(0, Math.floor(msLeft / 1000)))
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  // Timer décompte
  useEffect(() => {
    if (timerLeft === null) return
    if (timerLeft <= 0) {
      // Temps écoulé → soumettre automatiquement
      handleSoumettreExamen(true)
      return
    }
    const t = setTimeout(() => setTimerLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timerLeft])

  const fmtTimer = (s) => {
    if (s === null) return ''
    const m = Math.floor(s / 60); const sec = s % 60
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  const handleSelectReponse = (questionId, reponseId) => {
    setReponsesEnCours(prev => ({ ...prev, [String(questionId)]: Number(reponseId) }))
  }

  const handleSoumettreExamen = async (autoExpire = false) => {
    if (!tentativeActive) return
    try {
      const reponses = Object.entries(reponsesEnCours).map(([questionId, reponseId]) => ({
        questionId: parseInt(questionId), reponseId: parseInt(reponseId)
      }))
      const { data } = await examensAPI.soumettre(tentativeActive.tentative.id, reponses)
      setResultats(data)
      setTentativeActive(null)
      setTimerLeft(null)
      setShowConfirmSoum(false)
      // Recharger les examens pour màj statut
      await loadExamens()
      if (data.reussi && data.certificat) {
        success('🏆 Félicitations ! Certificat généré !')
      } else {
        error(`Score : ${data.pourcentage}% — Note de passage : ${data.notePassage}%`)
      }
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handlePlanifier = async (e) => {
    e.preventDefault()
    try {
      const { data } = await seancesAPI.create({ ...planForm, salleId: id })
      setSeances(prev => [...prev, data]); setShowPlan(false)
      success('Séance planifiée !')
      const dateStr = new Date(planForm.dateDebut).toLocaleString('fr-FR', { weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })
      // On encode le seance_id dans le message pour que l'admin puisse cliquer "Payer"
      sendMessage(id, `📅 Séance planifiée : ${planForm.titre} le ${dateStr} (${planForm.duree} min). seance_id:${data.id}`)
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleAnnulerSeance = async (seanceId) => {
    if (!confirm('Annuler cette séance ? Cette action est irréversible.')) return
    try {
      await seancesAPI.annuler(seanceId)
      setSeances(prev => prev.map(s => s.id === seanceId ? { ...s, statut: 'ANNULEE' } : s))
      success('Séance annulée.')
      sendMessage(id, `❌ Séance annulée par le tuteur.`)
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleToggleMute = () => {
    setIsMuted(m => {
      const newMuted = !m
      toggleMute(activeCall, newMuted)
      const myId = userRef.current?.id
      if (myId) setCallParticipants(prev => prev.map(p => String(p.id) === String(myId) ? { ...p, muted: newMuted } : p))
      return newMuted
    })
  }

  const handleEndCall = () => {
    endCall(id, activeCall); setActiveCall(null); stopCall()
    if (isSharing) handleStopScreenShare()
  }

  const handleLeaveCall = () => {
    getSocket()?.emit('call:leave', { sessionId: activeCall }); setActiveCall(null); stopCall()
  }

  const handleShareToggle = () => {
    if (isSharing) handleStopScreenShare()
    else handleStartScreenShare()
  }

  // ── Rôles ─────────────────────────────────────────────────────────────────
  const isTuteur  = user?.role === 'tuteur' && myRole === 'CO_ADMIN'
  const isAdmin   = myRole === 'ADMIN'
  const hasTuteur = salle?.statut === 'ACTIVE_AVEC_TUTEUR'
  const canCall   = isTuteur || (isAdmin && !hasTuteur)

  const statutBadge = { PLANIFIEE:'warning', EN_ATTENTE_PAIEMENT:'warning', CONFIRMEE:'primary', EN_COURS:'primary', REALISEE:'success', ANNULEE:'danger' }
  const statutLabel  = { PLANIFIEE:'Planifiée', EN_ATTENTE_PAIEMENT:'⏳ En attente paiement', CONFIRMEE:'✅ Confirmée', EN_COURS:'🔴 En cours', REALISEE:'✅ Réalisée', ANNULEE:'❌ Annulée' }

  if (loading) return (
    <div className="h-screen bg-ink-950 flex items-center justify-center"><Spinner size="lg" /></div>
  )

  return (
    <div className="h-screen flex flex-col bg-ink-950 overflow-hidden">
      <ToastContainer toasts={toasts} />

      {/* ── Panneau d'appel flottant ────────────────────────────────────── */}
      {activeCall && (
        <CallPanel
          callParticipants={callParticipants}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onEnd={handleEndCall}
          onLeave={handleLeaveCall}
          canEnd={canCall}
          callTime={callTime}
          isSharing={isSharing}
          onShareToggle={handleShareToggle}
          isTuteur={isTuteur}
        />
      )}

      {/* ── Écran partagé — vue étudiant ────────────────────────────────── */}
      {screenShare && (
        <ScreenShareViewer
          sharerNom={screenShare.sharerNom}
          videoRef={screenVideoRef}
          onClose={() => setScreenShare(null)}
        />
      )}

      {/* Top bar */}
      <div className="h-12 flex-shrink-0 flex items-center justify-between px-4 bg-ink-900 border-b border-ink-700">
        <div className="flex items-center gap-3 overflow-hidden">
          <Btn variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>← Retour</Btn>
          <div className="w-px h-5 bg-ink-700" />
          <h2 className="font-display font-bold text-white text-sm truncate">{salle?.nom}</h2>
          {salle?.matiere && <span className="text-xs text-violet-400 hidden sm:block">📖 {salle.matiere}</span>}
          <Badge variant={hasTuteur ? 'primary' : 'default'}>
            {hasTuteur ? '👨‍🏫 Avec tuteur' : '📚 Sans tuteur'}
          </Badge>
          {/* Indicateur partage d'écran dans la top bar */}
          {screenShare && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs text-violet-400 font-medium">Écran partagé</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!activeCall && canCall && (
            <Btn variant="success" size="sm" onClick={() => startCall(id, null)}>📞 Appel</Btn>
          )}
          <Btn variant="secondary" size="sm" onClick={handleQuitter}>🚪 Quitter</Btn>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 flex-shrink-0 border-r border-ink-700 flex flex-col">
          <Chat
            messages={messages}
            onSend={(c) => sendMessage(id, c)}
            currentUser={user}
            isAdmin={isAdmin}
            onPayer={(seanceId) => setPaiementSeanceId(seanceId)}
            seances={seances}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <Whiteboard salleId={id} isTuteur={isTuteur} />
        </div>
        <div className="w-60 flex-shrink-0 border-l border-ink-700 flex flex-col bg-ink-900">
          {/* Tabs */}
          <div className="flex border-b border-ink-700 flex-shrink-0">
            {[
              { id:'participants', icon:'👥', label:`${participants.length}` },
              { id:'fichiers',     icon:'📁', label:`${fichiers.length}` },
              { id:'seances',      icon:'📅', label:`${seances.length}` },
              { id:'examens',      icon:'📝', label:`${examens.length}` },
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
                <Btn size="sm" variant="secondary" className="w-full justify-center mb-1" onClick={() => setShowInviteTuteur(true)}>
                  ➕ Inviter un tuteur
                </Btn>
              )}
              {participants.map(p => {
                const inCall = callParticipants.some(cp => String(cp.id) === String(p.id))
                const isMe   = String(p.id) === String(user?.id)
                const canKick = isAdmin && !isMe && p.role_salle !== 'ADMIN'
                return (
                  <div key={p.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-ink-800 transition-colors group">
                    <div className="relative flex-shrink-0">
                      <Avatar user={p} size="sm" />
                      {inCall && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border border-ink-900" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{color:'#E2E8F0'}}>
                        {p.prenom} {p.nom} {isMe && <span style={{color:'#a78bfa'}}>(vous)</span>}
                      </p>
                      <p className="text-xs text-slate-600 capitalize">{p.role_salle?.toLowerCase()}</p>
                    </div>
                    {inCall && <span className="text-xs text-emerald-400 flex-shrink-0">🎙️</span>}
                    {canKick && (
                      <button
                        title={`Retirer ${p.prenom} de la salle`}
                        onClick={async () => {
                          if (!confirm(`Retirer ${p.prenom} ${p.nom} de la salle ?`)) return
                          try {
                            await sallesAPI.retirerMembre(id, p.id)
                            setParticipants(prev => prev.filter(m => m.id !== p.id))
                          } catch (err) {
                            alert(err?.response?.data?.error || 'Erreur lors du retrait.')
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                        style={{ background:'rgba(220,38,38,0.15)', color:'#f87171' }}
                      >✕</button>
                    )}
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
                <Btn size="sm" onClick={async () => {
                  setShowPlan(true)
                  try {
                    const [tarifsRes, disposRes] = await Promise.all([
                      tarifsAPI.getMesTarifs(),
                      seancesAPI.getDisponibilites(),
                    ])
                    setMesTarifs(tarifsRes.data)
                    setMesDispos(disposRes.data)
                    if (tarifsRes.data.length === 1) setPlanForm(f => ({ ...f, matiere: tarifsRes.data[0].matiere }))
                  } catch { setMesTarifs([]); setMesDispos([]) }
                }} className="w-full justify-center">➕ Planifier une séance</Btn>
              )}
              {seances.map(s => (
                <div key={s.id} className="rounded-xl bg-ink-800 border border-ink-700 p-3 flex flex-col gap-1.5">
                  <p className="text-xs font-bold text-slate-200 leading-tight">{s.titre}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(s.date_debut).toLocaleString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                  <p className="text-xs text-slate-500">⏱ {s.duree} min</p>
                  <Badge variant={statutBadge[s.statut] || 'default'}>{statutLabel[s.statut] || s.statut}</Badge>
                  {/* Montant si disponible */}
                  {s.montant_total > 0 && (
                    <p className="text-xs text-violet-400 font-semibold">💰 {s.montant_total} DH</p>
                  )}
                  {/* Statut paiement → admin */}
                  {isAdmin && (s.statut === 'EN_ATTENTE_PAIEMENT' || s.statut_paiement === 'PAYE' || s.statut === 'CONFIRMEE') && (
                    <div className={`mt-1 p-2 rounded-lg border ${
                      s.statut_paiement === 'PAYE' || s.statut === 'CONFIRMEE'
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {s.statut_paiement === 'PAYE' || s.statut === 'CONFIRMEE' ? (
                        <>
                          <p className="text-xs text-emerald-400 mb-1.5">✅ Séance payée</p>
                          <button
                            disabled
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold"
                            style={{
                              background: '#1a2e1a',
                              color: '#4ade80',
                              border: '1px solid #166534',
                              cursor: 'not-allowed',
                              opacity: 0.7,
                            }}
                          >
                            ✅ Payé
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-amber-400 mb-1.5">⚠️ En attente de votre paiement</p>
                          <button
                            onClick={() => setPaiementSeanceId(s.id)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all"
                            style={{
                              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: '0 2px 12px rgba(124,58,237,0.4)',
                            }}
                          >
                            💳 Payer maintenant
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {/* Annuler si PLANIFIEE ou EN_ATTENTE_PAIEMENT ou CONFIRMEE */}
                  {(s.statut === 'PLANIFIEE' || s.statut === 'EN_ATTENTE_PAIEMENT' || s.statut === 'CONFIRMEE') && isTuteur && (
                    <button onClick={() => handleAnnulerSeance(s.id)}
                      className="mt-1 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all">
                      ❌ Annuler la séance
                    </button>
                  )}
                  {s.statut === 'EN_COURS' && (
                    <div className="flex flex-col gap-1 mt-0.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-xs text-emerald-400">Séance en cours</p>
                      </div>
                      {isTuteur && activeCall && (
                        <button onClick={handleEndCall}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all">
                          ⏹ Terminer la séance
                        </button>
                      )}
                    </div>
                  )}
                  {s.statut === 'REALISEE' && <p className="text-xs text-emerald-500 mt-0.5">✅ Séance réalisée</p>}
                  {s.statut === 'ANNULEE'  && <p className="text-xs text-rose-400 mt-0.5">❌ Séance annulée</p>}
                </div>
              ))}
              {seances.length === 0 && <p className="text-xs text-slate-600 text-center py-4">Aucune séance planifiée</p>}
            </div>
          )}

          {/* ── ONGLET EXAMENS ────────────────────────────────────────── */}
          {rightTab === 'examens' && (
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">

              {/* === VUE PLEIN ÉCRAN : PASSAGE D'EXAMEN === */}
              {tentativeActive && (
                <div className="fixed inset-0 z-[100] bg-ink-950 flex flex-col overflow-hidden">
                  {/* Header timer */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-ink-700 bg-ink-900 flex-shrink-0">
                    <div>
                      <p className="text-xs text-slate-500">Examen en cours</p>
                      <p className="font-bold text-white text-sm">{tentativeActive.examen.titre}</p>
                    </div>
                    <div className={`text-xl font-mono font-bold px-4 py-1.5 rounded-xl ${timerLeft < 60 ? 'text-rose-400 bg-rose-500/10 animate-pulse' : 'text-violet-400 bg-violet-500/10'}`}>
                      ⏱ {fmtTimer(timerLeft)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {Object.keys(reponsesEnCours).length}/{tentativeActive.questions.length} répondues
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-ink-800 flex-shrink-0">
                    <div className="h-1 bg-violet-500 transition-all duration-500"
                      style={{ width: `${(Object.keys(reponsesEnCours).length / tentativeActive.questions.length) * 100}%` }} />
                  </div>

                  {/* Question courante */}
                  <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6">
                    {(() => {
                      const q = tentativeActive.questions[tentativeActive.currentIdx]
                      if (!q) return null
                      return (
                        <div className="w-full max-w-xl flex flex-col gap-5">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/50 flex items-center justify-center text-xs font-bold text-violet-400">
                              {tentativeActive.currentIdx + 1}
                            </span>
                            <p className="text-white font-semibold text-base leading-relaxed">{q.texte}</p>
                          </div>
                          <div className="flex flex-col gap-2.5">
                            {(q.reponses || []).map(r => {
                              const selected = reponsesEnCours[String(q.id)] === Number(r.id)
                              return (
                                <button key={r.id} onClick={() => handleSelectReponse(q.id, r.id)}
                                  className="w-full text-left px-4 py-3 rounded-xl transition-all text-sm"
                                  style={{
                                    background: selected ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                                    border: selected ? '1.5px solid #7c3aed' : '1px solid rgba(255,255,255,0.08)',
                                    color: selected ? '#c4b5fd' : '#94a3b8',
                                    fontWeight: selected ? 600 : 400,
                                  }}>
                                  {selected && <span className="mr-2">✓</span>}
                                  {r.texte}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between px-5 py-3 border-t border-ink-700 bg-ink-900 flex-shrink-0 gap-3">
                    <button
                      onClick={() => setTentativeActive(prev => ({ ...prev, currentIdx: Math.max(0, prev.currentIdx - 1) }))}
                      disabled={tentativeActive.currentIdx === 0}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-ink-700 text-slate-300 disabled:opacity-30 hover:bg-ink-600 transition-all">
                      ← Précédent
                    </button>

                    {/* Pastilles questions */}
                    <div className="flex gap-1 flex-wrap justify-center flex-1">
                      {tentativeActive.questions.map((q, i) => (
                        <button key={q.id} onClick={() => setTentativeActive(prev => ({ ...prev, currentIdx: i }))}
                          className="w-6 h-6 rounded-md text-[10px] font-bold transition-all"
                          style={{
                            background: reponsesEnCours[String(q.id)] ? '#7c3aed' : tentativeActive.currentIdx === i ? '#312e81' : '#1e1b4b',
                            color: reponsesEnCours[String(q.id)] || tentativeActive.currentIdx === i ? '#fff' : '#6b7280',
                            border: tentativeActive.currentIdx === i ? '1px solid #7c3aed' : '1px solid transparent',
                          }}>
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    {tentativeActive.currentIdx < tentativeActive.questions.length - 1 ? (
                      <button
                        onClick={() => setTentativeActive(prev => ({ ...prev, currentIdx: prev.currentIdx + 1 }))}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-ink-700 text-slate-300 hover:bg-ink-600 transition-all">
                        Suivant →
                      </button>
                    ) : (
                      <button onClick={() => setShowConfirmSoum(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'#fff' }}>
                        ✅ Terminer et envoyer
                      </button>
                    )}
                  </div>

                  {/* Popup confirmation soumission */}
                  {showConfirmSoum && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                      <div className="bg-ink-800 border border-ink-600 rounded-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
                        <p className="font-bold text-white text-center">Soumettre l'examen ?</p>
                        <p className="text-xs text-slate-400 text-center">
                          {Object.keys(reponsesEnCours).length}/{tentativeActive.questions.length} questions répondues.<br/>
                          Après validation, vous ne pourrez plus modifier vos réponses.
                        </p>
                        <div className="flex gap-3">
                          <button onClick={() => setShowConfirmSoum(false)}
                            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-ink-700 text-slate-300 hover:bg-ink-600">
                            Annuler
                          </button>
                          <button onClick={() => handleSoumettreExamen(false)}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'#fff' }}>
                            Confirmer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* === RÉSULTATS === */}
              {resultats && !tentativeActive && (
                <div className={`rounded-xl p-4 border flex flex-col gap-3 ${resultats.reussi ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                  <div className="text-center">
                    <div className="text-3xl mb-1">{resultats.reussi ? '🏆' : '😞'}</div>
                    <p className="font-bold text-white">{resultats.reussi ? 'Félicitations !' : 'Pas encore...'}</p>
                    <p className={`text-2xl font-mono font-bold mt-1 ${resultats.reussi ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {resultats.pourcentage}%
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {resultats.scoreObtenu}/{resultats.scoreMax} pts — passage à {resultats.notePassage}%
                    </p>
                  </div>
                  {resultats.reussi && resultats.certificat && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                      <p className="text-xs font-bold text-amber-400">🎓 Certificat généré !</p>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{resultats.certificat.numero_certificat}</p>
                      <p className="text-xs text-slate-500 mt-1">Vérifiable sur SmartTutor</p>
                    </div>
                  )}
                  <button onClick={() => setResultats(null)}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-ink-700 text-slate-300 hover:bg-ink-600">
                    Retour aux examens
                  </button>
                </div>
              )}

              {/* === LISTE EXAMENS (quand pas de tentative ni résultat) === */}
              {!tentativeActive && !resultats && (() => {
                return (
                  <>
                    {/* Bouton créer — tuteur seulement */}
                    {isTuteur && (
                      <Btn size="sm" onClick={() => { setShowCreateExamen(true); setEditingExamen(null); setExamForm({ titre:'', description:'', notePassage:70, dureeMinutes:30, maxTentatives:'', dateDebut:'', dateLimite:'', dateAffichageResultats:'', modeAffichage:'UNE_PAR_UNE' }) }}
                        className="w-full justify-center">
                        ➕ Créer un examen
                      </Btn>
                    )}

                    {/* Formulaire création/édition (tuteur) */}
                    {showCreateExamen && !editingExamen?.statut && (
                      <div className="rounded-xl bg-ink-800 border border-violet-500/30 p-3 flex flex-col gap-2">
                        <p className="text-xs font-bold text-violet-400">Nouvel examen</p>
                        <form onSubmit={handleSaveExamen} className="flex flex-col gap-2">
                          <input required value={examForm.titre} onChange={e => setExamForm(f => ({...f, titre:e.target.value}))}
                            placeholder="Titre de l'examen *"
                            className="w-full px-3 py-2 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs placeholder-slate-600" />
                          <textarea value={examForm.description} onChange={e => setExamForm(f => ({...f, description:e.target.value}))}
                            placeholder="Description (optionnel)" rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs placeholder-slate-600 resize-none" />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500">Note de passage (%)</label>
                              <input type="number" min={0} max={100} value={examForm.notePassage}
                                onChange={e => setExamForm(f => ({...f, notePassage:Number(e.target.value)}))}
                                className="w-full px-2 py-1.5 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs" />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500">Durée (min)</label>
                              <input type="number" min={5} max={180} value={examForm.dureeMinutes}
                                onChange={e => setExamForm(f => ({...f, dureeMinutes:Number(e.target.value)}))}
                                className="w-full px-2 py-1.5 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500">Max tentatives</label>
                              <input type="number" min={1} value={examForm.maxTentatives} placeholder="illimité"
                                onChange={e => setExamForm(f => ({...f, maxTentatives:e.target.value}))}
                                className="w-full px-2 py-1.5 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs placeholder-slate-600" />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500">Mode</label>
                              <select value={examForm.modeAffichage} onChange={e => setExamForm(f => ({...f, modeAffichage:e.target.value}))}
                                className="w-full px-2 py-1.5 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs">
                                <option value="UNE_PAR_UNE">Une par une</option>
                                <option value="LISTE">Liste complète</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500">Date de début (optionnel)</label>
                            <input type="datetime-local" value={examForm.dateDebut}
                              onChange={e => setExamForm(f => ({...f, dateDebut:e.target.value}))}
                              className="w-full px-2 py-1.5 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs" />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500">Date limite (optionnel)</label>
                            <input type="datetime-local" value={examForm.dateLimite}
                              onChange={e => setExamForm(f => ({...f, dateLimite:e.target.value}))}
                              className="w-full px-2 py-1.5 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs" />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500">Date affichage résultats (optionnel)</label>
                            <input type="datetime-local" value={examForm.dateAffichageResultats}
                              onChange={e => setExamForm(f => ({...f, dateAffichageResultats:e.target.value}))}
                              className="w-full px-2 py-1.5 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs" />
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setShowCreateExamen(false)}
                              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-ink-700 text-slate-400 hover:bg-ink-600">Annuler</button>
                            <button type="submit" disabled={savingExamen}
                              className="flex-1 py-2 rounded-xl text-xs font-bold"
                              style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'#fff' }}>
                              {savingExamen ? '...' : '💾 Enregistrer brouillon'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Vue gestion questions d'un brouillon (tuteur) */}
                    {editingExamen && editingExamen.statut === 'BROUILLON' && (
                      <div className="rounded-xl bg-ink-800 border border-violet-500/40 p-3 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-white">{editingExamen.titre}</p>
                            <p className="text-[10px] text-slate-500">{(editingExamen.questions||[]).length} question(s) — {editingExamen.note_passage}% requis — {editingExamen.duree_minutes} min</p>
                          </div>
                          <button onClick={() => setEditingExamen(null)} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>
                        </div>

                        {/* Questions existantes */}
                        {(editingExamen.questions || []).map((q, qi) => (
                          <div key={q.id} className="bg-ink-700 rounded-xl p-3 flex flex-col gap-1.5 border border-ink-600">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs text-white flex-1 leading-relaxed">
                                <span className="text-violet-400 font-bold mr-1">Q{qi+1}.</span>{q.texte}
                              </p>
                              <button onClick={() => handleDeleteQuestion(q.id)}
                                className="text-rose-400/60 hover:text-rose-400 text-xs flex-shrink-0">🗑</button>
                            </div>
                            {(q.reponses||[]).map(r => (
                              <div key={r.id} className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg ${r.est_correcte ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500'}`}>
                                <span>{r.est_correcte ? '✓' : '○'}</span>
                                <span>{r.texte}</span>
                              </div>
                            ))}
                          </div>
                        ))}

                        {/* Formulaire nouvelle question */}
                        <div className="border-t border-ink-600 pt-3 flex flex-col gap-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ajouter une question</p>
                          <select value={questionForm.type} onChange={e => setQuestionForm(f => ({
                            ...f, type:e.target.value,
                            reponses: e.target.value === 'VRAI_FAUX'
                              ? [{texte:'Vrai',estCorrecte:false},{texte:'Faux',estCorrecte:false}]
                              : [{texte:'',estCorrecte:false},{texte:'',estCorrecte:false}]
                          }))}
                            className="w-full px-2 py-1.5 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs">
                            <option value="QCM">QCM</option>
                            <option value="VRAI_FAUX">Vrai / Faux</option>
                          </select>
                          <textarea value={questionForm.texte} onChange={e => setQuestionForm(f => ({...f, texte:e.target.value}))}
                            placeholder="Texte de la question *" rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs placeholder-slate-600 resize-none" />
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-500">Points :</label>
                            <input type="number" min={0.5} step={0.5} value={questionForm.points}
                              onChange={e => setQuestionForm(f => ({...f, points:Number(e.target.value)}))}
                              className="w-16 px-2 py-1 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs" />
                          </div>
                          {/* Réponses */}
                          <div className="flex flex-col gap-1.5">
                            {questionForm.reponses.map((r, ri) => (
                              <div key={ri} className="flex items-center gap-2">
                                <input type="checkbox" checked={r.estCorrecte}
                                  onChange={e => setQuestionForm(f => ({
                                    ...f, reponses: f.reponses.map((rr, i) => i === ri ? {...rr, estCorrecte:e.target.checked} : rr)
                                  }))}
                                  className="w-3.5 h-3.5 accent-violet-500 flex-shrink-0" />
                                <input value={r.texte}
                                  readOnly={questionForm.type === 'VRAI_FAUX'}
                                  onChange={e => setQuestionForm(f => ({
                                    ...f, reponses: f.reponses.map((rr, i) => i === ri ? {...rr, texte:e.target.value} : rr)
                                  }))}
                                  placeholder={`Réponse ${ri+1}`}
                                  className="flex-1 px-2 py-1 rounded-lg bg-ink-700 border border-ink-600 text-white text-xs placeholder-slate-600" />
                                {questionForm.type === 'QCM' && ri > 1 && (
                                  <button type="button" onClick={() => setQuestionForm(f => ({...f, reponses: f.reponses.filter((_,i) => i !== ri)}))}
                                    className="text-rose-400/60 hover:text-rose-400 text-xs">✕</button>
                                )}
                              </div>
                            ))}
                            {questionForm.type === 'QCM' && questionForm.reponses.length < 6 && (
                              <button type="button"
                                onClick={() => setQuestionForm(f => ({...f, reponses:[...f.reponses, {texte:'',estCorrecte:false}]}))}
                                className="text-[10px] text-violet-400 hover:text-violet-300 text-left mt-0.5">
                                + Ajouter une réponse
                              </button>
                            )}
                          </div>
                          <button onClick={handleAddQuestion}
                            className="w-full py-2 rounded-xl text-xs font-bold mt-1"
                            style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'#fff' }}>
                            + Enregistrer la question
                          </button>
                        </div>

                        {/* Actions examen */}
                        <div className="flex gap-2 border-t border-ink-600 pt-3">
                          <button onClick={() => handleDeleteExamen(editingExamen.id)}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20">
                            🗑 Supprimer
                          </button>
                          <button onClick={() => handlePublierExamen(editingExamen.id)}
                            disabled={(editingExamen.questions||[]).length === 0}
                            className="flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                            style={{ background:'linear-gradient(135deg,#059669,#047857)', color:'#fff' }}>
                            🚀 Publier l'examen
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Liste des examens */}
                    {examens.map(ex => {
                      const estTuteurExamen = ex.tuteur_id === user?.id
                      const now = new Date()
                      const apresDebut = !ex.date_debut || now >= new Date(ex.date_debut)
                      const avantLimite = !ex.date_limite || now <= new Date(ex.date_limite)
                      const peutPasser  = ex.statut === 'PUBLIE' && apresDebut && avantLimite && !ex.deja_reussi && !isTuteur
                      const tentativesRestantes = ex.max_tentatives ? ex.max_tentatives - (ex.nb_tentatives_faites||0) : null

                      return (
                        <div key={ex.id} className={`rounded-xl border p-3 flex flex-col gap-2 ${ex.statut === 'PUBLIE' ? 'bg-ink-800 border-ink-700' : 'bg-ink-800/60 border-dashed border-ink-600'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  ex.statut === 'BROUILLON' ? 'bg-amber-500/20 text-amber-400' :
                                  ex.statut === 'PUBLIE'    ? 'bg-emerald-500/20 text-emerald-400' :
                                  'bg-slate-500/20 text-slate-500'
                                }`}>{ex.statut}</span>
                                {ex.deja_reussi > 0 && <span className="text-[10px] text-amber-400">🏆 Réussi</span>}
                              </div>
                              <p className="text-xs font-bold text-white truncate">{ex.titre}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {ex.nb_questions||0} questions · {ex.duree_minutes} min · {ex.note_passage}% requis
                              </p>
                              {tentativesRestantes !== null && (
                                <p className="text-[10px] text-slate-600 mt-0.5">
                                  {ex.deja_reussi ? '' : `${tentativesRestantes} tentative(s) restante(s)`}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions tuteur sur brouillon */}
                          {estTuteurExamen && ex.statut === 'BROUILLON' && (
                            <button onClick={async () => {
                              const { data } = await examensAPI.getById(ex.id)
                              setEditingExamen(data)
                              setShowCreateExamen(false)
                            }}
                              className="w-full py-1.5 rounded-xl text-xs font-semibold bg-violet-600/15 border border-violet-500/30 text-violet-400 hover:bg-violet-600/25 transition-all">
                              ✏️ Gérer les questions
                            </button>
                          )}

                          {/* Action étudiant */}
                          {!isTuteur && ex.statut === 'PUBLIE' && (
                            <>
                              {peutPasser && (tentativesRestantes === null || tentativesRestantes > 0) ? (
                                <button onClick={() => handleDemarrerExamen(ex.id)}
                                  className="w-full py-2 rounded-xl text-xs font-bold transition-all"
                                  style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'#fff' }}>
                                  ▶ Commencer l'examen
                                </button>
                              ) : ex.deja_reussi ? (
                                <div className="text-center py-1.5 rounded-xl text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                  ✅ Examen réussi — certificat disponible
                                </div>
                              ) : !avantLimite ? (
                                <div className="text-center py-1.5 rounded-xl text-xs text-slate-500 bg-ink-700 border border-ink-600">
                                  ❌ Période de passage terminée
                                </div>
                              ) : !apresDebut ? (
                                <div className="text-center py-1.5 rounded-xl text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20">
                                  ⏳ Pas encore disponible — {new Date(ex.date_debut).toLocaleDateString('fr-FR')}
                                </div>
                              ) : (
                                <div className="text-center py-1.5 rounded-xl text-xs text-slate-500 bg-ink-700 border border-ink-600">
                                  ❌ Nombre maximum de tentatives atteint
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}

                    {examens.length === 0 && (
                      <p className="text-xs text-slate-600 text-center py-4">
                        {isTuteur ? 'Aucun examen créé. Cliquez sur ➕ pour commencer.' : 'Aucun examen disponible dans cette salle.'}
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ── Fiche d'appel entrant ──────────────────────────────────────────── */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-ink-800 border border-ink-600 rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl max-w-sm w-full mx-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-violet-600/20 border-2 border-violet-500 flex items-center justify-center text-3xl">👨‍🏫</div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-ink-800 animate-pulse" />
            </div>
            <div className="text-center">
              {incomingCall.isOngoing ? (
                <>
                  <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">🔴 Appel en cours</p>
                  <p className="font-display font-bold text-white text-lg">{incomingCall.initiateurNom}</p>
                  <p className="text-sm text-slate-500 mt-1">Un appel est déjà actif dans cette salle</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-1">Appel entrant</p>
                  <p className="font-display font-bold text-white text-lg">{incomingCall.initiateurNom}</p>
                  <p className="text-sm text-slate-500 mt-1">vous invite à rejoindre l'appel</p>
                </>
              )}
            </div>
            <div className="flex gap-4 mt-2">
              <button onClick={() => refuseCallRef.current?.(incomingCall.sessionId)}
                className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 text-2xl flex items-center justify-center hover:bg-rose-500/40 transition-all active:scale-95">
                📵
              </button>
              <button onClick={() => acceptCallRef.current?.(incomingCall.sessionId)}
                className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 text-2xl flex items-center justify-center hover:bg-emerald-500/40 transition-all active:scale-95">
                📞
              </button>
            </div>
            {incomingCall.isOngoing && (
              <p className="text-xs text-slate-600 text-center">
                📞 Rejoindre · 📵 Ignorer et rester en mode observation
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal planifier */}
      <Modal open={showPlan} onClose={() => { setShowPlan(false); setPlanForm({ titre:'', matiere:'', dateDebut:'', duree:60 }); setMesTarifs([]); setMesDispos([]) }} title="📅 Planifier une séance">
        <form onSubmit={handlePlanifier} className="flex flex-col gap-4">
          <FormGroup label="Titre *">
            <input required value={planForm.titre} onChange={e => setPlanForm(f => ({...f, titre:e.target.value}))} placeholder="ex: Cours d'Algèbre" />
          </FormGroup>
          <FormGroup label="Matière">
            {mesTarifs.length > 0 ? (
              <select
                value={planForm.matiere}
                onChange={e => setPlanForm(f => ({ ...f, matiere: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: '#1a1a2e', border: '1px solid #2d2d4a', color: planForm.matiere ? '#e2e8f0' : '#64748b', fontSize: 14 }}
              >
                <option value="">— Choisir une matière —</option>
                {mesTarifs.map(t => (
                  <option key={t.id} value={t.matiere}>
                    {t.matiere} — {t.tarif_heure} DH/h
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <input
                  value={planForm.matiere}
                  onChange={e => setPlanForm(f => ({ ...f, matiere: e.target.value }))}
                  placeholder="ex: Mathématiques"
                />
                <p className="text-xs text-amber-400 mt-1">
                  ⚠️ Aucun tarif configuré. <a href="/dashboard/mes-tarifs" className="underline">Configurer mes tarifs</a> pour un calcul automatique du montant.
                </p>
              </div>
            )}
          </FormGroup>
          {/* Sélecteur de créneaux basé sur les disponibilités */}
          <FormGroup label="Créneau *">
            {mesDispos.length === 0 ? (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
                <p className="text-xs text-amber-400">
                  ⚠️ Vous n'avez pas encore configuré vos disponibilités.
                </p>
                <a href="/dashboard/mes-disponibilites" className="text-xs text-amber-300 underline mt-1 block">
                  → Configurer mes disponibilités
                </a>
              </div>
            ) : (
              (() => {
                const JOURS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
                // Générer tous les créneaux des 4 prochaines semaines à partir d'aujourd'hui
                const creneaux = []
                const now = new Date()
                for (let semaine = 0; semaine < 4; semaine++) {
                  for (const dispo of mesDispos) {
                    // jour_semaine: 1=Lundi ... 7=Dimanche (ISO)
                    const jourISO = dispo.jour_semaine
                    const today = new Date(now)
                    today.setHours(0,0,0,0)
                    // Trouver la prochaine occurrence de ce jour dans la semaine actuelle + offset
                    const todayISO = today.getDay() === 0 ? 7 : today.getDay() // 1=Lundi
                    let diff = jourISO - todayISO + semaine * 7
                    if (semaine === 0 && diff < 0) diff += 7
                    const date = new Date(today)
                    date.setDate(today.getDate() + diff)
                    // Ajouter l'heure de début
                    const [h, m] = dispo.heure_debut.split(':').map(Number)
                    date.setHours(h, m, 0, 0)
                    // Ne pas afficher les créneaux passés
                    if (date <= now) continue
                    const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T${dispo.heure_debut}`
                    creneaux.push({
                      iso,
                      label: `${JOURS[jourISO]} ${date.getDate()}/${date.getMonth()+1} — ${dispo.heure_debut} → ${dispo.heure_fin}`,
                      heureFin: dispo.heure_fin,
                      heureDebut: dispo.heure_debut,
                    })
                  }
                }
                // Trier par date
                creneaux.sort((a, b) => a.iso.localeCompare(b.iso))
                // Calculer durée auto depuis heure_debut / heure_fin quand on sélectionne
                const handleSelect = (iso) => {
                  const cr = creneaux.find(c => c.iso === iso)
                  if (!cr) return
                  const [hd, md] = cr.heureDebut.split(':').map(Number)
                  const [hf, mf] = cr.heureFin.split(':').map(Number)
                  const dureeAuto = (hf * 60 + mf) - (hd * 60 + md)
                  setPlanForm(f => ({ ...f, dateDebut: iso, duree: dureeAuto > 0 ? dureeAuto : f.duree }))
                }
                return (
                  <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                    {creneaux.length === 0 ? (
                      <p className="text-xs text-slate-500">Aucun créneau disponible dans les 4 prochaines semaines.</p>
                    ) : creneaux.map(cr => (
                      <button
                        key={cr.iso}
                        type="button"
                        onClick={() => handleSelect(cr.iso)}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all"
                        style={{
                          background: planForm.dateDebut === cr.iso
                            ? 'linear-gradient(135deg, #7c3aed22, #4f46e522)'
                            : 'var(--color-background-secondary)',
                          border: planForm.dateDebut === cr.iso
                            ? '1.5px solid #7c3aed'
                            : '1px solid var(--color-border-tertiary)',
                          color: planForm.dateDebut === cr.iso ? '#a78bfa' : 'var(--color-text-secondary)',
                          fontWeight: planForm.dateDebut === cr.iso ? 600 : 400,
                        }}
                      >
                        {planForm.dateDebut === cr.iso && <span className="mr-1.5">✓</span>}
                        {cr.label}
                      </button>
                    ))}
                  </div>
                )
              })()
            )}
          </FormGroup>
          <FormGroup label="Durée (min)">
            <input type="number" min={15} max={480} value={planForm.duree} onChange={e => setPlanForm(f => ({...f, duree:Number(e.target.value)}))} />
          </FormGroup>
          <div className="flex gap-3 justify-end pt-1">
            <Btn variant="secondary" onClick={() => setShowPlan(false)}>Annuler</Btn>
            <Btn type="submit">Planifier</Btn>
          </div>
        </form>
      </Modal>

      {/* Modal inviter tuteur */}
      <Modal open={showInviteTuteur} onClose={() => setShowInviteTuteur(false)} title="👨‍🏫 Inviter un tuteur">
        <InviteTuteurModal salleId={id} hasTuteur={hasTuteur}
          onClose={() => setShowInviteTuteur(false)}
          onSuccess={msg => success(msg)} onError={msg => error(msg)} />
      </Modal>

      {/* Modal paiement séance */}
      {paiementSeanceId && (
        <PaiementModal
          seanceId={paiementSeanceId}
          onClose={() => setPaiementSeanceId(null)}
          onSuccess={(paiement) => {
            setPaiementSeanceId(null)
            // Mettre à jour le statut de la séance localement → CONFIRMEE
            setSeances(prev => prev.map(s =>
              s.id === paiementSeanceId ? { ...s, statut: 'CONFIRMEE', statut_paiement: 'PAYE' } : s
            ))
            success('✅ Paiement confirmé — séance confirmée !')
          }}
        />
      )}
    </div>
  )
}