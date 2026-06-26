import { FileText, Bell, UserPlus, DollarSign } from 'lucide-react';
import React from 'react';

export function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFullDate(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getNotificationTypeLabel(type) {
  switch (type) {
    case 'NOTE_SAISIE':
      return 'Saisie de notes';
    case 'INSCRIPTION':
      return 'Inscription';
    case 'PAIEMENT':
      return 'Paiement';
    default:
      return type || 'Autre';
  }
}

export function getNotificationIcon(type, size = 18) {
  switch (type) {
    case 'NOTE_SAISIE':
      return <FileText size={size} />;
    case 'INSCRIPTION':
      return <UserPlus size={size} />;
    case 'PAIEMENT':
      return <DollarSign size={size} />;
    default:
      return <Bell size={size} />;
  }
}

export function isToday(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getDate() === now.getDate()
    && date.getMonth() === now.getMonth()
    && date.getFullYear() === now.getFullYear()
  );
}
