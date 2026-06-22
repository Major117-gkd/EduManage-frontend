import React, { useState, useEffect } from 'react';
import { School, Bell, Shield, Save, Globe, Mail, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';
import './SettingsPage.css';

const SITE_SETTINGS_KEY = 'edumanage_site_settings';

const emptySettings = () => ({
  nom_ecole: '',
  adresse: '',
  telephone: '',
  email_contact: '',
  devise: 'GNF',
  notif_inscriptions: true,
  notif_paiements: true,
  notif_notes: true,
  message_accueil: '',
  mail_enabled: false,
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: '',
  smtp_app_password: '',
  has_smtp_password: false,
});

export default function SettingsPage() {
  const [form, setForm] = useState(emptySettings());
  const [activeYear, setActiveYear] = useState('—');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingMail, setTestingMail] = useState(false);
  const [message, setMessage] = useState('');
  const [mailMessage, setMailMessage] = useState('');

  useEffect(() => {
    api.get('/admin/site-settings')
      .then((data) => {
        if (data.settings) {
          const next = { ...emptySettings(), ...data.settings, smtp_app_password: '' };
          setForm(next);
          localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(data.settings));
        }
        if (data.activeYear) setActiveYear(data.activeYear);
        setLoading(false);
      })
      .catch(() => {
        try {
          const cached = localStorage.getItem(SITE_SETTINGS_KEY);
          if (cached) setForm({ ...emptySettings(), ...JSON.parse(cached), smtp_app_password: '' });
        } catch {
          /* ignore */
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setMailMessage('');
    try {
      const payload = { ...form };
      if (!payload.smtp_app_password) {
        delete payload.smtp_app_password;
      }
      const data = await api.put('/admin/site-settings', payload);
      if (data.settings) {
        const next = { ...emptySettings(), ...data.settings, smtp_app_password: '' };
        setForm(next);
        localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(data.settings));
      }
      setMessage('Configuration enregistrée avec succès.');
    } catch (err) {
      localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(form));
      setMessage(err.data?.error
        ? `${err.data.error} (sauvegarde locale uniquement)`
        : 'Sauvegardé localement — exécutez la migration base de données pour la persistance serveur.');
    }
    setSaving(false);
  };

  const handleTestEmail = async () => {
    setTestingMail(true);
    setMailMessage('');
    try {
      if (form.smtp_app_password) {
        await api.put('/admin/site-settings', {
          ...form,
          mail_enabled: true,
        });
      }
      const data = await api.post('/admin/email/test', {
        to: form.email_contact || form.smtp_user || undefined,
      });
      setMailMessage(data.message || 'E-mail de test envoyé.');
    } catch (err) {
      setMailMessage(
        err.data?.details
          ? `${err.data.error || 'Échec'} — ${err.data.details}`
          : (err.data?.error || err.message || 'Impossible d\'envoyer l\'e-mail de test.')
      );
    }
    setTestingMail(false);
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <p style={{ color: '#64748b', padding: '2rem' }}>Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard settings-page">
      <div className="admin-dashboard__header">
        <div>
          <h1 className="admin-title">Paramètres du site</h1>
          <p className="settings-page__subtitle">
            Configuration de l&apos;établissement et de l&apos;application. Pour votre compte personnel, allez sur{' '}
            <Link to="/admin/profile">Mon profil</Link>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="settings-page__grid">
          <div className="admin-panel">
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">
                <School size={20} color="#0A2F6B" /> Informations de l&apos;établissement
              </h2>
            </div>
            <div className="settings-panel__body">
              <div className="modal-form-group">
                <label>Nom de l&apos;école</label>
                <input type="text" value={form.nom_ecole} onChange={(e) => setForm({ ...form, nom_ecole: e.target.value })} required />
              </div>
              <div className="modal-form-group">
                <label>Adresse</label>
                <input type="text" value={form.adresse || ''} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Conakry, Guinée" />
              </div>
              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label>Téléphone</label>
                  <input type="text" value={form.telephone || ''} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+224 620 000 000" />
                </div>
                <div className="modal-form-group">
                  <label>Email de contact (destinataire des messages du site)</label>
                  <input type="email" value={form.email_contact || ''} onChange={(e) => setForm({ ...form, email_contact: e.target.value })} placeholder="contact@gsp.edu" />
                </div>
              </div>
              <div className="modal-form-group">
                <label><Globe size={14} style={{ verticalAlign: '-2px', marginRight: '0.3rem' }} />Devise affichée</label>
                <select value={form.devise} onChange={(e) => setForm({ ...form, devise: e.target.value })}>
                  <option value="GNF">GNF (Franc guinéen)</option>
                  <option value="FCFA">FCFA</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="modal-form-group">
                <label>Message d&apos;accueil (portail public)</label>
                <textarea
                  rows={3}
                  value={form.message_accueil || ''}
                  onChange={(e) => setForm({ ...form, message_accueil: e.target.value })}
                  placeholder="Message affiché sur la page d'accueil..."
                  style={{ width: '100%', padding: '0.85rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          <div className="settings-page__side">
            <div className="admin-panel">
              <div className="admin-panel__header">
                <h2 className="admin-panel__title">
                  <Mail size={20} color="#0A2F6B" /> Envoi d&apos;e-mails (SMTP)
                </h2>
              </div>
              <div className="settings-panel__body settings-mail">
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(form.mail_enabled)}
                    onChange={(e) => setForm({ ...form, mail_enabled: e.target.checked })}
                  />
                  <span>Activer l&apos;envoi d&apos;e-mails</span>
                </label>
                <p className="settings-mail__hint">
                  Pour Gmail : activez la validation en 2 étapes, puis créez un{' '}
                  <strong>mot de passe d&apos;application</strong> (16 caractères) dans votre compte Google.
                </p>
                <div className="modal-form-group">
                  <label>Serveur SMTP</label>
                  <input
                    type="text"
                    value={form.smtp_host || 'smtp.gmail.com'}
                    onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Port</label>
                    <input
                      type="number"
                      value={form.smtp_port ?? 587}
                      onChange={(e) => setForm({ ...form, smtp_port: Number(e.target.value) || 587 })}
                    />
                  </div>
                  <div className="modal-form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.35rem' }}>
                    <label className="settings-toggle" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(form.smtp_secure)}
                        onChange={(e) => setForm({ ...form, smtp_secure: e.target.checked })}
                      />
                      <span>Connexion sécurisée (SSL)</span>
                    </label>
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>E-mail expéditeur (compte Gmail)</label>
                  <input
                    type="email"
                    value={form.smtp_user || ''}
                    onChange={(e) => setForm({ ...form, smtp_user: e.target.value })}
                    placeholder="votre.email@gmail.com"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Mot de passe d&apos;application</label>
                  <input
                    type="password"
                    value={form.smtp_app_password || ''}
                    onChange={(e) => setForm({ ...form, smtp_app_password: e.target.value })}
                    placeholder={form.has_smtp_password ? '•••••••••••••••• (déjà enregistré — laisser vide pour conserver)' : 'xxxx xxxx xxxx xxxx'}
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn--outline settings-mail__test-btn"
                  onClick={handleTestEmail}
                  disabled={testingMail || saving}
                >
                  <Send size={15} />
                  {testingMail ? 'Envoi en cours...' : 'Envoyer un e-mail de test'}
                </button>
                {mailMessage && (
                  <p className={`settings-mail__feedback${mailMessage.includes('succès') || mailMessage.includes('envoyé') ? ' settings-mail__feedback--ok' : ' settings-mail__feedback--err'}`}>
                    {mailMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="admin-panel">
              <div className="admin-panel__header">
                <h2 className="admin-panel__title">
                  <Bell size={20} color="#d97706" /> Notifications
                </h2>
              </div>
              <div className="settings-panel__body settings-toggles">
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={form.notif_inscriptions}
                    onChange={(e) => setForm({ ...form, notif_inscriptions: e.target.checked })}
                  />
                  <span>Alertes nouvelles inscriptions</span>
                </label>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={form.notif_paiements}
                    onChange={(e) => setForm({ ...form, notif_paiements: e.target.checked })}
                  />
                  <span>Alertes paiements en retard</span>
                </label>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={form.notif_notes}
                    onChange={(e) => setForm({ ...form, notif_notes: e.target.checked })}
                  />
                  <span>Alertes saisie / modification de notes</span>
                </label>
              </div>
            </div>

            <div className="admin-panel">
              <div className="admin-panel__header">
                <h2 className="admin-panel__title">
                  <Shield size={20} color="#059669" /> Système
                </h2>
              </div>
              <div className="settings-panel__body settings-system-info">
                {[['Version ERP', 'v1.0.0'], ['Base de données', 'PostgreSQL'], ['Année scolaire active', activeYear], ['Dernière mise à jour', new Date().toLocaleDateString('fr-FR')]].map(([k, v]) => (
                  <div key={k} className="settings-system-row">
                    <span>{k}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`settings-message${message.includes('succès') ? ' settings-message--success' : ' settings-message--error'}`}>
            {message}
          </div>
        )}

        <button type="submit" className="btn-submit settings-save-btn" disabled={saving}>
          <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
        </button>
      </form>
    </div>
  );
}
