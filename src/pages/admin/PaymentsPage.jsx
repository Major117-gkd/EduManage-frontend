import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Plus, Search, Filter, Download, Trash2, Edit, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
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
  const periodes = ['Septembre', 'Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Tranche 1', 'Tranche 2', 'Tranche 3', 'Annuel'];

  useEffect(() => {
    fetchPayments();
    fetchStudents();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, filterStatus]);

  const fetchPayments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/paiements');
      setPayments(response.data);
    } catch (error) {
      console.error('Erreur récupération paiements:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/eleves');
      setStudents(response.data);
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
    setFormData({ ...formData, eleveId: studentId });
    // The backend will calculate the expected amount based on tranche system
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Don't send montant if empty - backend will calculate based on tranche system
      const submissionData = { ...formData };
      if (!submissionData.montant) {
        delete submissionData.montant;
      }

      if (editingPayment) {
        await axios.put(`http://localhost:5000/api/paiements/${editingPayment.id}`, submissionData);
      } else {
        await axios.post('http://localhost:5000/api/paiements', submissionData);
      }
      setShowModal(false);
      setEditingPayment(null);
      setFormData({
        eleveId: '',
        montant: '',
        mode_paiement: 'Espèces',
        periode: '',
        annee_scolaire: '2024-2025',
        reference: '',
        notes: ''
      });
      fetchPayments();
      fetchStudents();
    } catch (error) {
      console.error('Erreur enregistrement paiement:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/paiements/${id}`);
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={24} color="#0A2F6B" />
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Total Encaissé</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
            {totalMontant.toLocaleString()} GNF
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {payments.length} paiements
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} color="#16a34a" />
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Élèves à jour</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
            {studentsPaid}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {totalStudents > 0 ? ((studentsPaid / totalStudents) * 100).toFixed(1) : 0}% des élèves
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} color="#ca8a04" />
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Paiements partiels</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
            {studentsPartial}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {totalStudents > 0 ? ((studentsPartial / totalStudents) * 100).toFixed(1) : 0}% des élèves
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={24} color="#dc2626" />
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>En retard</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
            {studentsLate}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Dette totale: {totalDebt.toLocaleString()} GNF
          </div>
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
                      Si vide, calculé automatiquement : 3 mois (tranche) ou 1 mois (exception)
                    </p>
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
                    <label>Période *</label>
                    <select
                      required
                      value={formData.periode}
                      onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                    >
                      <option value="">Sélectionner une période</option>
                      {periodes.map((periode) => (
                        <option key={periode} value={periode}>{periode}</option>
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
    </div>
  );
}
