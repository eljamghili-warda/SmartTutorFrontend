import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { examensAPI, sallesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import { Btn, Modal, FormGroup, Badge, Spinner, EmptyState, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const statutConfig = {
  BROUILLON: { color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/25',   label: 'Brouillon',  icon: '✏️' },
  PUBLIE:    { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/25', label: 'Publié',     icon: '✅' },
  ARCHIVE:   { color: 'text-slate-500',   bg: 'bg-slate-500/10',   border: 'border-slate-500/25',   label: 'Archivé',    icon: '📦' },
}

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—'
const fmtDatetime = (d) => d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'
const fmtDateFull = (d) => d ? new Date(d).toLocaleString('fr-FR', { weekday:'short', day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

// ─── Formulaire création / modification examen ───────────────────────────────
function FormExamen({ salles, onSave, onClose, initial = null }) {
  const [form, setForm] = useState({
    titre: initial?.titre || '',
    description: initial?.description || '',
    salleId: initial?.salle_id || '',
    notePassage: initial?.note_passage || 70,
    dureeMinutes: initial?.duree_minutes || 30,
    maxTentatives: initial?.max_tentatives || '',
    dateDebut: initial?.date_debut ? initial.date_debut.slice(0,16) : '',
    dateLimite: initial?.date_limite ? initial.date_limite.slice(0,16) : '',
    dateAffichageResultats: initial?.date_affichage_resultats ? initial.date_affichage_resultats.slice(0,16) : '',
    modeAffichage: initial?.mode_affichage || 'UNE_PAR_UNE',
    melangerQuestions: initial?.melanger_questions ?? true,
    melangerReponses: initial?.melanger_reponses ?? true,
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.titre.trim()) return alert('Titre obligatoire')
    if (!initial && !form.salleId) return alert('Choisissez une salle')
    setSaving(true)
    try {
      await onSave({
        salleId: form.salleId,
        titre: form.titre,
        description: form.description,
        notePassage: parseFloat(form.notePassage),
        dureeMinutes: parseInt(form.dureeMinutes),
        maxTentatives: form.maxTentatives ? parseInt(form.maxTentatives) : null,
        dateDebut: form.dateDebut || null,
        dateLimite: form.dateLimite || null,
        dateAffichageResultats: form.dateAffichageResultats || null,
        modeAffichage: form.modeAffichage,
        melangerQuestions: form.melangerQuestions,
        melangerReponses: form.melangerReponses,
      })
    } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormGroup label="Titre *">
        <input className="input w-full" value={form.titre} onChange={e => set('titre', e.target.value)} placeholder="Ex: Algorithmique Chapitre 2" />
      </FormGroup>
      {!initial && (
        <FormGroup label="Salle associée *">
          <select className="input w-full" value={form.salleId} onChange={e => set('salleId', e.target.value)}>
            <option value="">— Choisir une salle —</option>
            {salles.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </FormGroup>
      )}
      <FormGroup label="Description">
        <textarea className="input w-full resize-none" rows={2} value={form.description}
          onChange={e => set('description', e.target.value)} placeholder="Description optionnelle..." />
      </FormGroup>
      <div className="grid grid-cols-2 gap-3">
        <FormGroup label="Durée (minutes)">
          <input type="number" min={5} max={180} className="input w-full" value={form.dureeMinutes}
            onChange={e => set('dureeMinutes', e.target.value)} />
        </FormGroup>
        <FormGroup label="Note de passage (%)">
          <input type="number" min={0} max={100} className="input w-full" value={form.notePassage}
            onChange={e => set('notePassage', e.target.value)} />
        </FormGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormGroup label="Nb tentatives max">
          <input type="number" min={1} className="input w-full" value={form.maxTentatives}
            placeholder="Illimité" onChange={e => set('maxTentatives', e.target.value)} />
        </FormGroup>
        <FormGroup label="Mode affichage">
          <select className="input w-full" value={form.modeAffichage} onChange={e => set('modeAffichage', e.target.value)}>
            <option value="UNE_PAR_UNE">Question par question</option>
            <option value="LISTE_COMPLETE">Liste complète</option>
          </select>
        </FormGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormGroup label="Disponible à partir du">
          <input type="datetime-local" className="input w-full" value={form.dateDebut}
            onChange={e => set('dateDebut', e.target.value)} />
        </FormGroup>
        <FormGroup label="Date limite">
          <input type="datetime-local" className="input w-full" value={form.dateLimite}
            onChange={e => set('dateLimite', e.target.value)} />
        </FormGroup>
      </div>
      <FormGroup label="Afficher résultats à partir du">
        <input type="datetime-local" className="input w-full" value={form.dateAffichageResultats}
          onChange={e => set('dateAffichageResultats', e.target.value)} />
      </FormGroup>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" checked={form.melangerQuestions}
            onChange={e => set('melangerQuestions', e.target.checked)} className="w-4 h-4 accent-violet-500" />
          Mélanger les questions
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" checked={form.melangerReponses}
            onChange={e => set('melangerReponses', e.target.checked)} className="w-4 h-4 accent-violet-500" />
          Mélanger les réponses
        </label>
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-ink-700">
        <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
        <Btn onClick={handleSubmit} disabled={saving}>
          {saving ? 'Enregistrement…' : (initial ? '💾 Modifier' : '💾 Créer brouillon')}
        </Btn>
      </div>
    </div>
  )
}

// ─── Formulaire question ──────────────────────────────────────────────────────
function FormQuestion({ onSave, onClose, initial = null }) {
  const [texte, setTexte] = useState(initial?.texte || '')
  const [type, setType]   = useState(initial?.type || 'QCM')
  const [points, setPoints] = useState(initial?.points || 1)
  const [reponses, setReponses] = useState(
    initial?.reponses?.length
      ? initial.reponses.map(r => ({ texte: r.texte, estCorrecte: r.est_correcte }))
      : [{ texte: '', estCorrecte: false }, { texte: '', estCorrecte: false }]
  )
  const [saving, setSaving] = useState(false)

  const addReponse    = () => setReponses(r => [...r, { texte: '', estCorrecte: false }])
  const removeReponse = (i) => setReponses(r => r.filter((_, idx) => idx !== i))
  const setRep        = (i, k, v) => setReponses(r => r.map((x, idx) => idx === i ? { ...x, [k]: v } : x))
  const setCorrect    = (i) => {
    if (type === 'VRAI_FAUX' || type === 'QCM') {
      setReponses(r => r.map((x, idx) => ({ ...x, estCorrecte: idx === i })))
    }
  }

  useEffect(() => {
    if (type === 'VRAI_FAUX') {
      setReponses([{ texte: 'Vrai', estCorrecte: false }, { texte: 'Faux', estCorrecte: false }])
    }
  }, [type])

  const handleSubmit = async () => {
    if (!texte.trim()) return alert('Le texte est obligatoire')
    if (!reponses.some(r => r.estCorrecte)) return alert('Cochez au moins une bonne réponse')
    setSaving(true)
    try { await onSave({ texte, type, points: parseFloat(points), reponses }) }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <FormGroup label="Type">
          <select className="input w-full" value={type} onChange={e => setType(e.target.value)}>
            <option value="QCM">QCM</option>
            <option value="VRAI_FAUX">Vrai / Faux</option>
          </select>
        </FormGroup>
        <FormGroup label="Points">
          <input type="number" min={0.5} step={0.5} className="input w-full" value={points}
            onChange={e => setPoints(e.target.value)} />
        </FormGroup>
      </div>
      <FormGroup label="Question *">
        <textarea className="input w-full resize-none" rows={3} value={texte}
          onChange={e => setTexte(e.target.value)} placeholder="Tapez la question ici..." />
      </FormGroup>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Réponses</p>
        {reponses.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <button onClick={() => setCorrect(i)}
              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all
                ${r.estCorrecte ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-emerald-500'}`} />
            <input className="input flex-1 py-1.5" value={r.texte}
              disabled={type === 'VRAI_FAUX'}
              onChange={e => setRep(i, 'texte', e.target.value)}
              placeholder={`Réponse ${i + 1}`} />
            {type === 'QCM' && reponses.length > 2 && (
              <button onClick={() => removeReponse(i)}
                className="text-slate-500 hover:text-rose-400 text-lg leading-none">×</button>
            )}
          </div>
        ))}
        {type === 'QCM' && (
          <button onClick={addReponse}
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-1">
            + Ajouter une réponse
          </button>
        )}
        <p className="text-xs text-slate-500">Cliquez sur le cercle pour cocher la bonne réponse.</p>
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-ink-700">
        <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
        <Btn onClick={handleSubmit} disabled={saving}>
          {saving ? 'Enregistrement…' : (initial ? '✏️ Modifier' : '+ Ajouter')}
        </Btn>
      </div>
    </div>
  )
}

// ─── Carte examen tuteur ──────────────────────────────────────────────────────
function ExamenCardTuteur({ examen, onEdit, onManage, onPublier, onArchiver }) {
  const cfg = statutConfig[examen.statut] || statutConfig.BROUILLON
  return (
    <div className={`bg-ink-800 border ${cfg.border} rounded-2xl p-5 flex flex-col gap-3 hover:border-violet-500/30 transition-all`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <h3 className="font-semibold text-slate-100 truncate">{examen.titre}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{examen.salle_nom}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Questions', value: examen.nb_questions || 0 },
          { label: 'Tentatives', value: examen.nb_tentatives || 0 },
          { label: 'Réussis', value: examen.nb_reussi || 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-ink-700 rounded-xl py-2">
            <p className="text-sm font-bold text-slate-100">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-500 flex flex-col gap-0.5">
        <span>⏱ {examen.duree_minutes} min &nbsp;·&nbsp; 🎯 {examen.note_passage}%</span>
        {examen.date_limite && <span>📅 Limite : {fmtDatetime(examen.date_limite)}</span>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {examen.statut === 'BROUILLON' && (
          <>
            <Btn size="sm" variant="ghost" onClick={() => onEdit(examen)}>✏️ Modifier</Btn>
            <Btn size="sm" variant="ghost" onClick={() => onManage(examen)}>📝 Questions</Btn>
            <Btn size="sm" onClick={() => onPublier(examen)}>🚀 Publier</Btn>
          </>
        )}
        {examen.statut === 'PUBLIE' && (
          <>
            <Btn size="sm" variant="ghost" onClick={() => onManage(examen)}>📊 Voir détails</Btn>
            <Btn size="sm" variant="danger" onClick={() => onArchiver(examen)}>📦 Archiver</Btn>
          </>
        )}
        {examen.statut === 'ARCHIVE' && (
          <Btn size="sm" variant="ghost" onClick={() => onManage(examen)}>📊 Statistiques</Btn>
        )}
      </div>
    </div>
  )
}

// ─── Carte examen étudiant ────────────────────────────────────────────────────
function ExamenCardEtudiant({ examen, onCommencer, onVoirResultats }) {
  const maintenant = new Date()
  const dateLimite = examen.date_limite ? new Date(examen.date_limite) : null
  const dateDebut  = examen.date_debut  ? new Date(examen.date_debut)  : null
  const expired    = dateLimite && maintenant > dateLimite
  const notYet     = dateDebut && maintenant < dateDebut
  const dejaReussi = examen.deja_reussi > 0
  const tentativesMax = examen.max_tentatives
  const tentativesFaites = examen.nb_tentatives_faites || 0
  const plusDeTentatives = tentativesMax && tentativesFaites >= tentativesMax && !dejaReussi

  let statusBadge, canStart
  if (dejaReussi) {
    statusBadge = <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/25">🏆 Réussi</span>
    canStart = false
  } else if (expired) {
    statusBadge = <span className="text-xs font-semibold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/25">⏰ Expiré</span>
    canStart = false
  } else if (notYet) {
    statusBadge = <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/25">⏳ Pas encore disponible</span>
    canStart = false
  } else if (plusDeTentatives) {
    statusBadge = <span className="text-xs font-semibold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full border border-rose-400/25">🚫 Tentatives épuisées</span>
    canStart = false
  } else {
    statusBadge = <span className="text-xs font-semibold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full border border-violet-400/25">✅ Disponible</span>
    canStart = true
  }

  return (
    <div className="bg-ink-800 border border-ink-600 rounded-2xl p-5 flex flex-col gap-3 hover:border-violet-500/30 transition-all">
      <div>
        {statusBadge}
        <h3 className="font-semibold text-slate-100 mt-2 truncate">{examen.titre}</h3>
        <p className="text-xs text-slate-500">{examen.salle_nom} · {examen.tuteur_prenom} {examen.tuteur_nom}</p>
      </div>

      {examen.description && (
        <p className="text-xs text-slate-400 line-clamp-2">{examen.description}</p>
      )}

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-ink-700 rounded-xl py-2">
          <p className="font-bold text-slate-100">{examen.duree_minutes} min</p>
          <p className="text-slate-500">Durée</p>
        </div>
        <div className="bg-ink-700 rounded-xl py-2">
          <p className="font-bold text-slate-100">{examen.note_passage}%</p>
          <p className="text-slate-500">Pour réussir</p>
        </div>
        <div className="bg-ink-700 rounded-xl py-2">
          <p className="font-bold text-slate-100">{tentativesFaites}/{tentativesMax || '∞'}</p>
          <p className="text-slate-500">Tentatives</p>
        </div>
      </div>

      {dateLimite && !expired && (
        <p className="text-xs text-amber-400/80">⏰ Jusqu'au {fmtDatetime(examen.date_limite)}</p>
      )}

      <div className="flex gap-2">
        {canStart && (
          <Btn size="sm" onClick={() => onCommencer(examen)} className="flex-1">
            ▶ Commencer
          </Btn>
        )}
        {(dejaReussi || examen.derniere_tentative_statut === 'ECHOUE') && (
          <Btn size="sm" variant="ghost" onClick={() => onVoirResultats(examen)}>
            📊 Mes résultats
          </Btn>
        )}
        {expired && !dejaReussi && examen.nb_tentatives_faites > 0 && (
          <Btn size="sm" variant="ghost" onClick={() => onVoirResultats(examen)}>
            📊 Voir corrigé
          </Btn>
        )}
      </div>
    </div>
  )
}

// ─── Panel détails examen (tuteur) — 3 onglets ───────────────────────────────
function PanelDetailsExamen({ examen, onClose, onUpdate }) {
  const [onglet, setOnglet] = useState(examen.statut === 'BROUILLON' ? 'questions' : 'etudiants')
  const [questions, setQuestions]   = useState([])
  const [tentatives, setTentatives] = useState([])
  const [loadingQ, setLoadingQ]     = useState(false)
  const [loadingT, setLoadingT]     = useState(false)
  const [showAdd, setShowAdd]       = useState(false)
  const [editQ, setEditQ]           = useState(null)
  const { success, error, toasts }  = useToast()

  const loadQuestions = async () => {
    setLoadingQ(true)
    try {
      const { data } = await examensAPI.getById(examen.id)
      setQuestions(data.questions || [])
    } finally { setLoadingQ(false) }
  }

  const loadTentatives = async () => {
    setLoadingT(true)
    try {
      const { data } = await examensAPI.getTentatives(examen.id)
      setTentatives(data)
    } catch { /* ignore si pas de tentatives */ }
    finally { setLoadingT(false) }
  }

  useEffect(() => { loadQuestions() }, [examen.id])
  useEffect(() => { if (onglet === 'etudiants') loadTentatives() }, [onglet])

  const handleAdd = async (data) => {
    await examensAPI.addQuestion(examen.id, data)
    await loadQuestions()
    setShowAdd(false)
    success('Question ajoutée !')
    onUpdate()
  }

  const handleEdit = async (data) => {
    await examensAPI.updateQuestion(examen.id, editQ.id, data)
    await loadQuestions()
    setEditQ(null)
    success('Question modifiée !')
    onUpdate()
  }

  const handleDelete = async (qId) => {
    if (!confirm('Supprimer cette question ?')) return
    try {
      await examensAPI.deleteQuestion(examen.id, qId)
      await loadQuestions()
      success('Question supprimée.')
      onUpdate()
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  // Stats tentatives
  const nbReussi  = tentatives.filter(t => t.statut === 'REUSSI').length
  const nbEchoue  = tentatives.filter(t => t.statut === 'ECHOUE').length
  const scores    = tentatives.filter(t => t.pourcentage != null).map(t => parseFloat(t.pourcentage))
  const scoreMoy  = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null

  const TABS = [
    { key: 'details',   label: '📋 Détails' },
    { key: 'questions', label: `📝 Questions (${questions.length})` },
    { key: 'etudiants', label: `👥 Étudiants (${tentatives.length})` },
  ]

  return (
    <div className="flex flex-col gap-0 max-h-[80vh]">
      <ToastContainer toasts={toasts} />

      {/* Onglets */}
      <div className="flex gap-1 border-b border-ink-700 pb-0 mb-4 sticky top-0 bg-ink-900 z-10 pt-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setOnglet(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2 -mb-px
              ${onglet === t.key
                ? 'text-violet-400 border-violet-400 bg-violet-400/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto flex-1 pr-1">

        {/* ── Onglet DÉTAILS ── */}
        {onglet === 'details' && (
          <div className="flex flex-col gap-4">
            {/* Infos générales */}
            <div className="bg-ink-700/40 rounded-2xl p-4 border border-ink-600">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Informations</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-slate-500">Salle</span>
                  <p className="text-slate-200 font-medium">{examen.salle_nom}</p>
                </div>
                <div>
                  <span className="text-slate-500">Statut</span>
                  <p className={`font-medium ${statutConfig[examen.statut]?.color}`}>
                    {statutConfig[examen.statut]?.icon} {statutConfig[examen.statut]?.label}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Durée</span>
                  <p className="text-slate-200 font-medium">⏱ {examen.duree_minutes} minutes</p>
                </div>
                <div>
                  <span className="text-slate-500">Note de passage</span>
                  <p className="text-slate-200 font-medium">🎯 {examen.note_passage}%</p>
                </div>
                <div>
                  <span className="text-slate-500">Tentatives max</span>
                  <p className="text-slate-200 font-medium">{examen.max_tentatives || 'Illimitées'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Mode affichage</span>
                  <p className="text-slate-200 font-medium">
                    {examen.mode_affichage === 'UNE_PAR_UNE' ? 'Question par question' : 'Liste complète'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-ink-700/40 rounded-2xl p-4 border border-ink-600">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Dates</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">📅 Date de publication</span>
                  <span className="text-slate-200 font-medium">{fmtDateFull(examen.published_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">🟢 Disponible à partir du</span>
                  <span className={`font-medium ${examen.date_debut ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {fmtDateFull(examen.date_debut)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">🔴 Date limite</span>
                  <span className={`font-medium ${examen.date_limite ? 'text-rose-400' : 'text-slate-500'}`}>
                    {fmtDateFull(examen.date_limite)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">👁 Affichage résultats</span>
                  <span className={`font-medium ${examen.date_affichage_resultats ? 'text-amber-400' : 'text-slate-500'}`}>
                    {examen.date_affichage_resultats ? fmtDateFull(examen.date_affichage_resultats) : 'Immédiat'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">🗓 Créé le</span>
                  <span className="text-slate-400">{fmtDateFull(examen.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-ink-700/40 rounded-2xl p-4 border border-ink-600">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Options</p>
              <div className="flex gap-4 text-sm">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${examen.melanger_questions ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                  {examen.melanger_questions ? '✅' : '○'} Mélange questions
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${examen.melanger_reponses ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                  {examen.melanger_reponses ? '✅' : '○'} Mélange réponses
                </div>
              </div>
            </div>

            {/* Description */}
            {examen.description && (
              <div className="bg-ink-700/40 rounded-2xl p-4 border border-ink-600">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Description</p>
                <p className="text-sm text-slate-300">{examen.description}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Onglet QUESTIONS ── */}
        {onglet === 'questions' && (
          <div className="flex flex-col gap-3">
            {examen.statut === 'BROUILLON' && !showAdd && !editQ && (
              <div className="flex justify-end">
                <Btn size="sm" onClick={() => setShowAdd(true)}>+ Question</Btn>
              </div>
            )}
            {showAdd && (
              <div className="bg-ink-700/50 rounded-2xl p-4 border border-violet-500/20">
                <p className="text-sm font-semibold text-violet-400 mb-3">Nouvelle question</p>
                <FormQuestion onSave={handleAdd} onClose={() => setShowAdd(false)} />
              </div>
            )}
            {loadingQ ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : questions.length === 0 ? (
              <EmptyState icon="❓" title="Aucune question" desc="Ajoutez des questions à cet examen." />
            ) : (
              questions.map((q, idx) => (
                <div key={q.id}>
                  {editQ?.id === q.id ? (
                    <div className="bg-ink-700/50 rounded-2xl p-4 border border-amber-500/20">
                      <p className="text-sm font-semibold text-amber-400 mb-3">Modifier question</p>
                      <FormQuestion initial={q} onSave={handleEdit} onClose={() => setEditQ(null)} />
                    </div>
                  ) : (
                    <div className="bg-ink-700/40 rounded-2xl p-4 border border-ink-600">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-500">Q{idx + 1}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold
                              ${q.type === 'QCM' ? 'bg-violet-500/20 text-violet-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                              {q.type}
                            </span>
                            <span className="text-xs text-amber-400">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                          </div>
                          <p className="text-sm text-slate-200 font-medium">{q.texte}</p>
                          <div className="mt-2 flex flex-col gap-1">
                            {(q.reponses || []).map((r) => (
                              <div key={r.id} className={`flex items-center gap-2 text-xs px-2 py-1 rounded-lg
                                ${r.est_correcte ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-500'}`}>
                                <span>{r.est_correcte ? '✅' : '○'}</span>
                                <span>{r.texte}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {examen.statut === 'BROUILLON' && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => setEditQ(q)}
                              className="text-xs text-slate-400 hover:text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-400/10 transition-all">✏️</button>
                            <button onClick={() => handleDelete(q.id)}
                              className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-400/10 transition-all">🗑</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Onglet ÉTUDIANTS ── */}
        {onglet === 'etudiants' && (
          <div className="flex flex-col gap-4">
            {/* Stats globales */}
            {tentatives.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: tentatives.length, color: 'text-slate-100' },
                  { label: 'Réussis', value: nbReussi, color: 'text-emerald-400' },
                  { label: 'Échoués', value: nbEchoue, color: 'text-rose-400' },
                  { label: 'Moy. score', value: scoreMoy ? `${scoreMoy}%` : '—', color: 'text-violet-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-ink-700/40 rounded-xl p-3 text-center border border-ink-600">
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {loadingT ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : tentatives.length === 0 ? (
              <EmptyState icon="👥" title="Aucun étudiant" desc="Aucun étudiant n'a encore passé cet examen." />
            ) : (
              <div className="flex flex-col gap-2">
                {tentatives.map((t) => (
                  <div key={t.id} className="bg-ink-700/40 rounded-2xl px-4 py-3 border border-ink-600 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {t.etudiant_photo ? (
                        <img src={t.etudiant_photo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400 flex-shrink-0">
                          {t.etudiant_prenom?.[0]}{t.etudiant_nom?.[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {t.etudiant_prenom} {t.etudiant_nom}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t.submitted_at ? fmtDatetime(t.submitted_at) : fmtDatetime(t.started_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {t.pourcentage != null && (
                        <div className="text-right">
                          <p className={`text-sm font-bold ${parseFloat(t.pourcentage) >= examen.note_passage ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {parseFloat(t.pourcentage).toFixed(0)}%
                          </p>
                          <p className="text-xs text-slate-500">{t.score_obtenu != null ? `${parseFloat(t.score_obtenu).toFixed(1)} pts` : ''}</p>
                        </div>
                      )}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
                        ${t.statut === 'REUSSI'
                          ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25'
                          : t.statut === 'ECHOUE'
                          ? 'text-rose-400 bg-rose-400/10 border-rose-400/25'
                          : 'text-amber-400 bg-amber-400/10 border-amber-400/25'}`}>
                        {t.statut === 'REUSSI' ? '🏆 Réussi' : t.statut === 'ECHOUE' ? '❌ Échoué' : '⏳ En cours'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-3 border-t border-ink-700 mt-2 sticky bottom-0 bg-ink-900">
        <Btn variant="ghost" onClick={onClose}>Fermer</Btn>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Examens() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isTuteur   = user?.role === 'tuteur'
  const isEtudiant = user?.role === 'etudiant'

  const [examens, setExamens]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [salles, setSalles]             = useState([])
  const [showCreate, setShowCreate]     = useState(false)
  const [editExamen, setEditExamen]     = useState(null)
  const [manageExamen, setManageExamen] = useState(null)
  const { toasts, success, error }      = useToast()

  const loadExamens = async () => {
    setLoading(true)
    try {
      if (isTuteur) {
        const { data } = await examensAPI.getMesExamens()
        setExamens(data)
      } else {
        const { data } = await examensAPI.getMesExamensEtudiant()
        setExamens(data)
      }
    } catch (err) {
      error('Impossible de charger les examens')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    loadExamens()
    if (isTuteur) {
      sallesAPI.getMesSalles().then(({ data }) =>
        setSalles(data.filter(s => s.mon_role === 'ADMIN' || s.mon_role === 'CO_ADMIN'))
      )
    }
  }, [isTuteur])

  const handleCreate = async (data) => {
    try {
      await examensAPI.create(data)
      await loadExamens()
      setShowCreate(false)
      success('Examen créé en brouillon !')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleEdit = async (data) => {
    try {
      await examensAPI.update(editExamen.id, data)
      await loadExamens()
      setEditExamen(null)
      success('Examen modifié !')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handlePublier = async (examen) => {
    if (!confirm(`Publier "${examen.titre}" ? L'examen ne sera plus modifiable.`)) return
    try {
      await examensAPI.publier(examen.id)
      await loadExamens()
      success('Examen publié ! Les étudiants peuvent maintenant le passer.')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleArchiver = async (examen) => {
    if (!confirm(`Archiver "${examen.titre}" ?`)) return
    try {
      await examensAPI.archiver(examen.id)
      await loadExamens()
      success('Examen archivé.')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const handleCommencer    = (examen) => navigate(`/examens/${examen.id}/passer`)
  const handleVoirResultats = (examen) => navigate(`/examens/${examen.id}/resultats`)

  const brouillons = examens.filter(e => e.statut === 'BROUILLON')
  const publies    = examens.filter(e => e.statut === 'PUBLIE')
  const archives   = examens.filter(e => e.statut === 'ARCHIVE')

  return (
    <div className="flex flex-col h-full">
      <Header title="Examens" subtitle={isTuteur ? 'Créez et gérez vos examens' : 'Vos examens disponibles'} />
      <ToastContainer toasts={toasts} />

      <div className="flex-1 overflow-y-auto p-6">
        {isTuteur && (
          <div className="flex justify-end mb-6">
            <Btn onClick={() => setShowCreate(true)}>➕ Créer un examen</Btn>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : examens.length === 0 ? (
          <EmptyState
            icon="📝"
            title={isTuteur ? 'Aucun examen créé' : 'Aucun examen disponible'}
            desc={isTuteur ? 'Cliquez sur "Créer un examen" pour commencer.' : 'Rejoignez des salles pour accéder aux examens.'}
            action={isTuteur ? { label: '➕ Créer', onClick: () => setShowCreate(true) } : null}
          />
        ) : isTuteur ? (
          <div className="flex flex-col gap-8">
            {brouillons.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">✏️ Brouillons ({brouillons.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {brouillons.map(e => (
                    <ExamenCardTuteur key={e.id} examen={e}
                      onEdit={setEditExamen} onManage={setManageExamen}
                      onPublier={handlePublier} onArchiver={handleArchiver} />
                  ))}
                </div>
              </section>
            )}
            {publies.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-3">✅ Publiés ({publies.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {publies.map(e => (
                    <ExamenCardTuteur key={e.id} examen={e}
                      onEdit={setEditExamen} onManage={setManageExamen}
                      onPublier={handlePublier} onArchiver={handleArchiver} />
                  ))}
                </div>
              </section>
            )}
            {archives.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">📦 Archives ({archives.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {archives.map(e => (
                    <ExamenCardTuteur key={e.id} examen={e}
                      onEdit={setEditExamen} onManage={setManageExamen}
                      onPublier={handlePublier} onArchiver={handleArchiver} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {examens.map(e => (
              <ExamenCardEtudiant key={e.id} examen={e}
                onCommencer={handleCommencer}
                onVoirResultats={handleVoirResultats} />
            ))}
          </div>
        )}
      </div>

      {/* Overlay — Créer */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-ink-950/95 overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-6">
            <div className="w-full max-w-2xl bg-ink-800 border border-ink-600 rounded-2xl shadow-2xl my-8">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-ink-700">
                <h2 className="font-bold text-lg text-white">➕ Créer un examen</h2>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ink-700 text-slate-400 hover:text-white transition-colors">✕</button>
              </div>
              <div className="px-6 py-5">
                <FormExamen salles={salles} onSave={handleCreate} onClose={() => setShowCreate(false)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay — Modifier */}
      {!!editExamen && (
        <div className="fixed inset-0 z-50 bg-ink-950/95 overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-6">
            <div className="w-full max-w-2xl bg-ink-800 border border-ink-600 rounded-2xl shadow-2xl my-8">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-ink-700">
                <h2 className="font-bold text-lg text-white">✏️ Modifier l'examen</h2>
                <button onClick={() => setEditExamen(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ink-700 text-slate-400 hover:text-white transition-colors">✕</button>
              </div>
              <div className="px-6 py-5">
                <FormExamen initial={editExamen} salles={salles} onSave={handleEdit} onClose={() => setEditExamen(null)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay — Détails / Questions / Étudiants */}
      {!!manageExamen && (
        <div className="fixed inset-0 z-50 bg-ink-950/95 overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-6">
            <div className="w-full max-w-2xl bg-ink-800 border border-ink-600 rounded-2xl shadow-2xl my-8">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-ink-700">
                <div>
                  <h2 className="font-bold text-lg text-white">{manageExamen.titre}</h2>
                  <p className="text-xs text-slate-500">{manageExamen.salle_nom}</p>
                </div>
                <button onClick={() => setManageExamen(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ink-700 text-slate-400 hover:text-white transition-colors">✕</button>
              </div>
              <div className="px-6 py-5">
                <PanelDetailsExamen examen={manageExamen} onClose={() => setManageExamen(null)} onUpdate={loadExamens} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}