import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import '../pages/admin/Modal.css';
import './ConfirmModal.css';

export default function ConfirmModal({
  open,
  title = 'Confirmer',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
  icon: Icon = AlertTriangle,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay confirm-modal-overlay" onClick={loading ? undefined : onCancel} role="presentation">
      <div
        className="confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <button
          type="button"
          className="confirm-modal__close"
          onClick={onCancel}
          disabled={loading}
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <div className={`confirm-modal__icon confirm-modal__icon--${variant}`} aria-hidden>
          <Icon size={28} />
        </div>

        <h2 id="confirm-modal-title" className="confirm-modal__title">
          {title}
        </h2>
        {message && <p className="confirm-modal__text">{message}</p>}

        <div className="confirm-modal__actions">
          <button type="button" className="btn-cancel confirm-modal__btn" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn-submit confirm-modal__btn confirm-modal__btn--${variant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Traitement…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
