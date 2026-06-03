import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { StatCard, Card, Btn, Badge, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const { toasts, success, error } = useToast()

  useEffect(() => {
    Promise.all([adminAPI.getStats(), adminAPI.getTuteursPending()])
      .then(([sr, pr]) => { setStats(sr.data); setPending(pr.data) })
      .finally(() => setLoading(false))
  }, [])

  const valider = async (id, accepte) => {
    try {
      await adminAPI.validerTuteur(id, accepte)
      setPending(prev => prev.filter(t => t.id !== id))
      success(accepte ? 'Tuteur validé !' : 'Tuteur refusé.')
    } catch { error('Erreur') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="Vue d'ensemble" />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="👥" value={stats?.utilisateurs?.total       ?? '—'} label="Utilisateurs"      color="violet" />
              <StatCard icon="🚪" value={stats?.salles?.actives           ?? '—'} label="Salles actives"    color="emerald" />
              <StatCard icon="📅" value={stats?.seances?.total            ?? '—'} label="Séances totales"   color="amber" />
              <StatCard icon="⏳" value={stats?.tuteursPending            ?? '—'} label="Tuteurs en attente" color="rose" />
            </div>

            {/* Sous-stats utilisateurs */}
            {stats?.utilisateurs && (
              <div className="grid grid-cols-3 gap-3">
                <StatCard icon="🎓" value={stats.utilisateurs.etudiants ?? '—'} label="Étudiants"  color="violet" />
                <StatCard icon="👨‍🏫" value={stats.utilisateurs.tuteurs   ?? '—'} label="Tuteurs"    color="emerald" />
                <StatCard icon="🔒" value={stats.utilisateurs.bloques   ?? '—'} label="Bloqués"    color="rose" />
              </div>
            )}

            {/* Finances */}
            {stats?.finances && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="💰" value={`${parseFloat(stats.finances.total_volume       || 0).toFixed(0)} DH`} label="Volume total"    color="emerald" />
                <StatCard icon="🏦" value={`${parseFloat(stats.finances.total_commissions  || 0).toFixed(0)} DH`} label="Commissions"     color="amber" />
                <StatCard icon="👨‍🏫" value={`${parseFloat(stats.finances.total_tuteurs     || 0).toFixed(0)} DH`} label="Gains tuteurs"   color="violet" />
                <StatCard icon="✅" value={stats.finances.nb_paiements ?? '—'}                                      label="Paiements reçus" color="emerald" />
              </div>
            )}

            {/* Pending tuteurs */}
            {pending.length > 0 && (
              <Card>
                <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                  ⏳ Tuteurs en attente de validation
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 text-xs border border-amber-400/25">{pending.length}</span>
                </h3>
                <div className="flex flex-col gap-3">
                  {pending.map(t => (
                    <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl bg-ink-900 border border-ink-700">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                        {t.prenom?.[0]}{t.nom?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white">{t.prenom} {t.nom}</p>
                        <p className="text-xs text-slate-500">{t.email}</p>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {(t.specialites || []).map(s => (
                            <span key={s} className="px-2 py-0.5 rounded-full bg-violet-600/15 text-violet-400 text-xs border border-violet-600/25">{s}</span>
                          ))}
                        </div>
                      </div>
                      {t.biographie && (
                        <p className="text-xs text-slate-500 max-w-xs hidden lg:block line-clamp-2">{t.biographie}</p>
                      )}
                      <div className="flex gap-2 flex-shrink-0">
                        <Btn variant="success" size="sm" onClick={() => valider(t.id, true)}>✓ Valider</Btn>
                        <Btn variant="danger"  size="sm" onClick={() => valider(t.id, false)}>✕ Refuser</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {pending.length === 0 && (
              <Card className="text-center py-6">
                <p className="text-slate-500 text-sm">✅ Aucun tuteur en attente de validation.</p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}