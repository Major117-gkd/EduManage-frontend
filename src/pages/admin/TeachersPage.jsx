import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Search, Edit, Trash2, X, Mail, Phone, BookOpen, Users, GraduationCap, Check } from 'lucide-react';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';
import './TeachersPage.css';

import { api } from '../../services/api';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const emptyForm = () => ({
  nom: '',
  prenom: '',
  email: '',
  specialite: '',
  contact: '',
  photoUrl: '',
  matieresIds: [],
});

function getInitials(prenom, nom) {
  return `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase() || 'P';
}

function groupMatieresByNom(list) {
  const map = new Map();
  for (const m of list) {
    const key = m.nom.trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  }
  for (const items of map.values()) {
    items.sort((a, b) => (a.classe?.nom || '').localeCompare(b.classe?.nom || '', 'fr'));
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr'));
}

function groupMatieresByClasse(list) {
  const map = new Map();
  for (const m of list) {
    const key = m.classe?.id ?? 'none';
    if (!map.has(key)) map.set(key, { classe: m.classe, items: [] });
    map.get(key).items.push(m);
  }
  for (const { items } of map.values()) {
    items.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }
  return [...map.values()].sort((a, b) =>
    (a.classe?.nom || '').localeCompare(b.classe?.nom || '', 'fr')
  );
}

function formatClasseLabel(classe) {
  if (!classe) return '—';
  return classe.niveau ? `${classe.niveau} — ${classe.nom}` : classe.nom;
}

function getSelectedMatieres(matieresIds, matieres) {
  return matieresIds
    .map((id) => matieres.find((mat) => mat.id === id))
    .filter(Boolean);
}

function AssignChip({ active, onClick, icon: Icon, primary, secondary, warning }) {
  return (
    <button
      type="button"
      className={`teacher-assign-chip${active ? ' teacher-assign-chip--active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="teacher-assign-chip__icon">{Icon ? <Icon size={15} /> : null}</span>
      <span className="teacher-assign-chip__body">
        <span className="teacher-assign-chip__primary">{primary}</span>
        {secondary ? <span className="teacher-assign-chip__secondary">{secondary}</span> : null}
        {warning ? <span className="teacher-assign-chip__warning">{warning}</span> : null}
      </span>
      {active ? <Check size={14} className="teacher-assign-chip__check" /> : null}
    </button>
  );
}

function TeacherAssignmentPanel({
  assignView,
  setAssignView,
  classFilter,
  setClassFilter,
  classes,
  classesGrouped,
  matieresGrouped,
  selectedMatieres,
  form,
  editingId,
  handleMatiereToggle,
  toggleMatiereGroup,
  isGroupFullySelected,
}) {
  return (
    <div className="teacher-assign-section">
      <div className="teacher-assign-section__head">
        <h3 className="teacher-assign-section__title">Affectation des matières</h3>
        <p className="teacher-assign-section__hint">
          Cliquez sur les cours à assigner. Même matière dans plusieurs classes, ou matières différentes par classe.
        </p>
      </div>

      <div className="teacher-assign-section__toolbar">
        <div className="teacher-assign-section__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={assignView === 'classe'}
            className={`teacher-assign-section__tab${assignView === 'classe' ? ' teacher-assign-section__tab--active' : ''}`}
            onClick={() => setAssignView('classe')}
          >
            Par classe
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={assignView === 'matiere'}
            className={`teacher-assign-section__tab${assignView === 'matiere' ? ' teacher-assign-section__tab--active' : ''}`}
            onClick={() => setAssignView('matiere')}
          >
            Par matière
          </button>
        </div>
        <div className="teacher-assign-section__filter">
          <span className="teacher-assign-section__filter-label">Classe</span>
          <select
            id="teacherClassFilter"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">Toutes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {formatClasseLabel(c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedMatieres.length > 0 && (
        <div className="teacher-assign-section__selected">
          <span className="teacher-assign-section__selected-title">
            {selectedMatieres.length} cours sélectionné{selectedMatieres.length > 1 ? 's' : ''}
          </span>
          <div className="teacher-assign-section__selected-tags">
            {selectedMatieres.map((m) => (
              <span key={m.id} className="teacher-assign-section__tag">
                <GraduationCap size={12} />
                <strong>{m.classe?.nom || '—'}</strong>
                <span className="teacher-assign-section__tag-sep">·</span>
                <span>{m.nom}</span>
                <button
                  type="button"
                  className="teacher-assign-section__tag-remove"
                  onClick={() => handleMatiereToggle(m.id)}
                  aria-label={`Retirer ${m.nom} en ${m.classe?.nom || 'classe'}`}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="teacher-assign-board">
        {assignView === 'classe' ? (
          classesGrouped.length === 0 ? (
            <p className="teacher-assign-section__empty">
              Aucune matière disponible. Créez d&apos;abord les matières dans la page Classes.
            </p>
          ) : (
            classesGrouped.map(({ classe, items }) => {
              const selectedInClass = items.filter((m) => form.matieresIds.includes(m.id)).length;
              return (
                <article key={classe?.id ?? 'none'} className="teacher-assign-card">
                  <header className="teacher-assign-card__header">
                    <div className="teacher-assign-card__heading">
                      <GraduationCap size={18} />
                      <div>
                        <h4>{formatClasseLabel(classe)}</h4>
                        <p>
                          {selectedInClass > 0
                            ? `${selectedInClass} matière${selectedInClass > 1 ? 's' : ''} assignée${selectedInClass > 1 ? 's' : ''}`
                            : 'Choisissez la ou les matières enseignées'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="teacher-assign-card__action"
                      onClick={() => toggleMatiereGroup(items, !isGroupFullySelected(items))}
                    >
                      {isGroupFullySelected(items) ? 'Tout retirer' : 'Tout cocher'}
                    </button>
                  </header>
                  <div className="teacher-assign-chip-grid">
                    {items.map((m) => {
                      const active = form.matieresIds.includes(m.id);
                      const otherProf = m.professeur && m.professeur.id !== editingId
                        ? `${m.professeur.prenom} ${m.professeur.nom}`
                        : null;
                      return (
                        <AssignChip
                          key={m.id}
                          active={active}
                          onClick={() => handleMatiereToggle(m.id)}
                          icon={BookOpen}
                          primary={m.nom}
                          secondary={`Coeff. ${m.coefficient}`}
                          warning={otherProf ? `Prof. ${otherProf}` : null}
                        />
                      );
                    })}
                  </div>
                </article>
              );
            })
          )
        ) : matieresGrouped.length === 0 ? (
          <p className="teacher-assign-section__empty">
            Aucune matière disponible. Créez d&apos;abord les matières dans la page Classes.
          </p>
        ) : (
          matieresGrouped.map(([nom, items]) => {
            const selectedCount = items.filter((m) => form.matieresIds.includes(m.id)).length;
            return (
              <article key={nom} className="teacher-assign-card">
                <header className="teacher-assign-card__header">
                  <div className="teacher-assign-card__heading">
                    <BookOpen size={18} />
                    <div>
                      <h4>{nom}</h4>
                      <p>
                        {selectedCount > 0
                          ? `${selectedCount} classe${selectedCount > 1 ? 's' : ''} sélectionnée${selectedCount > 1 ? 's' : ''}`
                          : 'Choisissez les classes où cette matière est enseignée'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="teacher-assign-card__action"
                    onClick={() => toggleMatiereGroup(items, !isGroupFullySelected(items))}
                  >
                    {isGroupFullySelected(items) ? 'Tout retirer' : 'Toutes les classes'}
                  </button>
                </header>
                <div className="teacher-assign-chip-grid">
                  {items.map((m) => {
                    const active = form.matieresIds.includes(m.id);
                    const otherProf = m.professeur && m.professeur.id !== editingId
                      ? `${m.professeur.prenom} ${m.professeur.nom}`
                      : null;
                    return (
                      <AssignChip
                        key={m.id}
                        active={active}
                        onClick={() => handleMatiereToggle(m.id)}
                        icon={GraduationCap}
                        primary={m.classe?.nom || '—'}
                        secondary={m.classe?.niveau || null}
                        warning={otherProf ? `Prof. ${otherProf}` : null}
                      />
                    );
                  })}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const [professeurs, setProfesseurs] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [classFilter, setClassFilter] = useState('');
  const [assignView, setAssignView] = useState('classe');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = () => {
    api.get('/admin/professeurs').then((d) => { if (Array.isArray(d)) setProfesseurs(d); }).catch(() => {});
    api.get('/admin/matieres').then((d) => { if (Array.isArray(d)) setMatieres(d); }).catch(() => {});
    api.get('/admin/classes').then((d) => { if (Array.isArray(d)) setClasses(d); }).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setMessage('La photo ne doit pas dépasser 2 Mo.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setForm((prev) => ({ ...prev, photoUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      if (editingId) {
        await api.put(`/admin/professeurs/${editingId}`, {
          nom: form.nom,
          prenom: form.prenom,
          specialite: form.specialite,
          contact: form.contact,
          photoUrl: form.photoUrl,
          matieresIds: form.matieresIds,
        });
        setMessage('Professeur mis à jour avec succès.');
        loadData();
        setTimeout(() => { closeModal(); }, 1500);
      } else {
        const data = await api.post('/admin/professeurs', form);
        const pwdInfo = data.motDePasseTemporaire ? ` Mot de passe : ${data.motDePasseTemporaire}` : '';
        const emailInfo = data.emailSent
          ? ' Un e-mail avec les identifiants a été envoyé au professeur.'
          : (data.emailError ? ` E-mail non envoyé : ${data.emailError}` : '');
        setMessage(`Professeur et compte créés (${data.utilisateur?.email || form.email}).${pwdInfo}${emailInfo}`);
        loadData();
        setTimeout(() => { closeModal(); }, 2500);
      }
    } catch (err) {
      setMessage(err.data?.error || err.message || 'Impossible de contacter le serveur');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce professeur ?')) return;
    try {
      await api.delete(`/admin/professeurs/${id}`);
      loadData();
    } catch (err) {
      alert(err.data?.error || err.message || 'Erreur lors de la suppression');
    }
  };

  const openModal = (prof = null) => {
    if (prof) {
      setEditingId(prof.id);
      setForm({
        nom: prof.nom || '',
        prenom: prof.prenom || '',
        email: prof.utilisateur?.email || '',
        specialite: prof.specialite || '',
        contact: prof.contact || '',
        photoUrl: prof.photoUrl || prof.utilisateur?.photoUrl || '',
        matieresIds: prof.matieres ? prof.matieres.map((m) => m.id) : [],
      });
    } else {
      setEditingId(null);
      setForm(emptyForm());
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setMessage('');
    setForm(emptyForm());
    setEditingId(null);
    setClassFilter('');
    setAssignView('classe');
  };

  const handleMatiereToggle = (id) => {
    setForm((prev) => {
      const isSelected = prev.matieresIds.includes(id);
      if (isSelected) {
        return { ...prev, matieresIds: prev.matieresIds.filter((mId) => mId !== id) };
      }
      return { ...prev, matieresIds: [...prev.matieresIds, id] };
    });
  };

  const toggleMatiereGroup = (items, selectAll) => {
    const ids = items.map((m) => m.id);
    setForm((prev) => {
      if (selectAll) {
        const merged = new Set([...prev.matieresIds, ...ids]);
        return { ...prev, matieresIds: [...merged] };
      }
      return { ...prev, matieresIds: prev.matieresIds.filter((id) => !ids.includes(id)) };
    });
  };

  const isGroupFullySelected = (items) => items.length > 0 && items.every((m) => form.matieresIds.includes(m.id));

  const filtered = professeurs.filter((p) => {
    const haystack = [
      p.prenom,
      p.nom,
      p.specialite,
      p.contact,
      p.utilisateur?.email,
      ...(p.matieres || []).map((m) => `${m.nom} ${m.classe?.nom || ''}`),
    ].join(' ').toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const displayedMatieres = classFilter
    ? matieres.filter((m) => m.classe?.id.toString() === classFilter)
    : matieres;

  const matieresGrouped = useMemo(() => groupMatieresByNom(displayedMatieres), [displayedMatieres]);
  const classesGrouped = useMemo(() => groupMatieresByClasse(displayedMatieres), [displayedMatieres]);
  const selectedMatieres = useMemo(
    () => getSelectedMatieres(form.matieresIds, matieres),
    [form.matieresIds, matieres]
  );

  const isSuccessMessage = message && !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible');

  const withMatieres = professeurs.filter((p) => p.matieres?.length > 0).length;
  const totalMatieresAssigned = professeurs.reduce((sum, p) => sum + (p.matieres?.length || 0), 0);

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Gestion des Professeurs</h1>
        <button
          type="button"
          className="btn btn--primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => openModal()}
        >
          <UserPlus size={18} />
          Ajouter un professeur
        </button>
      </div>

      <div className="teachers-page__stats">
        <div className="teachers-stat">
          <span className="teachers-stat__value">{professeurs.length}</span>
          <span className="teachers-stat__label">Professeurs</span>
        </div>
        <div className="teachers-stat">
          <span className="teachers-stat__value">{withMatieres}</span>
          <span className="teachers-stat__label">Avec matières assignées</span>
        </div>
        <div className="teachers-stat">
          <span className="teachers-stat__value">{totalMatieresAssigned}</span>
          <span className="teachers-stat__label">Matières au total</span>
        </div>
      </div>

      <div className="teachers-toolbar">
        <Search size={18} color="#94a3b8" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, spécialité, email, téléphone ou matière..."
        />
      </div>

      <div className="teachers-grid">
        {filtered.length === 0 ? (
          <div className="teachers-empty">
            <Users size={40} color="#cbd5e1" />
            <p>Aucun professeur trouvé.</p>
          </div>
        ) : (
          filtered.map((p) => (
            <article key={p.id} className="teacher-card">
              <div className="teacher-card__top">
                <div className="teacher-card__avatar" aria-hidden>
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={`${p.prenom} ${p.nom}`} />
                  ) : (
                    getInitials(p.prenom, p.nom)
                  )}
                </div>
                <div className="teacher-card__identity">
                  <h3 className="teacher-card__name">
                    {p.prenom} {p.nom}
                  </h3>
                  <p className="teacher-card__specialite">
                    {p.specialite ? (
                      <>
                        <GraduationCap size={13} style={{ verticalAlign: '-2px', marginRight: '0.25rem' }} />
                        {p.specialite}
                      </>
                    ) : (
                      'Spécialité non renseignée'
                    )}
                  </p>
                </div>
                <div className="teacher-card__badge">
                  {p.utilisateur ? (
                    <span className="status-badge status-badge--success">PROFESSEUR</span>
                  ) : (
                    <span className="status-badge status-badge--warning">Sans compte</span>
                  )}
                </div>
              </div>

              <div className="teacher-card__contact">
                <div className="teacher-card__contact-row">
                  <Phone size={15} />
                  <span>{p.contact || 'Téléphone non renseigné'}</span>
                </div>
                <div className="teacher-card__contact-row">
                  <Mail size={15} />
                  <span title={p.utilisateur?.email}>{p.utilisateur?.email || 'Email non renseigné'}</span>
                </div>
              </div>

              <div>
                <p className="teacher-card__section-title">
                  Matières assignées ({p.matieres?.length || 0})
                </p>
                {p.matieres?.length > 0 ? (
                  <div className="teacher-card__matieres">
                    {groupMatieresByClasse(p.matieres).map(({ classe, items }) => (
                      <span
                        key={classe?.id ?? 'none'}
                        className="teacher-card__matiere"
                        title={items.map((m) => m.nom).join(', ')}
                      >
                        <GraduationCap size={11} />
                        <span className="teacher-card__matiere-class">{classe?.nom || '—'}</span>
                        <span className="teacher-card__matiere-sep">→</span>
                        {items.map((m) => m.nom).join(', ')}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="teacher-card__empty-matieres">Aucune matière assignée</span>
                )}
              </div>

              <div className="teacher-card__footer">
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  ID #{p.id}
                </span>
                <div className="teacher-card__actions">
                  <button type="button" className="action-btn action-btn--edit" title="Modifier" onClick={() => openModal(p)}>
                    <Edit size={16} />
                  </button>
                  <button type="button" className="action-btn action-btn--delete" title="Supprimer" onClick={() => handleDelete(p.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Modifier le professeur' : 'Ajouter un professeur'}</h2>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {message && (
                <div
                  style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: isSuccessMessage ? '#d1fae5' : '#fee2e2',
                    color: isSuccessMessage ? '#065f46' : '#991b1b',
                    fontSize: '0.9rem',
                  }}
                >
                  {message}
                </div>
              )}

              {!editingId && (
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                  Un compte utilisateur <strong>PROFESSEUR</strong> sera créé avec l&apos;email saisi.
                  Mot de passe par défaut : <strong>Prof2024</strong>
                </p>
              )}

              <form id="teacherForm" onSubmit={handleSubmit}>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Prénom</label>
                    <input
                      type="text"
                      value={form.prenom}
                      onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {!editingId ? (
                  <div className="modal-form-group">
                    <label>Adresse e-mail (identifiant de connexion)</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                ) : (
                  <div className="modal-form-group">
                    <label>Adresse e-mail</label>
                    <input type="email" value={form.email} disabled style={{ background: '#f1f5f9', color: '#64748b' }} />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>L&apos;email de connexion ne peut pas être modifié.</span>
                  </div>
                )}

                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Spécialité</label>
                    <input
                      type="text"
                      value={form.specialite}
                      onChange={(e) => setForm({ ...form, specialite: e.target.value })}
                      placeholder="Ex: Mathématiques"
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Téléphone</label>
                    <input
                      type="text"
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      placeholder="Ex: +224 620 000 000"
                    />
                  </div>
                </div>

                <div className="modal-form-group teacher-photo-upload">
                  <label>Photo du professeur</label>
                  <div className="teacher-photo-upload__row">
                    <div className="teacher-photo-upload__preview">
                      {form.photoUrl ? (
                        <img src={form.photoUrl} alt="Aperçu" />
                      ) : (
                        <span>{getInitials(form.prenom, form.nom)}</span>
                      )}
                    </div>
                    <div className="teacher-photo-upload__actions">
                      <input
                        type="file"
                        accept="image/*"
                        id="teacherPhotoInput"
                        onChange={handlePhotoChange}
                      />
                      <label htmlFor="teacherPhotoInput" className="teacher-photo-upload__btn">
                        Choisir une photo
                      </label>
                      {form.photoUrl && (
                        <button
                          type="button"
                          className="teacher-photo-upload__remove"
                          onClick={() => setForm({ ...form, photoUrl: '' })}
                        >
                          Supprimer la photo
                        </button>
                      )}
                      <p className="teacher-photo-upload__hint">JPG, PNG — max. 2 Mo. Visible sur la fiche et l&apos;espace professeur.</p>
                    </div>
                  </div>
                </div>

                <TeacherAssignmentPanel
                  assignView={assignView}
                  setAssignView={setAssignView}
                  classFilter={classFilter}
                  setClassFilter={setClassFilter}
                  classes={classes}
                  classesGrouped={classesGrouped}
                  matieresGrouped={matieresGrouped}
                  selectedMatieres={selectedMatieres}
                  form={form}
                  editingId={editingId}
                  handleMatiereToggle={handleMatiereToggle}
                  toggleMatiereGroup={toggleMatiereGroup}
                  isGroupFullySelected={isGroupFullySelected}
                />
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={closeModal}>
                Annuler
              </button>
              <button type="submit" form="teacherForm" className="btn-submit" disabled={submitting}>
                {submitting ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer le compte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
