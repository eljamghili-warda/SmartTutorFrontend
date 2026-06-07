import React, { useEffect, useState, useRef, useCallback } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const C = {
  navy:'#0A1628', navyMid:'#162B55', navyLight:'#1E3A6E',
  blue:'#4A90E2', blueLight:'#74ACEC',
  gold:'#C5A059', goldLight:'#E8D5A3', goldDark:'#8B6914',
  ivory:'#F5F0E6', white:'#FFFFFF',
  success:'#059669', error:'#DC2626',
  text:'#0A1628', textSub:'#4A6080', textMuted:'#94A3B8',
  border:'#E8D5A3', escrow:'#7C3AED',
}

const MOIS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const fmtMois  = (s) => { if(!s) return ''; const [y,m]=s.split('-'); return `${MOIS_FR[parseInt(m)-1]} ${y.slice(2)}` }
const fmtMoney = (n) => { const v=parseFloat(n)||0; return v>=1000?`${(v/1000).toFixed(1)}k`:v.toFixed(0) }

const SEANCE_STATUTS = {
  EN_ATTENTE_PAIEMENT:{label:'En attente',   color:'#F59E0B',bg:'rgba(245,158,11,.12)'},
  CONFIRMEE:          {label:'Confirmée',    color:'#3B82F6',bg:'rgba(59,130,246,.12)'},
  EN_COURS:           {label:'En cours',     color:'#8B5CF6',bg:'rgba(139,92,246,.12)'},
  REALISEE:           {label:'Réalisée',     color:'#059669',bg:'rgba(5,150,105,.12)'},
  ANNULEE:            {label:'Annulée',      color:'#DC2626',bg:'rgba(220,38,38,.10)'},
  PLANIFIEE:          {label:'Planifiée',    color:'#F59E0B',bg:'rgba(245,158,11,.12)'},
}

// ── Count-up ─────────────────────────────────────────────────────────────────
function useCountUp(target,dur=1200){
  const [v,setV]=useState(0)
  useEffect(()=>{
    if(!target)return
    const s=performance.now(),e=parseFloat(target)||0
    const f=(now)=>{const p=Math.min((now-s)/dur,1),ease=1-Math.pow(1-p,3);setV(Math.round(e*ease));if(p<1)requestAnimationFrame(f)}
    requestAnimationFrame(f)
  },[target])
  return v
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({icon,value,label,sub,color,delay=0,suffix=''}) {
  const [vis,setVis]=useState(false)
  const anim=useCountUp(vis?value:0)
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t)},[delay])
  const MAP={
    navy:{g:`${C.navyMid},${C.navyLight}`,acc:C.gold,txt:'#fff'},
    gold:{g:`${C.gold},${C.goldDark}`,acc:C.ivory,txt:'#fff'},
    green:{g:'#065F46,#047857',acc:'#6EE7B7',txt:'#fff'},
    red:{g:'#991B1B,#DC2626',acc:'#FCA5A5',txt:'#fff'},
    blue:{g:`${C.navyLight},${C.blue}`,acc:C.blueLight,txt:'#fff'},
    purple:{g:'#4C1D95,#6D28D9',acc:'#C4B5FD',txt:'#fff'},
  }
  const m=MAP[color]||MAP.navy
  return(
    <div style={{background:`linear-gradient(135deg,${m.g})`,borderRadius:18,padding:'20px 22px',position:'relative',overflow:'hidden',
      boxShadow:`0 8px 28px rgba(0,0,0,0.18)`,border:`1px solid rgba(255,255,255,0.08)`,
      opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(14px)',
      transition:`opacity .5s ${delay}ms,transform .5s ${delay}ms`}}>
      <div style={{position:'absolute',right:-18,top:-18,width:90,height:90,borderRadius:'50%',background:`rgba(255,255,255,0.06)`}}/>
      <div style={{fontSize:24,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:28,fontWeight:900,color:'#fff',lineHeight:1}}>{anim.toLocaleString('fr-FR')}{suffix}</div>
      <div style={{fontSize:11,color:`rgba(255,255,255,0.65)`,marginTop:6,textTransform:'uppercase',letterSpacing:0.8,fontWeight:600}}>{label}</div>
      {sub&&<div style={{fontSize:10,color:`rgba(255,255,255,0.45)`,marginTop:2}}>{sub}</div>}
      <div style={{position:'absolute',bottom:0,left:0,height:3,width:'55%',background:`linear-gradient(90deg,${m.acc},transparent)`,borderRadius:'0 3px 0 0'}}/>
    </div>
  )
}

// ── Graphe courbe animé LIVE ─────────────────────────────────────────────────
function LiveRevenueChart({data}){
  const svgRef=useRef(null)
  const [prog,setProg]=useState(0)
  const [tip,setTip]=useState(null)
  const [hov,setHov]=useState(null)
  const animRef=useRef(null)

  useEffect(()=>{
    if(!data?.length)return
    setProg(0)
    const s=performance.now(),d=1600
    const f=(now)=>{const p=Math.min((now-s)/d,1),e=1-Math.pow(1-p,4);setProg(e);if(p<1)animRef.current=requestAnimationFrame(f)}
    animRef.current=requestAnimationFrame(f)
    return()=>cancelAnimationFrame(animRef.current)
  },[data])

  if(!data?.length) return(
    <div style={{height:240,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:10}}>
      <span style={{fontSize:36,opacity:.25}}>📈</span>
      <p style={{color:C.textMuted,fontSize:13}}>Aucune donnée mensuelle</p>
    </div>
  )

  const W=820,H=240,PL=56,PR=20,PT=20,PB=40
  const cW=W-PL-PR,cH=H-PT-PB
  const vols=data.map(d=>parseFloat(d.volume)||0)
  const coms=data.map(d=>parseFloat(d.commissions)||0)
  const tuts=data.map(d=>parseFloat(d.total_tuteurs||d.tuteurs)||0)
  const mx=Math.max(...vols,1)
  const nice=Math.ceil(mx/Math.pow(10,Math.floor(Math.log10(mx))))*Math.pow(10,Math.floor(Math.log10(mx)))
  const xS=data.length>1?cW/(data.length-1):cW
  const tx=(i)=>PL+i*xS
  const ty=(v)=>PT+cH-(v/nice)*cH

  const path=(pts)=>{
    if(pts.length<2)return''
    const p=pts.map(([x,y])=>({x,y}))
    let d=`M ${p[0].x} ${p[0].y}`
    for(let i=0;i<p.length-1;i++){
      const t=0.38,a=p[Math.max(0,i-1)],b=p[i],c=p[i+1],e=p[Math.min(p.length-1,i+2)]
      d+=` C ${b.x+(c.x-a.x)*t} ${b.y+(c.y-a.y)*t} ${c.x-(e.x-b.x)*t} ${c.y-(e.y-b.y)*t} ${c.x} ${c.y}`
    }
    return d
  }

  const n=Math.max(1,Math.ceil(data.length*prog))
  const vP=vols.slice(0,n).map((v,i)=>[tx(i),ty(v)])
  const cP=coms.slice(0,n).map((v,i)=>[tx(i),ty(v)])
  const tP=tuts.slice(0,n).map((v,i)=>[tx(i),ty(v)])

  const area=(pts)=>{if(!pts.length)return'';const l=pts[pts.length-1];return`${path(pts)} L ${l[0]} ${PT+cH} L ${PL} ${PT+cH} Z`}
  const grid=[0,.25,.5,.75,1].map(p=>({y:PT+cH-p*cH,v:(nice*p).toFixed(0)}))

  const onMove=useCallback((e)=>{
    if(!svgRef.current)return
    const r=svgRef.current.getBoundingClientRect()
    const sx=(e.clientX-r.left)*(W/r.width)
    const idx=Math.round((sx-PL)/xS)
    if(idx>=0&&idx<data.length){
      setHov(idx)
      setTip({x:e.clientX-r.left,y:e.clientY-r.top,d:data[idx],vol:vols[idx],com:coms[idx],tut:tuts[idx]})
    }
  },[vols,coms,tuts,data,xS])

  return(
    <div style={{position:'relative'}}>
      {/* Légende */}
      <div style={{display:'flex',gap:20,marginBottom:16,flexWrap:'wrap'}}>
        {[
          {col:C.navyMid,label:'Volume total',val:vols.reduce((a,b)=>a+b,0)},
          {col:C.gold,label:'Commissions (15%)',val:coms.reduce((a,b)=>a+b,0)},
          {col:C.success,label:'Versé tuteurs (85%)',val:tuts.reduce((a,b)=>a+b,0)},
        ].map(l=>(
          <div key={l.label} style={{display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:28,height:3,borderRadius:2,background:l.col}}/>
            <span style={{fontSize:12,color:C.textSub,fontWeight:600}}>{l.label}</span>
            <span style={{fontSize:12,fontWeight:800,color:l.col}}>{l.val.toLocaleString('fr-FR')} DH</span>
          </div>
        ))}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',overflow:'visible',cursor:'crosshair'}}
        onMouseMove={onMove} onMouseLeave={()=>{setHov(null);setTip(null)}}>
        <defs>
          <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.navyMid} stopOpacity=".22"/><stop offset="100%" stopColor={C.navyMid} stopOpacity=".01"/></linearGradient>
          <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity=".18"/><stop offset="100%" stopColor={C.gold} stopOpacity=".01"/></linearGradient>
          <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.success} stopOpacity=".14"/><stop offset="100%" stopColor={C.success} stopOpacity=".01"/></linearGradient>
          <filter id="gl"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <clipPath id="cl"><rect x={PL} y={0} width={cW*prog} height={H}/></clipPath>
        </defs>
        {grid.map((g,i)=>(
          <g key={i}>
            <line x1={PL} y1={g.y} x2={PL+cW} y2={g.y} stroke={C.border} strokeWidth={i===0?1.2:.6} strokeDasharray={i===0?'':'3 3'} opacity={.5}/>
            <text x={PL-6} y={g.y+4} textAnchor="end" fontSize={9.5} fill={C.textMuted}>{fmtMoney(g.v)}</text>
          </g>
        ))}
        <path d={area(vP)} fill="url(#gV)" clipPath="url(#cl)"/>
        <path d={area(cP)} fill="url(#gC)" clipPath="url(#cl)"/>
        <path d={area(tP)} fill="url(#gT)" clipPath="url(#cl)"/>
        {hov!==null&&<line x1={tx(hov)} y1={PT} x2={tx(hov)} y2={PT+cH} stroke={C.gold} strokeWidth={1.2} strokeDasharray="3 3" opacity={.6}/>}
        <path d={path(vP)} fill="none" stroke={C.navyMid} strokeWidth={2.2} strokeLinecap="round" filter="url(#gl)" clipPath="url(#cl)"/>
        <path d={path(cP)} fill="none" stroke={C.gold} strokeWidth={2} strokeLinecap="round" filter="url(#gl)" clipPath="url(#cl)"/>
        <path d={path(tP)} fill="none" stroke={C.success} strokeWidth={1.6} strokeLinecap="round" strokeDasharray="6 3" clipPath="url(#cl)"/>
        {prog>.96&&vols.map((v,i)=>{
          const h=hov===i
          return(<g key={i}>
            <circle cx={tx(i)} cy={ty(v)} r={h?6:3.5} fill={h?C.navyMid:'#fff'} stroke={C.navyMid} strokeWidth={2} style={{transition:'r .12s'}}/>
            <circle cx={tx(i)} cy={ty(coms[i])} r={h?5:3} fill={h?C.gold:'#fff'} stroke={C.gold} strokeWidth={1.8} style={{transition:'r .12s'}}/>
          </g>)
        })}
        {data.map((d,i)=>(
          <text key={i} x={tx(i)} y={H-4} textAnchor="middle" fontSize={9.5} fill={hov===i?C.navyMid:C.textMuted} fontWeight={hov===i?700:400}>{fmtMois(d.mois)}</text>
        ))}
      </svg>
      {/* Tooltip */}
      {tip&&prog>.96&&(
        <div style={{position:'absolute',left:Math.min(tip.x+12,620),top:Math.max(tip.y-100,0),
          background:C.navy,border:`1px solid ${C.gold}`,borderRadius:12,padding:'12px 16px',
          pointerEvents:'none',zIndex:20,boxShadow:'0 8px 24px rgba(0,0,0,0.4)',minWidth:160}}>
          <div style={{fontWeight:700,color:C.goldLight,marginBottom:8,fontSize:12}}>{fmtMois(tip.d.mois)}</div>
          {[
            {lbl:'Volume',col:'#A8C9F3',v:tip.vol},
            {lbl:'Commission',col:C.gold,v:tip.com},
            {lbl:'Tuteurs',col:'#6EE7B7',v:tip.tut},
          ].map(r=>(
            <div key={r.lbl} style={{display:'flex',justifyContent:'space-between',gap:16,marginBottom:4}}>
              <span style={{fontSize:11,color:r.col}}>{r.lbl}</span>
              <span style={{fontSize:11,fontWeight:700,color:'#fff'}}>{r.v.toLocaleString('fr-FR')} DH</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── AnimBar ───────────────────────────────────────────────────────────────────
function AnimBar({label,value,max,color,delay=0}){
  const [w,setW]=useState(0)
  useEffect(()=>{const t=setTimeout(()=>setW((value/(max||1))*100),delay+200);return()=>clearTimeout(t)},[value,max,delay])
  const pct=max>0?((value/max)*100).toFixed(1):0
  return(
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:12,color:C.textSub,fontWeight:600}}>{label}</span>
        <span style={{fontSize:12,fontWeight:800,color:C.text}}>{parseFloat(value).toLocaleString('fr-FR')} DH <span style={{color:C.textMuted,fontWeight:400}}>({pct}%)</span></span>
      </div>
      <div style={{height:7,borderRadius:10,background:`${C.border}60`,overflow:'hidden'}}>
        <div style={{height:'100%',borderRadius:10,background:color,width:`${w}%`,transition:`width 1s cubic-bezier(.4,0,.2,1) ${delay}ms`}}/>
      </div>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({title,children,extra,noPad}){
  return(
    <div style={{background:C.white,borderRadius:20,border:`1px solid ${C.border}`,boxShadow:'0 2px 10px rgba(10,22,40,.05)',overflow:'hidden'}}>
      {(title||extra)&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px 14px',borderBottom:`1px solid ${C.border}40`}}>
          {title&&<h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:0}}>{title}</h3>}
          {extra}
        </div>
      )}
      <div style={noPad?{}:{padding:'18px 22px'}}>{children}</div>
    </div>
  )
}

export default function AdminDashboard(){
  const [stats,          setStats]          = useState(null)
  const [revenus,        setRevenus]        = useState(null)
  const [revenusDetails, setRevenusDetails] = useState(null)
  const [pending,        setPending]        = useState([])
  const [examens,        setExamens]        = useState([])
  const [tuteursActivite,setTuteursActivite]= useState([])
  const [seancesStats,   setSeancesStats]   = useState(null)
  const [loading,        setLoading]        = useState(true)
  const { toasts, success, error } = useToast()

  useEffect(()=>{
    Promise.allSettled([
      adminAPI.getStats(),
      adminAPI.getTuteursPending(),
      adminAPI.getRevenus(),
      adminAPI.getExamens(),
      adminAPI.getTuteursActivite(),
      adminAPI.getSeancesStats(),
      adminAPI.getRevenusDetails(),
    ]).then(([s,p,r,e,t,ss,rd])=>{
      if(s.status==='fulfilled')  setStats(s.value.data)
      if(p.status==='fulfilled')  setPending(p.value.data)
      if(r.status==='fulfilled')  setRevenus(r.value.data)
      if(e.status==='fulfilled')  setExamens(e.value.data)
      if(t.status==='fulfilled')  setTuteursActivite(t.value.data)
      if(ss.status==='fulfilled') setSeancesStats(ss.value.data)
      if(rd.status==='fulfilled') setRevenusDetails(rd.value.data)
    }).finally(()=>setLoading(false))
  },[])

  const valider=async(id,accepte)=>{
    try{await adminAPI.validerTuteur(id,accepte);setPending(p=>p.filter(t=>t.id!==id));success(accepte?'Tuteur validé !':'Tuteur refusé.')}
    catch{error('Erreur')}
  }

  const parMois    = revenus?.parMois    || []
  const topTuteurs = revenus?.topTuteurs || []
  const d          = revenusDetails      || {}
  const enc=parseFloat(d.total_encaisse)||0
  const com=parseFloat(d.commissions_realisees)||0
  const att=parseFloat(d.commissions_en_attente)||0
  const esc=parseFloat(d.en_escrow)||0
  const ver=parseFloat(d.total_verse_tuteurs)||0
  const rem=parseFloat(d.total_rembourse)||0
  const parStatut=seancesStats?.parStatut||[]
  const recentes=seancesStats?.recentes||[]
  const tuteursActifs=tuteursActivite.filter(t=>t.activite==='ACTIF')

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:C.ivory}}>
      <Header title="Vue d'ensemble"/>
      <ToastContainer toasts={toasts}/>

      <div style={{flex:1,overflowY:'auto',padding:'24px 28px',display:'flex',flexDirection:'column',gap:22}}>
        {loading
          ? <div style={{display:'flex',justifyContent:'center',paddingTop:80}}><Spinner size="lg"/></div>
          : <>
            {/* ══ LIGNE 1 : KPI globaux ══ */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
              <KpiCard icon="👥" value={stats?.utilisateurs?.total??0}  label="Utilisateurs"       color="navy"   delay={0}/>
              <KpiCard icon="🚪" value={stats?.salles?.actives??0}       label="Salles actives"     color="blue"   delay={70}/>
              <KpiCard icon="📅" value={stats?.seances?.total??0}        label="Séances totales"    color="green"  delay={140}/>
              <KpiCard icon="⏳" value={pending.length}                  label="Tuteurs en attente" color="red"    delay={210}/>
            </div>

            {/* ══ LIGNE 2 : Revenus + Graphe (zone principale) ══ */}
            <div style={{background:C.white,borderRadius:22,border:`1px solid ${C.border}`,boxShadow:'0 4px 24px rgba(10,22,40,.07)',padding:'24px 28px'}}>
              {/* Header */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:0}}>💰 Revenus & Finances</h2>
                  <div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:20,background:'rgba(5,150,105,.1)',border:'1px solid rgba(5,150,105,.25)'}}>
                    <span style={{width:6,height:6,borderRadius:'50%',background:C.success,display:'inline-block',animation:'pulse 2s infinite'}}/>
                    <span style={{fontSize:9,fontWeight:700,color:C.success,textTransform:'uppercase',letterSpacing:1.2}}>Live</span>
                  </div>
                </div>
              </div>

              {/* 6 KPI revenus inline */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,marginBottom:22}}>
                {[
                  {lbl:'💰 Encaissé',         v:enc,  col:C.navyMid,  s:`${d.nb_paiements||0} paiements`},
                  {lbl:'🔒 En escrow',          v:esc,  col:C.escrow,   s:'En attente libération'},
                  {lbl:'✅ Commissions réal.', v:com,  col:C.success,  s:'SmartEdu (15%)'},
                  {lbl:'⏳ Commissions att.',  v:att,  col:'#D97706',  s:'En attente'},
                  {lbl:'👨‍🏫 Versé tuteurs',    v:ver,  col:'#0891B2',  s:'85% réalisées'},
                  {lbl:'↩️ Remboursés',         v:rem,  col:C.error,    s:`${d.nb_remboursements||0} annulations`},
                ].map(k=>(
                  <div key={k.lbl} style={{borderRadius:14,padding:'12px 14px',border:`1px solid ${C.border}`,background:C.ivory,textAlign:'center'}}>
                    <div style={{fontSize:9,fontWeight:700,color:C.textMuted,marginBottom:5,textTransform:'uppercase',letterSpacing:.7}}>{k.lbl}</div>
                    <div style={{fontSize:16,fontWeight:900,color:k.col}}>{enc>0?((k.v/enc)*100).toFixed(0)+'%':'—'}</div>
                    <div style={{fontSize:11,fontWeight:700,color:C.text,marginTop:2}}>{k.v.toLocaleString('fr-FR')} DH</div>
                    <div style={{fontSize:9,color:C.textMuted,marginTop:1}}>{k.s}</div>
                  </div>
                ))}
              </div>

              {/* Graphe */}
              <LiveRevenueChart data={parMois}/>

              {/* Barres répartition + Top tuteurs côte à côte */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginTop:22,paddingTop:20,borderTop:`1px solid ${C.border}40`}}>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <h4 style={{fontSize:12,fontWeight:700,color:C.textMuted,textTransform:'uppercase',letterSpacing:.8,margin:0}}>Répartition des flux</h4>
                  <AnimBar label="Volume encaissé"        value={enc} max={enc||1} color={`linear-gradient(90deg,${C.navyMid},${C.blue})`}   delay={200}/>
                  <AnimBar label="🔒 Escrow"              value={esc} max={enc||1} color={`linear-gradient(90deg,${C.escrow},#A78BFA)`}        delay={280}/>
                  <AnimBar label="✅ Versé tuteurs (85%)" value={ver} max={enc||1} color={`linear-gradient(90deg,${C.success},#34D399)`}        delay={360}/>
                  <AnimBar label="💛 Commission (15%)"    value={com+att} max={enc||1} color={`linear-gradient(90deg,${C.gold},${C.goldLight})`} delay={440}/>
                  <AnimBar label="↩️ Remboursements"      value={rem} max={enc||1} color={`linear-gradient(90deg,${C.error},#FCA5A5)`}         delay={520}/>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <h4 style={{fontSize:12,fontWeight:700,color:C.textMuted,textTransform:'uppercase',letterSpacing:.8,margin:0}}>🏆 Top tuteurs</h4>
                  {!topTuteurs?.length
                    ? <p style={{fontSize:13,color:C.textMuted,padding:'12px 0'}}>Aucun tuteur avec paiements</p>
                    : topTuteurs.slice(0,5).map((t,i)=>{
                        const g=parseFloat(t.total_gains)||0,mx=parseFloat(topTuteurs[0]?.total_gains)||1
                        return(
                          <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:26,height:26,borderRadius:'50%',background:i===0?`linear-gradient(135deg,${C.gold},${C.goldLight})`:i===1?`${C.navyMid}25`:`${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:i<3?C.navyMid:C.textMuted,flexShrink:0}}>
                              {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                            </div>
                            <div style={{flex:1,overflow:'hidden'}}>
                              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                                <span style={{fontSize:12,fontWeight:600,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.prenom} {t.nom}</span>
                                <span style={{fontSize:11,fontWeight:700,color:C.goldDark,flexShrink:0,marginLeft:8}}>{g.toLocaleString('fr-FR')} DH</span>
                              </div>
                              <div style={{height:4,borderRadius:4,background:`${C.border}50`,overflow:'hidden'}}>
                                <div style={{height:'100%',borderRadius:4,background:i===0?`linear-gradient(90deg,${C.gold},${C.goldLight})`:`linear-gradient(90deg,${C.navyMid},${C.blue})`,width:`${(g/mx)*100}%`,transition:'width 1s ease .5s'}}/>
                              </div>
                            </div>
                          </div>
                        )
                      })
                  }
                </div>
              </div>
            </div>

            {/* ══ LIGNE 3 : Séances + Tuteurs pending ══ */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

              {/* Séances statuts */}
              <Card title="📅 Séances par statut">
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
                  {parStatut.map(s=>{
                    const cfg=SEANCE_STATUTS[s.statut]||{label:s.statut,color:C.textMuted,bg:'rgba(148,163,184,.1)'}
                    return(
                      <div key={s.statut} style={{borderRadius:12,padding:'10px 12px',background:cfg.bg,border:`1px solid ${cfg.color}25`}}>
                        <div style={{fontSize:18,fontWeight:900,color:cfg.color}}>{s.nb}</div>
                        <div style={{fontSize:10,color:cfg.color,fontWeight:600,marginTop:1}}>{cfg.label}</div>
                        {parseFloat(s.montant)>0&&<div style={{fontSize:9,color:C.textMuted,marginTop:1}}>{parseFloat(s.montant).toLocaleString('fr-FR')} DH</div>}
                      </div>
                    )
                  })}
                  {!parStatut.length&&<p style={{gridColumn:'1/-1',textAlign:'center',color:C.textMuted,fontSize:13,padding:'16px 0'}}>Aucune séance</p>}
                </div>
                {recentes.slice(0,5).map(s=>{
                  const cfg=SEANCE_STATUTS[s.statut]||{label:s.statut,color:C.textMuted,bg:'rgba(148,163,184,.08)'}
                  return(
                    <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:10,background:C.ivory,border:`1px solid ${C.border}`,marginBottom:6}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:cfg.color,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:11,fontWeight:600,color:C.text,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.titre}</p>
                        <p style={{fontSize:10,color:C.textMuted,margin:0}}>{s.tuteur_prenom} {s.tuteur_nom}</p>
                      </div>
                      <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,background:cfg.bg,color:cfg.color,flexShrink:0}}>{cfg.label}</span>
                    </div>
                  )
                })}
              </Card>

              {/* Tuteurs pending + actifs */}
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {pending.length>0&&(
                  <Card title="⏳ Validation tuteurs" extra={<span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:20,background:`${C.error}12`,color:C.error,border:`1px solid ${C.error}30`}}>{pending.length}</span>}>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {pending.slice(0,3).map(t=>(
                        <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,background:C.ivory,border:`1px solid ${C.border}`}}>
                          <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${C.navyMid},${C.navyLight})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:12,flexShrink:0}}>{t.prenom?.[0]}{t.nom?.[0]}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:12,fontWeight:700,color:C.text,margin:0}}>{t.prenom} {t.nom}</p>
                            <p style={{fontSize:10,color:C.textMuted,margin:0}}>{t.email}</p>
                          </div>
                          <div style={{display:'flex',gap:6,flexShrink:0}}>
                            <button onClick={()=>valider(t.id,true)} style={{padding:'5px 11px',borderRadius:8,background:`${C.success}12`,border:`1px solid ${C.success}40`,color:C.success,fontSize:11,fontWeight:700,cursor:'pointer'}}>✓</button>
                            <button onClick={()=>valider(t.id,false)} style={{padding:'5px 11px',borderRadius:8,background:`${C.error}10`,border:`1px solid ${C.error}30`,color:C.error,fontSize:11,fontWeight:700,cursor:'pointer'}}>✕</button>
                          </div>
                        </div>
                      ))}
                      {pending.length===0&&<p style={{textAlign:'center',color:C.textMuted,fontSize:13,padding:'8px 0'}}>✅ Aucun tuteur en attente</p>}
                    </div>
                  </Card>
                )}

                <Card title="👨‍🏫 Activité tuteurs">
                  <div style={{display:'flex',gap:10,marginBottom:12}}>
                    <div style={{flex:1,borderRadius:12,padding:'12px',background:'rgba(5,150,105,.08)',border:'1px solid rgba(5,150,105,.2)',textAlign:'center'}}>
                      <div style={{fontSize:22,fontWeight:900,color:C.success}}>{tuteursActifs.length}</div>
                      <div style={{fontSize:10,color:C.success,fontWeight:600}}>Actifs</div>
                    </div>
                    <div style={{flex:1,borderRadius:12,padding:'12px',background:'rgba(220,38,38,.07)',border:'1px solid rgba(220,38,38,.18)',textAlign:'center'}}>
                      <div style={{fontSize:22,fontWeight:900,color:C.error}}>{tuteursActivite.filter(t=>t.activite==='INACTIF').length}</div>
                      <div style={{fontSize:10,color:C.error,fontWeight:600}}>Inactifs</div>
                    </div>
                    <div style={{flex:1,borderRadius:12,padding:'12px',background:`${C.navyMid}10`,border:`1px solid ${C.navyMid}25`,textAlign:'center'}}>
                      <div style={{fontSize:22,fontWeight:900,color:C.navyMid}}>{examens.length}</div>
                      <div style={{fontSize:10,color:C.navyMid,fontWeight:600}}>Examens</div>
                    </div>
                  </div>
                  {tuteursActifs.slice(0,4).map(t=>(
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:10,background:C.ivory,border:`1px solid ${C.border}`,marginBottom:6}}>
                      <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${C.navyMid},${C.navyLight})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:11,flexShrink:0}}>{t.prenom?.[0]}{t.nom?.[0]}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:11,fontWeight:700,color:C.text,margin:0}}>{t.prenom} {t.nom}</p>
                        <p style={{fontSize:10,color:C.textMuted,margin:0}}>✅ {t.nb_realisees} réalisées · 📅 {t.nb_disponibilites} dispos{t.note_moyenne>0?` · ⭐${parseFloat(t.note_moyenne).toFixed(1)}`:''}</p>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </>
        }
      </div>
    </div>
  )
}