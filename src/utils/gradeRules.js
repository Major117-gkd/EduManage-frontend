export const CYCLES = ['Primaire', 'Collège', 'Lycée'];

export const DEFAULT_REGLE_CALCUL = {
  evaluations: [
    { type: 'Devoir 1', label: 'Devoir 1', poids: 1 },
    { type: 'Devoir 2', label: 'Devoir 2', poids: 1 },
    { type: 'Composition', label: 'Composition', poids: 2 },
  ],
  seuilReussite: 10,
};

export function normalizeRegle(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_REGLE_CALCUL,
      evaluations: DEFAULT_REGLE_CALCUL.evaluations.map((e) => ({ ...e })),
    };
  }

  const evaluations = Array.isArray(raw.evaluations)
    ? raw.evaluations
        .map((ev) => ({
          type: String(ev.type || ev.label || '').trim(),
          label: String(ev.label || ev.type || '').trim(),
          poids: Math.max(0, parseFloat(ev.poids) || 0),
        }))
        .filter((ev) => ev.type && ev.poids > 0)
    : [];

  return {
    evaluations: evaluations.length > 0
      ? evaluations
      : DEFAULT_REGLE_CALCUL.evaluations.map((e) => ({ ...e })),
    seuilReussite: raw.seuilReussite !== undefined ? parseFloat(raw.seuilReussite) || 10 : 10,
  };
}

export function buildFormulaText(regle) {
  const normalized = normalizeRegle(regle);
  const parts = normalized.evaluations.map((ev) => `${ev.label} × ${ev.poids}`);
  const weightSum = normalized.evaluations.reduce((s, ev) => s + ev.poids, 0);
  return {
    moyenneMatiere: `(${parts.join(' + ')}) ÷ ${weightSum}`,
    moyenneGenerale: 'Σ(moyenne matière × coefficient matière) ÷ Σ(coefficients)',
    seuilReussite: normalized.seuilReussite,
    evaluations: normalized.evaluations,
  };
}

export function computeExampleMoyenneMatiere(regle, exampleValues = {}) {
  const normalized = normalizeRegle(regle);
  let sum = 0;
  let weight = 0;
  const steps = [];

  normalized.evaluations.forEach((ev) => {
    const value = exampleValues[ev.type];
    if (value !== null && value !== undefined && !Number.isNaN(value)) {
      const points = value * ev.poids;
      sum += points;
      weight += ev.poids;
      steps.push({ label: ev.label, value, poids: ev.poids, points });
    }
  });

  const moyenne = weight > 0 ? Math.round((sum / weight) * 100) / 100 : null;
  return { steps, sum, weight, moyenne };
}

export function emptyNiveauForm() {
  return {
    nom: '',
    cycle: 'Collège',
    ordre: 0,
    actif: true,
    description: '',
    regleCalcul: normalizeRegle(null),
    exampleNotes: { 'Devoir 1': 12, 'Devoir 2': 14, Composition: 16 },
  };
}
