import React, { useEffect, useState, useRef, useCallback } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  navy:'#0A1628', navyMid:'#162B55', navyLight:'#1E3A6E',
  blue:'#4A90E2', blueLight:'#74ACEC',
  gold:'#C5A059', goldLight:'#E8D5A3', goldDark:'#8B6914',
  ivory:'#F5F0E6', white:'#FFFFFF',
  success:'#059669', error:'#DC2626',
  text:'#0A1628', textSub:'#4A6080', textMuted:'#94A3B8',
  border:'#E8D5A3',
  escrow:'#7C3AED', escrowLight:'#EDE9FE',
}

const MOIS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const fmtMois = (str) => { if (!str) return ''; const [y,m] = str.split('-'); return `${MOIS_FR[parseInt(m)-1]} ${y.slice(2)}` }
const fmtMoney = (n) => { const v=parseFloat(n)||0; return v>=1000?`${(v/1000).toFixed(1)}k`:v.toFixed(0) }
const fmtNum = (n) => (parseFloat(n)||0).toLocaleString('fr-FR')

const SEANCE_STATUTS = {
  EN_ATTENTE_PAIEMENT: { label:'En attente paiement', color:'#F59E0B', bg:'rgba(245,158,11,.12)' },
  CONFIRMEE:           { label:'Confirmée & payée',    color:'#3B82F6', bg:'rgba(59,130,246,.12)' },
  EN_COURS:            { label:'En cours',             color:'#8B5CF6', bg:'rgba(139,92,246,.12)' },
  REALISEE:            { label:'Réalisée',             color:'#059669', bg:'rgba(5,150,105,.12)'  },
  ANNULEE:             { label:'Annulée',              color:'#DC2626', bg:'rgba(220,38,38,.10)'  },
  PLANIFIEE:           { label:'Planifiée',            color:'#F59E0B', bg:'rgba(245,158,11,.12)' },
}

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target, duration=1200) {
  const [value,setValue]=useState(0)
  useEffect(()=>{
    if(!target)return
    const start=performance.now(), end=parseFloat(target)||0
    const raf=(now)=>{ const p=Math.min((now-start)/duration,1), ease=1-Math.pow(1-p,3); setValue(Math.round(end*ease)); if(p<1) requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
  },[target])
  return value
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({icon,value,label,color='navy',suffix='',delay=0,sub}) {
  const [visible,setVisible]=useState(false)
  const animated=useCountUp(visible?value:0)
  useEffect(()=>{const t=setTimeout(()=>setVisible(true),delay);return()=>clearTimeout(t)},[delay])
  const cfgMap={
    navy:{bg:C.navyMid,accent:C.gold,text:'#FFF',icon:C.goldLight},
    gold:{bg:C.gold,accent:C.navyMid,text:'#FFF',icon:'#FFF'},
    emerald:{bg:'#065F46',accent:'#34D399',text:'#FFF',icon:'#6EE7B7'},
    rose:{bg:'#991B1B',accent:'#FCA5A5',text:'#FFF',icon:'#FCA5A5'},
    blue:{bg:C.navyLight,accent:C.blueLight,text:'#FFF',icon:'#A8C9F3'},
    purple:{bg:'#4C1D95',accent:'#A78BFA',text:'#FFF',icon:'#C4B5FD'},
  }
  const cfg=cfgMap[color]||cfgMap.navy
  return (
    <div style={{background:`linear-gradient(135deg,${cfg.bg},${cfg.bg}CC)`,borderRadius:20,padding:'22px 24px',position:'relative',overflow:'hidden',boxShadow:`0 8px 32px ${cfg.bg}44`,border:`1px solid ${cfg.accent}22`,opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(16px)',transition:`opacity .5s ease ${delay}ms,transform .5s ease ${delay}ms`}}>
      <div style={{position:'absolute',right:-20,top:-20,width:100,height:100,borderRadius:'50%',background:`${cfg.accent}15`}}/>
      <div style={{fontSize:26,marginBottom:10,position:'relative',zIndex:1}}>{icon}</div>
      <div style={{fontSize:30,fontWeight:900,color:cfg.text,lineHeight:1,position:'relative',zIndex:1}}>
        {animated.toLocaleString('fr-FR')}{suffix}
      </div>
      <div style={{fontSize:12,color:`${cfg.text}AA`,marginTop:6,fontWeight:500,textTransform:'uppercase',letterSpacing:1,position:'relative',zIndex:1}}>{label}</div>
      {sub && <div style={{fontSize:11,color:`${cfg.text}77`,marginTop:2,position:'relative',zIndex:1}}>{sub}</div>}
      <div style={{position:'absolute',bottom:0,left:0,height:3,width:'60%',background:`linear-gradient(90deg,${cfg.accent},transparent)`,borderRadius:'0 3px 0 0'}}/>
    </div>
  )
}

// ─── Revenue Chart (gardé intact) ────────────────────────────────────────────
function RevenueChart({data}) {
  const svgRef=useRef(null)
  const [progress,setProgress]=useState(0)
  const [tooltip,setTooltip]=useState(null)
  const [hovered,setHovered]=useState(null)
  useEffect(()=>{
    if(!data?.length)return
    const start=performance.now(),dur=1800
    const raf=(now)=>{const p=Math.min((now-start)/dur,1),ease=1-Math.pow(1-p,4);setProgress(ease);if(p<1)requestAnimationFrame(raf)}
    requestAnimationFrame(raf)
  },[data])
  if(!data||data.length===0) return(
    <div style={{height:280,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
      <div style={{fontSize:40,opacity:.3}}>📊</div>
      <p style={{color:C.textMuted,fontSize:13}}>Aucune donnée de revenus disponible</p>
    </div>
  )
  const W=860,H=280,PL=60,PR=24,PT=28,PB=44,chartW=W-PL-PR,chartH=H-PT-PB
  const volumes=data.map(d=>parseFloat(d.volume)||0)
  const commissions=data.map(d=>parseFloat(d.commissions)||0)
  const maxVal=Math.max(...volumes,1)
  const mag=Math.pow(10,Math.floor(Math.log10(maxVal)))
  const niceMax=Math.ceil(maxVal/mag)*mag
  const xStep=volumes.length>1?chartW/(volumes.length-1):chartW
  const toX=(i)=>PL+i*xStep
  const toY=(v)=>PT+chartH-(v/niceMax)*chartH
  const smoothPath=(points)=>{
    if(points.length<2)return''
    const pts=points.map(([x,y])=>({x,y}))
    let d=`M ${pts[0].x} ${pts[0].y}`
    for(let i=0;i<pts.length-1;i++){
      const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)],t=0.4
      d+=` C ${p1.x+(p2.x-p0.x)*t} ${p1.y+(p2.y-p0.y)*t} ${p2.x-(p3.x-p1.x)*t} ${p2.y-(p3.y-p1.y)*t} ${p2.x} ${p2.y}`
    }
    return d
  }
  const visibleCount=Math.max(1,Math.ceil(volumes.length*progress))
  const volPts=volumes.slice(0,visibleCount).map((v,i)=>[toX(i),toY(v)])
  const comPts=commissions.slice(0,visibleCount).map((v,i)=>[toX(i),toY(v)])
  const volPath=smoothPath(volPts),comPath=smoothPath(comPts)
  const areaPath=(pts)=>{if(!pts.length)return'';const line=smoothPath(pts),last=pts[pts.length-1];return`${line} L ${last[0]} ${PT+chartH} L ${PL} ${PT+chartH} Z`}
  const gridLines=[0,.25,.5,.75,1].map(pct=>({y:PT+chartH-pct*chartH,val:(niceMax*pct).toFixed(0)}))
  const handleMouseMove=useCallback((e)=>{
    if(!svgRef.current)return
    const rect=svgRef.current.getBoundingClientRect()
    const svgX=(e.clientX-rect.left)*(W/rect.width)
    const idx=Math.round((svgX-PL)/xStep)
    if(idx>=0&&idx<volumes.length){setHovered(idx);setTooltip({x:toX(idx),y:Math.min(toY(volumes[idx]),toY(commissions[idx]))-8,point:data[idx],vol:volumes[idx],com:commissions[idx],idx})}
  },[volumes,commissions,data,xStep])
  const totalVol=volumes.reduce((a,b)=>a+b,0),totalCom=commissions.reduce((a,b)=>a+b,0)
  return(
    <div style={{position:'relative'}}>
      <div style={{display:'flex',alignItems:'center',gap:24,marginBottom:20,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:32,height:3,borderRadius:2,background:`linear-gradient(90deg,${C.navyMid},${C.blue})`}}/><span style={{fontSize:12,color:C.textSub,fontWeight:600}}>Volume total</span><span style={{fontSize:13,fontWeight:800,color:C.navyMid}}>{totalVol.toLocaleString('fr-FR')} DH</span></div>
        <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:32,height:3,borderRadius:2,background:`linear-gradient(90deg,${C.gold},${C.goldLight})`}}/><span style={{fontSize:12,color:C.textSub,fontWeight:600}}>Commissions</span><span style={{fontSize:13,fontWeight:800,color:C.goldDark}}>{totalCom.toLocaleString('fr-FR')} DH</span></div>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',overflow:'visible',cursor:'crosshair'}} onMouseMove={handleMouseMove} onMouseLeave={()=>{setHovered(null);setTooltip(null)}}>
        <defs>
          <linearGradient id="gradVol" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.navyMid} stopOpacity="0.28"/><stop offset="100%" stopColor={C.navyMid} stopOpacity="0.01"/></linearGradient>
          <linearGradient id="gradCom" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity="0.22"/><stop offset="100%" stopColor={C.gold} stopOpacity="0.01"/></linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <clipPath id="clipLeft"><rect x={PL} y={0} width={chartW*progress} height={H}/></clipPath>
        </defs>
        {gridLines.map((g,i)=>(<g key={i}><line x1={PL} y1={g.y} x2={PL+chartW} y2={g.y} stroke={C.border} strokeWidth={i===0?1.5:0.8} strokeDasharray={i===0?'':'4 4'} opacity={0.6}/><text x={PL-8} y={g.y+4} textAnchor="end" fontSize={10} fill={C.textMuted} fontFamily="Plus Jakarta Sans">{fmtMoney(g.val)}</text></g>))}
        <path d={areaPath(volPts)} fill="url(#gradVol)" clipPath="url(#clipLeft)"/>
        <path d={areaPath(comPts)} fill="url(#gradCom)" clipPath="url(#clipLeft)"/>
        {hovered!==null&&<line x1={toX(hovered)} y1={PT} x2={toX(hovered)} y2={PT+chartH} stroke={C.gold} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7}/>}
        <path d={volPath} fill="none" stroke={C.navyMid} strokeWidth={2.5} strokeLinecap="round" filter="url(#glow)" clipPath="url(#clipLeft)"/>
        <path d={volPath} fill="none" stroke={C.blue} strokeWidth={1} strokeLinecap="round" opacity={0.5} clipPath="url(#clipLeft)"/>
        <path d={comPath} fill="none" stroke={C.gold} strokeWidth={2} strokeLinecap="round" filter="url(#glow)" clipPath="url(#clipLeft)"/>
        <path d={comPath} fill="none" stroke={C.goldLight} strokeWidth={1} strokeLinecap="round" opacity={0.4} clipPath="url(#clipLeft)"/>
        {progress>0.98&&volumes.map((v,i)=>{const isH=hovered===i;return(<g key={i}><circle cx={toX(i)} cy={toY(v)} r={isH?7:4} fill={isH?C.navyMid:'#FFF'} stroke={C.navyMid} strokeWidth={2.5} style={{transition:'r .15s,fill .15s'}}/><circle cx={toX(i)} cy={toY(commissions[i])} r={isH?6:3.5} fill={isH?C.gold:'#FFF'} stroke={C.gold} strokeWidth={2} style={{transition:'r .15s,fill .15s'}}/></g>)})}
        {data.map((d,i)=>(<text key={i} x={toX(i)} y={H-6} textAnchor="middle" fontSize={10} fill={hovered===i?C.navyMid:C.textMuted} fontWeight={hovered===i?700:400} fontFamily="Plus Jakarta Sans">{fmtMois(d.mois)}</text>))}
        {tooltip&&progress>0.98&&(<g><rect x={Math.min(tooltip.x-70,W-PL-145)} y={tooltip.y-68} width={144} height={70} rx={10} fill={C.navy} stroke={C.gold} strokeWidth={1.5} style={{filter:'drop-shadow(0 4px 16px rgba(10,22,40,.5))'}}/><text x={Math.min(tooltip.x-70,W-PL-145)+72} y={tooltip.y-48} textAnchor="middle" fontSize={11} fill={C.goldLight} fontWeight={700} fontFamily="Plus Jakarta Sans">{fmtMois(tooltip.point.mois)}</text><text x={Math.min(tooltip.x-70,W-PL-145)+14} y={tooltip.y-30} fontSize={10} fill="#A8C9F3" fontFamily="Plus Jakarta Sans">Volume:</text><text x={Math.min(tooltip.x-70,W-PL-145)+130} y={tooltip.y-30} textAnchor="end" fontSize={11} fill="#FFF" fontWeight={700} fontFamily="Plus Jakarta Sans">{tooltip.vol.toLocaleString('fr-FR')} DH</text><text x={Math.min(tooltip.x-70,W-PL-145)+14} y={tooltip.y-12} fontSize={10} fill={C.goldLight} fontFamily="Plus Jakarta Sans">Commission:</text><text x={Math.min(tooltip.x-70,W-PL-145)+130} y={tooltip.y-12} textAnchor="end" fontSize={11} fill={C.gold} fontWeight={700} fontFamily="Plus Jakarta Sans">{tooltip.com.toLocaleString('fr-FR')} DH</text></g>)}
      </svg>
    </div>
  )
}

// ─── AnimBar ──────────────────────────────────────────────────────────────────
function AnimBar({label,value,max,color,delay=0}) {
  const [w,setW]=useState(0)
  useEffect(()=>{const t=setTimeout(()=>setW((value/max)*100),delay+200);return()=>clearTimeout(t)},[value,max,delay])
  const pct=max>0?((value/max)*100).toFixed(1):0
  return(
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:12,color:C.textSub,fontWeight:600}}>{label}</span>
        <span style={{fontSize:12,fontWeight:800,color:C.text}}>{parseFloat(value).toLocaleString('fr-FR')} DH <span style={{color:C.textMuted,fontWeight:400}}>({pct}%)</span></span>
      </div>
      <div style={{height:8,borderRadius:10,background:`${C.border}80`,overflow:'hidden'}}>
        <div style={{height:'100%',borderRadius:10,background:color,width:`${w}%`,transition:`width 1s cubic-bezier(.4,0,.2,1) ${delay}ms`}}/>
      </div>
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({title,children,extra}) {
  return(
    <div style={{background:C.white,borderRadius:20,padding:'24px 26px',border:`1px solid ${C.border}`,boxShadow:'0 2px 12px rgba(10,22,40,.06)'}}>
      {(title||extra)&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
          {title&&<h3 style={{fontSize:15,fontWeight:700,color:C.navy,margin:0}}>{title}</h3>}
          {extra}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Section Séances ──────────────────────────────────────────────────────────
function SeancesSection({seancesStats}) {
  const parStatut = seancesStats?.parStatut || []
  const recentes  = seancesStats?.recentes  || []
  const total = parStatut.reduce((a,s)=>a+parseInt(s.nb),0)
  return(
    <Card title="📅 Séances — vue d'ensemble">
      {/* Barres par statut */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
        {parStatut.map(s=>{
          const cfg=SEANCE_STATUTS[s.statut]||{label:s.statut,color:C.textMuted,bg:'rgba(148,163,184,.12)'}
          return(
            <div key={s.statut} style={{borderRadius:14,padding:'12px 14px',background:cfg.bg,border:`1px solid ${cfg.color}30`}}>
              <div style={{fontSize:20,fontWeight:900,color:cfg.color}}>{s.nb}</div>
              <div style={{fontSize:11,color:cfg.color,fontWeight:600,marginTop:2}}>{cfg.label}</div>
              {parseFloat(s.montant)>0&&<div style={{fontSize:10,color:C.textMuted,marginTop:2}}>{parseFloat(s.montant).toLocaleString('fr-FR')} DH</div>}
            </div>
          )
        })}
        {parStatut.length===0&&<p style={{gridColumn:'1/-1',textAlign:'center',color:C.textMuted,fontSize:13,padding:'20px 0'}}>Aucune séance</p>}
      </div>
      {/* Séances récentes */}
      {recentes.length>0&&(
        <>
          <h4 style={{fontSize:12,fontWeight:700,color:C.textMuted,textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>10 dernières séances</h4>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {recentes.map(s=>{
              const cfg=SEANCE_STATUTS[s.statut]||{label:s.statut,color:C.textMuted,bg:'rgba(148,163,184,.1)'}
              return(
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:12,background:C.ivory,border:`1px solid ${C.border}`}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:cfg.color,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:600,color:C.text,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.titre}</p>
                    <p style={{fontSize:11,color:C.textMuted,margin:0}}>{s.salle_nom} · {s.tuteur_prenom} {s.tuteur_nom}</p>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,background:cfg.bg,color:cfg.color,flexShrink:0}}>{cfg.label}</span>
                  {s.montant_total>0&&<span style={{fontSize:11,fontWeight:700,color:C.goldDark,flexShrink:0}}>{parseFloat(s.montant_total).toLocaleString('fr-FR')} DH</span>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}

// ─── Section Revenus ─────────────────────────────────────────────────────────
function RevenusSection({details,parMois,topTuteurs}) {
  const d=details||{}
  const escrow         = parseFloat(d.en_escrow)||0
  const commRealisees  = parseFloat(d.commissions_realisees)||0
  const commAttente    = parseFloat(d.commissions_en_attente)||0
  const totalEncaisse  = parseFloat(d.total_encaisse)||0
  const totalRembourse = parseFloat(d.total_rembourse)||0
  const totalVerse     = parseFloat(d.total_verse_tuteurs)||0
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* KPI Escrow */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
        {[
          {label:'💰 Total encaissé',  value:totalEncaisse,  color:C.navyMid,  sub:`${d.nb_paiements||0} paiements`},
          {label:'🔒 En escrow',       value:escrow,         color:C.escrow,   sub:'Versement après réalisation'},
          {label:'✅ Commissions réalisées', value:commRealisees, color:C.success, sub:'SmartEdu — séances terminées'},
          {label:'⏳ Commissions en attente', value:commAttente, color:'#D97706', sub:'SmartEdu — en attente libération'},
          {label:'↩️ Remboursements', value:totalRembourse, color:C.error,    sub:`${d.nb_remboursements||0} annulations`},
          {label:'👨‍🏫 Versé aux tuteurs', value:totalVerse,   color:'#0891B2', sub:'85% des séances réalisées'},
        ].map(k=>(
          <div key={k.label} style={{borderRadius:16,padding:'16px 18px',background:C.white,border:`1px solid ${C.border}`,boxShadow:'0 2px 8px rgba(10,22,40,.05)'}}>
            <div style={{fontSize:11,fontWeight:600,color:C.textMuted,marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:22,fontWeight:900,color:k.color}}>{k.value.toLocaleString('fr-FR')} <span style={{fontSize:12,fontWeight:500,color:C.textMuted}}>DH</span></div>
            <div style={{fontSize:10,color:C.textMuted,marginTop:3}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Graphe + Répartition */}
      <div style={{background:C.white,borderRadius:24,padding:'28px 32px',border:`1px solid ${C.border}`,boxShadow:'0 4px 24px rgba(10,22,40,.07)'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
              <h2 style={{fontSize:20,fontWeight:800,color:C.navy,margin:0}}>Revenus mensuels</h2>
              <div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:20,background:`${C.success}12`,border:`1px solid ${C.success}30`}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:C.success,display:'inline-block',animation:'pulse 2s infinite'}}/>
                <span style={{fontSize:10,fontWeight:700,color:C.success,textTransform:'uppercase',letterSpacing:1}}>Live</span>
              </div>
            </div>
            <p style={{fontSize:13,color:C.textMuted,margin:0}}>12 derniers mois · Volume et commissions</p>
          </div>
        </div>
        <RevenueChart data={parMois}/>
      </div>

      {/* Répartition + Top tuteurs */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <Card title="Répartition des flux">
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <AnimBar label="Volume total encaissé" value={totalEncaisse} max={totalEncaisse||1} color={`linear-gradient(90deg,${C.navyMid},${C.blue})`} delay={200}/>
            <AnimBar label="🔒 En escrow (en attente)" value={escrow} max={totalEncaisse||1} color={`linear-gradient(90deg,${C.escrow},#A78BFA)`} delay={300}/>
            <AnimBar label="✅ Versé aux tuteurs (85%)" value={totalVerse} max={totalEncaisse||1} color={`linear-gradient(90deg,${C.success},#34D399)`} delay={400}/>
            <AnimBar label="Commission SmartEdu (15%)" value={commRealisees+commAttente} max={totalEncaisse||1} color={`linear-gradient(90deg,${C.gold},${C.goldLight})`} delay={500}/>
            <AnimBar label="↩️ Remboursements" value={totalRembourse} max={totalEncaisse||1} color={`linear-gradient(90deg,${C.error},#FCA5A5)`} delay={600}/>
          </div>
        </Card>
        <Card title="Top tuteurs">
          {!topTuteurs?.length
            ? <p style={{fontSize:13,color:C.textMuted,textAlign:'center',padding:'20px 0'}}>Aucun tuteur avec paiements</p>
            : <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {topTuteurs.slice(0,5).map((t,i)=>{
                  const gains=parseFloat(t.total_gains)||0
                  const maxG=parseFloat(topTuteurs[0]?.total_gains)||1
                  return(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:i===0?`linear-gradient(135deg,${C.gold},${C.goldLight})`:i===1?`${C.navyMid}20`:`${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:i<3?C.navyMid:C.textMuted,flexShrink:0}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
                      <div style={{flex:1,overflow:'hidden'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                          <span style={{fontSize:12,fontWeight:600,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.prenom} {t.nom}</span>
                          <span style={{fontSize:11,fontWeight:700,color:C.goldDark,flexShrink:0,marginLeft:8}}>{gains.toLocaleString('fr-FR')} DH</span>
                        </div>
                        <div style={{height:5,borderRadius:5,background:`${C.border}60`,overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:5,background:i===0?`linear-gradient(90deg,${C.gold},${C.goldLight})`:`linear-gradient(90deg,${C.navyMid},${C.blue})`,width:`${(gains/maxG)*100}%`,transition:'width 1s ease .6s'}}/>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
          }
        </Card>
      </div>
    </div>
  )
}

// ─── Section Examens ──────────────────────────────────────────────────────────
function ExamensSection({examens}) {
  const [selected,setSelected]=useState(null)
  const [details,setDetails]=useState(null)
  const [loadingDetails,setLoadingDetails]=useState(false)

  const openDetails = async (examen) => {
    if(selected?.id===examen.id){setSelected(null);setDetails(null);return}
    setSelected(examen)
    setLoadingDetails(true)
    try{
      const r=await adminAPI.getExamenDetails(examen.id)
      setDetails(r.data)
    }catch{}
    setLoadingDetails(false)
  }

  const STATUT_EXAMEN = {
    BROUILLON:{label:'Brouillon',color:'#94A3B8',bg:'rgba(148,163,184,.12)'},
    PUBLIE:   {label:'Publié',   color:C.success, bg:`rgba(5,150,105,.12)`},
    ARCHIVE:  {label:'Archivé', color:C.textMuted,bg:'rgba(148,163,184,.08)'},
  }

  return(
    <Card title="📝 Examens">
      {examens.length===0
        ? <p style={{fontSize:13,color:C.textMuted,textAlign:'center',padding:'20px 0'}}>Aucun examen créé</p>
        : <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {examens.map(ex=>{
              const sCfg=STATUT_EXAMEN[ex.statut]||STATUT_EXAMEN.BROUILLON
              const isOpen=selected?.id===ex.id
              return(
                <div key={ex.id}>
                  <button onClick={()=>openDetails(ex)}
                    style={{width:'100%',textAlign:'left',background:isOpen?C.ivory:C.white,border:`1.5px solid ${isOpen?C.gold:C.border}`,borderRadius:14,padding:'14px 16px',cursor:'pointer',transition:'all .15s'}}
                    onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.borderColor=C.goldLight}}
                    onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.borderColor=C.border}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.navyMid},${C.navyLight})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>📝</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                          <span style={{fontSize:13,fontWeight:700,color:C.text}}>{ex.titre}</span>
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:sCfg.bg,color:sCfg.color,border:`1px solid ${sCfg.color}30`}}>{sCfg.label}</span>
                        </div>
                        <div style={{display:'flex',gap:14,marginTop:3,flexWrap:'wrap'}}>
                          <span style={{fontSize:11,color:C.textMuted}}>🏫 {ex.salle_nom}</span>
                          <span style={{fontSize:11,color:C.textMuted}}>👨‍🏫 {ex.tuteur_prenom} {ex.tuteur_nom}</span>
                          <span style={{fontSize:11,color:C.textMuted}}>⏱ {ex.duree_minutes} min</span>
                          <span style={{fontSize:11,color:C.textMuted}}>🎯 {ex.note_passage}% requis</span>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:12,flexShrink:0}}>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontSize:16,fontWeight:800,color:C.success}}>{ex.nb_reussis||0}</div>
                          <div style={{fontSize:9,color:C.textMuted}}>Réussis</div>
                        </div>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontSize:16,fontWeight:800,color:C.error}}>{ex.nb_echoues||0}</div>
                          <div style={{fontSize:9,color:C.textMuted}}>Échoués</div>
                        </div>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontSize:16,fontWeight:800,color:C.textMuted}}>{ex.nb_tentatives||0}</div>
                          <div style={{fontSize:9,color:C.textMuted}}>Total</div>
                        </div>
                        <span style={{color:C.gold,fontSize:16,alignSelf:'center'}}>{isOpen?'▲':'▼'}</span>
                      </div>
                    </div>
                  </button>

                  {/* Détails étendus */}
                  {isOpen&&(
                    <div style={{border:`1.5px solid ${C.gold}`,borderTop:'none',borderRadius:'0 0 14px 14px',background:C.ivory,padding:'16px 18px'}}>
                      {loadingDetails
                        ? <div style={{textAlign:'center',padding:20}}><Spinner/></div>
                        : details&&(
                          <>
                            <h4 style={{fontSize:12,fontWeight:700,color:C.textMuted,textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>Résultats des étudiants</h4>
                            {details.tentatives.length===0
                              ? <p style={{fontSize:13,color:C.textMuted,textAlign:'center',padding:'12px 0'}}>Aucun étudiant n'a passé cet examen</p>
                              : <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                  {details.tentatives.map(t=>{
                                    const reussi=t.statut==='REUSSI'
                                    const echoue=t.statut==='ECHOUE'
                                    return(
                                      <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,background:C.white,border:`1px solid ${reussi?`${C.success}30`:echoue?`${C.error}30`:C.border}`}}>
                                        <div style={{width:32,height:32,borderRadius:'50%',background:`linear-gradient(135deg,${C.navyMid},${C.navyLight})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#FFF',flexShrink:0}}>
                                          {t.prenom?.[0]}{t.nom?.[0]}
                                        </div>
                                        <div style={{flex:1,minWidth:0}}>
                                          <p style={{fontSize:12,fontWeight:600,color:C.text,margin:0}}>{t.prenom} {t.nom}</p>
                                          <p style={{fontSize:11,color:C.textMuted,margin:0}}>{t.email}</p>
                                        </div>
                                        {t.pourcentage!=null&&(
                                          <div style={{textAlign:'center',minWidth:60}}>
                                            <div style={{fontSize:16,fontWeight:900,color:reussi?C.success:echoue?C.error:C.textMuted}}>{parseFloat(t.pourcentage).toFixed(1)}%</div>
                                            <div style={{fontSize:9,color:C.textMuted}}>{parseFloat(t.score_obtenu).toFixed(1)} pts</div>
                                          </div>
                                        )}
                                        <span style={{fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:20,background:reussi?`${C.success}12`:echoue?`${C.error}10`:'rgba(148,163,184,.12)',color:reussi?C.success:echoue?C.error:C.textMuted,border:`1px solid ${reussi?`${C.success}30`:echoue?`${C.error}30`:C.border}`,flexShrink:0}}>
                                          {reussi?'✅ Réussi':echoue?'❌ Échoué':'⏳ En cours'}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                            }
                          </>
                        )
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
      }
    </Card>
  )
}

// ─── Section Tuteurs activité ─────────────────────────────────────────────────
function TuteursActiviteSection({tuteurs}) {
  const actifs  = tuteurs.filter(t=>t.activite==='ACTIF')
  const inactifs = tuteurs.filter(t=>t.activite==='INACTIF')
  const [tab,setTab]=useState('actifs')
  const liste = tab==='actifs' ? actifs : inactifs
  return(
    <Card
      title="👨‍🏫 Tuteurs actifs / inactifs"
      extra={
        <div style={{display:'flex',gap:6}}>
          {[['actifs',actifs.length,C.success],['inactifs',inactifs.length,C.error]].map(([k,n,col])=>(
            <button key={k} onClick={()=>setTab(k)} style={{fontSize:12,fontWeight:700,padding:'4px 14px',borderRadius:20,border:`1.5px solid ${tab===k?col:C.border}`,background:tab===k?`${col}12`:C.white,color:tab===k?col:C.textMuted,cursor:'pointer',transition:'all .15s'}}>
              {k==='actifs'?'✅ Actifs':'⚠️ Inactifs'} <span style={{marginLeft:4,fontSize:11}}>{n}</span>
            </button>
          ))}
        </div>
      }
    >
      <div style={{marginBottom:12,padding:'10px 14px',borderRadius:12,background:tab==='actifs'?`${C.success}08`:`${C.error}08`,border:`1px solid ${tab==='actifs'?`${C.success}20`:`${C.error}20`}`}}>
        <p style={{fontSize:12,color:tab==='actifs'?C.success:C.error,margin:0}}>
          {tab==='actifs'
            ? '✅ Tuteurs actifs : ont au moins une disponibilité enregistrée.'
            : '⚠️ Tuteurs inactifs : aucune disponibilité — ils ne peuvent pas recevoir de séances.'}
        </p>
      </div>
      {liste.length===0
        ? <p style={{fontSize:13,color:C.textMuted,textAlign:'center',padding:'16px 0'}}>Aucun tuteur {tab==='actifs'?'actif':'inactif'}</p>
        : <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {liste.map(t=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,background:C.ivory,border:`1px solid ${C.border}`}}>
                <div style={{width:38,height:38,borderRadius:12,background:`linear-gradient(135deg,${C.navyMid},${C.navyLight})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#FFF',fontSize:13,flexShrink:0}}>
                  {t.prenom?.[0]}{t.nom?.[0]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <p style={{fontSize:13,fontWeight:700,color:C.text,margin:0}}>{t.prenom} {t.nom}</p>
                    <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,background:t.activite==='ACTIF'?`${C.success}12`:`${C.error}10`,color:t.activite==='ACTIF'?C.success:C.error,border:`1px solid ${t.activite==='ACTIF'?`${C.success}30`:`${C.error}30`}`}}>
                      {t.activite==='ACTIF'?'✅ Actif':'⚠️ Inactif'}
                    </span>
                  </div>
                  <div style={{display:'flex',gap:12,marginTop:2,flexWrap:'wrap'}}>
                    <span style={{fontSize:11,color:C.textMuted}}>📅 {t.nb_disponibilites} dispo.</span>
                    <span style={{fontSize:11,color:C.textMuted}}>📚 {t.nb_seances} séances</span>
                    <span style={{fontSize:11,color:C.success}}>✅ {t.nb_realisees} réalisées</span>
                    {t.note_moyenne>0&&<span style={{fontSize:11,color:C.gold}}>⭐ {parseFloat(t.note_moyenne).toFixed(1)}</span>}
                  </div>
                  {t.specialites?.length>0&&(
                    <div style={{display:'flex',gap:4,marginTop:4,flexWrap:'wrap'}}>
                      {t.specialites.slice(0,3).map(s=>(
                        <span key={s} style={{fontSize:9,fontWeight:600,padding:'1px 7px',borderRadius:20,background:`${C.navyMid}10`,color:C.navyMid,border:`1px solid ${C.navyMid}20`}}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
      }
    </Card>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,          setStats]          = useState(null)
  const [revenus,        setRevenus]        = useState(null)
  const [revenusDetails, setRevenusDetails] = useState(null)
  const [pending,        setPending]        = useState([])
  const [examens,        setExamens]        = useState([])
  const [tuteursActivite,setTuteursActivite]= useState([])
  const [seancesStats,   setSeancesStats]   = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [activeTab,      setActiveTab]      = useState('overview')
  const { toasts, success, error } = useToast()

  useEffect(()=>{
    Promise.all([
      adminAPI.getStats(),
      adminAPI.getTuteursPending(),
      adminAPI.getRevenus(),
      adminAPI.getExamens(),
      adminAPI.getTuteursActivite(),
      adminAPI.getSeancesStats(),
      adminAPI.getRevenusDetails(),
    ]).then(([sr,pr,rr,er,tar,ssr,rdr])=>{
      setStats(sr.data)
      setPending(pr.data)
      setRevenus(rr.data)
      setExamens(er.data)
      setTuteursActivite(tar.data)
      setSeancesStats(ssr.data)
      setRevenusDetails(rdr.data)
    }).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const valider = async (id,accepte) => {
    try {
      await adminAPI.validerTuteur(id,accepte)
      setPending(prev=>prev.filter(t=>t.id!==id))
      success(accepte?'Tuteur validé !':'Tuteur refusé.')
    } catch { error('Erreur') }
  }

  const parMois    = revenus?.parMois    || []
  const totaux     = revenus?.totaux     || {}
  const topTuteurs = revenus?.topTuteurs || []

  const TABS = [
    {key:'overview', label:'Vue d\'ensemble', icon:'📊'},
    {key:'seances',  label:'Séances',         icon:'📅'},
    {key:'examens',  label:'Examens',         icon:'📝'},
    {key:'tuteurs',  label:'Tuteurs',         icon:'👨‍🏫'},
    {key:'revenus',  label:'Revenus',         icon:'💰'},
  ]

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:C.ivory}}>
      <Header title="Vue d'ensemble" />
      <ToastContainer toasts={toasts}/>

      <div style={{flex:1,overflowY:'auto',minHeight:0,display:'flex',flexDirection:'column'}}>
        {loading
          ? <div style={{display:'flex',justifyContent:'center',paddingTop:80}}><Spinner size="lg"/></div>
          : <>
              {/* ── Tabs navigation ─────────────────────────────────────── */}
              <div style={{padding:'16px 28px 0',background:C.white,borderBottom:`1px solid ${C.border}`,display:'flex',gap:4,flexShrink:0}}>
                {TABS.map(t=>(
                  <button key={t.key} onClick={()=>setActiveTab(t.key)}
                    style={{
                      padding:'10px 18px',borderRadius:'12px 12px 0 0',border:'none',
                      background:activeTab===t.key?C.ivory:'transparent',
                      borderBottom:activeTab===t.key?`2px solid ${C.gold}`:'2px solid transparent',
                      color:activeTab===t.key?C.navy:C.textMuted,
                      fontSize:13,fontWeight:activeTab===t.key?700:500,
                      cursor:'pointer',transition:'all .15s',
                      display:'flex',alignItems:'center',gap:6,
                    }}>
                    <span>{t.icon}</span>{t.label}
                    {t.key==='examens'&&examens.length>0&&<span style={{fontSize:10,fontWeight:800,padding:'1px 6px',borderRadius:20,background:`${C.navyMid}15`,color:C.navyMid}}>{examens.length}</span>}
                    {t.key==='tuteurs'&&pending.length>0&&<span style={{fontSize:10,fontWeight:800,padding:'1px 6px',borderRadius:20,background:`${C.error}12`,color:C.error}}>{pending.length}</span>}
                  </button>
                ))}
              </div>

              {/* ── Contenu ─────────────────────────────────────────────── */}
              <div style={{flex:1,padding:'24px 28px',display:'flex',flexDirection:'column',gap:20}}>

                {/* ─ Overview ─ */}
                {activeTab==='overview'&&(<>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
                    <StatCard icon="👥" value={stats?.utilisateurs?.total??0}  label="Utilisateurs"        color="navy"    delay={0}/>
                    <StatCard icon="🚪" value={stats?.salles?.actives??0}       label="Salles actives"      color="blue"    delay={80}/>
                    <StatCard icon="📅" value={stats?.seances?.total??0}        label="Séances totales"     color="emerald" delay={160}/>
                    <StatCard icon="⏳" value={pending.length}                  label="Tuteurs en attente"  color="rose"    delay={240}/>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
                    <StatCard icon="📝" value={examens.length}                  label="Examens créés"       color="purple"  delay={320}/>
                    <StatCard icon="✅" value={tuteursActivite.filter(t=>t.activite==='ACTIF').length} label="Tuteurs actifs" color="emerald" delay={400}/>
                    <StatCard icon="⚠️" value={tuteursActivite.filter(t=>t.activite==='INACTIF').length} label="Tuteurs inactifs" color="rose" delay={480}/>
                  </div>
                  {/* Aperçu revenus */}
                  <div style={{background:C.white,borderRadius:24,padding:'28px 32px',border:`1px solid ${C.border}`,boxShadow:'0 4px 24px rgba(10,22,40,.07)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                      <h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:0}}>Revenus mensuels</h2>
                      <div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:20,background:`${C.success}12`,border:`1px solid ${C.success}30`}}>
                        <span style={{width:6,height:6,borderRadius:'50%',background:C.success,display:'inline-block',animation:'pulse 2s infinite'}}/>
                        <span style={{fontSize:10,fontWeight:700,color:C.success,textTransform:'uppercase',letterSpacing:1}}>Live</span>
                      </div>
                    </div>
                    <RevenueChart data={parMois}/>
                  </div>
                  {/* Tuteurs pending */}
                  {pending.length>0&&(
                    <Card title="Tuteurs en attente de validation" extra={<span style={{fontSize:11,fontWeight:700,padding:'2px 10px',borderRadius:20,background:`${C.error}12`,color:C.error,border:`1px solid ${C.error}30`}}>{pending.length}</span>}>
                      <div style={{display:'flex',flexDirection:'column',gap:10}}>
                        {pending.map(t=>(
                          <div key={t.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:14,background:C.ivory,border:`1px solid ${C.border}`}}>
                            <div style={{width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${C.navyMid},${C.navyLight})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#FFF',fontSize:14,flexShrink:0}}>{t.prenom?.[0]}{t.nom?.[0]}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>{t.prenom} {t.nom}</p>
                              <p style={{fontSize:11,color:C.textMuted,marginBottom:4}}>{t.email}</p>
                              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{(t.specialites||[]).map(s=>(<span key={s} style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:`${C.navyMid}10`,color:C.navyMid,border:`1px solid ${C.navyMid}20`}}>{s}</span>))}</div>
                            </div>
                            <div style={{display:'flex',gap:8,flexShrink:0}}>
                              <button onClick={()=>valider(t.id,true)} style={{padding:'8px 16px',borderRadius:10,background:`${C.success}12`,border:`1px solid ${C.success}40`,color:C.success,fontSize:12,fontWeight:700,cursor:'pointer'}}>✓ Valider</button>
                              <button onClick={()=>valider(t.id,false)} style={{padding:'8px 16px',borderRadius:10,background:`${C.error}10`,border:`1px solid ${C.error}30`,color:C.error,fontSize:12,fontWeight:700,cursor:'pointer'}}>✕ Refuser</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>)}

                {activeTab==='seances'&&<SeancesSection seancesStats={seancesStats}/>}
                {activeTab==='examens'&&<ExamensSection examens={examens}/>}
                {activeTab==='tuteurs'&&<TuteursActiviteSection tuteurs={tuteursActivite}/>}
                {activeTab==='revenus'&&<RevenusSection details={revenusDetails} parMois={parMois} topTuteurs={topTuteurs}/>}
              </div>
            </>
        }
      </div>
    </div>
  )
}