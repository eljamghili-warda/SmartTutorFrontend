import React, { useState, useEffect, useRef, useCallback } from 'react'
import { adminAPI } from '../../services/api'
import { Spinner } from '../../components/UI'
import Header from '../../components/Header/Header'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  navy:   '#0A1628', navyMid:'#162B55', navyLight:'#1E3A6E',
  blue:   '#4A90E2', blueLight:'#74ACEC',
  gold:   '#C5A059', goldLight:'#E8D5A3', goldDark:'#8B6914',
  ivory:  '#F5F0E6', white:'#FFFFFF',
  success:'#059669', successBg:'rgba(5,150,105,.10)',
  error:  '#DC2626', errorBg:'rgba(220,38,38,.08)',
  escrow: '#7C3AED', escrowBg:'rgba(124,58,237,.10)',
  orange: '#D97706', orangeBg:'rgba(217,119,6,.10)',
  border: '#E8D5A3',
  text:   '#0A1628', muted:'#6B7B8D',
}

const MOIS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const fmtMois = s => { if(!s) return ''; const [y,m]=s.split('-'); return `${MOIS_FR[parseInt(m)-1]} ${y.slice(2)}` }
const fmtDH   = n => `${(parseFloat(n)||0).toLocaleString('fr-FR')} DH`

// ─── Graphe courbe live ───────────────────────────────────────────────────────
function RevenueChart({ data }) {
  const svgRef  = useRef(null)
  const [progress, setProgress] = useState(0)
  const [tooltip, setTooltip]   = useState(null)
  const [hovered, setHovered]   = useState(null)

  useEffect(() => {
    if (!data?.length) return
    const start = performance.now(), dur = 1800
    const raf = now => {
      const p = Math.min((now-start)/dur, 1)
      setProgress(1 - Math.pow(1-p, 4))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [data])

  if (!data?.length) return (
    <div style={{height:260,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
      <div style={{fontSize:36,opacity:.3}}>📊</div>
      <p style={{color:C.muted,fontSize:13}}>Aucune donnée de revenus disponible</p>
    </div>
  )

  const W=860,H=260,PL=62,PR=20,PT=24,PB=40,chartW=W-PL-PR,chartH=H-PT-PB
  const volumes     = data.map(d => parseFloat(d.volume)||0)
  const commissions = data.map(d => parseFloat(d.commissions)||0)
  const escrows     = data.map(d => parseFloat(d.en_escrow||d.montant_escrow||0))
  const maxVal = Math.max(...volumes, 1)
  const mag    = Math.pow(10, Math.floor(Math.log10(maxVal)))
  const niceMax= Math.ceil(maxVal/mag)*mag
  const xStep  = volumes.length > 1 ? chartW/(volumes.length-1) : chartW
  const toX    = i => PL + i*xStep
  const toY    = v => PT + chartH - (v/niceMax)*chartH

  const smooth = pts => {
    if (pts.length < 2) return ''
    const p = pts.map(([x,y]) => ({x,y}))
    let d = `M ${p[0].x} ${p[0].y}`, t = 0.4
    for (let i=0; i<p.length-1; i++) {
      const p0=p[Math.max(0,i-1)],p1=p[i],p2=p[i+1],p3=p[Math.min(p.length-1,i+2)]
      d += ` C ${p1.x+(p2.x-p0.x)*t} ${p1.y+(p2.y-p0.y)*t} ${p2.x-(p3.x-p1.x)*t} ${p2.y-(p3.y-p1.y)*t} ${p2.x} ${p2.y}`
    }
    return d
  }

  const n = Math.max(1, Math.ceil(volumes.length * progress))
  const vPts = volumes.slice(0,n).map((v,i) => [toX(i), toY(v)])
  const cPts = commissions.slice(0,n).map((v,i) => [toX(i), toY(v)])
  const vPath = smooth(vPts), cPath = smooth(cPts)
  const area  = (pts) => {
    if (!pts.length) return ''
    const last = pts[pts.length-1]
    return `${smooth(pts)} L ${last[0]} ${PT+chartH} L ${PL} ${PT+chartH} Z`
  }

  const grid = [0,.25,.5,.75,1].map(p => ({ y: PT+chartH-p*chartH, v: (niceMax*p).toFixed(0) }))

  const onMove = useCallback(e => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const sx = (e.clientX-rect.left)*(W/rect.width)
    const idx = Math.round((sx-PL)/xStep)
    if (idx >= 0 && idx < volumes.length) {
      setHovered(idx)
      setTooltip({ x:toX(idx), y:Math.min(toY(volumes[idx]),toY(commissions[idx]))-8,
        mois:data[idx], vol:volumes[idx], com:commissions[idx] })
    }
  }, [volumes, commissions, data, xStep])

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
      style={{width:'100%',height:'auto',overflow:'visible',cursor:'crosshair'}}
      onMouseMove={onMove} onMouseLeave={() => {setHovered(null);setTooltip(null)}}>
      <defs>
        <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.navyMid} stopOpacity=".25"/>
          <stop offset="100%" stopColor={C.navyMid} stopOpacity=".01"/>
        </linearGradient>
        <linearGradient id="gCom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.gold} stopOpacity=".20"/>
          <stop offset="100%" stopColor={C.gold} stopOpacity=".01"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <clipPath id="cl"><rect x={PL} y={0} width={chartW*progress} height={H}/></clipPath>
      </defs>
      {grid.map((g,i) => (
        <g key={i}>
          <line x1={PL} y1={g.y} x2={PL+chartW} y2={g.y} stroke={C.border}
            strokeWidth={i===0?1.5:.7} strokeDasharray={i===0?'':'4 4'} opacity={.6}/>
          <text x={PL-8} y={g.y+4} textAnchor="end" fontSize={9} fill={C.muted}
            fontFamily="Plus Jakarta Sans">{(parseFloat(g.v)/1000).toFixed(1)}k</text>
        </g>
      ))}
      <path d={area(vPts)} fill="url(#gVol)" clipPath="url(#cl)"/>
      <path d={area(cPts)} fill="url(#gCom)" clipPath="url(#cl)"/>
      {hovered!=null && <line x1={toX(hovered)} y1={PT} x2={toX(hovered)} y2={PT+chartH}
        stroke={C.gold} strokeWidth={1.5} strokeDasharray="4 3" opacity={.6}/>}
      <path d={vPath} fill="none" stroke={C.navyMid} strokeWidth={2.5}
        strokeLinecap="round" filter="url(#glow)" clipPath="url(#cl)"/>
      <path d={cPath} fill="none" stroke={C.gold} strokeWidth={2}
        strokeLinecap="round" filter="url(#glow)" clipPath="url(#cl)"/>
      {progress > .98 && volumes.map((v,i) => {
        const h = hovered===i
        return (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(v)} r={h?7:4}
              fill={h?C.navyMid:'#FFF'} stroke={C.navyMid} strokeWidth={2.5}
              style={{transition:'r .12s'}}/>
            <circle cx={toX(i)} cy={toY(commissions[i])} r={h?6:3}
              fill={h?C.gold:'#FFF'} stroke={C.gold} strokeWidth={2}
              style={{transition:'r .12s'}}/>
          </g>
        )
      })}
      {data.map((d,i) => (
        <text key={i} x={toX(i)} y={H-4} textAnchor="middle" fontSize={9}
          fill={hovered===i?C.navyMid:C.muted}
          fontWeight={hovered===i?700:400}
          fontFamily="Plus Jakarta Sans">{fmtMois(d.mois)}</text>
      ))}
      {tooltip && progress > .98 && (() => {
        const tx = Math.min(tooltip.x-70, W-PL-145)
        return (
          <g>
            <rect x={tx} y={tooltip.y-70} width={144} height={72} rx={10}
              fill={C.navy} stroke={C.gold} strokeWidth={1.5}
              style={{filter:'drop-shadow(0 4px 12px rgba(10,22,40,.5))'}}/>
            <text x={tx+72} y={tooltip.y-52} textAnchor="middle" fontSize={11}
              fill={C.goldLight} fontWeight={700} fontFamily="Plus Jakarta Sans">
              {fmtMois(tooltip.mois.mois)}
            </text>
            <text x={tx+12} y={tooltip.y-33} fontSize={10} fill="#A8C9F3" fontFamily="Plus Jakarta Sans">Volume</text>
            <text x={tx+132} y={tooltip.y-33} textAnchor="end" fontSize={11}
              fill="#FFF" fontWeight={700} fontFamily="Plus Jakarta Sans">
              {tooltip.vol.toLocaleString('fr-FR')} DH
            </text>
            <text x={tx+12} y={tooltip.y-14} fontSize={10} fill={C.goldLight} fontFamily="Plus Jakarta Sans">Commission</text>
            <text x={tx+132} y={tooltip.y-14} textAnchor="end" fontSize={11}
              fill={C.gold} fontWeight={700} fontFamily="Plus Jakarta Sans">
              {tooltip.com.toLocaleString('fr-FR')} DH
            </text>
          </g>
        )
      })()}
    </svg>
  )
}

// ─── Barre animée ─────────────────────────────────────────────────────────────
function Bar({ label, value, max, color, delay=0 }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(max>0?(value/max)*100:0), delay+300); return ()=>clearTimeout(t) }, [value,max,delay])
  const pct = max > 0 ? ((value/max)*100).toFixed(1) : 0
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <div style={{display:'flex',justifyContent:'space-between'}}>
        <span style={{fontSize:13,color:C.muted,fontWeight:600}}>{label}</span>
        <span style={{fontSize:13,fontWeight:800,color:C.text}}>
          {fmtDH(value)} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>({pct}%)</span>
        </span>
      </div>
      <div style={{height:8,borderRadius:10,background:`${C.border}80`,overflow:'hidden'}}>
        <div style={{height:'100%',borderRadius:10,background:color,width:`${w}%`,transition:`width 1s cubic-bezier(.4,0,.2,1) ${delay}ms`}}/>
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ icon, label, value, color, bg, sub, delay=0 }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return ()=>clearTimeout(t) }, [delay])
  return (
    <div style={{
      background: C.white, border:`1px solid ${C.border}`, borderRadius:18,
      padding:'20px 22px', boxShadow:'0 2px 10px rgba(10,22,40,.05)',
      opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(12px)',
      transition:`opacity .4s ease ${delay}ms, transform .4s ease ${delay}ms`,
    }}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
        <div style={{width:44,height:44,borderRadius:13,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
          {icon}
        </div>
        <span style={{fontSize:12,fontWeight:600,color:C.muted}}>{label}</span>
      </div>
      <div style={{fontSize:26,fontWeight:900,color:color,lineHeight:1}}>
        {(parseFloat(value)||0).toLocaleString('fr-FR')}
        <span style={{fontSize:14,fontWeight:500,color:C.muted,marginLeft:4}}>DH</span>
      </div>
      {sub && <div style={{fontSize:11,color:C.muted,marginTop:6}}>{sub}</div>}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function AdminRevenus() {
  const [data,    setData]    = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminAPI.getRevenus(),
      adminAPI.getRevenusDetails(),
    ]).then(([r, d]) => {
      setData(r.data)
      setDetails(d.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <>
      <Header title="Finances & Revenus"/>
      <div style={{flex:1,display:'flex',justifyContent:'center',alignItems:'center',background:C.ivory}}>
        <Spinner/>
      </div>
    </>
  )

  const totaux     = data?.totaux     || {}
  const parMois    = data?.parMois    || []
  const topTuteurs = data?.topTuteurs || []
  const parMethode = data?.parMethode || []
  const parMatiere = data?.parMatiere || []
  const d = details || {}

  const totalEncaisse  = parseFloat(d.total_encaisse)  || parseFloat(totaux.total_paiements) || 0
  const enEscrow       = parseFloat(d.en_escrow)        || 0
  const commReal       = parseFloat(d.commissions_realisees) || parseFloat(totaux.total_commissions) || 0
  const commAttente    = parseFloat(d.commissions_en_attente) || 0
  const totalVerse     = parseFloat(d.total_verse_tuteurs) || parseFloat(totaux.total_tuteurs) || 0
  const totalRembourse = parseFloat(d.total_rembourse)  || parseFloat(totaux.total_rembourse) || 0
  const nbPaiements    = d.nb_paiements || totaux.nb_paiements || 0
  const nbRemb         = d.nb_remboursements || totaux.nb_remboursements || 0

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:C.ivory}}>
      <Header title="Finances & Revenus"/>
      <div style={{flex:1,overflowY:'auto',minHeight:0,padding:'24px 32px',display:'flex',flexDirection:'column',gap:24}}>

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          <KPI icon="💰" label="Volume total encaissé"  value={totalEncaisse}  color={C.navyMid} bg={`${C.navyMid}12`} sub={`${nbPaiements} transactions`}      delay={0}/>
          <KPI icon="🔒" label="Montant en escrow"       value={enEscrow}       color={C.escrow}  bg={C.escrowBg}       sub="En attente de réalisation"            delay={80}/>
          <KPI icon="✅" label="Versé aux tuteurs (85%)" value={totalVerse}     color={C.success} bg={C.successBg}      sub="Séances réalisées — libéré"           delay={160}/>
          <KPI icon="📊" label="Commission réalisée (15%)" value={commReal}     color={C.goldDark} bg={`${C.gold}15`}  sub="SmartEdu — séances terminées"         delay={240}/>
          <KPI icon="⏳" label="Commission en attente"   value={commAttente}    color={C.orange}  bg={C.orangeBg}       sub="SmartEdu — en escrow"                 delay={320}/>
          <KPI icon="↩️" label="Total remboursements"    value={totalRembourse} color={C.error}   bg={C.errorBg}        sub={`${nbRemb} annulations tuteur`}       delay={400}/>
        </div>

        {/* ── Graphe courbe live ────────────────────────────────────────── */}
        <div style={{background:C.white,borderRadius:24,padding:'28px 32px',border:`1px solid ${C.border}`,boxShadow:'0 4px 20px rgba(10,22,40,.06)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:0}}>Revenus mensuels</h2>
                <div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:20,background:`${C.success}12`,border:`1px solid ${C.success}30`}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:C.success,display:'inline-block'}}/>
                  <span style={{fontSize:10,fontWeight:700,color:C.success,textTransform:'uppercase',letterSpacing:1}}>Live</span>
                </div>
              </div>
              <p style={{fontSize:13,color:C.muted,margin:0}}>12 derniers mois · Volume encaissé et commissions SmartEdu</p>
            </div>
            {/* Légende */}
            <div style={{display:'flex',gap:20}}>
              {[
                {color:C.navyMid, label:'Volume total'},
                {color:C.gold,    label:'Commission SmartEdu'},
              ].map(l => (
                <div key={l.label} style={{display:'flex',alignItems:'center',gap:7}}>
                  <div style={{width:28,height:3,borderRadius:2,background:l.color}}/>
                  <span style={{fontSize:12,color:C.muted,fontWeight:600}}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <RevenueChart data={parMois}/>
        </div>

        {/* ── Répartition + Top tuteurs ─────────────────────────────────── */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>

          {/* Répartition flux */}
          <div style={{background:C.white,borderRadius:20,padding:'24px',border:`1px solid ${C.border}`,boxShadow:'0 2px 8px rgba(10,22,40,.04)'}}>
            <h3 style={{fontSize:15,fontWeight:700,color:C.navy,marginBottom:20}}>📊 Répartition des flux financiers</h3>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <Bar label="💰 Total encaissé"           value={totalEncaisse}  max={totalEncaisse||1} color={`linear-gradient(90deg,${C.navyMid},${C.blue})`}   delay={100}/>
              <Bar label="🔒 En escrow"                value={enEscrow}       max={totalEncaisse||1} color={`linear-gradient(90deg,${C.escrow},#A78BFA)`}       delay={200}/>
              <Bar label="✅ Versé tuteurs (85%)"      value={totalVerse}     max={totalEncaisse||1} color={`linear-gradient(90deg,${C.success},#34D399)`}      delay={300}/>
              <Bar label="📊 Commission SmartEdu (15%)" value={commReal+commAttente} max={totalEncaisse||1} color={`linear-gradient(90deg,${C.gold},${C.goldLight})`} delay={400}/>
              <Bar label="↩️ Remboursements"           value={totalRembourse} max={totalEncaisse||1} color={`linear-gradient(90deg,${C.error},#FCA5A5)`}        delay={500}/>
            </div>

            {/* Mini légende */}
            <div style={{marginTop:24,padding:'14px 16px',borderRadius:14,background:C.ivory,border:`1px solid ${C.border}`}}>
              <p style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Workflow escrow</p>
              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                {[
                  ['Admin paye', '→ Argent bloqué en escrow', C.escrow],
                  ['Séance réalisée', '→ 85% tuteur · 15% SmartEdu', C.success],
                  ['Tuteur annule', '→ 100% remboursé à l\'admin', C.error],
                ].map(([a,b,c]) => (
                  <div key={a} style={{display:'flex',alignItems:'center',gap:8,fontSize:11}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:c,flexShrink:0}}/>
                    <span style={{fontWeight:700,color:C.text}}>{a}</span>
                    <span style={{color:C.muted}}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top tuteurs */}
          <div style={{background:C.white,borderRadius:20,padding:'24px',border:`1px solid ${C.border}`,boxShadow:'0 2px 8px rgba(10,22,40,.04)'}}>
            <h3 style={{fontSize:15,fontWeight:700,color:C.navy,marginBottom:20}}>🏆 Top tuteurs</h3>
            {!topTuteurs.length
              ? <p style={{color:C.muted,textAlign:'center',padding:'20px 0',fontSize:13}}>Aucune donnée</p>
              : <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {topTuteurs.slice(0,6).map((t,i) => {
                    const gains = parseFloat(t.total_gains)||0
                    const maxG  = parseFloat(topTuteurs[0]?.total_gains)||1
                    const medals= ['🥇','🥈','🥉']
                    return (
                      <div key={t.email} style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:i<3?`${C.gold}20`:`${C.navyMid}10`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>
                          {medals[i] || <span style={{fontSize:11,fontWeight:800,color:C.muted}}>{i+1}</span>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                            <span style={{fontSize:13,fontWeight:600,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.prenom} {t.nom}</span>
                            <span style={{fontSize:12,fontWeight:800,color:C.goldDark,flexShrink:0,marginLeft:8}}>{fmtDH(gains)}</span>
                          </div>
                          <div style={{height:5,borderRadius:5,background:`${C.border}60`,overflow:'hidden'}}>
                            <div style={{height:'100%',borderRadius:5,background:i===0?`linear-gradient(90deg,${C.gold},${C.goldLight})`:`linear-gradient(90deg,${C.navyMid},${C.blue})`,width:`${(gains/maxG)*100}%`,transition:'width 1.2s ease .5s'}}/>
                          </div>
                          <div style={{fontSize:10,color:C.muted,marginTop:2}}>{t.nb_seances} séance(s)</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>
        </div>

        {/* ── Par méthode + Par matière ──────────────────────────────────── */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>

          {/* Méthodes */}
          <div style={{background:C.white,borderRadius:20,padding:'24px',border:`1px solid ${C.border}`,boxShadow:'0 2px 8px rgba(10,22,40,.04)'}}>
            <h3 style={{fontSize:15,fontWeight:700,color:C.navy,marginBottom:20}}>💳 Méthodes de paiement</h3>
            {!parMethode.length
              ? <p style={{color:C.muted,textAlign:'center',padding:'16px 0',fontSize:13}}>Aucune donnée</p>
              : <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {parMethode.map((m,i) => {
                    const colors = [C.navyMid, C.gold, C.blue]
                    const vol = parseFloat(m.volume)||0
                    const maxV = parseFloat(parMethode[0]?.volume)||1
                    return (
                      <div key={m.methode}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:16}}>{m.methode==='PAYPAL'?'🅿️':'🏦'}</span>
                            <span style={{fontSize:13,fontWeight:600,color:C.text}}>{m.methode}</span>
                            <span style={{fontSize:11,color:C.muted}}>· {m.nb} transactions</span>
                          </div>
                          <span style={{fontSize:13,fontWeight:800,color:colors[i%3]}}>{fmtDH(vol)}</span>
                        </div>
                        <div style={{height:7,borderRadius:7,background:`${C.border}60`,overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:7,background:colors[i%3],width:`${(vol/maxV)*100}%`,transition:'width 1s ease .4s'}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>

          {/* Par matière */}
          <div style={{background:C.white,borderRadius:20,padding:'24px',border:`1px solid ${C.border}`,boxShadow:'0 2px 8px rgba(10,22,40,.04)'}}>
            <h3 style={{fontSize:15,fontWeight:700,color:C.navy,marginBottom:20}}>📚 Revenus par matière</h3>
            {!parMatiere.length
              ? <p style={{color:C.muted,textAlign:'center',padding:'16px 0',fontSize:13}}>Aucune donnée</p>
              : <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {parMatiere.slice(0,6).map((m,i) => {
                    const colors=[C.navyMid,C.gold,C.blue,C.success,C.error,C.escrow]
                    const vol=parseFloat(m.volume)||0, maxV=parseFloat(parMatiere[0]?.volume)||1
                    return (
                      <div key={m.matiere}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                          <span style={{fontSize:13,fontWeight:600,color:C.text}}>{m.matiere}</span>
                          <div style={{display:'flex',gap:10,alignItems:'center'}}>
                            <span style={{fontSize:11,color:C.muted}}>{m.nb_seances} séances</span>
                            <span style={{fontSize:13,fontWeight:800,color:colors[i%6]}}>{fmtDH(vol)}</span>
                          </div>
                        </div>
                        <div style={{height:6,borderRadius:6,background:`${C.border}60`,overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:6,background:colors[i%6],width:`${(vol/maxV)*100}%`,transition:'width 1s ease .3s'}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>
        </div>

      </div>
    </div>
  )
}