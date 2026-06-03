import React from 'react'

// ─── Palette centralisée (réf. pour inline styles si besoin) ─────────────────
export const C = {
  navy900: '#0A1628', navy800: '#0F2040', navy700: '#162B55', navy600: '#1E3A6E',
  blue400: '#4A90E2', blue200: '#A8C9F3', blue100: '#D6E6F5',
  gold500: '#C5A059', gold400: '#D4B06A', gold300: '#E8D5A3', gold200: '#F2E8CC',
  ivory500: '#F5F0E6', ivory300: '#FBF8F3',
  white: '#FFFFFF',
  textMain: '#0A1628', textSub: '#4A6080', textMuted: '#94A3B8',
  success: '#1B6B3A', successBg: '#E6F4ED', successBorder: '#A3D4B8',
  error: '#9B1C1C',   errorBg:   '#FEF2F2', errorBorder:   '#FCA5A5',
  warn: '#92400E',    warnBg:    '#FFFBEB', warnBorder:    '#FCD34D',
}

/* ─── Button ──────────────────────────────────────────────────────── */
export const Btn = ({ children, variant = 'primary', size = 'md', className = '', disabled, onClick, type = 'button' }) => {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none'
  const sizes = { sm: 'px-3.5 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' }
  const variants = {
    primary:   'bg-navy-800 hover:bg-navy-700 text-white shadow-navy active:scale-95 border border-navy-700 hover:border-gold-500/40',
    secondary: 'bg-ivory-300 hover:bg-gold-200 text-navy-800 border border-gold-300 hover:border-gold-500 active:scale-95',
    gold:      'bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-navy-900 border border-gold-400 shadow-gold active:scale-95',
    danger:    'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-400 active:scale-95',
    success:   'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-400 active:scale-95',
    ghost:     'hover:bg-gold-200/60 text-navy-700 hover:text-navy-900 active:scale-95',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

/* ─── Badge ───────────────────────────────────────────────────────── */
export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default:  'bg-blue-100 text-navy-700 border border-blue-200',
    primary:  'bg-navy-800/10 text-navy-700 border border-navy-700/20',
    success:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning:  'bg-amber-50 text-amber-700 border border-amber-200',
    danger:   'bg-red-50 text-red-700 border border-red-200',
    gold:     'bg-gold-200 text-gold-900 border border-gold-300',
    public:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
    private:  'bg-amber-50 text-amber-700 border border-amber-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  )
}

/* ─── Avatar ──────────────────────────────────────────────────────── */
export const Avatar = ({ user, size = 'md' }) => {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }
  const initials = user ? (user.prenom?.[0] || '') + (user.nom?.[0] || '') : '?'
  // Palette bleu-doré pour les avatars
  const colors = [
    'from-navy-700 to-navy-600',
    'from-blue-400 to-navy-700',
    'from-gold-500 to-gold-400',
    'from-navy-600 to-blue-400',
  ]
  const colorIdx = user?.id ? user.id % colors.length : 0
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden`}>
      {user?.photo_profil
        ? <img src={user.photo_profil} alt="" className="w-full h-full object-cover" />
        : <span className="text-white">{initials.toUpperCase()}</span>
      }
    </div>
  )
}

/* ─── Card ────────────────────────────────────────────────────────── */
export const Card = ({ children, className = '', onClick }) => (
  <div onClick={onClick}
    className={`bg-white border border-gold-300 rounded-2xl p-5 shadow-card transition-all duration-200
      ${onClick ? 'cursor-pointer hover:border-gold-500 hover:shadow-card-lg hover:-translate-y-0.5' : ''}
      ${className}`}>
    {children}
  </div>
)

/* ─── Modal ───────────────────────────────────────────────────────── */
export const Modal = ({ open, onClose, title, children, width = 'max-w-lg' }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${width} bg-white border border-gold-300 rounded-2xl shadow-navy-lg animate-slide-up`}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gold-200">
          <h2 className="font-semibold text-lg text-navy-900">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold-200 text-navy-600 hover:text-navy-900 transition-colors text-lg">
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

/* ─── Toast Container ─────────────────────────────────────────────── */
export const ToastContainer = ({ toasts }) => (
  <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium border animate-slide-up flex items-center gap-2.5 shadow-card-lg min-w-[280px]
        ${t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}
        ${t.type === 'error'   ? 'bg-red-50 border-red-200 text-red-800' : ''}
        ${t.type === 'info'    ? 'bg-blue-50 border-blue-200 text-navy-800' : ''}
      `}>
        <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
        {t.message}
      </div>
    ))}
  </div>
)

/* ─── Spinner ─────────────────────────────────────────────────────── */
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-[3px]' }
  return (
    <div className={`${sizes[size]} rounded-full border-gold-300 border-t-navy-700 animate-spin`} />
  )
}

/* ─── Empty State ─────────────────────────────────────────────────── */
export const EmptyState = ({ icon, title, desc, action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
    <div className="text-5xl opacity-50">{icon}</div>
    <div className="font-semibold text-lg text-navy-800">{title}</div>
    {desc && <p className="text-navy-500 text-sm max-w-xs">{desc}</p>}
    {action}
  </div>
)

/* ─── Stars ───────────────────────────────────────────────────────── */
export const Stars = ({ note = 0, interactive = false, onChange }) => (
  <div className="flex gap-0.5 items-center">
    {[1,2,3,4,5].map(i => (
      <span key={i} onClick={() => interactive && onChange?.(i)}
        className={`text-lg leading-none transition-colors ${interactive ? 'cursor-pointer' : ''} ${i <= Math.round(note) ? 'text-gold-500' : 'text-gold-200'}`}>
        ★
      </span>
    ))}
    {!interactive && <span className="text-xs text-navy-500 ml-1">{Number(note).toFixed(1)}</span>}
  </div>
)

/* ─── FormGroup ───────────────────────────────────────────────────── */
export const FormGroup = ({ label, children, hint }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide">{label}</label>}
    {children}
    {hint && <p className="text-xs text-navy-400">{hint}</p>}
  </div>
)

/* ─── Stat Card ───────────────────────────────────────────────────── */
export const StatCard = ({ icon, value, label, color = 'navy' }) => {
  const colors = {
    navy:    'text-navy-800',
    gold:    'text-gold-500',
    emerald: 'text-emerald-600',
    amber:   'text-amber-600',
    rose:    'text-red-600',
    violet:  'text-blue-500',
  }
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gold-100 border border-gold-200 flex items-center justify-center text-2xl flex-shrink-0">{icon}</div>
        <div>
          <div className={`font-bold text-3xl ${colors[color] || colors.navy}`}>{value}</div>
          <div className="text-xs text-navy-500 mt-0.5">{label}</div>
        </div>
      </div>
    </Card>
  )
}