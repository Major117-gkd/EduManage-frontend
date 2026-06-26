import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserCog, Plus, Trash2, Key, Search, Shield, Wallet, GraduationCap } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, DIRECTEUR_CYCLES, getStaffRoleLabel } from '../../utils/rolePaths';
import ConfirmModal from '../../components/ConfirmModal';
import './AdminDashboard.css';
import './Modal.css';

const ROLE_BADGE_COLORS = {
  ADMIN: '#dbeafe',
  COMPTABLE: '#fef3c7',
  DIRECTEUR: '#e0e7ff',
  PROFESSEUR: '#dcfce7',
  ELEVE: '#f3e8ff',
  PARENT: '#ffedd5',
};

const STAFF_CREATE_ROLES = [
  { value: 'DIRECTEUR', label: 'Directeur de cycle' },
  { value: 'COMPTABLE', label: 'Comptable (tous niveaux)' },
  { value: 'ADMIN', label: 'Administrateur' },
];

const EMPTY_FORM = { nom: '', email: '', mot_de_passe: '', role: 'DIRECTEUR', perimetre: '' };

const STAFF_ROLES = ['ADMIN', 'COMPTABLE', 'DIRECTEUR'];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('staff');
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/users');
      setUsers(data || []);
    } catch {
      setMessage('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const staffTeam = useMemo(() => {
    const staff = users.filter((u) => STAFF_ROLES.includes(u.role));
    const comptables = staff.filter((u) => u.role === 'COMPTABLE');
    const directeurs = DIRECTEUR_CYCLES.map((cycle) => ({
      cycle,
      user: staff.find((u) => u.role === 'DIRECTEUR' && u.perimetre === cycle) || null,
    }));
    const admins = staff.filter((u) => u.role === 'ADMIN');
    return { comptables, directeurs, admins, staff };
  }, [users]);

  const filtered = users.filter((u) => {
    if (roleFilter === 'staff' && !STAFF_ROLES.includes(u.role)) return false;
    if (roleFilter !== 'staff' && roleFilter !== 'all' && u.role !== roleFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [u.nom, u.email, u.role, u.perimetre, u.eleve?.matricule]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const openCreateModal = (preset = {}) => {
    setForm({ ...EMPTY_FORM, ...preset });
    setModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.role === 'DIRECTEUR' && !form.perimetre) {
      setMessage('Sélectionnez le cycle (Primaire, Collège ou Lycée) pour un directeur.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const payload = {
        nom: form.nom,
        email: form.email,
        mot_de_passe: form.mot_de_passe,
        role: form.role,
        ...(form.role === 'DIRECTEUR' ? { perimetre: form.perimetre } : {}),
      };
      const data = await api.post('/admin/users', payload);
      const emailInfo = data.emailSent
        ? ' Un e-mail avec les identifiants a été envoyé.'
        : (data.emailError && !data.emailSkipped ? ` E-mail non envoyé : ${data.emailError}` : '');
      setMessage(`Compte créé avec succès.${emailInfo}`);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setMessage(err.data?.error || 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (!passwordModal || newPassword.length < 6) return;
    setSubmitting(true);
    try {
      await api.put(`/admin/users/${passwordModal.id}/password`, { nouveau_mot_de_passe: newPassword });
      setMessage('Mot de passe mis à jour.');
      setPasswordModal(null);
      setNewPassword('');
    } catch (err) {
      setMessage(err.data?.error || 'Erreur.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (u) => {
    if (u.id === currentUser?.id) {
      setMessage('Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }
    setDeleteTarget(u);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      setMessage('Utilisateur supprimé.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      setMessage(err.data?.error || 'Suppression impossible (compte lié à un profil).');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const roleLabelFor = (u) => {
    if (u.role === 'DIRECTEUR' || u.role === 'COMPTABLE') return getStaffRoleLabel(u.role, u.perimetre);
    return ROLE_LABELS[u.role] || u.role;
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="admin-title">Utilisateurs & équipe</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.92rem', maxWidth: '640px' }}>
            L&apos;administrateur configure les <strong>niveaux et classes</strong>, puis crée les comptes{' '}
            <strong>directeurs</strong> (un par cycle) et le <strong>comptable</strong> avec les accès adaptés.
          </p>
        </div>
        <button type="button" className="btn-submit" onClick={() => openCreateModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Nouveau compte staff
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: message.includes('succès') || message.includes('mis à jour') ? '#d1fae5' : '#fee2e2', color: message.includes('succès') || message.includes('mis à jour') ? '#065f46' : '#991b1b' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', borderRadius: '12px', background: '#fef3c7', border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#92400e', fontWeight: 600 }}>
            <Wallet size={18} /> Comptable
          </div>
          {staffTeam.comptables.length ? (
            staffTeam.comptables.map((u) => (
              <div key={u.id} style={{ fontSize: '0.9rem' }}>
                <strong>{u.nom}</strong>
                <div style={{ color: '#78716c', fontSize: '0.82rem' }}>{u.email}</div>
              </div>
            ))
          ) : (
            <>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#78716c' }}>Aucun compte — inscriptions & finances</p>
              <button type="button" className="btn btn--outline" style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }} onClick={() => openCreateModal({ role: 'COMPTABLE', perimetre: '' })}>
                Créer le comptable
              </button>
            </>
          )}
        </div>

        {staffTeam.directeurs.map(({ cycle, user }) => (
          <div key={cycle} style={{ padding: '1rem', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#1e40af', fontWeight: 600 }}>
              <GraduationCap size={18} /> Directeur — {cycle}
            </div>
            {user ? (
              <>
                <strong style={{ fontSize: '0.9rem' }}>{user.nom}</strong>
                <div style={{ color: '#64748b', fontSize: '0.82rem' }}>{user.email}</div>
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#64748b' }}>Poste vacant</p>
                <button type="button" className="btn btn--outline" style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }} onClick={() => openCreateModal({ role: 'DIRECTEUR', perimetre: cycle })}>
                  Nommer un directeur
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-panel__header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} color="#0A2F6B" />
          <h2 className="admin-panel__title" style={{ margin: 0 }}>Administrateurs</h2>
        </div>
        <div style={{ padding: '0.75rem 1rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {staffTeam.admins.map((u) => (
            <span key={u.id} style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', background: ROLE_BADGE_COLORS.ADMIN, fontSize: '0.85rem' }}>
              {u.nom} · {u.email}
            </span>
          ))}
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <UserCog size={20} color="#0A2F6B" />
          <h2 className="admin-panel__title">Tous les comptes</h2>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[
              { id: 'staff', label: 'Équipe' },
              { id: 'all', label: 'Tous' },
              { id: 'PROFESSEUR', label: 'Professeurs' },
              { id: 'ELEVE', label: 'Élèves' },
              { id: 'PARENT', label: 'Parents' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRoleFilter(f.id)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '999px',
                  border: roleFilter === f.id ? '1px solid #0A2F6B' : '1px solid #cbd5e1',
                  background: roleFilter === f.id ? '#eff6ff' : 'white',
                  color: roleFilter === f.id ? '#0A2F6B' : '#64748b',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', position: 'relative', width: '260px' }}>
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
                <th>Nom</th>
                <th>E-mail / Identifiant</th>
                <th>Rôle</th>
                <th>Périmètre</th>
                <th>Lié à</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Chargement…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Aucun utilisateur</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.nom}</td>
                    <td>{u.email}</td>
                    <td>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem', background: ROLE_BADGE_COLORS[u.role] || '#f1f5f9' }}>
                        {roleLabelFor(u)}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {u.role === 'DIRECTEUR' ? u.perimetre || '—' : u.role === 'COMPTABLE' ? 'Tous niveaux' : u.role === 'ADMIN' ? 'Global' : '—'}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {u.eleve ? `Élève : ${u.eleve.prenom} ${u.eleve.nom} (${u.eleve.matricule})` : ''}
                      {u.professeur ? `Prof. ${u.professeur.id}` : ''}
                      {u.enfants?.length ? `Parent de ${u.enfants.map((e) => e.prenom).join(', ')}` : ''}
                      {!u.eleve && !u.professeur && !u.enfants?.length ? '—' : ''}
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="action-btn action-btn--view" title="Réinitialiser mot de passe" onClick={() => setPasswordModal(u)}>
                          <Key size={16} />
                        </button>
                        <button
                          type="button"
                          className="action-btn action-btn--delete"
                          title="Supprimer"
                          disabled={u.id === currentUser?.id}
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Nouveau compte staff</h2></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Rôle</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value, perimetre: e.target.value === 'DIRECTEUR' ? form.perimetre : '' })}
                  >
                    {STAFF_CREATE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                {form.role === 'DIRECTEUR' && (
                  <div className="modal-form-group">
                    <label>Cycle (périmètre)</label>
                    <select
                      value={form.perimetre}
                      onChange={(e) => setForm({ ...form, perimetre: e.target.value })}
                      required
                    >
                      <option value="">Sélectionner…</option>
                      {DIRECTEUR_CYCLES.map((cycle) => (
                        <option key={cycle} value={cycle}>{cycle}</option>
                      ))}
                    </select>
                  </div>
                )}
                {form.role === 'COMPTABLE' && (
                  <p style={{ margin: '0 0 1rem', padding: '0.65rem', borderRadius: '8px', background: '#fef3c7', fontSize: '0.85rem', color: '#92400e' }}>
                    Le comptable gère les inscriptions et les finances sur <strong>tous les niveaux</strong>.
                  </p>
                )}
                <div className="modal-form-group">
                  <label>Nom complet</label>
                  <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                </div>
                <div className="modal-form-group">
                  <label>E-mail</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="modal-form-group">
                  <label>Mot de passe initial</label>
                  <input type="password" value={form.mot_de_passe} onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })} minLength={6} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn-submit" disabled={submitting}>{submitting ? 'Création…' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordModal && (
        <div className="modal-overlay" onClick={() => setPasswordModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Mot de passe — {passwordModal.nom}</h2></div>
            <form onSubmit={handlePassword}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Nouveau mot de passe</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setPasswordModal(null)}>Annuler</button>
                <button type="submit" className="btn-submit" disabled={submitting}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer ce compte ?"
        message={
          deleteTarget ? (
            <>
              Vous allez supprimer définitivement le compte de{' '}
              <strong>{deleteTarget.nom}</strong> ({deleteTarget.email}).
              Cette action est irréversible.
            </>
          ) : null
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        loading={deleteSubmitting}
        onCancel={() => !deleteSubmitting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
