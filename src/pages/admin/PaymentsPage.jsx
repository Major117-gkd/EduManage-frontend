import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Filter, Trash2, Edit, CheckCircle, XCircle, Clock, X, Printer } from 'lucide-react';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';
import PaymentReceipt, { printPaymentReceipt } from '../../components/PaymentReceipt/PaymentReceipt';

import { api } from '../../services/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [printAfterSave, setPrintAfterSave] = useState(true);
  const [amountPreview, setAmountPreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    eleveId: '',
    montant: '',
    mode_paiement: 'Espèces',
    periode: '',
    annee_scolaire: '2024-2025',
    reference: '',
    notes: ''
  });

  const modesPaiement = ['Espèces', 'Chèque', 'Virement', 'Orange Money', 'Wave', 'Autre'];
  const periodesMensuelles = ['Septembre', 'Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'];
  const periodesTranches = ['Tranche 1', 'Tranche 2', 'Tranche 3'];
  const periodesIntegrales = ['Paiement total', 'Annuel'];

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.get('/admin/classes');
      setClasses(data);
    } catch (error) {
      console.error('Erreur récupération classes:', error);
    }
  };

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, filterStatus]);

  const fetchPayments = async () => {
    try {
      const data = await api.get('/paiements');
      setPayments(data);
    } catch (error) {
      console.error('Erreur récupération paiements:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await api.get('/admin/eleves');
      setStudents(data);
    } catch (error) {
      console.error('Erreur récupération élèves:', error);
    }
  };

  const calculateExpectedAmount = (studentId) => {
    const student = students.find(s => s.id === parseInt(studentId));
    if (!student) return 0;

    // Get the student's class to determine monthly amount
    // Note: This is a simplified version - in production you'd need to fetch the class details
    // For now, we'll use a default or let the user input the amount
    return 0; // Will be calculated on backend
  };

  const handleStudentChange = (studentId) => {
    setFormData({ ...formData, eleveId: studentId, periode: '', montant: '' });
    setAmountPreview(null);
    setFormError('');
  };

  const fetchAmountPreview = async (eleveId, periode, annee_scolaire, montant = '') => {
    if (!eleveId || !periode || !annee_scolaire) {
      setAmountPreview(null);
      return;
    }
    try {
      const params = new URLSearchParams({
        eleveId,
        periode,
        annee_scolaire,
      });
      if (montant) params.set('montant', montant);
      const data = await api.get(`/paiements/montant-attendu?${params}`);
      setAmountPreview(data);
      if (!montant) {
        setFormData((prev) => ({ ...prev, montant: data.montant?.toString() || '' }));
      }
    } catch {
      setAmountPreview(null);
    }
  };

  const getAvailablePeriods = () => {
    const groups = [
      { label: 'Paiement intégral', items: periodesIntegrales },
      { label: 'Tranches', items: periodesTranches },
      { label: 'Mois', items: periodesMensuelles },
    ];

    if (!formData.eleveId) {
      return groups;
    }

    const student = students.find((s) => s.id === parseInt(formData.eleveId));
    const classId = student?.inscriptions?.[0]?.classeId;
    const cls = classes.find((c) => c.id === classId);
    const tranchesClasse = cls?.tranches?.length
      ? [{ label: 'Tranches de la classe', items: cls.tranches.map((t) => t.nom) }]
      : [];

    return [...groups.slice(0, 1), ...tranchesClasse, ...groups.slice(1)];
  };

  const handlePeriodChange = async (periode) => {
    let amount = '';
    if (formData.eleveId) {
      const student = students.find((s) => s.id === parseInt(formData.eleveId));
      const classId = student?.inscriptions?.[0]?.classeId;
      const cls = classes.find((c) => c.id === classId);
      const tranche = cls?.tranches?.find((t) => t.nom === periode);
      if (tranche) {
        amount = tranche.montant.toString();
        setFormData({ ...formData, periode, montant: amount });
        setAmountPreview(null);
        return;
      }
    }
    setFormData({ ...formData, periode, montant: amount });
    if (formData.eleveId && formData.annee_scolaire) {
      await fetchAmountPreview(formData.eleveId, periode, formData.annee_scolaire);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.eleve.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.eleve.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'paid') {
        filtered = filtered.filter(p => p.eleve.statut_financier === 'À jour');
      } else if (filterStatus === 'partial') {
        filtered = filtered.filter(p => p.eleve.statut_financier === 'À jour partiel');
      } else if (filterStatus === 'late') {
        filtered = filtered.filter(p => p.eleve.statut_financier === 'En retard');
      }
    }

    setFilteredPayments(filtered);
  };

  const resetForm = () => {
    setFormData({
      eleveId: '',
      montant: '',
      mode_paiement: 'Espèces',
      periode: '',
      annee_scolaire: '2024-2025',
      reference: '',
      notes: ''
    });
    setAmountPreview(null);
    setFormError('');
  };

  const openReceipt = async (payment, autoPrint = false) => {
    try {
      const full = payment.eleve?.inscriptions
        ? payment
        : await api.get(`/paiements/${payment.id}`);
      setReceiptPayment(full);
      if (autoPrint) {
        setTimeout(() => printPaymentReceipt(), 500);
      }
    } catch (error) {
      console.error('Erreur chargement reçu:', error);
      setReceiptPayment(payment);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const submissionData = { ...formData };
      if (!submissionData.montant) {
        delete submissionData.montant;
      }

      if (editingPayment) {
        await api.put(`/paiements/${editingPayment.id}`, submissionData);
        setShowModal(false);
        setEditingPayment(null);
        resetForm();
      } else {
        const data = await api.post('/paiements', submissionData);
        setShowModal(false);
        setEditingPayment(null);
        resetForm();
        if (data.paiement) {
          if (printAfterSave) {
            await openReceipt(data.paiement, true);
          }
        }
      }
      fetchPayments();
      fetchStudents();
    } catch (error) {
      setFormError(error.data?.error || error.message || 'Erreur lors de l\'enregistrement');
      console.error('Erreur enregistrement paiement:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      try {
        await api.delete(`/paiements/${id}`);
        fetchPayments();
        fetchStudents();
      } catch (error) {
        console.error('Erreur suppression paiement:', error);
      }
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      eleveId: payment.eleveId,
      montant: payment.montant,
      mode_paiement: payment.mode_paiement,
      periode: payment.periode,
      annee_scolaire: payment.annee_scolaire,
      reference: payment.reference || '',
      notes: payment.notes || ''
    });
    setShowModal(true);
  };

  const getStudentStatus = (student) => {
    switch (student.statut_financier) {
      case 'À jour':
        return <span className="status-badge status-paid"><CheckCircle size={14} /> À jour</span>;
      case 'À jour partiel':
        return <span className="status-badge status-partial"><Clock size={14} /> Partiel</span>;
      case 'En retard':
        return <span className="status-badge status-late"><XCircle size={14} /> En retard</span>;
      default:
        return <span className="status-badge status-pending"><Clock size={14} /> En attente</span>;
    }
  };

  const totalMontant = payments.reduce((sum, p) => sum + p.montant, 0);
  const studentsPaid = students.filter(s => s.statut_financier === 'À jour').length;
  const studentsPartial = students.filter(s => s.statut_financier === 'À jour partiel').length;
  const studentsLate = students.filter(s => s.statut_financier === 'En retard').length;
  const totalStudents = students.length;
  const totalDebt = students.reduce((sum, s) => sum + (s.solde || 0), 0);

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Gestion des Paiements</h1>
        <button className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowModal(true)}>
          <Plus size={18} /> Nouveau Paiement
        </button>
      </div>

      <div className="dashboard-stats-grid">
        <div className="admin-stat-card admin-stat-card--stacked">
          <div className="admin-stat-card__top">
            <div className="admin-stat-card__icon" style={{ background: '#dbeafe' }}>
              <DollarSign size={24} color="#0A2F6B" />
            </div>
            <span className="admin-stat-card__label">Total Encaissé</span>
          </div>
          <div className="admin-stat-card__value">{totalMontant.toLocaleString()} GNF</div>
          <div className="admin-stat-card__sub">{payments.length} paiements</div>
        </div>

        <div className="admin-stat-card admin-stat-card--stacked">
          <div className="admin-stat-card__top">
            <div className="admin-stat-card__icon" style={{ background: '#dcfce7' }}>
              <CheckCircle size={24} color="#16a34a" />
            </div>
            <span className="admin-stat-card__label">Élèves à jour</span>
          </div>
          <div className="admin-stat-card__value">{studentsPaid}</div>
          <div className="admin-stat-card__sub">
            {totalStudents > 0 ? ((studentsPaid / totalStudents) * 100).toFixed(1) : 0}% des élèves
          </div>
        </div>

        <div className="admin-stat-card admin-stat-card--stacked">
          <div className="admin-stat-card__top">
            <div className="admin-stat-card__icon" style={{ background: '#fef9c3' }}>
              <Clock size={24} color="#ca8a04" />
            </div>
            <span className="admin-stat-card__label">Paiements partiels</span>
          </div>
          <div className="admin-stat-card__value">{studentsPartial}</div>
          <div className="admin-stat-card__sub">
            {totalStudents > 0 ? ((studentsPartial / totalStudents) * 100).toFixed(1) : 0}% des élèves
          </div>
        </div>

        <div className="admin-stat-card admin-stat-card--stacked">
          <div className="admin-stat-card__top">
            <div className="admin-stat-card__icon" style={{ background: '#fee2e2' }}>
              <XCircle size={24} color="#dc2626" />
            </div>
            <span className="admin-stat-card__label">En retard</span>
          </div>
          <div className="admin-stat-card__value">{studentsLate}</div>
          <div className="admin-stat-card__sub">Dette totale: {totalDebt.toLocaleString()} GNF</div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} color="#0A2F6B" /> Liste des paiements
          </h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="#94a3b8" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                <option value="all">Tous les statuts</option>
                <option value="paid">À jour</option>
                <option value="partial">Partiel</option>
                <option value="late">En retard</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Élève</th>
              <th>Matricule</th>
              <th>Montant</th>
              <th>Mode</th>
              <th>Période</th>
              <th>Statut</th>
              <th>Référence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>Aucun paiement trouvé.</td></tr>
            ) : filteredPayments.map((payment) => (
              <tr key={payment.id}>
                <td>{new Date(payment.date_paiement).toLocaleDateString('fr-FR')}</td>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>{payment.eleve.nom} {payment.eleve.prenom}</td>
                <td>{payment.eleve.matricule}</td>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>{payment.montant.toLocaleString()} GNF</td>
                <td>{payment.mode_paiement}</td>
                <td>{payment.periode}</td>
                <td>{getStudentStatus(payment.eleve)}</td>
                <td>{payment.reference || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn action-btn--view" title="Imprimer le reçu" style={{ background: '#e0e7ff', color: '#4f46e5' }} onClick={() => openReceipt(payment)}><Printer size={16} /></button>
                    <button className="action-btn action-btn--edit" title="Modifier" onClick={() => handleEdit(payment)}><Edit size={16} /></button>
                    <button className="action-btn action-btn--delete" title="Supprimer" onClick={() => handleDelete(payment.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={24} color="#0A2F6B" />
                {editingPayment ? 'Modifier le Paiement' : 'Enregistrer un Paiement'}
              </h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {formError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '0.9rem' }}>
                  {formError}
                </div>
              )}
              <form id="paymentForm" onSubmit={handleSubmit}>
                <div className="modal-form-group">
                  <label>Élève *</label>
                  <select
                    required
                    value={formData.eleveId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                  >
                    <option value="">Sélectionner un élève</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.nom} {student.prenom} - {student.matricule} (Solde: {student.solde} GNF)
                        {student.exception_paiement_mensuel && ' [Exception Mensuel]'}
                      </option>
                    ))}
                  </select>
                  {formData.eleveId && (() => {
                    const student = students.find(s => s.id === parseInt(formData.eleveId));
                    if (student && student.exception_paiement_mensuel) {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', padding: '0.6rem', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #d1fae5' }}>
                          <CheckCircle size={16} color="#059669" />
                          <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 500 }}>
                            Cet élève bénéficie d'une exception : paiement mensuel autorisé
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Montant (GNF)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.montant}
                      onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                      placeholder="Laisser vide pour calcul automatique"
                    />
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                      Calcul auto : tranche (3 mois), mensuel (exception), ou total annuel selon la période choisie.
                    </p>
                    {amountPreview && (
                      <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.75rem', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '0.82rem', color: '#1e40af' }}>
                        <strong>Montant annuel :</strong> {amountPreview.montant_annuel?.toLocaleString()} GNF ·{' '}
                        <strong>Déjà payé :</strong> {amountPreview.total_paye?.toLocaleString()} GNF ·{' '}
                        <strong>Reste :</strong> {amountPreview.solde_restant_annee?.toLocaleString()} GNF
                        {amountPreview.paiement_integral && (
                          <span style={{ display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>
                            Paiement intégral — montant appliqué : {amountPreview.montant?.toLocaleString()} GNF
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="modal-form-group">
                    <label>Mode de paiement *</label>
                    <select
                      required
                      value={formData.mode_paiement}
                      onChange={(e) => setFormData({ ...formData, mode_paiement: e.target.value })}
                    >
                      {modesPaiement.map((mode) => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Période / Tranche *</label>
                    <select
                      required
                      value={formData.periode}
                      onChange={(e) => handlePeriodChange(e.target.value)}
                    >
                      <option value="">Sélectionner une période</option>
                      {getAvailablePeriods().map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.items.map((periode) => (
                            <option key={periode} value={periode}>{periode}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="modal-form-group">
                    <label>Année scolaire *</label>
                    <input
                      type="text"
                      required
                      value={formData.annee_scolaire}
                      onChange={(e) => setFormData({ ...formData, annee_scolaire: e.target.value })}
                      placeholder="Ex: 2024-2025"
                    />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Référence (Numéro de reçu)</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="Ex: REC-2024-001"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes additionnelles..."
                    rows="3"
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.95rem', color: '#0f172a', transition: 'all 0.2s', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
                {!editingPayment && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={printAfterSave}
                      onChange={(e) => setPrintAfterSave(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 500 }}>
                      Imprimer le reçu après enregistrement
                    </span>
                  </label>
                )}
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
              <button type="submit" form="paymentForm" className="btn-submit">
                {editingPayment ? 'Modifier' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptPayment && (
        <div className="modal-overlay" onClick={() => setReceiptPayment(null)}>
          <div className="modal-content print-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%' }}>
            <div className="modal-header print-hide">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Printer size={22} color="#0A2F6B" />
                <h2>Reçu de paiement — {receiptPayment.reference || `#${receiptPayment.id}`}</h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setReceiptPayment(null)}><X size={20} /></button>
            </div>
            <div className="modal-body payment-receipt-wrapper edu-print-root" style={{ padding: '1.5rem', background: '#e2e8f0' }}>
              <PaymentReceipt paiement={receiptPayment} />
            </div>
            <div className="modal-footer print-hide">
              <button type="button" className="btn-cancel" onClick={() => setReceiptPayment(null)}>Fermer</button>
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
