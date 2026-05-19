import React, { useState, useEffect } from 'react'
import { paiementsAPI } from '../../services/api'

// ── Logos / couleurs des banques ───────────────────────────────────────────
const METHODES = [
  {
    id: 'CIH',
    nom: 'CIH Bank',
    couleur: 'from-green-700 to-green-500',
    accent: '#16a34a',
    accentLight: 'rgba(22,163,74,0.15)',
    accentBorder: 'rgba(22,163,74,0.35)',
    logo: '🏦',
    tag: 'Carte bancaire',
    description: 'Paiez avec votre carte CIH',
  },
  {
    id: 'ATTIJARIWAFA',
    nom: 'Attijariwafa',
    couleur: 'from-red-700 to-orange-500',
    accent: '#dc2626',
    accentLight: 'rgba(220,38,38,0.15)',
    accentBorder: 'rgba(220,38,38,0.35)',
    logo: '🏛️',
    tag: 'Carte bancaire',
    description: 'Paiez avec votre carte Attijariwafa',
  },
  {
    id: 'PAYPAL',
    nom: 'PayPal',
    couleur: 'from-blue-700 to-blue-500',
    accent: '#1d4ed8',
    accentLight: 'rgba(29,78,216,0.15)',
    accentBorder: 'rgba(29,78,216,0.35)',
    logo: '🅿️',
    tag: 'Portefeuille en ligne',
    description: 'Paiez via votre compte PayPal',
  },
]

// ── Formatage numéro carte ─────────────────────────────────────────────────
const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
const formatExp  = (v) => {
  const n = v.replace(/\D/g, '').slice(0, 4)
  return n.length >= 2 ? n.slice(0, 2) + '/' + n.slice(2) : n
}

export default function PaiementModal({ seanceId, onClose, onSuccess }) {
  const [step, setStep]           = useState('info')   // info | methode | formulaire | processing | done
  const [info, setInfo]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [methode, setMethode]     = useState(null)
  const [form, setForm]           = useState({ numero: '', nom: '', expiration: '', cvv: '', email: '', motdepasse: '' })
  const [erreur, setErreur]       = useState('')
  const [paying, setPaying]       = useState(false)
  const [paiement, setPaiement]   = useState(null)
  const [countdown, setCountdown] = useState(3)

  // Charger infos séance & tarif
  useEffect(() => {
    paiementsAPI.getInfoSeance(seanceId)
      .then(({ data }) => { setInfo(data); setLoading(false) })
      .catch(() => { setErreur('Impossible de charger les informations'); setLoading(false) })
  }, [seanceId])

  // Compte à rebours après paiement réussi
  useEffect(() => {
    if (step !== 'done') return
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); onSuccess?.(paiement); return 0 }
      return c - 1
    }), 1000)
    return () => clearInterval(t)
  }, [step])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const validerFormulaire = () => {
    if (methode.id === 'PAYPAL') {
      if (!form.email || !form.email.includes('@')) return 'Email PayPal invalide'
      if (!form.motdepasse || form.motdepasse.length < 4) return 'Mot de passe requis'
    } else {
      const num = form.numero.replace(/\s/g, '')
      if (num.length !== 16) return 'Numéro de carte invalide (16 chiffres)'
      if (!form.nom.trim()) return 'Nom du titulaire requis'
      const exp = form.expiration.replace('/', '')
      if (exp.length !== 4) return 'Date d\'expiration invalide (MM/AA)'
      const mois = parseInt(exp.slice(0, 2))
      if (mois < 1 || mois > 12) return 'Mois invalide'
      if (!form.cvv || form.cvv.length < 3) return 'CVV invalide'
    }
    return null
  }

  const handlePayer = async () => {
    const err = validerFormulaire()
    if (err) { setErreur(err); return }
    setErreur('')
    setPaying(true)
    setStep('processing')

    // Simuler délai de traitement bancaire
    await new Promise(r => setTimeout(r, 2200))

    try {
      const payload = {
        seanceId,
        methode: methode.id,
        donneesCartePartielle: methode.id !== 'PAYPAL'
          ? { dernierChiffres: form.numero.replace(/\s/g, '').slice(-4), nom: form.nom }
          : { email: form.email },
      }
      const { data } = await paiementsAPI.payer(payload)
      setPaiement(data.paiement)
      setStep('done')
    } catch (e) {
      setErreur(e.response?.data?.error || 'Erreur lors du paiement')
      setStep('formulaire')
    } finally {
      setPaying(false)
    }
  }

  const methodeSelectionnee = METHODES.find(m => m.id === methode?.id)

  // ── Overlay ─────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget && step !== 'processing') onClose() }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#13131f', border: '1px solid #2d2d4a', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
      >
        {/* ── En-tête ── */}
        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', padding: '24px 28px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 28 }}>💳</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Paiement sécurisé</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Simulation — aucune donnée réelle</div>
              </div>
            </div>
            {step !== 'processing' && (
              <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            )}
          </div>
          {/* Steps indicator */}
          <div className="flex gap-2 mt-4">
            {['info', 'methode', 'formulaire', 'done'].map((s, i) => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: ['info','methode','formulaire','processing','done'].indexOf(step) >= i
                  ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 28px', maxHeight: '65vh', overflowY: 'auto' }}>

          {/* ── ÉTAPE : chargement ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div style={{ width: 40, height: 40, border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: '#64748b', fontSize: 14 }}>Chargement des informations…</p>
            </div>
          )}

          {/* ── ÉTAPE 1 : info séance ── */}
          {!loading && step === 'info' && info && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
                Vous êtes sur le point de payer la séance suivante :
              </p>

              <div style={{ background: '#0f0f1a', border: '1px solid #2d2d4a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                {[
                  ['📚 Séance',    info.seance.titre],
                  ['🏫 Salle',     info.seance.salle_nom],
                  ['👨‍🏫 Tuteur',    `${info.seance.tuteur_prenom} ${info.seance.tuteur_nom}`],
                  ['📖 Matière',   info.seance.matiere || '—'],
                  ['📅 Date',      new Date(info.seance.date_debut).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })],
                  ['⏱️ Durée',     `${info.seance.duree} min (${(info.seance.duree/60).toFixed(1)}h)`],
                  ['💰 Tarif',     `${info.tarif.tarifHeure} DH/h`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1e1e35' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Récap financier */}
              <div style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(79,70,229,0.12))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Gain tuteur (85%)</span>
                  <span style={{ fontSize: 12, color: '#a78bfa' }}>{info.tarif.gainTuteur} DH</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Commission plateforme (15%)</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{info.tarif.commission} DH</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(124,58,237,0.2)' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Total à payer</span>
                  <span style={{ fontSize: 26, fontWeight: 900, color: '#7c3aed' }}>{info.tarif.montantTotal} DH</span>
                </div>
              </div>

              {info.tarif.montantTotal === 0 && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fbbf24' }}>
                  ⚠️ Aucun tarif défini pour cette matière. Le tuteur doit configurer ses tarifs.
                </div>
              )}

              <button
                onClick={() => setStep('methode')}
                disabled={info.tarif.montantTotal === 0}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: info.tarif.montantTotal > 0 ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : '#374151',
                  color: '#fff', fontWeight: 800, fontSize: 15,
                  boxShadow: info.tarif.montantTotal > 0 ? '0 4px 20px rgba(124,58,237,0.4)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                Choisir le mode de paiement →
              </button>
            </div>
          )}

          {/* ── ÉTAPE 2 : choix méthode ── */}
          {step === 'methode' && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
                Choisissez votre méthode de paiement :
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {METHODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMethode(m); setStep('formulaire'); setErreur('') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 20px', borderRadius: 14, border: '1px solid #2d2d4a',
                      background: '#0f0f1a', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${m.accent}`; e.currentTarget.style.background = m.accentLight }}
                    onMouseLeave={e => { e.currentTarget.style.border = '1px solid #2d2d4a'; e.currentTarget.style.background = '#0f0f1a' }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                      background: `linear-gradient(135deg,${m.couleur.split(' ')[1].replace('to-','').replace('green-700','#15803d').replace('red-700','#b91c1c').replace('blue-700','#1d4ed8')},${m.couleur.split(' ')[2]?.replace('green-500','#22c55e').replace('orange-500','#f97316').replace('blue-500','#3b82f6') || '#666'})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    }}>
                      {m.logo}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{m.nom}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{m.description}</div>
                    </div>
                    <div style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: m.accentLight, color: m.accent, border: `1px solid ${m.accentBorder}`,
                    }}>
                      {m.tag}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('info')}
                style={{ marginTop: 16, background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ← Retour
              </button>
            </div>
          )}

          {/* ── ÉTAPE 3 : formulaire ── */}
          {step === 'formulaire' && methodeSelectionnee && (
            <div>
              {/* Badge méthode */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
                padding: '10px 14px', borderRadius: 10,
                background: methodeSelectionnee.accentLight,
                border: `1px solid ${methodeSelectionnee.accentBorder}`,
              }}>
                <span style={{ fontSize: 20 }}>{methodeSelectionnee.logo}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{methodeSelectionnee.nom}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{methodeSelectionnee.tag}</div>
                </div>
                <button onClick={() => setStep('methode')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12 }}>Changer</button>
              </div>

              {/* Montant rappel */}
              <div style={{ textAlign: 'center', marginBottom: 20, padding: '12px', background: '#0f0f1a', borderRadius: 10, border: '1px solid #2d2d4a' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Montant à payer</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#7c3aed' }}>{info?.tarif.montantTotal} DH</div>
              </div>

              {/* Formulaire PayPal */}
              {methodeSelectionnee.id === 'PAYPAL' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Email PayPal</label>
                    <input
                      type="email"
                      placeholder="votre@email.com"
                      value={form.email}
                      onChange={set('email')}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Mot de passe</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={form.motdepasse}
                      onChange={set('motdepasse')}
                      style={inputStyle}
                    />
                  </div>
                </div>
              ) : (
                /* Formulaire carte bancaire */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Visuel carte */}
                  <div style={{
                    borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden',
                    background: `linear-gradient(135deg,${
                      methodeSelectionnee.id === 'CIH' ? '#15803d,#16a34a' : '#b91c1c,#dc2626'
                    })`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ position: 'absolute', bottom: -30, left: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 14, position: 'relative' }}>{methodeSelectionnee.nom} • SIMULATION</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 4, marginBottom: 16, position: 'relative' }}>
                      {form.numero || '•••• •••• •••• ••••'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                      <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>TITULAIRE</div>
                        <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, textTransform: 'uppercase' }}>
                          {form.nom || 'VOTRE NOM'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>EXPIRE</div>
                        <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{form.expiration || 'MM/AA'}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Numéro de carte</label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={form.numero}
                      onChange={e => setForm(f => ({ ...f, numero: formatCard(e.target.value) }))}
                      maxLength={19}
                      style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 2 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Nom du titulaire</label>
                    <input
                      type="text"
                      placeholder="PRÉNOM NOM"
                      value={form.nom}
                      onChange={e => setForm(f => ({ ...f, nom: e.target.value.toUpperCase() }))}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Date d'expiration</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={form.expiration}
                        onChange={e => setForm(f => ({ ...f, expiration: formatExp(e.target.value) }))}
                        maxLength={5}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={form.cvv}
                        onChange={e => setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        maxLength={4}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {erreur && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: 13 }}>
                  ⚠️ {erreur}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => setStep('methode')}
                  style={{ flex: 0, padding: '13px 18px', borderRadius: 12, border: '1px solid #2d2d4a', background: '#0f0f1a', color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                >
                  ←
                </button>
                <button
                  onClick={handlePayer}
                  style={{
                    flex: 1, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: `linear-gradient(135deg,${methodeSelectionnee.accent},${methodeSelectionnee.accent}cc)`,
                    color: '#fff', fontWeight: 800, fontSize: 15,
                    boxShadow: `0 4px 20px ${methodeSelectionnee.accentLight}`,
                  }}
                >
                  🔒 Confirmer le paiement de {info?.tarif.montantTotal} DH
                </button>
              </div>

              <p style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 10 }}>
                🔒 Paiement simulé — Aucune transaction réelle
              </p>
            </div>
          )}

          {/* ── ÉTAPE : traitement ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                border: `4px solid ${methodeSelectionnee?.accent || '#7c3aed'}`,
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Traitement en cours…</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Connexion sécurisée à {methodeSelectionnee?.nom}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: methodeSelectionnee?.accent || '#7c3aed',
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* ── ÉTAPE : succès ── */}
          {step === 'done' && paiement && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, margin: '0 auto 16px',
                animation: 'scaleIn 0.4s ease-out',
              }}>
                ✅
              </div>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 6 }}>Paiement réussi !</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                La séance est maintenant <span style={{ color: '#34d399', fontWeight: 700 }}>confirmée</span>.<br/>
                Un email de confirmation vous a été envoyé.
              </div>

              <div style={{ background: '#0f0f1a', border: '1px solid #2d2d4a', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
                {[
                  ['Référence',  paiement.reference],
                  ['Méthode',    methodeSelectionnee?.nom],
                  ['Montant',    `${paiement.montant_total} DH`],
                  ['Date',       new Date(paiement.date_paiement).toLocaleString('fr-FR')],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e1e35' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{k}</span>
                    <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, fontFamily: k === 'Référence' ? 'monospace' : 'inherit' }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13, color: '#64748b' }}>
                Fermeture automatique dans <span style={{ color: '#7c3aed', fontWeight: 700 }}>{countdown}s</span>…
              </div>
            </div>
          )}

        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.8) } 50% { opacity: 1; transform: scale(1) } }
          @keyframes scaleIn { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        `}</style>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: '#0f0f1a', border: '1px solid #2d2d4a',
  color: '#e2e8f0', fontSize: 14, outline: 'none',
}