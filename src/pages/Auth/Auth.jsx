import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { tarifsAPI } from '../../services/api'
import { Btn, FormGroup, Spinner } from '../../components/UI'

const NIVEAUX = ['Licence 1','Licence 2','Licence 3','Master 1','Master 2','Doctorat','BTS','BUT','Prépa']

const inputStyle = {
  background: '#FFFFFF', border: '1.5px solid #E8D5A3', color: '#0A1628',
  borderRadius: 10, padding: '10px 14px', width: '100%', fontSize: 14,
  outline: 'none', transition: 'border-color .2s, box-shadow .2s',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
}

function StyledInput({ ...props }) {
  return (
    <input
      {...props}
      style={inputStyle}
      onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.15)' }}
      onBlur={e => { e.target.style.borderColor = '#E8D5A3'; e.target.style.boxShadow = 'none' }}
    />
  )
}

function StyledTextarea({ ...props }) {
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, resize: 'vertical' }}
      onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.15)' }}
      onBlur={e => { e.target.style.borderColor = '#E8D5A3'; e.target.style.boxShadow = 'none' }}
    />
  )
}

function StyledSelect({ children, ...props }) {
  return (
    <select
      {...props}
      style={{ ...inputStyle, cursor: 'pointer' }}
      onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.15)' }}
      onBlur={e => { e.target.style.borderColor = '#E8D5A3'; e.target.style.boxShadow = 'none' }}>
      {children}
    </select>
  )
}

export default function Auth() {
  const [tab, setTab]     = useState('login')
  const [role, setRole]   = useState('etudiant')
  const [form, setForm]   = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (tab === 'login') {
        const data = await login(form.email, form.motDePasse)
        navigate(data.user.role === 'admin' ? '/admin' : '/dashboard')
      } else {
        const payload = { ...form, role }
        if (role === 'tuteur') {
          payload.specialites = (form.specialites || '').split(',').map(s => s.trim()).filter(Boolean)
        }
        const data = await register(payload)
        if (role === 'tuteur') {
          if (data.token && form.tarifHeure && form.matiereprincipale) {
            try { await tarifsAPI.upsert({ matiere: form.matiereprincipale, tarifHeure: parseFloat(form.tarifHeure) }) } catch {}
          }
          setPending(true)
        } else { navigate('/dashboard') }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue')
    } finally { setLoading(false) }
  }

  if (pending) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A1628 0%, #0F2040 50%, #162B55 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{
        background: '#FFFFFF', borderRadius: 20, padding: 40, maxWidth: 440, width: '100%',
        textAlign: 'center', boxShadow: '0 20px 60px rgba(10,22,40,0.4)',
        border: '1px solid #E8D5A3',
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontWeight: 800, fontSize: 22, color: '#0A1628', marginBottom: 8 }}>Demande envoyée !</h2>
        <p style={{ color: '#4A6080', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Votre compte tuteur est <span style={{ color: '#C5A059', fontWeight: 700 }}>en attente de validation</span> par un administrateur. Vous serez notifié dès qu'il sera examiné.
        </p>
        <Btn onClick={() => { setPending(false); setTab('login') }}>Retour à la connexion</Btn>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', overflowY: 'auto',
      background: 'linear-gradient(135deg, #0A1628 0%, #0F2040 55%, #162B55 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, position: 'relative',
    }}>
      {/* Décors dorés */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, background: 'rgba(197,160,89,0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 300, height: 300, background: 'rgba(74,144,226,0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />
        {/* Ligne déco dorée */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 1, height: '100%', background: 'linear-gradient(180deg, transparent, rgba(197,160,89,0.15), transparent)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #C5A059 0%, #E8D5A3 100%)',
            fontSize: 28, marginBottom: 16,
            boxShadow: '0 8px 24px rgba(197,160,89,0.4)',
          }}>🎓</div>
          <h1 style={{ fontWeight: 800, fontSize: 28, color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 6 }}>SmartTutor</h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 1, background: '#C5A059' }} />
            <p style={{ fontSize: 12, color: '#C5A059', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Academy</p>
            <div style={{ width: 24, height: 1, background: '#C5A059' }} />
          </div>
        </div>

        {/* Card principale */}
        <div style={{
          background: '#FFFFFF', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(10,22,40,0.5), 0 0 0 1px rgba(197,160,89,0.2)',
        }}>
          {/* Onglets */}
          <div style={{ display: 'flex', borderBottom: '1px solid #F2E8CC' }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }}
                style={{
                  flex: 1, padding: '14px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                  background: tab === t ? '#FAF4E4' : '#FFFFFF',
                  color: tab === t ? '#8B6914' : '#94A3B8',
                  borderBottom: tab === t ? '2px solid #C5A059' : '2px solid transparent',
                }}>
                {t === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <div style={{ padding: 28 }}>
            {error && (
              <div style={{
                marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#9B1C1C',
                fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tab === 'register' && (
                <>
                  {/* Choix rôle */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[{ v:'etudiant', icon:'👨‍🎓', label:'Étudiant' },{ v:'tuteur', icon:'👨‍🏫', label:'Tuteur' }].map(r => (
                      <button key={r.v} type="button" onClick={() => setRole(r.v)}
                        style={{
                          padding: '14px 10px', borderRadius: 12, cursor: 'pointer',
                          border: role === r.v ? '2px solid #C5A059' : '2px solid #E8D5A3',
                          background: role === r.v ? '#FAF4E4' : '#FDFCF9',
                          color: role === r.v ? '#8B6914' : '#94A3B8',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
                        }}>
                        <span style={{ fontSize: 24 }}>{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Prénom</label>
                      <StyledInput required placeholder="Prénom" onChange={set('prenom')} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Nom</label>
                      <StyledInput required placeholder="Nom" onChange={set('nom')} />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Email</label>
                <StyledInput type="email" required placeholder="email@exemple.com" onChange={set('email')} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Mot de passe</label>
                <StyledInput type="password" required placeholder="••••••••" onChange={set('motDePasse')} />
              </div>

              {tab === 'register' && role === 'etudiant' && (
                <>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Niveau d'étude</label>
                    <StyledSelect onChange={set('niveauEtude')}>
                      <option value="">Sélectionner...</option>
                      {NIVEAUX.map(n => <option key={n}>{n}</option>)}
                    </StyledSelect>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Filière</label>
                    <StyledInput placeholder="ex: Informatique" onChange={set('filiere')} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Établissement</label>
                    <StyledInput placeholder="ex: Université Ibn Tofail" onChange={set('etablissement')} />
                  </div>
                </>
              )}

              {tab === 'register' && role === 'tuteur' && (
                <>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Spécialités <span style={{ color: '#94A3B8', fontWeight: 400, textTransform: 'none' }}>(séparées par virgule)</span></label>
                    <StyledInput placeholder="ex: Maths, Physique, Informatique" onChange={set('specialites')} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Biographie</label>
                    <StyledTextarea rows={3} placeholder="Décrivez votre expertise..." onChange={set('biographie')} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Matière principale</label>
                      <StyledInput placeholder="ex: Mathématiques" onChange={set('matiereprincipale')} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Tarif (DH/h)</label>
                      <StyledInput type="number" min="10" step="10" placeholder="150" onChange={set('tarifHeure')} />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                  background: loading ? '#E8D5A3' : 'linear-gradient(135deg, #0F2040 0%, #162B55 100%)',
                  color: loading ? '#8B6914' : '#FFFFFF',
                  fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 4, transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(10,22,40,0.3)',
                }}>
                {loading ? <><Spinner size="sm" /> Chargement…</> : tab === 'login' ? 'Se connecter' : "S'inscrire"}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 20 }}>
          SmartTutor © 2025 — Plateforme de tutorat collaboratif
        </p>
      </div>
    </div>
  )
}