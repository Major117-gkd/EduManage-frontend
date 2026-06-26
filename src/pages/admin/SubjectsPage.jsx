import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, X, Search } from 'lucide-react';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { canDeleteSubjects } from '../../utils/rbac';

export default function SubjectsPage() {
  const { user } = useAuth();
  const canRemoveSubjects = canDeleteSubjects(user?.role);

  const [matieres, setMatieres] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', coefficient: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const mat = await api.get('/admin/matieres/catalog');
      if (Array.isArray(mat)) setMatieres(mat);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    if (!form.nom?.trim()) {
      setMessage('Erreur : le nom de la matière est requis.');
      setSubmitting(false);
      return;
    }

    try {
      const body = {
        nom: form.nom.trim(),
        coefficient: parseFloat(form.coefficient) || 1,
      };

      if (editingId) {
        await api.put(`/admin/matieres/${editingId}`, body);
      } else {
        await api.post('/admin/matieres', body);
      }

      await loadData();
      closeModal();
    } catch (error) {
      setMessage(`Erreur : ${error.data?.error || error.message || 'Enregistrement impossible.'}`);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette matière du catalogue ?')) {
      try {
        await api.delete(`/admin/matieres/${id}`);
        setMatieres(matieres.filter(m => m.id !== id));
      } catch (error) {
        alert(error.data?.error || error.message || 'Suppression impossible.');
      }
    }
  };

  const openModal = (matiere = null) => {
    setMessage('');
    if (matiere) {
      setEditingId(matiere.id);
      setForm({ nom: matiere.nom, coefficient: matiere.coefficient });
    } else {
      setEditingId(null);
      setForm({ nom: '', coefficient: 1 });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ nom: '', coefficient: 1 });
    setEditingId(null);
    setMessage('');
  };

  const filteredMatieres = matieres.filter(m =>
    m.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Catalogue des matières</h1>
        <button className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => openModal()}>
          <Plus size={18} /> Ajouter une matière
        </button>
      </div>

      {user?.role === 'DIRECTEUR' && user?.perimetre && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '0.9rem' }}>
          Directeur <strong>{user.perimetre}</strong> — le catalogue est partagé ; les affectations par classe restent limitées à votre cycle.
        </div>
      )}

      <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.92rem', maxWidth: '720px' }}>
        Créez ici les matières de l&apos;établissement. Lors de la création d&apos;une <strong>classe</strong>, vous sélectionnerez celles qui y seront enseignées — les élèves ne seront évalués que sur ces matières.
      </p>

      <div className="admin-panel">
        <div className="admin-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="#0A2F6B" /> Matières disponibles
          </h2>
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
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom de la matière</th>
                <th>Coefficient</th>
                <th>Classes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Chargement...</td></tr>
              ) : filteredMatieres.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>Aucune matière dans le catalogue.</td></tr>
              ) : (
                filteredMatieres.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{m.nom}</td>
                    <td>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#f1f5f9', fontWeight: 600 }}>
                        {m.coefficient}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge status-badge--info">
                        {m._count?.instances ?? 0} classe{(m._count?.instances ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn action-btn--edit" onClick={() => openModal(m)}><Edit size={16} /></button>
                        {canRemoveSubjects && (
                          <button className="action-btn action-btn--delete" onClick={() => handleDelete(m.id)}><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Modifier la matière' : 'Ajouter une matière'}</h2>
              <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {message && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '0.9rem' }}>
                  {message}
                </div>
              )}
              <form id="matiereForm" onSubmit={handleSubmit}>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Nom de la matière</label>
                    <input
                      type="text"
                      value={form.nom}
                      onChange={e => setForm({ ...form, nom: e.target.value })}
                      placeholder="Ex: Mathématiques"
                      required
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Coefficient</label>
                    <input
                      type="number"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={form.coefficient}
                      onChange={e => setForm({ ...form, coefficient: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  Cette matière sera proposée lors de la création des classes. Les professeurs s&apos;y affectent depuis la page <strong>Professeurs</strong>.
                </p>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Annuler</button>
              <button type="submit" form="matiereForm" className="btn-submit" disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
