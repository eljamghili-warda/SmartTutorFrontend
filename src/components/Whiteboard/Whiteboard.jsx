import React, { useRef, useEffect, useState, useCallback } from 'react'
import { getSocket, drawOnBoard, clearBoard, blockBoard, syncBoard } from '../../services/socket'

const Whiteboard = ({ salleId, isTuteur }) => {
  const canvasRef  = useRef(null)
  const ctxRef     = useRef(null)
  const isDrawing  = useRef(false)
  const lastPos    = useRef({ x:0, y:0 })

  const [tool,    setTool]    = useState('pen')
  const [color,   setColor]   = useState('#A78BFA')
  const [size,    setSize]    = useState(4)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctxRef.current = ctx
    syncBoard(salleId)

    const onResize = () => {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight
      ctx.putImageData(img, 0, 0)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [salleId])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    socket.on('whiteboard:draw',         ({ donnees }) => renderStroke(donnees))
    socket.on('whiteboard:cleared',      () => { const c = canvasRef.current; ctxRef.current?.clearRect(0,0,c.width,c.height) })
    socket.on('whiteboard:block-status', ({ bloquer }) => setBlocked(bloquer))
    socket.on('whiteboard:state',        ({ etatDessin, ecritureBloquee }) => {
      setBlocked(ecritureBloquee)
      try { const s = JSON.parse(etatDessin); if (Array.isArray(s)) s.forEach(renderStroke) } catch {}
    })
    return () => {
      socket.off('whiteboard:draw'); socket.off('whiteboard:cleared')
      socket.off('whiteboard:block-status'); socket.off('whiteboard:state')
    }
  }, [])

  const renderStroke = (d) => {
    const ctx = ctxRef.current; if (!ctx || !d) return
    ctx.globalCompositeOperation = d.tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = d.color; ctx.lineWidth = d.size
    ctx.beginPath(); ctx.moveTo(d.x0, d.y0); ctx.lineTo(d.x1, d.y1); ctx.stroke()
  }

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const src  = e.touches ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  const canDraw = !blocked || isTuteur

  const startDraw = useCallback((e) => {
    if (!canDraw) return
    isDrawing.current = true
    lastPos.current = getPos(e, canvasRef.current)
  }, [canDraw])

  const draw = useCallback((e) => {
    if (!isDrawing.current || !canDraw) return
    e.preventDefault()
    const pos = getPos(e, canvasRef.current)
    const stroke = { x0: lastPos.current.x, y0: lastPos.current.y, x1: pos.x, y1: pos.y,
      color: tool === 'eraser' ? '#000000' : color, size, tool }
    renderStroke(stroke); drawOnBoard(salleId, stroke)
    lastPos.current = pos
  }, [canDraw, tool, color, size, salleId])

  const stopDraw = useCallback(() => { isDrawing.current = false }, [])

  const handleClear = () => {
    const c = canvasRef.current; ctxRef.current.clearRect(0,0,c.width,c.height); clearBoard(salleId)
  }

  const TOOLS = [
    { id:'pen',    icon:'✏️', label:'Stylo' },
    { id:'eraser', icon:'🧽', label:'Gomme' },
  ]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-2 bg-ink-900 border-b border-ink-700 flex-shrink-0 flex-wrap">
        {/* Tools */}
        <div className="flex gap-1">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
              className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all border
                ${tool === t.id ? 'bg-violet-600/20 border-violet-500 text-violet-400' : 'border-ink-600 hover:border-ink-500 text-slate-400'}`}>
              {t.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-ink-700" />

        {/* Color */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">🎨</span>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="!w-8 !h-8 !p-0 !border-0 !rounded-lg cursor-pointer !bg-transparent" />
          {/* Quick colors */}
          {['#A78BFA','#F87171','#34D399','#FBBF24','#60A5FA','#FFFFFF','#1F2937'].map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ background: c }} />
          ))}
        </div>

        <div className="w-px h-6 bg-ink-700" />

        {/* Size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">📏</span>
          <input type="range" min={1} max={30} value={size} onChange={e => setSize(Number(e.target.value))}
            className="w-20 accent-violet-500" />
          <span className="text-xs text-slate-500 w-4">{size}</span>
        </div>

        {/* Tuteur controls */}
        {isTuteur && (
          <>
            <div className="w-px h-6 bg-ink-700" />
            <div className="flex gap-1 ml-auto">
              <button onClick={() => { blockBoard(salleId, !blocked); setBlocked(b => !b) }} title={blocked ? 'Débloquer' : 'Bloquer étudiants'}
                className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all border
                  ${blocked ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'border-ink-600 hover:border-amber-500/50 text-slate-400 hover:text-amber-400'}`}>
                {blocked ? '🔒' : '🔓'}
              </button>
              <button onClick={handleClear} title="Effacer tout"
                className="w-8 h-8 rounded-lg text-base flex items-center justify-center border border-ink-600 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-all">
                🗑️
              </button>
            </div>
          </>
        )}

        {blocked && !isTuteur && (
          <div className="ml-auto text-xs text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
            🔒 Tableau bloqué par le tuteur
          </div>
        )}
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef}
        style={{ cursor: !canDraw ? 'not-allowed' : tool === 'eraser' ? 'cell' : 'crosshair', opacity: !canDraw ? 0.85 : 1 }}
        className="flex-1 w-full touch-none block"
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
      />
    </div>
  )
}

export default Whiteboard