import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Spinner } from '../../components/UI'

const BAR_COLORS = ['#7c3aed','#4f46e5','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6']

export default function AdminRevenus() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('overview')   // overview | paiements | tuteurs

  useEffect(() => {
    adminAPI.getRevenus()
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center py-24"><Spinner /></div>
  )
  if (!data) return <p style={{ color: '#f87171', textAlign: 'center' }}>Erreur de chargement</p>

  const { totaux, parMois, parMethode, topTuteurs, parMatiere } = data

  // Calcul échelle barre graphique
  const maxMois = Math.max(...parMois.map(m => parseFloat(m.commissions || 0)), 1)

  return (
    <div style={{ padding: '0' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 4 }}>📊 Revenus & Statistiques</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>Vue financière complète de la plateforme</p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Volume total', value: `${parseFloat(totaux.total_paiements || 0).toFixed(0)} DH`, icon: '💳', color: '#7c3aed', sub: `${totaux.nb_paiements} transactions` },
          { label: 'Commission plateforme', value: `${parseFloat(totaux.total_commissions || 0).toFixed(0)} DH`, icon: '🏦', color: '#10b981', sub: '15% par séance' },
          { label: 'Reversé tuteurs', value: `${parseFloat(totaux.total_tuteurs || 0).toFixed(0)} DH`, icon: '👨‍🏫', color: '#3b82f6', sub: '85% par séance' },
          { label: 'Remboursements', value: `${parseFloat(totaux.total_rembourse || 0).toFixed(0)} DH`, icon: '↩️', color: '#f59e0b', sub: `${totaux.nb_remboursements} annulations` },
        ].map(k => (
          <div key={k.label} style={{ background: '#1a1a2e', border: '1px solid #2d2d4a', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.color, marginBottom: 3 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, marginBottom: 2 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: '#475569' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#1a1a2e', padding: 4, borderRadius: 12, border: '1px solid #2d2d4a', marginBottom: 24, width: 'fit-content' }}>
        {[['overview','📈 Vue générale'],['tuteurs','👨‍🏫 Top tuteurs'],['matieres','📚 Par matière']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === id ? '#7c3aed' : 'transparent',
            color: tab === id ? '#fff' : '#64748b',
            transition: 'all 0.2s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB : Vue générale ── */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Graphique bar : commissions par mois */}
          <div style={{ background: '#1a1a2e', border: '1px solid #2d2d4a', borderRadius: 14, padding: 20, gridColumn: '1/-1' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 20 }}>📅 Commissions par mois (12 derniers mois)</h3>
            {parMois.length === 0 ? (
              <p style={{ color: '#475569', textAlign: 'center', fontSize: 13 }}>Aucune donnée</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140 }}>
                {parMois.map((m, i) => {
                  const h = Math.max(4, (parseFloat(m.commissions || 0) / maxMois) * 120)
                  return (
                    <div key={m.mois} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700 }}>{parseFloat(m.commissions || 0).toFixed(0)}</div>
                      <div style={{ width: '100%', height: h, borderRadius: '4px 4px 0 0', background: BAR_COLORS[i % BAR_COLORS.length], opacity: 0.85, transition: 'height 0.5s', minHeight: 4 }} />
                      <div style={{ fontSize: 9, color: '#475569', whiteSpace: 'nowrap' }}>{m.mois?.slice(5)}/{m.mois?.slice(2,4)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Par méthode */}
          <div style={{ background: '#1a1a2e', border: '1px solid #2d2d4a', borderRadius: 14, padding: 20 }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>💳 Méthodes de paiement</h3>
            {parMethode.length === 0 ? <p style={{ color: '#475569', fontSize: 13 }}>Aucune donnée</p> : (
              parMethode.map((m, i) => (
                <div key={m.methode} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${BAR_COLORS[i]}22`, border: `1px solid ${BAR_COLORS[i]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {m.methode === 'PAYPAL' ? '🅿️' : '🏦'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{m.methode}</div>
                    <div style={{ height: 4, borderRadius: 2, background: '#2d2d4a', marginTop: 4 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: BAR_COLORS[i], width: `${Math.min(100, (m.nb / (parMethode[0]?.nb || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BAR_COLORS[i] }}>{parseFloat(m.volume || 0).toFixed(0)} DH</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{m.nb} tx</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ratio commission */}
          <div style={{ background: '#1a1a2e', border: '1px solid #2d2d4a', borderRadius: 14, padding: 20 }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📊 Répartition des revenus</h3>
            {parseFloat(totaux.total_paiements || 0) === 0 ? (
              <p style={{ color: '#475569', fontSize: 13 }}>Aucune donnée</p>
            ) : (
              <>
                <div style={{ position: 'relative', height: 16, borderRadius: 8, background: '#2d2d4a', overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(totaux.total_tuteurs / totaux.total_paiements) * 100}%`, background: '#3b82f6', borderRadius: '8px 0 0 8px' }} />
                  <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: `${(totaux.total_commissions / totaux.total_paiements) * 100}%`, background: '#7c3aed', borderRadius: '0 8px 8px 0' }} />
                </div>
                {[
                  ['Tuteurs (85%)', '#3b82f6', `${parseFloat(totaux.total_tuteurs || 0).toFixed(0)} DH`],
                  ['Plateforme (15%)', '#7c3aed', `${parseFloat(totaux.total_commissions || 0).toFixed(0)} DH`],
                ].map(([l, c, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{l}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB : Top tuteurs ── */}
      {tab === 'tuteurs' && (
        <div style={{ background: '#1a1a2e', border: '1px solid #2d2d4a', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2d2d4a' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0 }}>🏆 Top tuteurs par revenus</h3>
          </div>
          {topTuteurs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#475569', padding: '30px', fontSize: 13 }}>Aucune donnée</p>
          ) : topTuteurs.map((t, i) => (
            <div key={t.email} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #1a1a2e' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${BAR_COLORS[i % BAR_COLORS.length]}22`, border: `1px solid ${BAR_COLORS[i % BAR_COLORS.length]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: BAR_COLORS[i % BAR_COLORS.length] }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>{t.prenom} {t.nom}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{t.email} · {t.nb_seances} séance(s)</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: BAR_COLORS[i % BAR_COLORS.length] }}>{parseFloat(t.total_gains || 0).toFixed(0)} DH</div>
                <div style={{ fontSize: 11, color: '#475569' }}>Volume: {parseFloat(t.volume_total || 0).toFixed(0)} DH</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB : Par matière ── */}
      {tab === 'matieres' && (
        <div style={{ background: '#1a1a2e', border: '1px solid #2d2d4a', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2d2d4a' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0 }}>📚 Revenus par matière</h3>
          </div>
          {parMatiere.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#475569', padding: '30px', fontSize: 13 }}>Aucune donnée</p>
          ) : parMatiere.map((m, i) => {
            const pct = Math.round((m.volume / parMatiere[0].volume) * 100)
            return (
              <div key={m.matiere} style={{ padding: '14px 20px', borderBottom: '1px solid #1a1a2e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>{m.matiere}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: BAR_COLORS[i % BAR_COLORS.length], fontSize: 14 }}>{parseFloat(m.volume || 0).toFixed(0)} DH</span>
                    <span style={{ color: '#475569', fontSize: 12, marginLeft: 8 }}>· {m.nb_seances} séance(s)</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#2d2d4a' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: BAR_COLORS[i % BAR_COLORS.length], width: `${pct}%`, transition: 'width 0.6s' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}