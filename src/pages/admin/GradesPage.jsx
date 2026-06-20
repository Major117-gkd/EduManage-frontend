import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Save, ChevronRight, Users, X, Trash2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';

const API = 'http://localhost:5000';

const PERIODES = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Semestre 1', 'Semestre 2'];
const TYPES_EVAL = ['Devoir', 'Composition', 'Interrogation', 'TP', 'Projet'];

export default function GradesPage() {
  const navigate = useNavigate();

  // Step 1: Select class
  const [classes, setClasses] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState(null);

  // Step 2: Select subject
  const [matieres, setMatieres] = useState([]);
  const [selectedMatiere, setSelectedMatiere] = useState(null);

  // Step 3: Select period & eval type
  const [periode, setPeriode] = useState('Trimestre 1');
  const [typeEval, setTypeEval] = useState('Devoir');
  const [annee, setAnnee] = useState('2024-2025');

  // Step 4: Students + grades
  const [eleves, setEleves] = useState([]);
  const [grades, setGrades] = useState({}); // { eleveId: { valeur, appreciation } }
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Load classes
  useEffect(() => {
    fetch(`${API}/api/admin/classes`).then(r => r.json()).then(d => { if (Array.isArray(d)) setClasses(d); }).catch(() => {});
  }, []);

  // Load subjects when class is selected
  const selectClasse = (c) => {
    setSelectedClasse(c);
    setSelectedMatiere(null);
    setEleves([]);
    setGrades({});
    fetch(`${API}/api/admin/classes/${c.id}/matieres`).then(r => r.json()).then(d => { if (Array.isArray(d)) setMatieres(d); }).catch(() => {});
  };

  // Load students + grades when subject+period selected
  const loadEleves = () => {
    if (!selectedClasse || !selectedMatiere) return;
    setLoading(true);
    fetch(`${API}/api/admin/classes/${selectedClasse.id}/matieres/${selectedMatiere.id}/notes?periode=${encodeURIComponent(periode)}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEleves(data);
          const g = {};
          data.forEach(e => {
            const note = e.notes.find(n => n.type_evaluation === typeEval);
            g[e.eleveId] = { valeur: note ? note.valeur : '', appreciation: note ? (note.appreciation || '') : '', noteId: note ? note.id : null };
          });
          setGrades(g);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  useEffect(() => { if (selectedMatiere) loadEleves(); }, [selectedMatiere, periode, typeEval]);

  const handleGradeChange = (eleveId, field, value) => {
    setGrades(g => ({ ...g, [eleveId]: { ...g[eleveId], [field]: value } }));
  };

  const handleSaveAll = async () => {
    setSaving(true); setSaveMsg('');
    try {
      const promises = eleves.map(e => {
        const g = grades[e.eleveId];
        if (g.valeur === '' || g.valeur === null) return Promise.resolve();
        return fetch(`${API}/api/admin/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eleveId: e.eleveId,
            matiereId: selectedMatiere.id,
            valeur: parseFloat(g.valeur),
            type_evaluation: typeEval,
            periode,
            annee_scolaire: annee,
            appreciation: g.appreciation || ''
          })
        });
      });
      await Promise.all(promises);
      setSaveMsg('✅ Notes enregistrées avec succès !');
      loadEleves();
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('❌ Erreur lors de la sauvegarde.');
    }
    setSaving(false);
  };

  const getMoyenne = (eleveId) => {
    const vals = Object.values(grades[eleveId] || {});
    const v = parseFloat(grades[eleveId]?.valeur);
    return isNaN(v) ? '—' : v.toFixed(2);
  };

  const getMentionColor = (val) => {
    const v = parseFloat(val);
    if (isNaN(v)) return '#94a3b8';
    if (v >= 16) return '#059669';
    if (v >= 14) return '#10b981';
    if (v >= 10) return '#d97706';
    return '#dc2626';
  };

  const getMention = (val) => {
    const v = parseFloat(val);
    if (isNaN(v)) return '';
    if (v >= 16) return 'Très Bien';
    if (v >= 14) return 'Bien';
    if (v >= 12) return 'Assez Bien';
    if (v >= 10) return 'Passable';
    return 'Insuffisant';
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Saisie des Notes</h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {selectedClasse && (
            <button className="btn" style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => navigate('/admin/grades/results')}>
              <BarChart3 size={18} /> Voir les bulletins
            </button>
          )}
          {selectedClasse && eleves.length > 0 && (
            <button className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={handleSaveAll} disabled={saving}>
              <Save size={18} /> {saving ? 'Sauvegarde...' : 'Enregistrer les notes'}
            </button>
          )}
        </div>
      </div>

      {saveMsg && (
        <div style={{ marginBottom: '1rem', padding: '0.85rem 1.25rem', borderRadius: '10px', background: saveMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: saveMsg.startsWith('✅') ? '#065f46' : '#991b1b', fontWeight: 500 }}>
          {saveMsg}
        </div>
      )}

      {/* STEP 1 - Select Class */}
      <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: selectedClasse ? '#0A2F6B' : '#e2e8f0', color: selectedClasse ? 'white' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>1</span>
            Sélectionner la Classe
            {selectedClasse && <span style={{ color: '#0A2F6B', fontWeight: 700 }}> — {selectedClasse.nom}</span>}
          </h2>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {classes.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucune classe. Créez d'abord des classes.</p>}
          {classes.map(c => (
            <button key={c.id}
              onClick={() => selectClasse(c)}
              style={{
                padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem',
                background: selectedClasse?.id === c.id ? '#0A2F6B' : 'white',
                color: selectedClasse?.id === c.id ? 'white' : '#0f172a',
                border: `2px solid ${selectedClasse?.id === c.id ? '#0A2F6B' : '#e2e8f0'}`,
              }}>
              {c.nom}
              <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 400, opacity: 0.75 }}>{c.niveau}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 2 - Select Subject */}
      {selectedClasse && (
        <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: selectedMatiere ? '#0A2F6B' : '#e2e8f0', color: selectedMatiere ? 'white' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>2</span>
              Sélectionner la Matière
              {selectedMatiere && <span style={{ color: '#0A2F6B', fontWeight: 700 }}> — {selectedMatiere.nom}</span>}
            </h2>
          </div>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {matieres.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucune matière pour cette classe. Ajoutez-en une.</p>}
            {matieres.map(m => (
              <button key={m.id}
                onClick={() => setSelectedMatiere(m)}
                style={{
                  padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem',
                  background: selectedMatiere?.id === m.id ? '#8b5cf6' : 'white',
                  color: selectedMatiere?.id === m.id ? 'white' : '#0f172a',
                  border: `2px solid ${selectedMatiere?.id === m.id ? '#8b5cf6' : '#e2e8f0'}`,
                }}>
                {m.nom}
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 400, opacity: 0.75 }}>Coeff. {m.coefficient}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3 - Select period, type, year */}
      {selectedMatiere && (
        <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#0A2F6B', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>3</span>
              Paramètres de l'évaluation
            </h2>
          </div>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="modal-form-group" style={{ marginBottom: 0, minWidth: 160 }}>
              <label>Période</label>
              <select value={periode} onChange={e => setPeriode(e.target.value)}>
                {PERIODES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="modal-form-group" style={{ marginBottom: 0, minWidth: 160 }}>
              <label>Type d'évaluation</label>
              <select value={typeEval} onChange={e => setTypeEval(e.target.value)}>
                {TYPES_EVAL.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="modal-form-group" style={{ marginBottom: 0, minWidth: 140 }}>
              <label>Année scolaire</label>
              <input type="text" value={annee} onChange={e => setAnnee(e.target.value)} placeholder="2024-2025" />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 - Grade table */}
      {selectedMatiere && (
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#0A2F6B" />
              Élèves de {selectedClasse.nom} — {selectedMatiere.nom}
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}>({periode} · {typeEval})</span>
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{eleves.length} élève(s) inscrits</span>
          </div>
          <div className="table-responsive">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Chargement des élèves...</div>
            ) : eleves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontStyle: 'italic' }}>
                Aucun élève validé dans cette classe. Vérifiez les inscriptions.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Matricule</th>
                    <th>Nom & Prénom</th>
                    <th style={{ minWidth: 130 }}>Note /20</th>
                    <th style={{ minWidth: 180 }}>Appréciation</th>
                    <th>Mention</th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.map((e, i) => {
                    const g = grades[e.eleveId] || { valeur: '', appreciation: '' };
                    const v = parseFloat(g.valeur);
                    return (
                      <tr key={e.eleveId} style={{ background: grades[e.eleveId]?.noteId ? '#f0fdf4' : 'transparent' }}>
                        <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{e.matricule}</td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{e.nom} {e.prenom}</td>
                        <td>
                          <input
                            type="number" min="0" max="20" step="0.25"
                            value={g.valeur}
                            onChange={ev => handleGradeChange(e.eleveId, 'valeur', ev.target.value)}
                            placeholder="—"
                            style={{
                              width: 90, padding: '0.4rem 0.6rem', borderRadius: '6px',
                              border: `2px solid ${!isNaN(v) ? getMentionColor(v) : '#e2e8f0'}`,
                              fontWeight: 700, fontSize: '1rem', color: getMentionColor(v),
                              outline: 'none', background: 'white', textAlign: 'center'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={g.appreciation}
                            onChange={ev => handleGradeChange(e.eleveId, 'appreciation', ev.target.value)}
                            placeholder="Commentaire..."
                            style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', background: 'white' }}
                          />
                        </td>
                        <td>
                          {!isNaN(v) && (
                            <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: getMentionColor(v) + '18', color: getMentionColor(v) }}>
                              {getMention(v)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {eleves.length > 0 && (
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleSaveAll} disabled={saving}>
                <Save size={16} /> {saving ? 'Sauvegarde...' : 'Enregistrer toutes les notes'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
