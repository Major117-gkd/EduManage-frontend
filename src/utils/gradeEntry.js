import { api } from '../services/api';

export const PERIODES = [
  'Trimestre 1',
  'Trimestre 2',
  'Trimestre 3',
  'Semestre 1',
  'Semestre 2',
];

export const GRADE_COLUMNS = [
  { key: 'd1', label: 'Devoir 1', type: 'Devoir 1', weight: 1 },
  { key: 'd2', label: 'Devoir 2', type: 'Devoir 2', weight: 1 },
  { key: 'compo', label: 'Compo', type: 'Composition', weight: 2 },
];

export const GRADE_FIELD_KEYS = GRADE_COLUMNS.map((c) => c.key);
export const NAV_FIELDS = [...GRADE_FIELD_KEYS, 'appreciation'];

export function createEmptyGradeRow() {
  return {
    d1: '',
    d1Id: null,
    d2: '',
    d2Id: null,
    compo: '',
    compoId: null,
    appreciation: '',
    appreciationManual: false,
  };
}

export function parseNotesFromStudent(notes = [], { periode, anneeScolaire } = {}) {
  const filtered = notes.filter((n) => {
    if (periode && n.periode !== periode) return false;
    if (anneeScolaire && n.annee_scolaire !== anneeScolaire) return false;
    return true;
  });

  const row = createEmptyGradeRow();

  GRADE_COLUMNS.forEach(({ key, type }) => {
    const note = filtered.find((n) => n.type_evaluation === type);
    if (note) {
      row[key] = note.valeur;
      row[`${key}Id`] = note.id;
    }
  });

  const appreciationSource =
    filtered.find((n) => n.type_evaluation === 'Composition') ||
    filtered.find((n) => n.type_evaluation === 'Devoir 2') ||
    filtered.find((n) => n.type_evaluation === 'Devoir 1');

  row.appreciation = appreciationSource?.appreciation || '';
  row.appreciationManual = Boolean(row.appreciation);

  return row;
}

export function buildGradesMap(students, options) {
  const map = {};
  students.forEach((student) => {
    const eleveId = student.eleveId ?? student.id;
    map[eleveId] = parseNotesFromStudent(student.notes || [], options);
  });
  return map;
}

export function cloneGradesMap(grades) {
  return JSON.parse(JSON.stringify(grades));
}

export function isPartialGradeInput(value) {
  if (value === '' || value === null || value === undefined) return false;
  return /^(\d{1,2})([.,])?$/.test(String(value).trim());
}

export function normalizeGradeInput(raw) {
  if (raw === '' || raw === null || raw === undefined) return '';
  const cleaned = String(raw).trim().replace(',', '.');
  if (cleaned === '' || cleaned === '.') return cleaned;
  if (!/^\d{0,2}(\.\d{0,2})?$/.test(cleaned)) return null;
  return cleaned;
}

export function finalizeGradeValue(raw) {
  if (raw === '' || raw === null || raw === undefined) return '';
  const normalized = normalizeGradeInput(raw);
  if (normalized === '' || normalized === null) return '';
  const num = parseFloat(normalized);
  if (Number.isNaN(num)) return '';
  const clamped = Math.min(20, Math.max(0, num));
  return (Math.round(clamped * 4) / 4).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export function isValidGradeValue(value) {
  if (value === '' || value === null || value === undefined) return true;
  if (isPartialGradeInput(value)) return true;
  const normalized = normalizeGradeInput(value);
  if (normalized === null) return false;
  const num = parseFloat(normalized);
  return !Number.isNaN(num) && num >= 0 && num <= 20;
}

export function getNumericGrade(value) {
  if (value === '' || value === null || value === undefined) return null;
  const normalized = normalizeGradeInput(value);
  if (normalized === '' || normalized === null || normalized === '.') return null;
  const num = parseFloat(normalized);
  return Number.isNaN(num) ? null : num;
}

export function calculateSubjectAverage(row) {
  // Moyenne par matière : sans coefficient de la matière (D1, D2, Compo uniquement)
  if (!row) return null;
  let weightedSum = 0;
  let totalWeight = 0;

  GRADE_COLUMNS.forEach(({ key, weight }) => {
    const value = getNumericGrade(row[key]);
    if (value !== null) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  });

  if (totalWeight === 0) return null;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Moyenne générale / classement uniquement.
 * Σ(moyenne_matière × coefficient_matière) / Σ(coefficients)
 */
export function calculateGeneralAverage(matieres = []) {
  const withAverage = matieres
    .map((m) => ({
      average: m.moyenne ?? m.average ?? null,
      coefficient: m.coefficient,
    }))
    .filter((m) => m.average !== null && m.average !== undefined);

  if (withAverage.length === 0) return null;

  const totalCoeff = withAverage.reduce((sum, m) => sum + m.coefficient, 0);
  const totalPoints = withAverage.reduce(
    (sum, m) => sum + m.average * m.coefficient,
    0
  );

  return totalCoeff > 0 ? Math.round((totalPoints / totalCoeff) * 100) / 100 : null;
}

/** Classement avec ex-aequo, par groupe (ex. classeId). */
export function assignRanksByGroup(items, groupKey, getAverage) {
  const groups = {};
  items.forEach((item) => {
    const key = item[groupKey];
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  Object.values(groups).forEach((group) => {
    const sorted = [...group]
      .filter((item) => getAverage(item) !== null && getAverage(item) !== undefined)
      .sort((a, b) => getAverage(b) - getAverage(a));

    let rank = 0;
    let previousAverage = null;

    sorted.forEach((item, index) => {
      const avg = getAverage(item);
      if (avg !== previousAverage) {
        rank = index + 1;
        previousAverage = avg;
      }
      item.rang = rank;
    });

    group.forEach((item) => {
      if (getAverage(item) === null || getAverage(item) === undefined) {
        item.rang = null;
      }
    });
  });

  return items;
}

export function formatAverage(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(2);
}

export function getMention(value) {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) return '';
  if (num >= 16) return 'Très Bien';
  if (num >= 14) return 'Bien';
  if (num >= 12) return 'Assez Bien';
  if (num >= 10) return 'Passable';
  return 'Insuffisant';
}

export function getMentionColor(value) {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) return '#94a3b8';
  if (num >= 16) return '#059669';
  if (num >= 14) return '#10b981';
  if (num >= 10) return '#d97706';
  return '#dc2626';
}

export function suggestAppreciation(row) {
  const average = calculateSubjectAverage(row);
  if (average === null) return '';
  return getMention(average);
}

export function applyAutoAppreciation(row, { force = false } = {}) {
  const next = { ...row };
  if (!next.appreciationManual || force) {
    const suggestion = suggestAppreciation(next);
    if (suggestion) {
      next.appreciation = suggestion;
      next.appreciationManual = false;
    }
  }
  return next;
}

export function rowHasAnyGrade(row) {
  return GRADE_FIELD_KEYS.some((key) => row?.[key] !== '' && row?.[key] !== null && row?.[key] !== undefined);
}

export function rowHasSavedNotes(row) {
  return GRADE_COLUMNS.some(({ key }) => row?.[`${key}Id`]);
}

export function isRowComplete(row) {
  return GRADE_FIELD_KEYS.every((key) => getNumericGrade(row?.[key]) !== null);
}

export function isRowDirty(row, snapshot) {
  if (!row || !snapshot) return false;
  const gradeChanged = GRADE_FIELD_KEYS.some((key) => String(row[key] ?? '') !== String(snapshot[key] ?? ''));
  const appreciationChanged = String(row.appreciation ?? '') !== String(snapshot.appreciation ?? '');
  return gradeChanged || appreciationChanged;
}

export function countDirtyRows(grades, snapshot) {
  return Object.keys(grades).filter((id) => isRowDirty(grades[id], snapshot[id])).length;
}

export function getClassStats(grades, studentIds) {
  const averages = studentIds
    .map((id) => calculateSubjectAverage(grades[id]))
    .filter((value) => value !== null);

  if (averages.length === 0) {
    return { count: 0, average: null, min: null, max: null };
  }

  const sum = averages.reduce((acc, value) => acc + value, 0);
  return {
    count: averages.length,
    average: Math.round((sum / averages.length) * 100) / 100,
    min: Math.min(...averages),
    max: Math.max(...averages),
  };
}

export function getCompletionStats(grades, studentIds) {
  const withGrades = studentIds.filter((id) => rowHasAnyGrade(grades[id])).length;
  const complete = studentIds.filter((id) => isRowComplete(grades[id])).length;
  return {
    total: studentIds.length,
    withGrades,
    complete,
    percent: studentIds.length ? Math.round((complete / studentIds.length) * 100) : 0,
  };
}

export function getNextInputId(field, rowIndex) {
  const fieldIndex = NAV_FIELDS.indexOf(field);
  if (fieldIndex === -1) return null;

  if (fieldIndex < NAV_FIELDS.length - 1) {
    return `input-${NAV_FIELDS[fieldIndex + 1]}-${rowIndex}`;
  }

  return `input-${NAV_FIELDS[0]}-${rowIndex + 1}`;
}

export function getPrevInputId(field, rowIndex) {
  const fieldIndex = NAV_FIELDS.indexOf(field);
  if (fieldIndex === -1) return null;

  if (fieldIndex > 0) {
    return `input-${NAV_FIELDS[fieldIndex - 1]}-${rowIndex}`;
  }

  if (rowIndex === 0) return null;
  return `input-${NAV_FIELDS[NAV_FIELDS.length - 1]}-${rowIndex - 1}`;
}

export async function saveStudentGrades({
  eleveId,
  matiereId,
  periode,
  anneeScolaire,
  row,
}) {
  const saveNote = async (value, type, noteId) => {
    const finalized = finalizeGradeValue(value);

    if (finalized === '') {
      if (noteId) {
        await api.delete(`/admin/notes/${noteId}`);
      }
      return null;
    }

    return api.post('/admin/notes', {
      eleveId,
      matiereId,
      valeur: parseFloat(finalized),
      type_evaluation: type,
      periode,
      annee_scolaire: anneeScolaire,
      appreciation: row.appreciation || '',
    });
  };

  const results = await Promise.all(
    GRADE_COLUMNS.map(({ key, type }) => saveNote(row[key], type, row[`${key}Id`]))
  );

  return results;
}

export function validateRowBeforeSave(row) {
  const errors = [];

  GRADE_FIELD_KEYS.forEach((key) => {
    const value = row?.[key];
    if (value !== '' && !isValidGradeValue(value)) {
      errors.push('Note invalide : utilisez une valeur entre 0 et 20.');
    }
  });

  if (!rowHasAnyGrade(row)) {
    errors.push('Aucune note à enregistrer pour cet élève.');
  }

  return errors;
}
