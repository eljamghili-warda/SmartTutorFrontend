// AdminSeances.jsx - Version professionnelle Bleu/Doré
import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Spinner, EmptyState } from '../../components/UI'

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
  info: '#4A90E2',
}

const statutConfig = {
  PLANIFIEE: { color: C.warning, label: '⏳ Planifiée', bg: 'rgba(237,108,2,0.1)' },
  EN_COURS:  { color: C.info,    label: '▶ En cours',   bg: 'rgba(74,144,226,0.1)' },
  REALISEE:  { color: C.success, label: '✓ Réalisée',   bg: 'rgba(46,125,50,0.1)' },
  ANNULEE:   { color: C.danger,  label: '✕ Annulée',    bg: 'rgba(198,40,40,0.1)' },
}

export default function AdminSeances() {
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [selectedSeance, setSelectedSeance] = useState(null)

  useEffect(() => {
    adminAPI.getSeances().then(({ data }) => setSeances(data)).finally(() => setLoading(false))
  }, [])

  const filtered = seances.filter(s => filter === 'ALL' || s.statut === filter)

  const counts = {
    ALL: seances.length,
    PLANIFIEE: seances.filter(s => s.statut === 'PLANIFIEE').length,
    EN_COURS: seances.filter(s => s.statut === 'EN_COURS').length,
    REALISEE: seances.filter(s => s.statut === 'REALISEE').length,
    ANNULEE: seances.filter(s => s.statut === 'ANNULEE').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <Header title="Gestion des séances" subtitle="Suivi des sessions d'apprentissage" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
          {[
            { v: 'ALL', label: '📋 Toutes' },
            { v: 'PLANIFIEE', label: '⏳ Planifiées' },
            { v: 'EN_COURS', label: '▶ En cours' },
            { v: 'REALISEE', label: '✓ Réalisées' },
            { v: 'ANNULEE', label: '✕ Annulées' },
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

        {/* Contenu */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📅" title="Aucune séance" desc="Aucune séance dans cette catégorie" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((seance) => {
              const sc = statutConfig[seance.statut] || statutConfig.PLANIFIEE
              return (
                <div
                  key={seance.id}
                  style={{
                    background: C.surface,
                    border: `1px solid ${selectedSeance?.id === seance.id ? C.accent : C.border}`,
                    borderRadius: 20,
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    boxShadow: selectedSeance?.id === seance.id ? `0 4px 16px ${C.accent}20` : 'none',
                  }}
                  onClick={() => setSelectedSeance(selectedSeance?.id === seance.id ? null : seance)}
                >
                  {/* En-tête */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 24px',
                    background: selectedSeance?.id === seance.id ? `${C.accent}08` : 'transparent',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22,
                      }}>
                        📚
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                          {seance.titre}
                        </h3>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: C.textLight }}>
                          <span>🏠 {seance.salle_nom}</span>
                          <span>👨‍🏫 {seance.tuteur_nom || '—'}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: sc.bg, color: sc.color,
                      }}>
                        {sc.label}
                      </span>
                      <span style={{ fontSize: 13, color: C.textLight }}>
                        ⏱ {seance.duree} min
                      </span>
                      <span style={{ fontSize: 18, color: C.accent }}>
                        {selectedSeance?.id === seance.id ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Détails expansibles */}
                  {selectedSeance?.id === seance.id && (
                    <div style={{
                      padding: '20px 24px',
                      background: C.surfaceAlt,
                      borderTop: `1px solid ${C.border}`,
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                          <div style={{ fontSize: 11, color: C.textLight, marginBottom: 4 }}>📅 Date et heure</div>
                          <div style={{ fontWeight: 600, color: C.text }}>
                            {new Date(seance.date_debut).toLocaleDateString('fr-FR', {
                              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                            })}
                          </div>
                          <div style={{ color: C.accent, fontSize: 14, marginTop: 4 }}>
                            {new Date(seance.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: C.textLight, marginBottom: 4 }}>📋 Description</div>
                          <div style={{ color: C.textLight, fontSize: 13 }}>
                            {seance.description || 'Aucune description'}
                          </div>
                        </div>
                      </div>
                      {seance.matiere && (
                        <div style={{
                          marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}`,
                          fontSize: 12, color: C.accent,
                        }}>
                          📖 Matière: {seance.matiere}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}