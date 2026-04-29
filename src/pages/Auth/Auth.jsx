import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Btn, FormGroup, Spinner } from '../../components/UI'

const NIVEAUX = ['Licence 1','Licence 2','Licence 3','Master 1','Master 2','Doctorat','BTS','BUT','Prépa']

export default function Auth() {
  const [tab, setTab]     = useState('login')   // login | register
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
        if (role === 'tuteur') { setPending(true) } else { navigate('/dashboard') }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (pending) return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
      <div className="bg-ink-800 border border-ink-600 rounded-2xl p-10 max-w-md w-full text-center animate-slide-up">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Demande envoyée !</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Votre compte tuteur est <span className="text-amber-400 font-semibold">en attente de validation</span> par un administrateur. Vous serez notifié dès qu'il sera examiné.
        </p>
        <Btn onClick={() => { setPending(false); setTab('login') }}>Retour à la connexion</Btn>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 text-2xl mb-4 shadow-glow">🎓</div>
          <h1 className="font-display font-bold text-3xl text-white">SmartTutor</h1>
          <p className="text-slate-500 text-sm mt-1">Plateforme de tutorat collaboratif</p>
        </div>

        <div className="bg-ink-800 border border-ink-700 rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-ink-700">
            {['login','register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-3.5 text-sm font-display font-semibold transition-all duration-200
                  ${tab === t ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-600/5' : 'text-slate-500 hover:text-slate-300'}`}>
                {t === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm flex items-center gap-2 animate-fade-in">
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Role selector (register only) */}
              {tab === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ v:'etudiant', icon:'👨‍🎓', label:'Étudiant' },{ v:'tuteur', icon:'👨‍🏫', label:'Tuteur' }].map(r => (
                      <button key={r.v} type="button" onClick={() => setRole(r.v)}
                        className={`p-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 flex flex-col items-center gap-1
                          ${role === r.v ? 'border-violet-500 bg-violet-600/10 text-violet-400' : 'border-ink-600 text-slate-400 hover:border-ink-500'}`}>
                        <span className="text-2xl">{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup label="Prénom"><input required placeholder="Prénom" onChange={set('prenom')} /></FormGroup>
                    <FormGroup label="Nom"><input required placeholder="Nom" onChange={set('nom')} /></FormGroup>
                  </div>
                </>
              )}

              <FormGroup label="Email">
                <input type="email" required placeholder="email@exemple.com" onChange={set('email')} />
              </FormGroup>

              <FormGroup label="Mot de passe">
                <input type="password" required placeholder="••••••••" onChange={set('motDePasse')} />
              </FormGroup>

              {/* Etudiant extra fields */}
              {tab === 'register' && role === 'etudiant' && (
                <>
                  <FormGroup label="Niveau d'étude">
                    <select onChange={set('niveauEtude')}>
                      <option value="">Sélectionner...</option>
                      {NIVEAUX.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </FormGroup>
                  <FormGroup label="Filière">
                    <input placeholder="ex: Informatique" onChange={set('filiere')} />
                  </FormGroup>
                  <FormGroup label="Établissement (optionnel)">
                    <input placeholder="ex: Université Ibn Tofail" onChange={set('etablissement')} />
                  </FormGroup>
                </>
              )}

              {/* Tuteur extra fields */}
              {tab === 'register' && role === 'tuteur' && (
                <>
                  <FormGroup label="Spécialités" hint="Séparées par virgule">
                    <input placeholder="ex: Maths, Physique, Informatique" onChange={set('specialites')} />
                  </FormGroup>
                  <FormGroup label="Biographie">
                    <textarea rows={3} placeholder="Décrivez votre expertise..." onChange={set('biographie')} />
                  </FormGroup>
                </>
              )}

              <Btn type="submit" disabled={loading} className="w-full justify-center mt-1 py-3">
                {loading ? <Spinner size="sm" /> : tab === 'login' ? 'Se connecter' : "S'inscrire"}
              </Btn>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">SmartTutor © 2025 — Plateforme de tutorat collaboratif</p>
      </div>
    </div>
  )
}