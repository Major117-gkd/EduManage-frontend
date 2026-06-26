import { AlertTriangle, CalendarDays, GraduationCap, Info } from 'lucide-react';

export const CATEGORY_COLORS = {
  Info: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', accent: '#3b82f6' },
  Urgent: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', accent: '#ef4444' },
  'Événement': { bg: '#f3e8ff', color: '#6d28d9', border: '#c4b5fd', accent: '#8b5cf6' },
  Rentrée: { bg: '#dcfce7', color: '#166534', border: '#86efac', accent: '#22c55e' },
};

export const CATEGORY_ICONS = {
  Info,
  Urgent: AlertTriangle,
  'Événement': CalendarDays,
  Rentrée: GraduationCap,
};

export function formatAnnonceDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatAnnonceDateShort(d) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getCategoryStyle(categorie) {
  return CATEGORY_COLORS[categorie] || CATEGORY_COLORS.Info;
}

export function getCategoryIcon(categorie) {
  return CATEGORY_ICONS[categorie] || Info;
}

/** Retire le markdown pour un extrait lisible dans les bandeaux. */
export function plainTextExcerpt(content, maxLen = 200) {
  if (!content) return '';
  const text = content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}…`;
}
