import React, { useState, useEffect } from 'react'
import { tarifsAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Spinner } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const MATIERES = [
  'Mathématiques','Physique','Chimie','Informatique','Algorithmes',
  'Base de données','Réseaux','Java','Python','JavaScript',
  'React','Anglais','Français','Économie','Gestion','Marketing',
  'Comptabilité','Droit','Biologie','Statistiques',
]

export default function MesTarifs() {
  const [tarifs,   setTarifs]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ matiere: '', tarifHeure: '' })
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(null)
  const { success, error } = useToast()

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
    } catch (e) { error(e.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await tarifsAPI.delete(id)
      success('Tarif supprimé')
      setTarifs(t => t.filter(x => x.id !== id))
    } catch { error('Erreur suppression') }
    finally { setDeleting(null) }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Mes Tarifs" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">

          {/* ── En-tête ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-xl text-ink-800">📋 Mes Tarifs</h1>
              <p className="text-sm text-slate-500 mt-0.5">Définissez votre tarif horaire par matière enseignée</p>
            </div>
            <Btn onClick={() => setShowForm(true)}>+ Ajouter un tarif</Btn>
          </div>

          {/* ── Info commission ── */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            💡 Vos tarifs sont visibles par les étudiants. Montant d'une séance = <strong>tarif × durée</strong>. Vous recevrez <strong>85%</strong> du montant total.
          </div>

          {/* ── Formulaire ajout ── */}
          {showForm && (
            <div className="rounded-2xl border border-blue-200 bg-white shadow-sm p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink-800">Nouveau tarif</h3>
                <button
                  onClick={() => { setShowForm(false); setForm({ matiere: '', tarifHeure: '' }) }}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                >✕</button>
              </div>

              <div className="flex gap-3 flex-wrap">
                {/* Matière */}
                <div className="flex-[2] min-w-[180px] flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Matière</label>
                  <input
                    list="matieres-list"
                    value={form.matiere}
                    onChange={e => setForm(f => ({ ...f, matiere: e.target.value }))}
                    placeholder="Ex: Java, Mathématiques…"
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-ink-800 text-sm outline-none focus:border-blue-400 focus:bg-white transition-colors"
                  />
                  <datalist id="matieres-list">
                    {MATIERES.map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>

                {/* Tarif */}
                <div className="flex-1 min-w-[140px] flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarif (DH/h)</label>
                  <input
                    type="number" min="1" max="5000"
                    value={form.tarifHeure}
                    onChange={e => setForm(f => ({ ...f, tarifHeure: e.target.value }))}
                    placeholder="Ex: 120"
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-ink-800 text-sm outline-none focus:border-blue-400 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Btn onClick={handleSubmit} disabled={saving}>
                  {saving ? '…' : 'Enregistrer'}
                </Btn>
                <Btn variant="secondary" onClick={() => { setShowForm(false); setForm({ matiere: '', tarifHeure: '' }) }}>
                  Annuler
                </Btn>
              </div>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="flex justify-center py-16"><Spinner /></div>
          )}

          {/* ── Empty state ── */}
          {!loading && tarifs.length === 0 && (
            <div className="rounded-2xl border border-blue-200 bg-white text-center py-12 px-6 flex flex-col items-center gap-3">
              <span className="text-5xl">💸</span>
              <p className="text-slate-500 text-sm">Vous n'avez pas encore défini de tarifs.</p>
              <Btn onClick={() => setShowForm(true)}>Définir mon premier tarif</Btn>
            </div>
          )}

          {/* ── Liste des tarifs ── */}
          {!loading && tarifs.length > 0 && (
            <div className="rounded-2xl border border-blue-200 bg-white shadow-sm overflow-hidden">

              {/* Header tableau */}
              <div className="grid grid-cols-[1fr_auto_auto] px-5 py-2.5 bg-blue-50 border-b border-blue-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Matière</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-10">Tarif / heure</span>
                <span></span>
              </div>

              {tarifs.map((t, i) => (
                <div
                  key={t.id}
                  className={`grid grid-cols-[1fr_auto_auto] items-center px-5 py-3.5 gap-4
                    ${i < tarifs.length - 1 ? 'border-b border-blue-100' : ''}
                    hover:bg-blue-50/50 transition-colors`}
                >
                  {/* Matière + date */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-lg flex-shrink-0">
                      📖
                    </div>
                    <div>
                      <p className="font-bold text-ink-800 text-sm">{t.matiere}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ajouté le {new Date(t.date_creation).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {/* Prix */}
                  <div className="text-right">
                    <span className="font-black text-xl text-blue-700">{t.tarif_heure}</span>
                    <span className="font-bold text-blue-700 text-sm ml-1">DH</span>
                    <p className="text-xs text-slate-400">par heure</p>
                  </div>

                  {/* Supprimer */}
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-500
                      hover:bg-rose-100 transition-colors flex items-center justify-center text-sm
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deleting === t.id ? '…' : '🗑️'}
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}