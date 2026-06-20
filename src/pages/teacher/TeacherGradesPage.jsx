import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ChevronLeft } from 'lucide-react';
import '../admin/AdminDashboard.css';

const API = 'http://localhost:5000';

export default function TeacherGradesPage() {
  const { matiereId } = useParams();
  const navigate = useNavigate();
  const [eleves, setEleves] = useState([]);
  const [activeYear, setActiveYear] = useState('');
  const [form, setForm] = useState({ type_evaluation: 'Devoir', periode: 'Trimestre 1' });
  const [notes, setNotes] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API}/api/admin/annees`).then(r => r.json()).then(d => {
      const active = d.find(y => y.active);
      if (active) {
        setActiveYear(active.nom);
        fetch(`${API}/api/teacher/matieres/${matiereId}/eleves?annee_scolaire=${active.nom}`)
          .then(r => r.json())
          .then(data => {
            if (data.eleves) setEleves(data.eleves);
          });
      }
    });
  }, [matiereId]);

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
      const res = await fetch(`${API}/api/teacher/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matiereId,
          type_evaluation: form.type_evaluation,
          periode: form.periode,
          annee_scolaire: activeYear,
          notes: notesToSubmit
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('✅ ' + data.message);
        setNotes({});
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch {
      setMessage('❌ Erreur de connexion');
    }
    setSubmitting(false);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/teacher')} className="btn" style={{ background: 'white', border: '1px solid #cbd5e1' }}>
            <ChevronLeft size={18} /> Retour
          </button>
          <h1 className="admin-title">Saisie des Notes</h1>
        </div>
      </div>

      {!activeYear ? (
        <div style={{ padding: '1.5rem', background: '#fee2e2', color: '#991b1b', borderRadius: '12px' }}>
          L'administration n'a défini aucune année scolaire active.
        </div>
      ) : (
        <div className="admin-panel" style={{ maxWidth: '900px' }}>
          <div className="admin-panel__header" style={{ display: 'flex', gap: '1rem', background: '#f8fafc' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#64748b', marginBottom: '0.25rem' }}>Type d'évaluation</label>
              <select value={form.type_evaluation} onChange={e => setForm({...form, type_evaluation: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="Devoir">Devoir</option>
                <option value="Composition">Composition</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
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
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Aucun élève dans cette classe.</td></tr>
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
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            placeholder="Ex: 14.5"
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={notes[el.id]?.appreciation ?? ''} 
                            onChange={e => handleNoteChange(el.id, 'appreciation', e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
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
              <div style={{ margin: '1.5rem', padding: '1rem', borderRadius: '8px', background: message.startsWith('✅') ? '#dcfce7' : '#fee2e2', color: message.startsWith('✅') ? '#166534' : '#991b1b' }}>
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
