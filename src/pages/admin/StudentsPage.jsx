import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserPlus, Search, Eye, Edit, X, RotateCw, Check, Printer, CreditCard, Save, UserX, Filter, RotateCcw } from 'lucide-react';
import StudentCard from '../../components/StudentCard/StudentCard';
import { PrintHeader, PrintMeta } from '../../components/PrintLayout/PrintLayout';
import { formatPrintDate } from '../../utils/printConstants';
import { printDocument } from '../../utils/printDocument';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';
import './StudentsPage.css';

import { api } from '../../services/api';

const ELEVE_STATUTS = [
  { value: 'Actif', label: 'Actif (inscrit)' },
  { value: 'Abandon', label: 'Abandon' },
  { value: 'Transféré', label: 'Transféré' },
  { value: 'Exclu', label: 'Exclu' },
];

const INSCRIPTION_STATUTS = ['En attente', 'Validé', 'Rejeté'];

const FINANCIER_STATUTS = ['À jour', 'En retard', 'À jour partiel', 'En attente'];

const EMPTY_FILTERS = {
  statut: '',
  classeId: '',
  niveau: '',
  anneeScolaire: '',
  inscriptionStatut: '',
  statutFinancier: '',
};

function getFinancierBadgeClass(statut) {
  if (statut === 'À jour') return 'students-fin-badge--ok';
  if (statut === 'À jour partiel' || statut === 'En attente') return 'students-fin-badge--warn';
  if (statut === 'En retard') return 'students-fin-badge--bad';
  return 'students-fin-badge--neutral';
}

function getLatestInscription(eleve, anneeScolaire) {
  const list = eleve.inscriptions || [];
  if (!list.length) return null;
  if (anneeScolaire) {
    return list.find((i) => i.annee_scolaire === anneeScolaire) || list[0];
  }
  return list[0];
}

const ABANDON_MOTIFS = [
  'Départ de l\'élève',
  'Déménagement familial',
  'Manque de moyens',
  'Transfert vers autre établissement',
  'Raison médicale',
  'Autre',
];

function normalizeStatut(statut) {
  return statut === 'Inactif' ? 'Abandon' : (statut || 'Actif');
}

function isEleveActif(statut) {
  return normalizeStatut(statut) === 'Actif';
}

function getStatutBadgeClass(statut) {
  const s = normalizeStatut(statut);
  if (s === 'Actif') return 'success';
  if (s === 'Abandon') return 'error';
  if (s === 'Transféré') return 'warning';
  if (s === 'Exclu') return 'error';
  return 'warning';
}

function todayInputValue() {
  return new Date().toISOString().substring(0, 10);
}

export default function StudentsPage() {
  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [activeYear, setActiveYear] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [expandedRows, setExpandedRows] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGlobalReInscriptionOpen, setIsGlobalReInscriptionOpen] = useState(false);
  const [selectedCardStudent, setSelectedCardStudent] = useState(null);
  const [reInscrireEleve, setReInscrireEleve] = useState(null);
  const [validateConfirmId, setValidateConfirmId] = useState(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null);
  const [abandonForm, setAbandonForm] = useState({ motif_abandon: '', date_abandon: todayInputValue() });
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  // View / Edit states
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  const [form, setForm] = useState({ prenom: '', nom: '', date_naissance: '', adresse: '', parent_nom: '', filiation: '', parent_telephone: '', parent_email: '', infos_importantes: '', classeId: '', annee_scolaire: '', matricule: '', photoUrl: '', exception_paiement_mensuel: false });
  const [reForm, setReForm] = useState({ classeId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);
    setLoadError('');
    const params = new URLSearchParams();
    const needsInactive = Boolean(filters.statut && filters.statut !== 'Actif');
    const showAll = showInactive || needsInactive;
    if (showAll) params.set('show_inactive', 'true');
    if (filters.statut) params.set('statut', filters.statut);
    if (filters.statutFinancier) params.set('statut_financier', filters.statutFinancier);
    if (filters.classeId) params.set('classe_id', filters.classeId);
    if (filters.niveau) params.set('niveau', filters.niveau);
    if (filters.anneeScolaire) params.set('annee_scolaire', filters.anneeScolaire);
    if (filters.inscriptionStatut) params.set('inscription_statut', filters.inscriptionStatut);

    api.get(`/admin/eleves?${params}`)
      .then((d) => { if (Array.isArray(d)) setEleves(d); })
      .catch((err) => {
        setEleves([]);
        setLoadError(err.data?.error || err.message || 'Impossible de charger les élèves.');
      })
      .finally(() => setLoading(false));

    api.get('/admin/classes').then((d) => { if (Array.isArray(d)) setClasses(d); }).catch(() => {});
    api.get('/admin/annees').then((d) => {
      if (Array.isArray(d)) {
        setAnnees(d);
        const active = d.find((y) => y.active);
        if (active) {
          setActiveYear(active.nom);
          setForm((f) => ({ ...f, annee_scolaire: active.nom }));
        }
      }
    }).catch(() => {});
  }, [showInactive, filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const niveaux = useMemo(
    () => [...new Set(classes.map((c) => c.niveau).filter(Boolean))].sort(),
    [classes]
  );

  const classesFiltrees = useMemo(
    () => (filters.niveau ? classes.filter((c) => c.niveau === filters.niveau) : classes),
    [classes, filters.niveau]
  );

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(Boolean) || search.trim() || showInactive,
    [filters, search, showInactive]
  );

  const resetFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
    setShowInactive(false);
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'niveau' && value && prev.classeId) {
        const cls = classes.find((c) => String(c.id) === String(prev.classeId));
        if (cls && cls.niveau !== value) next.classeId = '';
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return eleves;
    const q = search.trim().toLowerCase();
    return eleves.filter((e) => {
      const haystack = [
        e.prenom,
        e.nom,
        e.matricule,
        e.parent_nom,
        e.parent_telephone,
        e.parent_email,
        e.adresse,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [eleves, search]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setMessage('');
    try {
      const data = await api.post('/admin/eleves', form);
      setMessage('' + data.message); loadData(); setForm({ prenom: '', nom: '', date_naissance: '', adresse: '', parent_nom: '', filiation: '', parent_telephone: '', parent_email: '', infos_importantes: '', classeId: '', annee_scolaire: activeYear, exception_paiement_mensuel: false }); setTimeout(() => { setIsModalOpen(false); setMessage(''); }, 1500);
    } catch (err) { setMessage('' + (err.data?.error || err.message || 'Erreur')); }
    setSubmitting(false);
  };

  const handleReInscription = async (e) => {
    e.preventDefault(); setSubmitting(true); setMessage('');
    try {
      const data = await api.post(`/admin/eleves/${reInscrireEleve.id}/reinscription`, {
        classeId: reForm.classeId,
        annee_scolaire: activeYear,
      });
      setMessage('' + data.message);
      loadData();
      setTimeout(() => { setReInscrireEleve(null); setMessage(''); }, 1500);
    } catch (err) {
      if (err.status === 403 && err.data?.error === 'Dette non soldée') {
        setMessage('⚠️ ' + err.data.message);
      } else {
        setMessage('' + (err.data?.error || err.message || 'Erreur'));
      }
    }
    setSubmitting(false);
  };

  const openEdit = (el) => {
    setEditingStudent(el);
    setEditForm({
      prenom: el.prenom || '',
      nom: el.nom || '',
      date_naissance: el.date_naissance ? el.date_naissance.substring(0, 10) : '',
      adresse: el.adresse || '',
      parent_nom: el.parent_nom || '',
      filiation: el.filiation || '',
      parent_telephone: el.parent_telephone || '',
      parent_email: el.parent_email || '',
      infos_importantes: el.infos_importantes || '',
      photoUrl: el.photoUrl || '',
      exception_paiement_mensuel: el.exception_paiement_mensuel || false,
      statut: normalizeStatut(el.statut),
      motif_abandon: el.motif_abandon || '',
      date_abandon: el.date_abandon ? el.date_abandon.substring(0, 10) : todayInputValue(),
    });
    setEditMessage('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditMessage('');
    try {
      await api.put(`/admin/eleves/${editingStudent.id}`, editForm);
      setEditMessage('✅ Modifications enregistrées avec succès !');
      loadData();
      setTimeout(() => { setEditingStudent(null); setEditMessage(''); }, 1500);
    } catch (err) {
      setEditMessage('❌ ' + (err.data?.error || err.message || 'Erreur'));
    }
    setEditSubmitting(false);
  };

  const toggleRow = (id) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter(rowId => rowId !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };

  const handleValidate = async () => {
    if (!validateConfirmId) return;
    try {
      await api.put(`/admin/inscriptions/${validateConfirmId}/valider`);
      loadData();
      setValidateConfirmId(null);
    } catch {
      alert("Erreur réseau");
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteConfirmStudent) return;
    setStatusSubmitting(true);
    try {
      await api.put(`/admin/eleves/${deleteConfirmStudent.id}/statut`, {
        statut: 'Abandon',
        motif_abandon: abandonForm.motif_abandon,
        date_abandon: abandonForm.date_abandon,
      });
      loadData();
      setDeleteConfirmStudent(null);
      setAbandonForm({ motif_abandon: '', date_abandon: todayInputValue() });
    } catch (err) {
      alert(err.data?.error || err.message || 'Impossible de contacter le serveur');
    }
    setStatusSubmitting(false);
  };

  const openAbandonModal = (el) => {
    setAbandonForm({
      motif_abandon: el.motif_abandon || '',
      date_abandon: el.date_abandon ? el.date_abandon.substring(0, 10) : todayInputValue(),
    });
    setDeleteConfirmStudent(el);
  };

  const handleReactivateStudent = async (el) => {
    if (!window.confirm(`Réactiver ${el.prenom} ${el.nom} ? L'élève redeviendra actif.`)) return;
    try {
      await api.put(`/admin/eleves/${el.id}/statut`, { statut: 'Actif' });
      loadData();
    } catch (err) {
      alert(err.data?.error || err.message || 'Erreur lors de la réactivation');
    }
  };

  return (
    <div className="edu-print-root">
    <div className="admin-dashboard">
      <div className="edu-print-only edu-print-students-header">
        <PrintHeader
          badge="Élèves"
          docTitle="Liste des élèves inscrits"
          docSubtitle="Registre administratif de l'établissement"
        />
        <PrintMeta
          items={[
            { label: 'Année scolaire', value: filters.anneeScolaire || activeYear || '—' },
            { label: 'Niveau', value: filters.niveau || 'Tous' },
            {
              label: 'Classe',
              value: filters.classeId
                ? (classes.find((c) => String(c.id) === String(filters.classeId))?.nom || '—')
                : 'Toutes',
            },
            { label: 'Date', value: formatPrintDate() },
            { label: 'Total affiché', value: filtered.length },
          ]}
        />
      </div>
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Gestion des Élèves</h1>
        <div className="print-hide page-header-actions">
          <button className="btn btn--outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #cbd5e1' }} onClick={() => printDocument('printing-students')}>
            <Printer size={18} /> Imprimer
          </button>
          <button className="btn btn--outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #cbd5e1' }} onClick={() => setIsGlobalReInscriptionOpen(true)}>
            <RotateCw size={18} /> Réinscription
          </button>
          <button className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsModalOpen(true)}>
            <UserPlus size={18} /> Nouvelle Inscription
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="print-hide students-filters">
        <div className="students-filters__top">
          <div className="students-filters__search">
            <Search size={18} color="#94a3b8" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, matricule, parent, téléphone, email…"
            />
          </div>
        </div>

        <div className="students-filters__grid">
          <div className="students-filters__field">
            <label>Année scolaire</label>
            <select value={filters.anneeScolaire} onChange={(e) => updateFilter('anneeScolaire', e.target.value)}>
              <option value="">Toutes</option>
              {annees.map((a) => (
                <option key={a.id} value={a.nom}>{a.nom}{a.active ? ' (active)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="students-filters__field">
            <label>Niveau</label>
            <select value={filters.niveau} onChange={(e) => updateFilter('niveau', e.target.value)}>
              <option value="">Tous</option>
              {niveaux.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="students-filters__field">
            <label>Classe</label>
            <select value={filters.classeId} onChange={(e) => updateFilter('classeId', e.target.value)}>
              <option value="">Toutes</option>
              {classesFiltrees.map((c) => (
                <option key={c.id} value={c.id}>{c.niveau ? `${c.niveau} — ` : ''}{c.nom}</option>
              ))}
            </select>
          </div>
          <div className="students-filters__field">
            <label>Statut élève</label>
            <select value={filters.statut} onChange={(e) => updateFilter('statut', e.target.value)}>
              <option value="">Tous (actifs par défaut)</option>
              {ELEVE_STATUTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="students-filters__field">
            <label>Statut inscription</label>
            <select value={filters.inscriptionStatut} onChange={(e) => updateFilter('inscriptionStatut', e.target.value)}>
              <option value="">Tous</option>
              {INSCRIPTION_STATUTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="students-filters__field">
            <label>Statut financier</label>
            <select value={filters.statutFinancier} onChange={(e) => updateFilter('statutFinancier', e.target.value)}>
              <option value="">Tous</option>
              {FINANCIER_STATUTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="students-filters__actions">
          <label className="students-filters__checkbox">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Inclure inactifs / abandons
          </label>
          <span className="students-filters__count">
            {loading ? 'Chargement…' : (
              <><strong>{filtered.length}</strong> élève(s) affiché(s)</>
            )}
          </span>
          {hasActiveFilters && (
            <button type="button" className="students-filters__reset" onClick={resetFilters}>
              <RotateCcw size={14} style={{ verticalAlign: '-2px', marginRight: '0.25rem' }} />
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="admin-panel">
        <div className="students-table-meta print-hide">
          <span><Filter size={14} style={{ verticalAlign: '-2px', marginRight: '0.35rem' }} />Liste des élèves</span>
          {!loading && loadError && (
            <span style={{ color: '#dc2626' }}>{loadError}</span>
          )}
          {!loading && !loadError && filtered.length === 0 && (
            <span>Aucun résultat — élargissez les filtres ou cochez « Inclure inactifs »</span>
          )}
        </div>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr><th></th><th>Matricule</th><th>Nom Complet</th><th>Date de naissance</th><th>Classe</th><th>Statut</th><th>Financier</th><th className="print-hide">Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Chargement des élèves…</td></tr>
              ) : loadError ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>{loadError}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>Aucun élève trouvé.</td></tr>
              ) : filtered.map(el => {
                const isExpanded = expandedRows.includes(el.id);
                const ins = getLatestInscription(el, filters.anneeScolaire || activeYear);
                return (
                  <React.Fragment key={el.id}>
                    <tr onClick={() => toggleRow(el.id)} style={{ cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white', opacity: isEleveActif(el.statut) ? 1 : 0.75 }}>
                      <td style={{ width: '40px', color: '#64748b' }}>
                        {isExpanded ? '▼' : '▶'}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0A2F6B' }}>{el.matricule}</td>
                      <td style={{ fontWeight: 500, color: '#0f172a' }}>
                        {el.prenom} {el.nom}
                        {!isEleveActif(el.statut) && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#fee2e2', color: '#ef4444', marginLeft: '0.5rem' }}>
                            {normalizeStatut(el.statut)}
                          </span>
                        )}
                      </td>
                      <td>{el.date_naissance ? new Date(el.date_naissance).toLocaleDateString('fr-FR') : '—'}</td>
                      <td>{ins?.classe?.nom ?? '—'}</td>
                      <td>
                        <span className={`status-badge status-badge--${getStatutBadgeClass(el.statut)}`} style={{ marginRight: '0.3rem' }}>
                          {normalizeStatut(el.statut)}
                        </span>
                        {ins?.statut && (
                          <span className={`status-badge status-badge--${ins.statut === 'Validé' ? 'info' : 'warning'}`} style={{ fontSize: '0.7rem' }}>
                            {ins.statut}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`students-fin-badge ${getFinancierBadgeClass(el.statut_financier)}`}>
                          {el.statut_financier || '—'}
                        </span>
                      </td>
                      <td className="print-hide table-actions" onClick={e => e.stopPropagation()}>
                        {ins?.statut === 'En attente' && (
                          <button className="action-btn action-btn--view" title="Valider l'inscription" style={{ background: '#fef08a', color: '#854d0e' }} onClick={() => setValidateConfirmId(ins.id)}>
                            <Check size={16} />
                          </button>
                        )}
                        <button className="action-btn action-btn--view" title="Réinscrire" style={{ background: '#dcfce7', color: '#16a34a' }} onClick={() => setReInscrireEleve(el)}><RotateCw size={16} /></button>
                        <button className="action-btn action-btn--view" title="Générer Carte" style={{ background: '#e0e7ff', color: '#4f46e5' }} onClick={() => setSelectedCardStudent(el)}>
                          <CreditCard size={16} />
                        </button>
                        <button className="action-btn action-btn--view" title="Voir le profil" onClick={() => setViewingStudent(el)}><Eye size={16} /></button>
                        <button className="action-btn action-btn--edit" title="Modifier" onClick={() => openEdit(el)}><Edit size={16} /></button>
                        {isEleveActif(el.statut) ? (
                          <button className="action-btn action-btn--delete" title="Marquer abandon / départ" onClick={() => openAbandonModal(el)}><UserX size={16} /></button>
                        ) : (
                          <button className="action-btn action-btn--view" title="Réactiver l'élève" style={{ background: '#dcfce7', color: '#16a34a' }} onClick={() => handleReactivateStudent(el)}><RotateCw size={16} /></button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <td colSpan="8" style={{ padding: '1rem 2rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', fontSize: '0.9rem', color: '#475569' }}>
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Parent / Tuteur</p>
                              <p style={{ margin: 0, fontWeight: 500, color: '#0f172a' }}>{el.parent_nom || '—'} <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({el.filiation || '—'})</span></p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Contact Parent</p>
                              <p style={{ margin: 0 }}>📞 {el.parent_telephone || '—'}</p>
                              <p style={{ margin: 0 }}>📧 {el.parent_email || '—'}</p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Adresse</p>
                              <p style={{ margin: 0 }}>{el.adresse || '—'}</p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Infos Médicales/Importantes</p>
                              <p style={{ margin: 0, color: el.infos_importantes ? '#b91c1c' : '#475569', fontWeight: el.infos_importantes ? 500 : 400 }}>{el.infos_importantes || 'Aucune'}</p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Statut scolaire</p>
                              <p style={{ margin: 0, fontWeight: 500, color: '#0f172a' }}>{normalizeStatut(el.statut)}</p>
                              {!isEleveActif(el.statut) && el.motif_abandon && (
                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#b45309' }}>Motif : {el.motif_abandon}</p>
                              )}
                              {!isEleveActif(el.statut) && el.date_abandon && (
                                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                                  Depuis le {new Date(el.date_abandon).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Voir Profil */}
      {viewingStudent && (
        <div className="modal-overlay" onClick={() => setViewingStudent(null)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {viewingStudent.photoUrl
                    ? <img src={viewingStudent.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0A2F6B' }}>{viewingStudent.prenom?.[0]}{viewingStudent.nom?.[0]}</span>
                  }
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>{viewingStudent.prenom} {viewingStudent.nom}</h2>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{viewingStudent.matricule}</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setViewingStudent(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="profile-detail-grid">
                {[
                  { label: 'Prénom', value: viewingStudent.prenom },
                  { label: 'Nom', value: viewingStudent.nom },
                  { label: 'Date de naissance', value: viewingStudent.date_naissance ? new Date(viewingStudent.date_naissance).toLocaleDateString('fr-FR') : '—' },
                  { label: 'Adresse', value: viewingStudent.adresse || '—' },
                  { label: 'Classe actuelle', value: viewingStudent.inscriptions?.[0]?.classe?.nom || '—' },
                  { label: 'Statut', value: normalizeStatut(viewingStudent.statut) },
                  ...( !isEleveActif(viewingStudent.statut) ? [
                    { label: 'Motif', value: viewingStudent.motif_abandon || '—' },
                    { label: 'Date de départ', value: viewingStudent.date_abandon ? new Date(viewingStudent.date_abandon).toLocaleDateString('fr-FR') : '—' },
                  ] : []),
                  { label: 'Statut financier', value: viewingStudent.statut_financier || '—' },
                  { label: 'Solde restant', value: viewingStudent.solde ? `${viewingStudent.solde.toLocaleString()} GNF` : '0 GNF' },
                  { label: 'Parent / Tuteur', value: `${viewingStudent.parent_nom || '—'} (${viewingStudent.filiation || '—'})` },
                  { label: 'Téléphone parent', value: viewingStudent.parent_telephone || '—' },
                  { label: 'Email parent', value: viewingStudent.parent_email || '—' },
                  { label: 'Infos importantes', value: viewingStudent.infos_importantes || 'Aucune' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
                    <p style={{ margin: 0, color: '#0f172a', fontWeight: 500 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setViewingStudent(null)}>Fermer</button>
              <button className="btn-submit" onClick={() => { setViewingStudent(null); openEdit(viewingStudent); }}>
                <Edit size={16} /> Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifier */}
      {editingStudent && (
        <div className="modal-overlay" onClick={() => setEditingStudent(null)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Edit size={22} color="#0A2F6B" />
                <h2>Modifier — {editingStudent.prenom} {editingStudent.nom}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setEditingStudent(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {editMessage && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: editMessage.includes('✅') ? '#d1fae5' : '#fee2e2', color: editMessage.includes('✅') ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>
                  {editMessage}
                </div>
              )}
              <form id="editStudentForm" onSubmit={handleEditSubmit}>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Prénom</label><input type="text" value={editForm.prenom} onChange={e => setEditForm({...editForm, prenom: e.target.value})} required /></div>
                  <div className="modal-form-group"><label>Nom</label><input type="text" value={editForm.nom} onChange={e => setEditForm({...editForm, nom: e.target.value})} required /></div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Date de naissance</label><input type="date" value={editForm.date_naissance} onChange={e => setEditForm({...editForm, date_naissance: e.target.value})} /></div>
                  <div className="modal-form-group"><label>Adresse</label><input type="text" value={editForm.adresse} onChange={e => setEditForm({...editForm, adresse: e.target.value})} placeholder="Quartier..." /></div>
                </div>
                <div className="modal-form-group">
                  <label>Photo de l'élève</label>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setEditForm({...editForm, photoUrl: reader.result});
                      reader.readAsDataURL(file);
                    }
                  }} />
                  {editForm.photoUrl && <img src={editForm.photoUrl} alt="Aperçu" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', marginTop: '6px' }} />}
                </div>
                <h3 style={{ fontSize: '1rem', color: '#1e293b', margin: '1.25rem 0 0.75rem 0', fontWeight: 600 }}>Informations du Parent / Tuteur</h3>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Nom complet</label><input type="text" value={editForm.parent_nom} onChange={e => setEditForm({...editForm, parent_nom: e.target.value})} /></div>
                  <div className="modal-form-group"><label>Lien de parenté</label>
                    <select value={editForm.filiation} onChange={e => setEditForm({...editForm, filiation: e.target.value})}>
                      <option value="">Sélectionner</option>
                      <option value="Père">Père</option>
                      <option value="Mère">Mère</option>
                      <option value="Tuteur">Tuteur</option>
                    </select>
                  </div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Téléphone</label><input type="text" value={editForm.parent_telephone} onChange={e => setEditForm({...editForm, parent_telephone: e.target.value})} /></div>
                  <div className="modal-form-group"><label>Email (optionnel)</label><input type="email" value={editForm.parent_email} onChange={e => setEditForm({...editForm, parent_email: e.target.value})} /></div>
                </div>
                <div className="modal-form-group"><label>Informations importantes</label><input type="text" value={editForm.infos_importantes} onChange={e => setEditForm({...editForm, infos_importantes: e.target.value})} placeholder="Ex: Allergies, asthme..." /></div>

                <h3 style={{ fontSize: '1rem', color: '#1e293b', margin: '1.25rem 0 0.75rem 0', fontWeight: 600 }}>Statut scolaire</h3>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Statut de l&apos;élève</label>
                    <select value={editForm.statut} onChange={e => setEditForm({ ...editForm, statut: e.target.value })}>
                      {ELEVE_STATUTS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  {!isEleveActif(editForm.statut) && (
                    <div className="modal-form-group">
                      <label>Date de départ / abandon</label>
                      <input type="date" value={editForm.date_abandon} onChange={e => setEditForm({ ...editForm, date_abandon: e.target.value })} />
                    </div>
                  )}
                </div>
                {!isEleveActif(editForm.statut) && (
                  <div className="modal-form-group">
                    <label>Motif</label>
                    <select
                      value={ABANDON_MOTIFS.includes(editForm.motif_abandon) ? editForm.motif_abandon : 'Autre'}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditForm({ ...editForm, motif_abandon: v === 'Autre' ? '' : v });
                      }}
                    >
                      <option value="">Sélectionner un motif</option>
                      {ABANDON_MOTIFS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {(!editForm.motif_abandon || !ABANDON_MOTIFS.includes(editForm.motif_abandon)) && (
                      <input
                        type="text"
                        style={{ marginTop: '0.5rem' }}
                        placeholder="Précisez le motif..."
                        value={editForm.motif_abandon || ''}
                        onChange={e => setEditForm({ ...editForm, motif_abandon: e.target.value })}
                      />
                    )}
                  </div>
                )}

                <div className="modal-form-group" style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                    <input type="checkbox" checked={editForm.exception_paiement_mensuel} onChange={e => setEditForm({...editForm, exception_paiement_mensuel: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span>Exception paiement mensuel</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditingStudent(null)}>Annuler</button>
              <button type="submit" form="editStudentForm" className="btn-submit" disabled={editSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} /> {editSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouvelle Inscription */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src="/images/logo_boubacar.png" alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'contain' }} />
                <h2>Inscrire un Élève</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '0.75rem', background: '#fffbeb', color: '#b45309', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', border: '1px solid #fef3c7' }}>
                <strong style={{ fontSize: '1.2rem' }}>⚠️</strong> 
                <div>
                  <strong>Attention aux doublons :</strong> Si l'élève a déjà étudié dans notre établissement par le passé, fermez cette fenêtre et utilisez le bouton <strong>Réinscription</strong>.
                </div>
              </div>
              {message && <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#d1fae5' : '#fee2e2', color: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>{message}</div>}
              <form id="studentForm" onSubmit={handleSubmit}>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Prénom</label><input type="text" name="prenom" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} placeholder="Ex: Amadou" required /></div>
                  <div className="modal-form-group"><label>Nom</label><input type="text" name="nom" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Ex: Diallo" required /></div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Date de naissance</label><input type="date" value={form.date_naissance} onChange={e => setForm({...form, date_naissance: e.target.value})} /></div>
                  <div className="modal-form-group"><label>Année scolaire</label><input type="text" value={form.annee_scolaire} onChange={e => setForm({...form, annee_scolaire: e.target.value})} required /></div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>N° d'élève (Matricule)</label><input type="text" value={form.matricule} onChange={e => setForm({...form, matricule: e.target.value})} placeholder="Ex: GSP-2024-001 (Laisser vide pour auto)" /></div>
                  <div className="modal-form-group">
                    <label>Photo de l'élève</label>
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setForm({...form, photoUrl: reader.result});
                        reader.readAsDataURL(file);
                      }
                    }} />
                    {form.photoUrl && <img src={form.photoUrl} alt="Aperçu" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginTop: '4px' }} />}
                  </div>
                </div>
                <div className="modal-form-group"><label>Adresse (optionnel)</label><input type="text" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} placeholder="Ex: Quartier Almamya, Conakry" /></div>
                
                <h3 style={{ fontSize: '1.05rem', color: '#1e293b', margin: '1.5rem 0 1rem 0', fontWeight: 600 }}>Informations du Parent / Tuteur</h3>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Nom complet</label><input type="text" value={form.parent_nom} onChange={e => setForm({...form, parent_nom: e.target.value})} placeholder="Ex: Ousmane Diallo" required /></div>
                  <div className="modal-form-group"><label>Lien de parenté</label><select value={form.filiation} onChange={e => setForm({...form, filiation: e.target.value})} required><option value="">Sélectionner</option><option value="Père">Père</option><option value="Mère">Mère</option><option value="Tuteur">Tuteur</option></select></div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Téléphone</label><input type="text" value={form.parent_telephone} onChange={e => setForm({...form, parent_telephone: e.target.value})} placeholder="Ex: +224 620 000 000" required /></div>
                  <div className="modal-form-group"><label>Email (optionnel)</label><input type="email" value={form.parent_email} onChange={e => setForm({...form, parent_email: e.target.value})} placeholder="Ex: contact@email.com" /></div>
                </div>
                <div className="modal-form-group"><label>Informations importantes (optionnel)</label><input type="text" value={form.infos_importantes} onChange={e => setForm({...form, infos_importantes: e.target.value})} placeholder="Ex: Allergies, asthme, etc." /></div>

                <h3 style={{ fontSize: '1.05rem', color: '#1e293b', margin: '1.5rem 0 1rem 0', fontWeight: 600 }}>Affectation Scolaire</h3>
                <div className="modal-form-group">
                  <label>Affecter à une classe</label>
                  <select value={form.classeId} onChange={e => setForm({...form, classeId: e.target.value})} required>
                    <option value="">Sélectionnez une classe</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>)}
                  </select>
                </div>

                <div className="modal-form-group" style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                    <input type="checkbox" checked={form.exception_paiement_mensuel} onChange={e => setForm({...form, exception_paiement_mensuel: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span>Exception paiement mensuel (au lieu de tranches de 3 mois)</span>
                  </label>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#64748b', marginLeft: '1.8rem' }}>
                    Cocher cette case uniquement si cet élève bénéficie d'une dérogation pour payer mensuellement au lieu de par tranches de 3 mois.
                  </p>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button type="submit" form="studentForm" className="btn-submit" disabled={submitting || !activeYear}>{submitting ? 'Enregistrement...' : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Réinscription */}
      {reInscrireEleve && (
        <div className="modal-overlay" onClick={() => setReInscrireEleve(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src="/images/logo_boubacar.png" alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'contain' }} />
                <h2>Réinscrire {reInscrireEleve.prenom} {reInscrireEleve.nom}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setReInscrireEleve(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {message && <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#d1fae5' : '#fee2e2', color: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>{message}</div>}
              
              {!activeYear ? (
                <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
                  Aucune année scolaire active. Veuillez en définir une dans les paramètres.
                </div>
              ) : (
                <form id="reForm" onSubmit={handleReInscription}>
                  <div className="modal-form-group">
                    <label>Année Scolaire</label>
                    <input type="text" value={activeYear} disabled style={{ background: '#f1f5f9', color: '#64748b' }} />
                  </div>
                  <div className="modal-form-group">
                    <label>Nouvelle Classe</label>
                    <select value={reForm.classeId} onChange={e => setReForm({ classeId: e.target.value })} required>
                      <option value="">Sélectionnez une classe</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>)}
                    </select>
                  </div>
                </form>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setReInscrireEleve(null)}>Annuler</button>
              <button type="submit" form="reForm" className="btn-submit" disabled={submitting || !activeYear}>{submitting ? 'Enregistrement...' : 'Confirmer la réinscription'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Confirmation Modal */}
      {validateConfirmId && (
        <div className="modal-overlay" onClick={() => setValidateConfirmId(null)} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', padding: '2.5rem 2rem', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.2)', animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '1.5rem', marginTop: '0', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)' }}>
              <Check size={36} strokeWidth={3} />
            </div>
            <h2 style={{ marginBottom: '1rem', color: '#0f172a', fontSize: '1.5rem', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>Confirmer la validation</h2>
            <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: 1.6 }}>
              Voulez-vous vraiment valider cette inscription ?<br/>L'élève sera officiellement ajouté à la classe.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setValidateConfirmId(null)} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem' }}>Annuler</button>
              <button onClick={handleValidate} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #0A2F6B 0%, #1e40af 100%)', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(10, 47, 107, 0.2)', fontSize: '1rem' }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Réinscription Globale */}
      {isGlobalReInscriptionOpen && (
        <div className="modal-overlay" onClick={() => setIsGlobalReInscriptionOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <RotateCw size={24} color="#0A2F6B" />
                <h2>Réinscription d'un élève</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setIsGlobalReInscriptionOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Sélectionnez un élève déjà existant dans le système pour le réinscrire dans une nouvelle classe.<br/>
                Cela permet de conserver son historique scolaire et d'éviter les doublons.
              </p>
              <div className="modal-form-group">
                <label>Rechercher l'élève (par nom ou matricule)</label>
                <select 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: '#f8fafc' }}
                  onChange={(e) => {
                    const selected = eleves.find(el => el.id === parseInt(e.target.value));
                    if (selected) {
                      setReInscrireEleve(selected);
                      setIsGlobalReInscriptionOpen(false);
                    }
                  }}
                >
                  <option value="">Sélectionnez un élève...</option>
                  {eleves.map(el => (
                    <option key={el.id} value={el.id}>{el.matricule} — {el.prenom} {el.nom}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Carte Scolaire */}
      {selectedCardStudent && (
        <div className="modal-overlay" onClick={() => setSelectedCardStudent(null)}>
          <div className="modal-content print-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1100px', width: '95%', background: '#f8fafc' }}>
            <div className="modal-header print-hide">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <CreditCard size={24} color="#0A2F6B" />
                <h2>Carte d'identité scolaire</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedCardStudent(null)}><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0', background: '#e2e8f0', borderRadius: '12px' }}>
              <StudentCard student={selectedCardStudent} anneeScolaire={activeYear || '2024 - 2025'} />
            </div>
            
            <div className="modal-footer print-hide">
              <button className="btn-cancel" onClick={() => setSelectedCardStudent(null)}>Fermer</button>
              <button className="btn-submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => printDocument('printing-card')}>
                <Printer size={18} /> Imprimer la carte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Deactivate Confirmation Modal */}
      {deleteConfirmStudent && (
        <div className="modal-overlay" onClick={() => !statusSubmitting && setDeleteConfirmStudent(null)} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="modal-content" style={{ maxWidth: '460px', padding: '2rem', borderRadius: '16px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)' }}>
                <UserX size={32} />
              </div>
              <h2 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.35rem', fontWeight: 700 }}>Marquer un abandon</h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                <strong>{deleteConfirmStudent.prenom} {deleteConfirmStudent.nom}</strong> ne sera plus compté parmi les élèves actifs (notes, bulletins). L&apos;historique est conservé.
              </p>
            </div>
            <div className="modal-form-group">
              <label>Date d&apos;abandon / départ</label>
              <input type="date" value={abandonForm.date_abandon} onChange={e => setAbandonForm({ ...abandonForm, date_abandon: e.target.value })} />
            </div>
            <div className="modal-form-group">
              <label>Motif</label>
              <select value={abandonForm.motif_abandon} onChange={e => setAbandonForm({ ...abandonForm, motif_abandon: e.target.value })} required>
                <option value="">Sélectionner un motif</option>
                {ABANDON_MOTIFS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setDeleteConfirmStudent(null)} disabled={statusSubmitting} className="btn-cancel" style={{ flex: 1 }}>Annuler</button>
              <button type="button" onClick={handleDeleteStudent} disabled={statusSubmitting || !abandonForm.motif_abandon} className="btn-submit" style={{ flex: 1, background: '#dc2626' }}>
                {statusSubmitting ? 'Enregistrement...' : 'Confirmer l\'abandon'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}
