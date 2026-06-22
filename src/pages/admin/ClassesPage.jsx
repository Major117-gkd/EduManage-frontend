import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Users, Search, BookOpen } from 'lucide-react';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';

import { api } from '../../services/api';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', niveau: '', niveauEtudeId: '', cycle: 'Collège', capacite: 30, montant_annuel: 0, anneeScolaireId: '', tranches: [], matieres: [] });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const cycles = ['Primaire', 'Collège', 'Lycée']; // legacy display in table

  const loadData = () => {
    api.get('/admin/classes').then(d => { if (Array.isArray(d)) setClasses(d); }).catch(() => {});
    api.get('/admin/annees').then(d => { if (Array.isArray(d)) setAnnees(d); }).catch(() => {});
    api.get('/admin/professeurs').then(d => { if (Array.isArray(d)) setProfesseurs(d); }).catch(() => {});
    api.get('/admin/niveaux').then(d => { if (Array.isArray(d)) setNiveaux(d.filter((n) => n.actif !== false)); }).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const defaultMatiere = () => ({ nom: '', coefficient: 1, professeurId: '' });

  const openCreateModal = () => {
    const activeAnnee = annees.find(a => a.active);
    setForm({
      nom: '', niveau: '', niveauEtudeId: '', cycle: 'Collège', capacite: 30, montant_annuel: 0,
      anneeScolaireId: activeAnnee ? activeAnnee.id : '', tranches: [], matieres: [defaultMatiere()],
    });
    setEditingId(null);
    setMessage('');
    setIsModalOpen(true);
  };

  const handleEdit = (c) => {
    setForm({
      nom: c.nom,
      niveau: c.niveau,
      niveauEtudeId: c.niveauEtudeId || c.niveauEtude?.id || '',
      cycle: c.cycle || 'Collège',
      capacite: c.capacite,
      montant_annuel: c.montant_annuel || 0,
      anneeScolaireId: c.anneeScolaireId || '',
      tranches: c.tranches || [],
      matieres: (c.matieres || []).length > 0
        ? (c.matieres || []).map((m) => ({
          id: m.id,
          nom: m.nom,
          coefficient: m.coefficient,
          professeurId: m.professeurId || '',
        }))
        : [defaultMatiere()],
    });
    setEditingId(c.id);
    setMessage('');
    setIsModalOpen(true);
  };

  const addTranche = () => {
    setForm({ ...form, tranches: [...form.tranches, { nom: `Tranche ${form.tranches.length + 1}`, montant: 0, date_limite: '' }] });
  };

  const updateTranche = (index, field, value) => {
    const newTranches = [...form.tranches];
    newTranches[index][field] = value;
    // Auto-calculate total amount
    const total = newTranches.reduce((sum, t) => sum + (parseFloat(t.montant) || 0), 0);
    setForm({ ...form, tranches: newTranches, montant_annuel: total });
  };

  const removeTranche = (index) => {
    const newTranches = form.tranches.filter((_, i) => i !== index);
    const total = newTranches.reduce((sum, t) => sum + (parseFloat(t.montant) || 0), 0);
    setForm({ ...form, tranches: newTranches, montant_annuel: total });
  };

  const addMatiere = () => {
    const hasIncomplete = form.matieres.some((m) => !m.nom?.trim() || !m.professeurId);
    if (hasIncomplete) {
      setMessage('Erreur : complétez la matière en cours (nom + professeur) avant d\'en ajouter une autre.');
      return;
    }
    setForm({
      ...form,
      matieres: [...form.matieres, { nom: '', coefficient: 1, professeurId: '' }],
    });
  };

  const updateMatiere = (index, field, value) => {
    const matieres = [...form.matieres];
    matieres[index] = { ...matieres[index], [field]: value };
    setForm({ ...form, matieres });
  };

  const removeMatiere = (index) => {
    if (form.matieres.length <= 1) {
      setMessage('Erreur : une classe doit avoir au moins une matière.');
      return;
    }
    setForm({ ...form, matieres: form.matieres.filter((_, i) => i !== index) });
  };

  const validateMatieresForm = () => {
    const incomplete = form.matieres.filter((m) => {
      const hasNom = Boolean(m.nom?.trim());
      const hasProf = Boolean(m.professeurId);
      return (hasNom && !hasProf) || (!hasNom && hasProf);
    });
    if (incomplete.length > 0) {
      return 'Chaque ligne de matière doit avoir un nom et un professeur, ou être supprimée.';
    }

    const matieresValides = form.matieres
      .filter((m) => m.nom?.trim())
      .map((m) => ({
        ...m,
        nom: m.nom.trim(),
        coefficient: parseFloat(m.coefficient) || 1,
      }));

    if (matieresValides.length === 0) {
      return 'Ajoutez au moins une matière avec un nom.';
    }

    const sansProf = matieresValides.filter((m) => !m.professeurId);
    if (sansProf.length > 0) {
      return `Assignez un professeur à chaque matière : ${sansProf.map((m) => m.nom).join(', ')}.`;
    }

    return null;
  };

  const handleNiveauChange = (niveauEtudeId) => {
    const selected = niveaux.find((n) => String(n.id) === String(niveauEtudeId));
    if (selected) {
      setForm((prev) => ({
        ...prev,
        niveauEtudeId,
        niveau: selected.nom,
        cycle: selected.cycle,
      }));
    } else {
      setForm((prev) => ({ ...prev, niveauEtudeId: '', niveau: '', cycle: 'Collège' }));
    }
  };

  const confirmDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/admin/classes/${deleteConfirmId}`);
      loadData();
      setDeleteConfirmId(null);
    } catch (err) {
      alert('' + (err.data?.error || err.message || 'Erreur lors de la suppression'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    const matieresError = validateMatieresForm();
    if (matieresError) {
      setMessage(`Erreur : ${matieresError}`);
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...form,
        capacite: parseInt(form.capacite),
        matieres: form.matieres
          .filter((m) => m.nom?.trim())
          .map((m) => ({
            ...m,
            nom: m.nom.trim(),
            coefficient: parseFloat(m.coefficient) || 1,
            professeurId: m.professeurId ? parseInt(m.professeurId, 10) : null,
          })),
      };
      if (editingId) {
        await api.put(`/admin/classes/${editingId}`, payload);
      } else {
        await api.post('/admin/classes', payload);
      }
      setMessage(editingId ? 'Classe modifiée avec succès' : 'Classe créée avec succès');
      loadData();
      setTimeout(() => { setIsModalOpen(false); setMessage(''); }, 1500);
    } catch (err) {
      setMessage('' + (err.data?.error || err.message || 'Impossible de contacter le serveur'));
    }
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
                <th>Matières</th>
                <th>Année Scolaire</th>
                <th>Capacité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>Aucune classe trouvée.</td>
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
                    <span className="status-badge" style={{ background: '#e0e7ff', color: '#3730a3', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <BookOpen size={12} />
                      {c.matieres?.length || 0} matière(s)
                    </span>
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
          <div className="modal-content" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
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
                    <label>Niveau d&apos;étude *</label>
                    <select
                      value={form.niveauEtudeId}
                      onChange={(e) => handleNiveauChange(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner un niveau</option>
                      {niveaux.map((n) => (
                        <option key={n.id} value={n.id}>{n.cycle} — {n.nom}</option>
                      ))}
                    </select>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                      Les règles de calcul des moyennes sont définies dans{' '}
                      <a href="/admin/niveaux" style={{ color: '#0A2F6B' }}>Niveaux d&apos;étude</a>.
                    </p>
                  </div>
                  <div className="modal-form-group">
                    <label>Cycle</label>
                    <input type="text" value={form.cycle} readOnly style={{ background: '#f1f5f9', color: '#64748b' }} />
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
                </div>
                
                <hr style={{ margin: '1.5rem 0', borderColor: '#e2e8f0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#0f172a', margin: 0 }}>Configuration des Tranches</h3>
                  <button type="button" onClick={addTranche} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', color: '#0A2F6B', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Plus size={14} /> Ajouter une tranche
                  </button>
                </div>
                
                {form.tranches.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                    Aucune tranche configurée. Le paiement se fera globalement ou mensuellement.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {form.tranches.map((t, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>Nom</label>
                          <input type="text" value={t.nom} onChange={e => updateTranche(i, 'nom', e.target.value)} placeholder="Ex: Tranche 1" style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} required />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>Montant (GNF)</label>
                          <input type="number" value={t.montant} onChange={e => updateTranche(i, 'montant', e.target.value)} min="0" style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} required />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>Date limite (opt.)</label>
                          <input type="date" value={t.date_limite ? new Date(t.date_limite).toISOString().split('T')[0] : ''} onChange={e => updateTranche(i, 'date_limite', e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                        </div>
                        <button type="button" onClick={() => removeTranche(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', marginTop: '1.2rem' }} title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <hr style={{ margin: '1.5rem 0', borderColor: '#e2e8f0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BookOpen size={18} color="#0A2F6B" />
                      Matières de la classe
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.35rem 0 0' }}>
                      Les résultats de chaque élève seront calculés sur ces matières.
                    </p>
                  </div>
                  <button type="button" onClick={addMatiere} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', color: '#0A2F6B', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Plus size={14} /> Ajouter une matière
                  </button>
                </div>

                {form.matieres.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: '#fffbeb', borderRadius: '8px', color: '#92400e', fontSize: '0.9rem', border: '1px solid #fde68a' }}>
                    Aucune matière affectée. Au moins une matière avec un professeur est obligatoire.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {form.matieres.map((m, i) => (
                      <div key={m.id || `new-${i}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ flex: 2 }}>
                          <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>Matière *</label>
                          <input type="text" value={m.nom} onChange={e => updateMatiere(i, 'nom', e.target.value)} placeholder="Ex: Mathématiques" style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} required />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>Coeff.</label>
                          <input type="number" min="0.5" max="10" step="0.5" value={m.coefficient} onChange={e => updateMatiere(i, 'coefficient', e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} required />
                        </div>
                        <div style={{ flex: 2 }}>
                          <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>Professeur *</label>
                          <select
                            value={m.professeurId}
                            onChange={e => updateMatiere(i, 'professeurId', e.target.value)}
                            style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}
                            required
                          >
                            <option value="">Sélectionner un professeur</option>
                            {professeurs.map(p => (
                              <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMatiere(i)}
                          disabled={form.matieres.length <= 1}
                          style={{ background: 'none', border: 'none', color: form.matieres.length <= 1 ? '#cbd5e1' : '#ef4444', cursor: form.matieres.length <= 1 ? 'not-allowed' : 'pointer', padding: '0.4rem', marginTop: '1.2rem' }}
                          title={form.matieres.length <= 1 ? 'Au moins une matière requise' : 'Supprimer'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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


