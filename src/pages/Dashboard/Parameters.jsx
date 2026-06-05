import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, FormGroup, Avatar, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const NIVEAUX = ['Licence 1','Licence 2','Licence 3','Master 1','Master 2','Doctorat','BTS','BUT','Prépa']

// Styles inline pour garantir la lisibilité
const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #E0D5C0',
  background: '#FFFFFF',
  color: '#1A3A5C',
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s',
  fontFamily: 'inherit',
}

const selectStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #E0D5C0',
  background: '#FFFFFF',
  color: '#1A3A5C',
  fontSize: '14px',
  outline: 'none',
  cursor: 'pointer',
}

const textareaStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #E0D5C0',
  background: '#FFFFFF',
  color: '#1A3A5C',
  fontSize: '14px',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#6B7B8D',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  display: 'block',
  marginBottom: '6px',
}

export default function Parametres() {
  const { user, updateUser } = useAuth()
  const { toasts, success, error } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    prenom:       user?.prenom       || '',
    nom:          user?.nom          || '',
    niveauEtude:  user?.niveau_etude || '',
    filiere:      user?.filiere      || '',
    etablissement:user?.etablissement|| '',
    specialites:  (user?.specialites || []).join(', '),
    biographie:   user?.biographie   || '',
    rib:          user?.rib          || '',
    nomBanque:    user?.nom_banque   || '',
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = { ...form }
      if (user.role === 'tuteur') {
        payload.specialites = form.specialites.split(',').map(s => s.trim()).filter(Boolean)
      }
      await authAPI.updateProfile(payload)
      updateUser({ prenom: form.prenom, nom: form.nom })
      success('Profil mis à jour !')
    } catch (err) {
      error(err.response?.data?.error || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F5F0E6' }}>
      <Header title="Paramètres" subtitle="Gérez votre profil" />
      <ToastContainer toasts={toasts} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Profile preview */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8D5A3', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(26,58,92,0.05)' }}>
            <Avatar user={user} size="xl" />
            <div>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#1A3A5C', margin: 0 }}>{user?.prenom} {user?.nom}</p>
              <p style={{ fontSize: '13px', color: '#C5A059', fontWeight: 600, marginTop: '4px', textTransform: 'capitalize' }}>{user?.role}</p>
              <p style={{ fontSize: '12px', color: '#6B7B8D', marginTop: '2px' }}>{user?.email}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1px solid #E8D5A3', borderRadius: '16px', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 8px rgba(26,58,92,0.05)' }}>
            
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A3A5C', marginBottom: '4px' }}>Informations personnelles</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Prénom</label>
                <input 
                  value={form.prenom} 
                  onChange={set('prenom')}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#E0D5C0'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Nom</label>
                <input 
                  value={form.nom} 
                  onChange={set('nom')}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#E0D5C0'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input 
                value={user?.email} 
                disabled 
                style={{ ...inputStyle, background: '#F5F0E6', color: '#6B7B8D', cursor: 'not-allowed' }}
              />
            </div>

            {user?.role === 'etudiant' && (
              <>
                <div>
                  <label style={labelStyle}>Niveau d'étude</label>
                  <select 
                    value={form.niveauEtude} 
                    onChange={set('niveauEtude')}
                    style={selectStyle}
                    onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#E0D5C0'; e.target.style.boxShadow = 'none' }}
                  >
                    <option value="">Sélectionner...</option>
                    {NIVEAUX.map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Filière</label>
                  <input 
                    value={form.filiere} 
                    onChange={set('filiere')} 
                    placeholder="ex: Informatique"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#E0D5C0'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Établissement</label>
                  <input 
                    value={form.etablissement} 
                    onChange={set('etablissement')} 
                    placeholder="ex: Université Ibn Tofail"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#E0D5C0'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </>
            )}

            {user?.role === 'tuteur' && (
              <>
                <div>
                  <label style={labelStyle}>Spécialités</label>
                  <input 
                    value={form.specialites} 
                    onChange={set('specialites')} 
                    placeholder="ex: Maths, Physique, Informatique"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#E0D5C0'; e.target.style.boxShadow = 'none' }}
                  />
                  <p style={{ fontSize: '10px', color: '#6B7B8D', marginTop: '4px' }}>Séparées par des virgules</p>
                </div>
                <div>
                  <label style={labelStyle}>Biographie</label>
                  <textarea 
                    rows={4} 
                    value={form.biographie} 
                    onChange={set('biographie')} 
                    placeholder="Décrivez votre parcours et vos expertises..."
                    style={textareaStyle}
                    onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#E0D5C0'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                {/* Section coordonnées bancaires */}
                <div style={{ borderTop: '1px solid #E8D5A3', paddingTop: '16px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '18px' }}>🏦</span>
                    <h4 style={{ fontWeight: 700, color: '#1A3A5C', fontSize: '14px', margin: 0 }}>Coordonnées bancaires</h4>
                    <span style={{ fontSize: '11px', color: '#6B7B8D' }}>pour recevoir vos paiements</span>
                  </div>

                  {(!form.rib) && (
                    <div style={{ background: '#F8F3E6', border: '1px solid #E8D5A3', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
                      <p style={{ fontSize: '12px', color: '#8B6914', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>⚠️</span> Sans RIB, vous ne recevrez pas les virements automatiques après paiement.
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>RIB (24 chiffres)</label>
                      <input
                        value={form.rib}
                        onChange={set('rib')}
                        placeholder="MA76000000000000000000000"
                        maxLength={34}
                        style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.5px' }}
                        onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.1)' }}
                        onBlur={e => { e.target.style.borderColor = '#E0D5C0'; e.target.style.boxShadow = 'none' }}
                      />
                      <p style={{ fontSize: '10px', color: '#6B7B8D', marginTop: '4px' }}>ex: MA76 0000 0000 0000 0000 0000</p>
                    </div>
                    <div>
                      <label style={labelStyle}>Banque</label>
                      <select 
                        value={form.nomBanque} 
                        onChange={set('nomBanque')}
                        style={selectStyle}
                        onFocus={e => { e.target.style.borderColor = '#C5A059'; e.target.style.boxShadow = '0 0 0 3px rgba(197,160,89,0.1)' }}
                        onBlur={e => { e.target.style.borderColor = '#E0D5C0'; e.target.style.boxShadow = 'none' }}
                      >
                        <option value="">— Sélectionner —</option>
                        <option value="CIH Bank">CIH Bank</option>
                        <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                        <option value="Banque Populaire">Banque Populaire</option>
                        <option value="BMCE Bank">BMCE Bank (Bank of Africa)</option>
                        <option value="BMCI">BMCI</option>
                        <option value="Société Générale Maroc">Société Générale Maroc</option>
                        <option value="Crédit Agricole du Maroc">Crédit Agricole du Maroc</option>
                        <option value="Al Barid Bank">Al Barid Bank</option>
                        <option value="CFG Bank">CFG Bank</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                  </div>

                  {form.rib && (
                    <div style={{ fontSize: '11px', color: '#6B7B8D', marginTop: '12px', fontFamily: 'monospace', background: '#F5F0E6', padding: '8px 12px', borderRadius: '8px' }}>
                      Aperçu : {form.rib.slice(0, 4)} **** **** {form.rib.slice(-4)} {form.nomBanque && `· ${form.nomBanque}`}
                    </div>
                  )}
                </div>
              </>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '40px',
                border: 'none',
                background: loading ? '#E8D5A3' : 'linear-gradient(135deg, #1A3A5C, #2C5F8A)',
                color: loading ? '#6B7B8D' : '#FFFFFF',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(26,58,92,0.25)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {loading ? <Spinner size="sm" /> : '💾 Enregistrer les modifications'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}