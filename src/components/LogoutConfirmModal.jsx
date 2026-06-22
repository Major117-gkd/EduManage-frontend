import React from 'react';
import { LogOut, X } from 'lucide-react';
import '../pages/admin/Modal.css';
import './LogoutConfirmModal.css';

export default function LogoutConfirmModal({ open, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay logout-confirm-overlay"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="logout-confirm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
      >
        <button
          type="button"
          className="logout-confirm__close"
          onClick={onCancel}
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <div className="logout-confirm__icon" aria-hidden>
          <LogOut size={28} />
        </div>

        <h2 id="logout-confirm-title" className="logout-confirm__title">
          Se déconnecter ?
        </h2>
        <p className="logout-confirm__text">
          Vous allez quitter votre session. Vous devrez vous reconnecter pour accéder à nouveau à l&apos;application.
        </p>

        <div className="logout-confirm__actions">
          <button type="button" className="btn-cancel logout-confirm__btn" onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className="btn-submit logout-confirm__btn logout-confirm__btn--danger" onClick={onConfirm}>
            <LogOut size={16} />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
