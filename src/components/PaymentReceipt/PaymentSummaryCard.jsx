import React from 'react';
import { CheckCircle, Clock, CreditCard, Wallet, XCircle } from 'lucide-react';
import { formatPrintAmount } from '../../utils/printConstants';
import './PaymentSummaryCard.css';

function resolveFinances(paiement, financesOverride) {
  const f = financesOverride || paiement?.finances || {};
  return {
    montantPaye: f.montantPaye ?? paiement?.montant ?? null,
    modePaiement: f.modePaiement ?? paiement?.mode_paiement ?? '—',
    soldeRestant: f.soldeRestant ?? f.remainingYear ?? null,
    statutFinancier: f.statutFinancier ?? f.statut_financier ?? paiement?.eleve?.statut_financier ?? 'En attente',
    totalPaye: f.totalPaye ?? f.totalPaid ?? null,
    fraisAnnuels: f.fraisAnnuels ?? f.annualAmount ?? null,
  };
}

function StatutBadge({ statut }) {
  const cfg = {
    'À jour': { cls: 'payment-summary-card__status--ok', Icon: CheckCircle },
    'À jour partiel': { cls: 'payment-summary-card__status--partial', Icon: Clock },
    'En retard': { cls: 'payment-summary-card__status--late', Icon: XCircle },
  }[statut] || { cls: 'payment-summary-card__status--pending', Icon: Clock };
  const Icon = cfg.Icon;
  return (
    <span className={`payment-summary-card__status ${cfg.cls}`}>
      <Icon size={14} />
      {statut}
    </span>
  );
}

/**
 * Carte récapitulative dynamique d'un paiement.
 * Les valeurs proviennent du backend (`finances` sur le reçu API).
 */
export default function PaymentSummaryCard({ paiement, finances, variant = 'default', className = '' }) {
  if (!paiement) return null;

  const {
    montantPaye,
    modePaiement,
    soldeRestant,
    statutFinancier,
    totalPaye,
    fraisAnnuels,
  } = resolveFinances(paiement, finances);

  const paidPercent = fraisAnnuels > 0 && totalPaye != null
    ? Math.min(100, (totalPaye / fraisAnnuels) * 100)
    : null;

  return (
    <div className={`payment-summary-card payment-summary-card--${variant} ${className}`.trim()}>
      <div className="payment-summary-card__hero">
        <div className="payment-summary-card__hero-label">
          <Wallet size={18} />
          Montant payé
        </div>
        <div className="payment-summary-card__hero-value">
          {formatPrintAmount(montantPaye)}
        </div>
        {paidPercent != null && (
          <div className="payment-summary-card__progress" aria-label={`${paidPercent.toFixed(0)}% des frais annuels payés`}>
            <div className="payment-summary-card__progress-bar" style={{ width: `${paidPercent}%` }} />
          </div>
        )}
        {paidPercent != null && (
          <div className="payment-summary-card__progress-label">
            {paidPercent.toFixed(1)}% des frais annuels ({formatPrintAmount(totalPaye)} / {formatPrintAmount(fraisAnnuels)})
          </div>
        )}
      </div>

      <div className="payment-summary-card__grid">
        <div className="payment-summary-card__field">
          <span className="payment-summary-card__field-label">
            <CreditCard size={13} />
            Mode de paiement
          </span>
          <strong>{modePaiement}</strong>
        </div>
        <div className="payment-summary-card__field">
          <span className="payment-summary-card__field-label">
            <Wallet size={13} />
            Solde restant
          </span>
          <strong className={soldeRestant > 0 ? 'payment-summary-card__amount--due' : 'payment-summary-card__amount--ok'}>
            {soldeRestant != null ? formatPrintAmount(soldeRestant) : '—'}
          </strong>
        </div>
        <div className="payment-summary-card__field payment-summary-card__field--full">
          <span className="payment-summary-card__field-label">Statut financier</span>
          <StatutBadge statut={statutFinancier} />
        </div>
      </div>
    </div>
  );
}
