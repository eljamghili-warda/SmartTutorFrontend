// AdminSalles.jsx - Version avec thème Bleu/Doré
import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Spinner, EmptyState, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

// Palette SmartEdu
const C = {
  bg: '#F5F0E6',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F6F0',
  border: '#E0D5C0',
  borderGold: '#C5A059',
  text: '#1A3A5C',
  textLight: '#6B7B8D',
  primary: '#2C5F8A',
  accent: '#C5A059',
  accentLight: '#E8D5A3',
  success: '#2E7D32',
  warning: '#ED6C02',
  danger: '#C62828',
}

const statutConfig = {
  ACTIVE_AVEC_TUTEUR:  { color: C.success, label: '👨‍🏫 Avec tuteur', bg: 'rgba(46,125,50,0.1)' },
  ACTIVE_SANS_TUTEUR:  { color: C.primary, label: '📚 Sans tuteur', bg: 'rgba(44,95,138,0.1)' },
  HORS_LIGNE:          { color: C.warning, label: '💤 Hors ligne', bg: 'rgba(237,108,2,0.1)' },
  FERMEE:              { color: C.danger,  label: '🔴 Fermée', bg: 'rgba(198,40,40,0.1)' },
}

export default function AdminSalles() {
  const [salles, setSalles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [selectedSalle, setSelectedSalle] = useState(null)
  const { toasts, success, error } = useToast()

  useEffect(() => {
    adminAPI.getSalles().then(({ data }) => setSalles(data)).finally(() => setLoading(false))
  }, [])

  const fermer = async (id) => {
    if (!confirm('Forcer la fermeture de cette salle ?')) return
    try {
      await adminAPI.fermerSalle(id)
      setSalles(prev => prev.map(s => s.id === id ? { ...s, statut: 'FERMEE' } : s))
      success('Salle fermée avec succès.')
    } catch { error('Erreur lors de la fermeture') }
  }

  const filtered = salles.filter(s => filter === 'ALL' || s.statut === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <Header title="Gestion des salles" subtitle="Administration des espaces d'apprentissage" />
      <ToastContainer toasts={toasts} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
          {[
            { v: 'ALL', label: '📋 Toutes' },
            { v: 'ACTIVE_AVEC_TUTEUR', label: '👨‍🏫 Avec tuteur' },
            { v: 'ACTIVE_SANS_TUTEUR', label: '📚 Sans tuteur' },
            { v: 'FERMEE', label: '🔒 Fermées' },
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
              }}
            >
              {f.label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: C.textLight }}>
            {filtered.length} salle{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Liste des salles */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🏠" title="Aucune salle" desc="Aucune salle ne correspond à ce filtre" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((salle) => (
              <div
                key={salle.id}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 20,
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedSalle(selectedSalle?.id === salle.id ? null : salle)}
              >
                {/* En-tête de la salle */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '18px 24px',
                  background: selectedSalle?.id === salle.id ? `${C.accent}08` : 'transparent',
                  borderBottom: selectedSalle?.id === salle.id ? `1px solid ${C.border}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24,
                    }}>
                      🏠
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                        {salle.nom}
                      </h3>
                      {salle.matiere && (
                        <span style={{
                          fontSize: 12, color: C.accent, background: `${C.accent}10`,
                          padding: '2px 10px', borderRadius: 20,
                        }}>
                          📖 {salle.matiere}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: statutConfig[salle.statut]?.bg || `${C.primary}10`,
                      color: statutConfig[salle.statut]?.color || C.primary,
                    }}>
                      {statutConfig[salle.statut]?.label || salle.statut}
                    </span>
                    <span style={{ fontSize: 13, color: C.textLight }}>
                      👥 {salle.nb_participants} participants
                    </span>
                    {salle.statut !== 'FERMEE' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); fermer(salle.id) }}
                        style={{
                          padding: '6px 14px', borderRadius: 10, border: `1px solid ${C.danger}`,
                          background: 'transparent', color: C.danger, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Fermer
                      </button>
                    )}
                    <span style={{ fontSize: 18, color: C.accent }}>
                      {selectedSalle?.id === salle.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Détail de la salle avec participants */}
                {selectedSalle?.id === salle.id && (
                  <div style={{ padding: '20px 24px', background: C.surfaceAlt }}>
                    <div style={{ marginBottom: 20 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>
                        👨‍🏫 Tuteur
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 50,
                          background: `linear-gradient(135deg, ${C.accent}, ${C.primary})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontWeight: 700, color: '#fff',
                        }}>
                          {salle.tuteur_nom?.[0] || 'T'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: C.text }}>{salle.tuteur_nom || 'Non assigné'}</div>
                          <div style={{ fontSize: 12, color: C.textLight }}>{salle.tuteur_email || ''}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>
                        🎓 Participants ({salle.nb_participants})
                      </h4>
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: 12, maxHeight: 300, overflowY: 'auto',
                      }}>
                        {/* Liste des participants - à remplacer par vos données réelles */}
                        {salle.participants?.length > 0 ? (
                          salle.participants.map(p => (
                            <div key={p.id} style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '10px 14px', background: C.surface,
                              border: `1px solid ${C.border}`, borderRadius: 12,
                            }}>
                              <div style={{
                                width: 40, height: 40, borderRadius: 50,
                                background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 700, color: '#fff',
                              }}>
                                {p.prenom?.[0]}{p.nom?.[0]}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>
                                  {p.prenom} {p.nom}
                                </div>
                                <div style={{ fontSize: 10, color: C.textLight }}>{p.email}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ color: C.textLight, padding: 20, textAlign: 'center' }}>
                            Aucun participant pour le moment
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}