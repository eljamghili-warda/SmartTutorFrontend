import { io } from 'socket.io-client'

let socket = null

export const initSocket = (token) => {
  if (socket) socket.disconnect()
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })
  socket.on('connect', () => socket.emit('register'))
  return socket
}

export const getSocket = () => socket
export const disconnectSocket = () => { if (socket) { socket.disconnect(); socket = null } }

export const joinSalle    = (id) => socket?.emit('join:salle',  { salleId: id })
export const leaveSalle   = (id) => socket?.emit('leave:salle', { salleId: id })
export const sendMessage = (id, contenu) => {
  const socket = getSocket()
  if (!socket) return

  socket.emit('chat:message', { salleId: id, contenu })
}

export const drawOnBoard  = (id, donnees) => socket?.emit('whiteboard:draw',  { salleId: id, donnees })
export const clearBoard   = (id) => socket?.emit('whiteboard:clear',  { salleId: id })
export const blockBoard   = (id, bloquer) => socket?.emit('whiteboard:block', { salleId: id, bloquer })
export const syncBoard    = (id) => socket?.emit('whiteboard:sync',  { salleId: id })

export const startCall    = (id, seanceId = null) => socket?.emit('call:start', { salleId: id, seanceId })
export const endCall      = (id, sessionId) => socket?.emit('call:end',  { salleId: id, sessionId })
export const joinCall     = (id, sessionId) => socket?.emit('call:join', { salleId: id, sessionId })
export const sendOffer    = (to, offer, sid) => socket?.emit('call:offer',          { targetUserId: to, offer, sessionId: sid })
export const sendAnswer   = (to, answer, sid) => socket?.emit('call:answer',        { targetUserId: to, answer, sessionId: sid })
export const sendIce      = (to, candidate) => socket?.emit('call:ice-candidate',   { targetUserId: to, candidate })
export const toggleMute   = (sid, muted) => socket?.emit('call:mute', { sessionId: sid, muted })

// ── Screen sharing ───────────────────────────────────────────────────────────
export const startScreenShare  = (salleId) => socket?.emit('screen:start',  { salleId })
export const stopScreenShare   = (salleId) => socket?.emit('screen:stop',   { salleId })
export const sendScreenOffer   = (to, offer)   => socket?.emit('screen:offer',   { targetUserId: to, offer })
export const sendScreenAnswer  = (to, answer)  => socket?.emit('screen:answer',  { targetUserId: to, answer })
export const sendScreenIce     = (to, candidate) => socket?.emit('screen:ice',   { targetUserId: to, candidate })