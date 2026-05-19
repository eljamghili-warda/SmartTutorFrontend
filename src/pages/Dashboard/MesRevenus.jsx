import React, { useState, useEffect } from 'react'
import { paiementsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import { Spinner } from '../../components/UI'

const STATUT = {
  COMPLETE:  { label: 'Reçu',      color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
  REMBOURSE: { label: 'Remboursé', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
}

export default function MesRevenus() {
  const { user } = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur]   = useState('')

  useEffect(() => {
    paiementsAPI.getMesRevenus()
      .then(({ data }) => setData(data))
      .catch(() => setErreur('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.stats || {}
  const paiements = data?.paiements || []

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a' }}>
      <Header />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontWeight: 900, fontSize: 26, color: '#fff', marginBottom: 4 }}>💰 Mes Revenus</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Historique de vos gains sur SmartTutor</p>
        </div>

        {loading && <div className="flex justify-center py-16"><Spinner /></div>}
        {erreur && <p style={{ color: '#f87171', textAlign: 'center' }}>{erreur}</p>}

        {!loading && data && (
          <>
            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Gains totaux', value: `${parseFloat(stats.total_gains || 0).toFixed(2)} DH`, icon: '🎉', color: '#7c3aed' },
                { label: 'Séances payées', value: stats.nb_paiements || 0, icon: '📚', color: '#3b82f6' },
                { label: 'Remboursements', value: `${parseFloat(stats.total_rembourse || 0).toFixed(2)} DH`, icon: '↩️', color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ background: '#13131f', border: '1px solid #2d2d4a', borderRadius: 16, padding: '20px 22px' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Commission info */}
            <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>ℹ️</span>
              <p style={{ fontSize: 13, color: '#a78bfa', margin: 0 }}>
                Vos gains représentent <strong>85%</strong> du montant total de chaque séance. Les 15% restants constituent la commission de la plateforme.
              </p>
            </div>

            {/* Historique */}
            <div style={{ background: '#13131f', border: '1px solid #2d2d4a', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 22px', borderBottom: '1px solid #2d2d4a' }}>
                <h2 style={{ fontWeight: 700, fontSize: 16, color: '#fff', margin: 0 }}>Historique des paiements</h2>
              </div>

              {paiements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <p style={{ fontSize: 14 }}>Aucun paiement reçu pour l'instant</p>
                </div>
              ) : (
                <div>
                  {paiements.map(p => {
                    const s = STATUT[p.statut] || STATUT.COMPLETE
                    return (
                      <div key={p.id} style={{ padding: '16px 22px', borderBottom: '1px solid #1e1e35', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                          background: s.bg, border: `1px solid ${s.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                        }}>
                          {p.statut === 'REMBOURSE' ? '↩️' : '💸'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14, marginBottom: 2 }}>{p.seance_titre}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {p.salle_nom} · {p.matiere || '—'} · Payé par {p.payeur_prenom} {p.payeur_nom}
                          </div>
                          <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                            {new Date(p.date_paiement).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, fontSize: 18, color: s.color }}>
                            {p.statut === 'REMBOURSE' ? '-' : '+'}{parseFloat(p.gain_tuteur).toFixed(2)} DH
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            Total: {p.montant_total} DH
                          </div>
                          <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                            {s.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}