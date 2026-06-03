// AdminDashboard.jsx - Version professionnelle Bleu/Doré
import React, { useEffect, useState, useRef } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

// ── PALETTE SMARTEDU PROFESSIONNELLE (Bleu profond + Doré) ─────────
const T = {
  // Fond et surfaces
  bg:        '#F5F0E6',      // Ivoire élégant
  surface:   '#FFFFFF',      // Blanc pur
  surface2:  '#F8F6F0',      // Ivoire légèrement plus clair
  
  // Bordures
  border:    '#E0D5C0',      // Beige doré
  borderHov: '#C5A059',      // Doré
  
  // Textes
  text:      '#1A3A5C',      // Bleu profond
  muted:     '#6B7B8D',      // Gris bleuté
  subtle:    '#A0894A',      // Marron clair
  
  // Accents principaux (Bleu + Doré)
  primary:   '#2C5F8A',      // Bleu moyen
  primaryLt: 'rgba(44,95,138,0.12)',
  accent:    '#C5A059',      // Doré
  accentLt:  'rgba(197,160,89,0.12)',
  
  // États
  success:   '#2E7D32',
  successLt: 'rgba(46,125,50,0.12)',
  warning:   '#ED6C02',
  warningLt: 'rgba(237,108,2,0.12)',
  danger:    '#C62828',
  dangerLt:  'rgba(198,40,40,0.12)',
  info:      '#4A90E2',
  infoLt:    'rgba(74,144,226,0.12)',
}

// ── Animation des nombres ──────────────────────────────────────────
function AnimNum({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const target = parseFloat(value) || 0
    const start = performance.now()
    const dur = 900
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(target * ease))
      if (t < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value])
  return <>{display.toLocaleString('fr-FR')}{suffix}</>
}

// ── Carte KPI élégante ─────────────────────────────────────────────
function KpiCard({ icon, label, value, suffix = '', color, trend, trendLabel }) {
  const colors = {
    primary: { accent: T.primary, light: T.primaryLt },
    gold:    { accent: T.accent,  light: T.accentLt },
    success: { accent: T.success, light: T.successLt },
    warning: { accent: T.warning, light: T.warningLt },
    danger:  { accent: T.danger,  light: T.dangerLt },
    info:    { accent: T.info,    light: T.infoLt },
  }
  const c = colors[color] || colors.primary
  
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = c.accent
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(197,160,89,0.15)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = T.border
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 90, height: 90,
        borderRadius: '50%', background: c.accent, opacity: 0.06, filter: 'blur(20px)',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: c.light, border: `1px solid ${c.accent}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>{icon}</div>
        {trend !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
            background: trend >= 0 ? T.successLt : T.dangerLt,
            color: trend >= 0 ? T.success : T.danger,
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: T.text, lineHeight: 1, marginBottom: 5, fontFamily: 'monospace' }}>
        <AnimNum value={value} suffix={suffix} />
      </div>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{label}</div>
      {trendLabel && <div style={{ fontSize: 11, color: T.subtle, marginTop: 4 }}>{trendLabel}</div>}
    </div>
  )
}

function SectionTitle({ icon, title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, background: T.accentLt,
        border: `1px solid ${T.accent}33`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 16,
      }}>{icon}</div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{title}</h2>
      {count !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
          background: T.primaryLt, color: T.primary, border: `1px solid ${T.primary}33`,
        }}>{count}</span>
      )}
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 100, fontSize: 12, color: T.subtle, textAlign: 'right', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: '#E8E0D0', borderRadius: 3 }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 3,
          background: color, transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>
      <div style={{ width: 40, fontSize: 12, fontWeight: 700, color, textAlign: 'right', flexShrink: 0 }}>{value}</div>
    </div>
  )
}

// ── MAIN ADMIN DASHBOARD ───────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const { toasts, success, error } = useToast()

  useEffect(() => {
    Promise.all([adminAPI.getStats(), adminAPI.getTuteursPending()])
      .then(([sr, pr]) => { setStats(sr.data); setPending(pr.data) })
      .catch(() => error('Erreur de chargement des données'))
      .finally(() => setLoading(false))
  }, [])

  const valider = async (id, accepte) => {
    try {
      await adminAPI.validerTuteur(id, accepte)
      setPending(prev => prev.filter(t => t.id !== id))
      if (stats) setStats(s => ({ ...s, tuteursPending: (s.tuteursPending || 1) - 1 }))
      success(accepte ? '✅ Tuteur validé avec succès !' : 'Tuteur refusé.')
    } catch { error('Erreur lors de l\'action.') }
  }

  if (loading) return (
    <>
      <Header title="Tableau de bord" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
        <Spinner size="lg" />
      </div>
    </>
  )

  const u = stats?.utilisateurs || {}
  const f = stats?.finances || {}
  const s = stats?.seances || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.bg }}>
      <Header title="Tableau de bord" subtitle="Vue d'ensemble administrateur" />
      <ToastContainer toasts={toasts} />
      <div style={{
        flex: 1, overflowY: 'auto', padding: '28px 32px 40px',
        display: 'flex', flexDirection: 'column', gap: 28,
      }}>

        {/* Banner doré */}
        <div style={{
          background: `linear-gradient(135deg, ${T.text} 0%, ${T.primary} 100%)`,
          borderRadius: 20, padding: '20px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
          boxShadow: '0 4px 20px rgba(26,58,92,0.15)',
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
              👋 Bonjour, Administrateur
            </div>
            <div style={{ fontSize: 13, color: T.accentLight || '#E8D5A3', marginTop: 4 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          {pending.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
              borderRadius: 14, padding: '10px 20px',
              display: 'flex', alignItems: 'center', gap: 12,
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <span style={{ fontSize: 24 }}>⏳</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.accentLight || '#E8D5A3' }}>
                  {pending.length} tuteur{pending.length > 1 ? 's' : ''} en attente
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Validation requise</div>
              </div>
            </div>
          )}
        </div>

        {/* KPI Utilisateurs */}
        <div>
          <SectionTitle icon="👥" title="Utilisateurs" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <KpiCard icon="👥" label="Total utilisateurs" value={u.total ?? 0} color="primary" />
            <KpiCard icon="🎓" label="Étudiants" value={u.etudiants ?? 0} color="info" />
            <KpiCard icon="👨‍🏫" label="Tuteurs actifs" value={u.tuteurs ?? 0} color="success" />
            <KpiCard icon="⏳" label="En attente" value={stats?.tuteursPending ?? 0} color="gold" />
            <KpiCard icon="🔒" label="Comptes bloqués" value={u.bloques ?? 0} color="danger" />
          </div>
        </div>

        {/* KPI Activité */}
        <div>
          <SectionTitle icon="📅" title="Activité plateforme" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <KpiCard icon="🏠" label="Salles actives" value={stats?.salles?.actives ?? 0} color="primary" />
            <KpiCard icon="📋" label="Séances totales" value={s.total ?? 0} color="info" />
            <KpiCard icon="✅" label="Séances réalisées" value={s.realisees ?? 0} color="success" />
            <KpiCard icon="❌" label="Séances annulées" value={s.annulees ?? 0} color="danger" />
          </div>
        </div>

        {/* Section basse : 2 colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: pending.length > 0 ? '1fr 1fr' : '1fr', gap: 24 }}>

          {/* Répartition utilisateurs */}
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 20, padding: '20px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}>
            <SectionTitle icon="📊" title="Répartition des utilisateurs" />
            <MiniBar label="Étudiants" value={u.etudiants ?? 0} max={u.total ?? 1} color={T.info} />
            <MiniBar label="Tuteurs" value={u.tuteurs ?? 0} max={u.total ?? 1} color={T.success} />
            <MiniBar label="Bloqués" value={u.bloques ?? 0} max={u.total ?? 1} color={T.danger} />
            <MiniBar label="En attente" value={stats?.tuteursPending ?? 0} max={u.total ?? 1} color={T.accent} />
            
            {u.total > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', gap: 3 }}>
                  {[
                    { v: u.etudiants, c: T.info },
                    { v: u.tuteurs, c: T.success },
                    { v: u.bloques, c: T.danger },
                  ].map((seg, i) => (
                    <div key={i} style={{
                      flex: seg.v, background: seg.c, borderRadius: 4,
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 12 }}>
                  <span style={{ fontSize: 10, color: T.muted }}>📊 Total: {u.total}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tuteurs en attente */}
          {pending.length > 0 && (
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 20, padding: '20px 24px',
            }}>
              <SectionTitle icon="⏳" title="Tuteurs à valider" count={pending.length} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto' }}>
                {pending.map(t => (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 14px', borderRadius: 14,
                    background: T.surface2, border: `1px solid ${T.border}`,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 16, color: '#fff',
                    }}>
                      {t.prenom?.[0]}{t.nom?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                        {t.prenom} {t.nom}
                      </div>
                      <div style={{ fontSize: 11, color: T.muted }}>{t.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => valider(t.id, true)} style={{
                        padding: '6px 14px', borderRadius: 10, border: 'none',
                        background: T.successLt, color: T.success,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>✓ Valider</button>
                      <button onClick={() => valider(t.id, false)} style={{
                        padding: '6px 14px', borderRadius: 10, border: 'none',
                        background: T.dangerLt, color: T.danger,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>✗ Refuser</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}