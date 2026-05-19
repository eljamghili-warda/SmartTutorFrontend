import React, { useState, useEffect } from 'react'
import { tarifsAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Spinner } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const MATIERES_SUGGESTIONS = [
  'Mathématiques', 'Physique', 'Chimie', 'Informatique', 'Algorithmes',
  'Base de données', 'Réseaux', 'Java', 'Python', 'JavaScript',
  'React', 'Anglais', 'Français', 'Économie', 'Gestion', 'Marketing',
  'Comptabilité', 'Droit', 'Biologie', 'Statistiques',
]

export default function MesTarifs() {
  const [tarifs, setTarifs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState({ matiere: '', tarifHeure: '' })
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(null)
  const { toasts, success, error } = useToast()

  const load = () => {
    tarifsAPI.getMesTarifs()
      .then(({ data }) => setTarifs(data))
      .catch(() => error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    if (!form.matiere.trim()) return error('Matière requise')
    const tarif = parseFloat(form.tarifHeure)
    if (isNaN(tarif) || tarif <= 0) return error('Tarif invalide')
    setSaving(true)
    try {
      await tarifsAPI.upsert({ matiere: form.matiere, tarifHeure: tarif })
      success('Tarif enregistré')
      setForm({ matiere: '', tarifHeure: '' })
      setShowForm(false)
      load()
    } catch (e) {
      error(e.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await tarifsAPI.delete(id)
      success('Tarif supprimé')
      setTarifs(t => t.filter(x => x.id !== id))
    } catch {
      error('Erreur de suppression')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a' }}>
      <Header />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: 24, color: '#fff', marginBottom: 4 }}>📋 Mes Tarifs</h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>Définissez votre tarif horaire par matière enseignée</p>
          </div>
          <Btn onClick={() => setShowForm(true)}>+ Ajouter un tarif</Btn>
        </div>

        {/* Info */}
        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#93c5fd' }}>
          💡 Vos tarifs sont visibles par les étudiants. Le montant d'une séance = <strong>tarif × durée</strong>. Vous recevrez <strong>85%</strong> du montant total.
        </div>

        {/* Formulaire ajout */}
        {showForm && (
          <div style={{ background: '#13131f', border: '1px solid #2d2d4a', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Nouveau tarif</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 180 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Matière</label>
                <input
                  list="matieres-list"
                  value={form.matiere}
                  onChange={e => setForm(f => ({ ...f, matiere: e.target.value }))}
                  placeholder="Ex: Java, Mathématiques…"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#0f0f1a', border: '1px solid #2d2d4a', color: '#e2e8f0', fontSize: 14, outline: 'none' }}
                />
                <datalist id="matieres-list">
                  {MATIERES_SUGGESTIONS.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Tarif (DH/h)</label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={form.tarifHeure}
                  onChange={e => setForm(f => ({ ...f, tarifHeure: e.target.value }))}
                  placeholder="Ex: 120"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#0f0f1a', border: '1px solid #2d2d4a', color: '#e2e8f0', fontSize: 14, outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Btn onClick={handleSubmit} disabled={saving}>
                {saving ? '…' : 'Enregistrer'}
              </Btn>
              <Btn variant="secondary" onClick={() => { setShowForm(false); setForm({ matiere: '', tarifHeure: '' }) }}>
                Annuler
              </Btn>
            </div>
          </div>
        )}

        {/* Liste des tarifs */}
        {loading && <div className="flex justify-center py-10"><Spinner /></div>}
        {!loading && tarifs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#13131f', border: '1px solid #2d2d4a', borderRadius: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>Vous n'avez pas encore défini de tarifs.</p>
            <Btn onClick={() => setShowForm(true)}>Définir mon premier tarif</Btn>
          </div>
        )}

        {!loading && tarifs.length > 0 && (
          <div style={{ background: '#13131f', border: '1px solid #2d2d4a', borderRadius: 16, overflow: 'hidden' }}>
            {tarifs.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < tarifs.length - 1 ? '1px solid #1e1e35' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  📖
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>{t.matiere}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Ajouté le {new Date(t.date_creation).toLocaleDateString('fr-FR')}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 16 }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: '#7c3aed' }}>{t.tarif_heure} DH</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>par heure</div>
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={deleting === t.id}
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  {deleting === t.id ? '…' : '🗑️'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}