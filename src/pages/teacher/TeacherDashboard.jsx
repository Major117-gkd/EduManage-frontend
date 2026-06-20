import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Save, CheckCircle } from 'lucide-react';
import '../admin/AdminDashboard.css';

const API = 'http://localhost:5000';

export default function TeacherDashboard() {
  const [matieres, setMatieres] = useState([]);
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeYear, setActiveYear] = useState('');
  const [form, setForm] = useState({ type_evaluation: 'Devoir', periode: 'Trimestre 1' });
  const [notes, setNotes] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Simuler la récupération du token (à remplacer par le vrai JWT)
  // Pour l'instant on suppose que le backend peut identifier le prof, 
  // mais notre backend actuel filtre par id dans le token.
  // Assurez-vous que l'authentification passe bien le token.

  useEffect(() => {
    // 1. Récupérer l'année active
    fetch(`${API}/api/admin/annees`).then(r => r.json()).then(d => {
      const active = d.find(y => y.active);
      if (active) setActiveYear(active.nom);
    });

    // 2. Récupérer les matières du prof
    const token = localStorage.getItem('authToken');
    fetch(`${API}/api/teacher/matieres`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.matieres) setMatieres(d.matieres);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSelectMatiere = (m) => {
    setSelectedMatiere(m);
    setMessage('');
    setNotes({});
    if (activeYear) {
      const token = localStorage.getItem('authToken');
      fetch(`${API}/api/teacher/matieres/${m.id}/eleves?annee_scolaire=${activeYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.eleves) setEleves(data.eleves);
        });
    }
  };

  const handleNoteChange = (eleveId, field, value) => {
    setNotes(prev => ({
      ...prev,
      [eleveId]: { ...prev[eleveId], [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const notesToSubmit = eleves.map(el => ({
      eleveId: el.id,
      valeur: notes[el.id]?.valeur || 0,
      appreciation: notes[el.id]?.appreciation || ''
    }));

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API}/api/teacher/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matiereId: selectedMatiere.id,
          type_evaluation: form.type_evaluation,
          periode: form.periode,
          annee_scolaire: activeYear,
          notes: notesToSubmit
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('' + data.message);
        setNotes({});
      } else {
        setMessage('' + data.error);
      }
    } catch {
      setMessage('Erreur de connexion');
    }
    setSubmitting(false);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Espace Professeur</h1>
      </div>

      {!activeYear && !loading && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1.5rem' }}>
          Aucune année scolaire active n'est définie. Vous ne pouvez pas saisir de notes.
        </div>
      )}

      {/* ETAPE 1: Sélection de la classe/matière */}
      <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#0A2F6B', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>1</span>
            Mes Classes et Matières
          </h2>
        </div>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chargement de vos cours...</div>
        ) : matieres.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
            Aucune matière ne vous a été assignée pour le moment.
          </div>
        ) : (
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {matieres.map(m => (
              <div 
                key={m.id}
                onClick={() => handleSelectMatiere(m)}
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: selectedMatiere?.id === m.id ? '2px solid #0A2F6B' : '1px solid #cbd5e1',
                  background: selectedMatiere?.id === m.id ? '#f0f4ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedMatiere?.id === m.id ? '0 4px 12px rgba(10, 47, 107, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ background: '#e0e7ff', padding: '0.5rem', borderRadius: '8px', color: '#4338ca' }}>
                    <BookOpen size={20} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{m.nom}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                  <Users size={16} /> {m.classe ? m.classe.nom : 'Globale'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ETAPE 2: Saisie des notes (si une matière est sélectionnée) */}
      {selectedMatiere && (
        <div className="admin-panel" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="admin-panel__header" style={{ display: 'flex', gap: '1rem', background: '#f8fafc', flexWrap: 'wrap' }}>
            <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#0A2F6B', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>2</span>
              Saisie des notes : {selectedMatiere.nom} ({selectedMatiere.classe?.nom})
            </h2>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#64748b', marginBottom: '0.25rem' }}>Type d'évaluation</label>
              <select value={form.type_evaluation} onChange={e => setForm({...form, type_evaluation: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="Devoir">Devoir</option>
                <option value="Composition">Composition</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#64748b', marginBottom: '0.25rem' }}>Période</label>
              <select value={form.periode} onChange={e => setForm({...form, periode: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="Trimestre 1">Trimestre 1</option>
                <option value="Trimestre 2">Trimestre 2</option>
                <option value="Trimestre 3">Trimestre 3</option>
                <option value="Semestre 1">Semestre 1</option>
                <option value="Semestre 2">Semestre 2</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Élève</th>
                    <th style={{ width: '150px' }}>Note (/20)</th>
                    <th>Appréciation (Optionnel)</th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Aucun élève dans cette classe.</td></tr>
                  ) : (
                    eleves.map(el => (
                      <tr key={el.id}>
                        <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{el.matricule}</td>
                        <td style={{ fontWeight: 500, color: '#0f172a' }}>{el.prenom} {el.nom}</td>
                        <td>
                          <input 
                            type="number" 
                            step="0.25" 
                            min="0" 
                            max="20" 
                            required
                            value={notes[el.id]?.valeur ?? ''} 
                            onChange={e => handleNoteChange(el.id, 'valeur', e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', outlineColor: '#0A2F6B' }}
                            placeholder="Ex: 14.5"
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={notes[el.id]?.appreciation ?? ''} 
                            onChange={e => handleNoteChange(el.id, 'appreciation', e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', outlineColor: '#0A2F6B' }}
                            placeholder="Ex: Bon travail"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {message && (
              <div style={{ margin: '1.5rem', padding: '1rem', borderRadius: '8px', background: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#dcfce7' : '#fee2e2', color: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? <CheckCircle size={20} /> : null}
                {message}
              </div>
            )}

            <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn--primary" disabled={submitting || eleves.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={18} /> {submitting ? 'Enregistrement...' : 'Enregistrer les notes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


