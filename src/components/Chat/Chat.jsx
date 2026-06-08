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

  // Vérifie l'état réel d'une séance
  const getSeanceStatut = (seanceId) => {
    const s = seances.find(s => s.id === seanceId || String(s.id) === String(seanceId))
    if (!s) return null
    return s.statut
  }

  // Vérifie si une séance est déjà payée/confirmée
  const isSeancePaye = (seanceId) => {
    const statut = getSeanceStatut(seanceId)
    return ['CONFIRMEE', 'EN_COURS', 'REALISEE'].includes(statut)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0f3d69' }}> {/* T.blue100 */}
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0" style={{ borderBottomColor: '#9f8416', background: '#05193ab1' }}>
        <span className="text-sm font-display font-semibold" style={{ color: '#cbd5df' }}>💬 Chat</span>
        <span className="text-xs" style={{ color: '#9c890ee9' }}>{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-center" style={{ color: '#999a90' }}>Aucun message.<br />Soyez le premier à écrire !</p>
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
                <span className="text-xs px-1 font-medium" style={{ color: '#e8e6de' }}>{msg.expediteur_nom}</span>
              )}
              <div className={`max-w-[85%] rounded-2xl text-sm leading-relaxed break-words overflow-hidden
                ${mine
                  ? 'text-white rounded-br-sm'
                  : 'rounded-bl-sm'
                }`}
                style={mine
                  ? { background: '#5fa6e0', color: '#330e0ed5' }
                  : { background: '#98b7d3', color: '#1A3A5C', border: '0.5px solid #E0D5C0' }
                }>
                <div className="px-3 py-2">
                  {renderContenu(msg.contenu)}
                </div>

                {isSeanceMsg && (() => {
                  const statut = getSeanceStatut(seanceInfo?.seanceId)
                  const annulee = statut === 'ANNULEE'
                  const paye = isSeancePaye(seanceInfo?.seanceId)
                  const enAttente = !paye && !annulee

                  return (
                    <div className="px-3 pb-2.5 pt-0">
                      {/* Admin — bouton payer */}
                      {isAdmin && enAttente && onPayer && (
                        <button
                          onClick={() => onPayer(seanceInfo.seanceId)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: 'linear-gradient(135deg, #659369, #074d1ec7)',
                            color: '#e2d5d5', border: 'none', cursor: 'pointer',
                            boxShadow: '0 2px 12px rgba(44,95,138,0.4)',
                          }}
                        >
                          💳 Payer cette séance
                        </button>
                      )}

                      {/* Admin — déjà payée / confirmée */}
                      {isAdmin && paye && (
                        <button disabled
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold"
                          style={{ background:'#EFF6FF', color:'#1d4ed8', border:'0.5px solid #bfdbfe', cursor:'not-allowed', opacity:0.9 }}
                        >
                          🔒 Séance confirmée — fonds sécurisés
                        </button>
                      )}

                      {/* Admin — annulée */}
                      {isAdmin && annulee && (
                        <button disabled
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold"
                          style={{ background:'#FEF2F2', color:'#dc2626', border:'0.5px solid #fecaca', cursor:'not-allowed', opacity:0.9 }}
                        >
                          ❌ Séance annulée — remboursement 100%
                        </button>
                      )}

                      {/* Non-admin — badge statut */}
                      {!isAdmin && (
                        <span className="text-xs font-semibold" style={{
                          color: annulee ? '#dc2626' : paye ? '#1d4ed8' : '#d97706'
                        }}>
                          {annulee ? '❌ Séance annulée'
                            : paye ? '🔒 Séance confirmée'
                            : '⏳ En attente de paiement'}
                        </span>
                      )}
                    </div>
                  )
                })()}
              </div>
              <span className="text-[10px] px-1" style={{ color: '#e9e9d96c' }}>{fmt(msg.horodatage)}</span>
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
            background: '#e8e1d5',
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
            background: '#214c88',
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