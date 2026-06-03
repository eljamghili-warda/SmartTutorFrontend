import React, { useState, useEffect } from 'react'
import { seancesAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

// ─── Constantes ───────────────────────────────────────────────────────────────
const JOURS = [
  { id: 1, court: 'Lun', long: 'Lundi' },
  { id: 2, court: 'Mar', long: 'Mardi' },
  { id: 3, court: 'Mer', long: 'Mercredi' },
  { id: 4, court: 'Jeu', long: 'Jeudi' },
  { id: 5, court: 'Ven', long: 'Vendredi' },
  { id: 6, court: 'Sam', long: 'Samedi' },
  { id: 7, court: 'Dim', long: 'Dimanche' },
]

// Créneaux horaires disponibles (de 6h à 23h)
const HEURES = Array.from({ length: 18 }, (_, i) => {
  const h = i + 6
  return `${String(h).padStart(2, '0')}:00`
})

const s = (val) => ({ style: val })

// ─── Composant principal ──────────────────────────────────────────────────────
export default function MesDisponibilites() {
  const [dispos, setDispos]     = useState([])   // { id, jour_semaine, heure_debut, heure_fin }
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(null)

  // Formulaire d'ajout
  const [form, setForm] = useState({ jourSemaine: 1, heureDebut: '09:00', heureFin: '12:00' })
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')

  const { toasts, success, error } = useToast()

  // ── Chargement ──────────────────────────────────────────────────────────────
  const load = () => {
    setLoading(true)
    seancesAPI.getDisponibilites()
      .then(({ data }) => setDispos(data))
      .catch(() => error('Impossible de charger vos disponibilités'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // ── Validation formulaire ───────────────────────────────────────────────────
  const validate = () => {
    if (form.heureDebut >= form.heureFin)
      return "L'heure de fin doit être après l'heure de début"

    const dureeMin = (parseInt(form.heureFin) - parseInt(form.heureDebut)) * 60
    if (form.heureFin.split(':')[0] * 60 + parseInt(form.heureFin.split(':')[1])
      - form.heureDebut.split(':')[0] * 60 - parseInt(form.heureDebut.split(':')[1]) < 30)
      return 'La plage doit durer au moins 30 minutes'

    // Chevauchement avec une dispo existante le même jour
    const conflict = dispos.find(d => {
      if (d.jour_semaine !== form.jourSemaine) return false
      const existDebut = d.heure_debut.slice(0, 5)
      const existFin   = d.heure_fin.slice(0, 5)
      return form.heureDebut < existFin && form.heureFin > existDebut
    })
    if (conflict)
      return `Chevauchement avec une disponibilité existante (${conflict.heure_debut.slice(0,5)}–${conflict.heure_fin.slice(0,5)})`

    return null
  }

  // ── Ajouter ─────────────────────────────────────────────────────────────────
  const handleAjouter = async () => {
    setFormError('')
    const err = validate()
    if (err) { setFormError(err); return }

    setSaving(true)
    try {
      await seancesAPI.setDisponibilite({
        jourSemaine: form.jourSemaine,
        heureDebut:  form.heureDebut,
        heureFin:    form.heureFin,
      })
      success('Disponibilité ajoutée !')
      setShowForm(false)
      setForm({ jourSemaine: 1, heureDebut: '09:00', heureFin: '12:00' })
      load()
    } catch (e) {
      error(e.response?.data?.error || 'Erreur lors de l\'ajout')
    } finally {
      setSaving(false)
    }
  }

  // ── Supprimer ────────────────────────────────────────────────────────────────
  const handleSupprimer = async (id) => {
    setDeleting(id)
    try {
      await seancesAPI.deleteDisponibilite(id)
      success('Disponibilité supprimée')
      setDispos(prev => prev.filter(d => d.id !== id))
    } catch {
      error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  // ── Grouper par jour pour l'affichage ────────────────────────────────────────
  const disposByJour = JOURS.map(j => ({
    ...j,
    plages: dispos
      .filter(d => d.jour_semaine === j.id)
      .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut)),
  }))

  const totalPlages = dispos.length
  const joursActifs = new Set(dispos.map(d => d.jour_semaine)).size

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="Mes disponibilités" />
      <ToastContainer toasts={toasts} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          {/* ── En-tête ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 4 }}>
                🗓️ Mes disponibilités
              </h1>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                Définissez vos créneaux disponibles. Les étudiants pourront planifier des séances uniquement sur ces plages horaires.
              </p>
            </div>
            <Btn onClick={() => { setShowForm(true); setFormError('') }}>
              + Ajouter une plage
            </Btn>
          </div>

          {/* ── Stats rapides ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { icon: '📅', val: joursActifs, label: 'Jours actifs', color: '#7c3aed' },
              { icon: '⏰', val: totalPlages, label: 'Plages définies', color: '#0ea5e9' },
              { icon: '✅', val: totalPlages > 0 ? 'Actif' : 'Inactif', label: 'Statut planning', color: totalPlages > 0 ? '#10b981' : '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ background: '#13131f', border: '1px solid #2d2d4a', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Alerte si aucune dispo ── */}
          {!loading && dispos.length === 0 && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 700, color: '#fbbf24', fontSize: 14, marginBottom: 4 }}>
                  Aucune disponibilité définie
                </p>
                <p style={{ color: '#92400e', fontSize: 13, lineHeight: 1.5 }}>
                  Vous ne pouvez pas planifier de séances tant que vous n'avez pas défini vos créneaux disponibles. Cliquez sur <strong style={{ color: '#fbbf24' }}>+ Ajouter une plage</strong> pour commencer.
                </p>
              </div>
            </div>
          )}

          {/* ── Formulaire d'ajout ── */}
          {showForm && (
            <div style={{ background: '#13131f', border: '1px solid #7c3aed55', borderRadius: 16, padding: 20, marginBottom: 24, boxShadow: '0 0 0 1px rgba(124,58,237,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>➕ Nouvelle plage de disponibilité</h3>
                <button onClick={() => setShowForm(false)} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>

              {/* Sélection du jour — visuels style Preply */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Jour de la semaine
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {JOURS.map(j => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, jourSemaine: j.id }))}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: form.jourSemaine === j.id
                          ? '2px solid #7c3aed'
                          : '2px solid #2d2d4a',
                        background: form.jourSemaine === j.id
                          ? 'rgba(124,58,237,0.15)'
                          : 'transparent',
                        color: form.jourSemaine === j.id ? '#a78bfa' : '#64748b',
                        fontWeight: form.jourSemaine === j.id ? 700 : 500,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {j.long}
                    </button>
                  ))}
                </div>
              </div>

              {/* Heures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Heure de début
                  </label>
                  <select
                    value={form.heureDebut}
                    onChange={e => setForm(f => ({ ...f, heureDebut: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#0f0f1a', border: '1px solid #2d2d4a', color: '#e2e8f0', fontSize: 14, outline: 'none', cursor: 'pointer' }}
                  >
                    {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Heure de fin
                  </label>
                  <select
                    value={form.heureFin}
                    onChange={e => setForm(f => ({ ...f, heureFin: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#0f0f1a', border: '1px solid #2d2d4a', color: '#e2e8f0', fontSize: 14, outline: 'none', cursor: 'pointer' }}
                  >
                    {HEURES.filter(h => h > form.heureDebut).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {/* Aperçu */}
              {form.heureDebut < form.heureFin && (
                <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#a78bfa' }}>
                  📋 <strong>{JOURS.find(j => j.id === form.jourSemaine)?.long}</strong> de <strong>{form.heureDebut}</strong> à <strong>{form.heureFin}</strong>
                  {' '}— durée : <strong>
                    {(() => {
                      const [dh, dm] = form.heureDebut.split(':').map(Number)
                      const [fh, fm] = form.heureFin.split(':').map(Number)
                      const total = (fh * 60 + fm) - (dh * 60 + dm)
                      return total >= 60 ? `${Math.floor(total/60)}h${total%60 ? String(total%60).padStart(2,'0') : ''}` : `${total}min`
                    })()}
                  </strong>
                </div>
              )}

              {/* Erreur */}
              {formError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#f87171', fontSize: 13 }}>
                  ⚠️ {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <Btn onClick={handleAjouter} disabled={saving}>
                  {saving ? '…' : '✅ Enregistrer'}
                </Btn>
                <Btn variant="secondary" onClick={() => { setShowForm(false); setFormError('') }}>
                  Annuler
                </Btn>
              </div>
            </div>
          )}

          {/* ── Grille des disponibilités style Preply ── */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <Spinner size="lg" />
            </div>
          ) : (
            <div style={{ background: '#13131f', border: '1px solid #2d2d4a', borderRadius: 16, overflow: 'hidden' }}>
              {/* En-tête grille */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', padding: '12px 20px', background: '#0f0f1a', borderBottom: '1px solid #2d2d4a' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jour</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plages horaires</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Actions</span>
              </div>

              {/* Lignes par jour */}
              {disposByJour.map((jour, idx) => (
                <div
                  key={jour.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr 80px',
                    padding: '14px 20px',
                    borderBottom: idx < 6 ? '1px solid #1e1e35' : 'none',
                    alignItems: 'center',
                    background: jour.plages.length > 0 ? 'transparent' : 'transparent',
                    minHeight: 56,
                  }}
                >
                  {/* Jour */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: jour.plages.length > 0 ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${jour.plages.length > 0 ? 'rgba(124,58,237,0.4)' : '#2d2d4a'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                      color: jour.plages.length > 0 ? '#a78bfa' : '#475569',
                    }}>
                      {jour.court}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: jour.plages.length > 0 ? '#e2e8f0' : '#475569' }}>
                        {jour.long}
                      </p>
                      {jour.plages.length > 0 && (
                        <p style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                          {jour.plages.length} plage{jour.plages.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Plages */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {jour.plages.length === 0 ? (
                      <span style={{ fontSize: 12, color: '#334155', fontStyle: 'italic' }}>
                        Aucune disponibilité
                      </span>
                    ) : jour.plages.map(p => {
                      const [dh, dm] = p.heure_debut.slice(0,5).split(':').map(Number)
                      const [fh, fm] = p.heure_fin.slice(0,5).split(':').map(Number)
                      const dureeMin = (fh*60+fm) - (dh*60+dm)
                      const dureeStr = dureeMin >= 60
                        ? `${Math.floor(dureeMin/60)}h${dureeMin%60 ? String(dureeMin%60).padStart(2,'0') : ''}`
                        : `${dureeMin}min`

                      return (
                        <div
                          key={p.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 12px',
                            borderRadius: 20,
                            background: 'rgba(124,58,237,0.12)',
                            border: '1px solid rgba(124,58,237,0.3)',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>
                            {p.heure_debut.slice(0,5)} – {p.heure_fin.slice(0,5)}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748b', background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: 10 }}>
                            {dureeStr}
                          </span>
                          <button
                            onClick={() => handleSupprimer(p.id)}
                            disabled={deleting === p.id}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#ef4444', fontSize: 14, padding: '0 2px',
                              opacity: deleting === p.id ? 0.4 : 0.6,
                              lineHeight: 1,
                            }}
                            title="Supprimer"
                          >
                            {deleting === p.id ? '…' : '✕'}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Bouton ajouter sur la ligne */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setForm(f => ({ ...f, jourSemaine: jour.id }))
                        setShowForm(true)
                        setFormError('')
                      }}
                      style={{
                        background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                        color: '#7c3aed', borderRadius: 8, padding: '5px 10px',
                        cursor: 'pointer', fontSize: 16, fontWeight: 700,
                        transition: 'all 0.15s',
                      }}
                      title={`Ajouter un créneau pour ${jour.long}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Conseils ── */}
          {!loading && (
            <div style={{ marginTop: 20, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 14, padding: '16px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', marginBottom: 8 }}>💡 Conseils</p>
              <ul style={{ fontSize: 12, color: '#64748b', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
                <li>Les étudiants ne peuvent planifier une séance <strong style={{ color: '#94a3b8' }}>que dans vos créneaux disponibles</strong>.</li>
                <li>Vous pouvez avoir <strong style={{ color: '#94a3b8' }}>plusieurs plages</strong> le même jour (ex: 9h–12h et 14h–18h).</li>
                <li>Une séance planifiée dans un créneau le <strong style={{ color: '#94a3b8' }}>bloque automatiquement</strong> pour éviter les doublons.</li>
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}