const PDFDocument = require('pdfkit');
const fs   = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo.png');

/**
 * Génère un certificat PDF professionnel avec logo SmartEdu
 *
 * @param {Object} opts
 * @param {string} opts.numeroCert       - N° unique ex: CERT-2026-00001
 * @param {string} opts.etudiantPrenom
 * @param {string} opts.etudiantNom
 * @param {string} opts.examenTitre      - Titre de l'examen réussi
 * @param {string} opts.salleNom         - Nom de la salle/formation
 * @param {string} opts.matiere          - Matière de la salle (optionnel)
 * @param {string} opts.tuteurNom        - Prénom + Nom du tuteur
 * @param {number} opts.scoreObtenu      - Score en %
 * @param {number} opts.nbSeances        - Nombre de séances réalisées
 * @param {number} opts.dureeTotaleMin   - Durée totale en minutes
 * @param {Date}   opts.dateEmission
 */
async function genererCertificatPDF(opts) {
  const {
    numeroCert, etudiantPrenom, etudiantNom,
    examenTitre, salleNom, matiere = '',
    tuteurNom, scoreObtenu,
    nbSeances = 0, dureeTotaleMin = 0,
    dateEmission = new Date(),
  } = opts;

  const dir = path.join(__dirname, '..', 'uploads', 'certificats');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${numeroCert}.pdf`;
  const filepath = path.join(dir, filename);
  const urlPath  = `/uploads/certificats/${filename}`;

  // Formater durée
  const heures  = Math.floor(dureeTotaleMin / 60);
  const minutes = dureeTotaleMin % 60;
  const dureeStr = heures > 0
    ? `${heures}h${minutes > 0 ? minutes + 'min' : ''}`
    : `${minutes} minutes`;

  const dateStr = new Date(dateEmission).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const scoreStr = parseFloat(scoreObtenu).toFixed(1) + '%';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    const W = doc.page.width;   // 841.89
    const H = doc.page.height;  // 595.28

    // ══════════════════════════════════════════════════
    // FOND
    // ══════════════════════════════════════════════════
    doc.rect(0, 0, W, H).fill('#080d1a');

    // Cercle déco en haut à gauche
    doc.circle(-60, -60, 180).fill('#0e1a3a');
    // Cercle déco en bas à droite
    doc.circle(W + 60, H + 60, 200).fill('#0e1a3a');

    // ══════════════════════════════════════════════════
    // BORDURE DORÉE
    // ══════════════════════════════════════════════════
    const margin = 22;
    doc.rect(margin, margin, W - 2*margin, H - 2*margin)
       .lineWidth(2).strokeColor('#b8860b').stroke();
    doc.rect(margin+4, margin+4, W - 2*(margin+4), H - 2*(margin+4))
       .lineWidth(0.5).strokeColor('#d4af37').stroke();

    // ══════════════════════════════════════════════════
    // LOGO (haut gauche dans le cadre)
    // ══════════════════════════════════════════════════
    const logoSize = 80;
    const logoX    = margin + 30;
    const logoY    = margin + 20;
    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, logoX, logoY, { width: logoSize, height: logoSize, fit: [logoSize, logoSize] });
      } catch (_) {}
    }
    // Nom plateforme à côté du logo
    doc.font('Helvetica-Bold').fontSize(18)
       .fillColor('#3b82f6')
       .text('SmartEdu', logoX + logoSize + 10, logoY + 18);
    doc.font('Helvetica').fontSize(9)
       .fillColor('#64748b')
       .text('Apprendre Ensemble', logoX + logoSize + 10, logoY + 42);

    // ══════════════════════════════════════════════════
    // TITRE CENTRAL "CERTIFICAT DE RÉUSSITE"
    // ══════════════════════════════════════════════════
    doc.font('Helvetica-Bold').fontSize(32)
       .fillColor('#d4af37')
       .text('CERTIFICAT DE RÉUSSITE', 0, margin + 30, { align: 'center', width: W });

    // Ligne déco dorée sous le titre
    const lineY = margin + 78;
    doc.moveTo(W/2 - 160, lineY).lineTo(W/2 + 160, lineY)
       .lineWidth(1).strokeColor('#d4af37').stroke();

    // ══════════════════════════════════════════════════
    // CORPS DU CERTIFICAT
    // ══════════════════════════════════════════════════
    // "Ce certificat est décerné à"
    doc.font('Helvetica').fontSize(12)
       .fillColor('#94a3b8')
       .text('Ce certificat est décerné à', 0, lineY + 14, { align: 'center', width: W });

    // NOM ÉTUDIANT — grand et en valeur
    doc.font('Helvetica-Bold').fontSize(36)
       .fillColor('#ffffff')
       .text(`${etudiantPrenom} ${etudiantNom}`, 0, lineY + 32, { align: 'center', width: W });

    // Ligne sous le nom
    const nameLineY = lineY + 80;
    doc.moveTo(W/2 - 120, nameLineY).lineTo(W/2 + 120, nameLineY)
       .lineWidth(0.5).strokeColor('#334155').stroke();

    // "pour avoir réussi avec succès"
    doc.font('Helvetica').fontSize(11)
       .fillColor('#94a3b8')
       .text('pour avoir réussi avec succès l\'évaluation', 0, nameLineY + 10, { align: 'center', width: W });

    // Titre de l'examen
    doc.font('Helvetica-Bold').fontSize(17)
       .fillColor('#a78bfa')
       .text(`« ${examenTitre} »`, 0, nameLineY + 28, { align: 'center', width: W });

    // ══════════════════════════════════════════════════
    // INFOS EN 4 COLONNES (score, formation, durée, séances)
    // ══════════════════════════════════════════════════
    const infoY   = nameLineY + 68;
    const colW    = (W - 2*(margin+30)) / 4;
    const colBase = margin + 30;

    const cols = [
      { icon: '🏆', label: 'Score obtenu',    value: scoreStr,                    color: '#f59e0b' },
      { icon: '📚', label: 'Formation',        value: salleNom,                    color: '#a78bfa' },
      { icon: '⏱',  label: 'Durée de cours',  value: nbSeances > 0 ? dureeStr : '—', color: '#34d399' },
      { icon: '📖', label: 'Séances réalisées',value: nbSeances > 0 ? `${nbSeances} séances` : '—', color: '#60a5fa' },
    ];

    cols.forEach((col, i) => {
      const x = colBase + i * colW;
      const cx = x + colW / 2;

      // Cadre
      doc.rect(x + 6, infoY, colW - 12, 68)
         .lineWidth(0.5).strokeColor('#1e2d4a').stroke()
         .fillColor('#0d1526').fill()
         .rect(x + 6, infoY, colW - 12, 68)
         .lineWidth(0.5).strokeColor('#1e2d4a').stroke();

      // Valeur
      doc.font('Helvetica-Bold').fontSize(13)
         .fillColor(col.color)
         .text(col.value, x + 8, infoY + 12, { width: colW - 16, align: 'center' });

      // Label
      doc.font('Helvetica').fontSize(8.5)
         .fillColor('#64748b')
         .text(col.label, x + 8, infoY + 38, { width: colW - 16, align: 'center' });
    });

    // ══════════════════════════════════════════════════
    // MATIÈRE (si disponible)
    // ══════════════════════════════════════════════════
    if (matiere) {
      doc.font('Helvetica').fontSize(9)
         .fillColor('#475569')
         .text(`Matière : ${matiere}`, margin + 30, infoY + 78);
    }

    // ══════════════════════════════════════════════════
    // BAS DE PAGE — Tuteur + date + numéro
    // ══════════════════════════════════════════════════
    const footerY = H - margin - 62;

    // Ligne séparatrice
    doc.moveTo(margin + 30, footerY)
       .lineTo(W - margin - 30, footerY)
       .lineWidth(0.5).strokeColor('#1e293b').stroke();

    // Colonne gauche : Tuteur
    doc.font('Helvetica').fontSize(9).fillColor('#64748b')
       .text('Certifié par', margin + 40, footerY + 8);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#e2e8f0')
       .text(tuteurNom, margin + 40, footerY + 22);
    doc.font('Helvetica').fontSize(8).fillColor('#475569')
       .text('Tuteur certifié SmartEdu', margin + 40, footerY + 38);

    // Colonne centre : QR / numéro
    doc.font('Helvetica').fontSize(8).fillColor('#334155')
       .text(`N° ${numeroCert}`, 0, footerY + 12, { align: 'center', width: W });
    doc.font('Helvetica').fontSize(7.5).fillColor('#1e293b')
       .text(`Vérifiable sur : smartedu.ma/certif/${numeroCert}`, 0, footerY + 27, { align: 'center', width: W });

    // Colonne droite : Date
    doc.font('Helvetica').fontSize(9).fillColor('#64748b')
       .text('Date d\'émission', W - margin - 130, footerY + 8);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#e2e8f0')
       .text(dateStr, W - margin - 130, footerY + 22);

    // Sceau / tampon déco (cercle doré)
    const sealX = W / 2;
    const sealY = footerY + 10;
    doc.circle(sealX, sealY, 20)
       .lineWidth(1.5).strokeColor('#d4af37').stroke();
    doc.circle(sealX, sealY, 16)
       .lineWidth(0.5).strokeColor('#b8860b').stroke();
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#d4af37')
       .text('CERTIFIÉ', sealX - 13, sealY - 5);
    doc.font('Helvetica').fontSize(5).fillColor('#b8860b')
       .text('SMARTEDU', sealX - 11, sealY + 3);

    doc.end();
    stream.on('finish', () => resolve(urlPath));
    stream.on('error', reject);
  });
}

module.exports = { genererCertificatPDF };