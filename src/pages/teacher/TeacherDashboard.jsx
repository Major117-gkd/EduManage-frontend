import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import { api } from '../../services/api';
import '../admin/AdminDashboard.css';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [professeur, setProfesseur] = useState(null);
  const [matieres, setMatieres] = useState([]);
  const [activeYear, setActiveYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/teacher/me'),
      api.get('/teacher/annees'),
      api.get('/teacher/matieres'),
    ])
      .then(([me, annees, cours]) => {
        setProfesseur(me.professeur);
        if (annees.active) setActiveYear(annees.active);
        if (Array.isArray(cours.matieres)) setMatieres(cours.matieres);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.data?.error || err.message || 'Impossible de charger vos données.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h1 className="admin-title">Espace Professeur</h1>
          {professeur && (
            <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
              Bienvenue, {professeur.prenom} {professeur.nom}
              {professeur.specialite ? ` — ${professeur.specialite}` : ''}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {!activeYear && !loading && (
        <div style={{ padding: '1rem', background: '#fef3c7', color: '#92400e', borderRadius: '8px', marginBottom: '1.5rem' }}>
          Aucune année scolaire active. Contactez l&apos;administration.
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="#0A2F6B" />
            Mes matières assignées
            {activeYear && (
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}>
                ({activeYear})
              </span>
            )}
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{matieres.length} matière(s)</span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chargement de vos cours...</div>
        ) : matieres.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
            Aucune matière ne vous a été assignée pour le moment.
          </div>
        ) : (
          <div className="teacher-courses-grid">
            {matieres.map((m) => (
              <button
                key={m.id}
                type="button"
                className="teacher-course-card"
                onClick={() => navigate(`/teacher/grades/${m.id}`)}
              >
                <div className="teacher-course-card__head">
                  <div className="teacher-course-card__icon">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="teacher-course-card__title">{m.nom}</h3>
                </div>
                <div className="teacher-course-card__class">
                  <Users size={16} />
                  {m.classe ? `${m.classe.nom} (${m.classe.niveau})` : 'Sans classe'}
                </div>
                <p className="teacher-course-card__cta">Saisir les notes →</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
