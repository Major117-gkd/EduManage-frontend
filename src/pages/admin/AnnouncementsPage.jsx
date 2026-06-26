import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Pin,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './AdminDashboard.css';
import './Modal.css';

const CATEGORIES = ['Info', 'Urgent', 'Événement', 'Rentrée'];

const CATEGORY_COLORS = {
  Info: { bg: '#dbeafe', color: '#1e40af' },
  Urgent: { bg: '#fee2e2', color: '#991b1b' },
  'Événement': { bg: '#f3e8ff', color: '#6d28d9' },
  Rentrée: { bg: '#dcfce7', color: '#166534' },
};

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    titre: '',
    contenu: '',
    categorie: 'Info',
    publiee: true,
    epinglee: false,
    auteurNom: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/annonces');
      setAnnonces(Array.isArray(data) ? data : []);
    } catch {
      setAnnonces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = annonces.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [a.titre, a.contenu, a.categorie, a.auteurNom]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const fillForm = (annonce) => ({
    titre: annonce.titre,
    contenu: annonce.contenu,
    categorie: annonce.categorie,
    publiee: annonce.publiee,
    epinglee: annonce.epinglee,
    auteurNom: annonce.auteurNom || '',
  });

  const openModal = async (annonce = null) => {
    setMessage('');
    if (annonce) {
      setEditingId(annonce.id);
      setForm(fillForm(annonce));
      setShowModal(true);
      setLoadingEdit(true);
      try {
        const fresh = await api.get(`/admin/annonces/${annonce.id}`);
        setForm(fillForm(fresh));
      } catch {
        setMessage('Impossible de recharger l\'annonce. Les données affichées peuvent être obsolètes.');
      } finally {
        setLoadingEdit(false);
      }
    } else {
      setEditingId(null);
      setForm({
        titre: '',
        contenu: '',
        categorie: 'Info',
        publiee: true,
        epinglee: false,
        auteurNom: user?.nom || '',
      });
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre.trim() || !form.contenu.trim()) {
      setMessage('Titre et contenu requis.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const body = {
        ...form,
        auteurNom: form.auteurNom.trim() || user?.nom || 'Administration',
      };
      if (editingId) {
        await api.put(`/admin/annonces/${editingId}`, body);
        setSuccessMessage('Annonce modifiée avec succès.');
      } else {
        await api.post('/admin/annonces', body);
        setSuccessMessage('Annonce créée avec succès.');
      }
      await load();
      closeModal();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setMessage(err.data?.error || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    try {
      await api.delete(`/admin/annonces/${id}`);
      setAnnonces((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.data?.error || 'Suppression impossible.');
    }
  };

  const togglePin = async (annonce) => {
    const next = !annonce.epinglee;
    try {
      await api.patch(`/admin/annonces/${annonce.id}/epingle`, { epinglee: next });
      await load();
    } catch (err) {
      alert(err.data?.error || 'Impossible de modifier l\'épinglage.');
    }
  };

  const togglePublish = async (annonce) => {
    if (annonce.epinglee && annonce.publiee) {
      alert('Désépinglez d\'abord l\'annonce pour la retirer de la publication.');
      return;
    }
    try {
      await api.put(`/admin/annonces/${annonce.id}`, {
        titre: annonce.titre,
        contenu: annonce.contenu,
        categorie: annonce.categorie,
        publiee: !annonce.publiee,
        epinglee: annonce.epinglee,
        auteurNom: annonce.auteurNom,
      });
      await load();
    } catch (err) {
      alert(err.data?.error || 'Erreur');
    }
  };

  const pinnedCount = annonces.filter((a) => a.epinglee).length;

  return (
    <div className="admin-dashboard">
      <div
        className="admin-dashboard__header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 className="admin-title">Annonces</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Publiez les informations visibles sur la{' '}
            <Link to="/admin/annonces/consulter" style={{ color: '#0A2F6B' }}>
              page de consultation
            </Link>
            {' '}et la{' '}
            <a href="/annonces" target="_blank" rel="noreferrer" style={{ color: '#0A2F6B' }}>
              page publique
            </a>
            . Une seule annonce peut être <strong>épinglée à la une</strong> (accueil + haut de la page annonces).
            {pinnedCount > 0 && (
              <span style={{ display: 'block', marginTop: '0.25rem', color: '#0A2F6B' }}>
                <Pin size={14} style={{ verticalAlign: 'middle' }} /> {pinnedCount} annonce à la une
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => openModal()}
        >
          <Plus size={18} /> Nouvelle annonce
        </button>
      </div>

      {successMessage && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            background: '#dcfce7',
            color: '#166534',
            fontSize: '0.9rem',
            fontWeight: 500,
            border: '1px solid #86efac',
          }}
        >
          {successMessage}
        </div>
      )}

      <div className="admin-panel">
        <div
          className="admin-panel__header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
        >
          <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Megaphone size={20} color="#0A2F6B" />
            Toutes les annonces ({annonces.length})
          </h2>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Publication</th>
                <th>À la une</th>
                <th>Date</th>
                <th>Auteur</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Chargement…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Aucune annonce</td></tr>
              ) : (
                filtered.map((a) => {
                  const catStyle = CATEGORY_COLORS[a.categorie] || CATEGORY_COLORS.Info;
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, maxWidth: '280px' }}>
                        <button
                          type="button"
                          onClick={() => openModal(a)}
                          title="Modifier cette annonce"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: 0,
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: '#0f172a',
                            textAlign: 'left',
                          }}
                        >
                          {a.epinglee && <Pin size={14} color="#0A2F6B" style={{ flexShrink: 0 }} />}
                          <span style={{ textDecoration: 'underline', textDecorationColor: '#cbd5e1', textUnderlineOffset: '3px' }}>
                            {a.titre}
                          </span>
                        </button>
                      </td>
                      <td>
                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.78rem', background: catStyle.bg, color: catStyle.color }}>
                          {a.categorie}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => togglePublish(a)}
                          title={a.publiee ? 'Dépublier' : 'Publier'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            background: a.publiee ? '#dcfce7' : '#f1f5f9',
                            color: a.publiee ? '#166534' : '#64748b',
                          }}
                        >
                          {a.publiee ? <><Eye size={12} /> Publiée</> : <><EyeOff size={12} /> Brouillon</>}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => togglePin(a)}
                          title={a.epinglee ? 'Retirer de la une' : 'Épingler à la une'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '999px',
                            border: a.epinglee ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            background: a.epinglee ? '#eff6ff' : '#fff',
                            color: a.epinglee ? '#0A2F6B' : '#64748b',
                          }}
                        >
                          <Pin size={14} fill={a.epinglee ? '#0A2F6B' : 'none'} />
                          {a.epinglee ? 'À la une' : 'Épingler'}
                        </button>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{formatDate(a.createdAt)}</td>
                      <td style={{ fontSize: '0.85rem' }}>{a.auteurNom || '—'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="action-btn action-btn--edit"
                            title="Modifier l'annonce"
                            onClick={() => openModal(a)}
                            style={{ width: 'auto', padding: '0 0.55rem', gap: '0.3rem' }}
                          >
                            <Edit size={15} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Modifier</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn action-btn--delete"
                            title="Supprimer l'annonce"
                            onClick={() => handleDelete(a.id)}
                          >
                            <Trash2 size={16} />
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</h2>
              <button type="button" className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {loadingEdit && (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', fontSize: '0.9rem' }}>
                    Chargement de l&apos;annonce…
                  </div>
                )}
                {message && (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '0.9rem' }}>
                    {message}
                  </div>
                )}
                <div className="modal-form-group">
                  <label>Titre *</label>
                  <input type="text" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Ex : Rentrée scolaire 2025-2026" required />
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Catégorie</label>
                    <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="modal-form-group">
                    <label>Auteur affiché</label>
                    <input type="text" value={form.auteurNom} onChange={(e) => setForm({ ...form, auteurNom: e.target.value })} placeholder="Direction, Secrétariat…" />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Contenu *</label>
                  <textarea
                    rows={8}
                    value={form.contenu}
                    onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                    placeholder="Rédigez le message à destination des familles, élèves et visiteurs…"
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.publiee} onChange={(e) => setForm({ ...form, publiee: e.target.checked })} />
                    Publier immédiatement
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.epinglee} onChange={(e) => setForm({ ...form, epinglee: e.target.checked, publiee: e.target.checked ? true : form.publiee })} />
                    <Pin size={16} /> Épingler à la une (accueil + annonces)
                  </label>
                  {form.epinglee && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      Une seule annonce à la une : les autres seront automatiquement désépinglées.
                    </p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn-submit" disabled={submitting || loadingEdit}>
                  {submitting ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Publier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
