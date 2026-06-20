import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, AlertCircle, TrendingUp, UserPlus, X, BarChart3, Activity, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import './Modal.css';

const API = 'http://localhost:5000';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ prenom: '', nom: '', date_naissance: '', adresse: '', classeId: '', annee_scolaire: '2024-2025' });
  const [teacherForm, setTeacherForm] = useState({ prenom: '', nom: '', matiere: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [teacherMessage, setTeacherMessage] = useState('');

  // Load classes for the dropdown
  useEffect(() => {
    fetch(`${API}/api/admin/classes`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setClasses(data); })
      .catch(() => {});
  }, []);

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setTeacherSubmitting(true);
    setTeacherMessage('');
    try {
      const res = await fetch(`${API}/api/admin/professeurs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherForm)
      });
      const data = await res.json();
      if (res.ok) {
        setTeacherMessage('Professeur ajouté avec succès !');
        setTeacherForm({ prenom: '', nom: '', matiere: '', email: '' });
        refreshData();
        setTimeout(() => { setIsTeacherModalOpen(false); setTeacherMessage(''); }, 1500);
      } else {
        setTeacherMessage('' + (data.error || 'Erreur'));
      }
    } catch {
      setTeacherMessage('Impossible de contacter le serveur');
    }
    setTeacherSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch(`${API}/api/admin/eleves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('' + data.message);
        setForm({ prenom: '', nom: '', date_naissance: '', adresse: '', classeId: '', annee_scolaire: '2024-2025' });
        refreshData();
        setTimeout(() => { setIsModalOpen(false); setMessage(''); }, 1500);
      } else {
        setMessage('' + (data.error || 'Erreur'));
      }
    } catch {
      setMessage('Impossible de contacter le serveur');
    }
    setSubmitting(false);
  };

  // --- LOAD STATS FROM API ---
  const [stats, setStats] = useState([
    { label: 'Total Élèves', value: '…', trend: '', icon: <Users size={24} color="#0A2F6B" />, bg: '#eff6ff' },
    { label: 'Professeurs', value: '…', trend: '', icon: <GraduationCap size={24} color="#7c3aed" />, bg: '#f3e8ff' },
    { label: 'Classes Actives', value: '…', trend: '', icon: <BookOpen size={24} color="#059669" />, bg: '#d1fae5' },
    { label: 'Inscriptions en attente', value: '…', trend: 'Action requise', icon: <AlertCircle size={24} color="#dc2626" />, bg: '#fee2e2' },
  ]);

  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [tauxReussite, setTauxReussite] = useState([]);
  const [chartData, setChartData] = useState({ studentsPerLevel: [], enrollmentsTrend: [] });

  useEffect(() => {
    // Fetch dashboard stats
    fetch(`${API}/api/admin/stats`)
      .then(r => r.json())
      .then(data => {
        setStats([
          { label: 'Total Élèves', value: data.eleves ?? '0', trend: 'Inscrits dans l\'école', icon: <Users size={24} color="#0A2F6B" />, bg: '#eff6ff' },
          { label: 'Professeurs', value: data.professeurs ?? '0', trend: 'Effectif enseignant', icon: <GraduationCap size={24} color="#7c3aed" />, bg: '#f3e8ff' },
          { label: 'Classes Actives', value: data.classes ?? '0', trend: 'Du primaire au lycée', icon: <BookOpen size={24} color="#059669" />, bg: '#d1fae5' },
          { label: 'Inscriptions en attente', value: data.inscriptionsEnAttente ?? '0', trend: 'Action requise', icon: <AlertCircle size={24} color="#dc2626" />, bg: '#fee2e2' },
        ]);
      })
      .catch(() => {});

    // Fetch recent registrations
    fetch(`${API}/api/admin/recent-registrations`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecentRegistrations(data); })
      .catch(() => {});

    // Fetch chart data
    fetch(`${API}/api/admin/chart-data`)
      .then(r => r.json())
      .then(data => { if (data.studentsPerLevel) setChartData(data); })
      .catch(() => {});

    // Fetch taux de réussite par niveau
    fetch(`${API}/api/admin/taux-reussite`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTauxReussite(data); })
      .catch(() => {});
  }, []);

  // Refresh after new student is added
  const refreshData = () => {
    fetch(`${API}/api/admin/stats`).then(r => r.json()).then(data => {
      setStats([
        { label: 'Total Élèves', value: data.eleves ?? '0', trend: 'Inscrits dans l\'école', icon: <Users size={24} color="#0A2F6B" />, bg: '#eff6ff' },
        { label: 'Professeurs', value: data.professeurs ?? '0', trend: 'Effectif enseignant', icon: <GraduationCap size={24} color="#7c3aed" />, bg: '#f3e8ff' },
        { label: 'Classes Actives', value: data.classes ?? '0', trend: 'Du primaire au lycée', icon: <BookOpen size={24} color="#059669" />, bg: '#d1fae5' },
        { label: 'Inscriptions en attente', value: data.inscriptionsEnAttente ?? '0', trend: 'Action requise', icon: <AlertCircle size={24} color="#dc2626" />, bg: '#fee2e2' },
      ]);
    }).catch(() => {});
    fetch(`${API}/api/admin/recent-registrations`).then(r => r.json()).then(data => { if (Array.isArray(data)) setRecentRegistrations(data); }).catch(() => {});
  };



  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Vue d'ensemble</h1>
        <button 
          className="btn btn--primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => setIsModalOpen(true)}
        >
          <UserPlus size={18} /> Nouvelle Inscription
        </button>
      </div>

      <div className="admin-stats__grid">
        {stats.map((stat, i) => (
          <div className="admin-stat-card" key={i}>
            <div className="admin-stat-card__icon" style={{ backgroundColor: stat.bg }}>
              {stat.icon}
            </div>
            <div className="admin-stat-card__info">
              <span className="admin-stat-card__label">{stat.label}</span>
              <span className="admin-stat-card__value">{stat.value}</span>
              <span className="admin-stat-card__trend">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard__grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
        {/* Chart 1: Enrollments Trend */}
        <div className="admin-panel" style={{ minWidth: 0 }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="#3b82f6" /> Évolution des inscriptions
            </h2>
          </div>
          <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData.enrollmentsTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInscriptions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="inscriptions" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorInscriptions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Students Per Level */}
        <div className="admin-panel" style={{ minWidth: 0 }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={20} color="#8b5cf6" /> Élèves par niveau
            </h2>
          </div>
          <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData.studentsPerLevel} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                <RechartsTooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="eleves" name="Élèves" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="admin-dashboard__grid">
        {/* Recent Registrations Table */}
        <div className="admin-panel admin-panel--large">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Dernières Inscriptions</h2>
            <a href="#" className="admin-panel__link">Voir tout</a>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>N° Dossier</th>
                  <th>Nom de l'élève</th>
                  <th>Classe demandée</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontStyle: 'italic' }}>
                      Aucune inscription pour le moment.
                    </td>
                  </tr>
                ) : (
                  recentRegistrations.map((reg) => (
                    <tr key={reg.id}>
                      <td>{reg.id}</td>
                      <td style={{ fontWeight: 500, color: '#0f172a' }}>{reg.name}</td>
                      <td>{reg.grade}</td>
                      <td>{reg.date}</td>
                      <td>
                        <span className={`status-badge status-badge--${reg.status === 'Validé' ? 'success' : 'warning'}`}>
                          {reg.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Accès Rapides</h2>
          </div>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => navigate('/admin/grades')}>
              <TrendingUp size={20} color="#0A2F6B" />
              <span style={{ flex: 1 }}>Saisir des notes</span>
              <ChevronRight size={16} color="#94a3b8" />
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/classes')}>
              <BookOpen size={20} color="#059669" />
              <span style={{ flex: 1 }}>Créer une classe</span>
              <ChevronRight size={16} color="#94a3b8" />
            </button>
            <button className="quick-action-btn" onClick={() => { setTeacherForm({ prenom: '', nom: '', matiere: '', email: '' }); setTeacherMessage(''); setIsTeacherModalOpen(true); }}>
              <GraduationCap size={20} color="#7c3aed" />
              <span style={{ flex: 1 }}>Ajouter un professeur</span>
              <ChevronRight size={16} color="#94a3b8" />
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/students')}>
              <Users size={20} color="#f59e0b" />
              <span style={{ flex: 1 }}>Gérer les élèves</span>
              <ChevronRight size={16} color="#94a3b8" />
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/years')}>
              <AlertCircle size={20} color="#ef4444" />
              <span style={{ flex: 1 }}>Années scolaires</span>
              <ChevronRight size={16} color="#94a3b8" />
            </button>
          </div>
        </div>
      </div>

      {/* Taux de réussite / échec par niveau */}
      <div className="admin-panel" style={{ marginTop: '1.5rem' }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Taux de réussite &amp; échec par niveau</h2>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Seuil de réussite : 10/20</span>
        </div>
        <div className="taux-grid">
          {tauxReussite.length === 0 ? (
            <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', padding: '1rem 0' }}>
              Aucune donnée disponible. Calculez d'abord les résultats depuis la page Notes &amp; Bulletins.
            </p>
          ) : (
            tauxReussite.map((t) => (
              <div className="taux-card" key={t.niveau}>
                <div className="taux-card__header">
                  <span className="taux-card__niveau">{t.niveau}</span>
                  <span className="taux-card__total">
                    <span className="taux-inscrits-num">{t.inscrits}</span> inscrits
                  </span>
                </div>

                <div className="taux-bar-group">
                  <div className="taux-bar-row">
                    <span className="taux-bar-label taux-bar-label--success">Réussite</span>
                    <div className="taux-bar-track">
                      <div
                        className="taux-bar-fill taux-bar-fill--success"
                        style={{ width: `${t.tauxReussite}%` }}
                      />
                    </div>
                    <span className="taux-bar-pct">{t.tauxReussite}%</span>
                  </div>
                  <div className="taux-bar-row">
                    <span className="taux-bar-label taux-bar-label--echec">Échec</span>
                    <div className="taux-bar-track">
                      <div
                        className="taux-bar-fill taux-bar-fill--echec"
                        style={{ width: `${t.tauxEchec}%` }}
                      />
                    </div>
                    <span className="taux-bar-pct">{t.tauxEchec}%</span>
                  </div>
                </div>

                <div className="taux-counts">
                  <span className="taux-count taux-count--success">{t.reussite} reçus</span>
                  <span className="taux-count taux-count--echec">{t.echec} échoués</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouvelle Inscription Élève</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {message && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#d1fae5' : '#fee2e2', color: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>
                  {message}
                </div>
              )}
              <form id="addStudentForm" onSubmit={handleSubmit}>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Prénom</label>
                    <input
                      type="text"
                      name="prenom"
                      value={form.prenom}
                      onChange={handleFormChange}
                      placeholder="Ex: Amadou"
                      required
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      name="nom"
                      value={form.nom}
                      onChange={handleFormChange}
                      placeholder="Ex: Diallo"
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Date de naissance</label>
                  <input
                    type="date"
                    name="date_naissance"
                    value={form.date_naissance}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label>Adresse (optionnel)</label>
                  <input
                    type="text"
                    name="adresse"
                    value={form.adresse}
                    onChange={handleFormChange}
                    placeholder="Ex: Quartier Almamya, Conakry"
                  />
                </div>

                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Affecter à une classe</label>
                    <select name="classeId" value={form.classeId} onChange={handleFormChange} required>
                      <option value="">Sélectionnez une classe</option>
                      {classes.length > 0 ? (
                        classes.map(c => (
                          <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>
                        ))
                      ) : (
                        <option disabled>Aucune classe disponible</option>
                      )}
                    </select>
                  </div>
                  <div className="modal-form-group">
                    <label>Année scolaire</label>
                    <input
                      type="text"
                      name="annee_scolaire"
                      value={form.annee_scolaire}
                      onChange={handleFormChange}
                      placeholder="Ex: 2024-2025"
                      required
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button type="submit" form="addStudentForm" className="btn-submit" disabled={submitting}>
                {submitting ? 'Enregistrement...' : "Confirmer l'inscription"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick-Add Teacher Modal */}
      {isTeacherModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTeacherModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ajouter un Professeur</h2>
              <button className="modal-close-btn" onClick={() => setIsTeacherModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {teacherMessage && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: !teacherMessage.toLowerCase().includes('erreur') && !teacherMessage.toLowerCase().includes('impossible') ? '#d1fae5' : '#fee2e2', color: !teacherMessage.toLowerCase().includes('erreur') && !teacherMessage.toLowerCase().includes('impossible') ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>
                  {teacherMessage}
                </div>
              )}
              <form id="addTeacherForm" onSubmit={handleTeacherSubmit}>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Prénom</label>
                    <input type="text" value={teacherForm.prenom} onChange={e => setTeacherForm({...teacherForm, prenom: e.target.value})} placeholder="Ex: Mamadou" required />
                  </div>
                  <div className="modal-form-group">
                    <label>Nom</label>
                    <input type="text" value={teacherForm.nom} onChange={e => setTeacherForm({...teacherForm, nom: e.target.value})} placeholder="Ex: Diallo" required />
                  </div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Matière enseignée</label>
                    <input type="text" value={teacherForm.matiere} onChange={e => setTeacherForm({...teacherForm, matiere: e.target.value})} placeholder="Ex: Mathématiques" required />
                  </div>
                  <div className="modal-form-group">
                    <label>Email (optionnel)</label>
                    <input type="email" value={teacherForm.email} onChange={e => setTeacherForm({...teacherForm, email: e.target.value})} placeholder="Ex: prof@ecole.com" />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsTeacherModalOpen(false)}>Annuler</button>
              <button type="submit" form="addTeacherForm" className="btn-submit" disabled={teacherSubmitting}>
                {teacherSubmitting ? 'Enregistrement...' : 'Ajouter le professeur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


