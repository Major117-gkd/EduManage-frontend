import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Save, ChevronRight, Users, X, Trash2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';
import './ExcelTable.css';

const API = 'http://localhost:5000';

const PERIODES = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Semestre 1', 'Semestre 2'];
const TYPES_EVAL = ['Devoir', 'Composition', 'Interrogation', 'TP', 'Projet'];

export default function GradesPage() {
  const navigate = useNavigate();

  // Step 0: Select level
  const [selectedNiveau, setSelectedNiveau] = useState('');

  // Step 1: Select class
  const [classes, setClasses] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState(null);

  // Step 2: Select subject
  const [matieres, setMatieres] = useState([]);
  const [selectedMatiere, setSelectedMatiere] = useState(null);

  // Step 3: Select period & params
  const [periode, setPeriode] = useState('Trimestre 1');
  const [annee, setAnnee] = useState('2024-2025');

  // Step 4: Students + grades
  const [eleves, setEleves] = useState([]);
  const [grades, setGrades] = useState({}); // { eleveId: { valeur, appreciation } }
  const [savingIds, setSavingIds] = useState({});
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Load classes
  useEffect(() => {
    fetch(`${API}/api/admin/classes`).then(r => r.json()).then(d => { if (Array.isArray(d)) setClasses(d); }).catch(() => {});
  }, []);

  // Derived: unique levels from all classes
  const niveaux = [...new Set(classes.map(c => c.niveau))].sort();
  // Derived: classes filtered by selected level
  const classesFiltrees = selectedNiveau ? classes.filter(c => c.niveau === selectedNiveau) : [];

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
            const d1 = e.notes.find(n => n.type_evaluation === 'Devoir 1');
            const d2 = e.notes.find(n => n.type_evaluation === 'Devoir 2');
            const compo = e.notes.find(n => n.type_evaluation === 'Composition');
            const app = compo?.appreciation || d2?.appreciation || d1?.appreciation || '';
            g[e.eleveId] = {
              d1: d1 ? d1.valeur : '', d1Id: d1 ? d1.id : null,
              d2: d2 ? d2.valeur : '', d2Id: d2 ? d2.id : null,
              compo: compo ? compo.valeur : '', compoId: compo ? compo.id : null,
              appreciation: app
            };
          });
          setGrades(g);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  useEffect(() => { if (selectedMatiere) loadEleves(); }, [selectedMatiere, periode]);

  const handleGradeChange = (eleveId, field, value) => {
    if (field !== 'appreciation' && value !== '') {
      let num = parseFloat(value);
      if (num > 20) value = '20';
      if (num < 0) value = '0';
    }
    setGrades(g => ({ ...g, [eleveId]: { ...g[eleveId], [field]: value } }));
  };

  const handleSaveSingle = async (eleveId) => {
    const g = grades[eleveId];
    if (!g) return;
    setSavingIds(prev => ({ ...prev, [eleveId]: true }));
    setSaveMsg('');

    const saveNote = async (valeur, type, idToDelete) => {
      if (valeur === '' || valeur === null) {
        if (idToDelete) await fetch(`${API}/api/admin/notes/${idToDelete}`, { method: 'DELETE' }).catch(()=>{});
        return;
      }
      await fetch(`${API}/api/admin/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eleveId: eleveId,
          matiereId: selectedMatiere.id,
          valeur: parseFloat(valeur),
          type_evaluation: type,
          periode,
          annee_scolaire: annee,
          appreciation: g.appreciation || ''
        })
      });
    };

    try {
      await Promise.all([
        saveNote(g.d1, 'Devoir 1', g.d1Id),
        saveNote(g.d2, 'Devoir 2', g.d2Id),
        saveNote(g.compo, 'Composition', g.compoId)
      ]);
      setSaveMsg('Notes enregistrées avec succès !');
      loadEleves();
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Erreur lors de la sauvegarde.');
    }
    setSavingIds(prev => ({ ...prev, [eleveId]: false }));
  };

  const handleKeyDown = (e, index, field) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.getElementById(`input-${field}-${index + 1}`);
      if (nextInput) nextInput.focus();
      else if (e.key === 'Enter') handleSaveSingle(eleves[index].eleveId);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`input-${field}-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const getMoyenne = (eleveId) => {
    const g = grades[eleveId];
    if (!g) return '—';
    let sum = 0, count = 0;
    if (g.d1 !== '') { sum += parseFloat(g.d1); count++; }
    if (g.d2 !== '') { sum += parseFloat(g.d2); count++; }
    if (g.compo !== '') { sum += parseFloat(g.compo) * 2; count += 2; }
    return count > 0 ? (sum / count).toFixed(2) : '—';
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
        </div>
      </div>

      {saveMsg && (
        <div style={{ marginBottom: '1rem', padding: '0.85rem 1.25rem', borderRadius: '10px', background: !saveMsg.toLowerCase().includes('erreur') && !saveMsg.toLowerCase().includes('impossible') ? '#d1fae5' : '#fee2e2', color: !saveMsg.toLowerCase().includes('erreur') && !saveMsg.toLowerCase().includes('impossible') ? '#065f46' : '#991b1b', fontWeight: 500 }}>
          {saveMsg}
        </div>
      )}

      {/* STEP 1 - Select Level */}
      <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: selectedNiveau ? '#0A2F6B' : '#e2e8f0', color: selectedNiveau ? 'white' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>1</span>
            Sélectionner le Niveau
            {selectedNiveau && <span style={{ color: '#0A2F6B', fontWeight: 700 }}> — {selectedNiveau}</span>}
          </h2>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {niveaux.length === 0
            ? <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucune classe créée.</p>
            : niveaux.map(n => (
                <button key={n} onClick={() => { setSelectedNiveau(n); setSelectedClasse(null); setSelectedMatiere(null); setEleves([]); setGrades({}); }}
                  style={{
                    padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                    background: selectedNiveau === n ? '#0A2F6B' : 'white',
                    color: selectedNiveau === n ? 'white' : '#0f172a',
                    border: `2px solid ${selectedNiveau === n ? '#0A2F6B' : '#e2e8f0'}`,
                    transition: 'all 0.2s'
                  }}>
                  {n}
                </button>
              ))
          }
        </div>
      </div>

      {/* STEP 2 - Select Class */}
      {selectedNiveau && (
        <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: selectedClasse ? '#0A2F6B' : '#e2e8f0', color: selectedClasse ? 'white' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>2</span>
              Sélectionner la Classe
              {selectedClasse && <span style={{ color: '#0A2F6B', fontWeight: 700 }}> — {selectedClasse.nom}</span>}
            </h2>
          </div>
          <div style={{ padding: '1.25rem 1.5rem' }}>
            {classesFiltrees.length === 0
              ? <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucune classe pour ce niveau.</p>
              : <select
                  value={selectedClasse?.id || ''}
                  onChange={e => {
                    const c = classesFiltrees.find(x => x.id === parseInt(e.target.value));
                    if (c) selectClasse(c);
                  }}
                  style={{
                    width: '100%', maxWidth: '360px', padding: '0.65rem 1rem',
                    borderRadius: '10px', border: '2px solid #e2e8f0',
                    fontSize: '0.95rem', fontWeight: 600, color: '#0f172a',
                    background: 'white', cursor: 'pointer', outline: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  <option value="">-- Choisir une classe --</option>
                  {classesFiltrees.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
            }
          </div>
        </div>
      )}

      {/* STEP 3 - Select Subject */}
      {selectedClasse && (
        <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: selectedMatiere ? '#0A2F6B' : '#e2e8f0', color: selectedMatiere ? 'white' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>3</span>
              Sélectionner la Matière
              {selectedMatiere && <span style={{ color: '#0A2F6B', fontWeight: 700 }}> — {selectedMatiere.nom}</span>}
            </h2>
          </div>
          <div style={{ padding: '1.25rem 1.5rem' }}>
            {matieres.length === 0
              ? <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucune matière pour cette classe. Ajoutez-en une.</p>
              : <select
                  value={selectedMatiere?.id || ''}
                  onChange={e => {
                    const m = matieres.find(x => x.id === parseInt(e.target.value));
                    if (m) setSelectedMatiere(m);
                  }}
                  style={{
                    width: '100%', maxWidth: '360px', padding: '0.65rem 1rem',
                    borderRadius: '10px', border: '2px solid #e2e8f0',
                    fontSize: '0.95rem', fontWeight: 600, color: '#0f172a',
                    background: 'white', cursor: 'pointer', outline: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  <option value="">-- Choisir une matière --</option>
                  {matieres.map(m => (
                    <option key={m.id} value={m.id}>{m.nom} (Coeff. {m.coefficient})</option>
                  ))}
                </select>
            }
          </div>
        </div>
      )}

      {/* STEP 4 - Period/eval params */}
      {selectedMatiere && (
        <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#0A2F6B', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>4</span>
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
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}>({periode})</span>
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{eleves.length} élève(s) inscrits</span>
          </div>
          <div className="excel-table-container" style={{ margin: '0 1.5rem 1.5rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Chargement des élèves...</div>
            ) : eleves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontStyle: 'italic' }}>
                Aucun élève validé dans cette classe. Vérifiez les inscriptions.
              </div>
            ) : (
              <table className="excel-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}>#</th>
                    <th style={{ width: '80px' }}>Matricule</th>
                    <th>Nom & Prénom</th>
                    <th style={{ width: '75px', textAlign: 'center' }}>Devoir 1</th>
                    <th style={{ width: '75px', textAlign: 'center' }}>Devoir 2</th>
                    <th style={{ width: '75px', textAlign: 'center' }}>Compo</th>
                    <th style={{ minWidth: '120px' }}>Appréciation</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Moy.</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.map((e, i) => {
                    const g = grades[e.eleveId] || { d1: '', d2: '', compo: '', appreciation: '' };
                    const hasData = g.d1Id || g.d2Id || g.compoId;
                    const moy = getMoyenne(e.eleveId);
                    
                    return (
                      <tr key={e.eleveId} className={hasData ? 'selected-row' : ''}>
                        <td className="readonly-cell" style={{ textAlign: 'center' }}>{i + 1}</td>
                        <td className="readonly-cell">{e.matricule}</td>
                        <td className="readonly-cell" style={{ fontWeight: 600 }}>{e.nom} {e.prenom}</td>
                        <td>
                          <input
                            id={`input-d1-${i}`}
                            type="number" min="0" max="20" step="0.25"
                            className="excel-cell-input"
                            value={g.d1}
                            onChange={ev => handleGradeChange(e.eleveId, 'd1', ev.target.value)}
                            onKeyDown={ev => handleKeyDown(ev, i, 'd1')}
                            placeholder="—"
                            style={{ fontWeight: 700, color: g.d1 !== '' ? getMentionColor(g.d1) : '#0f172a', textAlign: 'center' }}
                          />
                        </td>
                        <td>
                          <input
                            id={`input-d2-${i}`}
                            type="number" min="0" max="20" step="0.25"
                            className="excel-cell-input"
                            value={g.d2}
                            onChange={ev => handleGradeChange(e.eleveId, 'd2', ev.target.value)}
                            onKeyDown={ev => handleKeyDown(ev, i, 'd2')}
                            placeholder="—"
                            style={{ fontWeight: 700, color: g.d2 !== '' ? getMentionColor(g.d2) : '#0f172a', textAlign: 'center' }}
                          />
                        </td>
                        <td>
                          <input
                            id={`input-compo-${i}`}
                            type="number" min="0" max="20" step="0.25"
                            className="excel-cell-input"
                            value={g.compo}
                            onChange={ev => handleGradeChange(e.eleveId, 'compo', ev.target.value)}
                            onKeyDown={ev => handleKeyDown(ev, i, 'compo')}
                            placeholder="—"
                            style={{ fontWeight: 700, color: g.compo !== '' ? getMentionColor(g.compo) : '#0f172a', textAlign: 'center', background: '#fdf4ff' }}
                          />
                        </td>
                        <td>
                          <input
                            id={`input-appreciation-${i}`}
                            type="text"
                            className="excel-cell-input"
                            value={g.appreciation}
                            onChange={ev => handleGradeChange(e.eleveId, 'appreciation', ev.target.value)}
                            onKeyDown={ev => handleKeyDown(ev, i, 'appreciation')}
                            placeholder="Globale..."
                          />
                        </td>
                        <td className="readonly-cell" style={{ textAlign: 'center' }}>
                          {moy !== '—' && (
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: getMentionColor(moy) }}>
                              {moy}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem', padding: '0 0.5rem', justifyContent: 'center' }}>
                            <button 
                              className="excel-action-btn"
                              onClick={() => handleSaveSingle(e.eleveId)}
                              disabled={savingIds[e.eleveId]}
                              title="Enregistrer"
                            >
                              <Save size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


