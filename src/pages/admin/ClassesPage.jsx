import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Users, Search } from 'lucide-react';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';

const API = 'http://localhost:5000';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', niveau: '', cycle: 'Collège', capacite: 30, montant_annuel: 0, anneeScolaireId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const cycles = ['Primaire', 'Collège', 'Lycée'];

  const loadData = () => {
    fetch(`${API}/api/admin/classes`).then(r => r.json()).then(d => { if (Array.isArray(d)) setClasses(d); }).catch(() => {});
    fetch(`${API}/api/admin/annees`).then(r => r.json()).then(d => { if (Array.isArray(d)) setAnnees(d); }).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const openCreateModal = () => {
    // Try to auto-select the active year if one exists
    const activeAnnee = annees.find(a => a.active);
    setForm({ nom: '', niveau: '', cycle: 'Collège', capacite: 30, montant_annuel: 0, anneeScolaireId: activeAnnee ? activeAnnee.id : '' });
    setEditingId(null);
    setMessage('');
    setIsModalOpen(true);
  };

  const handleEdit = (c) => {
    setForm({ nom: c.nom, niveau: c.niveau, cycle: c.cycle || 'Collège', capacite: c.capacite, montant_annuel: c.montant_annuel || 0, anneeScolaireId: c.anneeScolaireId || '' });
    setEditingId(c.id);
    setMessage('');
    setIsModalOpen(true);
  };

  const confirmDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`${API}/api/admin/classes/${deleteConfirmId}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
        setDeleteConfirmId(null);
      } else {
        const data = await res.json();
        alert('' + (data.error || 'Erreur lors de la suppression'));
      }
    } catch {
      alert("Impossible de contacter le serveur");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setMessage('');
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API}/api/admin/classes/${editingId}` : `${API}/api/admin/classes`;
      
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, capacite: parseInt(form.capacite) }) });
      const data = await res.json();
      if (res.ok) { 
        setMessage(editingId ? 'Classe modifiée avec succès' : 'Classe créée avec succès'); 
        loadData(); 
        setTimeout(() => { setIsModalOpen(false); setMessage(''); }, 1500); 
      }
      else setMessage('' + (data.error || 'Erreur'));
    } catch { setMessage('Impossible de contacter le serveur'); }
    setSubmitting(false);
  };

  const levelColor = { 'Maternelle': '#f59e0b', 'Primaire': '#10b981', 'Collège': '#3b82f6', 'Lycée': '#8b5cf6' };

  const filteredClasses = classes.filter(c =>
    c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.niveau.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cycle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Gestion des Classes</h1>
        <button className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={openCreateModal}>
          <Plus size={18} /> Créer une classe
        </button>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="#0A2F6B" /> Liste des classes
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
                <th>Nom de la classe</th>
                <th>Niveau</th>
                <th>Cycle</th>
                <th>Montant Annuel</th>
                <th>Année Scolaire</th>
                <th>Capacité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>Aucune classe trouvée.</td>
                </tr>
              ) : filteredClasses.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.nom}</td>
                  <td>{c.niveau}</td>
                  <td>
                    <span className="status-badge" style={{ background: `${levelColor[c.cycle] || '#0A2F6B'}15`, color: levelColor[c.cycle] || '#0A2F6B' }}>
                      {c.cycle}
                    </span>
                  </td>
                  <td>
                    <strong>{c.montant_annuel ? c.montant_annuel.toLocaleString() + ' GNF' : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Non défini</span>}</strong>
                  </td>
                  <td>
                    {c.anneeScolaire ? <span className="status-badge status-badge--success">{c.anneeScolaire.nom}</span> : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Non définie</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b' }}>
                      <Users size={14} />
                      <strong>{c.capacite}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn action-btn--edit" title="Modifier" onClick={() => handleEdit(c)}><Edit size={16} /></button>
                      <button className="action-btn action-btn--delete" title="Supprimer" onClick={() => confirmDelete(c.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Modifier la Classe' : 'Créer une Classe'}</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {message && <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#d1fae5' : '#fee2e2', color: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>{message}</div>}
              <form id="classeForm" onSubmit={handleSubmit}>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Nom de la classe</label><input type="text" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Ex: 6ème A" required /></div>
                  <div className="modal-form-group"><label>Capacité (élèves)</label><input type="number" value={form.capacite} onChange={e => setForm({...form, capacite: e.target.value})} min="1" max="100" /></div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Niveau</label>
                    <input type="text" value={form.niveau} onChange={e => setForm({...form, niveau: e.target.value})} placeholder="Ex: 6ème, Terminale" required />
                  </div>
                  <div className="modal-form-group">
                    <label>Cycle</label>
                    <select value={form.cycle} onChange={e => setForm({...form, cycle: e.target.value})} required>
                      {cycles.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Montant Annuel (GNF)</label>
                    <input type="number" value={form.montant_annuel} onChange={e => setForm({...form, montant_annuel: e.target.value})} min="0" placeholder="Ex: 900000" />
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Pour 9 mois de scolarité (sept. à mai)</p>
                  </div>
                  <div className="modal-form-group">
                    <label>Année Scolaire</label>
                    <select value={form.anneeScolaireId} onChange={e => setForm({...form, anneeScolaireId: e.target.value})} required>
                      <option value="">Sélectionnez une année</option>
                      {annees.map(a => <option key={a.id} value={a.id}>{a.nom} {a.active && '(Active)'}</option>)}
                    </select>
                  </div>
                  <div className="modal-form-group"></div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button type="submit" form="classeForm" className="btn-submit" disabled={submitting}>{submitting ? 'Enregistrement...' : (editingId ? 'Modifier' : 'Créer')}</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '2rem 1.5rem 1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Trash2 size={24} />
              </div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#0f172a' }}>Confirmer la suppression</h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Êtes-vous sûr de vouloir supprimer cette classe ? Cette action est irréversible.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>Annuler</button>
                <button className="btn-submit" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={handleDelete}>Oui, supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


