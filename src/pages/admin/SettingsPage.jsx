import React, { useState } from 'react';
import { School, Lock, Bell, Shield, Save } from 'lucide-react';
import '../admin/AdminDashboard.css';

export default function SettingsPage() {
  const [schoolForm, setSchoolForm] = useState({ nom: 'GSP Elhadj Mamadou Saïdou Diallo', adresse: 'Conakry, Guinée', telephone: '', email: '' });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [saved, setSaved] = useState('');

  const handleSave = (section) => {
    setSaved(section);
    setTimeout(() => setSaved(''), 2000);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Paramètres</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

        {/* School Info */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><School size={20} color="#0A2F6B" /> Informations de l'Établissement</h2>
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
            <div className="modal-form-group"><label>Nom de l'école</label><input type="text" value={schoolForm.nom} onChange={e => setSchoolForm({...schoolForm, nom: e.target.value})} /></div>
            <div className="modal-form-group"><label>Adresse</label><input type="text" value={schoolForm.adresse} onChange={e => setSchoolForm({...schoolForm, adresse: e.target.value})} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="modal-form-group"><label>Téléphone</label><input type="text" value={schoolForm.telephone} onChange={e => setSchoolForm({...schoolForm, telephone: e.target.value})} placeholder="+224 620 000 000" /></div>
              <div className="modal-form-group"><label>Email</label><input type="email" value={schoolForm.email} onChange={e => setSchoolForm({...schoolForm, email: e.target.value})} placeholder="contact@gsp.edu" /></div>
            </div>
            <button className="btn-submit" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: 'fit-content' }} onClick={() => handleSave('school')}>
              <Save size={16} /> {saved === 'school' ? '✅ Enregistré !' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={20} color="#7c3aed" /> Changer le Mot de Passe</h2>
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
            <div className="modal-form-group"><label>Mot de passe actuel</label><input type="password" value={pwForm.current} onChange={e => setPwForm({...pwForm, current: e.target.value})} /></div>
            <div className="modal-form-group"><label>Nouveau mot de passe</label><input type="password" value={pwForm.next} onChange={e => setPwForm({...pwForm, next: e.target.value})} /></div>
            <div className="modal-form-group"><label>Confirmer le nouveau mot de passe</label><input type="password" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} /></div>
            <button className="btn-submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: 'fit-content' }} onClick={() => handleSave('password')}>
              <Save size={16} /> {saved === 'password' ? '✅ Mot de passe mis à jour !' : 'Changer le mot de passe'}
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={20} color="#059669" /> Informations Système</h2>
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gap: '0.75rem' }}>
            {[['Version ERP', 'v1.0.0'], ['Base de données', 'PostgreSQL (Docker)'], ['Année scolaire active', '2024-2025'], ['Dernière mise à jour', new Date().toLocaleDateString('fr-FR')]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{k}</span>
                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
