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

// ─── PALETTE SMARTEDU (Bleu profond + Doré) ───────────────────────────────────
const T = {
  // Fonds
  bgPage:       '#F5F0E6',      // Ivoire
  bgWhite:      '#FFFFFF',      // Blanc
  bgIvory:      '#FBF8F3',      // Ivoire clair
  bgSecondary:  '#F0EDE5',      // Ivoire foncé
  
  // Bleus SmartEdu
  blue50:       '#EBF3FA',      // Bleu très clair
  blue100:      '#D6E6F5',      // Bleu clair
  blue400:      '#4A90E2',      // Bleu ciel
  blue600:      '#2C5F8A',      // Bleu moyen
  blue800:      '#1A3A5C',      // Bleu profond
  blue900:      '#0F2A3B',      // Bleu nuit
  
  // Doré / Marron SmartEdu
  amber50:      '#F8F3E6',      // Doré très clair
  amber100:     '#F2E8CC',      // Doré clair
  amber400:     '#D4B06A',      // Doré moyen
  amber600:     '#C5A059',      // Doré principal
  amber800:     '#8B6914',      // Marron doré
  
  // Gris
  gray50:       '#F1EFE8',
  gray100:      '#D3D1C7',
  gray200:      '#B4B2A9',
  gray400:      '#888780',
  gray600:      '#5F5E5A',
  gray800:      '#444441',
  
  // Vert (succès)
  green50:      '#E8F5E9',
  green100:     '#C8E6C9',
  green600:     '#2E7D32',
  green800:     '#1B5E20',
  
  // Rouge (erreur)
  red50:        '#FFEBEE',
  red100:       '#FFCDD2',
  red600:       '#C62828',
  red800:       '#B71C1C',
  
  // Bordures
  border:       '#E0D5C0',      // Beige doré
  borderBlue:   '#D6E6F5',      // Bleu clair
  borderAmber:  '#E8D5A3',      // Doré clair
  borderGreen:  '#A5D6A7',
  borderRed:    '#EF9A9A',
  borderGray:   '#D3D1C7',
  
  // Texte
  textPrimary:  '#1A3A5C',      // Bleu profond
  textSecondary:'#6B7B8D',      // Gris bleuté
  textMuted:    '#94A3B8',
}

// ─── Styles communs réutilisables ─────────────────────────────────────────────
const S = {
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    background: T.blue600, color: '#fff', border: 'none', cursor: 'pointer',
  },
  btnSecondary: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    background: T.bgSecondary, color: T.gray800,
    border: `0.5px solid ${T.borderGray}`, cursor: 'pointer',
  },
  btnGhost: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 6, fontSize: 12,
    background: 'transparent', color: T.blue600,
    border: `0.5px solid ${T.borderBlue}`, cursor: 'pointer',
  },
  btnDanger: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
    background: T.red50, color: T.red800,
    border: `0.5px solid ${T.borderRed}`, cursor: 'pointer',
  },
  btnSuccess: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
    background: T.green50, color: T.green800,
    border: `0.5px solid ${T.borderGreen}`, cursor: 'pointer',
  },
  btnFullPrimary: {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
    background: T.blue600, color: '#fff', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  btnFullSecondary: {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
    background: T.blue50, color: T.blue800,
    border: `0.5px solid ${T.borderBlue}`, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  btnFullDanger: {
    width: '100%', padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
    background: T.red50, color: T.red800,
    border: `0.5px solid ${T.borderRed}`, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  btnFullAmber: {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
    background: T.amber50, color: T.amber800,
    border: `0.5px solid ${T.borderAmber}`, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  badgeBlue:   { fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, background: T.blue50,   color: T.blue800,   border: `0.5px solid ${T.borderBlue}` },
  badgeAmber:  { fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, background: T.amber50,  color: T.amber800,  border: `0.5px solid ${T.borderAmber}` },
  badgeGreen:  { fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, background: T.green50,  color: T.green800,  border: `0.5px solid ${T.borderGreen}` },
  badgeRed:    { fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, background: T.red50,    color: T.red800,    border: `0.5px solid ${T.borderRed}` },
  badgeGray:   { fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, background: T.gray50,   color: T.gray800,   border: `0.5px solid ${T.borderGray}` },
  card: {
    background: T.bgIvory, border: `0.5px solid ${T.border}`,
    borderRadius: 10, padding: '10px 12px', marginBottom: 8,
  },
  cardBlue: {
    background: T.blue50, border: `0.5px solid ${T.borderBlue}`,
    borderRadius: 10, padding: '10px 12px', marginBottom: 8,
  },
  input: {
    width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13,
    background: T.bgPage, border: `0.5px solid ${T.borderGray}`,
    color: T.textPrimary, outline: 'none',
  },
  inputSm: {
    width: '100%', padding: '5px 8px', borderRadius: 6, fontSize: 12,
    background: T.bgPage, border: `0.5px solid ${T.borderGray}`,
    color: T.textPrimary, outline: 'none',
  },
  select: {
    width: '100%', padding: '5px 8px', borderRadius: 6, fontSize: 12,
    background: T.bgPage, border: `0.5px solid ${T.borderGray}`,
    color: T.textPrimary, outline: 'none',
  },
  textarea: {
    width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 12,
    background: T.bgPage, border: `0.5px solid ${T.borderGray}`,
    color: T.textPrimary, outline: 'none', resize: 'none',
  },
}

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

// ─── Avatar initiales ─────────────────────────────────────────────────────────
function InitialsAvatar({ prenom, nom, size = 30, colorIdx = 0 }) {
  const palettes = [
    { bg: T.blue50,  color: T.blue800  },
    { bg: T.amber50, color: T.amber800 },
    { bg: T.green50, color: T.green800 },
    { bg: T.gray50,  color: T.gray800  },
  ]
  const p = palettes[colorIdx % palettes.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: p.bg, color: p.color,
      border: `0.5px solid ${T.borderGray}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 500, flexShrink: 0,
    }}>
      {prenom?.[0]?.toUpperCase()}{nom?.[0]?.toUpperCase()}
    </div>
  )
}

// ─── Panneau d'appel flottant ─────────────────────────────────────────────────
function CallPanel({ callParticipants, isMuted, onToggleMute, onEnd, onLeave, canEnd, callTime, isSharing, onShareToggle, isTuteur }) {
  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 40,
      background: T.bgWhite, border: `1px solid ${T.borderAmber}`,
      borderRadius: 14, padding: 14, width: 260,
      display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: `0 2px 16px rgba(197,160,89,0.1)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.green600, display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: T.green800, textTransform: 'uppercase', letterSpacing: 1 }}>Appel en cours</span>
        </div>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: T.textMuted, background: T.gray50, padding: '2px 8px', borderRadius: 6, border: `0.5px solid ${T.borderGray}` }}>{callTime}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 130, overflowY: 'auto' }}>
        {callParticipants.length === 0 ? (
          <p style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', padding: '6px 0' }}>En attente de participants…</p>
        ) : callParticipants.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 8px', borderRadius: 8,
            background: T.bgPage, border: `0.5px solid ${T.border}`,
          }}>
            <InitialsAvatar prenom={p.prenom} nom={p.nom} size={26} colorIdx={0} />
            <span style={{ fontSize: 12, fontWeight: 500, color: T.textPrimary, flex: 1 }}>
              {p.prenom} {p.nom}{p.isMe && <span style={{ color: T.amber600, marginLeft: 4, fontSize: 10 }}>(vous)</span>}
            </span>
            <span style={{ fontSize: 13 }}>{p.muted ? '🔇' : '🎙️'}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, paddingTop: 8, borderTop: `0.5px solid ${T.border}` }}>
        <button onClick={onToggleMute} style={{
          flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer',
          background: isMuted ? T.red50 : T.gray50,
          color: isMuted ? T.red800 : T.gray800,
          border: `0.5px solid ${isMuted ? T.borderRed : T.borderGray}`,
        }}>
          {isMuted ? '🔇' : '🎙️'}
        </button>

        {isTuteur && (
          <button onClick={onShareToggle} style={{
            flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            background: isSharing ? T.blue50 : T.gray50,
            color: isSharing ? T.blue800 : T.gray800,
            border: `0.5px solid ${isSharing ? T.borderBlue : T.borderGray}`,
          }}>
            {isSharing ? '⏹' : '🖥️'}
          </button>
        )}

        {canEnd ? (
          <button onClick={onEnd} style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: T.red50, color: T.red800, border: `0.5px solid ${T.borderRed}` }}>📵</button>
        ) : (
          <button onClick={onLeave} style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: T.gray50, color: T.gray800, border: `0.5px solid ${T.borderGray}` }}>🚪</button>
        )}
      </div>
    </div>
  )
}

// ─── Fenêtre partage d'écran ──────────────────────────────────────────────────
function ScreenShareViewer({ sharerNom, videoRef, onClose }) {
  const [mode, setMode] = useState('normal')
  const containerRef = useRef(null)

  const enterFullscreen = () => { containerRef.current?.requestFullscreen?.(); setMode('fullscreen') }
  const exitFullscreen  = () => { if (document.fullscreenElement) document.exitFullscreen(); setMode('normal') }

  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement && mode === 'fullscreen') setMode('normal') }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [mode])

  const dragRef    = useRef(null)
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const [pos, setPos] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 220 })

  const onMouseDown = (e) => {
    isDragging.current = true
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }
  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return
      setPos({ x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.current.x)), y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.current.y)) })
    }
    const onUp = () => { isDragging.current = false }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  if (mode === 'minimized') return (
    <div ref={dragRef} style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9998, width: 300, borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.borderAmber}`, background: T.bgWhite, userSelect: 'none' }}>
      <div onMouseDown={onMouseDown} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: T.amber50, cursor: 'grab', borderBottom: `0.5px solid ${T.borderAmber}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber600 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: T.amber800 }}>🖥️ {sharerNom}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setMode('normal')} style={{ ...S.btnGhost, padding: '2px 6px', fontSize: 11 }}>⛶</button>
          <button onClick={onClose} style={{ padding: '2px 6px', borderRadius: 6, background: T.red50, color: T.red800, border: `0.5px solid ${T.borderRed}`, fontSize: 11, cursor: 'pointer' }}>✕</button>
        </div>
      </div>
      <div style={{ position: 'relative', background: T.bgPage, height: 168 }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        <div onClick={() => setMode('normal')} style={{ position: 'absolute', inset: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
      </div>
      <div style={{ padding: '4px 10px', background: T.bgPage, textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: T.textMuted }}>Glisser · Cliquer pour agrandir</p>
      </div>
    </div>
  )

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'rgba(26,58,92,0.85)', zIndex: 9998 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: T.bgWhite, borderBottom: `1px solid ${T.borderAmber}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.blue600 }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: T.textPrimary }}>🖥️ Écran partagé par <span style={{ color: T.amber600 }}>{sharerNom}</span></span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setMode('minimized')} style={{ ...S.btnSecondary, fontSize: 12 }}>▼ Minimiser</button>
          {mode !== 'fullscreen'
            ? <button onClick={enterFullscreen} style={{ ...S.btnSecondary, fontSize: 12 }}>⛶ Plein écran</button>
            : <button onClick={exitFullscreen}  style={{ ...S.btnSecondary, fontSize: 12 }}>⊡ Réduire</button>}
          <button onClick={onClose} style={{ ...S.btnDanger, fontSize: 12 }}>✕ Fermer</button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 10, border: `1px solid ${T.borderAmber}`, objectFit: 'contain', background: T.bgPage, width: '100%', height: '100%' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 0', borderTop: `0.5px solid rgba(232,228,217,0.3)`, flexShrink: 0 }}>
        <p style={{ fontSize: 12, color: T.textMuted }}>Lecture seule</p>
        <span style={{ color: T.textMuted }}>·</span>
        <button onClick={() => setMode('minimized')} style={{ fontSize: 12, color: T.blue600, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>▼ Minimiser pour accéder au tableau blanc</button>
      </div>
    </div>
  )
}

// ─── Modal inviter tuteur ─────────────────────────────────────────────────────
function InviteTuteurModal({ salleId, hasTuteur, onClose, onSuccess, onError }) {
  const [tuteurs,   setTuteurs]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState('')
  const [sending,   setSending]   = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    tuteursAPI.getAll().then(({ data }) => setTuteurs(data)).finally(() => setLoading(false))
  }, [])

  const doSend = async () => {
    setSending(true)
    try {
      await invitationsAPI.send({ salleId, destinataireId: Number(selected), typeInvitation: 'VERS_TUTEUR' })
      onSuccess('Invitation envoyée au tuteur !'); onClose()
    } catch (err) { onError(err.response?.data?.error || "Erreur lors de l'envoi") }
    finally { setSending(false) }
  }

  const handleSend = () => {
    if (!selected) return onError('Choisissez un tuteur')
    if (hasTuteur && !confirmed) { setConfirmed(true); return }
    doSend()
  }

  if (confirmed) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: T.amber50, border: `0.5px solid ${T.borderAmber}`, borderRadius: 10, padding: 14, display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: T.amber800, marginBottom: 4 }}>Cette salle a déjà un tuteur</p>
          <p style={{ fontSize: 12, color: T.textSecondary }}>L'ancien tuteur sera retiré dès que le nouveau accepte.</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => setConfirmed(false)} style={S.btnSecondary}>← Retour</button>
        <button onClick={doSend} disabled={sending} style={S.btnPrimary}>{sending ? 'Envoi...' : '✅ Confirmer'}</button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {hasTuteur && (
        <div style={{ background: T.amber50, border: `0.5px solid ${T.borderAmber}`, borderRadius: 8, padding: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>⚠️</span>
          <p style={{ fontSize: 12, color: T.amber800 }}>Cette salle a déjà un tuteur. Le sélectionner le remplacera.</p>
        </div>
      )}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <span style={{ fontSize: 13, color: T.textMuted }}>Chargement...</span>
        </div>
      ) : tuteurs.length === 0 ? (
        <p style={{ fontSize: 13, color: T.textMuted, background: T.bgPage, borderRadius: 10, padding: 12, textAlign: 'center' }}>Aucun tuteur disponible.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
          {tuteurs.map((t, i) => {
            const sel = selected === String(t.id)
            return (
              <button key={t.id} type="button" onClick={() => setSelected(String(t.id))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: 10, borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                  background: sel ? T.blue50 : T.bgPage,
                  border: `${sel ? '1.5' : '0.5'}px solid ${sel ? T.blue600 : T.borderGray}`,
                  transition: 'all 0.15s',
                }}>
                <InitialsAvatar prenom={t.prenom} nom={t.nom} size={34} colorIdx={i} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.prenom} {t.nom}</p>
                  {t.specialites?.length > 0 && <p style={{ fontSize: 11, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.specialites.slice(0, 3).join(', ')}</p>}
                </div>
                {sel && <span style={{ color: T.blue600, fontWeight: 500 }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: `0.5px solid ${T.border}` }}>
        <button onClick={onClose} style={S.btnSecondary}>Annuler</button>
        <button onClick={handleSend} disabled={!selected || sending} style={{ ...S.btnPrimary, opacity: (!selected || sending) ? 0.5 : 1 }}>
          {sending ? 'Envoi...' : hasTuteur ? '🔄 Remplacer' : '✉️ Inviter'}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Salle() {
  const { id }   = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
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

  const [examens,          setExamens]         = useState([])
  const [examensLoaded,    setExamensLoaded]   = useState(false)
  const [showCreateExamen, setShowCreateExamen]= useState(false)
  const [examForm,         setExamForm]        = useState({ titre: '', description: '', notePassage: 70, dureeMinutes: 30, maxTentatives: '', dateDebut: '', dateLimite: '', dateAffichageResultats: '', modeAffichage: 'UNE_PAR_UNE' })
  const [editingExamen,    setEditingExamen]   = useState(null)
  const [questionForm,     setQuestionForm]    = useState({ texte: '', type: 'QCM', points: 1, reponses: [{ texte: '', estCorrecte: false }, { texte: '', estCorrecte: false }] })
  const [savingExamen,     setSavingExamen]    = useState(false)
  const [tentativeActive,  setTentativeActive] = useState(null)
  const [reponsesEnCours,  setReponsesEnCours] = useState({})
  const [resultats,        setResultats]       = useState(null)
  const [showConfirmSoum,  setShowConfirmSoum] = useState(false)
  const [timerLeft,        setTimerLeft]       = useState(null)

  const [activeCall,       setActiveCall]      = useState(null)
  const [callParticipants, setCallParticipants]= useState([])
  const [isMuted,          setIsMuted]         = useState(false)
  const [incomingCall,     setIncomingCall]    = useState(null)

  const [isSharing,        setIsSharing]       = useState(false)
  const [screenShare,      setScreenShare]     = useState(null)
  const [screenStream,     setScreenStream]    = useState(null)

  const [showPlan,         setShowPlan]        = useState(false)
  const [planForm,         setPlanForm]        = useState({ titre: '', matiere: '', dateDebut: '', duree: 60 })
  const [mesTarifs,        setMesTarifs]       = useState([])
  const [mesDispos,        setMesDispos]       = useState([])
  const [showInviteTuteur, setShowInviteTuteur]= useState(false)
  const [paiementSeanceId, setPaiementSeanceId]= useState(null)

  const callTime = useCallTimer(!!activeCall)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const peersRef        = useRef({})
  const screenPeersRef  = useRef({})
  const streamRef       = useRef(null)
  const screenStreamRef = useRef(null)
  const screenVideoRef  = useRef(null)
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
        try {
          const { data: examData } = await examensAPI.getBySalle(id)
          setExamens(examData); setExamensLoaded(true)
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
    streamRef.current = stream; return stream
  }

  const createPeerConnection = (targetUserId) => {
    if (peersRef.current[targetUserId]) { peersRef.current[targetUserId].close(); delete peersRef.current[targetUserId] }
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] })
    pc.onicecandidate = (e) => { if (e.candidate) sendIce(targetUserId, e.candidate) }
    pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState === 'failed') pc.restartIce() }
    pc.ontrack = (e) => {
      const audioId = `remote-audio-${targetUserId}`
      let audio = document.getElementById(audioId)
      if (!audio) { audio = document.createElement('audio'); audio.id = audioId; audio.autoplay = true; audio.setAttribute('playsinline', ''); document.body.appendChild(audio) }
      audio.srcObject = e.streams[0]
    }
    peersRef.current[targetUserId] = pc; return pc
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
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    sessionRef.current = null; setCallParticipants([])
    document.querySelectorAll('[id^="remote-audio-"]').forEach(el => el.remove())
  }, [])

  // ── WebRTC Screen sharing helpers ─────────────────────────────────────────
  const createScreenPeerConnection = (targetUserId) => {
    if (screenPeersRef.current[targetUserId]) { screenPeersRef.current[targetUserId].close(); delete screenPeersRef.current[targetUserId] }
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] })
    pc.onicecandidate = (e) => { if (e.candidate) sendScreenIce(targetUserId, e.candidate) }
    pc.ontrack = (e) => { if (screenVideoRef.current) screenVideoRef.current.srcObject = e.streams[0] }
    screenPeersRef.current[targetUserId] = pc; return pc
  }

  const shareScreenToPeer = async (targetUserId) => {
    try {
      const stream = screenStreamRef.current; if (!stream) return
      const pc = createScreenPeerConnection(targetUserId)
      stream.getTracks().forEach(t => pc.addTrack(t, stream))
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer); sendScreenOffer(targetUserId, offer)
    } catch (err) { console.error('shareScreenToPeer error:', err) }
  }

  const handleStartScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 15, max: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      screenStreamRef.current = stream; setScreenStream(stream); setIsSharing(true)
      startScreenShare(id)
      const myId = userRef.current?.id
      const others = participantsRef.current.filter(p => String(p.id) !== String(myId))
      for (const p of others) await shareScreenToPeer(p.id)
      stream.getVideoTracks()[0].addEventListener('ended', () => handleStopScreenShare())
      success('Partage d\'écran démarré !')
    } catch (err) {
      if (err.name !== 'NotAllowedError') error('Impossible de partager l\'écran.')
    }
  }

  const handleStopScreenShare = useCallback(() => {
    if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t => t.stop()); screenStreamRef.current = null }
    setScreenStream(null); setIsSharing(false)
    Object.values(screenPeersRef.current).forEach(pc => { try { pc.close() } catch (_) {} })
    screenPeersRef.current = {}; stopScreenShare(id)
    success('Partage d\'écran arrêté.')
  }, [id])

  const addToCallParticipants = useCallback((userId, muted = false) => {
    const p = participantsRef.current.find(p => String(p.id) === String(userId)); if (!p) return
    const isMe = String(userId) === String(userRef.current?.id)
    setCallParticipants(prev => {
      if (prev.some(x => String(x.id) === String(userId))) return prev
      return [...prev, { id: userId, prenom: p.prenom, nom: p.nom, muted, isMe }]
    })
  }, [])

  // ── Socket events ─────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket(); if (!socket) return
    joinSalle(id)

    const handleMessage   = (msg) => setMessages(prev => [...prev, msg])
    const handleJoin      = ({ userId, prenom, nom }) => setParticipants(prev => prev.some(p => p.id === userId) ? prev : [...prev, { id: userId, prenom, nom }])
    const handleLeave     = ({ userId }) => { setParticipants(prev => prev.filter(p => p.id !== userId)); setCallParticipants(prev => prev.filter(p => String(p.id) !== String(userId))) }
    const handleSeanceUpd = ({ seanceId, statut }) => setSeances(prev => prev.map(s => s.id === seanceId ? { ...s, statut } : s))

    socket.on('chat:message', handleMessage)
    socket.on('salle:user-joined', handleJoin)
    socket.on('salle:user-left', handleLeave)
    socket.on('seance:updated', handleSeanceUpd)

    socket.on('call:active', ({ sessionId, initiateurNom }) => {
      if (!sessionId) return
      if (!sessionRef.current && !activeCallRef.current) setIncomingCall({ sessionId, initiateurNom: initiateurNom || 'Tuteur', isOngoing: true })
    })

    const handleCallStarted = ({ sessionId, initiateur, initiateurNom }) => {
      const myUserId = userRef.current?.id
      const isInit = myUserId != null && String(initiateur) === String(myUserId)
      if (isInit) {
        setActiveCall(sessionId); sessionRef.current = sessionId
        joinCall(id, sessionId)
        setTimeout(() => addToCallParticipants(myUserId, false), 100)
        getLocalStream().catch(() => error("Impossible d'accéder au microphone."))
      } else {
        if (!sessionRef.current) setIncomingCall({ sessionId, initiateurNom: initiateurNom || 'Tuteur' })
      }
    }

    const handleCallUserJoined = async ({ userId }) => {
      if (!sessionRef.current) return
      const myId = userRef.current?.id
      if (!myId || String(myId) === String(userId)) return
      if (!activeCallRef.current) return
      addToCallParticipants(userId, false)
      if (peersRef.current[userId]) return
      await callPeer(userId, sessionRef.current)
      if (screenStreamRef.current) await shareScreenToPeer(userId)
    }

    const handleOffer = async ({ fromUserId, offer, sessionId }) => {
      try {
        const stream = await getLocalStream()
        const pc = createPeerConnection(fromUserId)
        stream.getTracks().forEach(t => pc.addTrack(t, stream))
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer); sendAnswer(fromUserId, answer, sessionId)
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

    const handleScreenStarted = ({ sharerId, sharerNom }) => {
      const myId = userRef.current?.id
      if (String(sharerId) === String(myId)) return
      setScreenShare({ sharerId, sharerNom })
    }

    const handleScreenStopped = () => {
      setScreenShare(null)
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null
      Object.values(screenPeersRef.current).forEach(pc => { try { pc.close() } catch (_) {} })
      screenPeersRef.current = {}
    }

    const handleScreenOffer = async ({ fromUserId, offer }) => {
      try {
        const pc = createScreenPeerConnection(fromUserId)
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer); sendScreenAnswer(fromUserId, answer)
      } catch (err) { console.error('screen offer error:', err) }
    }

    const handleScreenAnswer = async ({ fromUserId, answer }) => {
      try {
        const pc = screenPeersRef.current[fromUserId]
        if (pc && pc.signalingState !== 'stable') await pc.setRemoteDescription(new RTCSessionDescription(answer))
      } catch (err) { console.error('screen answer error:', err) }
    }

    const handleScreenIce = async ({ fromUserId, candidate }) => {
      try {
        const pc = screenPeersRef.current[fromUserId]
        if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) { console.error('screen ice error:', err) }
    }

    const handleUserMuted        = ({ userId, muted }) => setCallParticipants(prev => prev.map(p => String(p.id) === String(userId) ? { ...p, muted } : p))
    const handleUserDisconnected = ({ userId }) => setCallParticipants(prev => prev.filter(p => String(p.id) !== String(userId)))
    const handleCallEnded        = () => { setActiveCall(null); setIncomingCall(null); stopCall(); handleStopScreenShare() }
    const handleCallYouLeft      = () => { setActiveCall(null); setIncomingCall(null); stopCall() }

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
      socket.off('chat:message'); socket.off('salle:user-joined'); socket.off('salle:user-left'); socket.off('seance:updated')
      socket.off('call:active'); socket.off('call:started'); socket.off('call:user-joined'); socket.off('call:offer')
      socket.off('call:answer'); socket.off('call:ice-candidate'); socket.off('screen:started'); socket.off('screen:stopped')
      socket.off('screen:offer'); socket.off('screen:answer'); socket.off('screen:ice'); socket.off('call:user-muted')
      socket.off('call:user-disconnected'); socket.off('call:ended'); socket.off('call:you-left')
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

  const loadExamens = useCallback(async () => {
    try {
      const { data } = await examensAPI.getBySalle(id)
      setExamens(data); setExamensLoaded(true)
    } catch { setExamensLoaded(true) }
  }, [id])

  const handleSaveExamen = async (e) => {
    e.preventDefault(); setSavingExamen(true)
    try {
      if (editingExamen && editingExamen.statut === 'BROUILLON' && editingExamen.id) {
        const { data } = await examensAPI.update(editingExamen.id, { ...examForm })
        setExamens(prev => prev.map(ex => ex.id === editingExamen.id ? { ...ex, ...data } : ex))
        setEditingExamen({ ...editingExamen, ...data }); success('Examen mis à jour')
      } else {
        const { data } = await examensAPI.create({ ...examForm, salleId: id })
        setExamens(prev => [data, ...prev]); setEditingExamen(data); setShowCreateExamen(false)
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
      success('🚀 Examen publié !')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault(); if (!editingExamen?.id) return
    const hasCorrect = questionForm.reponses.some(r => r.estCorrecte)
    if (!hasCorrect) { error('Cochez au moins une bonne réponse'); return }
    const reponsesFilled = questionForm.reponses.filter(r => r.texte.trim())
    if (reponsesFilled.length < 2) { error('Ajoutez au moins 2 réponses'); return }
    try {
      const { data } = await examensAPI.addQuestion(editingExamen.id, { texte: questionForm.texte, type: questionForm.type, points: questionForm.points, reponses: reponsesFilled })
      setEditingExamen(prev => ({ ...prev, questions: [...(prev.questions || []), data] }))
      setExamens(prev => prev.map(ex => ex.id === editingExamen.id ? { ...ex, nb_questions: (ex.nb_questions || 0) + 1 } : ex))
      setQuestionForm({ texte: '', type: 'QCM', points: 1, reponses: [{ texte: '', estCorrecte: false }, { texte: '', estCorrecte: false }] })
      success('Question ajoutée')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleDeleteQuestion = async (qid) => {
    try {
      await examensAPI.deleteQuestion(editingExamen.id, qid)
      setEditingExamen(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== qid) }))
      setExamens(prev => prev.map(ex => ex.id === editingExamen.id ? { ...ex, nb_questions: Math.max(0, (ex.nb_questions || 1) - 1) } : ex))
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleDemarrerExamen = async (examenId) => {
    try {
      const { data } = await examensAPI.demarrer(examenId)
      const tentative = data.tentative; const examen = data.examen
      const { data: examDetail } = await examensAPI.getById(examenId)
      const questions = (examDetail.questions || []).map(q => ({ ...q, reponses: (q.reponses || []).map(r => ({ ...r, id: Number(r.id) })) }))
      if (!questions.length) { error('Cet examen ne contient aucune question.'); return }
      setTentativeActive({ tentative, examen: { ...examen, mode_affichage: examDetail.mode_affichage }, questions, currentIdx: 0, expiresAt: new Date(tentative.expires_at) })
      setReponsesEnCours({}); setResultats(null)
      const msLeft = new Date(tentative.expires_at) - Date.now()
      setTimerLeft(Math.max(0, Math.floor(msLeft / 1000)))
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  useEffect(() => {
    if (timerLeft === null) return
    if (timerLeft <= 0) { handleSoumettreExamen(true); return }
    const t = setTimeout(() => setTimerLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timerLeft])

  const fmtTimer = (s) => {
    if (s === null) return ''
    const m = Math.floor(s / 60); const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const handleSelectReponse = (questionId, reponseId) => setReponsesEnCours(prev => ({ ...prev, [String(questionId)]: Number(reponseId) }))

  const handleSoumettreExamen = async (autoExpire = false) => {
    if (!tentativeActive) return
    try {
      const reponses = Object.entries(reponsesEnCours).map(([questionId, reponseId]) => ({ questionId: parseInt(questionId), reponseId: parseInt(reponseId) }))
      const { data } = await examensAPI.soumettre(tentativeActive.tentative.id, reponses)
      setResultats(data); setTentativeActive(null); setTimerLeft(null); setShowConfirmSoum(false)
      await loadExamens()
      data.reussi && data.certificat ? success('🏆 Félicitations ! Certificat généré !') : error(`Score : ${data.pourcentage}% — Note de passage : ${data.notePassage}%`)
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handlePlanifier = async (e) => {
    e.preventDefault()
    try {
      const { data } = await seancesAPI.create({ ...planForm, salleId: id })
      setSeances(prev => [...prev, data]); setShowPlan(false); success('Séance planifiée !')
      const dateStr = new Date(planForm.dateDebut).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      sendMessage(id, `📅 Séance planifiée : ${planForm.titre} le ${dateStr} (${planForm.duree} min). seance_id:${data.id}`)
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleAnnulerSeance = async (seanceId) => {
    if (!confirm('Annuler cette séance ?')) return
    try {
      await seancesAPI.annuler(seanceId)
      setSeances(prev => prev.map(s => s.id === seanceId ? { ...s, statut: 'ANNULEE' } : s))
      success('Séance annulée.'); sendMessage(id, '❌ Séance annulée par le tuteur.')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleToggleMute = () => {
    setIsMuted(m => {
      const newMuted = !m; toggleMute(activeCall, newMuted)
      const myId = userRef.current?.id
      if (myId) setCallParticipants(prev => prev.map(p => String(p.id) === String(myId) ? { ...p, muted: newMuted } : p))
      return newMuted
    })
  }

  const handleEndCall  = () => { endCall(id, activeCall); setActiveCall(null); stopCall(); if (isSharing) handleStopScreenShare() }
  const handleLeaveCall = () => { getSocket()?.emit('call:leave', { sessionId: activeCall }); setActiveCall(null); stopCall() }
  const handleShareToggle = () => { isSharing ? handleStopScreenShare() : handleStartScreenShare() }

  // ── Rôles & labels ────────────────────────────────────────────────────────
  const isTuteur  = user?.role === 'tuteur' && myRole === 'CO_ADMIN'
  const isAdmin   = myRole === 'ADMIN'
  const hasTuteur = salle?.statut === 'ACTIVE_AVEC_TUTEUR'
  const canCall   = isTuteur || (isAdmin && !hasTuteur)

  const statutBadgeStyle = {
    PLANIFIEE:             S.badgeAmber,
    EN_ATTENTE_PAIEMENT:   S.badgeAmber,
    CONFIRMEE:             S.badgeBlue,
    EN_COURS:              S.badgeBlue,
    REALISEE:              S.badgeGreen,
    ANNULEE:               S.badgeRed,
  }
  const statutLabel = {
    PLANIFIEE:             'Planifiée',
    EN_ATTENTE_PAIEMENT:   '⏳ En attente paiement',
    CONFIRMEE:             '✅ Confirmée',
    EN_COURS:              '🔴 En cours',
    REALISEE:              '✅ Réalisée',
    ANNULEE:               '❌ Annulée',
  }

  const tabConfig = [
    { id: 'participants', icon: '👥', label: `${participants.length}` },
    { id: 'fichiers',     icon: '📁', label: `${fichiers.length}` },
    { id: 'seances',      icon: '📅', label: `${seances.length}` },
    { id: 'examens',      icon: '📝', label: `${examens.length}` },
  ]

  if (loading) return (
    <div style={{ height: '100vh', background: T.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size="lg" />
    </div>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.bgPage, overflow: 'hidden' }}>
      <ToastContainer toasts={toasts} />

      {/* ── Panneau appel flottant ───────────────────────────────────────── */}
      {activeCall && (
        <CallPanel
          callParticipants={callParticipants} isMuted={isMuted}
          onToggleMute={handleToggleMute} onEnd={handleEndCall} onLeave={handleLeaveCall}
          canEnd={canCall} callTime={callTime} isSharing={isSharing}
          onShareToggle={handleShareToggle} isTuteur={isTuteur}
        />
      )}

      {/* ── Partage d'écran ──────────────────────────────────────────────── */}
      {screenShare && (
        <ScreenShareViewer sharerNom={screenShare.sharerNom} videoRef={screenVideoRef} onClose={() => setScreenShare(null)} />
      )}

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{ height: 80, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: T.blue300 , borderBottom: `1px solid ${T.borderAmber}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <button onClick={() => navigate('/dashboard')} style={S.btnGhost}>← Retour</button>
          <div style={{ width: 1, height: 20, background: T.borderAmber }} />
          <span style={{ fontSize: 20, fontWeight: 1000, color: T.blue400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{salle?.nom}</span>
          {salle?.matiere && <span style={{ fontSize: 20, color: T.amber600 }}>📖 {salle.matiere}</span>}
          <span style={hasTuteur ? S.badgeBlue : S.badgeGray}>
            {hasTuteur ? '👨‍🏫 Avec tuteur' : '📚 Sans tuteur'}
          </span>
          {screenShare && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: T.amber50, border: `0.5px solid ${T.borderAmber}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber600 }} />
              <span style={{ fontSize: 11, color: T.amber800, fontWeight: 500 }}>Écran partagé</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!activeCall && canCall && (
            <button onClick={() => startCall(id, null)} style={S.btnSuccess}>📞 Appel</button>
          )}
          <button onClick={handleQuitter} style={S.btnSecondary}>🚪 Quitter</button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Chat */}
        <div style={{ width: 256, flexShrink: 0, borderRight: `1px solid ${T.borderAmber}`, display: 'flex', flexDirection: 'column', background: T.bgWhite }}>
          <Chat
            messages={messages}
            onSend={(c) => sendMessage(id, c)}
            currentUser={user}
            isAdmin={isAdmin}
            onPayer={(seanceId) => setPaiementSeanceId(seanceId)}
            seances={seances}
          />
        </div>

        {/* Tableau blanc */}
        <div style={{ flex: 1, overflow: 'hidden', background: T.blue500 }}>
          <Whiteboard salleId={id} isTuteur={isTuteur} />
        </div>

        {/* Panneau droit */}
        <div style={{ width: 240, flexShrink: 0, borderLeft: `1px solid ${T.borderAmber}`, display: 'flex', flexDirection: 'column', background: T.blue100 }}>

         {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.borderAmber}`, flexShrink: 0, background: T.blue100 }}>
            {tabConfig.map(t => (
              <button key={t.id} onClick={() => setRightTab(t.id)}
                style={{
                  flex: 1, padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  fontSize: 11, cursor: 'pointer',
                  background: rightTab === t.id ? T.bgWhite : 'transparent',
                  color: rightTab === t.id ? T.amber600 : T.textMuted,
                  borderBottom: `2px solid ${rightTab === t.id ? T.amber600 : 'transparent'}`,
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>


          {/* ── Participants ── */}
          {rightTab === 'participants' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {isAdmin && (
                <button onClick={() => setShowInviteTuteur(true)} style={{ ...S.btnFullSecondary, marginBottom: 4 }}>
                  ➕ Inviter un tuteur
                </button>
              )}
              {participants.map((p, i) => {
                const inCall = callParticipants.some(cp => String(cp.id) === String(p.id))
                const isTuteurRole = p.role === 'tuteur' || p.role_salle === 'CO_ADMIN'
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, border: `0.5px solid transparent`, transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.cssText += `background:${T.bgPage};border-color:${T.border}`}
                    onMouseLeave={e => e.currentTarget.style.cssText += 'background:transparent;border-color:transparent'}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <InitialsAvatar prenom={p.prenom} nom={p.nom} size={30} colorIdx={i} />
                      {inCall && <span style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, background: T.green600, borderRadius: '50%', border: `1.5px solid ${T.bgWhite}` }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.prenom} {p.nom} {p.id === user?.id && <span style={{ color: T.amber600, fontSize: 10 }}>(vous)</span>}
                      </p>
                      <p style={{ fontSize: 11, color: isTuteurRole ? T.amber800 : T.textMuted, textTransform: 'capitalize', fontWeight: isTuteurRole ? 500 : 400 }}>
                        {p.role_salle?.toLowerCase() || (isTuteurRole ? 'tuteur' : 'étudiant')}
                      </p>
                    </div>
                    {inCall && <span style={{ fontSize: 12, flexShrink: 0, color: T.green600 }}>🎙️</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Fichiers ── */}
          {rightTab === 'fichiers' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 8, border: `0.5px dashed ${T.borderAmber}`, fontSize: 12, color: T.amber600, cursor: 'pointer', background: T.amber50 }}>
                ⬆️ Uploader un fichier
                <input type="file" style={{ display: 'none' }} onChange={uploadFichier} />
              </label>
              {fichiers.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: T.bgIvory, border: `0.5px solid ${T.border}` }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{f.nom_fichier}</p>
                    <p style={{ fontSize: 11, color: T.textMuted }}>{f.uploader_nom}</p>
                  </div>
                  <a href={`http://localhost:5000/${f.url_telechargement}`} download
                    style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: T.amber50, color: T.amber800, border: `0.5px solid ${T.borderAmber}`, textDecoration: 'none', flexShrink: 0 }}>⬇</a>
                </div>
              ))}
              {fichiers.length === 0 && <p style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: '16px 0' }}>Aucun fichier partagé</p>}
            </div>
          )}

          {/* ── Séances ── */}
          {rightTab === 'seances' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {isTuteur && (
                <button onClick={async () => {
                  setShowPlan(true)
                  try {
                    const [tarifsRes, disposRes] = await Promise.all([tarifsAPI.getMesTarifs(), seancesAPI.getDisponibilites()])
                    setMesTarifs(tarifsRes.data); setMesDispos(disposRes.data)
                    if (tarifsRes.data.length === 1) setPlanForm(f => ({ ...f, matiere: tarifsRes.data[0].matiere }))
                  } catch { setMesTarifs([]); setMesDispos([]) }
                }} style={{ ...S.btnFullSecondary, marginBottom: 2 }}>
                  ➕ Planifier une séance
                </button>
              )}
              {seances.map(s => (
                <div key={s.id} style={S.card}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: T.textPrimary, marginBottom: 3 }}>{s.titre}</p>
                  <p style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>
                    {new Date(s.date_debut).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {s.duree} min
                  </p>
                  <span style={statutBadgeStyle[s.statut] || S.badgeGray}>{statutLabel[s.statut] || s.statut}</span>
                  {s.montant_total > 0 && <p style={{ fontSize: 12, color: T.amber600, fontWeight: 500, marginTop: 4 }}>💰 {s.montant_total} DH</p>}

                  {isAdmin && (s.statut === 'EN_ATTENTE_PAIEMENT' || s.statut_paiement === 'PAYE' || s.statut === 'CONFIRMEE') && (
                    <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: s.statut_paiement === 'PAYE' || s.statut === 'CONFIRMEE' ? T.green50 : T.amber50, border: `0.5px solid ${s.statut_paiement === 'PAYE' || s.statut === 'CONFIRMEE' ? T.borderGreen : T.borderAmber}` }}>
                      {s.statut_paiement === 'PAYE' || s.statut === 'CONFIRMEE' ? (
                        <>
                          <p style={{ fontSize: 11, color: T.green800, marginBottom: 6 }}>✅ Séance payée</p>
                          <button disabled style={{ ...S.btnFullPrimary, background: T.green50, color: T.green800, border: `0.5px solid ${T.borderGreen}`, opacity: 0.7, cursor: 'not-allowed' }}>✅ Payé</button>
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: 11, color: T.amber800, marginBottom: 6 }}>⚠️ En attente de votre paiement</p>
                          <button onClick={() => setPaiementSeanceId(s.id)} style={S.btnFullPrimary}>💳 Payer maintenant</button>
                        </>
                      )}
                    </div>
                  )}

                  {(s.statut === 'PLANIFIEE' || s.statut === 'EN_ATTENTE_PAIEMENT' || s.statut === 'CONFIRMEE') && isTuteur && (
                    <button onClick={() => handleAnnulerSeance(s.id)} style={{ ...S.btnFullDanger, marginTop: 6 }}>❌ Annuler la séance</button>
                  )}
                  {s.statut === 'EN_COURS' && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green600 }} />
                        <p style={{ fontSize: 11, color: T.green800 }}>Séance en cours</p>
                      </div>
                      {isTuteur && activeCall && (
                        <button onClick={handleEndCall} style={S.btnFullDanger}>⏹ Terminer la séance</button>
                      )}
                    </div>
                  )}
                  {s.statut === 'REALISEE' && <p style={{ fontSize: 11, color: T.green800, marginTop: 4 }}>✅ Séance réalisée</p>}
                  {s.statut === 'ANNULEE'  && <p style={{ fontSize: 11, color: T.red800,   marginTop: 4 }}>❌ Séance annulée</p>}
                </div>
              ))}
              {seances.length === 0 && <p style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: '16px 0' }}>Aucune séance planifiée</p>}
            </div>
          )}

          {/* ── Examens ── */}
          {rightTab === 'examens' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>

              {/* Vue passage examen — plein écran */}
              {tentativeActive && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: T.bgPage, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Header timer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: `1px solid ${T.borderAmber}`, background: T.bgWhite, flexShrink: 0 }}>
                    <div>
                      <p style={{ fontSize: 11, color: T.textMuted }}>Examen en cours</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: T.textPrimary }}>{tentativeActive.examen.titre}</p>
                    </div>
                    <div style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 500, padding: '6px 16px', borderRadius: 10, background: timerLeft < 60 ? T.red50 : T.amber50, color: timerLeft < 60 ? T.red800 : T.amber800, border: `0.5px solid ${timerLeft < 60 ? T.borderRed : T.borderAmber}` }}>
                      ⏱ {fmtTimer(timerLeft)}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>
                      {Object.keys(reponsesEnCours).length}/{tentativeActive.questions.length} répondues
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 3, background: T.border, flexShrink: 0 }}>
                    <div style={{ height: 3, background: T.blue600, transition: 'width 0.5s', width: `${(Object.keys(reponsesEnCours).length / tentativeActive.questions.length) * 100}%` }} />
                  </div>

                  {/* Question */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    {(() => {
                      const q = tentativeActive.questions[tentativeActive.currentIdx]
                      if (!q) return null
                      return (
                        <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: T.blue50, border: `0.5px solid ${T.borderBlue}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: T.blue800 }}>
                              {tentativeActive.currentIdx + 1}
                            </span>
                            <p style={{ fontSize: 15, fontWeight: 500, color: T.textPrimary, lineHeight: 1.5 }}>{q.texte}</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {(q.reponses || []).map(r => {
                              const selected = reponsesEnCours[String(q.id)] === Number(r.id)
                              return (
                                <button key={r.id} onClick={() => handleSelectReponse(q.id, r.id)}
                                  style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: 10, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s', background: selected ? T.blue50 : T.bgWhite, border: `${selected ? '1.5' : '0.5'}px solid ${selected ? T.blue600 : T.border}`, color: selected ? T.blue800 : T.textPrimary, fontWeight: selected ? 500 : 400 }}>
                                  {selected && <span style={{ marginRight: 8 }}>✓</span>}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderTop: `1px solid ${T.borderAmber}`, background: T.bgWhite, flexShrink: 0, gap: 10 }}>
                    <button onClick={() => setTentativeActive(prev => ({ ...prev, currentIdx: Math.max(0, prev.currentIdx - 1) }))} disabled={tentativeActive.currentIdx === 0}
                      style={{ ...S.btnSecondary, opacity: tentativeActive.currentIdx === 0 ? 0.3 : 1 }}>← Précédent</button>

                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
                      {tentativeActive.questions.map((q, i) => (
                        <button key={q.id} onClick={() => setTentativeActive(prev => ({ ...prev, currentIdx: i }))}
                          style={{ width: 26, height: 26, borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', background: reponsesEnCours[String(q.id)] ? T.blue600 : tentativeActive.currentIdx === i ? T.amber50 : T.bgPage, color: reponsesEnCours[String(q.id)] ? '#fff' : tentativeActive.currentIdx === i ? T.amber800 : T.textMuted, border: `0.5px solid ${tentativeActive.currentIdx === i ? T.amber600 : T.border}` }}>
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    {tentativeActive.currentIdx < tentativeActive.questions.length - 1 ? (
                      <button onClick={() => setTentativeActive(prev => ({ ...prev, currentIdx: prev.currentIdx + 1 }))} style={S.btnSecondary}>Suivant →</button>
                    ) : (
                      <button onClick={() => setShowConfirmSoum(true)} style={S.btnPrimary}>✅ Terminer et envoyer</button>
                    )}
                  </div>

                  {/* Popup confirmation */}
                  {showConfirmSoum && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,58,92,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                      <div style={{ background: T.bgWhite, border: `0.5px solid ${T.borderAmber}`, borderRadius: 14, padding: 24, maxWidth: 360, width: '100%', margin: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ fontWeight: 500, color: T.textPrimary, textAlign: 'center', fontSize: 15 }}>Soumettre l'examen ?</p>
                        <p style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', lineHeight: 1.5 }}>
                          {Object.keys(reponsesEnCours).length}/{tentativeActive.questions.length} questions répondues.<br />
                          Après validation, vous ne pourrez plus modifier vos réponses.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => setShowConfirmSoum(false)} style={{ ...S.btnSecondary, flex: 1, justifyContent: 'center' }}>Annuler</button>
                          <button onClick={() => handleSoumettreExamen(false)} style={{ ...S.btnPrimary, flex: 1, justifyContent: 'center' }}>Confirmer</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Résultats */}
              {resultats && !tentativeActive && (
                <div style={{ borderRadius: 12, padding: 16, border: `0.5px solid ${resultats.reussi ? T.borderGreen : T.borderRed}`, background: resultats.reussi ? T.green50 : T.red50, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 4 }}>{resultats.reussi ? '🏆' : '😞'}</div>
                    <p style={{ fontWeight: 500, color: T.textPrimary, fontSize: 14 }}>{resultats.reussi ? 'Félicitations !' : 'Pas encore...'}</p>
                    <p style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 500, marginTop: 4, color: resultats.reussi ? T.green800 : T.red800 }}>{resultats.pourcentage}%</p>
                    <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{resultats.scoreObtenu}/{resultats.scoreMax} pts — passage à {resultats.notePassage}%</p>
                  </div>
                  {resultats.reussi && resultats.certificat && (
                    <div style={{ background: T.amber50, border: `0.5px solid ${T.borderAmber}`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: T.amber800 }}>🎓 Certificat généré !</p>
                      <p style={{ fontSize: 11, color: T.textMuted, marginTop: 4, fontFamily: 'monospace' }}>{resultats.certificat.numero_certificat}</p>
                      <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Vérifiable sur SmartTutor</p>
                    </div>
                  )}
                  <button onClick={() => setResultats(null)} style={{ ...S.btnSecondary, justifyContent: 'center', width: '100%' }}>Retour aux examens</button>
                </div>
              )}

              {/* Liste examens */}
              {!tentativeActive && !resultats && (
                <>
                  {isTuteur && (
                    <button onClick={() => { setShowCreateExamen(true); setEditingExamen(null); setExamForm({ titre: '', description: '', notePassage: 70, dureeMinutes: 30, maxTentatives: '', dateDebut: '', dateLimite: '', dateAffichageResultats: '', modeAffichage: 'UNE_PAR_UNE' }) }}
                      style={{ ...S.btnFullSecondary, marginBottom: 2 }}>
                      ➕ Créer un examen
                    </button>
                  )}

                  {/* Formulaire création */}
                  {showCreateExamen && !editingExamen?.statut && (
                    <div style={{ ...S.cardBlue, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: T.blue800 }}>Nouvel examen</p>
                      <form onSubmit={handleSaveExamen} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input required value={examForm.titre} onChange={e => setExamForm(f => ({ ...f, titre: e.target.value }))} placeholder="Titre de l'examen *" style={S.inputSm} />
                        <textarea value={examForm.description} onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optionnel)" rows={2} style={S.textarea} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 10, color: T.textMuted, display: 'block', marginBottom: 3 }}>Note de passage (%)</label>
                            <input type="number" min={0} max={100} value={examForm.notePassage} onChange={e => setExamForm(f => ({ ...f, notePassage: Number(e.target.value) }))} style={S.inputSm} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, color: T.textMuted, display: 'block', marginBottom: 3 }}>Durée (min)</label>
                            <input type="number" min={5} max={180} value={examForm.dureeMinutes} onChange={e => setExamForm(f => ({ ...f, dureeMinutes: Number(e.target.value) }))} style={S.inputSm} />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 10, color: T.textMuted, display: 'block', marginBottom: 3 }}>Max tentatives</label>
                            <input type="number" min={1} value={examForm.maxTentatives} placeholder="illimité" onChange={e => setExamForm(f => ({ ...f, maxTentatives: e.target.value }))} style={S.inputSm} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, color: T.textMuted, display: 'block', marginBottom: 3 }}>Mode</label>
                            <select value={examForm.modeAffichage} onChange={e => setExamForm(f => ({ ...f, modeAffichage: e.target.value }))} style={S.select}>
                              <option value="UNE_PAR_UNE">Une par une</option>
                              <option value="LISTE">Liste complète</option>
                            </select>
                          </div>
                        </div>
                        {['dateDebut', 'dateLimite', 'dateAffichageResultats'].map((field, idx) => (
                          <div key={field}>
                            <label style={{ fontSize: 10, color: T.textMuted, display: 'block', marginBottom: 3 }}>{['Date de début', 'Date limite', 'Date affichage résultats'][idx]} (optionnel)</label>
                            <input type="datetime-local" value={examForm[field]} onChange={e => setExamForm(f => ({ ...f, [field]: e.target.value }))} style={S.inputSm} />
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => setShowCreateExamen(false)} style={{ ...S.btnSecondary, flex: 1, justifyContent: 'center' }}>Annuler</button>
                          <button type="submit" disabled={savingExamen} style={{ ...S.btnPrimary, flex: 1, justifyContent: 'center', opacity: savingExamen ? 0.6 : 1 }}>
                            {savingExamen ? '...' : '💾 Enregistrer brouillon'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Vue gestion questions brouillon */}
                  {editingExamen && editingExamen.statut === 'BROUILLON' && (
                    <div style={{ ...S.cardBlue, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 500, color: T.textPrimary }}>{editingExamen.titre}</p>
                          <p style={{ fontSize: 10, color: T.textMuted }}>{(editingExamen.questions || []).length} question(s) — {editingExamen.note_passage}% requis — {editingExamen.duree_minutes} min</p>
                        </div>
                        <button onClick={() => setEditingExamen(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.textMuted }}>✕</button>
                      </div>

                      {(editingExamen.questions || []).map((q, qi) => (
                        <div key={q.id} style={{ background: T.bgWhite, borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 5, border: `0.5px solid ${T.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <p style={{ fontSize: 12, color: T.textPrimary, flex: 1, lineHeight: 1.4 }}>
                              <span style={{ color: T.blue600, fontWeight: 500, marginRight: 4 }}>Q{qi + 1}.</span>{q.texte}
                            </p>
                            <button onClick={() => handleDeleteQuestion(q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.red600, flexShrink: 0 }}>🗑</button>
                          </div>
                          {(q.reponses || []).map(r => (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '3px 6px', borderRadius: 6, background: r.est_correcte ? T.green50 : 'transparent', color: r.est_correcte ? T.green800 : T.textMuted }}>
                              <span>{r.est_correcte ? '✓' : '○'}</span><span>{r.texte}</span>
                            </div>
                          ))}
                        </div>
                      ))}

                      {/* Formulaire question */}
                      <div style={{ borderTop: `0.5px solid ${T.borderBlue}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <p style={{ fontSize: 10, fontWeight: 500, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Ajouter une question</p>
                        <select value={questionForm.type} onChange={e => setQuestionForm(f => ({ ...f, type: e.target.value, reponses: e.target.value === 'VRAI_FAUX' ? [{ texte: 'Vrai', estCorrecte: false }, { texte: 'Faux', estCorrecte: false }] : [{ texte: '', estCorrecte: false }, { texte: '', estCorrecte: false }] }))} style={S.select}>
                          <option value="QCM">QCM</option>
                          <option value="VRAI_FAUX">Vrai / Faux</option>
                        </select>
                        <textarea value={questionForm.texte} onChange={e => setQuestionForm(f => ({ ...f, texte: e.target.value }))} placeholder="Texte de la question *" rows={2} style={S.textarea} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <label style={{ fontSize: 10, color: T.textMuted }}>Points :</label>
                          <input type="number" min={0.5} step={0.5} value={questionForm.points} onChange={e => setQuestionForm(f => ({ ...f, points: Number(e.target.value) }))} style={{ ...S.inputSm, width: 64 }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {questionForm.reponses.map((r, ri) => (
                            <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input type="checkbox" checked={r.estCorrecte} onChange={e => setQuestionForm(f => ({ ...f, reponses: f.reponses.map((rr, i) => i === ri ? { ...rr, estCorrecte: e.target.checked } : rr) }))} style={{ width: 14, height: 14, flexShrink: 0, accentColor: T.blue600 }} />
                              <input value={r.texte} readOnly={questionForm.type === 'VRAI_FAUX'} onChange={e => setQuestionForm(f => ({ ...f, reponses: f.reponses.map((rr, i) => i === ri ? { ...rr, texte: e.target.value } : rr) }))} placeholder={`Réponse ${ri + 1}`} style={{ ...S.inputSm, flex: 1 }} />
                              {questionForm.type === 'QCM' && ri > 1 && (
                                <button type="button" onClick={() => setQuestionForm(f => ({ ...f, reponses: f.reponses.filter((_, i) => i !== ri) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.red600, fontSize: 13 }}>✕</button>
                              )}
                            </div>
                          ))}
                          {questionForm.type === 'QCM' && questionForm.reponses.length < 6 && (
                            <button type="button" onClick={() => setQuestionForm(f => ({ ...f, reponses: [...f.reponses, { texte: '', estCorrecte: false }] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: T.blue600, textAlign: 'left', marginTop: 2 }}>+ Ajouter une réponse</button>
                          )}
                        </div>
                        <button onClick={handleAddQuestion} style={S.btnFullPrimary}>+ Enregistrer la question</button>
                      </div>

                      <div style={{ display: 'flex', gap: 8, borderTop: `0.5px solid ${T.borderBlue}`, paddingTop: 10 }}>
                        <button onClick={() => handleDeleteExamen(editingExamen.id)} style={{ ...S.btnFullDanger, flex: 1 }}>🗑 Supprimer</button>
                        <button onClick={() => handlePublierExamen(editingExamen.id)} disabled={(editingExamen.questions || []).length === 0}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: T.green50, color: T.green800, border: `0.5px solid ${T.borderGreen}`, cursor: 'pointer', opacity: (editingExamen.questions || []).length === 0 ? 0.4 : 1 }}>
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
                    const tentativesRestantes = ex.max_tentatives ? ex.max_tentatives - (ex.nb_tentatives_faites || 0) : null
                    const statusStyle = ex.statut === 'BROUILLON' ? S.badgeAmber : ex.statut === 'PUBLIE' ? S.badgeGreen : S.badgeGray

                    return (
                      <div key={ex.id} style={{ ...S.card, border: `0.5px solid ${ex.statut === 'PUBLIE' ? T.border : T.borderGray}`, opacity: ex.statut === 'ARCHIVE' ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                          <span style={statusStyle}>{ex.statut}</span>
                          {ex.deja_reussi > 0 && <span style={{ fontSize: 11, color: T.amber800 }}>🏆 Réussi</span>}
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 500, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.titre}</p>
                        <p style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{ex.nb_questions || 0} questions · {ex.duree_minutes} min · {ex.note_passage}% requis</p>
                        {tentativesRestantes !== null && !ex.deja_reussi && (
                          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{tentativesRestantes} tentative(s) restante(s)</p>
                        )}

                        {estTuteurExamen && ex.statut === 'BROUILLON' && (
                          <button onClick={async () => { const { data } = await examensAPI.getById(ex.id); setEditingExamen(data); setShowCreateExamen(false) }}
                            style={{ ...S.btnFullSecondary, marginTop: 8 }}>✏️ Gérer les questions</button>
                        )}

                        {!isTuteur && ex.statut === 'PUBLIE' && (
                          peutPasser && (tentativesRestantes === null || tentativesRestantes > 0) ? (
                            <button onClick={() => handleDemarrerExamen(ex.id)} style={{ ...S.btnFullPrimary, marginTop: 8 }}>▶ Commencer l'examen</button>
                          ) : ex.deja_reussi ? (
                            <div style={{ marginTop: 8, textAlign: 'center', padding: '7px 0', borderRadius: 8, fontSize: 11, color: T.green800, background: T.green50, border: `0.5px solid ${T.borderGreen}` }}>✅ Examen réussi — certificat disponible</div>
                          ) : !avantLimite ? (
                            <div style={{ marginTop: 8, textAlign: 'center', padding: '7px 0', borderRadius: 8, fontSize: 11, color: T.textMuted, background: T.bgPage, border: `0.5px solid ${T.border}` }}>❌ Période de passage terminée</div>
                          ) : !apresDebut ? (
                            <div style={{ marginTop: 8, textAlign: 'center', padding: '7px 0', borderRadius: 8, fontSize: 11, color: T.amber800, background: T.amber50, border: `0.5px solid ${T.borderAmber}` }}>⏳ Disponible le {new Date(ex.date_debut).toLocaleDateString('fr-FR')}</div>
                          ) : (
                            <div style={{ marginTop: 8, textAlign: 'center', padding: '7px 0', borderRadius: 8, fontSize: 11, color: T.textMuted, background: T.bgPage, border: `0.5px solid ${T.border}` }}>❌ Nombre maximum de tentatives atteint</div>
                          )
                        )}
                      </div>
                    )
                  })}

                  {examens.length === 0 && (
                    <p style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: '16px 0' }}>
                      {isTuteur ? 'Aucun examen créé. Cliquez sur ➕ pour commencer.' : 'Aucun examen disponible dans cette salle.'}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Appel entrant ────────────────────────────────────────────────── */}
      {incomingCall && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,58,92,0.45)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: T.bgWhite, border: `1px solid ${T.borderAmber}`, borderRadius: 18, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 340, width: '100%', margin: 16 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.amber50, border: `2px solid ${T.borderAmber}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👨‍🏫</div>
              <span style={{ position: 'absolute', bottom: -3, right: -3, width: 18, height: 18, background: T.green600, borderRadius: '50%', border: `2.5px solid ${T.bgWhite}` }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              {incomingCall.isOngoing ? (
                <>
                  <p style={{ ...S.badgeGreen, display: 'inline-block', marginBottom: 8 }}>🔴 Appel en cours</p>
                  <p style={{ fontSize: 17, fontWeight: 500, color: T.textPrimary }}>{incomingCall.initiateurNom}</p>
                  <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Un appel est déjà actif dans cette salle</p>
                </>
              ) : (
                <>
                  <p style={{ ...S.badgeAmber, display: 'inline-block', marginBottom: 8 }}>Appel entrant</p>
                  <p style={{ fontSize: 17, fontWeight: 500, color: T.textPrimary }}>{incomingCall.initiateurNom}</p>
                  <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>vous invite à rejoindre l'appel</p>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={() => refuseCallRef.current?.(incomingCall.sessionId)}
                style={{ width: 56, height: 56, borderRadius: '50%', background: T.red50, border: `2px solid ${T.borderRed}`, color: T.red800, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📵</button>
              <button onClick={() => acceptCallRef.current?.(incomingCall.sessionId)}
                style={{ width: 56, height: 56, borderRadius: '50%', background: T.green50, border: `2px solid ${T.borderGreen}`, color: T.green800, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📞</button>
            </div>
            {incomingCall.isOngoing && <p style={{ fontSize: 11, color: T.textMuted, textAlign: 'center' }}>📞 Rejoindre · 📵 Ignorer</p>}
          </div>
        </div>
      )}

      {/* ── Modal planifier ──────────────────────────────────────────────── */}
      <Modal open={showPlan} onClose={() => { setShowPlan(false); setPlanForm({ titre: '', matiere: '', dateDebut: '', duree: 60 }); setMesTarifs([]); setMesDispos([]) }} title="📅 Planifier une séance">
        <form onSubmit={handlePlanifier} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormGroup label="Titre *">
            <input required value={planForm.titre} onChange={e => setPlanForm(f => ({ ...f, titre: e.target.value }))} placeholder="ex: Cours d'Algèbre" />
          </FormGroup>
          <FormGroup label="Matière">
            {mesTarifs.length > 0 ? (
              <select value={planForm.matiere} onChange={e => setPlanForm(f => ({ ...f, matiere: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: T.bgPage, border: `0.5px solid ${T.borderGray}`, color: planForm.matiere ? T.textPrimary : T.textMuted, fontSize: 13 }}>
                <option value="">— Choisir une matière —</option>
                {mesTarifs.map(t => <option key={t.id} value={t.matiere}>{t.matiere} — {t.tarif_heure} DH/h</option>)}
              </select>
            ) : (
              <div>
                <input value={planForm.matiere} onChange={e => setPlanForm(f => ({ ...f, matiere: e.target.value }))} placeholder="ex: Mathématiques" />
                <p style={{ fontSize: 11, color: T.amber800, marginTop: 4 }}>⚠️ Aucun tarif configuré. <a href="/dashboard/mes-tarifs" style={{ color: T.blue600 }}>Configurer mes tarifs</a></p>
              </div>
            )}
          </FormGroup>
          {/* Sélecteur de créneaux basé sur les disponibilités - VERSION CORRIGÉE */}
<FormGroup label="Créneau *">
  {mesDispos.length === 0 ? (
    <div style={{ borderRadius: 10, background: T.amber50, border: `0.5px solid ${T.borderAmber}`, padding: 12 }}>
      <p style={{ fontSize: 12, color: T.amber800 }}>⚠️ Aucune disponibilité configurée.</p>
      <a href="/dashboard/mes-disponibilites" style={{ fontSize: 12, color: T.blue600, display: 'block', marginTop: 4 }}>→ Configurer mes disponibilités</a>
    </div>
  ) : (() => {
    const JOURS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    const creneaux = []
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    
    // Générer les créneaux pour les 30 prochains jours max
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const jourSemaine = date.getDay() === 0 ? 7 : date.getDay() // 1=Lundi, 7=Dimanche
      
      // Trouver les disponibilités pour ce jour
      const disposDuJour = mesDispos.filter(d => d.jour_semaine === jourSemaine)
      
      for (const dispo of disposDuJour) {
        // Vérifier si l'horaire n'est pas déjà passé
        const [hDebut, mDebut] = dispo.heure_debut.split(':').map(Number)
        const dateDebut = new Date(date)
        dateDebut.setHours(hDebut, mDebut, 0, 0)
        
        if (dateDebut > now) {
          const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${dispo.heure_debut}`
          
          // Vérifier si le créneau n'a pas déjà été ajouté (éviter les doublons)
          const existeDeja = creneaux.some(c => c.iso === iso)
          if (!existeDeja) {
            creneaux.push({
              iso,
              label: `${JOURS[jourSemaine]} ${date.getDate()}/${date.getMonth() + 1} — ${dispo.heure_debut} → ${dispo.heure_fin}`,
              heureFin: dispo.heure_fin,
              heureDebut: dispo.heure_debut,
              date: new Date(dateDebut)
            })
          }
        }
      }
    }
    
    // Trier par date
    creneaux.sort((a, b) => a.date - b.date)
    
    const handleSelect = (iso) => {
      const cr = creneaux.find(c => c.iso === iso)
      if (!cr) return
      const [hd, md] = cr.heureDebut.split(':').map(Number)
      const [hf, mf] = cr.heureFin.split(':').map(Number)
      const dureeAuto = (hf * 60 + mf) - (hd * 60 + md)
      setPlanForm(f => ({ ...f, dateDebut: iso, duree: dureeAuto > 0 ? dureeAuto : f.duree }))
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
        {creneaux.length === 0 ? (
          <p style={{ fontSize: 12, color: T.textMuted }}>Aucun créneau disponible dans les 30 prochains jours.</p>
        ) : (
          creneaux.map(cr => (
            <button
              key={cr.iso}
              type="button"
              onClick={() => handleSelect(cr.iso)}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 12,
                cursor: 'pointer', transition: 'all 0.15s',
                background: planForm.dateDebut === cr.iso ? T.amber50 : T.bgPage,
                border: `${planForm.dateDebut === cr.iso ? '1.5' : '0.5'}px solid ${planForm.dateDebut === cr.iso ? T.amber600 : T.borderGray}`,
                color: planForm.dateDebut === cr.iso ? T.amber800 : T.textPrimary,
                fontWeight: planForm.dateDebut === cr.iso ? 500 : 400,
              }}
            >
              {planForm.dateDebut === cr.iso && <span style={{ marginRight: 6 }}>✓</span>}
              {cr.label}
            </button>
          ))
        )}
      </div>
    )
  })()}
</FormGroup>
          <FormGroup label="Durée (min)">
            <input type="number" min={15} max={480} value={planForm.duree} onChange={e => setPlanForm(f => ({ ...f, duree: Number(e.target.value) }))} />
          </FormGroup>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" onClick={() => setShowPlan(false)} style={S.btnSecondary}>Annuler</button>
            <button type="submit" style={S.btnPrimary}>Planifier</button>
          </div>
        </form>
      </Modal>

      {/* ── Modal inviter tuteur ─────────────────────────────────────────── */}
      <Modal open={showInviteTuteur} onClose={() => setShowInviteTuteur(false)} title="👨‍🏫 Inviter un tuteur">
        <InviteTuteurModal salleId={id} hasTuteur={hasTuteur}
          onClose={() => setShowInviteTuteur(false)}
          onSuccess={msg => success(msg)} onError={msg => error(msg)} />
      </Modal>

      {/* ── Modal paiement ───────────────────────────────────────────────── */}
      {paiementSeanceId && (
        <PaiementModal
          seanceId={paiementSeanceId}
          onClose={() => setPaiementSeanceId(null)}
          onSuccess={() => {
            setPaiementSeanceId(null)
            setSeances(prev => prev.map(s => s.id === paiementSeanceId ? { ...s, statut: 'CONFIRMEE', statut_paiement: 'PAYE' } : s))
            success('✅ Paiement confirmé — séance confirmée !')
          }}
        />
      )}
    </div>
  )
}