import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { tarifsAPI } from '../../services/api'
import { Spinner } from '../../components/UI'

const NIVEAUX = ['Licence 1','Licence 2','Licence 3','Master 1','Master 2','Doctorat','BTS','BUT','Prépa']

// ─── STYLES AVEC COULEURS SMARTEDU (Bleu profond + Doré) ─────────────
const inputStyle = {
  background: '#FFFFFF',
  border: '1.5px solid #E0D5C0',
  color: '#1A3A5C',
  borderRadius: 10,
  padding: '10px 14px',
  width: '100%',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color .2s, box-shadow .2s',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7B8D',
  textTransform: 'uppercase',
  letterSpacing: 1,
  display: 'block',
  marginBottom: 5,
}

function Field({ label, children }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>
}

function Input({ ...p }) {
  return (
    <input {...p} style={inputStyle}
      onFocus={e => { e.target.style.borderColor='#C5A059'; e.target.style.boxShadow='0 0 0 3px rgba(197,160,89,0.15)' }}
      onBlur={e  => { e.target.style.borderColor='#E0D5C0'; e.target.style.boxShadow='none' }} />
  )
}

function Textarea({ ...p }) {
  return (
    <textarea {...p} style={{ ...inputStyle, resize:'vertical' }}
      onFocus={e => { e.target.style.borderColor='#C5A059'; e.target.style.boxShadow='0 0 0 3px rgba(197,160,89,0.15)' }}
      onBlur={e  => { e.target.style.borderColor='#E0D5C0'; e.target.style.boxShadow='none' }} />
  )
}

function Select({ children, ...p }) {
  return (
    <select {...p} style={{ ...inputStyle, cursor:'pointer' }}
      onFocus={e => { e.target.style.borderColor='#C5A059'; e.target.style.boxShadow='0 0 0 3px rgba(197,160,89,0.15)' }}
      onBlur={e  => { e.target.style.borderColor='#E0D5C0'; e.target.style.boxShadow='none' }}>
      {children}
    </select>
  )
}

export default function Auth() {
  const [tab,     setTab]     = useState('login')
  const [role,    setRole]    = useState('etudiant')
  const [form,    setForm]    = useState({})
  const [err,     setErr]     = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const { login, register }   = useAuth()
  const navigate              = useNavigate()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      if (tab === 'login') {
        const data = await login(form.email, form.motDePasse)
        navigate(data.user.role === 'admin' ? '/admin' : '/dashboard')
      } else {
        const payload = { ...form, role }
        if (role === 'tuteur')
          payload.specialites = (form.specialites || '').split(',').map(s => s.trim()).filter(Boolean)
        const data = await register(payload)
        if (role === 'tuteur') {
          if (data.token && form.tarifHeure && form.matiereprincipale) {
            try { await tarifsAPI.upsert({ matiere: form.matiereprincipale, tarifHeure: parseFloat(form.tarifHeure) }) } catch {}
          }
          setPending(true)
        } else { navigate('/dashboard') }
      }
    } catch (e) { setErr(e.response?.data?.error || 'Une erreur est survenue') }
    finally { setLoading(false) }
  }

  // ── Pending ───────────────────────────────────────────────────
  if (pending) return (
    <div style={{ minHeight:'100vh', background:'#F5F0E6', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#FFFFFF', borderRadius:20, padding:40, maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(26,58,92,0.10)', border:'1.5px solid #E8D5A3' }}>
        <div style={{ fontSize:56, marginBottom:16 }}>⏳</div>
        <h2 style={{ fontWeight:800, fontSize:22, color:'#1A3A5C', marginBottom:8 }}>Demande envoyée !</h2>
        <p style={{ color:'#6B7B8D', fontSize:14, lineHeight:1.6, marginBottom:24 }}>
          Votre compte tuteur est <span style={{ color:'#C5A059', fontWeight:700 }}>en attente de validation</span> par un administrateur.
        </p>
        <button onClick={() => { setPending(false); setTab('login') }}
          style={{ padding:'12px 28px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#1A3A5C,#2C5F8A)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>
          Retour à la connexion
        </button>
      </div>
    </div>
  )

  // ── Page principale ───────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E6', display:'flex', alignItems:'stretch' }}>

      {/* ══ COLONNE GAUCHE — Logo + présentation (fond bleu profond) ══ */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        background:'linear-gradient(135deg, #1A3A5C 0%, #2C5F8A 100%)',
        padding:'48px 40px',
        position:'relative', overflow:'hidden',
      }}>
        {/* Cercles décoratifs dorés */}
        <div style={{ position:'absolute', top:-80, right:-80, width:260, height:260, background:'rgba(197,160,89,0.08)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:200, height:200, background:'rgba(197,160,89,0.06)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:'40%', right:-40, width:140, height:140, background:'rgba(232,213,163,0.05)', borderRadius:'50%' }} />

        <div style={{
          position:'relative',
          zIndex:1,
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          gap:8,
          maxWidth:360
        }}>

          {/* Logo - sans carré blanc */}
          <img
            src="/logo.png"
            alt="SmartEdu Logo"
            style={{
              maxWidth: '400px',
              width: '100%',
              height: 'auto',
              display: 'block',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
            }}
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />

          {/* Slogan */}
          <p style={{ fontSize:20, fontWeight:700, color:'#E8D5A3', textAlign:'center', lineHeight:1.5, margin:0 }}>
            Learn Smart,{' '}
            <span style={{ color:'#C5A059' }}>Learn Faster.</span>
          </p>

          {/* Description */}
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.8)', textAlign:'center', lineHeight:2, margin:0 }}>
            La plateforme qui connecte étudiants et tuteurs experts pour une expérience d'apprentissage personnalisée.
          </p>

          {/* Points forts */}
          <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%' }}>
            {[
              { icon:'🎯', text:'Tuteurs certifiés & évalués' },
              { icon:'📅', text:'Séances selon vos disponibilités' },
              { icon:'🏆', text:'Certificats à télécharger & partager' },
            ].map(f => (
              <div key={f.text} style={{
                display:'flex', alignItems:'center', gap:12,
                background:'rgba(255,255,255,0.08)',
                backdropFilter:'blur(10px)',
                border:'1px solid rgba(197,160,89,0.3)',
                borderRadius:12, padding:'10px 14px',
              }}>
                <span style={{ fontSize:18 }}>{f.icon}</span>
                <span style={{ fontSize:13, color:'#FFFFFF', fontWeight:500 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Copyright */}
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textAlign:'center', marginTop:4 }}>
            SmartEdu © 2026 — Plateforme de tutorat collaboratif
          </p>
        </div>
      </div>

      {/* ══ COLONNE DROITE — Formulaire (fond ivoire) ══ */}
      <div style={{
        width:460, flexShrink:0,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        background:'#F5F0E6',
        padding:'40px 36px',
        overflowY:'auto',
      }}>
        <div style={{ width:'100%', maxWidth:380 }}>

          {/* Titre */}
          <div style={{ marginBottom:24, textAlign:'center' }}>
            <h2 style={{ fontSize:22, fontWeight:900, color:'#1A3A5C', margin:0 }}>
              {tab === 'login' ? 'Bienvenue 👋' : 'Créer un compte'}
            </h2>
            <p style={{ fontSize:13, color:'#6B7B8D', marginTop:6 }}>
              {tab === 'login' ? 'Connectez-vous à votre espace SmartEdu' : 'Rejoignez la communauté SmartEdu'}
            </p>
          </div>

          {/* Onglets */}
          <div style={{ display:'flex', background:'#FFFFFF', border:'1.5px solid #E8D5A3', borderRadius:12, padding:4, marginBottom:20 }}>
            {['login','register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setErr('') }} style={{
                flex:1, padding:'9px', fontSize:13, fontWeight:700,
                cursor:'pointer', border:'none', borderRadius:9, transition:'all .2s',
                background: tab===t ? '#E8D5A3' : 'transparent',
                color: tab===t ? '#1A3A5C' : '#6B7B8D',
                boxShadow: tab===t ? '0 2px 6px rgba(26,58,92,0.10)' : 'none',
              }}>
                {t === 'login' ? '🔑 Connexion' : '📝 Inscription'}
              </button>
            ))}
          </div>

          {/* Card formulaire */}
          <div style={{ background:'#FFFFFF', borderRadius:16, border:'1.5px solid #E8D5A3', boxShadow:'0 4px 20px rgba(26,58,92,0.08)', padding:'24px 22px' }}>

            {/* Erreur */}
            {err && (
              <div style={{ marginBottom:14, padding:'10px 14px', borderRadius:10, background:'#FFEBEE', border:'1px solid #EF9A9A', color:'#C62828', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
                <span>⚠</span> {err}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:13 }}>

              {tab === 'register' && (<>
                {/* Rôle */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[{ v:'etudiant', icon:'👨‍🎓', label:'Étudiant' },{ v:'tuteur', icon:'👨‍🏫', label:'Tuteur' }].map(r => (
                    <button key={r.v} type="button" onClick={() => setRole(r.v)} style={{
                      padding:'12px 8px', borderRadius:12, cursor:'pointer', transition:'all .2s',
                      border: role===r.v ? '2px solid #C5A059' : '2px solid #E8D5A3',
                      background: role===r.v ? 'rgba(197,160,89,0.1)' : '#FFFFFF',
                      color: role===r.v ? '#1A3A5C' : '#6B7B8D',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                      fontSize:13, fontWeight:700,
                    }}>
                      <span style={{ fontSize:24 }}>{r.icon}</span>{r.label}
                    </button>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <Field label="Prénom"><Input required placeholder="Prénom" onChange={set('prenom')} /></Field>
                  <Field label="Nom"><Input required placeholder="Nom" onChange={set('nom')} /></Field>
                </div>
              </>)}

              <Field label="Email"><Input type="email" required placeholder="email@exemple.com" onChange={set('email')} /></Field>
              <Field label="Mot de passe"><Input type="password" required placeholder="••••••••" onChange={set('motDePasse')} /></Field>

              {tab === 'register' && role === 'etudiant' && (<>
                <Field label="Niveau d'étude">
                  <Select onChange={set('niveauEtude')}>
                    <option value="">Sélectionner...</option>
                    {NIVEAUX.map(n => <option key={n}>{n}</option>)}
                  </Select>
                </Field>
                <Field label="Filière"><Input placeholder="ex: Informatique" onChange={set('filiere')} /></Field>
                <Field label="Établissement"><Input placeholder="ex: Université Ibn Tofail" onChange={set('etablissement')} /></Field>
              </>)}

              {tab === 'register' && role === 'tuteur' && (<>
                <Field label="Spécialités (séparées par virgule)">
                  <Input placeholder="ex: Maths, Physique, Info" onChange={set('specialites')} />
                </Field>
                <Field label="Biographie">
                  <Textarea rows={3} placeholder="Décrivez votre expertise..." onChange={set('biographie')} />
                </Field>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <Field label="Matière principale"><Input placeholder="ex: Mathématiques" onChange={set('matiereprincipale')} /></Field>
                  <Field label="Tarif (DH/h)"><Input type="number" min="10" step="10" placeholder="150" onChange={set('tarifHeure')} /></Field>
                </div>
              </>)}

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'12px', borderRadius:12, border:'none',
                background: loading ? '#E8D5A3' : 'linear-gradient(135deg,#1A3A5C,#2C5F8A)',
                color: loading ? '#6B7B8D' : '#fff',
                fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                marginTop:4, boxShadow: loading ? 'none' : '0 4px 14px rgba(26,58,92,0.30)',
              }}>
                {loading ? <><Spinner size="sm" /> Chargement…</> : tab==='login' ? '🔑 Se connecter' : "🚀 S'inscrire"}
              </button>
            </form>
          </div>

          {/* Switch */}
          <p style={{ textAlign:'center', fontSize:13, color:'#6B7B8D', marginTop:16 }}>
            {tab==='login' ? "Pas encore de compte ? " : "Déjà un compte ? "}
            <button onClick={() => { setTab(tab==='login'?'register':'login'); setErr('') }}
              style={{ background:'none', border:'none', color:'#C5A059', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              {tab==='login' ? "S'inscrire" : "Se connecter"}
            </button>
          </p>

        </div>
      </div>
    </div>
  )
}