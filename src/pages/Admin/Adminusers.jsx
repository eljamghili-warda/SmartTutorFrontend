// AdminUsers.jsx - Version professionnelle Bleu/Doré
import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Spinner, EmptyState, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const C = {
  bg: '#F5F0E6',
  surface: '#FFFFFF',
  border: '#E0D5C0',
  text: '#1A3A5C',
  textLight: '#6B7B8D',
  primary: '#2C5F8A',
  accent: '#C5A059',
  success: '#2E7D32',
  warning: '#ED6C02',
  danger: '#C62828',
  info: '#4A90E2',
}

const roleConfig = {
  etudiant: { color: C.info, label: '👨‍🎓 Étudiant', bg: 'rgba(74,144,226,0.1)' },
  tuteur:   { color: C.primary, label: '👨‍🏫 Tuteur', bg: 'rgba(44,95,138,0.1)' },
  admin:    { color: C.accent, label: '🛡️ Admin', bg: 'rgba(197,160,89,0.1)' },
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const { toasts, success, error } = useToast()

  const load = (search = '') => {
    setLoading(true)
    adminAPI.getUtilisateurs({ search }).then(({ data }) => setUsers(data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleBloquer = async (id, estBloque) => {
    try {
      await adminAPI.bloquer(id, !estBloque)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, est_bloque: !estBloque } : u))
      success(estBloque ? '🔓 Utilisateur débloqué' : '🔒 Utilisateur bloqué')
    } catch { error('Erreur lors de l\'action') }
  }

  const handleSupprimer = async (id) => {
    if (!confirm('⚠️ Supprimer définitivement cet utilisateur ? Cette action est irréversible.')) return
    try {
      await adminAPI.supprimer(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      success('🗑️ Utilisateur supprimé')
    } catch { error('Erreur lors de la suppression') }
  }

  const filtered = users.filter(u => !filter || u.role === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <Header title="Gestion des utilisateurs" subtitle="Administration des comptes" onSearch={load} />
      <ToastContainer toasts={toasts} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
          {[
            { v: '', label: '📋 Tous' },
            { v: 'etudiant', label: '👨‍🎓 Étudiants' },
            { v: 'tuteur', label: '👨‍🏫 Tuteurs' },
            { v: 'admin', label: '🛡️ Admins' },
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
            {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="👥" title="Aucun utilisateur" desc="Aucun utilisateur ne correspond à ce filtre" />
        ) : (
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            overflow: 'hidden',
          }}>
            {/* En-tête du tableau */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1fr auto',
              padding: '14px 20px',
              background: C.surfaceAlt,
              borderBottom: `1px solid ${C.border}`,
              fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              <div>Utilisateur</div>
              <div>Email</div>
              <div>Rôle</div>
              <div>Statut</div>
              <div>Inscription</div>
              <div>Actions</div>
            </div>

            {/* Lignes du tableau */}
            {filtered.map((u, i) => {
              const rc = roleConfig[u.role] || roleConfig.etudiant
              return (
                <div
                  key={u.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1fr auto',
                    padding: '14px 20px',
                    alignItems: 'center',
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: u.est_bloque ? `${C.danger}05` : 'transparent',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${C.accent}05`}
                  onMouseLeave={e => e.currentTarget.style.background = u.est_bloque ? `${C.danger}05` : 'transparent'}
                >
                  {/* Nom + avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff',
                    }}>
                      {u.prenom?.[0]}{u.nom?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: C.text }}>{u.prenom} {u.nom}</div>
                      {u.est_bloque && (
                        <span style={{ fontSize: 9, color: C.danger }}>🔒 Bloqué</span>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ fontSize: 12, color: C.textLight }}>{u.email}</div>

                  {/* Rôle */}
                  <div>
                    <span style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: rc.bg, color: rc.color,
                    }}>
                      {rc.label}
                    </span>
                    {u.statut_tuteur && u.statut_tuteur !== 'ACTIVE' && u.role === 'tuteur' && (
                      <span style={{
                        marginLeft: 6, padding: '2px 6px', borderRadius: 12, fontSize: 9,
                        background: `${C.warning}15`, color: C.warning,
                      }}>
                        {u.statut_tuteur === 'PENDING' ? '⏳ à valider' : u.statut_tuteur}
                      </span>
                    )}
                  </div>

                  {/* Statut */}
                  <div>
                    {u.est_bloque ? (
                      <span style={{ color: C.danger, fontSize: 12 }}>🔒 Bloqué</span>
                    ) : (
                      <span style={{ color: C.success, fontSize: 12 }}>✓ Actif</span>
                    )}
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 11, color: C.textLight }}>
                    {new Date(u.date_inscription).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleBloquer(u.id, u.est_bloque)}
                      style={{
                        width: 32, height: 32, borderRadius: 10, border: `1px solid ${C.border}`,
                        background: C.surface, cursor: 'pointer', fontSize: 14,
                        transition: 'all 0.2s',
                      }}
                      title={u.est_bloque ? 'Débloquer' : 'Bloquer'}
                    >
                      {u.est_bloque ? '🔓' : '🔒'}
                    </button>
                    <button
                      onClick={() => handleSupprimer(u.id)}
                      style={{
                        width: 32, height: 32, borderRadius: 10, border: `1px solid ${C.danger}40`,
                        background: `${C.danger}10`, cursor: 'pointer', fontSize: 14, color: C.danger,
                        transition: 'all 0.2s',
                      }}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
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