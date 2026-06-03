// UI.jsx - Version compatible Tailwind CDN (sans classes personnalisées)
import React from 'react'

// ─── PALETTE SMARTEDU (Bleu profond + Doré) - utilisable en inline style ─────
export const C = {
  navy900: '#1A3A5C',
  navy800: '#2C5F8A',
  navy700: '#4A90E2',
  navy600: '#D6E6F5',
  gold500: '#C5A059',
  gold400: '#D4B06A',
  gold300: '#E8D5A3',
  gold200: '#F2E8CC',
  ivory500: '#F5F0E6',
  white: '#FFFFFF',
  textMain: '#1A3A5C',
  textSub: '#6B7B8D',
  success: '#2E7D32',
  error: '#C62828',
  warn: '#ED6C02',
}

export const Btn = ({ children, variant = 'primary', size = 'md', className = '', disabled, onClick, type = 'button' }) => {
  const sizes = {
    sm: { padding: '6px 14px', fontSize: '12px' },
    md: { padding: '8px 18px', fontSize: '13px' },
    lg: { padding: '10px 24px', fontSize: '14px' },
  }
  
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${C.navy800}, ${C.navy700})`,
      color: C.white,
      border: 'none',
    },
    secondary: {
      background: C.gold200,
      color: C.navy900,
      border: `1px solid ${C.gold300}`,
    },
    gold: {
      background: `linear-gradient(135deg, ${C.gold500}, ${C.gold400})`,
      color: C.navy900,
      border: 'none',
    },
    danger: {
      background: '#FEF2F2',
      color: C.error,
      border: `1px solid #FCA5A5`,
    },
    success: {
      background: '#E8F5E9',
      color: C.success,
      border: `1px solid #A5D6A7`,
    },
    ghost: {
      background: 'transparent',
      color: C.navy800,
      border: 'none',
    },
  }
  
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s',
    ...sizes[size],
    ...variants[variant],
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={baseStyle}
      className={className}
      onMouseEnter={(e) => {
        if (!disabled && variant === 'primary') e.currentTarget.style.opacity = '0.85'
        if (!disabled && variant === 'gold') e.currentTarget.style.opacity = '0.85'
        if (!disabled && variant === 'secondary') e.currentTarget.style.background = C.gold300
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') e.currentTarget.style.opacity = '1'
        if (variant === 'gold') e.currentTarget.style.opacity = '1'
        if (variant === 'secondary') e.currentTarget.style.background = C.gold200
      }}
    >
      {children}
    </button>
  )
}

export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: { background: '#DBEAFE', color: C.navy800, border: '1px solid #BFDBFE' },
    primary: { background: `${C.navy800}15`, color: C.navy800, border: `1px solid ${C.navy800}30` },
    success: { background: '#E8F5E9', color: C.success, border: '1px solid #A5D6A7' },
    warning: { background: '#FFF4E5', color: C.warn, border: '1px solid #FFCC80' },
    danger:  { background: '#FFEBEE', color: C.error, border: '1px solid #EF9A9A' },
    gold:    { background: C.gold200, color: C.navy900, border: `1px solid ${C.gold300}` },
    public:  { background: '#E8F5E9', color: C.success, border: '1px solid #A5D6A7' },
    private: { background: '#FFF4E5', color: C.warn, border: '1px solid #FFCC80' },
  }
  
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
    ...variants[variant],
  }
  
  return <span style={style}>{children}</span>
}

export const Avatar = ({ user, size = 'md', showStatus = false, isOnline = false }) => {
  const sizes = {
    sm: { width: 28, height: 28, fontSize: '11px' },
    md: { width: 36, height: 36, fontSize: '14px' },
    lg: { width: 48, height: 48, fontSize: '16px' },
    xl: { width: 64, height: 64, fontSize: '20px' },
  }
  
  const initials = user ? (user.prenom?.[0] || '') + (user.nom?.[0] || '') : '?'
  const colors = [
    `linear-gradient(135deg, ${C.navy800}, ${C.navy700})`,
    `linear-gradient(135deg, ${C.gold500}, ${C.gold400})`,
    `linear-gradient(135deg, ${C.navy700}, ${C.navy600})`,
    `linear-gradient(135deg, ${C.gold400}, ${C.gold300})`,
  ]
  const colorIdx = user?.id ? user.id % colors.length : 0
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          ...sizes[size],
          borderRadius: '50%',
          background: colors[colorIdx],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: C.white,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {user?.photo_profil
          ? <img src={user.photo_profil} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          : <span>{initials.toUpperCase()}</span>
        }
      </div>
      {showStatus && (
        <span
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: isOnline ? '#22C55E' : '#94A3B8',
            border: `2px solid white`,
          }}
        />
      )}
    </div>
  )
}

export const Card = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: C.white,
      border: `1px solid ${C.gold300}`,
      borderRadius: '16px',
      padding: '20px',
      transition: 'all 0.2s',
      cursor: onClick ? 'pointer' : 'default',
    }}
    className={className}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.borderColor = C.gold500
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(197,160,89,0.15)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        e.currentTarget.style.borderColor = C.gold300
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }
    }}
  >
    {children}
  </div>
)

export const Modal = ({ open, onClose, title, children, width = '500px' }) => {
  if (!open) return null
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(26,58,92,0.6)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: width,
          maxWidth: '90vw',
          background: C.white,
          border: `1px solid ${C.gold300}`,
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${C.gold200}`,
        }}>
          <h2 style={{ fontWeight: 600, fontSize: '18px', color: C.navy900, margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '18px',
              color: C.navy600,
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.gold200}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export const ToastContainer = ({ toasts }) => (
  <div style={{
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }}>
    {toasts.map(t => {
      const styles = {
        success: { background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32' },
        error: { background: '#FFEBEE', border: '1px solid #EF9A9A', color: '#C62828' },
        info: { background: '#E1F5FE', border: '1px solid #B3E5FC', color: C.navy800 },
      }
      return (
        <div
          key={t.id}
          style={{
            ...styles[t.type || 'info'],
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: '280px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
          {t.message}
        </div>
      )
    })}
  </div>
)

export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 16, md: 32, lg: 48 }
  return (
    <div
      style={{
        width: sizes[size],
        height: sizes[size],
        borderRadius: '50%',
        border: `2px solid ${C.gold300}`,
        borderTopColor: C.navy800,
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )
}

export const EmptyState = ({ icon, title, desc, action }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 16px',
    gap: '12px',
    textAlign: 'center',
  }}>
    <div style={{ fontSize: '48px', opacity: 0.5 }}>{icon}</div>
    <div style={{ fontWeight: 600, fontSize: '18px', color: C.navy800 }}>{title}</div>
    {desc && <p style={{ fontSize: '13px', color: C.textSub, maxWidth: '280px', margin: 0 }}>{desc}</p>}
    {action}
  </div>
)

export const Stars = ({ note = 0, interactive = false, onChange }) => (
  <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span
        key={i}
        onClick={() => interactive && onChange?.(i)}
        style={{
          fontSize: '16px',
          cursor: interactive ? 'pointer' : 'default',
          color: i <= Math.round(note) ? C.gold500 : C.gold200,
        }}
      >
        ★
      </span>
    ))}
    {!interactive && <span style={{ fontSize: '11px', color: C.textSub, marginLeft: '4px' }}>{Number(note).toFixed(1)}</span>}
  </div>
)

export const FormGroup = ({ label, children, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    {label && <label style={{ fontSize: '11px', fontWeight: 600, color: C.navy800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>}
    {children}
    {hint && <p style={{ fontSize: '11px', color: C.textSub, margin: 0 }}>{hint}</p>}
  </div>
)

export const StatCard = ({ icon, value, label, color = 'navy' }) => {
  const colors = {
    navy: C.navy800,
    gold: C.gold500,
    emerald: '#2E7D32',
    amber: '#ED6C02',
  }
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          background: C.gold200,
          border: `1px solid ${C.gold300}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '28px', color: colors[color] || colors.navy }}>{value}</div>
          <div style={{ fontSize: '11px', color: C.textSub, marginTop: '2px' }}>{label}</div>
        </div>
      </div>
    </Card>
  )
}

// Ajouter les animations dans un style global (à mettre dans index.html ou un fichier CSS)
const styleSheet = document.createElement("style")
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`
document.head.appendChild(styleSheet)