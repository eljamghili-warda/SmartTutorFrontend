import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── THEME SMARTEDU PROFESSIONNEL ─────────────────────────────────────────────
const C = {
  navy:    '#1A3A5C',     // Bleu profond
  navyMid: '#2C5F8A',     // Bleu moyen
  navyLight:'#4A90E2',    // Bleu ciel
  gold:    '#C5A059',     // Doré principal
  goldLight:'#E8D5A3',    // Doré clair
  goldDark:'#8B6914',     // Marron doré
  ivory:   '#F5F0E6',     // Ivoire
  ivoryDark:'#EDE5D4',    // Ivoire foncé
  text:    '#1A3A5C',
  muted:   '#6B7B8D',
  white:   '#FFFFFF',
  success: '#2E7D32',
  error:   '#C62828',
}

const SOCIAL = [
  { name:'LinkedIn',  icon:'in',  href:'https://linkedin.com',  color:'#0A66C2', bg:'rgba(10,102,194,0.1)' },
  { name:'Instagram', icon:'IG',  href:'https://instagram.com', color:'#E1306C', bg:'rgba(225,48,108,0.1)' },
  { name:'Facebook',  icon:'f',   href:'https://facebook.com',  color:'#1877F2', bg:'rgba(24,119,242,0.1)' },
  { name:'Twitter/X', icon:'𝕏',  href:'https://x.com',         color:'#000000', bg:'rgba(0,0,0,0.07)' },
  { name:'YouTube',   icon:'▶',   href:'https://youtube.com',   color:'#FF0000', bg:'rgba(255,0,0,0.08)' },
]

const FEATURES = [
  { icon:'🎯', title:'Tuteurs certifiés',    desc:'Chaque tuteur est évalué et validé par notre équipe avant d\'accéder à la plateforme.' },
  { icon:'📅', title:'Flexibilité totale',    desc:'Planifiez vos séances selon vos disponibilités, à tout moment de la journée.' },
  { icon:'🏆', title:'Certificats officiels', desc:'Obtenez des certificats téléchargeables et partageables après chaque formation.' },
  { icon:'💬', title:'Salles interactives',   desc:'Sessions en direct avec tableau blanc, partage d\'écran et chat intégré.' },
  { icon:'📊', title:'Suivi de progression',  desc:'Tableaux de bord personnalisés pour visualiser votre évolution en temps réel.' },
  { icon:'💳', title:'Paiement sécurisé',     desc:'Transactions protégées, remboursement garanti si la séance ne vous satisfait pas.' },
]

const STATS = [
  { value:'2 500+', label:'Étudiants actifs' },
  { value:'320+',   label:'Tuteurs experts' },
  { value:'15 000+',label:'Séances réalisées' },
  { value:'98%',    label:'Satisfaction' },
]

const NAV = ['Accueil', 'Fonctionnalités', 'Statistiques', 'Tuteurs', 'Contact']

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function SocialBtn({ s }) {
  const [hover, setHover] = useState(false)
  return (
    <a href={s.href} target="_blank" rel="noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        width:42, height:42, borderRadius:12,
        background: hover ? s.bg : 'rgba(255,255,255,0.08)',
        border: hover ? `1.5px solid ${s.color}40` : '1.5px solid rgba(255,255,255,0.12)',
        color: hover ? s.color : 'rgba(255,255,255,0.7)',
        fontWeight:800, fontSize:14,
        textDecoration:'none',
        transition:'all .2s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}>
      {s.icon}
    </a>
  )
}

function FeatureCard({ f, i }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? C.white : 'rgba(255,255,255,0.8)',
        border: hover ? `1.5px solid ${C.gold}` : `1.5px solid ${C.goldLight}`,
        borderRadius:20,
        padding:'28px 24px',
        transition:'all .3s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
        transform: hover ? 'translateY(-6px)' : 'none',
        boxShadow: hover ? `0 16px 40px rgba(26,58,92,0.12)` : '0 4px 12px rgba(26,58,92,0.05)',
        cursor:'default',
        animationDelay: `${i * 0.08}s`,
      }}>
      <div style={{
        width:56, height:56, borderRadius:16,
        background: hover ? `linear-gradient(135deg,${C.navy},${C.navyMid})` : C.ivory,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:26, marginBottom:16,
        transition:'all .3s',
        boxShadow: hover ? `0 8px 20px rgba(26,58,92,0.2)` : 'none',
      }}>
        {f.icon}
      </div>
      <h3 style={{ fontSize:18, fontWeight:800, color:C.navy, marginBottom:10 }}>{f.title}</h3>
      <p style={{ fontSize:14, color:C.muted, lineHeight:1.65, margin:0 }}>{f.desc}</p>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [contactForm, setContactForm] = useState({ nom:'', email:'', message:'' })
  const [sent, setSent] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const setField = k => e => setContactForm(f => ({ ...f, [k]: e.target.value }))

  const handleContact = e => {
    e.preventDefault()
    setSent(true)
    setContactForm({ nom:'', email:'', message:'' })
    setTimeout(() => setSent(false), 4000)
  }

  const scrollTo = id => {
    document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' })
    setMobileMenu(false)
  }

  return (
    <div style={{ fontFamily:"'Inter', 'DM Sans', sans-serif", background:C.ivory, color:C.text, overflowX:'hidden' }}>

      {/* ══ NAVBAR PROFESSIONNELLE ═══════════════════════════════════════════════ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrolled ? 'rgba(245,240,230,0.98)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.goldLight}` : 'none',
        transition:'all .3s',
        padding:'0 40px',
        height:72,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={() => scrollTo('accueil')}>
          <img src="/logo.png" alt="SmartEdu"
            style={{ height:100, filter: scrolled ? 'none' : 'brightness(0) invert(1)', transition:'all .3s' }}
            onError={e => {
              e.target.style.display='none'
              e.target.nextSibling.style.display='block'
            }}
          />
          <span style={{ display:'none', fontWeight:800, fontSize:20, color: scrolled ? C.navy : C.white, letterSpacing:'-0.5px' }}>SmartEdu</span>
        </div>

        {/* Desktop links */}
        <div style={{ display:'flex', gap:32, alignItems:'center' }}>
          {NAV.map(n => (
            <button key={n} onClick={() => scrollTo(n.toLowerCase().replace(/[éèêë]/g, 'e').replace(/[îï]/g, 'i'))}
              style={{
                background:'none', border:'none', cursor:'pointer',
                fontSize:14, fontWeight:500,
                color: scrolled ? C.muted : 'rgba(255,255,255,0.85)',
                transition:'color .2s',
                padding:0,
                letterSpacing:'0.3px',
              }}
              onMouseEnter={e => e.target.style.color = scrolled ? C.gold : C.white}
              onMouseLeave={e => e.target.style.color = scrolled ? C.muted : 'rgba(255,255,255,0.85)'}
            >{n}</button>
          ))}
          <div style={{ width:1, height:30, background: scrolled ? C.goldLight : 'rgba(255,255,255,0.2)' }} />
          <button onClick={() => navigate('/auth')}
            style={{
              padding:'10px 24px', borderRadius:40, border:'none',
              background: scrolled ? `linear-gradient(135deg,${C.navy},${C.navyMid})` : 'rgba(255,255,255,0.15)',
              backdropFilter:'blur(8px)',
              color:C.white, fontWeight:600, fontSize:14, cursor:'pointer',
              border: scrolled ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
              transition:'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(197,160,89,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}
          >
            🔑 Connexion
          </button>
        </div>
      </nav>

      {/* ══ HERO SECTION MODERNISÉE ══════════════════════════════════════════════ */}
      <section id="accueil" style={{
        minHeight:'100vh',
        background:`radial-gradient(ellipse at 30% 40%, ${C.navyLight}20, ${C.navy} 80%, #0F2540 100%)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative', overflow:'hidden',
        padding:'120px 32px 80px',
      }}>
        {/* Cercles décoratifs */}
        <div style={{ position:'absolute', top:-150, right:-150, width:600, height:600, background:'rgba(197,160,89,0.06)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:-100, left:-100, width:400, height:400, background:'rgba(197,160,89,0.04)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:'20%', left:'10%', width:120, height:120, background:'rgba(255,255,255,0.03)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:'15%', right:'8%', width:180, height:180, background:'rgba(197,160,89,0.05)', borderRadius:'50%' }} />

        <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:850 }}>
          {/* Badge */}
          <div style={{
            display:'inline-block',
            background:'rgba(197,160,89,0.15)',
            border:`1px solid ${C.goldLight}`,
            borderRadius:40,
            padding:'6px 18px',
            marginBottom:28,
          }}>
            <span style={{ fontSize:12, fontWeight:600, color:C.goldLight, letterSpacing:1 }}>✨ Plateforme N°1 au Maroc</span>
          </div>

          {/* Logo ou titre */}
         <div style={{ display:'flex', justifyContent:'center', alignItems:'center', width:'100%', marginBottom:24 }}>
  <img src="/logo.png" alt="SmartEdu"
    style={{ 
      maxWidth:350, 
      width:'100%', 
      height:'auto',
      display:'block',
      margin:'0 auto',
      filter:'drop-shadow(0 8px 32px rgba(0,0,0,0.25))' 
    }}
    onError={e => e.target.style.display='none'}
  />
</div>

          <h1 style={{
            fontSize:52, fontWeight:800, color:C.white, marginBottom:20, letterSpacing:'-1.5px', lineHeight:1.2,
          }}>
            Apprenez avec les{' '}
            <span style={{ color:C.gold, borderBottom:`3px solid ${C.gold}`, display:'inline-block' }}>meilleurs experts</span>
          </h1>

          <p style={{ fontSize:18, color:'rgba(255,255,255,0.8)', lineHeight:1.7, marginBottom:40, maxWidth:600, margin:'0 auto 40px' }}>
            La plateforme marocaine qui connecte étudiants et tuteurs experts pour une expérience d'apprentissage 100% personnalisée.
          </p>

          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => navigate('/auth')}
              style={{
                padding:'14px 40px', borderRadius:50, border:'none',
                background:`linear-gradient(135deg,${C.gold},${C.goldDark})`,
                color:C.navy, fontWeight:700, fontSize:15, cursor:'pointer',
                boxShadow:`0 8px 28px rgba(197,160,89,0.4)`,
                transition:'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(197,160,89,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 28px rgba(197,160,89,0.4)' }}
            >
              🚀 Commencer gratuitement
            </button>
            <button onClick={() => scrollTo('fonctionnalites')}
              style={{
                padding:'14px 36px', borderRadius:50,
                border:'1.5px solid rgba(255,255,255,0.4)',
                background:'rgba(255,255,255,0.1)',
                backdropFilter:'blur(10px)',
                color:C.white, fontWeight:600, fontSize:15, cursor:'pointer',
                transition:'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.2)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.4)' }}
            >
              Découvrir ↓
            </button>
          </div>

          {/* Scroll indicator */}
          <div style={{ marginTop:70, display:'flex', flexDirection:'column', alignItems:'center', gap:8, opacity:0.6 }}>
            <span style={{ fontSize:12, color:C.goldLight, letterSpacing:2 }}>SCROLL</span>
            <div style={{ width:1, height:50, background:'rgba(255,255,255,0.4)', animation:'scrollPulse 2s infinite' }} />
          </div>
        </div>
      </section>

      {/* ══ STATS AVEC DESIGN MODERNE ════════════════════════════════════════════ */}
      <section id="statistiques" style={{ background:C.white, padding:'70px 32px', borderBottom:`1px solid ${C.goldLight}` }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:32, textAlign:'center' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ position:'relative' }}>
              <div style={{ fontSize:42, fontWeight:900, color:C.navy, fontFamily:'Syne, sans-serif', marginBottom:8 }}>{s.value}</div>
              <div style={{ fontSize:14, color:C.muted, fontWeight:600 }}>{s.label}</div>
              <div style={{ width:40, height:2, background:C.goldLight, margin:'12px auto 0' }} />
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES EN GRILLE ═══════════════════════════════════════════════════ */}
      <section id="fonctionnalites" style={{ padding:'100px 32px', background:C.ivory }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.gold, textTransform:'uppercase', letterSpacing:3 }}>Pourquoi SmartEdu ?</span>
            <h2 style={{ fontSize:40, fontWeight:900, color:C.navy, margin:'12px 0 16px', fontFamily:'Syne, sans-serif', letterSpacing:'-1px' }}>Tout ce qu'il vous faut</h2>
            <div style={{ width:60, height:3, background:C.gold, margin:'0 auto 16px' }} />
            <p style={{ fontSize:16, color:C.muted, maxWidth:550, margin:'0 auto' }}>Une plateforme complète conçue pour maximiser votre réussite académique.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:24 }}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} f={f} i={i} />)}
          </div>
        </div>
      </section>

      {/* ══ TUTEURS CTA AMÉLIORÉ ═════════════════════════════════════════════════ */}
      <section id="tuteurs" style={{
        background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`,
        padding:'100px 32px',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:350, height:350, background:'rgba(197,160,89,0.06)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:250, height:250, background:'rgba(197,160,89,0.04)', borderRadius:'50%' }} />
        
        <div style={{ maxWidth:800, margin:'0 auto', textAlign:'center', position:'relative', zIndex:1 }}>
          <div style={{
            display:'inline-block',
            background:'rgba(197,160,89,0.15)',
            border:`1px solid ${C.goldLight}`,
            borderRadius:40,
            padding:'6px 20px',
            marginBottom:24,
          }}>
            <span style={{ fontSize:12, fontWeight:600, color:C.goldLight }}>👨‍🏫 Rejoindre l'équipe</span>
          </div>
          
          <h2 style={{ fontSize:38, fontWeight:900, color:C.white, marginBottom:20, fontFamily:'Syne, sans-serif', letterSpacing:'-1px' }}>
            Devenez tuteur sur SmartEdu
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.8)', lineHeight:1.7, marginBottom:32 }}>
            Partagez votre expertise, fixez vos tarifs et gérez votre emploi du temps en toute liberté. 
            Rejoignez plus de 320 tuteurs qui gagnent un revenu supplémentaire sur notre plateforme.
          </p>
          
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:40 }}>
            {['🧮 Mathématiques','⚗️ Physique-Chimie','💻 Informatique','📐 Génie civil','📊 Économie','📚 Langues'].map(m => (
              <span key={m} style={{
                padding:'8px 18px', borderRadius:30,
                background:'rgba(197,160,89,0.12)',
                border:'1px solid rgba(197,160,89,0.3)',
                color:C.goldLight, fontSize:13, fontWeight:500,
              }}>{m}</span>
            ))}
          </div>
          
          <button onClick={() => navigate('/auth')}
            style={{
              padding:'14px 42px', borderRadius:50, border:'none',
              background:`linear-gradient(135deg,${C.gold},#D4B06A)`,
              color:C.navy, fontWeight:700, fontSize:16, cursor:'pointer',
              boxShadow:`0 8px 28px rgba(197,160,89,0.35)`,
              transition:'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(197,160,89,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 28px rgba(197,160,89,0.35)' }}
          >
            👨‍🏫 S'inscrire comme tuteur
          </button>
        </div>
      </section>

      {/* ══ CONTACT AVEC DESIGN MODERNE ══════════════════════════════════════════ */}
      <section id="contact" style={{ padding:'100px 32px', background:C.ivory }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'start' }}>

          {/* Infos contact */}
          <div>
            <span style={{ fontSize:13, fontWeight:700, color:C.gold, textTransform:'uppercase', letterSpacing:3 }}>Nous contacter</span>
            <h2 style={{ fontSize:38, fontWeight:900, color:C.navy, margin:'12px 0 16px', fontFamily:'Syne, sans-serif', letterSpacing:'-1px' }}>
              Une question ? <br />On est là. 👋
            </h2>
            <p style={{ fontSize:15, color:C.muted, lineHeight:1.7, marginBottom:40 }}>
              Notre équipe répond dans les 24 heures. N'hésitez pas à nous écrire pour toute question sur l'inscription, les séances ou les paiements.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:20, marginBottom:48 }}>
              {[
                { icon:'📧', label:'Email général',    value:'contact@smartedu.ma',     href:'mailto:contact@smartedu.ma' },
                { icon:'🎓', label:'Support étudiants',value:'etudiant@smartedu.ma',     href:'mailto:etudiant@smartedu.ma' },
                { icon:'👨‍🏫',label:'Devenir tuteur',  value:'tuteurs@smartedu.ma',      href:'mailto:tuteurs@smartedu.ma' },
                { icon:'📍', label:'Adresse',           value:'Fès, Maroc',               href:null },
              ].map(c => (
                <div key={c.label} style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{
                    width:48, height:48, borderRadius:16,
                    background:`linear-gradient(135deg,${C.navy},${C.navyMid})`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:22, flexShrink:0,
                    boxShadow:'0 4px 12px rgba(26,58,92,0.15)',
                  }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:1 }}>{c.label}</div>
                    {c.href
                      ? <a href={c.href} style={{ fontSize:15, fontWeight:600, color:C.navy, textDecoration:'none', transition:'color .2s' }}
                          onMouseEnter={e => e.target.style.color=C.gold}
                          onMouseLeave={e => e.target.style.color=C.navy}
                        >{c.value}</a>
                      : <span style={{ fontSize:15, fontWeight:600, color:C.navy }}>{c.value}</span>
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* Réseaux sociaux */}
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:1.5, marginBottom:16 }}>
                Suivez-nous
              </p>
              <div style={{ display:'flex', gap:12 }}>
                {SOCIAL.map(s => (
                  <a key={s.name} href={s.href} target="_blank" rel="noreferrer" title={s.name}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center',
                      width:44, height:44, borderRadius:14,
                      background:s.bg,
                      border:`1.5px solid ${s.color}30`,
                      color:s.color, fontWeight:800, fontSize:15,
                      textDecoration:'none',
                      transition:'all .2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 8px 20px ${s.color}30` }}
                    onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}
                  >{s.icon}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div style={{ 
            background:C.white, 
            borderRadius:24, 
            border:`1.5px solid ${C.goldLight}`, 
            padding:'36px 32px', 
            boxShadow:'0 8px 32px rgba(26,58,92,0.08)',
            transition:'transform .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform='none'}
          >
            {sent ? (
              <div style={{ textAlign:'center', padding:'50px 0' }}>
                <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
                <h3 style={{ fontSize:20, fontWeight:800, color:C.navy, marginBottom:10 }}>Message envoyé !</h3>
                <p style={{ fontSize:14, color:C.muted }}>Nous vous répondrons sous 24h.</p>
              </div>
            ) : (
              <form onSubmit={handleContact} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                <div>
                  <h3 style={{ fontSize:22, fontWeight:800, color:C.navy, marginBottom:6 }}>Envoyer un message</h3>
                  <p style={{ fontSize:14, color:C.muted }}>Remplissez le formulaire et on vous répond rapidement.</p>
                </div>
                {[
                  { key:'nom',     label:'Votre nom',     type:'text',  placeholder:'Mohamed Alami' },
                  { key:'email',   label:'Votre email',   type:'email', placeholder:'vous@exemple.com' },
                ].map(fi => (
                  <div key={fi.key}>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>{fi.label}</label>
                    <input type={fi.type} required placeholder={fi.placeholder}
                      value={contactForm[fi.key]} onChange={setField(fi.key)}
                      style={{ background:C.white, border:`1.5px solid ${C.goldLight}`, color:C.navy, borderRadius:12, padding:'12px 16px', width:'100%', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'all .2s' }}
                      onFocus={e => { e.target.style.borderColor=C.gold; e.target.style.boxShadow=`0 0 0 3px rgba(197,160,89,0.15)` }}
                      onBlur={e  => { e.target.style.borderColor=C.goldLight; e.target.style.boxShadow='none' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>Votre message</label>
                  <textarea required rows={5} placeholder="Décrivez votre demande..."
                    value={contactForm.message} onChange={setField('message')}
                    style={{ background:C.white, border:`1.5px solid ${C.goldLight}`, color:C.navy, borderRadius:12, padding:'12px 16px', width:'100%', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', resize:'vertical', transition:'all .2s' }}
                    onFocus={e => { e.target.style.borderColor=C.gold; e.target.style.boxShadow=`0 0 0 3px rgba(197,160,89,0.15)` }}
                    onBlur={e  => { e.target.style.borderColor=C.goldLight; e.target.style.boxShadow='none' }}
                  />
                </div>
                <button type="submit"
                  style={{
                    padding:'14px', borderRadius:40, border:'none',
                    background:`linear-gradient(135deg,${C.navy},${C.navyMid})`,
                    color:C.white, fontWeight:700, fontSize:15, cursor:'pointer',
                    boxShadow:`0 4px 16px rgba(26,58,92,0.25)`,
                    transition:'all .2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(26,58,92,0.35)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 16px rgba(26,58,92,0.25)' }}
                >
                  📨 Envoyer le message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ══ FOOTER PROFESSIONNEL ══════════════════════════════════════════════════ */}
      <footer style={{
        background:`linear-gradient(135deg, ${C.navy} 0%, #0F2540 100%)`,
        padding:'64px 40px 0',
        color:'rgba(255,255,255,0.7)',
      }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1.5fr', gap:48, marginBottom:56 }}>

            {/* Colonne marque */}
            <div>
              <img src="/logo.png" alt="SmartEdu"
                style={{ maxWidth:160, marginBottom:20, filter:'brightness(0) invert(1) opacity(0.9)' }}
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }}
              />
              <span style={{ display:'none', fontSize:24, fontWeight:900, color:C.white, letterSpacing:'-0.5px' }}>SmartEdu</span>
              <p style={{ fontSize:13.5, lineHeight:1.7, color:'rgba(255,255,255,0.6)', marginBottom:24 }}>
                Plateforme marocaine de tutorat collaboratif. Connectez-vous avec les meilleurs tuteurs et progressez à votre rythme.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                {SOCIAL.map(s => <SocialBtn key={s.name} s={s} />)}
              </div>
            </div>

            {/* Plateforme */}
            <div>
              <h4 style={{ fontSize:14, fontWeight:700, color:C.white, textTransform:'uppercase', letterSpacing:1.5, marginBottom:20 }}>Plateforme</h4>
              {['Fonctionnalités','Tuteurs','Examens','Certificats','Tarifs'].map(l => (
                <div key={l} style={{ marginBottom:12 }}>
                  <button onClick={() => navigate('/auth')}
                    style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', fontSize:13.5, cursor:'pointer', padding:0, textAlign:'left', transition:'color .2s' }}
                    onMouseEnter={e => e.target.style.color=C.goldLight}
                    onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.6)'}
                  >{l}</button>
                </div>
              ))}
            </div>

            {/* Support */}
            <div>
              <h4 style={{ fontSize:14, fontWeight:700, color:C.white, textTransform:'uppercase', letterSpacing:1.5, marginBottom:20 }}>Support</h4>
              {[
                { label:'Centre d\'aide',       href:null },
                { label:'Nous contacter',       href:'mailto:contact@smartedu.ma' },
                { label:'Signaler un problème', href:'mailto:support@smartedu.ma' },
                { label:'Politique de confidentialité', href:null },
                { label:'CGU',                  href:null },
              ].map(l => (
                <div key={l.label} style={{ marginBottom:12 }}>
                  {l.href
                    ? <a href={l.href} style={{ color:'rgba(255,255,255,0.6)', fontSize:13.5, textDecoration:'none', transition:'color .2s' }}
                        onMouseEnter={e => e.target.style.color=C.goldLight}
                        onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.6)'}
                      >{l.label}</a>
                    : <span style={{ color:'rgba(255,255,255,0.6)', fontSize:13.5, cursor:'default' }}>{l.label}</span>
                  }
                </div>
              ))}
            </div>

            {/* Contact rapide */}
            <div>
              <h4 style={{ fontSize:14, fontWeight:700, color:C.white, textTransform:'uppercase', letterSpacing:1.5, marginBottom:20 }}>Contact</h4>
              {[
                { icon:'📧', text:'contact@smartedu.ma', href:'mailto:contact@smartedu.ma' },
                { icon:'🎓', text:'etudiant@smartedu.ma', href:'mailto:etudiant@smartedu.ma' },
                { icon:'👨‍🏫',text:'tuteurs@smartedu.ma', href:'mailto:tuteurs@smartedu.ma' },
                { icon:'📍', text:'Fès, Maroc', href:null },
              ].map(c => (
                <div key={c.text} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <span style={{ fontSize:16 }}>{c.icon}</span>
                  {c.href
                    ? <a href={c.href} style={{ color:'rgba(255,255,255,0.6)', fontSize:13, textDecoration:'none', transition:'color .2s' }}
                        onMouseEnter={e => e.target.style.color=C.goldLight}
                        onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.6)'}
                      >{c.text}</a>
                    : <span style={{ color:'rgba(255,255,255,0.6)', fontSize:13 }}>{c.text}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop:'1px solid rgba(255,255,255,0.08)',
            padding:'24px 0',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            flexWrap:'wrap', gap:16,
          }}>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>
              © 2026 SmartEdu — Tous droits réservés. Plateforme de tutorat collaboratif au Maroc.
            </p>
            <div style={{ display:'flex', gap:24 }}>
              {['Confidentialité','Conditions d\'utilisation','Cookies'].map(l => (
                <span key={l} style={{ fontSize:12, color:'rgba(255,255,255,0.35)', cursor:'pointer', transition:'color .2s' }}
                  onMouseEnter={e => e.target.style.color='rgba(255,255,255,0.6)'}
                  onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.35)'}
                >{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Animation keyframes */}
      <style>{`
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  )
}