import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { examensAPI, sallesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import { Btn, Modal, FormGroup, Badge, Spinner, EmptyState, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'
import PanelDetailsExamen from './PanelDetailsExamen'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const statutConfig = {
  BROUILLON: { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Brouillon',  icon: '✏️' },
  PUBLIE:    { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Publié',     icon: '✅' },
  ARCHIVE:   { color: 'text-slate-500',   bg: 'bg-slate-100',   border: 'border-slate-200',   label: 'Archivé',    icon: '📦' },
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—'
const fmtDatetime = (d) => d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'

// ─── Formulaire création / modification examen ───────────────────────────────
function FormExamen({ salles, onSave, onClose, initial = null }) {
  const [form, setForm] = useState({
    titre: initial?.titre || '',
    description: initial?.description || '',
    salleId: initial?.salle_id || '',
    notePassage: initial?.note_passage || 70,
    dureeMinutes: initial?.duree_minutes || 30,

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
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={form.melangerQuestions}
            onChange={e => set('melangerQuestions', e.target.checked)} className="w-4 h-4 accent-amber-500" />
          Mélanger les questions
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={form.melangerReponses}
            onChange={e => set('melangerReponses', e.target.checked)} className="w-4 h-4 accent-amber-500" />
          Mélanger les réponses
        </label>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-amber-200">
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
  const [type, setType] = useState(initial?.type || 'QCM')
  const [points, setPoints] = useState(initial?.points || 1)
  const [reponses, setReponses] = useState(
    initial?.reponses?.length
      ? initial.reponses.map(r => ({ texte: r.texte, estCorrecte: r.est_correcte }))
      : [{ texte: '', estCorrecte: false }, { texte: '', estCorrecte: false }]
  )
  const [saving, setSaving] = useState(false)

  const addReponse = () => setReponses(r => [...r, { texte: '', estCorrecte: false }])
  const removeReponse = (i) => setReponses(r => r.filter((_, idx) => idx !== i))
  const setRep = (i, k, v) => setReponses(r => r.map((x, idx) => idx === i ? { ...x, [k]: v } : x))
  const setCorrect = (i) => {
    if (type === 'VRAI_FAUX' || type === 'QCM') {
      setReponses(r => r.map((x, idx) => ({ ...x, estCorrecte: idx === i })))
    }
  }

  useEffect(() => {
    if (type === 'VRAI_FAUX') {
      setReponses([
        { texte: 'Vrai', estCorrecte: false },
        { texte: 'Faux', estCorrecte: false },
      ])
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
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Réponses</p>
        {reponses.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <button onClick={() => setCorrect(i)}
              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all
                ${r.estCorrecte ? 'bg-amber-500 border-amber-500' : 'border-amber-300 hover:border-amber-400'}`} />
            <input className="input flex-1 py-1.5" value={r.texte}
              disabled={type === 'VRAI_FAUX'}
              onChange={e => setRep(i, 'texte', e.target.value)}
              placeholder={`Réponse ${i + 1}`} />
            {type === 'QCM' && reponses.length > 2 && (
              <button onClick={() => removeReponse(i)}
                className="text-slate-400 hover:text-rose-500 text-lg leading-none">×</button>
            )}
          </div>
        ))}
        {type === 'QCM' && (
          <button onClick={addReponse}
            className="text-xs text-amber-500 hover:text-amber-600 flex items-center gap-1 mt-1">
            + Ajouter une réponse
          </button>
        )}
        <p className="text-xs text-slate-500">Cliquez sur le cercle pour cocher la bonne réponse.</p>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-amber-200">
        <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
        <Btn onClick={handleSubmit} disabled={saving}>
          {saving ? 'Enregistrement…' : (initial ? '✏️ Modifier' : '+ Ajouter')}
        </Btn>
      </div>
    </div>
  )
}

// ─── Carte examen tuteur (version claire) ──────────────────────────────────────
function ExamenCardTuteur({ examen, onEdit, onManage, onVoirDetails, onPublier, onArchiver }) {
  const cfg = statutConfig[examen.statut] || statutConfig.BROUILLON
  return (
    <div className={`border ${cfg.border} rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg hover:border-amber-400 transition-all bg-white`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <h3 className="font-semibold truncate text-slate-800">{examen.titre}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{examen.salle_nom}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Questions', value: examen.nb_questions || 0 },

          { label: 'Réussis', value: examen.nb_reussi || 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-amber-50 rounded-xl py-2">
            <p className="text-sm font-bold text-amber-700">{value}</p>
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
            <Btn size="sm" variant="ghost" onClick={() => onVoirDetails(examen)}>📊 Voir détails</Btn>
            <Btn size="sm" variant="danger" onClick={() => onArchiver(examen)}>📦 Archiver</Btn>
          </>
        )}
        {examen.statut === 'ARCHIVE' && (
          <Btn size="sm" variant="ghost" onClick={() => onVoirDetails(examen)}>📊 Statistiques</Btn>
        )}
      </div>
    </div>
  )
}

// ─── Carte examen étudiant — 3 statuts : Réussi / Échoué / Expiré ───────────────
function ExamenCardEtudiant({ examen, onCommencer, onVoirResultats }) {
  const maintenant = new Date()
  const dateLimite = examen.date_limite ? new Date(examen.date_limite) : null
  const dateDebut  = examen.date_debut  ? new Date(examen.date_debut)  : null
  const dejaReussi = examen.deja_reussi > 0
  const aEchoue    = examen.derniere_tentative_statut === 'ECHOUE'
  const expire     = dateLimite && maintenant > dateLimite && !dejaReussi && !aEchoue
  const notYet     = dateDebut && maintenant < dateDebut
  const disponible = !dejaReussi && !aEchoue && !expire && !notYet && examen.statut === 'PUBLIE'

  // Corrigé disponible si date_affichage_resultats est passée
  const dateAffichage = examen.date_affichage_resultats ? new Date(examen.date_affichage_resultats) : null
  const corrigeDisponible = dateAffichage && maintenant >= dateAffichage
  // Étudiant qui n'a pas passé mais le corrigé est maintenant visible
  const naPasPasseMaisCorrige = corrigeDisponible && !dejaReussi && !aEchoue && examen.nb_tentatives_faites === 0

  // ── Badge statut étudiant ──
  let statusBadge
  if (dejaReussi) {
    statusBadge = (
      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99,
        background:'#ECFDF5', color:'#059669', border:'1px solid #86EFAC' }}>
        ✅ Réussi
      </span>
    )
  } else if (aEchoue) {
    statusBadge = (
      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99,
        background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA' }}>
        ❌ Échoué
      </span>
    )
  } else if (expire) {
    statusBadge = (
      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99,
        background:'#F5F0E6', color:'#8B6914', border:'1px solid #E8D5A3' }}>
        ⏰ Expiré
      </span>
    )
  } else if (notYet) {
    statusBadge = (
      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99,
        background:'#FFF7ED', color:'#D97706', border:'1px solid #FDE68A' }}>
        ⏳ Bientôt disponible
      </span>
    )
  } else {
    statusBadge = (
      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99,
        background:'#EFF6FF', color:'#1565C0', border:'1px solid #BFDBFE' }}>
        📝 Disponible
      </span>
    )
  }

  return (
    <div style={{
      border:'1px solid #E8D5A3', borderRadius:16, padding:20,
      display:'flex', flexDirection:'column', gap:12,
      background:'#FFFFFF', boxShadow:'0 2px 8px rgba(10,22,40,0.05)',
      transition:'box-shadow 0.2s',
      fontFamily:'Plus Jakarta Sans, sans-serif',
    }}>
      {/* Header */}
      <div>
        {statusBadge}
        <h3 style={{ fontWeight:700, fontSize:15, color:'#0A1628', margin:'8px 0 2px',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {examen.titre}
        </h3>
        <p style={{ fontSize:12, color:'#94A3B8', margin:0 }}>
          {examen.salle_nom} · {examen.tuteur_prenom} {examen.tuteur_nom}
        </p>
      </div>

      {examen.description && (
        <p style={{ fontSize:12, color:'#64748B', margin:0,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {examen.description}
        </p>
      )}

      {/* Infos */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[
          { label:'Durée',       value:`${examen.duree_minutes} min` },
          { label:'Pour réussir',value:`${examen.note_passage}%`    },
        ].map(({ label, value }) => (
          <div key={label} style={{ background:'#F5F0E6', borderRadius:10, padding:'8px 12px', textAlign:'center' }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#8B6914' }}>{value}</div>
            <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {dateLimite && !expire && (
        <p style={{ fontSize:11, color:'#D97706', margin:0 }}>
          ⏰ Jusqu'au {fmtDatetime(examen.date_limite)}
        </p>
      )}

      {/* Boutons */}
      <div style={{ display:'flex', gap:8 }}>
        {disponible && (
          <Btn size="sm" onClick={() => onCommencer(examen)} className="flex-1">
            ▶ Commencer
          </Btn>
        )}
        {(dejaReussi || aEchoue || expire) && (
          <Btn size="sm" variant="ghost" onClick={() => onVoirResultats(examen)}>
            {dejaReussi ? '🏆 Voir mon résultat' : expire ? '📊 Voir corrigé' : '📊 Mes résultats'}
          </Btn>
        )}
        {naPasPasseMaisCorrige && (
          <Btn size="sm" variant="ghost" onClick={() => onVoirResultats(examen)}>
            
          </Btn>
        )}
      </div>
    </div>
  )
}

// ─── Panel gestion questions (tuteur) ────────────────────────────────────────
function PanelQuestions({ examen, onClose, onUpdate }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading]    = useState(true)
  const [showAdd, setShowAdd]    = useState(false)
  const [editQ, setEditQ]        = useState(null)
  const { success, error, toasts } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await examensAPI.getById(examen.id)
      setQuestions(data.questions || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [examen.id])

  const handleAdd = async (data) => {
    await examensAPI.addQuestion(examen.id, data)
    await load()
    setShowAdd(false)
    success('Question ajoutée !')
    onUpdate()
  }

  const handleEdit = async (data) => {
    await examensAPI.updateQuestion(examen.id, editQ.id, data)
    await load()
    setEditQ(null)
    success('Question modifiée !')
    onUpdate()
  }

  const handleDelete = async (qId) => {
    if (!confirm('Supprimer cette question ?')) return
    try {
      await examensAPI.deleteQuestion(examen.id, qId)
      await load()
      success('Question supprimée.')
      onUpdate()
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  return (
    <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
      <ToastContainer toasts={toasts} />

      <div className="flex items-center justify-between sticky top-0 bg-white pb-2 border-b border-amber-200">
        <div>
          <h3 className="font-semibold text-slate-800">{examen.titre}</h3>
          <p className="text-xs text-slate-500">{questions.length} question(s)</p>
        </div>
        {examen.statut === 'BROUILLON' && !showAdd && !editQ && (
          <Btn size="sm" onClick={() => setShowAdd(true)}>+ Question</Btn>
        )}
      </div>

      {showAdd && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
          <p className="text-sm font-semibold text-amber-600 mb-3">Nouvelle question</p>
          <FormQuestion onSave={handleAdd} onClose={() => setShowAdd(false)} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : questions.length === 0 ? (
        <EmptyState icon="❓" title="Aucune question" desc="Ajoutez des questions à cet examen." />
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((q, idx) => (
            <div key={q.id}>
              {editQ?.id === q.id ? (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                  <p className="text-sm font-semibold text-amber-600 mb-3">Modifier question</p>
                  <FormQuestion initial={q} onSave={handleEdit} onClose={() => setEditQ(null)} />
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500">Q{idx + 1}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold
                          ${q.type === 'QCM' ? 'bg-amber-100 text-amber-700' : 'bg-amber-100 text-amber-700'}`}>
                          {q.type}
                        </span>
                        <span className="text-xs text-amber-600">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium">{q.texte}</p>
                      <div className="mt-2 flex flex-col gap-1">
                        {(q.reponses || []).map((r) => (
                          <div key={r.id} className={`flex items-center gap-2 text-xs px-2 py-1 rounded-lg
                            ${r.est_correcte ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500'}`}>
                            <span>{r.est_correcte ? '✅' : '○'}</span>
                            <span>{r.texte}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {examen.statut === 'BROUILLON' && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setEditQ(q)}
                          className="text-xs text-slate-400 hover:text-amber-600 px-2 py-1 rounded-lg hover:bg-amber-50 transition-all">✏️</button>
                        <button onClick={() => handleDelete(q.id)}
                          className="text-xs text-slate-400 hover:text-rose-500 px-2 py-1 rounded-lg hover:bg-rose-50 transition-all">🗑</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-amber-200 sticky bottom-0 bg-white">
        <Btn variant="ghost" onClick={onClose}>Fermer</Btn>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Examens() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isTuteur = user?.role === 'tuteur'
  const isEtudiant = user?.role === 'etudiant'

  const [examens, setExamens]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [salles, setSalles]             = useState([])
  const [showCreate, setShowCreate]     = useState(false)
  const [editExamen, setEditExamen]     = useState(null)
  const [manageExamen, setManageExamen] = useState(null)
  const [detailsExamen, setDetailsExamen] = useState(null)
  const { toasts, success, error } = useToast()

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

  const handleCommencer = (examen) => {
    navigate(`/examens/${examen.id}/passer`)
  }

  const handleVoirResultats = (examen) => {
    navigate(`/examens/${examen.id}/resultats`)
  }

  // Filtres tuteur
  const brouillons = examens.filter(e => e.statut === 'BROUILLON')
  const publies    = examens.filter(e => e.statut === 'PUBLIE')
  const archives   = examens.filter(e => e.statut === 'ARCHIVE')

  return (
    <div className="flex flex-col h-full bg-ivory-50">
      <Header title="Examens" subtitle={isTuteur ? 'Créez et gérez vos examens' : 'Vos examens disponibles'} />
      <ToastContainer toasts={toasts} />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Header actions */}
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
          /* Vue tuteur — par statut */
          <div className="flex flex-col gap-8">
            {brouillons.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  ✏️ Brouillons ({brouillons.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {brouillons.map(e => (
                    <ExamenCardTuteur key={e.id} examen={e}
                      onEdit={setEditExamen}
                      onManage={setManageExamen}
                      onVoirDetails={setDetailsExamen}
                      onPublier={handlePublier}
                      onArchiver={handleArchiver} />
                  ))}
                </div>
              </section>
            )}
            {publies.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  ✅ Publiés ({publies.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {publies.map(e => (
                    <ExamenCardTuteur key={e.id} examen={e}
                      onEdit={setEditExamen}
                      onManage={setManageExamen}
                      onVoirDetails={setDetailsExamen}
                      onPublier={handlePublier}
                      onArchiver={handleArchiver} />
                  ))}
                </div>
              </section>
            )}
            {archives.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  📦 Archives ({archives.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {archives.map(e => (
                    <ExamenCardTuteur key={e.id} examen={e}
                      onEdit={setEditExamen}
                      onManage={setManageExamen}
                      onVoirDetails={setDetailsExamen}
                      onPublier={handlePublier}
                      onArchiver={handleArchiver} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Vue étudiant */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {examens.map(e => (
              <ExamenCardEtudiant key={e.id} examen={e}
                onCommencer={handleCommencer}
                onVoirResultats={handleVoirResultats} />
            ))}
          </div>
        )}
      </div>

      {/* Overlay plein écran — Créer */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-6">
            <div className="w-full max-w-2xl bg-white border border-amber-200 rounded-2xl shadow-xl my-8">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-amber-200">
                <h2 className="font-bold text-lg text-slate-800">➕ Créer un examen</h2>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">✕</button>
              </div>
              <div className="px-6 py-5">
                <FormExamen salles={salles} onSave={handleCreate} onClose={() => setShowCreate(false)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay plein écran — Modifier */}
      {!!editExamen && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-6">
            <div className="w-full max-w-2xl bg-white border border-amber-200 rounded-2xl shadow-xl my-8">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-amber-200">
                <h2 className="font-bold text-lg text-slate-800">✏️ Modifier l'examen</h2>
                <button onClick={() => setEditExamen(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">✕</button>
              </div>
              <div className="px-6 py-5">
                <FormExamen initial={editExamen} salles={salles} onSave={handleEdit} onClose={() => setEditExamen(null)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay plein écran — Détails examen */}
      {!!detailsExamen && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-6">
            <div className="w-full max-w-3xl bg-white border border-amber-200 rounded-2xl shadow-xl my-8">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-amber-200">
                <h2 className="font-bold text-lg text-slate-800">📊 {detailsExamen.titre}</h2>
                <button onClick={() => setDetailsExamen(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">✕</button>
              </div>
              <div className="px-6 py-5">
                <PanelDetailsExamen examen={detailsExamen} onClose={() => setDetailsExamen(null)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay plein écran — Questions */}
      {!!manageExamen && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-6">
            <div className="w-full max-w-2xl bg-white border border-amber-200 rounded-2xl shadow-xl my-8">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-amber-200">
                <h2 className="font-bold text-lg text-slate-800">📝 Questions — {manageExamen.titre}</h2>
                <button onClick={() => setManageExamen(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">✕</button>
              </div>
              <div className="px-6 py-5">
                <PanelQuestions examen={manageExamen} onClose={() => setManageExamen(null)} onUpdate={loadExamens} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}