import React, { useState, useEffect } from 'react'
import { paiementsAPI } from '../../services/api'

// ── Logos / couleurs des banques (thème navy/gold) ───────────────────────────
const METHODES = [
  {
    id: 'CIH',
    nom: 'CIH Bank',
    accent: '#C5A059',
    accentLight: 'rgba(197,160,89,0.15)',
    accentBorder: 'rgba(197,160,89,0.35)',
    logo: '🏦',
    tag: 'Carte bancaire',
    description: 'Paiez avec votre carte CIH',
  },
  {
    id: 'ATTIJARIWAFA',
    nom: 'Attijariwafa',
    accent: '#C5A059',
    accentLight: 'rgba(197,160,89,0.15)',
    accentBorder: 'rgba(197,160,89,0.35)',
    logo: '🏛️',
    tag: 'Carte bancaire',
    description: 'Paiez avec votre carte Attijariwafa',
  },
  {
    id: 'PAYPAL',
    nom: 'PayPal',
    accent: '#C5A059',
    accentLight: 'rgba(197,160,89,0.15)',
    accentBorder: 'rgba(197,160,89,0.35)',
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

  // Styles communs thème navy/gold
  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(10,22,40,0.95)',
      backdropFilter: 'blur(6px)',
    },
    modal: {
      position: 'relative',
      width: '100%',
      maxWidth: '600px',
      borderRadius: '24px',
      overflow: 'hidden',
      background: '#FFFFFF',
      border: '2px solid #C5A059',
      boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
    },
    header: {
      background: 'linear-gradient(135deg, #0A1628, #1A3A5C)',
      padding: '24px 28px',
      borderBottom: '2px solid #C5A059',
    },
    headerTitle: {
      fontWeight: 800,
      fontSize: '18px',
      color: '#C5A059',
    },
    headerSub: {
      fontSize: '12px',
      color: 'rgba(197,160,89,0.7)',
      marginTop: '2px',
    },
    stepBar: {
      flex: 1,
      height: '4px',
      borderRadius: '2px',
      transition: 'all 0.3s',
    },
    body: {
      padding: '24px 28px',
      maxHeight: '65vh',
      overflowY: 'auto',
    },
    cardInfo: {
      background: '#F5F0E6',
      border: '1px solid #E8D5A3',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px',
    },
    cardBeneficiary: {
      background: '#F5F0E6',
      border: '1px solid #C5A059',
      borderRadius: '12px',
      padding: '14px',
      marginBottom: '16px',
    },
    cardRecap: {
      background: 'linear-gradient(135deg, rgba(10,22,40,0.08), rgba(197,160,89,0.08))',
      border: '1px solid #E8D5A3',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '20px',
    },
    buttonPrimary: {
      width: '100%',
      padding: '13px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      background: '#C5A059',
      color: '#0A1628',
      fontWeight: 800,
      fontSize: '15px',
      transition: 'all 0.2s',
    },
    buttonSecondary: {
      padding: '13px 18px',
      borderRadius: '12px',
      border: '1px solid #E8D5A3',
      background: '#F5F0E6',
      color: '#0A1628',
      fontWeight: 600,
      fontSize: '14px',
      cursor: 'pointer',
    },
    input: {
      width: '100%',
      padding: '11px 14px',
      borderRadius: '10px',
      background: '#FFFFFF',
      border: '1px solid #E8D5A3',
      color: '#0A1628',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s',
    },
    label: {
      display: 'block',
      fontSize: '12px',
      color: '#8B9CB5',
      marginBottom: '6px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    error: {
      marginTop: '14px',
      padding: '10px 14px',
      background: 'rgba(220,38,38,0.1)',
      border: '1px solid rgba(220,38,38,0.3)',
      borderRadius: '8px',
      color: '#DC2626',
      fontSize: '13px',
    },
    success: {
      background: 'rgba(5,150,105,0.1)',
      border: '1px solid rgba(5,150,105,0.3)',
      borderRadius: '8px',
      padding: '10px 14px',
      marginBottom: '16px',
    },
  }

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget && step !== 'processing') onClose() }}>
      <div style={styles.modal}>
        {/* ── En-tête ── */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>💳</span>
              <div>
                <div style={styles.headerTitle}>Paiement sécurisé</div>
                <div style={styles.headerSub}>Simulation — aucune donnée réelle</div>
              </div>
            </div>
            {step !== 'processing' && (
              <button onClick={onClose} style={{ color: '#C5A059', fontSize: '22px', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            )}
          </div>
          {/* Steps indicator */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {['info', 'methode', 'formulaire', 'done'].map((s, i) => (
              <div key={s} style={{
                ...styles.stepBar,
                background: ['info','methode','formulaire','processing','done'].indexOf(step) >= i ? '#C5A059' : '#E8D5A3',
              }} />
            ))}
          </div>
        </div>

        <div style={styles.body}>

          {/* ── ÉTAPE : chargement ── */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '12px' }}>
              <div style={{ width: 40, height: 40, border: `3px solid #C5A059`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: '#8B9CB5', fontSize: 14 }}>Chargement des informations…</p>
            </div>
          )}

          {/* ── ÉTAPE 1 : info séance ── */}
          {!loading && step === 'info' && info && (
            <div>
              <p style={{ color: '#8B9CB5', fontSize: 13, marginBottom: 16 }}>
                Vous êtes sur le point de payer la séance suivante :
              </p>

              <div style={styles.cardInfo}>
                {[
                  ['📚 Séance',    info.seance.titre],
                  ['🏫 Salle',     info.seance.salle_nom],
                  ['👨‍🏫 Tuteur',    `${info.seance.tuteur_prenom} ${info.seance.tuteur_nom}`],
                  ['📖 Matière',   info.seance.matiere || '—'],
                  ['📅 Date',      new Date(info.seance.date_debut).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })],
                  ['⏱️ Durée',     `${info.seance.duree} min (${(info.seance.duree/60).toFixed(1)}h)`],
                  ['💰 Tarif',     `${info.tarif.tarifHeure} DH/h`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #E8D5A3' }}>
                    <span style={{ fontSize: 13, color: '#8B9CB5' }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#0A1628', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Carte bénéficiaire tuteur */}
              <div style={styles.cardBeneficiary}>
                <div style={{ fontSize: 11, color: '#C5A059', fontWeight: 700, marginBottom: 10, letterSpacing: 0.5 }}>BÉNÉFICIAIRE DU PAIEMENT</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #C5A059, #D4B06A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    👨‍🏫
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#0A1628', fontSize: 14 }}>{info.seance.tuteur_prenom} {info.seance.tuteur_nom}</div>
                    {info.seance.tuteur_rib ? (
                      <div style={{ fontSize: 12, color: '#8B9CB5', marginTop: 3, fontFamily: 'monospace' }}>
                        RIB : {info.seance.tuteur_rib.slice(0, 4)} **** **** {info.seance.tuteur_rib.slice(-4)}
                        {info.seance.tuteur_nom_banque && (
                          <span style={{ marginLeft: 8, fontFamily: 'inherit', color: '#8B9CB5' }}>· {info.seance.tuteur_nom_banque}</span>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#DC2626', marginTop: 3 }}>
                        ⚠️ RIB non configuré — le tuteur ne recevra pas le virement automatique
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#8B9CB5' }}>Reçoit</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#C5A059' }}>{info.tarif.gainTuteur} DH</div>
                    <div style={{ fontSize: 10, color: '#8B9CB5' }}>85% du total</div>
                  </div>
                </div>
              </div>

              {/* Récap financier */}
              <div style={styles.cardRecap}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#8B9CB5' }}>Gain tuteur (85%)</span>
                  <span style={{ fontSize: 12, color: '#C5A059' }}>{info.tarif.gainTuteur} DH</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#8B9CB5' }}>Commission plateforme (15%)</span>
                  <span style={{ fontSize: 12, color: '#8B9CB5' }}>{info.tarif.commission} DH</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #E8D5A3' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#0A1628' }}>Total à payer</span>
                  <span style={{ fontSize: 26, fontWeight: 900, color: '#C5A059' }}>{info.tarif.montantTotal} DH</span>
                </div>
              </div>

              {info.tarif.montantTotal === 0 && (
                <div style={styles.error}>
                  ⚠️ Aucun tarif défini pour cette matière. Le tuteur doit configurer ses tarifs.
                </div>
              )}

              <button
                onClick={() => setStep('methode')}
                disabled={info.tarif.montantTotal === 0}
                style={{
                  ...styles.buttonPrimary,
                  background: info.tarif.montantTotal > 0 ? '#C5A059' : '#E8D5A3',
                  cursor: info.tarif.montantTotal > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                Choisir le mode de paiement →
              </button>
            </div>
          )}

          {/* ── ÉTAPE 2 : choix méthode ── */}
          {step === 'methode' && (
            <div>
              <p style={{ color: '#8B9CB5', fontSize: 13, marginBottom: 20 }}>
                Choisissez votre méthode de paiement :
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {METHODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMethode(m); setStep('formulaire'); setErreur('') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 20px', borderRadius: 14, border: '1px solid #E8D5A3',
                      background: '#F5F0E6', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.border = `1px solid #C5A059`; e.currentTarget.style.background = '#FFF8F0' }}
                    onMouseLeave={e => { e.currentTarget.style.border = '1px solid #E8D5A3'; e.currentTarget.style.background = '#F5F0E6' }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                      background: 'linear-gradient(135deg, #C5A059, #D4B06A)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    }}>
                      {m.logo}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#0A1628', fontSize: 15 }}>{m.nom}</div>
                      <div style={{ fontSize: 12, color: '#8B9CB5', marginTop: 2 }}>{m.description}</div>
                    </div>
                    <div style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: 'rgba(197,160,89,0.15)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.35)',
                    }}>
                      {m.tag}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('info')}
                style={{ marginTop: 16, background: 'none', border: 'none', color: '#8B9CB5', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ← Retour
              </button>
            </div>
          )}

          {/* ── ÉTAPE 3 : formulaire ── */}
          {step === 'formulaire' && methodeSelectionnee && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(197,160,89,0.1)',
                border: '1px solid rgba(197,160,89,0.35)',
              }}>
                <span style={{ fontSize: 20 }}>{methodeSelectionnee.logo}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#0A1628', fontSize: 14 }}>{methodeSelectionnee.nom}</div>
                  <div style={{ fontSize: 12, color: '#8B9CB5' }}>{methodeSelectionnee.tag}</div>
                </div>
                <button onClick={() => setStep('methode')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#C5A059', cursor: 'pointer', fontSize: 12 }}>Changer</button>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 20, padding: '12px', background: '#F5F0E6', borderRadius: 10, border: '1px solid #E8D5A3' }}>
                <div style={{ fontSize: 12, color: '#8B9CB5' }}>Montant à payer</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#C5A059' }}>{info?.tarif.montantTotal} DH</div>
              </div>

              {methodeSelectionnee.id === 'PAYPAL' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={styles.label}>Email PayPal</label>
                    <input
                      type="email"
                      placeholder="votre@email.com"
                      value={form.email}
                      onChange={set('email')}
                      style={styles.input}
                      onFocus={e => e.target.style.borderColor = '#C5A059'}
                      onBlur={e => e.target.style.borderColor = '#E8D5A3'}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Mot de passe</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={form.motdepasse}
                      onChange={set('motdepasse')}
                      style={styles.input}
                      onFocus={e => e.target.style.borderColor = '#C5A059'}
                      onBlur={e => e.target.style.borderColor = '#E8D5A3'}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{
                    borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #0A1628, #1A3A5C)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(197,160,89,0.08)' }} />
                    <div style={{ position: 'absolute', bottom: -30, left: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(197,160,89,0.06)' }} />
                    <div style={{ fontSize: 11, color: '#C5A059', marginBottom: 14, position: 'relative' }}>{methodeSelectionnee.nom} • SIMULATION</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: 4, marginBottom: 16, position: 'relative' }}>
                      {form.numero || '•••• •••• •••• ••••'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                      <div>
                        <div style={{ fontSize: 9, color: '#C5A059', marginBottom: 2 }}>TITULAIRE</div>
                        <div style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 600, textTransform: 'uppercase' }}>
                          {form.nom || 'VOTRE NOM'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: '#C5A059', marginBottom: 2 }}>EXPIRE</div>
                        <div style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 600 }}>{form.expiration || 'MM/AA'}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={styles.label}>Numéro de carte</label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={form.numero}
                      onChange={e => setForm(f => ({ ...f, numero: formatCard(e.target.value) }))}
                      maxLength={19}
                      style={{ ...styles.input, fontFamily: 'monospace', letterSpacing: 2 }}
                      onFocus={e => e.target.style.borderColor = '#C5A059'}
                      onBlur={e => e.target.style.borderColor = '#E8D5A3'}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Nom du titulaire</label>
                    <input
                      type="text"
                      placeholder="PRÉNOM NOM"
                      value={form.nom}
                      onChange={e => setForm(f => ({ ...f, nom: e.target.value.toUpperCase() }))}
                      style={styles.input}
                      onFocus={e => e.target.style.borderColor = '#C5A059'}
                      onBlur={e => e.target.style.borderColor = '#E8D5A3'}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={styles.label}>Date d'expiration</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={form.expiration}
                        onChange={e => setForm(f => ({ ...f, expiration: formatExp(e.target.value) }))}
                        maxLength={5}
                        style={styles.input}
                        onFocus={e => e.target.style.borderColor = '#C5A059'}
                        onBlur={e => e.target.style.borderColor = '#E8D5A3'}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={styles.label}>CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={form.cvv}
                        onChange={e => setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        maxLength={4}
                        style={styles.input}
                        onFocus={e => e.target.style.borderColor = '#C5A059'}
                        onBlur={e => e.target.style.borderColor = '#E8D5A3'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {erreur && <div style={styles.error}>⚠️ {erreur}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep('methode')} style={styles.buttonSecondary}>←</button>
                <button onClick={handlePayer} style={{
                  flex: 1, padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: '#C5A059', color: '#0A1628', fontWeight: 800, fontSize: '15px',
                }}>
                  🔒 Confirmer le paiement de {info?.tarif.montantTotal} DH
                </button>
              </div>

              <p style={{ textAlign: 'center', fontSize: 11, color: '#8B9CB5', marginTop: 10 }}>
                🔒 Paiement simulé — Aucune transaction réelle
              </p>
            </div>
          )}

          {/* ── ÉTAPE : traitement ── */}
          {step === 'processing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '16px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                border: `4px solid #C5A059`, borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#0A1628', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Traitement en cours…</div>
                <div style={{ color: '#8B9CB5', fontSize: 13 }}>Connexion sécurisée à {methodeSelectionnee?.nom}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#C5A059',
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
                background: 'rgba(5,150,105,0.15)', border: '2px solid rgba(5,150,105,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, margin: '0 auto 16px',
                animation: 'scaleIn 0.4s ease-out',
              }}>
                ✅
              </div>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#0A1628', marginBottom: 6 }}>Paiement réussi !</div>
              <div style={{ fontSize: 13, color: '#8B9CB5', marginBottom: 20 }}>
                La séance est maintenant <span style={{ color: '#C5A059', fontWeight: 700 }}>confirmée</span>.<br/>
                Un email de confirmation vous a été envoyé.
              </div>

              {paiement && (
                <div style={styles.success}>
                  <div style={{ fontSize: 12, color: '#C5A059', fontWeight: 700, marginBottom: 4 }}>VIREMENT AU TUTEUR</div>
                  <div style={{ fontSize: 13, color: '#0A1628' }}>
                    <span style={{ color: '#C5A059', fontWeight: 700 }}>{paiement.gain_tuteur} DH</span> virés automatiquement à {info?.seance.tuteur_prenom} {info?.seance.tuteur_nom}
                  </div>
                  {info?.seance.tuteur_rib ? (
                    <div style={{ fontSize: 11, color: '#8B9CB5', marginTop: 3, fontFamily: 'monospace' }}>
                      RIB : {info.seance.tuteur_rib.slice(0, 4)} **** **** {info.seance.tuteur_rib.slice(-4)}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#DC2626', marginTop: 3 }}>Virement en attente — tuteur sans RIB</div>
                  )}
                </div>
              )}

              <div style={{ background: '#F5F0E6', border: '1px solid #E8D5A3', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
                {[
                  ['Référence',  paiement.reference],
                  ['Méthode',    methodeSelectionnee?.nom],
                  ['Montant',    `${paiement.montant_total} DH`],
                  ['Date',       new Date(paiement.date_paiement).toLocaleString('fr-FR')],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E8D5A3' }}>
                    <span style={{ fontSize: 12, color: '#8B9CB5' }}>{k}</span>
                    <span style={{ fontSize: 12, color: '#0A1628', fontWeight: 600, fontFamily: k === 'Référence' ? 'monospace' : 'inherit' }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13, color: '#8B9CB5' }}>
                Fermeture automatique dans <span style={{ color: '#C5A059', fontWeight: 700 }}>{countdown}s</span>…
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