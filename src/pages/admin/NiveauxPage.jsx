import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, X, Layers, Info } from 'lucide-react';
import { api } from '../../services/api';
import {
  CYCLES,
  normalizeRegle,
  buildFormulaText,
  computeExampleMoyenneMatiere,
  emptyNiveauForm,
} from '../../utils/gradeRules';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';
import './NiveauxPage.css';

function cycleBadgeClass(cycle) {
  if (cycle === 'Primaire') return 'niveau-cycle--primaire';
  if (cycle === 'Lycée') return 'niveau-cycle--lycee';
  return 'niveau-cycle--college';
}

export default function NiveauxPage() {
  const [niveaux, setNiveaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyNiveauForm());
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [filterCycle, setFilterCycle] = useState('');

  const loadData = () => {
    api.get('/admin/niveaux')
      .then((data) => { if (Array.isArray(data)) setNiveaux(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(
    () => (filterCycle ? niveaux.filter((n) => n.cycle === filterCycle) : niveaux),
    [niveaux, filterCycle]
  );

  const sorted = useMemo(() => {
    const cycleOrder = { Primaire: 0, Collège: 1, Lycée: 2 };
    return [...filtered].sort((a, b) => {
      const cycleDiff = (cycleOrder[a.cycle] ?? 9) - (cycleOrder[b.cycle] ?? 9);
      if (cycleDiff !== 0) return cycleDiff;
      return (a.ordre ?? 0) - (b.ordre ?? 0) || a.nom.localeCompare(b.nom, 'fr');
    });
  }, [filtered]);

  const preview = useMemo(() => {
    const formules = buildFormulaText(form.regleCalcul);
    const example = computeExampleMoyenneMatiere(form.regleCalcul, form.exampleNotes);
    return { formules, example };
  }, [form.regleCalcul, form.exampleNotes]);

  const openCreate = () => {
    setForm(emptyNiveauForm());
    setEditingId(null);
    setMessage('');
    setIsModalOpen(true);
  };

  const openEdit = (n) => {
    const regle = normalizeRegle(n.regleCalcul);
    setForm({
      nom: n.nom,
      cycle: n.cycle,
      ordre: n.ordre ?? 0,
      actif: n.actif !== false,
      description: n.description || '',
      regleCalcul: regle,
      exampleNotes: Object.fromEntries(
        regle.evaluations.map((ev, i) => [
          ev.type,
          [12, 14, 16][i] ?? 12,
        ])
      ),
    });
    setEditingId(n.id);
    setMessage('');
    setIsModalOpen(true);
  };

  const updateEvaluation = (index, field, value) => {
    const evaluations = [...form.regleCalcul.evaluations];
    evaluations[index] = { ...evaluations[index], [field]: value };
    if (field === 'label' && !evaluations[index].type) {
      evaluations[index].type = value;
    }
    setForm({
      ...form,
      regleCalcul: { ...form.regleCalcul, evaluations },
    });
  };

  const addEvaluation = () => {
    const idx = form.regleCalcul.evaluations.length + 1;
    setForm({
      ...form,
      regleCalcul: {
        ...form.regleCalcul,
        evaluations: [
          ...form.regleCalcul.evaluations,
          { type: `Évaluation ${idx}`, label: `Évaluation ${idx}`, poids: 1 },
        ],
      },
    });
  };

  const removeEvaluation = (index) => {
    if (form.regleCalcul.evaluations.length <= 1) return;
    setForm({
      ...form,
      regleCalcul: {
        ...form.regleCalcul,
        evaluations: form.regleCalcul.evaluations.filter((_, i) => i !== index),
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const payload = {
        nom: form.nom,
        cycle: form.cycle,
        ordre: parseInt(form.ordre, 10) || 0,
        actif: form.actif,
        description: form.description,
        regleCalcul: normalizeRegle(form.regleCalcul),
      };
      if (editingId) {
        await api.put(`/admin/niveaux/${editingId}`, payload);
      } else {
        await api.post('/admin/niveaux', payload);
      }
      loadData();
      setIsModalOpen(false);
    } catch (err) {
      setMessage(err.data?.error || err.message || 'Erreur.');
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/niveaux/${deleteId}`);
      loadData();
      setDeleteId(null);
    } catch (err) {
      alert(err.data?.error || err.message || 'Erreur.');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <p className="niveaux-page__loading">Chargement des niveaux…</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard niveaux-page">
      <div className="admin-dashboard__header">
        <div>
          <h1 className="admin-title">Niveaux d&apos;étude</h1>
          <p className="niveaux-page__subtitle">
            Définissez les niveaux scolaires et les règles de calcul des moyennes par matière et générale.
          </p>
        </div>
        <button type="button" className="btn btn--primary niveaux-page__add" onClick={openCreate}>
          <Plus size={18} />
          Ajouter un niveau
        </button>
      </div>

      <div className="niveaux-info-banner">
        <Info size={18} />
        <div>
          <strong>Comment ça fonctionne</strong>
          <p>
            Chaque classe est rattachée à un niveau. Les notes saisies (devoirs, compositions…) sont pondérées
            pour obtenir la <em>moyenne par matière</em>, puis les coefficients des matières servent à calculer la{' '}
            <em>moyenne générale</em> et le classement.
          </p>
        </div>
      </div>

      <div className="niveaux-filters">
        <button
          type="button"
          className={`niveaux-filter-chip${!filterCycle ? ' is-active' : ''}`}
          onClick={() => setFilterCycle('')}
        >
          Tous
        </button>
        {CYCLES.map((c) => (
          <button
            key={c}
            type="button"
            className={`niveaux-filter-chip${filterCycle === c ? ' is-active' : ''}`}
            onClick={() => setFilterCycle(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="admin-panel niveaux-table-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">
            <Layers size={18} style={{ verticalAlign: '-3px', marginRight: '0.4rem' }} />
            Liste des niveaux
            <span className="niveaux-table-count">{sorted.length}</span>
          </h2>
        </div>
        <div className="table-responsive">
          <table className="admin-table niveaux-table">
            <thead>
              <tr>
                <th>Ordre</th>
                <th>Niveau</th>
                <th>Cycle</th>
                <th>Pondérations</th>
                <th>Formule moyenne matière</th>
                <th>Seuil</th>
                <th>Classes</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="9" className="niveaux-table-empty">
                    Aucun niveau trouvé{filterCycle ? ` pour le cycle « ${filterCycle} »` : ''}.
                  </td>
                </tr>
              ) : (
                sorted.map((n) => {
                  const formules = n.formules || buildFormulaText(n.regleCalcul);
                  const example = computeExampleMoyenneMatiere(n.regleCalcul, {
                    'Devoir 1': 12,
                    'Devoir 2': 14,
                    Composition: 16,
                  });
                  const classCount = n._count?.classes ?? 0;
                  return (
                    <tr key={n.id} className={n.actif === false ? 'niveaux-table-row--inactive' : ''}>
                      <td className="niveaux-table__ordre">{n.ordre ?? 0}</td>
                      <td>
                        <span className="niveaux-table__nom">{n.nom}</span>
                        {n.description && (
                          <span className="niveaux-table__desc" title={n.description}>
                            {n.description}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`niveau-cycle ${cycleBadgeClass(n.cycle)}`}>{n.cycle}</span>
                      </td>
                      <td>
                        <div className="niveaux-table__weights">
                          {formules.evaluations.map((ev) => (
                            <span key={ev.type} className="niveau-weight-tag">
                              {ev.label} <strong>×{ev.poids}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <code className="niveaux-table__formula">{formules.moyenneMatiere}</code>
                        {example.moyenne !== null && (
                          <span className="niveaux-table__example">
                            ex. → {example.moyenne.toFixed(2)}/20
                          </span>
                        )}
                      </td>
                      <td>
                        <strong>{formules.seuilReussite}</strong>/20
                      </td>
                      <td className="niveaux-table__classes">{classCount}</td>
                      <td>
                        {n.actif !== false ? (
                          <span className="status-badge status-badge--success">Actif</span>
                        ) : (
                          <span className="status-badge status-badge--error">Inactif</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="action-btn action-btn--edit"
                            title="Modifier"
                            onClick={() => openEdit(n)}
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            type="button"
                            className="action-btn action-btn--delete"
                            title={classCount > 0 ? 'Des classes utilisent ce niveau' : 'Supprimer'}
                            onClick={() => setDeleteId(n.id)}
                            disabled={classCount > 0}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="modal-content niveaux-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Modifier le niveau' : 'Nouveau niveau d\'étude'}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form id="niveauForm" className="modal-body" onSubmit={handleSubmit}>
              {message && <p className="niveaux-form-error">{message}</p>}

              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label>Nom du niveau *</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex. 6ème, CM2, Terminale"
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label>Cycle *</label>
                  <select value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })} required>
                    {CYCLES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label>Ordre d&apos;affichage</label>
                  <input
                    type="number"
                    min="0"
                    value={form.ordre}
                    onChange={(e) => setForm({ ...form, ordre: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Seuil de réussite (/20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={form.regleCalcul.seuilReussite}
                    onChange={(e) => setForm({
                      ...form,
                      regleCalcul: { ...form.regleCalcul, seuilReussite: parseFloat(e.target.value) || 10 },
                    })}
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label>Description (optionnelle)</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Informations affichées aux administrateurs…"
                />
              </div>

              <div className="niveaux-eval-section">
                <div className="niveaux-eval-section__head">
                  <h3>Pondération des évaluations</h3>
                  <button type="button" className="niveaux-eval-add" onClick={addEvaluation}>
                    <Plus size={14} /> Ajouter
                  </button>
                </div>
                <p className="niveaux-eval-hint">
                  Ces types doivent correspondre aux notes saisies (Devoir 1, Devoir 2, Composition…).
                </p>
                {form.regleCalcul.evaluations.map((ev, index) => (
                  <div key={index} className="niveaux-eval-row">
                    <input
                      type="text"
                      value={ev.label}
                      onChange={(e) => {
                        const evaluations = [...form.regleCalcul.evaluations];
                        evaluations[index] = {
                          ...evaluations[index],
                          label: e.target.value,
                          type: e.target.value,
                        };
                        setForm({ ...form, regleCalcul: { ...form.regleCalcul, evaluations } });
                      }}
                      placeholder="Libellé"
                      required
                    />
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={ev.poids}
                      onChange={(e) => updateEvaluation(index, 'poids', parseFloat(e.target.value) || 1)}
                      title="Poids"
                    />
                    <button
                      type="button"
                      className="niveaux-eval-remove"
                      onClick={() => removeEvaluation(index)}
                      disabled={form.regleCalcul.evaluations.length <= 1}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="niveaux-preview-box">
                <h4>Aperçu du calcul</h4>
                <p><strong>Moyenne matière :</strong> <code>{preview.formules.moyenneMatiere}</code></p>
                <p><strong>Moyenne générale :</strong> <code>{preview.formules.moyenneGenerale}</code></p>
                {preview.example.steps.length > 0 && (
                  <p className="niveaux-preview-example">
                    Simulation :{' '}
                    {preview.example.steps.map((s) => `${s.label} ${s.value}×${s.poids}`).join(' + ')}
                    {' '}= {preview.example.sum} ÷ {preview.example.weight} →{' '}
                    <strong>{preview.example.moyenne?.toFixed(2)}</strong>
                  </p>
                )}
              </div>

              <label className="niveaux-checkbox">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                />
                Niveau actif (sélectionnable lors de la création de classes)
              </label>
            </form>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button type="submit" form="niveauForm" className="btn-submit" disabled={submitting}>
                {submitting ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Créer le niveau'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.2rem' }}>Supprimer ce niveau ?</h2>
            <p style={{ color: '#64748b', margin: '0 0 1.25rem' }}>
              Cette action est irréversible. Les classes liées doivent d&apos;abord être réaffectées.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn-cancel" style={{ flex: 1 }} onClick={() => setDeleteId(null)}>
                Annuler
              </button>
              <button type="button" className="btn-submit" style={{ flex: 1, background: '#dc2626' }} onClick={handleDelete}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
