// AdminTuteurs.jsx - Version professionnelle Bleu/Doré
import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Spinner, EmptyState, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const C = {
  bg: '#F5F0E6',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F6F0',
  border: '#E0D5C0',
  text: '#1A3A5C',
  textLight: '#6B7B8D',
  primary: '#2C5F8A',
  accent: '#C5A059',
  accentLight: '#E8D5A3',
  success: '#2E7D32',
  warning: '#ED6C02',
  danger: '#C62828',
  info: '#4A90E2',
}

const statutConfig = {
  PENDING:   { color: C.warning, label: '⏳ En attente', bg: 'rgba(237,108,2,0.1)' },
  ACTIVE:    { color: C.success, label: '✓ Validé',     bg: 'rgba(46,125,50,0.1)' },
  REJECTED:  { color: C.danger,  label: '✕ Refusé',     bg: 'rgba(198,40,40,0.1)' },
  SUSPENDED: { color: C.danger,  label: '🔒 Suspendu',  bg: 'rgba(198,40,40,0.1)' },
}

function Stars({ rating }) {
  const fullStars = Math.floor(rating || 0)
  const hasHalf = (rating % 1) >= 0.5
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{ color: i < fullStars ? C.accent : (i === fullStars && hasHalf ? C.accent : '#E0D5C0'), fontSize: 12 }}>
          {i < fullStars ? '★' : (i === fullStars && hasHalf ? '½' : '☆')}
        </span>
      ))}
      <span style={{ fontSize: 11, color: C.textLight, marginLeft: 6 }}>({rating?.toFixed(1) || '0'})</span>
    </div>
  )
}

export default function AdminTuteurs() {
  const [tuteurs, setTuteurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const { toasts, success, error } = useToast()

  useEffect(() => {
    adminAPI.getUtilisateurs({ role: 'tuteur' })
      .then(({ data }) => setTuteurs(data))
      .finally(() => setLoading(false))
  }, [])

  const valider = async (id, accepte) => {
    try {
      await adminAPI.validerTuteur(id, accepte)
      setTuteurs(prev => prev.map(t =>
        t.id === id ? { ...t, statut_tuteur: accepte ? 'ACTIVE' : 'REJECTED' } : t
      ))
      success(accepte ? '✅ Tuteur validé avec succès !' : 'Tuteur refusé.')
    } catch { error('Erreur lors de l\'action') }
  }

  const filtered = tuteurs.filter(t => filter === 'ALL' || t.statut_tuteur === filter)
  const counts = {
    ALL: tuteurs.length,
    PENDING: tuteurs.filter(t => t.statut_tuteur === 'PENDING').length,
    ACTIVE: tuteurs.filter(t => t.statut_tuteur === 'ACTIVE').length,
    REJECTED: tuteurs.filter(t => t.statut_tuteur === 'REJECTED').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <Header title="Gestion des tuteurs" subtitle="Validation et suivi des enseignants" />
      <ToastContainer toasts={toasts} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            { v: 'ALL', label: '📋 Tous' },
            { v: 'PENDING', label: '⏳ En attente' },
            { v: 'ACTIVE', label: '✓ Validés' },
            { v: 'REJECTED', label: '✕ Refusés' },
          ].map(f => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              style={{
                padding: '8px 18px', borderRadius: 30,
                fontSize: 13, fontWeight: 600,
                border: `1px solid ${filter === f.v ? C.accent : C.border}`,
                background: filter === f.v ? `${C.accent}15` : C.surface,
                color: filter === f.v ? C.accent : C.textLight,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {f.label}
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: filter === f.v ? `${C.accent}25` : '#E8E0D0',
                color: filter === f.v ? C.accent : C.textLight,
              }}>
                {counts[f.v]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="👨‍🏫" title="Aucun tuteur" desc="Aucun tuteur dans cette catégorie" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
            {filtered.map(t => {
              const sc = statutConfig[t.statut_tuteur] || statutConfig.PENDING
              return (
                <div
                  key={t.id}
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 20,
                    padding: '20px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = C.accent
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 8px 24px ${C.accent}20`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = C.border
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* En-tête */}
                  <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 16,
                      background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 700, color: '#fff',
                    }}>
                      {t.prenom?.[0]}{t.nom?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                          {t.prenom} {t.nom}
                        </h3>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                          background: sc.bg, color: sc.color,
                        }}>
                          {sc.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>{t.email}</p>
                      <Stars rating={t.note_moyenne || 0} />
                    </div>
                  </div>

                  {/* Spécialités */}
                  {(t.specialites || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      {t.specialites.map(s => (
                        <span key={s} style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 11,
                          background: `${C.accent}15`, color: C.accent,
                          border: `1px solid ${C.accent}30`,
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Date d'inscription */}
                  <p style={{ fontSize: 11, color: C.textLight, marginBottom: 16 }}>
                    Inscrit le {new Date(t.date_inscription).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>

                  {/* Actions */}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                    {t.statut_tuteur === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => valider(t.id, true)}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 12, border: 'none',
                            background: C.success, color: '#fff', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          ✓ Valider
                        </button>
                        <button
                          onClick={() => valider(t.id, false)}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 12, border: `1px solid ${C.danger}`,
                            background: 'transparent', color: C.danger, fontSize: 12, fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          ✕ Refuser
                        </button>
                      </div>
                    )}
                    {t.statut_tuteur === 'ACTIVE' && (
                      <button
                        onClick={() => valider(t.id, false)}
                        style={{
                          width: '100%', padding: '10px', borderRadius: 12, border: `1px solid ${C.warning}`,
                          background: 'transparent', color: C.warning, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Révoquer la validation
                      </button>
                    )}
                    {t.statut_tuteur === 'REJECTED' && (
                      <button
                        onClick={() => valider(t.id, true)}
                        style={{
                          width: '100%', padding: '10px', borderRadius: 12, border: 'none',
                          background: C.success, color: '#fff', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Valider quand même
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}