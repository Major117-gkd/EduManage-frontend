import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, Circle } from 'lucide-react';
import '../admin/AdminDashboard.css';
import './Modal.css';

const API = 'http://localhost:5000';

export default function AcademicYearsPage() {
  const [years, setYears] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ nom: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadYears = () => {
    setLoading(true);
    fetch(`${API}/api/admin/annees`)
      .then(res => res.json())
      .then(data => { setYears(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadYears(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/admin/annees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('' + data.message);
        loadYears();
        setForm({ nom: '' });
        setTimeout(() => { setIsModalOpen(false); setMessage(''); }, 1500);
      } else {
        setMessage('' + data.error);
      }
    } catch {
      setMessage('Erreur de connexion');
    }
  };

  const setActiveYear = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/annees/${id}/active`, { method: 'PUT' });
      if (res.ok) loadYears();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Années Scolaires</h1>
        <button className="btn btn--primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Nouvelle Année
        </button>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="#0A2F6B" /> Liste des années
          </h2>
        </div>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Année Scolaire</th>
                <th>Date de création</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</td></tr>
              ) : years.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Aucune année scolaire trouvée.</td></tr>
              ) : (
                years.map(y => (
                  <tr key={y.id} style={{ background: y.active ? '#eff6ff' : 'transparent' }}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{y.nom}</td>
                    <td>{new Date(y.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {y.active ? (
                        <span className="status-badge status-badge--success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} /> Active
                        </span>
                      ) : (
                        <span className="status-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>Inactivé</span>
                      )}
                    </td>
                    <td>
                      {!y.active && (
                        <button className="btn" style={{ background: 'white', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => setActiveYear(y.id)}>
                          Définir comme active
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nouvelle Année Scolaire</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              {message && <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#d1fae5' : '#fee2e2', color: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>{message}</div>}
              <form onSubmit={handleCreate}>
                <div className="modal-form-group">
                  <label>Année (ex: 2024-2025)</label>
                  <input type="text" value={form.nom} onChange={e => setForm({ nom: e.target.value })} placeholder="Ex: 2024-2025" required />
                </div>
                <div className="modal-footer" style={{ marginTop: '2rem', padding: '0', border: 'none' }}>
                  <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</button>
                  <button type="submit" className="btn-submit">Créer</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


