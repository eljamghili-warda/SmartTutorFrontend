// AdminRevenus.jsx - Version professionnelle Bleu/Doré
import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Spinner } from '../../components/UI'
import Header from '../../components/Header/Header'

// Palette SmartEdu (Bleu + Doré)
const C = {
  bg: '#F5F0E6',
  surface: '#FFFFFF',
  border: '#E0D5C0',
  text: '#1A3A5C',
  muted: '#6B7B8D',
  primary: '#2C5F8A',
  accent: '#C5A059',
  accentLight: '#E8D5A3',
  success: '#2E7D32',
  warning: '#ED6C02',
  danger: '#C62828',
}

const BAR_COLORS = [C.primary, C.accent, '#4A90E2', '#A0894A', '#2C5F8A', '#C5A059']

export default function AdminRevenus() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    adminAPI.getRevenus()
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <>
      <Header title="Finances" />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: C.bg }}>
        <Spinner />
      </div>
    </>
  )

  const { totaux, parMois, parMethode, topTuteurs, parMatiere } = data || {}
  const maxMois = Math.max(...(parMois?.map(m => parseFloat(m.commissions || 0)) || [1]), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <Header title="Finances & Revenus" subtitle="Vue financière complète" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

        {/* En-tête */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            width: 50, height: 4, background: C.accent, borderRadius: 2, marginBottom: 12
          }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>
            📊 Revenus & Statistiques
          </h2>
          <p style={{ color: C.muted, fontSize: 13 }}>Vue financière complète de la plateforme SmartEdu</p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 32 }}>
          {[
            { label: 'Volume total', value: `${parseFloat(totaux?.total_paiements || 0).toFixed(0)} DH`, icon: '💰', color: C.primary, sub: `${totaux?.nb_paiements || 0} transactions` },
            { label: 'Commission plateforme', value: `${parseFloat(totaux?.total_commissions || 0).toFixed(0)} DH`, icon: '🏦', color: C.accent, sub: '15% par séance' },
            { label: 'Reversé tuteurs', value: `${parseFloat(totaux?.total_tuteurs || 0).toFixed(0)} DH`, icon: '👨‍🏫', color: C.success, sub: '85% par séance' },
            { label: 'Remboursements', value: `${parseFloat(totaux?.total_rembourse || 0).toFixed(0)} DH`, icon: '↩️', color: C.warning, sub: `${totaux?.nb_remboursements || 0} annulations` },
          ].map(k => (
            <div key={k.label} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{k.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{k.label}</div>
              <div style={{ fontSize: 11, color: C.muted, opacity: 0.7 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 6, background: C.surface, padding: 6,
          borderRadius: 14, border: `1px solid ${C.border}`, width: 'fit-content', marginBottom: 24
        }}>
          {[
            ['overview', '📈 Vue générale'],
            ['tuteurs', '👨‍🏫 Top tuteurs'],
            ['matieres', '📚 Par matière']
          ].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              background: tab === id ? C.accent : 'transparent',
              color: tab === id ? '#fff' : C.muted,
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Contenu des tabs */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Graphique mensuel */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 20, padding: 24, gridColumn: '1/-1'
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                📅 Commissions par mois
              </h3>
              {!parMois?.length ? (
                <p style={{ color: C.muted, textAlign: 'center' }}>Aucune donnée</p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
                  {parMois.map((m, i) => {
                    const val = parseFloat(m.commissions || 0)
                    const height = Math.max(30, (val / maxMois) * 130)
                    return (
                      <div key={m.mois} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>{val.toFixed(0)}</div>
                        <div style={{
                          width: '100%', height, borderRadius: '6px 6px 0 0',
                          background: BAR_COLORS[i % BAR_COLORS.length],
                          transition: 'height 0.5s',
                        }} />
                        <div style={{ fontSize: 10, color: C.muted }}>{m.mois?.slice(5)}/{m.mois?.slice(2, 4)}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Par méthode de paiement */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>💳 Méthodes de paiement</h3>
              {!parMethode?.length ? (
                <p style={{ color: C.muted }}>Aucune donnée</p>
              ) : (
                parMethode.map((m, i) => (
                  <div key={m.methode} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${BAR_COLORS[i]}15`, border: `1px solid ${BAR_COLORS[i]}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>
                      {m.methode === 'PAYPAL' ? '🅿️' : '🏦'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: C.text }}>{m.methode}</div>
                      <div style={{ height: 6, borderRadius: 3, background: '#E8E0D0', marginTop: 6 }}>
                        <div style={{
                          height: '100%', borderRadius: 3, background: BAR_COLORS[i],
                          width: `${(m.nb / (parMethode[0]?.nb || 1)) * 100}%`
                        }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: BAR_COLORS[i] }}>{parseFloat(m.volume || 0).toFixed(0)} DH</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{m.nb} tx</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Répartition */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>📊 Répartition des revenus</h3>
              {parseFloat(totaux?.total_paiements || 0) === 0 ? (
                <p style={{ color: C.muted }}>Aucune donnée</p>
              ) : (
                <>
                  <div style={{ height: 20, borderRadius: 10, background: '#E8E0D0', overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{
                      width: `${(totaux.total_tuteurs / totaux.total_paiements) * 100}%`,
                      height: '100%', background: C.success, float: 'left',
                    }} />
                    <div style={{
                      width: `${(totaux.total_commissions / totaux.total_paiements) * 100}%`,
                      height: '100%', background: C.accent, float: 'left',
                    }} />
                  </div>
                  {[
                    ['Tuteurs (85%)', C.success, `${parseFloat(totaux.total_tuteurs || 0).toFixed(0)} DH`],
                    ['Plateforme (15%)', C.accent, `${parseFloat(totaux.total_commissions || 0).toFixed(0)} DH`],
                  ].map(([l, c, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                        <span style={{ color: C.muted }}>{l}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: c }}>{v}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab Top Tuteurs */}
        {tab === 'tuteurs' && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: C.accent, margin: 0 }}>🏆 Classement des tuteurs</h3>
            </div>
            {!topTuteurs?.length ? (
              <p style={{ textAlign: 'center', padding: 40, color: C.muted }}>Aucune donnée</p>
            ) : (
              topTuteurs.map((t, i) => (
                <div key={t.email} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 24px', borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: i < 3 ? `${C.accent}20` : `${C.primary}10`,
                    border: `1px solid ${i < 3 ? C.accent : C.primary}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 16, color: i < 3 ? C.accent : C.primary,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: C.text }}>{t.prenom} {t.nom}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{t.email} · {t.nb_seances} séance(s)</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: C.accent }}>{parseFloat(t.total_gains || 0).toFixed(0)} DH</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Volume: {parseFloat(t.volume_total || 0).toFixed(0)} DH</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Par matière */}
        {tab === 'matieres' && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: C.accent, margin: 0 }}>📚 Revenus par matière</h3>
            </div>
            {!parMatiere?.length ? (
              <p style={{ textAlign: 'center', padding: 40, color: C.muted }}>Aucune donnée</p>
            ) : (
              parMatiere.map((m, i) => {
                const pct = Math.min(100, (m.volume / parMatiere[0].volume) * 100)
                return (
                  <div key={m.matiere} style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, color: C.text }}>{m.matiere}</span>
                      <div>
                        <span style={{ fontWeight: 800, color: C.accent }}>{parseFloat(m.volume || 0).toFixed(0)} DH</span>
                        <span style={{ fontSize: 12, color: C.muted, marginLeft: 12 }}>· {m.nb_seances} séance(s)</span>
                      </div>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: '#E8E0D0' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        background: BAR_COLORS[i % BAR_COLORS.length],
                        width: `${pct}%`, transition: 'width 0.6s'
                      }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}