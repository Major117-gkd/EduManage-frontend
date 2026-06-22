import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import {
  User,
  Lock,
  Save,
  Sun,
  Moon,
  Mail,
  Phone,
  GraduationCap,
  Camera,
  Shield,
  Calendar,
  Hash,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { api } from '../services/api';
import './admin/AdminDashboard.css';
import './admin/Modal.css';
import './ProfilePage.css';

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0]?.slice(0, 2).toUpperCase() || 'U';
}

function getRoleLabel(role) {
  if (role === 'ADMIN') return 'Administrateur';
  if (role === 'PROFESSEUR') return 'Professeur';
  return role || 'Utilisateur';
}

function formatMemberSince(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const isTeacher = user?.role === 'PROFESSEUR';
  const photoInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [memberSince, setMemberSince] = useState(null);

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    specialite: '',
    contact: '',
    photoUrl: '',
  });

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  const displayName = useMemo(() => {
    if (isTeacher) {
      const full = `${form.prenom} ${form.nom}`.trim();
      return full || form.nom || user?.nom || 'Mon profil';
    }
    return form.nom || user?.nom || 'Mon profil';
  }, [form.nom, form.prenom, isTeacher, user?.nom]);

  const roleLabel = getRoleLabel(user?.role);

  useEffect(() => {
    api.get('/me')
      .then((data) => {
        const photo = data.user?.photoUrl || data.professeur?.photoUrl || '';
        setMemberSince(data.user?.createdAt || null);

        if (isTeacher && data.professeur) {
          setForm({
            nom: data.professeur.nom || '',
            prenom: data.professeur.prenom || '',
            email: data.user?.email || '',
            specialite: data.professeur.specialite || '',
            contact: data.professeur.contact || '',
            photoUrl: photo,
          });
        } else {
          setForm({
            nom: data.user?.nom || '',
            prenom: '',
            email: data.user?.email || '',
            specialite: '',
            contact: '',
            photoUrl: photo,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isTeacher]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!pwMessage) return undefined;
    const timer = setTimeout(() => setPwMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [pwMessage]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Veuillez sélectionner une image (JPG, PNG, WebP ou GIF).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('La photo ne doit pas dépasser 2 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setForm((prev) => ({ ...prev, photoUrl: reader.result }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const data = await api.put('/me', form);
      if (data.user) updateUser(data.user);
      if (data.professeur && isTeacher) {
        setForm((prev) => ({
          ...prev,
          nom: data.professeur.nom || prev.nom,
          prenom: data.professeur.prenom || prev.prenom,
          specialite: data.professeur.specialite || '',
          contact: data.professeur.contact || '',
          photoUrl: data.user?.photoUrl || prev.photoUrl,
        }));
      }
      setMessage('Profil enregistré avec succès.');
    } catch (err) {
      setMessage(err.data?.error || err.message || 'Erreur lors de la sauvegarde.');
    }
    setSaving(false);
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwMessage('');
    if (pwForm.next !== pwForm.confirm) {
      setPwMessage('Les mots de passe ne correspondent pas.');
      return;
    }
    if (pwForm.next.length < 6) {
      setPwMessage('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/me/password', {
        current_password: pwForm.current,
        new_password: pwForm.next,
      });
      setPwMessage('Mot de passe mis à jour avec succès.');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwMessage(err.data?.error || err.message || 'Erreur lors de la mise à jour.');
    }
    setPwSaving(false);
  };

  if (loading) {
    return (
      <div className="admin-dashboard profile-page">
        <div className="profile-skeleton profile-skeleton--hero" />
        <div className="profile-page__grid">
          <div className="profile-skeleton profile-skeleton--card" />
          <div className="profile-page__side">
            <div className="profile-skeleton profile-skeleton--card profile-skeleton--short" />
            <div className="profile-skeleton profile-skeleton--card profile-skeleton--short" />
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = (text) => /succès/i.test(text);

  return (
    <div className="admin-dashboard profile-page">
      <section className="profile-hero">
        <div className="profile-hero__bg" aria-hidden />
        <div className="profile-hero__content">
          <div className="profile-hero__avatar-wrap">
            <div className="profile-hero__avatar">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="" />
              ) : (
                <span>{getInitials(displayName)}</span>
              )}
            </div>
            <button
              type="button"
              className="profile-hero__camera"
              onClick={() => photoInputRef.current?.click()}
              title="Changer la photo"
              aria-label="Changer la photo de profil"
            >
              <Camera size={16} />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={handlePhotoChange}
            />
          </div>

          <div className="profile-hero__info">
            <span className={`profile-hero__badge profile-hero__badge--${(user?.role || '').toLowerCase()}`}>
              {roleLabel}
            </span>
            <h1 className="profile-hero__name">{displayName}</h1>
            <p className="profile-hero__email">
              <Mail size={15} />
              {form.email}
            </p>
            {isTeacher && form.specialite && (
              <p className="profile-hero__meta">
                <GraduationCap size={15} />
                {form.specialite}
              </p>
            )}
          </div>

          <div className="profile-hero__actions">
            {form.photoUrl && (
              <button
                type="button"
                className="profile-hero__link-btn"
                onClick={() => setForm((prev) => ({ ...prev, photoUrl: '' }))}
              >
                Retirer la photo
              </button>
            )}
            <span className="profile-hero__hint">JPG, PNG, WebP — max. 2 Mo</span>
          </div>
        </div>
      </section>

      <div className="profile-page__grid">
        <div className="admin-panel profile-card">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              <User size={20} color="#0A2F6B" />
              Informations personnelles
            </h2>
          </div>
          <form className="profile-card__body" onSubmit={handleProfileSave}>
            {message && (
              <div className={`profile-alert${isSuccess(message) ? ' profile-alert--success' : ' profile-alert--error'}`} role="status">
                {isSuccess(message) ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{message}</span>
              </div>
            )}

            {isTeacher ? (
              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label htmlFor="profile-prenom">Prénom</label>
                  <input
                    id="profile-prenom"
                    type="text"
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="profile-nom">Nom</label>
                  <input
                    id="profile-nom"
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>
            ) : (
              <div className="modal-form-group">
                <label htmlFor="profile-nom">Nom affiché</label>
                <input
                  id="profile-nom"
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div className="modal-form-group">
              <label htmlFor="profile-email">
                <Mail size={14} aria-hidden />
                Adresse email
              </label>
              <input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            {isTeacher && (
              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label htmlFor="profile-specialite">
                    <GraduationCap size={14} aria-hidden />
                    Spécialité
                  </label>
                  <input
                    id="profile-specialite"
                    type="text"
                    value={form.specialite}
                    onChange={(e) => setForm({ ...form, specialite: e.target.value })}
                    placeholder="Ex. Mathématiques"
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="profile-contact">
                    <Phone size={14} aria-hidden />
                    Téléphone
                  </label>
                  <input
                    id="profile-contact"
                    type="tel"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    placeholder="+224 620 00 00 00"
                    autoComplete="tel"
                  />
                </div>
              </div>
            )}

            <div className="profile-card__footer">
              <button type="submit" className="btn-submit profile-save-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="profile-spin" /> : <Save size={16} />}
                {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>

        <div className="profile-page__side">
          <div className="admin-panel profile-card">
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">
                <Lock size={20} color="#7c3aed" />
                Sécurité
              </h2>
            </div>
            <form className="profile-card__body" onSubmit={handlePasswordSave}>
              {pwMessage && (
                <div className={`profile-alert${isSuccess(pwMessage) ? ' profile-alert--success' : ' profile-alert--error'}`} role="status">
                  {isSuccess(pwMessage) ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{pwMessage}</span>
                </div>
              )}
              <div className="modal-form-group">
                <label htmlFor="pw-current">Mot de passe actuel</label>
                <input
                  id="pw-current"
                  type="password"
                  value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="modal-form-group">
                <label htmlFor="pw-next">Nouveau mot de passe</label>
                <input
                  id="pw-next"
                  type="password"
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="modal-form-group">
                <label htmlFor="pw-confirm">Confirmer le mot de passe</label>
                <input
                  id="pw-confirm"
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className="btn-submit profile-save-btn profile-save-btn--secondary" disabled={pwSaving}>
                {pwSaving ? <Loader2 size={16} className="profile-spin" /> : <Shield size={16} />}
                {pwSaving ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          </div>

          <div className="admin-panel profile-card">
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">
                {isDarkMode ? <Moon size={20} color="#818cf8" /> : <Sun size={20} color="#f59e0b" />}
                Apparence
              </h2>
            </div>
            <div className="profile-card__body profile-appearance">
              <p className="profile-appearance__hint">
                Choisissez le thème de l&apos;interface admin.
              </p>
              <div className="profile-theme-switch">
                <button
                  type="button"
                  className={`profile-theme-switch__option${!isDarkMode ? ' is-active' : ''}`}
                  onClick={() => isDarkMode && toggleTheme()}
                >
                  <Sun size={18} />
                  Clair
                </button>
                <button
                  type="button"
                  className={`profile-theme-switch__option${isDarkMode ? ' is-active' : ''}`}
                  onClick={() => !isDarkMode && toggleTheme()}
                >
                  <Moon size={18} />
                  Sombre
                </button>
              </div>
            </div>
          </div>

          <div className="admin-panel profile-card">
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Détails du compte</h2>
            </div>
            <div className="profile-card__body profile-account-meta">
              <div className="profile-account-meta__item">
                <span className="profile-account-meta__label">
                  <Shield size={15} />
                  Rôle
                </span>
                <strong>{roleLabel}</strong>
              </div>
              <div className="profile-account-meta__item">
                <span className="profile-account-meta__label">
                  <Hash size={15} />
                  Identifiant
                </span>
                <strong>#{user?.id}</strong>
              </div>
              <div className="profile-account-meta__item">
                <span className="profile-account-meta__label">
                  <Calendar size={15} />
                  Membre depuis
                </span>
                <strong>{formatMemberSince(memberSince)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
