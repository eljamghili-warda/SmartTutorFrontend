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

// ─── FormExamenSalle : même thème que la page Examens (blanc/doré) ─────────────
function FormExamenSalle({ onSave, onClose }) {
  const [form, setForm] = React.useState({
    titre: '',
    description: '',
    notePassage: 70,
    dureeMinutes: 30,
    dateDebut: '',
    dateLimite: '',
    dateAffichageResultats: '',
    modeAffichage: 'UNE_PAR_UNE',
    melangerQuestions: true,
    melangerReponses: true,
  })
  const [saving, setSaving] = React.useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.titre.trim()) return alert('Titre obligatoire')
    setSaving(true)
    try {
      await onSave({
        titre: form.titre,
        description: form.description,
        notePassage: parseFloat(form.notePassage),
        dureeMinutes: parseInt(form.dureeMinutes),
        dateDebut: form.dateDebut || null,
        dateLimite: form.dateLimite || null,
        dateAffichageResultats: form.dateAffichageResultats || null,
        modeAffichage: form.modeAffichage,
        melangerQuestions: form.melangerQuestions,
        melangerReponses: form.melangerReponses,
      })
    } finally { setSaving(false) }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '2px solid #C5A059',
    backgroundColor: '#FFFFFF',
    color: '#1A3A5C',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#C5A059',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
      <div className="min-h-screen flex items-start justify-center p-6">
        <div className="w-full max-w-2xl bg-white border border-amber-200 rounded-2xl shadow-xl my-8">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-amber-200">
            <h2 className="font-bold text-lg text-slate-800">➕ Créer un examen</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">✕</button>
          </div>
          <div className="px-6 py-5" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Titre */}
            <div>
              <label style={labelStyle}>Titre *</label>
              <input style={inputStyle} value={form.titre} onChange={e => set('titre', e.target.value)}
                placeholder="Ex: Algorithmique Chapitre 2"
                onFocus={e => e.target.style.borderColor = '#D4AF37'}
                onBlur={e => e.target.style.borderColor = '#C5A059'} />
            </div>
            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'none' }} rows={2} value={form.description}
                onChange={e => set('description', e.target.value)} placeholder="Description optionnelle..."
                onFocus={e => e.target.style.borderColor = '#D4AF37'}
                onBlur={e => e.target.style.borderColor = '#C5A059'} />
            </div>
            {/* Durée + Note */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Durée (minutes)</label>
                <input type="number" min={5} max={180} style={inputStyle} value={form.dureeMinutes}
                  onChange={e => set('dureeMinutes', e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#D4AF37'}
                  onBlur={e => e.target.style.borderColor = '#C5A059'} />
              </div>
              <div>
                <label style={labelStyle}>Note de passage (%)</label>
                <input type="number" min={0} max={100} style={inputStyle} value={form.notePassage}
                  onChange={e => set('notePassage', e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#D4AF37'}
                  onBlur={e => e.target.style.borderColor = '#C5A059'} />
              </div>
            </div>
            {/* Mode affichage */}
            <div>
              <label style={labelStyle}>Mode affichage</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.modeAffichage}
                onChange={e => set('modeAffichage', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#D4AF37'}
                onBlur={e => e.target.style.borderColor = '#C5A059'}>
                <option value="UNE_PAR_UNE">Question par question</option>
                <option value="LISTE_COMPLETE">Liste complète</option>
              </select>
            </div>
            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Disponible à partir du</label>
                <input type="datetime-local" style={inputStyle} value={form.dateDebut}
                  onChange={e => set('dateDebut', e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#D4AF37'}
                  onBlur={e => e.target.style.borderColor = '#C5A059'} />
              </div>
              <div>
                <label style={labelStyle}>Date limite</label>
                <input type="datetime-local" style={inputStyle} value={form.dateLimite}
                  onChange={e => set('dateLimite', e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#D4AF37'}
                  onBlur={e => e.target.style.borderColor = '#C5A059'} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Afficher résultats à partir du</label>
              <input type="datetime-local" style={inputStyle} value={form.dateAffichageResultats}
                onChange={e => set('dateAffichageResultats', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#D4AF37'}
                onBlur={e => e.target.style.borderColor = '#C5A059'} />
            </div>
            {/* Checkboxes */}
            <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1A3A5C', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.melangerQuestions}
                  onChange={e => set('melangerQuestions', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#C5A059', cursor: 'pointer' }} />
                Mélanger les questions
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1A3A5C', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.melangerReponses}
                  onChange={e => set('melangerReponses', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#C5A059', cursor: 'pointer' }} />
                Mélanger les réponses
              </label>
            </div>
            {/* Boutons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid #C5A059', marginTop: 4 }}>
              <button type="button" onClick={onClose}
                style={{ padding: '8px 20px', borderRadius: 8, border: '2px solid #C5A059', background: 'transparent', color: '#C5A059', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.target.style.background = '#C5A059'; e.target.style.color = '#1A3A5C' }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#C5A059' }}>
                Annuler
              </button>
              <button type="button" onClick={handleSubmit} disabled={saving}
                style={{ padding: '8px 24px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', background: '#C5A059', color: '#1A3A5C', opacity: saving ? 0.6 : 1, transition: 'all 0.2s' }}>
                {saving ? 'Enregistrement…' : '💾 Créer brouillon'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


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
// ─── Panneau d'appel flottant — thème navy/gold ─────────────────────────────────
function CallPanel({ callParticipants, isMuted, onToggleMute, onEnd, onLeave, canEnd, callTime, isSharing, onShareToggle, isTuteur }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 40,
      width: '300px',
      background: 'linear-gradient(135deg, #0A1628 0%, #1A3A5C 100%)',
      border: '1px solid #C5A059',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(197,160,89,0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            display: 'inline-block',
            animation: 'pulse 1.5s infinite',
          }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Appel en cours
          </span>
        </div>
        <span style={{
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#D4B06A',
          backgroundColor: 'rgba(197,160,89,0.12)',
          padding: '2px 8px',
          borderRadius: '20px',
          border: '1px solid rgba(197,160,89,0.25)',
        }}>{callTime}</span>
      </div>

      {/* Liste des participants */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        maxHeight: '150px',
        overflowY: 'auto',
      }}>
        {callParticipants.length === 0 ? (
          <p style={{ fontSize: '11px', color: '#8B9CB5', textAlign: 'center', padding: '12px 0' }}>
            En attente de participants…
          </p>
        ) : callParticipants.map(p => (
          <div key={p.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(197,160,89,0.12)',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #C5A059, #D4B06A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: '#0A1628',
              flexShrink: 0,
            }}>
              {p.prenom?.[0]?.toUpperCase()}{p.nom?.[0]?.toUpperCase()}
            </div>
            <p style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#E2E8F0',
              flex: 1,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {p.prenom} {p.nom}
              {p.isMe && <span style={{ color: '#C5A059', marginLeft: '4px', fontSize: '10px' }}>(vous)</span>}
            </p>
            <span style={{ fontSize: '12px', flexShrink: 0 }}>{p.muted ? '🔇' : '🎙️'}</span>
          </div>
        ))}
      </div>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid rgba(197,160,89,0.15)' }}>
        <button onClick={onToggleMute}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 0',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: isMuted ? 'rgba(220,38,38,0.15)' : 'rgba(197,160,89,0.08)',
            border: isMuted ? '1px solid rgba(220,38,38,0.4)' : '1px solid rgba(197,160,89,0.25)',
            color: isMuted ? '#ef5350' : '#C5A059',
          }}
          onMouseEnter={e => {
            if (isMuted) e.currentTarget.style.background = 'rgba(220,38,38,0.25)'
            else e.currentTarget.style.background = 'rgba(197,160,89,0.16)'
          }}
          onMouseLeave={e => {
            if (isMuted) e.currentTarget.style.background = 'rgba(220,38,38,0.15)'
            else e.currentTarget.style.background = 'rgba(197,160,89,0.08)'
          }}>
          {isMuted ? '🔇 Muet' : '🎙️ Micro'}
        </button>

        {isTuteur && (
          <button onClick={onShareToggle}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 0',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: isSharing ? 'rgba(197,160,89,0.15)' : 'rgba(197,160,89,0.08)',
              border: isSharing ? '1px solid #C5A059' : '1px solid rgba(197,160,89,0.25)',
              color: '#C5A059',
            }}>
            {isSharing ? '⏹ Écran' : '🖥️ Écran'}
          </button>
        )}

        {canEnd ? (
          <button onClick={onEnd}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 0',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: 'rgba(220,38,38,0.12)',
              border: '1px solid rgba(220,38,38,0.35)',
              color: '#ef5350',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.22)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.12)' }}>
            📵 Terminer
          </button>
        ) : (
          <button onClick={onLeave}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 0',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: 'rgba(197,160,89,0.08)',
              border: '1px solid rgba(197,160,89,0.25)',
              color: '#C5A059',
            }}>
            🚪 Quitter
          </button>
        )}
      </div>
    </div>
  )
}

function ScreenShareViewer({ sharerNom, videoRef, onClose }) {
  const [mode, setMode] = useState('normal')
  const containerRef    = useRef(null)
  const enterFullscreen = () => { containerRef.current?.requestFullscreen?.(); setMode('fullscreen') }
  const exitFullscreen  = () => { if (document.fullscreenElement) document.exitFullscreen(); setMode('normal') }
  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement && mode === 'fullscreen') setMode('normal') }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [mode])
  const dragRef      = useRef(null)
  const isDragging   = useRef(false)
  const dragOffset   = useRef({ x: 0, y: 0 })
  const [pos, setPos] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 220 })
  const onMouseDown = (e) => { isDragging.current = true; dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; e.preventDefault() }
  useEffect(() => {
    const onMove = (e) => { if (!isDragging.current) return; setPos({ x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.current.x)), y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.current.y)) }) }
    const onUp = () => { isDragging.current = false }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])
  if (mode === 'minimized') return (
    <div ref={dragRef} style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9998, width: 300 }}
      className="rounded-2xl overflow-hidden shadow-2xl border-2 border-violet-500/50 bg-ink-900 select-none">
      <div onMouseDown={onMouseDown} className="flex items-center justify-between px-3 py-1.5 bg-ink-800 cursor-grab">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs font-semibold text-violet-300 truncate max-w-[140px]">🖥️ {sharerNom}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setMode('normal')} className="w-6 h-6 rounded-lg bg-ink-700 hover:bg-violet-600/30 text-slate-400 hover:text-violet-300 flex items-center justify-center text-xs transition-all">⛶</button>
          <button onClick={onClose} className="w-6 h-6 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 flex items-center justify-center text-xs transition-all">✕</button>
        </div>
      </div>
      <div className="relative bg-ink-950" style={{ height: 168 }}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
        <div onClick={() => setMode('normal')} className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all cursor-pointer group">
          <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">⛶</span>
        </div>
      </div>
      <div className="px-3 py-1 bg-ink-800 text-center"><p className="text-xs text-slate-600">Glisser pour déplacer · Cliquer pour agrandir</p></div>
    </div>
  )
  return (
    <div ref={containerRef} className="fixed inset-0 flex flex-col bg-black/92" style={{ zIndex: 9998 }}>
      <div className="flex items-center justify-between px-4 py-2 bg-ink-900/90 backdrop-blur-sm flex-shrink-0 border-b border-ink-700/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-sm font-semibold text-white">🖥️ Écran partagé par <span className="text-violet-400">{sharerNom}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('minimized')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs hover:bg-amber-500/25 transition-all font-medium">▼ Minimiser</button>
          {mode !== 'fullscreen' ? (
            <button onClick={enterFullscreen} className="px-3 py-1.5 rounded-lg bg-ink-700 text-slate-300 text-xs hover:bg-ink-600 transition-all">⛶ Plein écran</button>
          ) : (
            <button onClick={exitFullscreen} className="px-3 py-1.5 rounded-lg bg-ink-700 text-slate-300 text-xs hover:bg-ink-600 transition-all">⊡ Réduire</button>
          )}
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs hover:bg-rose-500/30 transition-all">✕ Fermer</button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="max-w-full max-h-full rounded-xl shadow-2xl border border-ink-600/50 object-contain bg-ink-950" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="flex items-center justify-center gap-4 py-2 flex-shrink-0 border-t border-ink-700/30">
        <p className="text-xs text-slate-600">Lecture seule</p>
        <span className="text-slate-700">·</span>
        <button onClick={() => setMode('minimized')} className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium">▼ Minimiser pour accéder au tableau blanc</button>
      </div>
    </div>
  )
}

// ─── Modal inviter tuteur ─────────────────────────────────────────────────────
// ─── Modal inviter tuteur — thème navy/gold ────────────────────────────────────
function InviteTuteurModal({ salleId, hasTuteur, onClose, onSuccess, onError }) {
  const [tuteurs, setTuteurs]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState('')
  const [sending, setSending]     = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  
  useEffect(() => { tuteursAPI.getAll().then(({ data }) => setTuteurs(data)).finally(() => setLoading(false)) }, [])
  
  const doSend = async () => {
    setSending(true)
    try { 
      await invitationsAPI.send({ salleId, destinataireId: Number(selected), typeInvitation: 'VERS_TUTEUR' }); 
      onSuccess('Invitation envoyée au tuteur !'); 
      onClose() 
    }
    catch (err) { onError(err.response?.data?.error || "Erreur lors de l'envoi") }
    finally { setSending(false) }
  }
  
  const handleSend = () => { 
    if (!selected) return onError('Choisissez un tuteur'); 
    if (hasTuteur && !confirmed) { setConfirmed(true); return }; 
    doSend() 
  }
  
  if (confirmed) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        background: 'rgba(197,160,89,0.1)',
        border: '1px solid #C5A059',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#C5A059', marginBottom: '4px' }}>Cette salle a déjà un tuteur</p>
          <p style={{ fontSize: '13px', color: '#8B9CB5' }}>L'ancien tuteur sera retiré dès que le nouveau accepte.</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button onClick={() => setConfirmed(false)} style={{
          padding: '8px 20px', borderRadius: '8px', border: '1px solid #E8D5A3',
          background: 'transparent', color: '#8B9CB5', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}>← Retour</button>
        <button onClick={doSend} disabled={sending} style={{
          padding: '8px 20px', borderRadius: '8px', border: 'none',
          background: '#C5A059', color: '#0A1628', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
        }}>{sending ? 'Envoi...' : '✅ Confirmer'}</button>
      </div>
    </div>
  )
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {hasTuteur && (
        <div style={{
          background: 'rgba(197,160,89,0.08)',
          border: '1px solid rgba(197,160,89,0.3)',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '14px' }}>⚠️</span>
          <p style={{ fontSize: '12px', color: '#C5A059', margin: 0 }}>Cette salle a déjà un tuteur. Le sélectionner le remplacera.</p>
        </div>
      )}
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <span style={{ color: '#8B9CB5', fontSize: '13px' }}>Chargement...</span>
        </div>
      ) : tuteurs.length === 0 ? (
        <div style={{
          background: '#F5F0E6',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          border: '1px solid #E8D5A3',
        }}>
          <p style={{ fontSize: '13px', color: '#8B9CB5', margin: 0 }}>Aucun tuteur disponible.</p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '260px',
          overflowY: 'auto',
        }}>
          {tuteurs.map(t => {
            const isSelected = selected === String(t.id)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(String(t.id))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isSelected ? 'rgba(197,160,89,0.12)' : '#F5F0E6',
                  border: isSelected ? '2px solid #C5A059' : '1px solid #E8D5A3',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#C5A059' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#E8D5A3' }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C5A059, #D4B06A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#0A1628',
                  flexShrink: 0,
                }}>
                  {t.prenom?.[0]?.toUpperCase()}{t.nom?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#0A1628', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.prenom} {t.nom}
                  </p>
                  {t.specialites?.length > 0 && (
                    <p style={{ fontSize: '11px', color: '#8B9CB5', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.specialites.slice(0, 3).join(', ')}
                    </p>
                  )}
                </div>
                {isSelected && <span style={{ color: '#C5A059', fontSize: '16px', flexShrink: 0 }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
      
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        paddingTop: '8px',
        borderTop: '1px solid #E8D5A3',
      }}>
        <button onClick={onClose} style={{
          padding: '8px 20px',
          borderRadius: '8px',
          border: '1px solid #E8D5A3',
          background: 'transparent',
          color: '#8B9CB5',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.target.style.borderColor = '#C5A059'; e.target.style.color = '#C5A059' }}
          onMouseLeave={e => { e.target.style.borderColor = '#E8D5A3'; e.target.style.color = '#8B9CB5' }}
        >
          Annuler
        </button>
        <button onClick={handleSend} disabled={!selected || sending} style={{
          padding: '8px 20px',
          borderRadius: '8px',
          border: 'none',
          background: !selected || sending ? '#E8D5A3' : '#C5A059',
          color: !selected || sending ? '#8B9CB5' : '#0A1628',
          fontSize: '13px',
          fontWeight: 700,
          cursor: !selected || sending ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}>
          {sending ? 'Envoi...' : hasTuteur ? '🔄 Remplacer' : "✉️ Inviter"}
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
  const [examForm,         setExamForm]        = useState({ titre:'', description:'', notePassage:70, dureeMinutes:30, dateDebut:'', dateLimite:'', dateAffichageResultats:'', modeAffichage:'UNE_PAR_UNE' })
  const [editingExamen,    setEditingExamen]   = useState(null)
  const [questionForm,     setQuestionForm]    = useState({ texte:'', type:'QCM', points:1, reponses:[{texte:'',estCorrecte:false},{texte:'',estCorrecte:false}] })
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
  const [planForm,         setPlanForm]        = useState({ titre:'', matiere:'', dateDebut:'', duree:60, heureDebut:'', creneauDispo:null })
  const [mesTarifs,        setMesTarifs]       = useState([])
  const [mesDispos,        setMesDispos]       = useState([])
  const [showInviteTuteur, setShowInviteTuteur]= useState(false)
  const [paiementSeanceId, setPaiementSeanceId]= useState(null)

  const callTime = useCallTimer(!!activeCall)
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
          sallesAPI.getById(id), sallesAPI.getMessages(id),
          sallesAPI.getFichiers(id), seancesAPI.getAll({ salleId: id }),
        ])
        setSalle(sr.data); setMyRole(sr.data.mon_role)
        setParticipants(sr.data.participants || [])
        setMessages(mr.data); setFichiers(fr.data); setSeances(seR.data)
        try { const { data: examData } = await examensAPI.getBySalle(id); setExamens(examData); setExamensLoaded(true) }
        catch { setExamensLoaded(true) }
      } catch { navigate('/dashboard') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  // ── WebRTC Audio ──────────────────────────────────────────────────────────
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
      if (!audio) { audio = document.createElement('audio'); audio.id = audioId; audio.autoplay = true; audio.setAttribute('playsinline',''); document.body.appendChild(audio) }
      audio.srcObject = e.streams[0]
    }
    peersRef.current[targetUserId] = pc; return pc
  }
  const callPeer = async (targetUserId, sessionId) => {
    try { const stream = await getLocalStream(); const pc = createPeerConnection(targetUserId); stream.getTracks().forEach(t => pc.addTrack(t, stream)); const offer = await pc.createOffer(); await pc.setLocalDescription(offer); sendOffer(targetUserId, offer, sessionId) }
    catch (err) { console.error('callPeer error:', err) }
  }
  const stopCall = useCallback(() => {
    Object.values(peersRef.current).forEach(pc => { try { pc.close() } catch(_){} }); peersRef.current = {}
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    sessionRef.current = null; setCallParticipants([])
    document.querySelectorAll('[id^="remote-audio-"]').forEach(el => el.remove())
  }, [])

  // ── WebRTC Screen ─────────────────────────────────────────────────────────
  const createScreenPeerConnection = (targetUserId) => {
    if (screenPeersRef.current[targetUserId]) { screenPeersRef.current[targetUserId].close(); delete screenPeersRef.current[targetUserId] }
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] })
    pc.onicecandidate = (e) => { if (e.candidate) sendScreenIce(targetUserId, e.candidate) }
    pc.ontrack = (e) => { if (screenVideoRef.current) screenVideoRef.current.srcObject = e.streams[0] }
    screenPeersRef.current[targetUserId] = pc; return pc
  }
  const shareScreenToPeer = async (targetUserId) => {
    try { const stream = screenStreamRef.current; if (!stream) return; const pc = createScreenPeerConnection(targetUserId); stream.getTracks().forEach(t => pc.addTrack(t, stream)); const offer = await pc.createOffer(); await pc.setLocalDescription(offer); sendScreenOffer(targetUserId, offer) }
    catch (err) { console.error('shareScreenToPeer error:', err) }
  }
  const handleStartScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 15, max: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      screenStreamRef.current = stream; setScreenStream(stream); setIsSharing(true); startScreenShare(id)
      const myId = userRef.current?.id
      const others = participantsRef.current.filter(p => String(p.id) !== String(myId))
      for (const p of others) await shareScreenToPeer(p.id)
      stream.getVideoTracks()[0].addEventListener('ended', () => handleStopScreenShare())
      success('Partage d\'écran démarré !')
    } catch (err) { if (err.name !== 'NotAllowedError') error('Impossible de partager l\'écran.') }
  }
  const handleStopScreenShare = useCallback(() => {
    if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t => t.stop()); screenStreamRef.current = null }
    setScreenStream(null); setIsSharing(false)
    Object.values(screenPeersRef.current).forEach(pc => { try { pc.close() } catch(_){} }); screenPeersRef.current = {}
    stopScreenShare(id)
  }, [id])
  const addToCallParticipants = useCallback((userId, muted = false) => {
    const p = participantsRef.current.find(p => String(p.id) === String(userId)); if (!p) return
    const isMe = String(userId) === String(userRef.current?.id)
    setCallParticipants(prev => prev.some(x => String(x.id) === String(userId)) ? prev : [...prev, { id: userId, prenom: p.prenom, nom: p.nom, muted, isMe }])
  }, [])

  // ── Socket events ─────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket(); if (!socket) return
    joinSalle(id)
    const handleMessage   = (msg) => setMessages(prev => [...prev, msg])
    const handleJoin      = ({ userId, prenom, nom }) => setParticipants(prev => prev.some(p => p.id === userId) ? prev : [...prev, { id: userId, prenom, nom }])
    const handleLeave     = ({ userId }) => { setParticipants(prev => prev.filter(p => p.id !== userId)); setCallParticipants(prev => prev.filter(p => String(p.id) !== String(userId))) }
    const handleSeanceUpdated = ({ seanceId, statut }) => setSeances(prev => prev.map(s => s.id === seanceId ? { ...s, statut } : s))
    socket.on('chat:message', handleMessage); socket.on('salle:user-joined', handleJoin)
    socket.on('salle:user-left', handleLeave); socket.on('seance:updated', handleSeanceUpdated)
    socket.on('call:active', ({ sessionId, initiateurNom }) => { if (!sessionId) return; if (!sessionRef.current && !activeCallRef.current) setIncomingCall({ sessionId, initiateurNom: initiateurNom || 'Tuteur', isOngoing: true }) })
    const handleCallStarted = ({ sessionId, initiateur, initiateurNom }) => {
      const myUserId = userRef.current?.id; const isInit = myUserId != null && String(initiateur) === String(myUserId)
      if (isInit) { setActiveCall(sessionId); sessionRef.current = sessionId; joinCall(id, sessionId); setTimeout(() => addToCallParticipants(myUserId, false), 100); getLocalStream().catch(() => error("Impossible d'accéder au microphone.")) }
      else { if (!sessionRef.current) setIncomingCall({ sessionId, initiateurNom: initiateurNom || 'Tuteur' }) }
    }
    const handleCallUserJoined = async ({ userId }) => {
      if (!sessionRef.current) return; const myId = userRef.current?.id
      if (!myId || String(myId) === String(userId)) return; if (!activeCallRef.current) return
      addToCallParticipants(userId, false); if (peersRef.current[userId]) return
      await callPeer(userId, sessionRef.current); if (screenStreamRef.current) await shareScreenToPeer(userId)
    }
    const handleOffer = async ({ fromUserId, offer, sessionId }) => {
      try { const stream = await getLocalStream(); const pc = createPeerConnection(fromUserId); stream.getTracks().forEach(t => pc.addTrack(t, stream)); await pc.setRemoteDescription(new RTCSessionDescription(offer)); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); sendAnswer(fromUserId, answer, sessionId) }
      catch (err) { console.error('handle offer error:', err) }
    }
    const handleAnswer = async ({ fromUserId, answer }) => { try { const pc = peersRef.current[fromUserId]; if (pc && pc.signalingState !== 'stable') await pc.setRemoteDescription(new RTCSessionDescription(answer)) } catch (err) { console.error(err) } }
    const handleIce    = async ({ fromUserId, candidate }) => { try { const pc = peersRef.current[fromUserId]; if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch (err) { console.error(err) } }
    const handleScreenStarted = ({ sharerId, sharerNom }) => { if (String(sharerId) === String(userRef.current?.id)) return; setScreenShare({ sharerId, sharerNom }) }
    const handleScreenStopped = () => { setScreenShare(null); if (screenVideoRef.current) screenVideoRef.current.srcObject = null; Object.values(screenPeersRef.current).forEach(pc => { try { pc.close() } catch(_){} }); screenPeersRef.current = {} }
    const handleScreenOffer  = async ({ fromUserId, offer }) => { try { const pc = createScreenPeerConnection(fromUserId); await pc.setRemoteDescription(new RTCSessionDescription(offer)); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); sendScreenAnswer(fromUserId, answer) } catch (err) { console.error(err) } }
    const handleScreenAnswer = async ({ fromUserId, answer }) => { try { const pc = screenPeersRef.current[fromUserId]; if (pc && pc.signalingState !== 'stable') await pc.setRemoteDescription(new RTCSessionDescription(answer)) } catch (err) { console.error(err) } }
    const handleScreenIce    = async ({ fromUserId, candidate }) => { try { const pc = screenPeersRef.current[fromUserId]; if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch (err) { console.error(err) } }
    const handleUserMuted = ({ userId, muted }) => setCallParticipants(prev => prev.map(p => String(p.id) === String(userId) ? { ...p, muted } : p))
    const handleCallEnded  = () => { setActiveCall(null); setIncomingCall(null); stopCall(); handleStopScreenShare() }
    const handleCallYouLeft= () => { setActiveCall(null); setIncomingCall(null); stopCall() }
    socket.on('call:started', handleCallStarted); socket.on('call:user-joined', handleCallUserJoined)
    socket.on('call:offer', handleOffer); socket.on('call:answer', handleAnswer); socket.on('call:ice-candidate', handleIce)
    socket.on('screen:started', handleScreenStarted); socket.on('screen:stopped', handleScreenStopped)
    socket.on('screen:offer', handleScreenOffer); socket.on('screen:answer', handleScreenAnswer); socket.on('screen:ice', handleScreenIce)
    socket.on('call:user-muted', handleUserMuted); socket.on('call:user-disconnected', ({ userId }) => setCallParticipants(prev => prev.filter(p => String(p.id) !== String(userId))))
    socket.on('call:ended', handleCallEnded); socket.on('call:you-left', handleCallYouLeft)
    acceptCallRef.current = async (sessionId) => {
      setIncomingCall(null); setActiveCall(sessionId); sessionRef.current = sessionId; joinCall(id, sessionId)
      const myId = userRef.current?.id; if (myId) setTimeout(() => addToCallParticipants(myId, false), 100)
      getSocket()?.emit('call:joined', { salleId: id, sessionId, userId: myId })
    }
    refuseCallRef.current = (sessionId) => { setIncomingCall(null); getSocket()?.emit('call:refused', { sessionId, userId: userRef.current?.id }) }
    return () => {
      leaveSalle(id); stopCall()
      socket.off('chat:message'); socket.off('salle:user-joined'); socket.off('salle:user-left'); socket.off('seance:updated')
      socket.off('call:active'); socket.off('call:started'); socket.off('call:user-joined'); socket.off('call:offer')
      socket.off('call:answer'); socket.off('call:ice-candidate'); socket.off('screen:started'); socket.off('screen:stopped')
      socket.off('screen:offer'); socket.off('screen:answer'); socket.off('screen:ice'); socket.off('call:user-muted')
      socket.off('call:user-disconnected'); socket.off('call:ended'); socket.off('call:you-left')
    }
  }, [id, stopCall, addToCallParticipants, handleStopScreenShare])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleQuitter = async () => {
    const msg = myRole === 'ADMIN' ? 'Vous êtes admin. Quitter supprimera définitivement cette salle. Confirmer ?' : 'Quitter cette salle ?'
    if (!confirm(msg)) return
    try { await sallesAPI.quitter(id); navigate('/dashboard') } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }
  const uploadFichier = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const fd = new FormData(); fd.append('fichier', file)
    try { const { data } = await sallesAPI.uploadFichier(id, fd); setFichiers(prev => [data, ...prev]); success('Fichier uploadé !') }
    catch { error('Erreur upload') }
  }
  const loadExamens = useCallback(async () => {
    try { const { data } = await examensAPI.getBySalle(id); setExamens(data); setExamensLoaded(true) }
    catch { setExamensLoaded(true) }
  }, [id])
  const handleSaveExamen = async (e) => {
    e.preventDefault(); setSavingExamen(true)
    try {
      if (editingExamen && editingExamen.statut === 'BROUILLON' && editingExamen.id) {
        const { data } = await examensAPI.update(editingExamen.id, { ...examForm }); setExamens(prev => prev.map(ex => ex.id === editingExamen.id ? { ...ex, ...data } : ex)); setEditingExamen({ ...editingExamen, ...data }); success('Examen mis à jour')
      } else {
        const { data } = await examensAPI.create({ ...examForm, salleId: id }); setExamens(prev => [data, ...prev]); setEditingExamen(data); setShowCreateExamen(false); success('Examen créé — ajoutez vos questions')
      }
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
    setSavingExamen(false)
  }
  const handleDeleteExamen = async (examenId) => {
    if (!confirm('Supprimer cet examen ?')) return
    try { await examensAPI.delete(examenId); setExamens(prev => prev.filter(ex => ex.id !== examenId)); if (editingExamen?.id === examenId) setEditingExamen(null); success('Examen supprimé') }
    catch (err) { error(err.response?.data?.error || 'Erreur') }
  }
  const handlePublierExamen = async (examenId) => {
    try { await examensAPI.publier(examenId); setExamens(prev => prev.map(ex => ex.id === examenId ? { ...ex, statut: 'PUBLIE' } : ex)); if (editingExamen?.id === examenId) setEditingExamen(prev => ({ ...prev, statut: 'PUBLIE' })); success('🚀 Examen publié !') }
    catch (err) { error(err.response?.data?.error || 'Erreur') }
  }
  const handleAddQuestion = async (e) => {
    e.preventDefault(); if (!editingExamen?.id) return
    if (!questionForm.reponses.some(r => r.estCorrecte)) { error('Cochez au moins une bonne réponse'); return }
    const reponsesFilled = questionForm.reponses.filter(r => r.texte.trim())
    if (reponsesFilled.length < 2) { error('Ajoutez au moins 2 réponses'); return }
    try {
      const { data } = await examensAPI.addQuestion(editingExamen.id, { texte: questionForm.texte, type: questionForm.type, points: questionForm.points, reponses: reponsesFilled })
      setEditingExamen(prev => ({ ...prev, questions: [...(prev.questions || []), data] }))
      setExamens(prev => prev.map(ex => ex.id === editingExamen.id ? { ...ex, nb_questions: (ex.nb_questions||0)+1 } : ex))
      setQuestionForm({ texte:'', type:'QCM', points:1, reponses:[{texte:'',estCorrecte:false},{texte:'',estCorrecte:false}] })
      success('Question ajoutée')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }
  const handleDeleteQuestion = async (qid) => {
    try { await examensAPI.deleteQuestion(editingExamen.id, qid); setEditingExamen(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== qid) })); setExamens(prev => prev.map(ex => ex.id === editingExamen.id ? { ...ex, nb_questions: Math.max(0,(ex.nb_questions||1)-1) } : ex)) }
    catch (err) { error(err.response?.data?.error || 'Erreur') }
  }
  const handleDemarrerExamen = (examenId) => {
    navigate(`/examens/${examenId}/passer`)
  }
  const handleCreateExamenFromSalle = async (formData) => {
    const { data } = await examensAPI.create({ ...formData, salleId: id })
    setExamens(prev => [data, ...prev])
    setEditingExamen(data)
    setShowCreateExamen(false)
    success('Examen créé — ajoutez vos questions')
  }
  useEffect(() => {
    if (timerLeft === null) return
    if (timerLeft <= 0) { handleSoumettreExamen(true); return }
    const t = setTimeout(() => setTimerLeft(s => s - 1), 1000); return () => clearTimeout(t)
  }, [timerLeft])
  const fmtTimer = (s) => { if (s === null) return ''; const m = Math.floor(s / 60); return `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}` }
  const handleSelectReponse = (questionId, reponseId) => setReponsesEnCours(prev => ({ ...prev, [String(questionId)]: Number(reponseId) }))
  const handleSoumettreExamen = async (autoExpire = false) => {
    if (!tentativeActive) return
    try {
      const reponses = Object.entries(reponsesEnCours).map(([questionId, reponseId]) => ({ questionId: parseInt(questionId), reponseId: parseInt(reponseId) }))
      const { data } = await examensAPI.soumettre(tentativeActive.tentative.id, reponses)
      setResultats(data); setTentativeActive(null); setTimerLeft(null); setShowConfirmSoum(false)
      await loadExamens()
      if (data.reussi && data.certificat) success('🏆 Félicitations ! Certificat généré !')
      else error(`Score : ${data.pourcentage}% — Note de passage : ${data.notePassage}%`)
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ handlePlanifier AVEC validation de la matière/tarif (validation requise)
  // ═══════════════════════════════════════════════════════════════════════════
  const handlePlanifier = async (e) => {
    e.preventDefault()
    
    // ✅ VALIDATION OBLIGATOIRE : matière/tarif sélectionné
    if (!planForm.matiere || !planForm.matiere.trim()) {
      error('Veuillez sélectionner une matière / tarif avant de planifier.')
      return
    }
    
    if (!planForm.creneauDispo || !planForm.heureDebut) {
      error('Veuillez choisir un créneau et une heure de début.')
      return
    }
    
    const [hh, mm] = planForm.heureDebut.split(':').map(Number)
    const finMin   = hh * 60 + mm + planForm.duree
    const heureFin = `${String(Math.floor(finMin/60)).padStart(2,'0')}:${String(finMin%60).padStart(2,'0')}`
    const dateDebut = `${planForm.creneauDispo.dateStr}T${planForm.heureDebut}`
    
    try {
      const { data } = await seancesAPI.create({ 
        titre: planForm.titre, 
        matiere: planForm.matiere, 
        salleId: id, 
        dateDebut, 
        duree: planForm.duree 
      })
      setSeances(prev => [...prev, data])
      setShowPlan(false)
      setPlanForm({ titre:'', matiere:'', dateDebut:'', duree:60, heureDebut:'', creneauDispo:null })
      setMesTarifs([])
      setMesDispos([])
      success('Séance planifiée !')
      
      const dateStr = new Date(dateDebut).toLocaleString('fr-FR', { weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })
      sendMessage(id, `📅 Séance planifiée : ${planForm.titre} — ${dateStr} → ${heureFin} (${planForm.duree} min). seance_id:${data.id}`)
    } catch (err) { 
      error(err.response?.data?.error || 'Erreur lors de la planification') 
    }
  }

  const handleAnnulerSeance = async (seanceId) => {
    if (!confirm('Annuler cette séance ? Cette action est irréversible.')) return
    try {
      await seancesAPI.annuler(seanceId)
      // Récupérer les infos de la séance avant de la marquer annulée
      const seanceAnnulee = seances.find(s => s.id === seanceId)
      setSeances(prev => prev.map(s => s.id === seanceId ? { ...s, statut: 'ANNULEE' } : s))
      success('Séance annulée.')

      // Message de chat détaillé avec titre + date + heure
      if (seanceAnnulee) {
        const dateStr = new Date(seanceAnnulee.date_debut).toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long'
        })
        const heureStr = new Date(seanceAnnulee.date_debut).toLocaleTimeString('fr-FR', {
          hour: '2-digit', minute: '2-digit'
        })
        const dureeStr = seanceAnnulee.duree ? ` (${seanceAnnulee.duree} min)` : ''
        sendMessage(id,
          `❌ Séance annulée par le tuteur\n` +
          `📌 "${seanceAnnulee.titre}"${seanceAnnulee.matiere ? ` — ${seanceAnnulee.matiere}` : ''}\n` +
          `📅 ${dateStr} à ${heureStr}${dureeStr}`
        )
      } else {
        sendMessage(id, '❌ Séance annulée par le tuteur.')
      }
    }
    catch (err) { error(err.response?.data?.error || 'Erreur') }
  }
  const handleToggleMute = () => {
    setIsMuted(m => { const newMuted = !m; toggleMute(activeCall, newMuted); const myId = userRef.current?.id; if (myId) setCallParticipants(prev => prev.map(p => String(p.id) === String(myId) ? { ...p, muted: newMuted } : p)); return newMuted })
  }
  const handleEndCall  = () => { endCall(id, activeCall); setActiveCall(null); stopCall(); if (isSharing) handleStopScreenShare() }
  const handleLeaveCall= () => { getSocket()?.emit('call:leave', { sessionId: activeCall }); setActiveCall(null); stopCall() }
  const handleShareToggle = () => { if (isSharing) handleStopScreenShare(); else handleStartScreenShare() }

  const isTuteur  = user?.role === 'tuteur' && myRole === 'CO_ADMIN'
  const isAdmin   = myRole === 'ADMIN'
  const hasTuteur = salle?.statut === 'ACTIVE_AVEC_TUTEUR'
  const canCall   = isTuteur || (isAdmin && !hasTuteur)
  const statutBadge = { PLANIFIEE:'warning', EN_ATTENTE_PAIEMENT:'warning', CONFIRMEE:'success', EN_COURS:'primary', REALISEE:'success', ANNULEE:'danger' }
  const statutLabel  = { PLANIFIEE:'Planifiée', EN_ATTENTE_PAIEMENT:'⏳ En attente paiement', CONFIRMEE:'🔒 Confirmée & payée', EN_COURS:'🔴 En cours', REALISEE:'✅ Réalisée', ANNULEE:'❌ Annulée' }

  if (loading) return (<div className="h-screen bg-ink-950 flex items-center justify-center"><Spinner size="lg" /></div>)

  return (
    <div className="h-screen flex flex-col bg-ink-950 overflow-hidden">
      <ToastContainer toasts={toasts} />
      {activeCall && <CallPanel callParticipants={callParticipants} isMuted={isMuted} onToggleMute={handleToggleMute} onEnd={handleEndCall} onLeave={handleLeaveCall} canEnd={canCall} callTime={callTime} isSharing={isSharing} onShareToggle={handleShareToggle} isTuteur={isTuteur} />}
      {screenShare && <ScreenShareViewer sharerNom={screenShare.sharerNom} videoRef={screenVideoRef} onClose={() => setScreenShare(null)} />}

      {/* ── En-tête Salle — thème navy/doré ───────────────────────────────── */}
      <div style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        background: 'linear-gradient(135deg, #0A1628 0%, #1A3A5C 100%)',
        borderBottom: '1px solid #C5A059',
        boxShadow: '0 2px 12px rgba(197,160,89,0.12)',
      }}>
        {/* Gauche : retour + nom salle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, overflow: 'hidden' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 8,
            background: 'rgba(197,160,89,0.10)', border: '1px solid rgba(197,160,89,0.30)',
            color: '#C5A059', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,160,89,0.20)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,160,89,0.10)'}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="#C5A059" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Tableau de bord
          </button>

          <div style={{ width: 1, height: 22, background: 'rgba(197,160,89,0.25)' }} />

          {/* Icône salle */}
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #C5A059, #D4B06A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#0A1628" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="#0A1628" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>

          <div style={{ overflow: 'hidden' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
              {salle?.nom}
            </h2>
            {salle?.matiere && (
              <p style={{ fontSize: 11, color: '#C5A059', marginTop: 1 }}>{salle.matiere}</p>
            )}
          </div>

          {/* Badge tuteur */}
          <div style={{
            padding: '3px 10px', borderRadius: 20, flexShrink: 0,
            background: hasTuteur ? 'rgba(46,125,50,0.15)' : 'rgba(107,123,141,0.15)',
            border: `1px solid ${hasTuteur ? 'rgba(46,125,50,0.35)' : 'rgba(107,123,141,0.3)'}`,
            fontSize: 11, fontWeight: 600,
            color: hasTuteur ? '#4CAF50' : '#6B7B8D',
          }}>
            {hasTuteur ? 'Avec tuteur' : 'Sans tuteur'}
          </div>

          {/* Indicateur écran partagé */}
          {screenShare && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: 'rgba(197,160,89,0.12)', border: '1px solid rgba(197,160,89,0.30)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C5A059', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 11, color: '#C5A059', fontWeight: 600 }}>Écran partagé</span>
            </div>
          )}
        </div>

        {/* Droite : actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!activeCall && canCall && (
            <button onClick={() => startCall(id, null)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #2E7D32, #388E3C)',
              color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(46,125,50,0.3)',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Appel
            </button>
          )}
          <button onClick={handleQuitter} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(198,40,40,0.12)', border: '1px solid rgba(198,40,40,0.30)',
            color: '#ef5350', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(198,40,40,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(198,40,40,0.12)'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#ef5350" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="#ef5350" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="#ef5350" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Quitter
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 flex-shrink-0 border-r border-ink-700 flex flex-col">
          <Chat messages={messages} onSend={(c) => sendMessage(id, c)} currentUser={user} isAdmin={isAdmin} onPayer={(seanceId) => setPaiementSeanceId(seanceId)} seances={seances} />
        </div>
        <div className="flex-1 overflow-hidden"><Whiteboard salleId={id} isTuteur={isTuteur} /></div>

        {/* ── Panneau droit — thème navy/doré ─────────────────────────── */}
        <div style={{
          width: 248, flexShrink: 0,
          borderLeft: '1px solid rgba(197,160,89,0.20)',
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, #0D1F36 0%, #0A1628 100%)',
        }}>

          {/* Onglets */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(197,160,89,0.15)', flexShrink: 0 }}>
            {[
              { id: 'participants', icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>), label: `${participants.length}` },
              { id: 'fichiers',     icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>), label: `${fichiers.length}` },
              { id: 'seances',      icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>), label: `${seances.length}` },
              { id: 'examens',      icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>), label: `${examens.length}` },
            ].map(t => (
              <button key={t.id} onClick={() => setRightTab(t.id)} style={{
                flex: 1, padding: '10px 4px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                fontSize: 10, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s', border: 'none',
                borderBottom: rightTab === t.id ? '2px solid #C5A059' : '2px solid transparent',
                color: rightTab === t.id ? '#C5A059' : 'rgba(197,160,89,0.35)',
                background: rightTab === t.id ? 'rgba(197,160,89,0.06)' : 'transparent',
              }}
                onMouseEnter={e => { if (rightTab !== t.id) e.currentTarget.style.color = 'rgba(197,160,89,0.65)' }}
                onMouseLeave={e => { if (rightTab !== t.id) e.currentTarget.style.color = 'rgba(197,160,89,0.35)' }}>
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* ── Participants ──────────────────────────────────────────── */}
          {rightTab === 'participants' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {isAdmin && (
                <button onClick={() => setShowInviteTuteur(true)} style={{
                  width: '100%', padding: '8px 12px', borderRadius: 10, marginBottom: 6,
                  background: 'rgba(197,160,89,0.08)', border: '1px dashed rgba(197,160,89,0.35)',
                  color: '#C5A059', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,160,89,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,160,89,0.08)'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/></svg>
                  Inviter un tuteur
                </button>
              )}
              {participants.map(p => {
                const inCall  = callParticipants.some(cp => String(cp.id) === String(p.id))
                const isMe    = String(p.id) === String(user?.id)
                const canKick = isAdmin && !isMe && p.role_salle !== 'ADMIN'
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(197,160,89,0.08)',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,160,89,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar user={p} size="sm" />
                      {inCall && <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#4CAF50', border: '1.5px solid #0A1628' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.prenom} {p.nom} {isMe && <span style={{ color: '#C5A059', fontSize: 10 }}>(vous)</span>}
                      </p>
                      <p style={{ fontSize: 10, color: 'rgba(197,160,89,0.5)', textTransform: 'capitalize', marginTop: 1 }}>{p.role_salle?.toLowerCase()}</p>
                    </div>
                    {inCall && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="#4CAF50"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {canKick && (
                      <button
                        title={`Retirer ${p.prenom}`}
                        onClick={async () => {
                          if (!confirm(`Retirer ${p.prenom} ${p.nom} de la salle ?`)) return
                          try {
                            await sallesAPI.kickMembre(id, p.id)
                            setParticipants(prev => prev.filter(m => String(m.id) !== String(p.id)))
                            sendMessage(id, `${p.prenom} ${p.nom} a été retiré(e) de la salle par l'administrateur.`)
                            success(`${p.prenom} ${p.nom} a été retiré(e).`)
                          } catch (err) { error(err.response?.data?.error || 'Erreur lors du retrait.') }
                        }}
                        style={{
                          flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(198,40,40,0.10)', border: '1px solid rgba(198,40,40,0.20)',
                          color: '#ef5350', fontSize: 11, cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(198,40,40,0.20)' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'rgba(198,40,40,0.10)' }}>
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Fichiers ──────────────────────────────────────────────── */}
          {rightTab === 'fichiers' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(197,160,89,0.05)', border: '1px dashed rgba(197,160,89,0.30)',
                color: '#C5A059', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,160,89,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,160,89,0.05)'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17 8 12 3 7 8" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="3" x2="12" y2="15" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Téléverser un fichier
                <input type="file" style={{ display: 'none' }} onChange={uploadFichier} />
              </label>
              {fichiers.map(f => (
                <div key={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(197,160,89,0.10)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(197,160,89,0.10)', border: '1px solid rgba(197,160,89,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: '#E2E8F0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nom_fichier}</p>
                    <p style={{ fontSize: 10, color: 'rgba(197,160,89,0.45)', marginTop: 2 }}>{f.uploader_nom}</p>
                  </div>
                  <a href={`http://localhost:5000/${f.url_telechargement}`} download style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: 7,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(197,160,89,0.10)', border: '1px solid rgba(197,160,89,0.25)',
                    color: '#C5A059', textDecoration: 'none', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,160,89,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,160,89,0.10)'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="7 10 12 15 17 10" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="15" x2="12" y2="3" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </a>
                </div>
              ))}
              {fichiers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(197,160,89,0.30)', fontSize: 12 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Aucun fichier partagé
                </div>
              )}
            </div>
          )}

          {/* ── Séances ───────────────────────────────────────────────── */}
          {rightTab === 'seances' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isTuteur && (
                <button onClick={async () => {
                  setShowPlan(true)
                  try {
                    const [tarifsRes, disposRes] = await Promise.all([tarifsAPI.getMesTarifs(), seancesAPI.getDisponibilites()])
                    setMesTarifs(tarifsRes.data); setMesDispos(disposRes.data)
                    if (tarifsRes.data.length === 1) setPlanForm(f => ({ ...f, matiere: tarifsRes.data[0].matiere }))
                  } catch { setMesTarifs([]); setMesDispos([]) }
                }} style={{
                  width: '100%', padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(197,160,89,0.08)', border: '1px dashed rgba(197,160,89,0.35)',
                  color: '#C5A059', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,160,89,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,160,89,0.08)'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/></svg>
                  Planifier une séance
                </button>
              )}
              {seances.map(s => {
                const sStatutColor = { PLANIFIEE: '#C5A059', EN_ATTENTE_PAIEMENT: '#F59E0B', CONFIRMEE: '#4CAF50', EN_COURS: '#2196F3', REALISEE: '#4CAF50', ANNULEE: '#ef5350' }
                const sStatutLabel = { PLANIFIEE: 'Planifiée', EN_ATTENTE_PAIEMENT: 'En attente paiement', CONFIRMEE: 'Confirmée', EN_COURS: 'En cours', REALISEE: 'Réalisée', ANNULEE: 'Annulée' }
                const col = sStatutColor[s.statut] || '#6B7B8D'
                return (
                  <div key={s.id} style={{
                    borderRadius: 12, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(197,160,89,0.12)', overflow: 'hidden',
                  }}>
                    {/* Barre colorée en haut */}
                    <div style={{ height: 3, background: col }} />
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0', lineHeight: 1.3 }}>{s.titre}</p>
                        <span style={{ fontSize: 10, fontWeight: 600, color: col, flexShrink: 0, padding: '2px 7px', borderRadius: 20, background: `${col}18`, border: `1px solid ${col}35` }}>
                          {sStatutLabel[s.statut] || s.statut}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(197,160,89,0.55)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>
                          {new Date(s.date_debut).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(197,160,89,0.55)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                          {s.duree} min
                        </div>
                      </div>
                      {s.montant_total > 0 && (
                        <p style={{ fontSize: 11, color: '#C5A059', fontWeight: 600 }}>{s.montant_total} DH</p>
                      )}
                      {isAdmin && (s.statut === 'EN_ATTENTE_PAIEMENT' || s.statut_paiement === 'EN_ATTENTE_LIBERATION' || s.statut === 'CONFIRMEE') && (
                        <div style={{ marginTop: 2, padding: '8px 10px', borderRadius: 8, background: s.statut_paiement === 'EN_ATTENTE_LIBERATION' || s.statut === 'CONFIRMEE' ? 'rgba(33,150,243,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${s.statut_paiement === 'EN_ATTENTE_LIBERATION' || s.statut === 'CONFIRMEE' ? 'rgba(33,150,243,0.20)' : 'rgba(245,158,11,0.20)'}` }}>
                          {s.statut_paiement === 'EN_ATTENTE_LIBERATION' || s.statut === 'CONFIRMEE' ? (
                            <>
                              <p style={{ fontSize: 10, color: '#60a5fa', marginBottom: 6 }}>Fonds sécurisés — libération après réalisation</p>
                              <button disabled style={{ width: '100%', padding: '6px', borderRadius: 8, background: '#0f172a', color: '#60a5fa', border: '1px solid #1e40af', fontSize: 11, fontWeight: 600, cursor: 'not-allowed', opacity: 0.8 }}>Payé — en escrow</button>
                            </>
                          ) : (
                            <>
                              <p style={{ fontSize: 10, color: '#F59E0B', marginBottom: 6 }}>En attente de votre paiement</p>
                              <button onClick={() => setPaiementSeanceId(s.id)} style={{ width: '100%', padding: '7px', borderRadius: 8, background: 'linear-gradient(135deg, #C5A059, #D4B06A)', color: '#0A1628', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Payer maintenant</button>
                            </>
                          )}
                        </div>
                      )}
                      {(s.statut === 'PLANIFIEE' || s.statut === 'EN_ATTENTE_PAIEMENT' || s.statut === 'CONFIRMEE') && isTuteur && (
                        <button onClick={() => handleAnnulerSeance(s.id)} style={{ width: '100%', padding: '6px', borderRadius: 8, background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.20)', color: '#ef5350', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(198,40,40,0.16)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(198,40,40,0.08)'}>
                          Annuler la séance
                        </button>
                      )}
                      {s.statut === 'EN_COURS' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />
                            <p style={{ fontSize: 11, color: '#4CAF50', fontWeight: 600 }}>Séance en cours</p>
                          </div>
                          {isTuteur && activeCall && (
                            <button onClick={handleEndCall} style={{ width: '100%', padding: '6px', borderRadius: 8, background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.20)', color: '#ef5350', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              Terminer la séance
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {seances.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(197,160,89,0.30)', fontSize: 12 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }}><rect x="3" y="4" width="18" height="18" rx="2" stroke="#C5A059" strokeWidth="1.5"/><line x1="3" y1="10" x2="21" y2="10" stroke="#C5A059" strokeWidth="1.5"/><line x1="8" y1="2" x2="8" y2="6" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round"/><line x1="16" y1="2" x2="16" y2="6" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Aucune séance planifiée
                </div>
              )}
            </div>
          )}

          {/* ── Examens ───────────────────────────────────────────────── */}
          {rightTab === 'examens' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!tentativeActive && !resultats && (() => (
                <>
                  {isTuteur && (
                    <button onClick={() => { setShowCreateExamen(true); setEditingExamen(null); setExamForm({ titre:'', description:'', notePassage:70, dureeMinutes:30, dateDebut:'', dateLimite:'', dateAffichageResultats:'', modeAffichage:'UNE_PAR_UNE' }) }} style={{
                      width: '100%', padding: '8px 12px', borderRadius: 10,
                      background: 'rgba(197,160,89,0.08)', border: '1px dashed rgba(197,160,89,0.35)',
                      color: '#C5A059', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,160,89,0.14)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,160,89,0.08)'}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/></svg>
                      Créer un examen
                    </button>
                  )}
                  {showCreateExamen && !editingExamen?.statut && (
                    <FormExamenSalle
                      onSave={handleCreateExamenFromSalle}
                      onClose={() => setShowCreateExamen(false)}
                    />
                  )}
                  {editingExamen && editingExamen.statut === 'BROUILLON' && (
                    <div style={{ borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(197,160,89,0.20)', overflow: 'hidden' }}>
                      <div style={{ height: 3, background: 'linear-gradient(90deg, #C5A059, #D4B06A)' }} />
                      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0' }}>{editingExamen.titre}</p>
                            <p style={{ fontSize: 10, color: 'rgba(197,160,89,0.50)', marginTop: 2 }}>{(editingExamen.questions||[]).length} question(s)</p>
                          </div>
                          <button onClick={() => setEditingExamen(null)} style={{ color: 'rgba(197,160,89,0.40)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                        </div>

                        {(editingExamen.questions || []).map((q, qi) => (
                          <div key={q.id} style={{ background: 'rgba(197,160,89,0.04)', border: '1px solid rgba(197,160,89,0.12)', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <p style={{ fontSize: 11, color: '#E2E8F0', flex: 1, lineHeight: 1.4 }}>
                                <span style={{ color: '#C5A059', fontWeight: 700, marginRight: 4 }}>Q{qi+1}.</span>{q.texte}
                              </p>
                              <button onClick={() => handleDeleteQuestion(q.id)} style={{ color: 'rgba(239,83,80,0.55)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                            </div>
                            {(q.reponses||[]).map(r => (
                              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, padding: '3px 6px', borderRadius: 5, background: r.est_correcte ? 'rgba(76,175,80,0.10)' : 'transparent', color: r.est_correcte ? '#4CAF50' : 'rgba(197,160,89,0.40)' }}>
                                <span style={{ fontWeight: 700 }}>{r.est_correcte ? '✓' : '○'}</span>
                                <span>{r.texte}</span>
                              </div>
                            ))}
                          </div>
                        ))}

                        {/* Ajouter question */}
                        <div style={{ borderTop: '1px solid rgba(197,160,89,0.12)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(197,160,89,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ajouter une question</p>
                          <select value={questionForm.type} onChange={e=>setQuestionForm(f=>({...f,type:e.target.value,reponses:e.target.value==='VRAI_FAUX'?[{texte:'Vrai',estCorrecte:false},{texte:'Faux',estCorrecte:false}]:[{texte:'',estCorrecte:false},{texte:'',estCorrecte:false}]}))}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 7, background: 'rgba(197,160,89,0.06)', border: '1px solid rgba(197,160,89,0.20)', color: '#E2E8F0', fontSize: 11 }}>
                            <option value="QCM">QCM</option>
                            <option value="VRAI_FAUX">Vrai / Faux</option>
                          </select>
                          <textarea value={questionForm.texte} onChange={e=>setQuestionForm(f=>({...f,texte:e.target.value}))} placeholder="Texte de la question *" rows={2}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 7, background: 'rgba(197,160,89,0.06)', border: '1px solid rgba(197,160,89,0.20)', color: '#E2E8F0', fontSize: 11, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <label style={{ fontSize: 10, color: 'rgba(197,160,89,0.50)' }}>Points :</label>
                            <input type="number" min={0.5} step={0.5} value={questionForm.points} onChange={e=>setQuestionForm(f=>({...f,points:Number(e.target.value)}))}
                              style={{ width: 52, padding: '4px 8px', borderRadius: 6, background: 'rgba(197,160,89,0.06)', border: '1px solid rgba(197,160,89,0.20)', color: '#E2E8F0', fontSize: 11, outline: 'none' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {questionForm.reponses.map((r, ri) => (
                              <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input type="checkbox" checked={r.estCorrecte} onChange={e=>setQuestionForm(f=>({...f,reponses:f.reponses.map((rr,i)=>i===ri?{...rr,estCorrecte:e.target.checked}:rr)}))}
                                  style={{ width: 13, height: 13, accentColor: '#C5A059', flexShrink: 0, cursor: 'pointer' }} />
                                <input value={r.texte} readOnly={questionForm.type==='VRAI_FAUX'} onChange={e=>setQuestionForm(f=>({...f,reponses:f.reponses.map((rr,i)=>i===ri?{...rr,texte:e.target.value}:rr)}))} placeholder={`Réponse ${ri+1}`}
                                  style={{ flex: 1, padding: '5px 8px', borderRadius: 6, background: 'rgba(197,160,89,0.06)', border: '1px solid rgba(197,160,89,0.20)', color: '#E2E8F0', fontSize: 11, outline: 'none' }} />
                                {questionForm.type==='QCM'&&ri>1&&(<button type="button" onClick={()=>setQuestionForm(f=>({...f,reponses:f.reponses.filter((_,i)=>i!==ri)}))} style={{ color: 'rgba(239,83,80,0.60)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>)}
                              </div>
                            ))}
                            {questionForm.type==='QCM'&&questionForm.reponses.length<6&&(
                              <button type="button" onClick={()=>setQuestionForm(f=>({...f,reponses:[...f.reponses,{texte:'',estCorrecte:false}]}))}
                                style={{ fontSize: 10, color: '#C5A059', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 2 }}>
                                + Ajouter une réponse
                              </button>
                            )}
                          </div>
                          <button onClick={handleAddQuestion} style={{ width: '100%', padding: '7px', borderRadius: 8, background: 'linear-gradient(135deg, #C5A059, #D4B06A)', color: '#0A1628', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginTop: 2 }}>
                            Enregistrer la question
                          </button>
                        </div>

                        {/* Publier / Supprimer */}
                        <div style={{ display: 'flex', gap: 6, borderTop: '1px solid rgba(197,160,89,0.12)', paddingTop: 10 }}>
                          <button onClick={() => handleDeleteExamen(editingExamen.id)} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.20)', color: '#ef5350', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            Supprimer
                          </button>
                          <button onClick={() => handlePublierExamen(editingExamen.id)} disabled={(editingExamen.questions||[]).length===0} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'linear-gradient(135deg,#2E7D32,#388E3C)', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: (editingExamen.questions||[]).length===0 ? 0.4 : 1 }}>
                            Publier
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {examens.map(ex => {
                    const estTuteurExamen = ex.tuteur_id === user?.id
                    const now = new Date()
                    const apresDebut = !ex.date_debut || now >= new Date(ex.date_debut)
                    const avantLimite = !ex.date_limite || now <= new Date(ex.date_limite)
                    const peutPasser  = ex.statut === 'PUBLIE' && apresDebut && avantLimite && !ex.deja_reussi && !isTuteur
                    const exColor = ex.statut === 'BROUILLON' ? '#F59E0B' : ex.statut === 'PUBLIE' ? '#4CAF50' : '#6B7B8D'

                    return (
                      <div key={ex.id} style={{ borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: `1px solid ${ex.statut==='PUBLIE'?'rgba(76,175,80,0.15)':'rgba(197,160,89,0.10)'}` }}>
                        <div style={{ height: 3, background: exColor }} />
                        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0', flex: 1, lineHeight: 1.3 }}>{ex.titre}</p>
                            <span style={{ fontSize: 9, fontWeight: 700, color: exColor, padding: '2px 7px', borderRadius: 20, background: `${exColor}18`, border: `1px solid ${exColor}35`, flexShrink: 0, textTransform: 'uppercase' }}>
                              {ex.statut}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <span style={{ fontSize: 10, color: 'rgba(197,160,89,0.45)' }}>{ex.nb_questions||0} questions</span>
                            <span style={{ fontSize: 10, color: 'rgba(197,160,89,0.45)' }}>{ex.duree_minutes} min</span>
                            <span style={{ fontSize: 10, color: 'rgba(197,160,89,0.45)' }}>{ex.note_passage}% requis</span>
                          </div>
                          {ex.deja_reussi > 0 && (
                            <span style={{ fontSize: 10, color: '#C5A059', fontWeight: 600 }}>Réussi</span>
                          )}
                          {estTuteurExamen && ex.statut === 'BROUILLON' && (
                            <button onClick={async()=>{const{data}=await examensAPI.getById(ex.id);setEditingExamen(data);setShowCreateExamen(false)}} style={{ width: '100%', padding: '6px', borderRadius: 8, background: 'rgba(197,160,89,0.08)', border: '1px solid rgba(197,160,89,0.25)', color: '#C5A059', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,160,89,0.16)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,160,89,0.08)'}>
                              Gérer les questions
                            </button>
                          )}
                         {!isTuteur && ex.statut === 'PUBLIE' && (
  peutPasser ? (
    <button onClick={() => handleDemarrerExamen(ex.id)} style={{ width: '100%', padding: '7px', borderRadius: 8, background: 'linear-gradient(135deg, #C5A059, #D4B06A)', color: '#0A1628', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
      Commencer l'examen
    </button>
  ) : null
)}
                        </div>
                      </div>
                    )
                  })}
                  {examens.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(197,160,89,0.30)', fontSize: 12 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }}><path d="M9 11l3 3L22 4" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {isTuteur ? 'Aucun examen créé.' : 'Aucun examen disponible.'}
                    </div>
                  )}
                </>
              ))()}
            </div>
          )}
        </div>
      </div>

      {/* Appel entrant */}
   {incomingCall && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div style={{
      background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F0E6 100%)',
      border: '2px solid #C5A059',
      borderRadius: '24px',
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      maxWidth: '320px',
      width: '100%',
      margin: '16px',
    }}>
      <div className="relative">
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #C5A059, #D4B06A)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          boxShadow: '0 4px 20px rgba(197,160,89,0.3)',
        }}>
          👨‍🏫
        </div>
        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
      </div>
      <div className="text-center">
        {incomingCall.isOngoing ? (
          <>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#4CAF50', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              🔴 Appel en cours
            </p>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#0A1628', marginBottom: '4px' }}>
              {incomingCall.initiateurNom}
            </p>
            <p style={{ fontSize: '13px', color: '#8B9CB5', margin: 0 }}>
              Un appel est déjà actif dans cette salle
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#C5A059', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              📞 Appel entrant
            </p>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#0A1628', marginBottom: '4px' }}>
              {incomingCall.initiateurNom}
            </p>
            <p style={{ fontSize: '13px', color: '#8B9CB5', margin: 0 }}>
              vous invite à rejoindre l'appel
            </p>
          </>
        )}
      </div>
      <div className="flex gap-4 mt-2">
        <button 
          onClick={() => refuseCallRef.current?.(incomingCall.sessionId)} 
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(220,38,38,0.12)',
            border: '2px solid rgba(220,38,38,0.4)',
            color: '#DC2626',
            fontSize: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(220,38,38,0.25)'
            e.currentTarget.style.borderColor = '#DC2626'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(220,38,38,0.12)'
            e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          📵
        </button>
        <button 
          onClick={() => acceptCallRef.current?.(incomingCall.sessionId)} 
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #C5A059, #D4B06A)',
            border: 'none',
            color: '#0A1628',
            fontSize: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(197,160,89,0.3)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(197,160,89,0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(197,160,89,0.3)'
          }}
        >
          📞
        </button>
      </div>
    </div>
  </div>
)}

      {/* ── Modal planifier séance — thème navy+gold (même que EmploiDuTemps) ── */}
      <Modal open={showPlan} onClose={() => { setShowPlan(false); setPlanForm({ titre:'', matiere:'', dateDebut:'', duree:60, heureDebut:'', creneauDispo:null }); setMesTarifs([]); setMesDispos([]) }} title="📅 Planifier une séance" width="max-w-xl">
        <div style={{ maxHeight:'80vh', overflowY:'auto' }}>
          <form onSubmit={handlePlanifier} style={{ display:'flex', flexDirection:'column', gap:0 }}>

            {/* ── Étape 1 : Titre ─────────────────────────────── */}
            <div style={{ padding:'14px 24px', borderBottom:'1px solid #E8D5A3' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:'#0A1628', border:'1.5px solid #C5A059', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:10, fontWeight:800, color:'#C5A059' }}>1</span>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:'#8B9CB5', textTransform:'uppercase', letterSpacing:'0.05em' }}>Titre de la séance</span>
              </div>
              <input required value={planForm.titre} onChange={e => setPlanForm(f => ({...f, titre:e.target.value}))} placeholder="ex: Cours d'Algèbre Linéaire"
                style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #E8D5A3', background:'#FFFFFF', color:'#0A1628', fontSize:13, outline:'none', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='#C5A059'} onBlur={e => e.target.style.borderColor='#E8D5A3'} />
            </div>

            {/* ── Étape 2 : Matière & Tarif ───────────────────── */}
            <div style={{ padding:'14px 24px', borderBottom:'1px solid #E8D5A3' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:'#0A1628', border:'1.5px solid #C5A059', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:10, fontWeight:800, color:'#C5A059' }}>2</span>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:'#8B9CB5', textTransform:'uppercase', letterSpacing:'0.05em' }}>Matière & Tarif</span>
              </div>
              {mesTarifs.length > 0 ? (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {mesTarifs.map(t => {
                    const sel = planForm.matiere === t.matiere
                    return (
                      <button key={t.id} type="button" onClick={() => setPlanForm(f => ({...f, matiere:t.matiere}))}
                        style={{ padding:'8px 14px', borderRadius:10, cursor:'pointer', transition:'all 0.15s', background:sel?'#0A1628':'#FFFFFF', border:sel?'2px solid #C5A059':'1.5px solid #E8D5A3', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:sel?'#C5A059':'#0A1628' }}>{t.matiere}</span>
                        <span style={{ fontSize:10, color:sel?'#C5A059':'#8B9CB5' }}>{t.tarif_heure} DH/h</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div>
                  <input required value={planForm.matiere} onChange={e => setPlanForm(f => ({...f, matiere:e.target.value}))} placeholder="ex: Mathématiques"
                    style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #E8D5A3', background:'#FFFFFF', color:'#0A1628', fontSize:13, outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='#C5A059'} onBlur={e => e.target.style.borderColor='#E8D5A3'} />
                  <p style={{ fontSize:11, color:'#F59E0B', marginTop:6 }}>⚠️ Configurez vos tarifs pour un calcul automatique.</p>
                </div>
              )}
              {!planForm.matiere && <p style={{ fontSize:11, color:'#EF4444', marginTop:6, fontWeight:600 }}>⚠️ Matière obligatoire — l'admin ne peut pas payer sans tarif.</p>}
            </div>

            {/* ── Étape 3 : Créneau ───────────────────────────── */}
            <div style={{ padding:'14px 24px', borderBottom:'1px solid #E8D5A3' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:'#0A1628', border:'1.5px solid #C5A059', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:10, fontWeight:800, color:'#C5A059' }}>3</span>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:'#8B9CB5', textTransform:'uppercase', letterSpacing:'0.05em' }}>Choisir un créneau</span>
              </div>
              {mesDispos.length === 0 ? (
                <div style={{ borderRadius:10, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', padding:'12px 14px' }}>
                  <p style={{ fontSize:12, color:'#F59E0B', margin:'0 0 4px' }}>⚠️ Aucune disponibilité configurée.</p>
                  <a href="/dashboard/disponibilites" style={{ fontSize:11, color:'#FCD34D' }}>→ Configurer mes disponibilités</a>
                </div>
              ) : (() => {
                const JNOMS = ['','Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
                const MOIS  = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
                const seen  = new Set()
                const creneaux = []
                const now   = new Date()
                const today = new Date(now); today.setHours(0,0,0,0)
                for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
                  const date = new Date(today); date.setDate(today.getDate() + dayOffset)
                  const jourISO = date.getDay() === 0 ? 7 : date.getDay()
                  for (const d of mesDispos) {
                    if (d.jour_semaine !== jourISO) continue
                    const [h, m] = d.heure_debut.split(':').map(Number)
                    const dateAvecHeure = new Date(date); dateAvecHeure.setHours(h, m, 0, 0)
                    const [hf, mf] = d.heure_fin.split(':').map(Number)
                    const dateFinCreneau = new Date(date); dateFinCreneau.setHours(hf, mf, 0, 0)
                    if (dateFinCreneau <= now) continue
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
                    const key = `${dateStr}-${d.heure_debut}`
                    if (seen.has(key)) continue
                    seen.add(key)
                    creneaux.push({ key, dateStr, heureDebut:d.heure_debut, heureFin:d.heure_fin, dateObj:new Date(dateAvecHeure), jourNom:JNOMS[jourISO], jour:date.getDate(), mois:MOIS[date.getMonth()] })
                  }
                }
                if (creneaux.length === 0) return <p style={{ fontSize:12, color:'#F59E0B' }}>Aucun créneau dans les 28 prochains jours.</p>
                return (
                  <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:220, overflowY:'auto', paddingRight:2 }}>
                    {creneaux.map(cr => {
                      const sel = planForm.creneauDispo?.key === cr.key
                      const [hd,md] = cr.heureDebut.split(':').map(Number)
                      const [hf,mf] = cr.heureFin.split(':').map(Number)
                      const maxDur = (hf*60+mf) - (hd*60+md)
                      return (
                        <button key={cr.key} type="button"
                          onClick={() => setPlanForm(f => ({ ...f, creneauDispo:cr, heureDebut:cr.heureDebut, duree:Math.min(f.duree||60,maxDur), dateDebut:`${cr.dateStr}T${cr.heureDebut}` }))}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:11, cursor:'pointer', transition:'all 0.15s', background:sel?'#0A1628':'transparent', border:sel?'2px solid #C5A059':'1px solid #E8D5A3' }}>
                          <div style={{ flexShrink:0, width:40, height:40, borderRadius:10, background:sel?'rgba(197,160,89,0.12)':'rgba(197,160,89,0.06)', border:`1px solid ${sel?'#C5A059':'#E8D5A3'}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ fontSize:8, fontWeight:700, color:sel?'#C5A059':'#8B9CB5', textTransform:'uppercase' }}>{cr.jourNom}</span>
                            <span style={{ fontSize:16, fontWeight:800, color:sel?'#C5A059':'#0A1628', lineHeight:1.2 }}>{cr.jour}</span>
                            <span style={{ fontSize:8, color:sel?'#C5A059':'#8B9CB5' }}>{cr.mois}</span>
                          </div>
                          <div style={{ flex:1, textAlign:'left' }}>
                            <div style={{ fontSize:13, fontWeight:700, color:sel?'#C5A059':'#0A1628' }}>{cr.heureDebut} – {cr.heureFin}</div>
                            <div style={{ fontSize:10, color:'#8B9CB5', marginTop:1 }}>{maxDur} min disponibles</div>
                          </div>
                          {sel && <span style={{ color:'#C5A059' }}>✓</span>}
                        </button>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* ── Étape 4 : Heure & Durée ─────────────────────── */}
            {planForm.creneauDispo && (() => {
              const cr = planForm.creneauDispo
              const [hDeb,mDeb] = cr.heureDebut.split(':').map(Number)
              const [hFin,mFin] = cr.heureFin.split(':').map(Number)
              const totalMinFin = hFin*60+mFin
              const heures = []
              for (let min = hDeb*60+mDeb; min <= totalMinFin-5; min+=30)
                heures.push(`${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`)
              const [hC,mC] = (planForm.heureDebut||cr.heureDebut).split(':').map(Number)
              const dureeMax = totalMinFin - (hC*60+mC)
              const finMin = hC*60+mC + Math.min(planForm.duree, dureeMax)
              const heureFin = `${String(Math.floor(finMin/60)).padStart(2,'0')}:${String(finMin%60).padStart(2,'0')}`
              return (
                <div style={{ padding:'14px 24px', borderBottom:'1px solid #E8D5A3' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'#0A1628', border:'1.5px solid #C5A059', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:10, fontWeight:800, color:'#C5A059' }}>4</span>
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:'#8B9CB5', textTransform:'uppercase', letterSpacing:'0.05em' }}>Heure & Durée</span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:8 }}>
                    {heures.map(h => {
                      const sel = planForm.heureDebut === h
                      return (
                        <button key={h} type="button"
                          onClick={() => { const [hh,mm]=h.split(':').map(Number); const max=totalMinFin-(hh*60+mm); setPlanForm(f=>({...f,heureDebut:h,duree:Math.min(f.duree||5,max),dateDebut:`${cr.dateStr}T${h}`})) }}
                          style={{ padding:'7px 16px', borderRadius:9, cursor:'pointer', fontSize:13, fontWeight:700, transition:'all 0.15s', background:sel?'#C5A059':'transparent', border:sel?'2px solid #C5A059':'1.5px solid #E8D5A3', color:sel?'#fff':'#8B9CB5' }}>
                          {h}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <span style={{ fontSize:11, color:'#8B9CB5', fontWeight:600 }}>Ou saisir manuellement :</span>
                    <input type="time" value={planForm.heureDebut || ''} min={cr.heureDebut} max={cr.heureFin}
                      onChange={e => { const h=e.target.value; if(!h)return; const [hh,mm]=h.split(':').map(Number); const max=totalMinFin-(hh*60+mm); if(max<5)return; setPlanForm(f=>({...f,heureDebut:h,duree:Math.min(f.duree||5,max),dateDebut:`${cr.dateStr}T${h}`})) }}
                      style={{ padding:'7px 12px', borderRadius:9, border:'1.5px solid #E8D5A3', background:'#FFFFFF', color:'#0A1628', fontSize:13, fontWeight:700, outline:'none' }} />
                  </div>
                  {planForm.heureDebut && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, background:'#FFFFFF', border:'1.5px solid #E8D5A3', borderRadius:10, padding:'6px 12px' }}>
                        <span style={{ fontSize:11, color:'#8B9CB5' }}>Durée :</span>
                        <input type="number" min={5} max={dureeMax} step={5} value={planForm.duree}
                          onChange={e => setPlanForm(f=>({...f,duree:Math.min(Number(e.target.value),dureeMax)}))}
                          style={{ width:60, border:'none', background:'transparent', color:'#0A1628', fontSize:13, fontWeight:700, outline:'none', textAlign:'center' }} />
                        <span style={{ fontSize:11, color:'#8B9CB5' }}>min</span>
                      </div>
                      <div style={{ flex:1, minWidth:140, display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderRadius:10, background:'linear-gradient(135deg,#0A1628,rgba(197,160,89,0.12))', border:'1.5px solid rgba(197,160,89,0.25)' }}>
                        <span style={{ fontSize:18 }}>🕐</span>
                        <div>
                          <div style={{ fontSize:14, fontWeight:800, color:'#C5A059' }}>{planForm.heureDebut} → {heureFin}</div>
                          <div style={{ fontSize:10, color:'#8B9CB5' }}>{planForm.duree} minutes</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* ── Footer ─────────────────────────────────────────── */}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', padding:'16px 24px 20px', borderTop:'1px solid #E8D5A3', marginTop:4 }}>
              <button type="button"
                onClick={() => { setShowPlan(false); setPlanForm({ titre:'', matiere:'', dateDebut:'', duree:60, heureDebut:'', creneauDispo:null }); setMesTarifs([]); setMesDispos([]) }}
                style={{ padding:'9px 20px', borderRadius:10, border:'1.5px solid #E8D5A3', background:'transparent', color:'#8B9CB5', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Annuler
              </button>
              <button type="submit"
                disabled={!planForm.creneauDispo || !planForm.heureDebut || !planForm.matiere || !planForm.titre}
                style={{ padding:'9px 24px', borderRadius:10, border:'none', fontSize:13, fontWeight:700, cursor:(!planForm.creneauDispo||!planForm.heureDebut||!planForm.matiere||!planForm.titre)?'not-allowed':'pointer', transition:'all 0.2s', background:(!planForm.creneauDispo||!planForm.heureDebut||!planForm.matiere||!planForm.titre)?'rgba(197,160,89,0.3)':'#C5A059', color:(!planForm.creneauDispo||!planForm.heureDebut||!planForm.matiere||!planForm.titre)?'rgba(255,255,255,0.4)':'#fff' }}>
                📅 Planifier la séance
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal open={showInviteTuteur} onClose={() => setShowInviteTuteur(false)} title="👨‍🏫 Inviter un tuteur">
        <InviteTuteurModal salleId={id} hasTuteur={hasTuteur} onClose={() => setShowInviteTuteur(false)} onSuccess={msg => success(msg)} onError={msg => error(msg)} />
      </Modal>

      {paiementSeanceId && (
        <PaiementModal seanceId={paiementSeanceId} onClose={() => setPaiementSeanceId(null)}
          onSuccess={() => {
            setPaiementSeanceId(null)
            setSeances(prev => prev.map(s => s.id === paiementSeanceId ? { ...s, statut:'CONFIRMEE', statut_paiement:'EN_ATTENTE_LIBERATION' } : s))
            success('✅ Paiement confirmé — séance confirmée !')
          }} />
      )}
    </div>
  )
}