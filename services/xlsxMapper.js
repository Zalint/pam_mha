/**
 * xlsxMapper — Import / Export du fichier "Plan d'actions MHA 2026.xlsx".
 *
 * Le fichier source est une matrice hiérarchique à cellules fusionnées :
 *   A Programme > B Action > C Activité > (une ligne par) D Résultat attendu.
 *
 * Stratégie « fidèle + dérivé » :
 *  - on conserve les libellés bruts (échéance, budget prévisionnel) pour un export
 *    identique au fichier ;
 *  - on calcule en plus des valeurs propres (date, nombre, statut) pour le tri,
 *    les filtres et les statistiques.
 *
 * Les objets produits utilisent des clés en minuscules, identiques aux colonnes
 * PostgreSQL (programme, tauxphysique, resultatsattendus, ...).
 */

const ExcelJS = require('exceljs');

// ---------------------------------------------------------------------------
// Constantes du gabarit (extraites du fichier de référence)
// ---------------------------------------------------------------------------
const SHEET_NAME = "MHA PLAN D'ACTIONS BUDGETISE ";
const TITLE =
  "MATRICE DE SUIVI ET D'EVALUATION DE L'EXECUTION DES PLANS D'ACTIONS MINISTERIELS (PAM) - PLAN D'ENGAGEMENT - SONES";

// Colonnes A..P (1..16)
const COL = {
  programme: 1, action: 2, activite: 3, resultats: 4,
  cibles: 5, resultatsInd: 6, pourcentInd: 7,
  budgetPrev: 8, echeance: 9, physique: 10, financiere: 11,
  commentaire: 12, t1: 13, t2: 14, t3: 15, t4: 16,
};
const LAST_COL = 16; // P

// En-têtes (ligne 3 = groupes, ligne 4 = sous-titres)
const HEADERS_ROW3 = {
  1: 'Programmes', 2: 'Actions', 3: 'Activités', 4: 'Résultats attendus',
  5: 'Indicateurs', 8: 'Budget prévisionnel (LFI 2026)', 9: 'Echéance',
  10: "Etat d'exécution", 12: 'Commentaires',
  13: "Plan d'engagement (Plan de décaissement trimestriel)",
};
const HEADERS_ROW4 = {
  5: 'Cibles', 6: 'Résultats', 7: '%',
  10: 'Physique (%)', 11: 'Financière (%)',
  13: 'Trimestre 1', 14: 'Trimestre 2', 15: 'Trimestre 3', 16: 'Trimestre 4',
};
const COL_WIDTHS = {
  1: 16, 2: 16, 3: 46, 4: 50, 5: 27, 6: 12, 7: 9, 8: 24,
  9: 19, 10: 15, 11: 19, 12: 22, 13: 18, 14: 18, 15: 18, 16: 18,
};

const MONTHS_FR = {
  janv: 1, jan: 1, fevr: 2, fev: 2, févr: 2, fév: 2, mars: 3, mar: 3,
  avri: 4, avr: 4, mai: 5, juin: 6, juil: 7, aout: 8, août: 8, aou: 8,
  sept: 9, sep: 9, octo: 10, oct: 10, nove: 11, nov: 11, dece: 12, déce: 12,
  dec: 12, déc: 12,
};

const VALID_STATUTS = ['À démarrer', 'En cours', 'En retard', 'Achevé'];

// ---------------------------------------------------------------------------
// Helpers de parsing
// ---------------------------------------------------------------------------

/** Normalise une valeur de cellule exceljs en string | number | Date | null. */
function cellValue(cell) {
  const v = cell ? cell.value : null;
  if (v === null || v === undefined) return null;
  if (typeof v === 'object') {
    if (v instanceof Date) return v;
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('');
    if ('result' in v) return v.result === undefined ? null : v.result; // formule
    if ('text' in v) return v.text; // hyperlien
    return String(v);
  }
  return v; // string | number | boolean
}

/** Texte nettoyé d'une cellule, ou null si vide. */
function cellText(cell) {
  const v = cellValue(cell);
  if (v === null) return null;
  const s = String(v).replace(/\s+/g, ' ').trim();
  return s === '' ? null : s;
}

/**
 * Vrai si la cellule est la *continuation* d'une fusion (pas la cellule maître).
 * Une valeur fusionnée (ex : un budget couvrant toute une activité) ne doit être
 * lue qu'une seule fois, sur sa cellule maître, sinon les totaux sont multipliés.
 */
function isMergeContinuation(cell) {
  return !!(cell && cell.isMerged && cell.master && cell.master.address !== cell.address);
}

/** Parse un nombre "à la française" : espaces, FCFA, virgule décimale. */
function parseFrenchNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isFinite(value) ? value : null;
  let s = String(value).trim();
  if (!s) return null;
  // retirer devise et séparateurs d'espaces (espace, nbsp, narrow nbsp)
  s = s.replace(/fcfa|cfa/gi, '').replace(/[\s  ]/g, '');
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.'); // virgule décimale
  } else {
    s = s.replace(/,/g, ''); // virgules de milliers parasites
  }
  s = s.replace(/[^0-9.\-]/g, '');
  if (s === '' || s === '.' || s === '-') return null;
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}

function pad2(n) { return String(n).padStart(2, '0'); }
function toYMD(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function endOfMonth(year, month) {
  const day = new Date(year, month, 0).getDate(); // dernier jour du mois
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function matchFrenchMonth(s) {
  for (const key of Object.keys(MONTHS_FR)) {
    if (s.includes(key)) return MONTHS_FR[key];
  }
  return null;
}

/**
 * Dérive une date YYYY-MM-DD à partir d'un libellé d'échéance libre
 * ("Trimestre 2", "4ème trimestre", "Dec 2026", "2ième trimestre 2027", ...).
 * Année par défaut : 2026. Renvoie { date, libelle }.
 */
function parseEcheance(raw, defaultYear = 2026) {
  if (raw instanceof Date) {
    const ymd = toYMD(raw);
    return { date: ymd, libelle: ymd };
  }
  const libelle = raw === null || raw === undefined ? null : String(raw).replace(/\s+/g, ' ').trim() || null;
  if (!libelle) return { date: null, libelle: null };
  const s = libelle.toLowerCase();

  const ym = s.match(/(20\d{2})/);
  const year = ym ? parseInt(ym[1], 10) : defaultYear;

  // date ISO aaaa-mm-jj
  const iso = s.match(/(20\d{2})-(\d{1,2})-(\d{1,2})/);
  if (iso) return { date: `${iso[1]}-${pad2(+iso[2])}-${pad2(+iso[3])}`, libelle };

  // date explicite jj/mm/aaaa
  const dm = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})/);
  if (dm) return { date: `${dm[3]}-${pad2(+dm[2])}-${pad2(+dm[1])}`, libelle };

  // trimestre
  let q = null;
  let m = s.match(/(\d)\s*(?:er|ère|ere|ième|ieme|eme|ème|e)?\s*trimestre/);
  if (!m) m = s.match(/trimestre\s*(\d)/);
  if (m) q = parseInt(m[1], 10);
  if (q >= 1 && q <= 4) return { date: endOfMonth(year, [3, 6, 9, 12][q - 1]), libelle };

  // mois nommé
  const month = matchFrenchMonth(s);
  if (month) return { date: endOfMonth(year, month), libelle };

  // année seule
  if (ym) return { date: `${year}-12-31`, libelle };

  return { date: null, libelle };
}

/** Statut dérivé des taux (le xlsx ne fournit pas de statut). */
function deriveStatut(tauxPhysique, tauxFinancier) {
  const p = Number(tauxPhysique) || 0;
  const f = Number(tauxFinancier) || 0;
  if (p >= 100) return 'Achevé';
  if (p > 0 || f > 0) return 'En cours';
  return 'À démarrer';
}

function clampPct(n) {
  if (n === null || n === undefined) return 0;
  return Math.max(0, Math.min(100, n));
}
function clampDecimal5_2(n) {
  if (n === null || n === undefined) return null;
  return n > 999.99 || n < -999.99 ? null : n;
}
function firstNonEmpty(...vals) {
  for (const v of vals) if (v !== null && v !== undefined && String(v).trim() !== '') return v;
  return null;
}

// ---------------------------------------------------------------------------
// parseWorkbook : Buffer -> { sheetName, headerRow, actions: [...] }
// ---------------------------------------------------------------------------
async function parseWorkbook(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('Aucune feuille trouvée dans le fichier xlsx');

  // Détection de la ligne d'en-tête ("Programmes" en colonne A)
  let headerRow = 0;
  for (let r = 1; r <= Math.min(30, ws.rowCount); r++) {
    const a = cellText(ws.getCell(r, COL.programme));
    if (a && a.toLowerCase() === 'programmes') { headerRow = r; break; }
  }
  if (!headerRow) headerRow = 3; // fallback gabarit connu

  // Ligne de sous-titres si "Cibles" est présent juste en dessous
  const hasSubHeader = (cellText(ws.getCell(headerRow + 1, COL.cibles)) || '').toLowerCase() === 'cibles';
  const dataStart = headerRow + (hasSubHeader ? 2 : 1);

  const actions = [];
  let lastProgramme = null, lastAction = null, lastActivite = null;
  let sortIndex = 0;

  for (let r = dataStart; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    // Lecture « merge-aware » : une cellule de continuation de fusion renvoie null.
    const rawAt = (c) => {
      const cell = row.getCell(c);
      return isMergeContinuation(cell) ? null : cellValue(cell);
    };
    const cAt = (c) => {
      const v = rawAt(c);
      if (v === null || v === undefined) return null;
      const s = String(v).replace(/\s+/g, ' ').trim();
      return s === '' ? null : s;
    };

    // Remplissage vers le bas (cellules fusionnées A/B/C)
    const progHere = cAt(COL.programme);
    const actHere = cAt(COL.action);
    const actiHere = cAt(COL.activite);
    if (progHere) lastProgramme = progHere;
    if (actHere) lastAction = actHere;
    if (actiHere) lastActivite = actiHere;

    const resultats = cAt(COL.resultats);
    const cibles = cAt(COL.cibles);
    const resultatsInd = cAt(COL.resultatsInd);
    const pourcentInd = parseFrenchNumber(rawAt(COL.pourcentInd));
    const echRaw = rawAt(COL.echeance);
    const physique = parseFrenchNumber(rawAt(COL.physique));
    const financiere = parseFrenchNumber(rawAt(COL.financiere));
    const commentaire = cAt(COL.commentaire);
    const t1 = parseFrenchNumber(rawAt(COL.t1));
    const t2 = parseFrenchNumber(rawAt(COL.t2));
    const t3 = parseFrenchNumber(rawAt(COL.t3));
    const t4 = parseFrenchNumber(rawAt(COL.t4));

    // Budget prévisionnel : on garde le libellé brut si c'est du texte
    const budgetRaw = rawAt(COL.budgetPrev);
    const budgetNum = parseFrenchNumber(budgetRaw);
    const budgetLibelle = typeof budgetRaw === 'string' ? cAt(COL.budgetPrev) : null;

    // Ligne sans aucune donnée exploitable -> on saute
    const hasData = [resultats, cibles, resultatsInd, pourcentInd, budgetRaw,
      echRaw, physique, financiere, commentaire, t1, t2, t3, t4]
      .some((v) => v !== null && v !== undefined && String(v).trim() !== '');
    if (!hasData) continue;
    if (!lastProgramme) continue; // pas de programme connu -> ligne d'amorce

    const ech = parseEcheance(echRaw);
    const tauxphysique = clampPct(physique);
    const tauxfinancier = clampPct(financiere);

    actions.push({
      programme: lastProgramme,
      action: lastAction,
      activite: lastActivite,
      resultatsattendus: resultats,
      indicateurscibles: cibles,
      indicateursresultatsvaleur: resultatsInd,
      indicateursresultats: clampDecimal5_2(pourcentInd),
      budgetprevisionnel: budgetNum,
      budgetprevisionnellibelle: budgetLibelle,
      echeance: ech.date,
      echeancelibelle: ech.libelle,
      tauxphysique,
      tauxfinancier,
      statut: deriveStatut(tauxphysique, tauxfinancier),
      commentaire,
      budgett1: t1, budgett2: t2, budgett3: t3, budgett4: t4,
      intitule: String(firstNonEmpty(resultats, lastActivite, lastAction, lastProgramme)),
      responsable: null,
      sortindex: ++sortIndex,
    });
  }

  return { sheetName: ws.name, headerRow, actions };
}

// ---------------------------------------------------------------------------
// buildWorkbook : actions[] -> Buffer (reproduit le gabarit)
// ---------------------------------------------------------------------------
async function buildWorkbook(actions) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Suivi PAM MHA 2026';
  const ws = wb.addWorksheet(SHEET_NAME, { views: [{ state: 'frozen', ySplit: 4 }] });

  for (let c = 1; c <= LAST_COL; c++) ws.getColumn(c).width = COL_WIDTHS[c] || 16;

  const NAVY = 'FF0F2A43';
  const LIGHT = 'FFE8EEF4';
  const border = {
    top: { style: 'thin', color: { argb: 'FFB9C4D0' } },
    left: { style: 'thin', color: { argb: 'FFB9C4D0' } },
    bottom: { style: 'thin', color: { argb: 'FFB9C4D0' } },
    right: { style: 'thin', color: { argb: 'FFB9C4D0' } },
  };

  // Ligne 1 : titre
  ws.mergeCells(1, 1, 1, LAST_COL);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = TITLE;
  titleCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  ws.getRow(1).height = 34;

  // Lignes 3-4 : en-têtes + fusions
  const merges = ['A3:A4', 'B3:B4', 'C3:C4', 'D3:D4', 'E3:G3', 'H3:H4', 'I3:I4', 'J3:K3', 'L3:L4', 'M3:P3'];
  merges.forEach((m) => ws.mergeCells(m));
  const setHeader = (r, c, text) => {
    const cell = ws.getCell(r, c);
    cell.value = text;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.border = border;
  };
  Object.entries(HEADERS_ROW3).forEach(([c, t]) => setHeader(3, +c, t));
  Object.entries(HEADERS_ROW4).forEach(([c, t]) => setHeader(4, +c, t));
  ws.getRow(3).height = 24;
  ws.getRow(4).height = 20;

  // Données à partir de la ligne 5, dans l'ordre sortindex
  const rows = [...actions].sort((a, b) => {
    const sa = a.sortindex != null ? a.sortindex : (a.id || 0);
    const sb = b.sortindex != null ? b.sortindex : (b.id || 0);
    return sa - sb;
  });

  const DATA_START = 5;
  rows.forEach((a, i) => {
    const r = DATA_START + i;
    const row = ws.getRow(r);
    const num = (c, v, fmt) => {
      const cell = row.getCell(c);
      if (v !== null && v !== undefined && v !== '') {
        cell.value = Number(v);
        cell.numFmt = fmt || '#,##0';
      }
      cell.alignment = { vertical: 'top', horizontal: 'right' };
      cell.border = border;
    };
    const txt = (c, v) => {
      const cell = row.getCell(c);
      if (v !== null && v !== undefined && v !== '') cell.value = String(v);
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = border;
    };

    // Programme / Action / Activité : valeur posée uniquement en tête de groupe (fusion ensuite)
    txt(COL.programme, a.programme);
    txt(COL.action, a.action);
    txt(COL.activite, a.activite);
    txt(COL.resultats, a.resultatsattendus);
    txt(COL.cibles, a.indicateurscibles);
    txt(COL.resultatsInd, a.indicateursresultatsvaleur);
    num(COL.pourcentInd, a.indicateursresultats, '0.##');
    // Budget prévisionnel : libellé brut si présent, sinon nombre
    if (a.budgetprevisionnellibelle) txt(COL.budgetPrev, a.budgetprevisionnellibelle);
    else num(COL.budgetPrev, a.budgetprevisionnel);
    txt(COL.echeance, a.echeancelibelle || a.echeance);
    num(COL.physique, a.tauxphysique, '0.##');
    num(COL.financiere, a.tauxfinancier, '0.##');
    txt(COL.commentaire, a.commentaire);
    num(COL.t1, a.budgett1);
    num(COL.t2, a.budgett2);
    num(COL.t3, a.budgett3);
    num(COL.t4, a.budgett4);
  });

  // Fusions verticales pour reproduire la hiérarchie (Programme/Action/Activité)
  mergeVertical(ws, rows, DATA_START, COL.programme, (a) => a.programme);
  mergeVertical(ws, rows, DATA_START, COL.action, (a) => `${a.programme}||${a.action}`);
  mergeVertical(ws, rows, DATA_START, COL.activite, (a) => `${a.programme}||${a.action}||${a.activite}`);

  const out = await wb.xlsx.writeBuffer();
  return Buffer.isBuffer(out) ? out : Buffer.from(out);
}

/** Fusionne verticalement les cellules consécutives de même clé dans une colonne. */
function mergeVertical(ws, rows, dataStart, col, keyFn) {
  let start = 0;
  for (let i = 1; i <= rows.length; i++) {
    const sameAsStart = i < rows.length && keyFn(rows[i]) === keyFn(rows[start]) && keyFn(rows[start]) != null;
    if (!sameAsStart) {
      if (i - 1 > start) {
        // on garde la valeur de la 1re ligne, on vide les suivantes avant fusion
        for (let j = start + 1; j <= i - 1; j++) ws.getCell(dataStart + j, col).value = null;
        ws.mergeCells(dataStart + start, col, dataStart + (i - 1), col);
        ws.getCell(dataStart + start, col).alignment = { vertical: 'top', wrapText: true };
      }
      start = i;
    }
  }
}

module.exports = {
  parseWorkbook,
  buildWorkbook,
  // helpers exposés pour les tests / réutilisation
  parseFrenchNumber,
  parseEcheance,
  deriveStatut,
  SHEET_NAME,
  TITLE,
  COL,
};
