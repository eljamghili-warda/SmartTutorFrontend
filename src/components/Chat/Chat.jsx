import React, { useState, useRef, useEffect } from 'react'

const Chat = ({ messages, onSend, currentUser }) => {
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
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col gap-0.5 ${isMine(msg) ? 'items-end' : 'items-start'}`}>
            {!isMine(msg) && (
              <span className="text-xs text-slate-600 px-1 font-medium">{msg.expediteur_nom}</span>
            )}
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words
              ${isMine(msg)
                ? 'bg-violet-600 text-white rounded-br-sm'
                : 'bg-ink-700 text-slate-200 rounded-bl-sm border border-ink-600'
              }`}>
              {msg.contenu}
            </div>
            <span className="text-[10px] text-slate-700 px-1">{fmt(msg.horodatage)}</span>
          </div>
        ))}
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