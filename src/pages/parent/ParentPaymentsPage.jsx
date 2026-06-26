import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Printer,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { useParentContext } from './ParentContext';
import { useParentSchoolFilters } from './useParentSchoolFilters';
import PaymentReceipt, { printPaymentReceipt } from '../../components/PaymentReceipt/PaymentReceipt';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';
import '../admin/PaymentsPage.css';
import './ParentSpace.css';

function formatGnf(v) {
  if (v == null) return '—';
  return `${Number(v).toLocaleString('fr-FR')} GNF`;
}

function getPaymentRowBadge() {
  return (
    <span className="status-badge status-paid">
      <CheckCircle size={14} /> Payé
    </span>
  );
}

function getFinancierStatusBadge(statut) {
  switch (statut) {
    case 'À jour':
      return <span className="status-badge status-paid"><CheckCircle size={14} /> À jour</span>;
    case 'À jour partiel':
      return <span className="status-badge status-partial"><Clock size={14} /> Partiel</span>;
    case 'En retard':
      return <span className="status-badge status-late"><XCircle size={14} /> En retard</span>;
    default:
      return <span className="status-badge status-pending"><Clock size={14} /> En attente</span>;
  }
}

export default function ParentPaymentsPage() {
  const { eleveId } = useParentContext();
  const { annees, annee, setAnnee, loading: filtersLoading, error: filtersError, ready } =
    useParentSchoolFilters({ eleveId });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptPayment, setReceiptPayment] = useState(null);

  const load = useCallback(async () => {
    if (!ready || !eleveId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(
        `/parent/paiements?eleve_id=${eleveId}&annee_scolaire=${encodeURIComponent(annee)}`
      );
      setData(res);
    } catch (err) {
      setError(err.data?.error || 'Impossible de charger les paiements.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [annee, ready, eleveId]);

  useEffect(() => {
    if (!ready) {
      if (!filtersLoading) setLoading(false);
      return;
    }
    load();
  }, [load, ready, filtersLoading]);

  const filteredPayments = useMemo(() => {
    const list = data?.paiements || [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.trim().toLowerCase();
    return list.filter((p) =>
      [p.mode_paiement, p.periode, p.reference, p.notes, String(p.montant)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [data?.paiements, searchTerm]);

  const paidPercent = useMemo(() => {
    if (!data?.annualAmount) return 0;
    return Math.min(100, ((data.totalPaid || 0) / data.annualAmount) * 100);
  }, [data]);

  const openReceipt = (payment) => {
    const eleve = data?.eleve;
    setReceiptPayment({
      ...payment,
      annee_scolaire: payment.annee_scolaire || annee,
      eleve: eleve
        ? {
            ...eleve,
            inscriptions: data?.classe ? [{ classe: data.classe }] : [],
          }
        : undefined,
    });
  };

  return (
    <div className="parent-page">
      <div className="parent-page__header">
        <h1 className="parent-page__title">Paiements scolaires</h1>
        <p className="parent-page__sub">Situation financière et historique des versements</p>
      </div>

      {filtersError && <div className="parent-alert parent-alert--error">{filtersError}</div>}

      {loading ? (
        <div className="parent-loading">Chargement des paiements</div>
      ) : error ? (
        <div className="parent-alert parent-alert--error">{error}</div>
      ) : data ? (
        <>
          {data.hasFeesConfigured && (
            <div className="parent-progress">
              <div className="parent-progress__label">
                <span>Progression des paiements — {annee}</span>
                <span>{paidPercent.toFixed(0)}%</span>
              </div>
              <div className="parent-progress__bar">
                <div className="parent-progress__fill" style={{ width: `${paidPercent}%` }} />
              </div>
            </div>
          )}

          <div className="parent-payments-stats">
            <div className="parent-stat">
              <div className="parent-stat__top">
                <span className="parent-stat__label">Frais annuels</span>
                <div className="parent-stat__icon parent-stat__icon--blue">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="parent-stat__value">{formatGnf(data.annualAmount)}</div>
              <div className="parent-stat__sub">{data.classe?.nom || '—'}</div>
            </div>
            <div className="parent-stat">
              <div className="parent-stat__top">
                <span className="parent-stat__label">Total payé</span>
                <div className="parent-stat__icon parent-stat__icon--green">
                  <CheckCircle size={20} />
                </div>
              </div>
              <div className="parent-stat__value">{formatGnf(data.totalPaid)}</div>
              <div className="parent-stat__sub">{data.paiements?.length || 0} versement(s)</div>
            </div>
            <div className="parent-stat">
              <div className="parent-stat__top">
                <span className="parent-stat__label">Reste à payer</span>
                <div className="parent-stat__icon parent-stat__icon--gold">
                  <Clock size={20} />
                </div>
              </div>
              <div className="parent-stat__value">{formatGnf(data.remainingYear)}</div>
            </div>
            <div className="parent-stat">
              <div className="parent-stat__top">
                <span className="parent-stat__label">Statut</span>
              </div>
              <div className="parent-stat__value" style={{ fontSize: '1rem' }}>
                {getFinancierStatusBadge(data.statut_financier)}
              </div>
            </div>
          </div>

          <div className="parent-panel">
            <div className="parent-panel__header">
              <h2 className="parent-panel__title">Historique — {annee}</h2>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="parent-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={annee}
                  onChange={(e) => setAnnee(e.target.value)}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--pa-border)',
                    background: 'var(--pa-surface)',
                    color: 'var(--pa-text)',
                    fontSize: '0.85rem',
                  }}
                >
                  {annees.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Mode</th>
                    <th>Période</th>
                    <th>Statut</th>
                    <th>Reçu</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--pa-muted)' }}>
                        Aucun paiement pour cette année.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.date_paiement).toLocaleDateString('fr-FR')}</td>
                        <td style={{ fontWeight: 700 }}>{formatGnf(payment.montant)}</td>
                        <td>{payment.mode_paiement}</td>
                        <td>{payment.periode}</td>
                        <td>{getPaymentRowBadge()}</td>
                        <td>
                          <button type="button" className="action-btn action-btn--view" onClick={() => openReceipt(payment)}>
                            <Printer size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {receiptPayment && (
        <div className="modal-overlay" onClick={() => setReceiptPayment(null)}>
          <div className="modal-content print-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%' }}>
            <div className="modal-header print-hide">
              <h2>Reçu de paiement</h2>
              <button type="button" className="modal-close-btn" onClick={() => setReceiptPayment(null)}><X size={20} /></button>
            </div>
            <div className="modal-body payment-receipt-wrapper edu-print-root" style={{ padding: '1.5rem', background: '#e2e8f0' }}>
              <PaymentReceipt paiement={receiptPayment} />
            </div>
            <div className="modal-footer print-hide">
              <button type="button" className="btn-cancel" onClick={() => setReceiptPayment(null)}>Fermer</button>
              <button type="button" className="btn-submit" onClick={() => printPaymentReceipt()}>
                <Printer size={18} /> Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
