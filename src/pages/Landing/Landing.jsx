import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  navy:    '#1A3A5C',
  navyMid: '#2C5F8A',
  navyLight:'#3A7CB5',
  gold:    '#C5A059',
  goldLight:'#E8D5A3',
  ivory:   '#F5F0E6',
  ivoryDark:'#EDE5D4',
  text:    '#1A3A5C',
  muted:   '#6B7B8D',
  white:   '#FFFFFF',
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

const NAV = ['Fonctionnalités','Statistiques','Tuteurs','Contact']

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
        transition:'all .2s',
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
        background: hover ? C.white : 'rgba(255,255,255,0.7)',
        border: hover ? `1.5px solid ${C.gold}60` : `1.5px solid ${C.goldLight}`,
        borderRadius:18,
        padding:'28px 24px',
        transition:'all .25s',
        transform: hover ? 'translateY(-4px)' : 'none',
        boxShadow: hover ? `0 12px 32px rgba(26,58,92,0.12)` : '0 2px 8px rgba(26,58,92,0.05)',
        cursor:'default',
        animationDelay: `${i * 0.08}s`,
      }}>
      <div style={{
        width:52, height:52, borderRadius:14,
        background: hover ? `linear-gradient(135deg,${C.navy},${C.navyMid})` : C.ivory,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:24, marginBottom:16,
        transition:'all .25s',
        boxShadow: hover ? `0 6px 16px rgba(26,58,92,0.25)` : 'none',
      }}>
        {f.icon}
      </div>
      <h3 style={{ fontSize:16, fontWeight:800, color:C.navy, marginBottom:8 }}>{f.title}</h3>
      <p style={{ fontSize:13.5, color:C.muted, lineHeight:1.65, margin:0 }}>{f.desc}</p>
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
    document.getElementById(id)?.scrollIntoView({ behavior:'smooth' })
    setMobileMenu(false)
  }

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.ivory, color:C.text, overflowX:'hidden' }}>

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrolled ? 'rgba(245,240,230,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.goldLight}` : 'none',
        transition:'all .3s',
        padding:'0 32px',
        height:64,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <img src="/logo.png" alt="SmartEdu"
          style={{ height:40, filter: scrolled ? 'none' : 'brightness(0) invert(1)', transition:'all .3s' }}
          onError={e => {
            e.target.style.display='none'
            e.target.nextSibling.style.display='block'
          }}
        />
        <span style={{ display:'none', fontWeight:900, fontSize:18, color: scrolled ? C.navy : C.white }}>SmartEdu</span>

        {/* Desktop links */}
        <div style={{ display:'flex', gap:28, alignItems:'center' }}>
          {NAV.map(n => (
            <button key={n} onClick={() => scrollTo(n.toLowerCase().replace('é','e').replace('î','i'))}
              style={{
                background:'none', border:'none', cursor:'pointer',
                fontSize:14, fontWeight:600,
                color: scrolled ? C.muted : 'rgba(255,255,255,0.85)',
                transition:'color .2s',
                padding:0,
              }}
              onMouseEnter={e => e.target.style.color = scrolled ? C.navy : C.white}
              onMouseLeave={e => e.target.style.color = scrolled ? C.muted : 'rgba(255,255,255,0.85)'}
            >{n}</button>
          ))}
          <button onClick={() => navigate('/auth')}
            style={{
              padding:'9px 22px', borderRadius:10, border:'none',
              background: scrolled ? `linear-gradient(135deg,${C.navy},${C.navyMid})` : 'rgba(255,255,255,0.2)',
              backdropFilter:'blur(8px)',
              color:C.white, fontWeight:700, fontSize:14, cursor:'pointer',
              border: scrolled ? 'none' : '1.5px solid rgba(255,255,255,0.4)',
              transition:'all .2s',
            }}>
            Connexion
          </button>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight:'100vh',
        background:`linear-gradient(150deg, ${C.navy} 0%, ${C.navyMid} 55%, ${C.navyLight} 100%)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative', overflow:'hidden',
        padding:'100px 32px 60px',
      }}>
        {/* Cercles décoratifs */}
        <div style={{ position:'absolute', top:-120, right:-120, width:500, height:500, background:'rgba(197,160,89,0.07)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:-80, left:-80, width:350, height:350, background:'rgba(197,160,89,0.05)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:'30%', left:'5%', width:200, height:200, background:'rgba(255,255,255,0.03)', borderRadius:'50%' }} />

        <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:780 }}>
          {/* Logo grand */}
          <img src="/logo.png" alt="SmartEdu"
            style={{ maxWidth:420, width:'90%', marginBottom:24, filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.2))' }}
            onError={e => e.target.style.display='none'}
          />

          <p style={{ fontSize:22, fontWeight:700, color:C.goldLight, marginBottom:12 }}>
            Learn Smart, <span style={{ color:C.gold }}>Learn Faster.</span>
          </p>

          <p style={{ fontSize:17, color:'rgba(255,255,255,0.75)', lineHeight:1.75, marginBottom:40, maxWidth:560, margin:'0 auto 40px' }}>
            La plateforme marocaine qui connecte étudiants et tuteurs experts pour une expérience d'apprentissage 100% personnalisée.
          </p>

          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => navigate('/auth')}
              style={{
                padding:'14px 36px', borderRadius:14, border:'none',
                background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
                color:C.navy, fontWeight:800, fontSize:15, cursor:'pointer',
                boxShadow:`0 6px 24px rgba(197,160,89,0.4)`,
                transition:'transform .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform='none'}
            >
              🚀 Commencer gratuitement
            </button>
            <button onClick={() => scrollTo('fonctionnalites')}
              style={{
                padding:'14px 32px', borderRadius:14,
                border:'1.5px solid rgba(255,255,255,0.3)',
                background:'rgba(255,255,255,0.1)',
                backdropFilter:'blur(10px)',
                color:C.white, fontWeight:700, fontSize:15, cursor:'pointer',
                transition:'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.18)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.3)' }}
            >
              En savoir plus ↓
            </button>
          </div>

          {/* Scroll indicator */}
          <div style={{ marginTop:60, display:'flex', flexDirection:'column', alignItems:'center', gap:6, opacity:0.5 }}>
            <div style={{ width:1, height:40, background:'rgba(255,255,255,0.5)', animation:'pulse 2s infinite' }} />
          </div>
        </div>
      </section>

      {/* ══ STATS ═══════════════════════════════════════════════════════════════ */}
      <section id="statistiques" style={{ background:C.white, padding:'60px 32px', borderBottom:`1px solid ${C.goldLight}` }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:24 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:36, fontWeight:900, color:C.navy, fontFamily:'Syne,sans-serif' }}>{s.value}</div>
              <div style={{ fontSize:13, color:C.muted, fontWeight:600, marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════════════════ */}
      <section id="fonctionnalites" style={{ padding:'80px 32px', background:C.ivory }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.gold, textTransform:'uppercase', letterSpacing:2 }}>Pourquoi SmartEdu ?</span>
            <h2 style={{ fontSize:34, fontWeight:900, color:C.navy, margin:'10px 0 14px', fontFamily:'Syne,sans-serif' }}>Tout ce qu'il vous faut</h2>
            <p style={{ fontSize:15, color:C.muted, maxWidth:480, margin:'0 auto' }}>Une plateforme complète conçue pour maximiser votre réussite académique.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 }}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} f={f} i={i} />)}
          </div>
        </div>
      </section>

      {/* ══ TUTEURS CTA ══════════════════════════════════════════════════════════ */}
      <section id="tuteurs" style={{
        background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`,
        padding:'80px 32px',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:300, height:300, background:'rgba(197,160,89,0.07)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:-40, left:-40, width:200, height:200, background:'rgba(197,160,89,0.05)', borderRadius:'50%' }} />
        <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center', position:'relative', zIndex:1 }}>
          <span style={{ fontSize:12, fontWeight:700, color:C.gold, textTransform:'uppercase', letterSpacing:2 }}>Rejoindre l'équipe</span>
          <h2 style={{ fontSize:32, fontWeight:900, color:C.white, margin:'12px 0 16px', fontFamily:'Syne,sans-serif' }}>
            Devenez tuteur sur SmartEdu
          </h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.75, marginBottom:36 }}>
            Partagez votre expertise, fixez vos tarifs et gérez votre emploi du temps en toute liberté. Rejoignez plus de 320 tuteurs qui gagnent un revenu supplémentaire sur notre plateforme.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            {['🧮 Mathématiques','⚗️ Physique','💻 Informatique','📐 Génie civil','📊 Économie'].map(m => (
              <span key={m} style={{
                padding:'7px 16px', borderRadius:20,
                background:'rgba(197,160,89,0.15)',
                border:'1px solid rgba(197,160,89,0.3)',
                color:C.goldLight, fontSize:13, fontWeight:600,
              }}>{m}</span>
            ))}
          </div>
          <button onClick={() => navigate('/auth')}
            style={{
              marginTop:36, padding:'14px 36px', borderRadius:14, border:'none',
              background:`linear-gradient(135deg,${C.gold},#D4B06A)`,
              color:C.navy, fontWeight:800, fontSize:15, cursor:'pointer',
              boxShadow:`0 6px 24px rgba(197,160,89,0.35)`,
            }}>
            👨‍🏫 S'inscrire comme tuteur
          </button>
        </div>
      </section>

      {/* ══ CONTACT ══════════════════════════════════════════════════════════════ */}
      <section id="contact" style={{ padding:'80px 32px', background:C.ivory }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'start' }}>

          {/* Infos contact */}
          <div>
            <span style={{ fontSize:12, fontWeight:700, color:C.gold, textTransform:'uppercase', letterSpacing:2 }}>Nous contacter</span>
            <h2 style={{ fontSize:30, fontWeight:900, color:C.navy, margin:'10px 0 14px', fontFamily:'Syne,sans-serif' }}>
              Une question ? <br />On est là. 👋
            </h2>
            <p style={{ fontSize:14.5, color:C.muted, lineHeight:1.7, marginBottom:32 }}>
              Notre équipe répond dans les 24 heures. N'hésitez pas à nous écrire pour toute question sur l'inscription, les séances ou les paiements.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:36 }}>
              {[
                { icon:'📧', label:'Email général',    value:'contact@smartedu.ma',     href:'mailto:contact@smartedu.ma' },
                { icon:'🎓', label:'Support étudiants',value:'etudiant@smartedu.ma',     href:'mailto:etudiant@smartedu.ma' },
                { icon:'👨‍🏫',label:'Devenir tuteur',  value:'tuteurs@smartedu.ma',      href:'mailto:tuteurs@smartedu.ma' },
                { icon:'📍', label:'Adresse',           value:'Fès, Maroc',               href:null },
              ].map(c => (
                <div key={c.label} style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{
                    width:44, height:44, borderRadius:12,
                    background:`linear-gradient(135deg,${C.navy},${C.navyMid})`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:20, flexShrink:0,
                  }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.8 }}>{c.label}</div>
                    {c.href
                      ? <a href={c.href} style={{ fontSize:14, fontWeight:600, color:C.navy, textDecoration:'none' }}
                          onMouseEnter={e => e.target.style.color=C.gold}
                          onMouseLeave={e => e.target.style.color=C.navy}
                        >{c.value}</a>
                      : <span style={{ fontSize:14, fontWeight:600, color:C.navy }}>{c.value}</span>
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* Réseaux sociaux */}
            <div>
              <p style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:1.2, marginBottom:12 }}>
                Suivez-nous
              </p>
              <div style={{ display:'flex', gap:10 }}>
                {SOCIAL.map(s => (
                  <a key={s.name} href={s.href} target="_blank" rel="noreferrer" title={s.name}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center',
                      width:44, height:44, borderRadius:12,
                      background:s.bg,
                      border:`1.5px solid ${s.color}30`,
                      color:s.color, fontWeight:800, fontSize:15,
                      textDecoration:'none',
                      transition:'all .2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 6px 16px ${s.color}30` }}
                    onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}
                  >{s.icon}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div style={{ background:C.white, borderRadius:20, border:`1.5px solid ${C.goldLight}`, padding:'32px 28px', boxShadow:'0 4px 24px rgba(26,58,92,0.08)' }}>
            {sent ? (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
                <h3 style={{ fontSize:18, fontWeight:800, color:C.navy, marginBottom:8 }}>Message envoyé !</h3>
                <p style={{ fontSize:14, color:C.muted }}>Nous vous répondrons sous 24h.</p>
              </div>
            ) : (
              <form onSubmit={handleContact} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <h3 style={{ fontSize:18, fontWeight:800, color:C.navy, marginBottom:4, margin:0 }}>Envoyer un message</h3>
                <p style={{ fontSize:13, color:C.muted, margin:'0 0 4px' }}>Remplissez le formulaire et on vous répond rapidement.</p>
                {[
                  { key:'nom',     label:'Votre nom',     type:'text',  placeholder:'Mohamed Alami' },
                  { key:'email',   label:'Votre email',   type:'email', placeholder:'vous@exemple.com' },
                ].map(fi => (
                  <div key={fi.key}>
                    <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:5 }}>{fi.label}</label>
                    <input type={fi.type} required placeholder={fi.placeholder}
                      value={contactForm[fi.key]} onChange={setField(fi.key)}
                      style={{ background:C.white, border:`1.5px solid ${C.goldLight}`, color:C.navy, borderRadius:10, padding:'10px 14px', width:'100%', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                      onFocus={e => { e.target.style.borderColor=C.gold; e.target.style.boxShadow=`0 0 0 3px rgba(197,160,89,0.15)` }}
                      onBlur={e  => { e.target.style.borderColor=C.goldLight; e.target.style.boxShadow='none' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:5 }}>Votre message</label>
                  <textarea required rows={5} placeholder="Décrivez votre demande..."
                    value={contactForm.message} onChange={setField('message')}
                    style={{ background:C.white, border:`1.5px solid ${C.goldLight}`, color:C.navy, borderRadius:10, padding:'10px 14px', width:'100%', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', resize:'vertical' }}
                    onFocus={e => { e.target.style.borderColor=C.gold; e.target.style.boxShadow=`0 0 0 3px rgba(197,160,89,0.15)` }}
                    onBlur={e  => { e.target.style.borderColor=C.goldLight; e.target.style.boxShadow='none' }}
                  />
                </div>
                <button type="submit"
                  style={{
                    padding:'13px', borderRadius:12, border:'none',
                    background:`linear-gradient(135deg,${C.navy},${C.navyMid})`,
                    color:C.white, fontWeight:700, fontSize:14, cursor:'pointer',
                    boxShadow:`0 4px 14px rgba(26,58,92,0.25)`,
                  }}>
                  📨 Envoyer le message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════════ */}
      <footer style={{
        background:`linear-gradient(135deg, ${C.navy} 0%, #0F2540 100%)`,
        padding:'56px 32px 0',
        color:'rgba(255,255,255,0.75)',
      }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:48, marginBottom:48 }}>

            {/* Colonne marque */}
            <div>
              <img src="/logo.png" alt="SmartEdu"
                style={{ maxWidth:180, marginBottom:16, filter:'brightness(0) invert(1) opacity(0.9)' }}
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }}
              />
              <span style={{ display:'none', fontSize:22, fontWeight:900, color:C.white }}>SmartEdu</span>
              <p style={{ fontSize:13.5, lineHeight:1.75, color:'rgba(255,255,255,0.6)', marginBottom:24 }}>
                Plateforme marocaine de tutorat collaboratif. Connectez-vous avec les meilleurs tuteurs et progressez à votre rythme.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                {SOCIAL.map(s => <SocialBtn key={s.name} s={s} />)}
              </div>
            </div>

            {/* Plateforme */}
            <div>
              <h4 style={{ fontSize:13, fontWeight:700, color:C.white, textTransform:'uppercase', letterSpacing:1.2, marginBottom:18 }}>Plateforme</h4>
              {['Fonctionnalités','Tuteurs','Examens','Certificats','Tarifs'].map(l => (
                <div key={l} style={{ marginBottom:10 }}>
                  <button onClick={() => navigate('/auth')}
                    style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', fontSize:13.5, cursor:'pointer', padding:0, textAlign:'left',
                      transition:'color .2s' }}
                    onMouseEnter={e => e.target.style.color=C.goldLight}
                    onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.6)'}
                  >{l}</button>
                </div>
              ))}
            </div>

            {/* Support */}
            <div>
              <h4 style={{ fontSize:13, fontWeight:700, color:C.white, textTransform:'uppercase', letterSpacing:1.2, marginBottom:18 }}>Support</h4>
              {[
                { label:'Centre d\'aide',       href:null },
                { label:'Nous contacter',       href:'mailto:contact@smartedu.ma' },
                { label:'Signaler un problème', href:'mailto:support@smartedu.ma' },
                { label:'Politique de confidentialité', href:null },
                { label:'CGU',                  href:null },
              ].map(l => (
                <div key={l.label} style={{ marginBottom:10 }}>
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
              <h4 style={{ fontSize:13, fontWeight:700, color:C.white, textTransform:'uppercase', letterSpacing:1.2, marginBottom:18 }}>Contact</h4>
              {[
                { icon:'📧', text:'contact@smartedu.ma', href:'mailto:contact@smartedu.ma' },
                { icon:'🎓', text:'etudiant@smartedu.ma', href:'mailto:etudiant@smartedu.ma' },
                { icon:'👨‍🏫',text:'tuteurs@smartedu.ma', href:'mailto:tuteurs@smartedu.ma' },
                { icon:'📍', text:'Fès, Maroc', href:null },
              ].map(c => (
                <div key={c.text} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:15 }}>{c.icon}</span>
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
            borderTop:'1px solid rgba(255,255,255,0.1)',
            padding:'20px 0',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            flexWrap:'wrap', gap:12,
          }}>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>
              © 2026 SmartEdu — Tous droits réservés. Plateforme de tutorat collaboratif au Maroc.
            </p>
            <div style={{ display:'flex', gap:20 }}>
              {['Confidentialité','Conditions d\'utilisation','Cookies'].map(l => (
                <span key={l} style={{ fontSize:12, color:'rgba(255,255,255,0.35)', cursor:'pointer', transition:'color .2s' }}
                  onMouseEnter={e => e.target.style.color='rgba(255,255,255,0.7)'}
                  onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.35)'}
                >{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}