import React, { useEffect, useState } from 'react'
import { examensAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Spinner, EmptyState } from '../../components/UI'

// ─── PALETTE DE COULEURS SMARTEDU (Bleu + Marron/Doré) ─────────────
const COLORS = {
  // Bleus professionnels
  blueDeep: '#1A3A5C',    // Bleu profond - titres principaux
  blueSky: '#4A90E2',     // Bleu ciel - accents modernes
  blueDark: '#0F2A3B',    // Bleu nuit - textes importants
  blueLight: '#D6E6F5',   // Bleu très clair - fonds subtils
  blueMid: '#2C5F8A',     // Bleu moyen - éléments secondaires
  blueGradient: 'linear-gradient(135deg, #1A3A5C 0%, #2C5F8A 60%, #4A90E2 100%)',
  
  // Doré / Marron (prestige et chaleur)
  gold: '#C5A059',        // Doré principal
  goldLight: '#E8D5A3',   // Doré clair
  goldDark: '#8B6914',    // Doré foncé / marron doré
  brown: '#8B6914',       // Marron doré
  brownLight: '#A0894A',  // Marron clair
  
  // Neutres
  pageBg: '#F5F0E6',      // Ivoire élégant (fond)
  white: '#FFFFFF',
  gray: '#6B7B8D',        // Gris bleuté
  grayLight: '#B0C4DE',
  success: '#2E7D32',
  error: '#C62828',
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric'
}) : '—'

const fmtExpiry = (d) => {
  if (!d) return '—'
  const exp = new Date(d)
  exp.setFullYear(exp.getFullYear() + 2)
  return exp.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// Composant pour la médaille de score
function ScoreMedal({ score }) {
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  
  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Cercle de fond */}
        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5"/>
        {/* Cercle de progression - or */}
        <circle 
          cx="40" cy="40" r={radius} 
          fill="none" 
          stroke={COLORS.gold}
          strokeWidth="5"
          strokeDasharray={`${progress} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />
      </svg>
      {/* Centre */}
      <div style={{
        position: 'absolute', inset: 12,
        background: COLORS.white, borderRadius: '50%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(26,58,92,0.15)'
      }}>
        <span style={{ fontSize: 16, fontWeight: 900, color: COLORS.blueDeep, lineHeight: 1 }}>
          {Math.round(score)}%
        </span>
        <span style={{ fontSize: 7, color: COLORS.gold, fontWeight: 600, letterSpacing: 0.5 }}>SCORE</span>
      </div>
    </div>
  )
}

function CertificatCard({ cert }) {
  const [copie, setCopie] = useState(false)
  const [downloading, setDownload] = useState(false)

  const nomEtudiant = (cert.etudiant_prenom || cert.prenom || '')
    + ' ' + (cert.etudiant_nom || cert.nom || '')
  const score = parseFloat(cert.score_obtenu) || 0

  const copierNumero = () => {
    navigator.clipboard.writeText(cert.numero_certificat)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  const handleDownload = async () => {
    setDownload(true)
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const res = await fetch(`/api/certificats/telecharger/${cert.numero_certificat}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Certificat-SmartEdu-${cert.numero_certificat}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('PDF non disponible. Réessayez plus tard.')
    } finally {
      setDownload(false)
    }
  }

  const handleLinkedIn = () => {
    const base = window.location.origin
    const verify = `${base}/api/certificats/verifier/${cert.numero_certificat}`
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME`
      + `&name=${encodeURIComponent(cert.examen_titre)}`
      + `&organizationName=${encodeURIComponent('SmartEdu')}`
      + `&certUrl=${encodeURIComponent(verify)}`
      + `&certId=${encodeURIComponent(cert.numero_certificat)}`
    window.open(url, '_blank')
  }

  return (
    <div style={{
      background: COLORS.white,
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(26,58,92,0.12)',
      border: `1px solid ${COLORS.goldLight}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(26,58,92,0.2)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,58,92,0.12)'
    }}>
      
      {/* HEADER - Dégradé bleu profond + or */}
      <div style={{
        background: COLORS.blueGradient,
        padding: '20px 20px 56px 20px',
        position: 'relative',
      }}>
        {/* Badge médaille de score */}
        <div style={{ position: 'absolute', right: 16, top: 16 }}>
          <ScoreMedal score={score} />
          <span style={{
            fontSize: 9, color: COLORS.goldLight, fontWeight: 700,
            letterSpacing: 1.5, display: 'block', textAlign: 'center', marginTop: 6
          }}>✓ CERTIFIÉ</span>
        </div>

        {/* Contenu texte */}
        <div style={{ paddingRight: 96 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              fontSize: 8, color: COLORS.gold, fontWeight: 700,
              letterSpacing: 2, textTransform: 'uppercase',
              background: 'rgba(197,160,89,0.15)',
              padding: '2px 10px',
              borderRadius: 20,
            }}>
              SmartEdu Academy
            </span>
          </div>
          <h3 style={{
            fontSize: 16, fontWeight: 800, color: COLORS.white,
            lineHeight: 1.3, margin: 0, letterSpacing: -0.3
          }}>
            {cert.examen_titre}
          </h3>
          {cert.salle_nom && (
            <p style={{ fontSize: 11, color: COLORS.goldLight, marginTop: 6, opacity: 0.9 }}>
              {cert.salle_nom}
            </p>
          )}
        </div>
        
        {/* Élément décoratif - coin doré */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          width: 40, height: 40,
          borderRight: `2px solid ${COLORS.gold}`,
          borderBottom: `2px solid ${COLORS.gold}`,
          borderRadius: '0 0 8px 0',
        }} />
      </div>

      {/* CORPS - Ivoire */}
      <div style={{ padding: '0 18px 18px', marginTop: -28, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Carte flottante étudiant */}
        <div style={{
          background: COLORS.white,
          borderRadius: 16,
          border: `1px solid ${COLORS.goldLight}`,
          boxShadow: '0 4px 12px rgba(26,58,92,0.08)',
          padding: '16px 16px 12px',
        }}>
          {/* Nom étudiant avec décoration */}
          <div style={{ textAlign: 'center', paddingBottom: 12, borderBottom: `1px solid ${COLORS.goldLight}`, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 2, background: COLORS.gold,
              margin: '0 auto 10px auto', borderRadius: 2
            }} />
            <p style={{ fontSize: 9, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
              Décerné à
            </p>
            <p style={{
              fontSize: 20, fontWeight: 800, 
              background: `linear-gradient(135deg, ${COLORS.blueDeep} 0%, ${COLORS.blueMid} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              {nomEtudiant.trim() || 'Étudiant'}
            </p>
            <div style={{
              width: 60, height: 2, background: COLORS.goldLight,
              margin: '8px auto 0 auto', borderRadius: 2
            }} />
          </div>

          {/* Grille informations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
            {[
              { lbl: 'Instructeur certifié', val: `${cert.tuteur_prenom || ''} ${cert.tuteur_nom || ''}`.trim(), icon: '👨‍🏫' },
              { lbl: "Date d'émission", val: fmtDate(cert.date_emission), icon: '📅' },
              { lbl: "Validité", val: fmtExpiry(cert.date_emission), icon: '⏰' },
              { lbl: 'Statut', val: cert.est_valide, isStatut: true, icon: '✓' },
            ].map(({ lbl, val, isStatut, icon }) => (
              <div key={lbl}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <span style={{ fontSize: 10 }}>{icon}</span>
                  <p style={{ fontSize: 8.5, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 1.2, margin: 0 }}>{lbl}</p>
                </div>
                {isStatut ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 700,
                    padding: '3px 10px', borderRadius: 20,
                    background: val ? '#E8F5E9' : '#FFEBEE',
                    color: val ? COLORS.success : COLORS.error,
                    border: `1px solid ${val ? '#A5D6A7' : '#EF9A9A'}`,
                  }}>
                    {val ? '✓ Valide' : '✗ Révoqué'}
                  </span>
                ) : (
                  <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.blueDeep, margin: 0 }}>
                    {val || '—'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Série ID avec fond doré clair */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${COLORS.goldLight}15, ${COLORS.white})`,
          border: `1px solid ${COLORS.goldLight}`,
          borderRadius: 12, padding: '10px 14px',
        }}>
          <div>
            <p style={{ fontSize: 8.5, color: COLORS.goldDark, textTransform: 'uppercase', letterSpacing: 1.2, margin: '0 0 2px' }}>
              🔑 Certificat ID
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: COLORS.blueDeep, margin: 0 }}>
              {cert.numero_certificat}
            </p>
          </div>
          <button onClick={copierNumero} style={{
            fontSize: 11, fontWeight: 600, color: copie ? COLORS.success : COLORS.goldDark,
            background: copie ? '#E8F5E9' : `${COLORS.goldLight}30`,
            border: `1px solid ${copie ? '#A5D6A7' : COLORS.goldLight}`,
            borderRadius: 8, padding: '5px 12px', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {copie ? '✓ Copié' : '⎘ Copier'}
          </button>
        </div>

        {/* Boutons actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Télécharger PDF */}
          <button onClick={handleDownload} disabled={downloading} style={{
            width: '100%', padding: '12px', borderRadius: 12, border: 'none',
            background: downloading ? COLORS.blueLight : COLORS.blueGradient,
            color: COLORS.white, fontSize: 13, fontWeight: 700, cursor: downloading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: `0 4px 12px ${COLORS.blueDeep}40`,
            transition: 'all 0.2s',
          }}>
            {downloading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ⏳ Génération...
              </>
            ) : (
              '⬇ Télécharger le certificat (PDF)'
            )}
          </button>

          {/* LinkedIn + Vérifier */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={handleLinkedIn} style={{
              padding: '10px', borderRadius: 12, border: 'none',
              background: '#0A66C2', color: COLORS.white,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.2s',
            }}>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </button>

            <a href={`/api/certificats/verifier/${cert.numero_certificat}`}
              target="_blank" rel="noreferrer" style={{
              padding: '10px', borderRadius: 12,
              border: `1.5px solid ${COLORS.goldLight}`, background: COLORS.white,
              color: COLORS.blueDeep, fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              🔍 Vérifier
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function MesCertificats() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    examensAPI.mesCertificats()
      .then(({ data }) => setCerts(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      background: COLORS.pageBg 
    }}>
      <Header title="Mes Certificats" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <Spinner />
          </div>
        ) : certs.length === 0 ? (
          <EmptyState 
            icon="🎓" 
            title="Aucun certificat"
            desc="Réussissez un examen pour obtenir votre premier certificat SmartEdu." 
          />
        ) : (
          <>
            {/* En-tête avec compteur élégant */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{
                background: COLORS.white,
                borderLeft: `4px solid ${COLORS.gold}`,
                borderRadius: 12,
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 2px 8px rgba(26,58,92,0.08)'
              }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: COLORS.blueDeep }}>
                  {certs.length}
                </span>
                <div>
                  <span style={{ fontSize: 13, color: COLORS.blueDeep, fontWeight: 600 }}>
                    certificat{certs.length > 1 ? 's' : ''}
                  </span>
                  <p style={{ fontSize: 11, color: COLORS.gray, margin: 0 }}>
                    obtenu{certs.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: COLORS.gray
              }}>
                <span>🏆</span>
                <span>Partagez vos réussites sur LinkedIn</span>
                <span>✨</span>
              </div>
            </div>

            {/* Grille de certificats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 24,
            }}>
              {certs.map(cert => <CertificatCard key={cert.id} cert={cert} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}