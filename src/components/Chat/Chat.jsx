import React, { useState, useRef, useEffect } from 'react'

// Détecte si un message est une notification de séance planifiée
// Format attendu: "📅 Séance planifiée : <titre> le <date> (<duree> min). seance_id:<id>"
const parseSeanceMessage = (contenu) => {
  const match = contenu.match(/seance_id:(\d+)/)
  if (!match) return null
  return { seanceId: parseInt(match[1]) }
}

const Chat = ({ messages, onSend, currentUser, isAdmin, onPayer }) => {
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

  // Affiche le contenu du message — si c'est une notif séance, masque le seance_id
  const renderContenu = (contenu) => {
    return contenu.replace(/\s*seance_id:\d+/, '').trim()
  }

  return (
    <div className="flex flex-col h-full bg-ink-950">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ink-700 flex items-center gap-2 flex-shrink-0 bg-ink-900">
        <span className="text-sm font-display font-semibold text-slate-300">💬 Chat</span>
        <span className="text-xs text-slate-600">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-slate-700 text-center">Aucun message.<br />Soyez le premier à écrire !</p>
          </div>
        )}
        {messages.map(msg => {
          const seanceInfo = parseSeanceMessage(msg.contenu)
          const isSeanceMsg = !!seanceInfo
          const mine = isMine(msg)

          return (
            <div key={msg.id} className={`flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}>
              {!mine && (
                <span className="text-xs text-slate-600 px-1 font-medium">{msg.expediteur_nom}</span>
              )}
              <div className={`max-w-[85%] rounded-2xl text-sm leading-relaxed break-words overflow-hidden
                ${mine
                  ? 'bg-violet-600 text-white rounded-br-sm'
                  : 'bg-ink-700 text-slate-200 rounded-bl-sm border border-ink-600'
                }`}>
                <div className="px-3 py-2">
                  {renderContenu(msg.contenu)}
                </div>

                {/* Bouton Payer — visible uniquement pour l'admin et sur un message de séance */}
                {isSeanceMsg && isAdmin && onPayer && (
                  <div className="px-3 pb-2.5 pt-0">
                    <button
                      onClick={() => onPayer(seanceInfo.seanceId)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 12px rgba(124,58,237,0.4)',
                      }}
                    >
                      💳 Payer cette séance
                    </button>
                  </div>
                )}

                {/* Badge info pour les non-admins */}
                {isSeanceMsg && !isAdmin && (
                  <div className="px-3 pb-2">
                    <span className="text-xs text-amber-400 opacity-75">⏳ En attente de paiement</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-700 px-1">{fmt(msg.horodatage)}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-ink-700 bg-ink-900 flex-shrink-0">
        <input value={text} onChange={e => setText(e.target.value)}
          placeholder="Message..."
          className="!flex-1 !py-2 !text-sm !rounded-xl !bg-ink-800 !border-ink-600"
        />
        <button type="submit"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors flex-shrink-0 text-sm">
          ➤
        </button>
      </form>
    </div>
  )
}

export default Chat