import React from 'react'

/* ─── Button ─────────────────────────────────────────────── */
export const Btn = ({ children, variant = 'primary', size = 'md', className = '', disabled, onClick, type = 'button' }) => {
  const base = 'inline-flex items-center gap-2 font-display font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' }
  const variants = {
    primary:   'bg-violet-600 hover:bg-violet-500 text-white shadow-glow-sm hover:shadow-glow active:scale-95',
    secondary: 'bg-ink-700 hover:bg-ink-600 text-slate-300 border border-ink-600 hover:border-violet-600/50 active:scale-95',
    danger:    'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 hover:border-rose-400 active:scale-95',
    success:   'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 active:scale-95',
    ghost:     'hover:bg-ink-700 text-slate-400 hover:text-slate-200 active:scale-95',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

/* ─── Badge ─────────────────────────────────────────────── */
export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default:  'bg-ink-600 text-slate-300',
    primary:  'bg-violet-600/20 text-violet-400 border border-violet-600/30',
    success:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    warning:  'bg-amber-400/15 text-amber-400 border border-amber-400/25',
    danger:   'bg-rose-500/15 text-rose-400 border border-rose-500/25',
    public:   'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    private:  'bg-amber-400/15 text-amber-400 border border-amber-400/25',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  )
}

/* ─── Avatar ─────────────────────────────────────────────── */
export const Avatar = ({ user, size = 'md' }) => {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }
  const initials = user ? (user.prenom?.[0] || '') + (user.nom?.[0] || '') : '?'
  const colors = ['from-violet-600 to-indigo-500','from-rose-500 to-pink-500','from-emerald-500 to-teal-500','from-amber-500 to-orange-500']
  const colorIdx = user?.id ? user.id % colors.length : 0

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center font-display font-bold text-white flex-shrink-0 overflow-hidden`}>
      {user?.photo_profil ? <img src={user.photo_profil} alt="" className="w-full h-full object-cover" /> : initials.toUpperCase()}
    </div>
  )
}

/* ─── Card ───────────────────────────────────────────────── */
export const Card = ({ children, className = '', onClick }) => (
  <div onClick={onClick}
    className={`bg-ink-800 border border-ink-600 rounded-2xl p-5 transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-violet-600/50 hover:shadow-glow-sm hover:-translate-y-0.5' : ''} ${className}`}>
    {children}
  </div>
)

/* ─── Modal ─────────────────────────────────────────────── */
export const Modal = ({ open, onClose, title, children, width = 'max-w-lg' }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${width} bg-ink-800 border border-ink-600 rounded-2xl shadow-2xl animate-slide-up`}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-ink-600">
          <h2 className="font-display font-bold text-lg text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ink-700 text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

/* ─── Toast Container ───────────────────────────────────── */
export const ToastContainer = ({ toasts }) => (
  <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium border animate-slide-up flex items-center gap-2.5 shadow-2xl min-w-[280px]
        ${t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : ''}
        ${t.type === 'error'   ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : ''}
        ${t.type === 'info'    ? 'bg-violet-600/10 border-violet-600/30 text-violet-400' : ''}
      `}>
        <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
        {t.message}
      </div>
    ))}
  </div>
)

/* ─── Spinner ───────────────────────────────────────────── */
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-[3px]' }
  return (
    <div className={`${sizes[size]} rounded-full border-ink-600 border-t-violet-500 animate-spin`} />
  )
}

/* ─── Empty State ───────────────────────────────────────── */
export const EmptyState = ({ icon, title, desc, action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
    <div className="text-5xl opacity-40">{icon}</div>
    <div className="font-display font-bold text-lg text-slate-300">{title}</div>
    {desc && <p className="text-slate-500 text-sm max-w-xs">{desc}</p>}
    {action}
  </div>
)

/* ─── Stars ─────────────────────────────────────────────── */
export const Stars = ({ note = 0, interactive = false, onChange }) => (
  <div className="flex gap-0.5 items-center">
    {[1,2,3,4,5].map(i => (
      <span key={i} onClick={() => interactive && onChange?.(i)}
        className={`text-lg leading-none transition-colors ${interactive ? 'cursor-pointer' : ''} ${i <= Math.round(note) ? 'text-amber-400' : 'text-ink-600'}`}>
        ★
      </span>
    ))}
    {!interactive && <span className="text-xs text-slate-500 ml-1">{Number(note).toFixed(1)}</span>}
  </div>
)

/* ─── FormGroup ─────────────────────────────────────────── */
export const FormGroup = ({ label, children, hint }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>}
    {children}
    {hint && <p className="text-xs text-slate-500">{hint}</p>}
  </div>
)

/* ─── Stat Card ─────────────────────────────────────────── */
export const StatCard = ({ icon, value, label, color = 'violet' }) => {
  const colors = {
    violet: 'text-violet-400', emerald: 'text-emerald-400',
    amber: 'text-amber-400', rose: 'text-rose-400',
  }
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`text-3xl`}>{icon}</div>
        <div>
          <div className={`font-display font-bold text-3xl ${colors[color]}`}>{value}</div>
          <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        </div>
      </div>
    </Card>
  )
}