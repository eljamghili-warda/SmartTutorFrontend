import React, { useEffect, useState, useRef, useCallback } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Badge, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  navy:       '#0A1628',
  navyMid:    '#162B55',
  navyLight:  '#1E3A6E',
  blue:       '#4A90E2',
  blueLight:  '#74ACEC',
  gold:       '#C5A059',
  goldLight:  '#E8D5A3',
  goldDark:   '#8B6914',
  ivory:      '#F5F0E6',
  white:      '#FFFFFF',
  success:    '#059669',
  error:      '#DC2626',
  text:       '#0A1628',
  textSub:    '#4A6080',
  textMuted:  '#94A3B8',
  border:     '#E8D5A3',
}

// ─── Mois abrégés ─────────────────────────────────────────────────────────────
const MOIS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

const fmtMois = (str) => {
  if (!str) return ''
  const [y, m] = str.split('-')
  return `${MOIS_FR[parseInt(m) - 1]} ${y.slice(2)}`
}

const fmtMoney = (n) => {
  const v = parseFloat(n) || 0
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return v.toFixed(0)
}

// ─── Hook: animation count-up ─────────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) return
    const start = performance.now()
    const end = parseFloat(target) || 0
    const raf = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(end * ease))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target])
  return value
}

// ─── StatCard animée ─────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color = 'navy', suffix = '', delay = 0 }) {
  const [visible, setVisible] = useState(false)
  const animated = useCountUp(visible ? value : 0)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [delay])
  const colors = {
    navy:    { bg: C.navyMid, accent: C.gold,     text: '#FFF', icon: C.goldLight },
    gold:    { bg: C.gold,    accent: C.navyMid,   text: '#FFF', icon: '#FFF' },
    emerald: { bg: '#065F46', accent: '#34D399',   text: '#FFF', icon: '#6EE7B7' },
    rose:    { bg: '#991B1B', accent: '#FCA5A5',   text: '#FFF', icon: '#FCA5A5' },
    blue:    { bg: C.navyLight, accent: C.blueLight, text: '#FFF', icon: '#A8C9F3' },
  }
  const cfg = colors[color] || colors.navy
  return (
    <div style={{
      background: `linear-gradient(135deg, ${cfg.bg} 0%, ${cfg.bg}CC 100%)`,
      borderRadius: 20, padding: '22px 24px', position: 'relative', overflow: 'hidden',
      boxShadow: `0 8px 32px ${cfg.bg}44`,
      border: `1px solid ${cfg.accent}22`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: `opacity .5s ease ${delay}ms, transform .5s ease ${delay}ms`,
    }}>
      {/* Déco cercle fond */}
      <div style={{ position:'absolute', right:-20, top:-20, width:100, height:100, borderRadius:'50%', background:`${cfg.accent}15` }} />
      <div style={{ position:'absolute', right:10, top:10, width:50, height:50, borderRadius:'50%', background:`${cfg.accent}10` }} />
      <div style={{ fontSize:26, marginBottom:10, position:'relative', zIndex:1 }}>{icon}</div>
      <div style={{ fontSize:30, fontWeight:900, color:cfg.text, fontFamily:'Plus Jakarta Sans, sans-serif', lineHeight:1, position:'relative', zIndex:1 }}>
        {animated.toLocaleString('fr-FR')}{suffix}
      </div>
      <div style={{ fontSize:12, color:`${cfg.text}AA`, marginTop:6, fontWeight:500, textTransform:'uppercase', letterSpacing:1, position:'relative', zIndex:1 }}>
        {label}
      </div>
      {/* Ligne déco */}
      <div style={{ position:'absolute', bottom:0, left:0, height:3, width:'60%', background:`linear-gradient(90deg, ${cfg.accent}, transparent)`, borderRadius:'0 3px 0 0' }} />
    </div>
  )
}

// ─── Graphe courbes animé — la pièce maîtresse ───────────────────────────────
function RevenueChart({ data }) {
  const svgRef    = useRef(null)
  const [progress, setProgress] = useState(0)   // 0→1 animation d'entrée
  const [tooltip, setTooltip]   = useState(null) // { x, y, point }
  const [hovered, setHovered]   = useState(null) // index point survolé

  // Animer l'entrée
  useEffect(() => {
    if (!data?.length) return
    const start = performance.now()
    const dur = 1800
    const raf = (now) => {
      const p = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 4)
      setProgress(ease)
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div style={{ height:320, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
        <div style={{ fontSize:40, opacity:.3 }}>📊</div>
        <p style={{ color:C.textMuted, fontSize:13 }}>Aucune donnée de revenus disponible</p>
      </div>
    )
  }

  const W = 860, H = 280
  const PL = 60, PR = 24, PT = 28, PB = 44
  const chartW = W - PL - PR
  const chartH = H - PT - PB

  const volumes     = data.map(d => parseFloat(d.volume) || 0)
  const commissions = data.map(d => parseFloat(d.commissions) || 0)
  const maxVal = Math.max(...volumes, 1)

  // Arrondir à un beau max
  const niceMax = (() => {
    const mag = Math.pow(10, Math.floor(Math.log10(maxVal)))
    return Math.ceil(maxVal / mag) * mag
  })()

  const xStep = volumes.length > 1 ? chartW / (volumes.length - 1) : chartW
  const toX = (i)  => PL + i * xStep
  const toY = (v)  => PT + chartH - (v / niceMax) * chartH

  // Générer le path d'une courbe smooth (Catmull-Rom → Bezier)
  const smoothPath = (points) => {
    if (points.length < 2) return ''
    const pts = points.map(([x, y]) => ({ x, y }))
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[Math.min(pts.length - 1, i + 2)]
      const t = 0.4
      const cp1x = p1.x + (p2.x - p0.x) * t
      const cp1y = p1.y + (p2.y - p0.y) * t
      const cp2x = p2.x - (p3.x - p1.x) * t
      const cp2y = p2.y - (p3.y - p1.y) * t
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`
    }
    return d
  }

  // Points visibles selon progress
  const visibleCount = Math.max(1, Math.ceil(volumes.length * progress))

  const volPoints  = volumes.slice(0, visibleCount).map((v, i) => [toX(i), toY(v)])
  const comPoints  = commissions.slice(0, visibleCount).map((v, i) => [toX(i), toY(v)])

  const volPath  = smoothPath(volPoints)
  const comPath  = smoothPath(comPoints)

  // Zone de remplissage (area)
  const areaPath = (pts) => {
    if (!pts.length) return ''
    const line = smoothPath(pts)
    const last = pts[pts.length - 1]
    return `${line} L ${last[0]} ${PT + chartH} L ${PL} ${PT + chartH} Z`
  }

  const volArea  = areaPath(volPoints)
  const comArea  = areaPath(comPoints)

  // Grille Y
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    y: PT + chartH - pct * chartH,
    val: (niceMax * pct).toFixed(0),
  }))

  // Gestion tooltip
  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const svgX = (e.clientX - rect.left) * (W / rect.width)
    const idx = Math.round((svgX - PL) / xStep)
    if (idx >= 0 && idx < volumes.length) {
      setHovered(idx)
      setTooltip({
        x: toX(idx),
        y: Math.min(toY(volumes[idx]), toY(commissions[idx])) - 8,
        point: data[idx],
        vol: volumes[idx],
        com: commissions[idx],
        idx,
      })
    }
  }, [volumes, commissions, data, xStep])

  const handleMouseLeave = () => { setHovered(null); setTooltip(null) }

  const totalVol = volumes.reduce((a, b) => a + b, 0)
  const totalCom = commissions.reduce((a, b) => a + b, 0)

  return (
    <div style={{ position:'relative' }}>
      {/* Légende */}
      <div style={{ display:'flex', alignItems:'center', gap:24, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:3, borderRadius:2, background:`linear-gradient(90deg, ${C.navyMid}, ${C.blue})` }} />
          <span style={{ fontSize:12, color:C.textSub, fontWeight:600 }}>Volume total</span>
          <span style={{ fontSize:13, fontWeight:800, color:C.navyMid }}>{totalVol.toLocaleString('fr-FR')} DH</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:3, borderRadius:2, background:`linear-gradient(90deg, ${C.gold}, ${C.goldLight})` }} />
          <span style={{ fontSize:12, color:C.textSub, fontWeight:600 }}>Commissions</span>
          <span style={{ fontSize:13, fontWeight:800, color:C.goldDark }}>{totalCom.toLocaleString('fr-FR')} DH</span>
        </div>
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width:'100%', height:'auto', overflow:'visible', cursor:'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {/* Gradient Volume */}
          <linearGradient id="gradVol" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={C.navyMid} stopOpacity="0.28"/>
            <stop offset="100%" stopColor={C.navyMid} stopOpacity="0.01"/>
          </linearGradient>
          {/* Gradient Commission */}
          <linearGradient id="gradCom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={C.gold} stopOpacity="0.22"/>
            <stop offset="100%" stopColor={C.gold} stopOpacity="0.01"/>
          </linearGradient>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Clip path pour animation d'entrée gauche→droite */}
          <clipPath id="clipLeft">
            <rect x={PL} y={0} width={chartW * progress} height={H} />
          </clipPath>
        </defs>

        {/* ── Fond grille ──────────────────────────────────────────────────── */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PL} y1={g.y} x2={PL + chartW} y2={g.y}
              stroke={C.border} strokeWidth={i === 0 ? 1.5 : 0.8} strokeDasharray={i === 0 ? '' : '4 4'} opacity={0.6} />
            <text x={PL - 8} y={g.y + 4} textAnchor="end" fontSize={10} fill={C.textMuted} fontFamily="Plus Jakarta Sans">{fmtMoney(g.val)}</text>
          </g>
        ))}

        {/* ── Areas ────────────────────────────────────────────────────────── */}
        <path d={volArea} fill="url(#gradVol)" clipPath="url(#clipLeft)" />
        <path d={comArea} fill="url(#gradCom)" clipPath="url(#clipLeft)" />

        {/* ── Lignes hovered (vertical) ────────────────────────────────────── */}
        {hovered !== null && (
          <line
            x1={toX(hovered)} y1={PT}
            x2={toX(hovered)} y2={PT + chartH}
            stroke={C.gold} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7}
          />
        )}

        {/* ── Courbe Volume ────────────────────────────────────────────────── */}
        <path d={volPath} fill="none" stroke={C.navyMid} strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round"
          filter="url(#glow)" clipPath="url(#clipLeft)" />
        {/* Copie plus lumineuse pour l'effet glow */}
        <path d={volPath} fill="none" stroke={C.blue} strokeWidth={1}
          strokeLinecap="round" strokeLinejoin="round" opacity={0.5} clipPath="url(#clipLeft)" />

        {/* ── Courbe Commission ─────────────────────────────────────────────── */}
        <path d={comPath} fill="none" stroke={C.gold} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
          filter="url(#glow)" clipPath="url(#clipLeft)" />
        <path d={comPath} fill="none" stroke={C.goldLight} strokeWidth={1}
          strokeLinecap="round" strokeLinejoin="round" opacity={0.4} clipPath="url(#clipLeft)" />

        {/* ── Points (visible seulement si tous chargés) ──────────────────── */}
        {progress > 0.98 && volumes.map((v, i) => {
          const isH = hovered === i
          return (
            <g key={i}>
              {/* Volume */}
              <circle cx={toX(i)} cy={toY(v)} r={isH ? 7 : 4}
                fill={isH ? C.navyMid : '#FFF'} stroke={C.navyMid} strokeWidth={2.5}
                style={{ transition:'r .15s, fill .15s' }}
              />
              {/* Commission */}
              <circle cx={toX(i)} cy={toY(commissions[i])} r={isH ? 6 : 3.5}
                fill={isH ? C.gold : '#FFF'} stroke={C.gold} strokeWidth={2}
                style={{ transition:'r .15s, fill .15s' }}
              />
            </g>
          )
        })}

        {/* ── Labels X ────────────────────────────────────────────────────── */}
        {data.map((d, i) => (
          <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize={10}
            fill={hovered === i ? C.navyMid : C.textMuted} fontWeight={hovered === i ? 700 : 400}
            fontFamily="Plus Jakarta Sans" style={{ transition:'fill .15s' }}>
            {fmtMois(d.mois)}
          </text>
        ))}

        {/* ── Tooltip ──────────────────────────────────────────────────────── */}
        {tooltip && progress > 0.98 && (
          <g>
            {/* Bulle */}
            <rect
              x={Math.min(tooltip.x - 70, W - PL - 145)}
              y={tooltip.y - 68}
              width={144} height={70}
              rx={10} fill={C.navy}
              stroke={C.gold} strokeWidth={1.5}
              style={{ filter:'drop-shadow(0 4px 16px rgba(10,22,40,.5))' }}
            />
            {/* Mois */}
            <text x={Math.min(tooltip.x - 70, W - PL - 145) + 72} y={tooltip.y - 48}
              textAnchor="middle" fontSize={11} fill={C.goldLight} fontWeight={700}
              fontFamily="Plus Jakarta Sans">
              {fmtMois(tooltip.point.mois)}
            </text>
            {/* Volume */}
            <text x={Math.min(tooltip.x - 70, W - PL - 145) + 14} y={tooltip.y - 30}
              fontSize={10} fill="#A8C9F3" fontFamily="Plus Jakarta Sans">
              Volume:
            </text>
            <text x={Math.min(tooltip.x - 70, W - PL - 145) + 130} y={tooltip.y - 30}
              textAnchor="end" fontSize={11} fill="#FFF" fontWeight={700} fontFamily="Plus Jakarta Sans">
              {tooltip.vol.toLocaleString('fr-FR')} DH
            </text>
            {/* Commission */}
            <text x={Math.min(tooltip.x - 70, W - PL - 145) + 14} y={tooltip.y - 12}
              fontSize={10} fill={C.goldLight} fontFamily="Plus Jakarta Sans">
              Commission:
            </text>
            <text x={Math.min(tooltip.x - 70, W - PL - 145) + 130} y={tooltip.y - 12}
              textAnchor="end" fontSize={11} fill={C.gold} fontWeight={700} fontFamily="Plus Jakarta Sans">
              {tooltip.com.toLocaleString('fr-FR')} DH
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

// ─── Barre de progression animée ─────────────────────────────────────────────
function AnimBar({ label, value, max, color, delay = 0 }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW((value / max) * 100), delay + 200)
    return () => clearTimeout(t)
  }, [value, max, delay])
  const pct = max > 0 ? ((value / max) * 100).toFixed(1) : 0
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:12, color:C.textSub, fontWeight:600 }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:800, color:C.text }}>{parseFloat(value).toLocaleString('fr-FR')} DH <span style={{ color:C.textMuted, fontWeight:400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height:8, borderRadius:10, background:`${C.border}80`, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:10, background:color, width:`${w}%`, transition:`width 1s cubic-bezier(.4,0,.2,1) ${delay}ms` }} />
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null)
  const [revenus, setRevenus] = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const { toasts, success, error } = useToast()

  useEffect(() => {
    Promise.all([
      adminAPI.getStats(),
      adminAPI.getTuteursPending(),
      adminAPI.getRevenus(),
    ])
      .then(([sr, pr, rr]) => {
        setStats(sr.data)
        setPending(pr.data)
        setRevenus(rr.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const valider = async (id, accepte) => {
    try {
      await adminAPI.validerTuteur(id, accepte)
      setPending(prev => prev.filter(t => t.id !== id))
      success(accepte ? 'Tuteur validé !' : 'Tuteur refusé.')
    } catch { error('Erreur') }
  }

  const parMois    = revenus?.parMois    || []
  const totaux     = revenus?.totaux     || {}
  const topTuteurs = revenus?.topTuteurs || []

  const totalVol = parseFloat(totaux.total_paiements) || 0
  const totalCom = parseFloat(totaux.total_commissions) || 0
  const totalTut = parseFloat(totaux.total_tuteurs) || 0

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:C.ivory }}>
      <Header title="Vue d'ensemble" subtitle="Tableau de bord administrateur" />
      <ToastContainer toasts={toasts} />

      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:24 }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', paddingTop:80 }}><Spinner size="lg" /></div>
        ) : (<>

          {/* ── KPI Cards ────────────────────────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            <StatCard icon="👥" value={stats?.totalUtilisateurs ?? 0} label="Utilisateurs"        color="navy"   delay={0}   />
            <StatCard icon="🚪" value={stats?.sallesActives ?? 0}     label="Salles actives"      color="blue"   delay={80}  />
            <StatCard icon="📅" value={stats?.totalSeances ?? 0}      label="Séances totales"     color="emerald" delay={160} />
            <StatCard icon="⏳" value={stats?.tuteursPendingCount ?? 0} label="Tuteurs en attente" color="rose"  delay={240} />
          </div>

          {/* ── Graphe revenus ────────────────────────────────────────────── */}
          <div style={{
            background: C.white, borderRadius:24, padding:'28px 32px',
            border:`1px solid ${C.border}`, boxShadow:'0 4px 24px rgba(10,22,40,0.07)',
          }}>
            {/* Titre avec badge live */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <h2 style={{ fontSize:20, fontWeight:800, color:C.navy, margin:0 }}>Revenus mensuels</h2>
                  <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:`${C.success}12`, border:`1px solid ${C.success}30` }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:C.success, display:'inline-block', animation:'pulse 2s infinite' }} />
                    <span style={{ fontSize:10, fontWeight:700, color:C.success, textTransform:'uppercase', letterSpacing:1 }}>Live</span>
                  </div>
                </div>
                <p style={{ fontSize:13, color:C.textMuted, margin:0 }}>12 derniers mois · Volume total et commissions plateforme</p>
              </div>
              {/* KPI vol & comm en ligne */}
              <div style={{ display:'flex', gap:16 }}>
                {[
                  { label:'Volume', value:totalVol, color:C.navyMid },
                  { label:'Commissions', value:totalCom, color:C.goldDark },
                  { label:'Tuteurs', value:totalTut, color:C.success },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign:'center', padding:'8px 16px', borderRadius:12, background:C.ivory, border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:16, fontWeight:800, color, fontFamily:'Plus Jakarta Sans' }}>
                      {value.toLocaleString('fr-FR')} <span style={{ fontSize:11, fontWeight:500, color:C.textMuted }}>DH</span>
                    </div>
                    <div style={{ fontSize:10, color:C.textMuted, textTransform:'uppercase', letterSpacing:1, marginTop:2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Le graphe SVG */}
            <RevenueChart data={parMois} />
          </div>

          {/* ── Répartition financière + Top tuteurs ─────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

            {/* Répartition */}
            <div style={{ background:C.white, borderRadius:20, padding:'24px 26px', border:`1px solid ${C.border}`, boxShadow:'0 2px 12px rgba(10,22,40,.06)' }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:20 }}>Répartition des revenus</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <AnimBar label="Volume brut"   value={totalVol} max={totalVol} color={`linear-gradient(90deg,${C.navyMid},${C.blue})`}      delay={200} />
                <AnimBar label="Tuteurs"       value={totalTut} max={totalVol} color={`linear-gradient(90deg,${C.success},#34D399)`}         delay={350} />
                <AnimBar label="Commissions"   value={totalCom} max={totalVol} color={`linear-gradient(90deg,${C.gold},${C.goldLight})`}     delay={500} />
              </div>
              {totalVol === 0 && (
                <p style={{ fontSize:13, color:C.textMuted, textAlign:'center', padding:'20px 0' }}>Aucun paiement complété</p>
              )}
            </div>

            {/* Top tuteurs */}
            <div style={{ background:C.white, borderRadius:20, padding:'24px 26px', border:`1px solid ${C.border}`, boxShadow:'0 2px 12px rgba(10,22,40,.06)' }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:20 }}>Top tuteurs</h3>
              {topTuteurs.length === 0
                ? <p style={{ fontSize:13, color:C.textMuted, textAlign:'center', padding:'20px 0' }}>Aucun tuteur avec paiements</p>
                : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {topTuteurs.slice(0, 5).map((t, i) => {
                      const gains = parseFloat(t.total_gains) || 0
                      const maxGains = parseFloat(topTuteurs[0]?.total_gains) || 1
                      return (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background: i===0?`linear-gradient(135deg,${C.gold},${C.goldLight})`:i===1?`${C.navyMid}20`:i===2?`${C.textMuted}20`:`${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color: i<3?C.navyMid:C.textMuted, flexShrink:0 }}>
                            {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                          </div>
                          <div style={{ flex:1, overflow:'hidden' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                              <span style={{ fontSize:12, fontWeight:600, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.prenom} {t.nom}</span>
                              <span style={{ fontSize:11, fontWeight:700, color:C.goldDark, flexShrink:0, marginLeft:8 }}>{gains.toLocaleString('fr-FR')} DH</span>
                            </div>
                            <div style={{ height:5, borderRadius:5, background:`${C.border}60`, overflow:'hidden' }}>
                              <div style={{ height:'100%', borderRadius:5, background: i===0?`linear-gradient(90deg,${C.gold},${C.goldLight})`:`linear-gradient(90deg,${C.navyMid},${C.blue})`, width:`${(gains/maxGains)*100}%`, transition:'width 1s ease .6s' }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }
            </div>
          </div>

          {/* ── Tuteurs en attente ────────────────────────────────────────── */}
          {pending.length > 0 && (
            <div style={{ background:C.white, borderRadius:20, padding:'24px 26px', border:`1px solid ${C.border}`, boxShadow:'0 2px 12px rgba(10,22,40,.06)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:0 }}>Tuteurs en attente de validation</h3>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20, background:`${C.error}12`, color:C.error, border:`1px solid ${C.error}30` }}>{pending.length}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {pending.map(t => (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:14, background:C.ivory, border:`1px solid ${C.border}`, transition:'border-color .15s' }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                    <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${C.navyMid},${C.navyLight})`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#FFF', fontSize:14, flexShrink:0 }}>
                      {t.prenom?.[0]}{t.nom?.[0]}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>{t.prenom} {t.nom}</p>
                      <p style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>{t.email}</p>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {(t.specialites || []).map(s => (
                          <span key={s} style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${C.navyMid}10`, color:C.navyMid, border:`1px solid ${C.navyMid}20` }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    {t.biographie && (
                      <p style={{ fontSize:12, color:C.textMuted, maxWidth:280, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{t.biographie}</p>
                    )}
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      <button onClick={() => valider(t.id, true)} style={{ padding:'8px 16px', borderRadius:10, background:`${C.success}12`, border:`1px solid ${C.success}40`, color:C.success, fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background=`${C.success}20`}}
                        onMouseLeave={e=>{e.currentTarget.style.background=`${C.success}12`}}>
                        ✓ Valider
                      </button>
                      <button onClick={() => valider(t.id, false)} style={{ padding:'8px 16px', borderRadius:10, background:`${C.error}10`, border:`1px solid ${C.error}30`, color:C.error, fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background=`${C.error}20`}}
                        onMouseLeave={e=>{e.currentTarget.style.background=`${C.error}10`}}>
                        ✕ Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pending.length === 0 && (
            <div style={{ background:C.white, borderRadius:16, padding:'20px 24px', border:`1px solid ${C.border}`, textAlign:'center' }}>
              <p style={{ color:C.textMuted, fontSize:13 }}>✅ Aucun tuteur en attente de validation.</p>
            </div>
          )}

        </>)}
      </div>
    </div>
  )
}