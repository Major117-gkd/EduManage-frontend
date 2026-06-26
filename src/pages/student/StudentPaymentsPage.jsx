import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Printer,
  X,
  Bell,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { api } from '../../services/api';
import { useStudentSchoolFilters } from './useStudentSchoolFilters';
import PaymentReceipt, { printPaymentReceipt } from '../../components/PaymentReceipt/PaymentReceipt';
import PaymentSummaryCard from '../../components/PaymentReceipt/PaymentSummaryCard';
import { formatRelativeTime, getNotificationIcon } from '../../utils/notificationUtils';
import '../admin/Modal.css';
import './StudentSpace.css';
import './StudentPaymentsPage.css';

function formatGnf(v) {
  if (v == null) return '—';
  return `${Number(v).toLocaleString('fr-FR')} GNF`;
}

function FinancierBadge({ statut }) {
  const map = {
    'À jour': { cls: 'student-payments-status-badge--ok', icon: CheckCircle, label: 'À jour' },
    'À jour partiel': { cls: 'student-payments-status-badge--partial', icon: Clock, label: 'Partiel' },
    'En retard': { cls: 'student-payments-status-badge--late', icon: XCircle, label: 'En retard' },
  };
  const cfg = map[statut] || { cls: 'student-payments-status-badge--pending', icon: Clock, label: 'En attente' };
  const Icon = cfg.icon;
  return (
    <span className={`student-payments-status-badge ${cfg.cls}`}>
      <Icon size={14} /> {cfg.label}
    </span>
  );
}

export default function StudentPaymentsPage() {
  const {
    annees,
    annee,
    setAnnee,
    loading: filtersLoading,
    error: filtersError,
    ready,
  } = useStudentSchoolFilters();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [profil, setProfil] = useState(null);
  const [paymentNotifs, setPaymentNotifs] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(true);

  useEffect(() => {
    api.get('/student/me').then((res) => setProfil(res)).catch(() => {});
  }, []);

  const loadNotifs = useCallback(() => {
    setNotifsLoading(true);
    api.get('/notifications?type=PAIEMENT&limit=20')
      .then((res) => setPaymentNotifs(res.notifications || []))
      .catch(() => setPaymentNotifs([]))
      .finally(() => setNotifsLoading(false));
  }, []);

  useEffect(() => {
    loadNotifs();
  }, [loadNotifs]);

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/student/paiements?annee_scolaire=${encodeURIComponent(annee)}`);
      setData(res);
    } catch (err) {
      setError(err.data?.error || 'Impossible de charger vos paiements.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [annee, ready]);

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

  const unreadNotifCount = paymentNotifs.filter((n) => !n.lu).length;

  const markNotifRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setPaymentNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
      window.dispatchEvent(new Event('edumanage:notifications-refresh'));
    } catch {
      /* ignore */
    }
  };

  const openReceipt = async (payment) => {
    setReceiptLoading(true);
    setSelectedPaymentId(payment.id);
    try {
      const recu = await api.get(`/student/paiements/${payment.id}/recu`);
      setSelectedReceipt(recu);
      setReceiptPayment(recu);
    } catch {
      const fallback = {
        ...payment,
        annee_scolaire: payment.annee_scolaire || annee,
        finances: {
          montantPaye: payment.montant,
          modePaiement: payment.mode_paiement,
          soldeRestant: data?.remainingYear ?? 0,
          statutFinancier: data?.statut_financier ?? 'En attente',
          totalPaye: data?.totalPaid ?? 0,
          fraisAnnuels: data?.annualAmount ?? 0,
        },
        eleve: profil?.eleve
          ? {
              ...profil.eleve,
              inscriptions: profil?.inscription?.classe
                ? [{ classe: profil.inscription.classe }]
                : data?.classe
                  ? [{ classe: data.classe }]
                  : [],
            }
          : data?.eleve,
      };
      setSelectedReceipt(fallback);
      setReceiptPayment(fallback);
    } finally {
      setReceiptLoading(false);
    }
  };

  return (
    <div className="student-page">
      <div className="student-page__header">
        <h1 className="student-page__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet size={24} color="var(--st-primary)" />
          Mes paiements
        </h1>
        <p className="student-page__sub">
          Suivez vos frais scolaires, consultez l&apos;historique et vos notifications de paiement.
        </p>
      </div>

      {filtersError && (
        <div className="student-alert student-alert--error">
          <AlertCircle size={18} />
          {filtersError}
        </div>
      )}

      {loading ? (
        <div className="student-loading">Chargement de vos paiements…</div>
      ) : error ? (
        <div className="student-alert student-alert--error">
          <AlertCircle size={18} />
          {error}
        </div>
      ) : data ? (
        <>
          {!data.hasInscription && (
            <div className="student-payments-alert student-payments-alert--warn">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span>
                Aucune inscription trouvée pour l&apos;année {annee}. Les montants affichés peuvent être incomplets.
              </span>
            </div>
          )}
          {data.hasInscription && data.inscription?.statut !== 'Validé' && (
            <div className="student-payments-alert student-payments-alert--warn">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span>
                Votre inscription pour {annee} est « {data.inscription.statut} ». Les frais seront calculés une fois l&apos;inscription validée.
              </span>
            </div>
          )}
          {!data.hasFeesConfigured && data.hasInscription && (
            <div className="student-payments-alert student-payments-alert--info">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span>
                Les frais annuels de votre classe ne sont pas encore configurés. Contactez l&apos;administration.
              </span>
            </div>
          )}
          {data.hasFeesConfigured && data.remainingYear > 0 && !data.paiementAJour && (
            <div className="student-payments-alert student-payments-alert--due">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span>
                <strong>Solde en attente :</strong> il reste {formatGnf(data.remainingYear)} à régler pour {annee}.
                {data.statut_financier === 'En retard' && ' Votre situation est en retard — contactez le secrétariat.'}
              </span>
            </div>
          )}

          <div className="student-stats">
            <div className="student-stat-card student-stat-card--blue">
              <div className="student-stat-card__top">
                <span className="student-stat-card__label">Frais annuels</span>
                <div className="student-stat-card__icon-wrap">
                  <DollarSign size={18} color="var(--st-primary)" />
                </div>
              </div>
              <div className="student-stat-card__value">{formatGnf(data.annualAmount)}</div>
              <div className="student-stat-card__sub">
                {data.classe?.nom || '—'} · {annee}
              </div>
            </div>

            <div className="student-stat-card student-stat-card--green">
              <div className="student-stat-card__top">
                <span className="student-stat-card__label">Total payé</span>
                <div className="student-stat-card__icon-wrap">
                  <CheckCircle size={18} color="var(--st-success)" />
                </div>
              </div>
              <div className="student-stat-card__value">{formatGnf(data.totalPaid)}</div>
              <div className="student-stat-card__sub">
                {data.paiements?.length || 0} versement(s)
                {data.hasFeesConfigured ? ` · ${paidPercent.toFixed(1)}%` : ''}
              </div>
              {data.hasFeesConfigured && (
                <div className="student-payments-progress" aria-hidden="true">
                  <div className="student-payments-progress__bar" style={{ width: `${paidPercent}%` }} />
                </div>
              )}
            </div>

            <div className="student-stat-card student-stat-card--orange">
              <div className="student-stat-card__top">
                <span className="student-stat-card__label">Reste à payer</span>
                <div className="student-stat-card__icon-wrap">
                  <Clock size={18} color="#ea580c" />
                </div>
              </div>
              <div className="student-stat-card__value">{formatGnf(data.remainingYear)}</div>
              <div className="student-stat-card__sub">
                {data.hasFeesConfigured
                  ? data.exception_paiement_mensuel
                    ? 'Paiement mensuel autorisé'
                    : 'Paiement par tranches'
                  : 'Montant non défini'}
              </div>
            </div>

            <div className="student-stat-card student-stat-card--purple">
              <div className="student-stat-card__top">
                <span className="student-stat-card__label">Statut financier</span>
                <div className="student-stat-card__icon-wrap">
                  {data.paiementAJour && data.hasFeesConfigured ? (
                    <CheckCircle size={18} color="var(--st-success)" />
                  ) : (
                    <XCircle size={18} color="var(--st-danger)" />
                  )}
                </div>
              </div>
              <div className="student-stat-card__value student-stat-card__value--sm">
                <FinancierBadge statut={data.statut_financier} />
              </div>
              <div className="student-stat-card__sub">Solde : {formatGnf(data.solde)}</div>
            </div>
          </div>

          <div className="student-payments-layout">
            <div className="student-panel">
              {selectedReceipt && (
                <div className="student-panel__body student-panel__body--padded" style={{ paddingBottom: 0 }}>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--st-text-muted)' }}>
                    Détail du versement sélectionné
                    {receiptLoading && ' — chargement…'}
                  </p>
                  <PaymentSummaryCard paiement={selectedReceipt} finances={selectedReceipt.finances} />
                </div>
              )}

              <div className="student-panel__header">
                <h2 className="student-panel__title">Historique — {annee}</h2>
              </div>

              <div className="student-payments-toolbar">
                <div className="student-payments-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher un paiement…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="student-payments-year-select">
                  <Filter size={16} color="var(--st-text-muted)" />
                  <select
                    value={annee}
                    onChange={(e) => setAnnee(e.target.value)}
                    disabled={filtersLoading || !annees.length}
                  >
                    {annees.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="student-payments-table-wrap">
                <table className="student-payments-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Mode</th>
                      <th>Période</th>
                      <th>Référence</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="student-payments-table__empty">
                          Aucun paiement enregistré pour cette année.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => (
                        <tr
                          key={payment.id}
                          className={selectedPaymentId === payment.id ? 'student-payments-table__row--active' : ''}
                          onClick={() => openReceipt(payment)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{new Date(payment.date_paiement).toLocaleDateString('fr-FR')}</td>
                          <td className="student-payments-table__amount">{formatGnf(payment.montant)}</td>
                          <td>{payment.mode_paiement}</td>
                          <td>{payment.periode}</td>
                          <td>{payment.reference || '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="student-payments-print-btn"
                              title="Imprimer le reçu"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReceipt(payment);
                              }}
                            >
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

            <div className="student-panel student-payments-notif-panel">
              <div className="student-panel__header">
                <h2 className="student-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Bell size={17} />
                  Notifications paiements
                  {unreadNotifCount > 0 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--st-danger)', fontWeight: 700 }}>
                      ({unreadNotifCount} non lue{unreadNotifCount > 1 ? 's' : ''})
                    </span>
                  )}
                </h2>
              </div>
              <div className="student-panel__body">
                {notifsLoading ? (
                  <div className="student-empty">Chargement…</div>
                ) : paymentNotifs.length === 0 ? (
                  <div className="student-empty">
                    Aucune notification de paiement pour le moment.
                    <br />
                    <span style={{ fontSize: '0.78rem' }}>
                      Vous serez notifié ici lorsqu&apos;un versement sera enregistré.
                    </span>
                  </div>
                ) : (
                  paymentNotifs.map((n) => (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      className={`student-notif-row${n.lu ? ' student-notif-row--read' : ''}`}
                      onClick={() => { if (!n.lu) markNotifRead(n.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !n.lu) markNotifRead(n.id); }}
                    >
                      <div className="student-payments-notif-row__icon">
                        {getNotificationIcon('PAIEMENT', 16)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="student-notif-row__title">{n.titre}</p>
                        {n.message && <p className="student-notif-row__text">{n.message}</p>}
                        <div className="student-notif-row__date">{formatRelativeTime(n.createdAt)}</div>
                      </div>
                      {!n.lu && <div className="student-notif-row__dot" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {receiptPayment && (
        <div className="modal-overlay" onClick={() => setReceiptPayment(null)}>
          <div
            className="modal-content print-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', width: '95%' }}
          >
            <div className="modal-header print-hide">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Printer size={22} color="#0A2F6B" />
                <h2>
                  Reçu de paiement — {receiptPayment.reference || `#${receiptPayment.id}`}
                </h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setReceiptPayment(null)}>
                <X size={20} />
              </button>
            </div>
            <div
              className="modal-body payment-receipt-wrapper edu-print-root"
              style={{ padding: '1.5rem', background: '#e2e8f0' }}
            >
              <PaymentReceipt paiement={receiptPayment} />
            </div>
            <div className="modal-footer print-hide">
              <button type="button" className="btn-cancel" onClick={() => setReceiptPayment(null)}>
                Fermer
              </button>
              <button
                type="button"
                className="btn-submit"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => printPaymentReceipt()}
              >
                <Printer size={18} /> Imprimer le reçu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
