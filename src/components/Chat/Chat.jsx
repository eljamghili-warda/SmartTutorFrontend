import React, { useState, useRef, useEffect } from 'react'

// Détecte si un message est une notification de séance planifiée
// Format attendu: "📅 Séance planifiée : <titre> le <date> (<duree> min). seance_id:<id>"
const parseSeanceMessage = (contenu) => {
  const match = contenu.match(/seance_id:(\d+)/)
  if (!match) return null
  return { seanceId: parseInt(match[1]) }
}

// seances = liste des séances de la salle (pour vérifier le statut de paiement)
const Chat = ({ messages, onSend, currentUser, isAdmin, onPayer, seances = [] }) => {
  const [text, setText]   = useState('')
  const bottomRef         = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text.trim()); setText('')
  }

  const isMine = (msg) => msg.expediteur_id === currentUser?.id

  const fmt = (ts) => new Date(ts).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })

  // Affiche le contenu du message — masque le seance_id technique
  const renderContenu = (contenu) => {
    return contenu.replace(/\s*seance_id:\d+/, '').trim()
  }

  // Vérifie si une séance est déjà payée/confirmée
  const isSeancePaye = (seanceId) => {
    const s = seances.find(s => s.id === seanceId || String(s.id) === String(seanceId))
    if (!s) return false
    return s.statut_paiement === 'PAYE' || s.statut === 'CONFIRMEE' || s.statut === 'REALISEE' || s.statut === 'EN_COURS'
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#D6E6F5' }}> {/* T.blue100 */}
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0" style={{ borderBottomColor: '#E0D5C0', background: '#FFFFFF' }}>
        <span className="text-sm font-display font-semibold" style={{ color: '#1A3A5C' }}>💬 Chat</span>
        <span className="text-xs" style={{ color: '#6B7B8D' }}>{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-center" style={{ color: '#888780' }}>Aucun message.<br />Soyez le premier à écrire !</p>
          </div>
        )}
        {messages.map(msg => {
          const seanceInfo  = parseSeanceMessage(msg.contenu)
          const isSeanceMsg = !!seanceInfo
          const mine        = isMine(msg)
          const paye        = isSeanceMsg && isSeancePaye(seanceInfo?.seanceId)

          return (
            <div key={msg.id} className={`flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}>
              {!mine && (
                <span className="text-xs px-1 font-medium" style={{ color: '#5F5E5A' }}>{msg.expediteur_nom}</span>
              )}
              <div className={`max-w-[85%] rounded-2xl text-sm leading-relaxed break-words overflow-hidden
                ${mine
                  ? 'text-white rounded-br-sm'
                  : 'rounded-bl-sm'
                }`}
                style={mine
                  ? { background: '#2C5F8A', color: '#FFFFFF' }
                  : { background: '#FFFFFF', color: '#1A3A5C', border: '0.5px solid #E0D5C0' }
                }>
                <div className="px-3 py-2">
                  {renderContenu(msg.contenu)}
                </div>

                {/* Bouton Payer — admin seulement, séance pas encore payée */}
                {isSeanceMsg && isAdmin && onPayer && !paye && (
                  <div className="px-3 pb-2.5 pt-0">
                    <button
                      onClick={() => onPayer(seanceInfo.seanceId)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #2C5F8A, #4A90E2)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 12px rgba(44,95,138,0.4)',
                      }}
                    >
                      💳 Payer cette séance
                    </button>
                  </div>
                )}

                {/* Bouton désactivé — séance déjà payée */}
                {isSeanceMsg && isAdmin && paye && (
                  <div className="px-3 pb-2.5 pt-0">
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold"
                      style={{
                        background: '#E8F5E9',
                        color: '#2E7D32',
                        border: '0.5px solid #A5D6A7',
                        cursor: 'not-allowed',
                        opacity: 0.85,
                      }}
                    >
                      ✅ Séance payée
                    </button>
                  </div>
                )}

                {/* Badge pour les non-admins */}
                {isSeanceMsg && !isAdmin && (
                  <div className="px-3 pb-2">
                    <span className={`text-xs font-semibold ${paye ? 'text-green-600' : 'text-amber-600 opacity-75'}`}>
                      {paye ? '✅ Séance confirmée' : '⏳ En attente de paiement'}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[10px] px-1" style={{ color: '#888780' }}>{fmt(msg.horodatage)}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t flex-shrink-0" style={{ borderTopColor: '#E0D5C0', background: '#FFFFFF' }}>
        <input 
          value={text} 
          onChange={e => setText(e.target.value)}
          placeholder="Message..."
          className="!flex-1 !py-2 !text-sm !rounded-xl"
          style={{
            background: '#F5F0E6',
            border: '0.5px solid #D3D1C7',
            color: '#1A3A5C',
            outline: 'none',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '13px',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#C5A059'
            e.target.style.boxShadow = '0 0 0 2px rgba(197,160,89,0.2)'
          }}
          onBlur={e => {
            e.target.style.borderColor = '#D3D1C7'
            e.target.style.boxShadow = 'none'
          }}
        />
        <button 
          type="submit"
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 text-sm"
          style={{
            background: '#2C5F8A',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1A3A5C'}
          onMouseLeave={e => e.currentTarget.style.background = '#2C5F8A'}
        >
          ➤
        </button>
      </form>
    </div>
  )
}

export default Chat