import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, X, Search } from 'lucide-react';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';

import { api } from '../../services/api';

export default function SubjectsPage() {
  const [matieres, setMatieres] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', coefficient: 1, professeurId: '', classeId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [mat, prof, cls] = await Promise.all([
        api.get('/admin/matieres'),
        api.get('/admin/professeurs'),
        api.get('/admin/classes'),
      ]);
      if (Array.isArray(mat)) setMatieres(mat);
      if (Array.isArray(prof)) setProfesseurs(prof);
      if (Array.isArray(cls)) setClasses(cls);
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
    if (!form.classeId) {
      setMessage('Erreur : sélectionnez une classe.');
      setSubmitting(false);
      return;
    }
    if (!form.professeurId) {
      setMessage('Erreur : sélectionnez un professeur responsable.');
      setSubmitting(false);
      return;
    }

    try {
      const body = {
        nom: form.nom.trim(),
        coefficient: parseFloat(form.coefficient) || 1,
        classeId: parseInt(form.classeId, 10),
        professeurId: parseInt(form.professeurId, 10),
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
    if (window.confirm("Voulez-vous vraiment supprimer cette matière ?")) {
      try {
        await api.delete(`/admin/matieres/${id}`);
        setMatieres(matieres.filter(m => m.id !== id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openModal = (matiere = null) => {
    setMessage('');
    if (matiere) {
      setEditingId(matiere.id);
      setForm({ 
        nom: matiere.nom, 
        coefficient: matiere.coefficient, 
        professeurId: matiere.professeurId || '',
        classeId: matiere.classeId || ''
      });
    } else {
      setEditingId(null);
      setForm({ nom: '', coefficient: 1, professeurId: '', classeId: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ nom: '', coefficient: 1, professeurId: '', classeId: '' });
    setEditingId(null);
    setMessage('');
  };

  const filteredMatieres = matieres.filter(m => 
    m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.professeur?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.classe?.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Gestion des Matières</h1>
        <button className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => openModal()}>
          <Plus size={18} /> Ajouter une matière
        </button>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="#0A2F6B" /> Liste des matières
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
                <th>Classe</th>
                <th>Professeur responsable</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Chargement...</td></tr>
              ) : filteredMatieres.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>Aucune matière trouvée.</td></tr>
              ) : (
                filteredMatieres.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{m.nom}</td>
                    <td>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#f1f5f9', fontWeight: 600 }}>
                        {m.coefficient}
                      </span>
                    </td>
                    <td>{m.classe ? <span className="status-badge status-badge--success">{m.classe.nom}</span> : <span className="status-badge status-badge--warning">Non affectée</span>}</td>
                    <td style={{ color: '#475569' }}>{m.professeur ? `${m.professeur.prenom} ${m.professeur.nom}` : 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn action-btn--edit" onClick={() => openModal(m)}><Edit size={16} /></button>
                        <button className="action-btn action-btn--delete" onClick={() => handleDelete(m.id)}><Trash2 size={16} /></button>
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
                      onChange={e => setForm({...form, nom: e.target.value})} 
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
                      onChange={e => setForm({...form, coefficient: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="modal-form-group">
                  <label>Classe *</label>
                  <select 
                    value={form.classeId} 
                    onChange={e => setForm({...form, classeId: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.niveau} — {c.nom}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    Chaque matière doit être affectée à une classe pour le calcul des résultats.
                  </p>
                </div>

                <div className="modal-form-group">
                  <label>Professeur responsable *</label>
                  <select
                    value={form.professeurId}
                    onChange={e => setForm({...form, professeurId: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner un professeur</option>
                    {professeurs.length === 0 ? (
                      <option value="" disabled>Aucun professeur disponible — créez-en un d&apos;abord</option>
                    ) : (
                      professeurs.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.prenom} {p.nom} {p.specialite ? `(${p.specialite})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    Chaque matière doit être liée à un professeur pour la saisie des notes.
                  </p>
                </div>
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
