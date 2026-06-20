import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Eye, Edit, Trash2, X, Mail } from 'lucide-react';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';

const API = 'http://localhost:5000';

export default function TeachersPage() {
  const [professeurs, setProfesseurs] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', specialite: '', contact: '', matieresIds: [] });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = () => {
    fetch(`${API}/api/admin/professeurs`).then(r => r.json()).then(d => { if (Array.isArray(d)) setProfesseurs(d); }).catch(() => {});
    fetch(`${API}/api/admin/matieres`).then(r => r.json()).then(d => { if (Array.isArray(d)) setMatieres(d); }).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setMessage('');
    try {
      if (editingId) {
        // Edit existing teacher's subjects
        const res = await fetch(`${API}/api/admin/professeurs/${editingId}/affectations`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matieresIds: form.matieresIds }) });
        const data = await res.json();
        if (res.ok) { setMessage('Affectations mises à jour.'); loadData(); setTimeout(() => { closeModal(); }, 2000); }
        else setMessage('' + (data.error || 'Erreur'));
      } else {
        const res = await fetch(`${API}/api/admin/professeurs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const data = await res.json();
        if (res.ok) {
          const pwdInfo = data.motDePasseTemporaire ? ` Mot de passe : ${data.motDePasseTemporaire}` : '';
          setMessage(`Professeur et compte créés (${data.utilisateur?.email || form.email}).${pwdInfo}`);
          loadData();
          setTimeout(() => { closeModal(); }, 2500);
        }
        else setMessage('' + (data.error || 'Erreur'));
      }
    } catch { setMessage('Impossible de contacter le serveur'); }
    setSubmitting(false);
  };

  const openModal = (prof = null) => {
    if (prof) {
      setEditingId(prof.id);
      setForm({
        nom: prof.nom, prenom: prof.prenom, email: prof.utilisateur?.email || '', specialite: prof.specialite || '', contact: prof.contact || '',
        matieresIds: prof.matieres ? prof.matieres.map(m => m.id) : []
      });
    } else {
      setEditingId(null);
      setForm({ nom: '', prenom: '', email: '', specialite: '', contact: '', matieresIds: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setMessage('');
    setForm({ nom: '', prenom: '', email: '', specialite: '', contact: '', matieresIds: [] });
    setEditingId(null);
  };

  const handleMatiereToggle = (id) => {
    setForm(prev => {
      const isSelected = prev.matieresIds.includes(id);
      if (isSelected) {
        return { ...prev, matieresIds: prev.matieresIds.filter(mId => mId !== id) };
      } else {
        return { ...prev, matieresIds: [...prev.matieresIds, id] };
      }
    });
  };

  const filtered = professeurs.filter(p => `${p.prenom} ${p.nom} ${p.specialite}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Gestion des Professeurs</h1>
        <button className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => openModal()}>
          <UserPlus size={18} /> Ajouter un professeur
        </button>
      </div>

      <div style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Search size={18} color="#94a3b8" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou spécialité..." style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#0f172a', backgroundColor: 'transparent' }} />
      </div>

      <div className="admin-panel">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr><th>Nom Complet</th><th>Spécialité</th><th>Contact</th><th>Compte utilisateur</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>Aucun professeur enregistré.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.prenom} {p.nom}</td>
                  <td>{p.specialite || '—'}</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b' }}>
                    <Mail size={14} />
                    {p.contact || '—'}
                  </td>
                  <td>
                    {p.utilisateur ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}>
                          {p.utilisateur.email}
                        </span>
                        <span className="status-badge status-badge--success">PROFESSEUR</span>
                      </div>
                    ) : (
                      <span className="status-badge status-badge--warning">Sans compte</span>
                    )}
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="action-btn action-btn--edit" title="Gérer les affectations / Modifier" onClick={() => openModal(p)}><Edit size={16} /></button>
                    <button className="action-btn action-btn--delete" title="Supprimer"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Modifier les Affectations' : 'Ajouter un Professeur'}</h2>
              <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {message && <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#d1fae5' : '#fee2e2', color: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>{message}</div>}
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                Un compte utilisateur <strong>PROFESSEUR</strong> sera créé avec l&apos;email saisi
                (nom complet : Prénom + Nom). Mot de passe par défaut : <strong>Prof2024</strong>
              </p>
              <form id="teacherForm" onSubmit={handleSubmit}>
                {/* General Info (only for creation currently, backend route is missing full PUT, so disable for edit) */}
                {!editingId && (
                  <>
                    <div className="modal-form-row">
                      <div className="modal-form-group"><label>Prénom</label><input type="text" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} required /></div>
                      <div className="modal-form-group"><label>Nom</label><input type="text" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required /></div>
                    </div>
                    <div className="modal-form-group"><label>Adresse e-mail (identifiant de connexion)</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
                    <div className="modal-form-row">
                      <div className="modal-form-group"><label>Spécialité</label><input type="text" value={form.specialite} onChange={e => setForm({...form, specialite: e.target.value})} placeholder="Ex: Mathématiques" /></div>
                      <div className="modal-form-group"><label>Téléphone</label><input type="text" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} placeholder="Ex: +224 620 000 000" /></div>
                    </div>
                  </>
                )}

                {/* Subjects Assignment */}
                <div className="modal-form-group" style={{ marginTop: '1.5rem' }}>
                  <label style={{ fontSize: '1rem', color: '#0A2F6B', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Affectation des Cours (Niveau ➔ Classe ➔ Matière)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                    {matieres.length === 0 ? (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>Aucune matière disponible. Créez-en d'abord.</span>
                    ) : (
                      matieres.map(m => (
                        <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={form.matieresIds.includes(m.id)} 
                            onChange={() => handleMatiereToggle(m.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{m.nom}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {m.classe ? `${m.classe.niveau} - ${m.classe.nom}` : 'Matière globale'}
                            </span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Annuler</button>
              <button type="submit" form="teacherForm" className="btn-submit" disabled={submitting}>{submitting ? 'Enregistrement...' : (editingId ? 'Mettre à jour' : 'Créer le compte')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


