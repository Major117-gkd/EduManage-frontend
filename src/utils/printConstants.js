export const SCHOOL_NAME = 'GSP Elhadj Mamadou Saïdou Diallo';
export const SCHOOL_MOTTO = 'Savoir • Discipline • Réussite';
export const SCHOOL_SHORT = 'GSP Saïdou Diallo';

export function formatPrintDate(date = new Date(), withTime = false) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function formatPrintAmount(amount) {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `${Number(amount).toLocaleString('fr-FR')} GNF`;
}
