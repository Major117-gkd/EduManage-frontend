import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ChevronLeft } from 'lucide-react';
import '../admin/AdminDashboard.css';
import '../admin/ExcelTable.css';

const API = 'http://localhost:5000';

export default function TeacherGradesPage() {
  const { matiereId } = useParams();
  const navigate = useNavigate();
  const [eleves, setEleves] = useState([]);
  const [activeYear, setActiveYear] = useState('');
  const [form, setForm] = useState({ periode: 'Trimestre 1' });
  const [notes, setNotes] = useState({});
  const [submittingIds, setSubmittingIds] = useState({});
  const [message, setMessage] = useState('');

  const loadEleves = () => {
    if (activeYear) {
      fetch(`${API}/api/teacher/matieres/${matiereId}/eleves?annee_scolaire=${activeYear}`)
        .then(r => r.json())
        .then(data => {
          if (data.eleves) {
            setEleves(data.eleves);
            const initialNotes = {};
            data.eleves.forEach(el => {
              const d1 = el.notes?.find(n => n.type_evaluation === 'Devoir 1' && n.periode === form.periode && n.annee_scolaire === activeYear);
              const d2 = el.notes?.find(n => n.type_evaluation === 'Devoir 2' && n.periode === form.periode && n.annee_scolaire === activeYear);
              const compo = el.notes?.find(n => n.type_evaluation === 'Composition' && n.periode === form.periode && n.annee_scolaire === activeYear);
              const app = compo?.appreciation || d2?.appreciation || d1?.appreciation || '';
              initialNotes[el.id] = {
                d1: d1 ? d1.valeur : '', d1Id: d1 ? d1.id : null,
                d2: d2 ? d2.valeur : '', d2Id: d2 ? d2.id : null,
                compo: compo ? compo.valeur : '', compoId: compo ? compo.id : null,
                appreciation: app
              };
            });
            setNotes(initialNotes);
          }
        });
    }
  };

  useEffect(() => {
    fetch(`${API}/api/admin/annees`).then(r => r.json()).then(d => {
      const active = d.find(y => y.active);
      if (active) {
        setActiveYear(active.nom);
      }
    });
  }, [matiereId]);

  useEffect(() => {
    loadEleves();
  }, [activeYear, form.periode]);

  const handleNoteChange = (eleveId, field, value) => {
    if (field !== 'appreciation' && value !== '') {
      let num = parseFloat(value);
      if (num > 20) value = '20';
      if (num < 0) value = '0';
    }
    setNotes(prev => ({
      ...prev,
      [eleveId]: { ...prev[eleveId], [field]: value }
    }));
  };

  const handleSaveSingle = async (eleveId) => {
    const n = notes[eleveId];
    if (!n) return;
    setSubmittingIds(prev => ({ ...prev, [eleveId]: true }));
    setMessage('');

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
          matiereId: parseInt(matiereId),
          valeur: parseFloat(valeur),
          type_evaluation: type,
          periode: form.periode,
          annee_scolaire: activeYear,
          appreciation: n.appreciation || ''
        })
      });
    };

    try {
      await Promise.all([
        saveNote(n.d1, 'Devoir 1', n.d1Id),
        saveNote(n.d2, 'Devoir 2', n.d2Id),
        saveNote(n.compo, 'Composition', n.compoId)
      ]);
      setMessage('Notes enregistrées avec succès');
      loadEleves();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Erreur de connexion');
    }
    setSubmittingIds(prev => ({ ...prev, [eleveId]: false }));
  };

  const handleKeyDown = (e, index, field) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.getElementById(`input-${field}-${index + 1}`);
      if (nextInput) nextInput.focus();
      else if (e.key === 'Enter') handleSaveSingle(eleves[index].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`input-${field}-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const getMoyenne = (eleveId) => {
    const g = notes[eleveId];
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
        <div className="admin-panel" style={{ width: '100%' }}>
          <div className="admin-panel__header" style={{ display: 'flex', gap: '1rem', background: '#f8fafc' }}>
            <div style={{ flex: 1, maxWidth: '300px' }}>
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

          <div>
            <div className="excel-table-container">
              <table className="excel-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}>#</th>
                    <th style={{ width: '80px' }}>Matricule</th>
                    <th>Élève</th>
                    <th style={{ width: '75px', textAlign: 'center' }}>Devoir 1</th>
                    <th style={{ width: '75px', textAlign: 'center' }}>Devoir 2</th>
                    <th style={{ width: '75px', textAlign: 'center' }}>Compo</th>
                    <th style={{ minWidth: '120px' }}>Appréciation</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Moy.</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.length === 0 ? (
                    <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Aucun élève dans cette classe.</td></tr>
                  ) : (
                    eleves.map((el, i) => {
                      const g = notes[el.id] || { d1: '', d2: '', compo: '', appreciation: '' };
                      const hasData = g.d1Id || g.d2Id || g.compoId;
                      const moy = getMoyenne(el.id);

                      return (
                      <tr key={el.id} className={hasData ? 'selected-row' : ''}>
                        <td className="readonly-cell" style={{ textAlign: 'center' }}>{i + 1}</td>
                        <td className="readonly-cell">{el.matricule}</td>
                        <td className="readonly-cell" style={{ fontWeight: 600 }}>{el.nom} {el.prenom}</td>
                        <td>
                          <input 
                            id={`input-d1-${i}`}
                            type="number" 
                            step="0.25" min="0" max="20" 
                            className="excel-cell-input"
                            value={g.d1} 
                            onChange={e => handleNoteChange(el.id, 'd1', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, i, 'd1')}
                            placeholder="—"
                            style={{ fontWeight: 700, color: g.d1 !== '' ? getMentionColor(g.d1) : '#0f172a', textAlign: 'center' }}
                          />
                        </td>
                        <td>
                          <input 
                            id={`input-d2-${i}`}
                            type="number" 
                            step="0.25" min="0" max="20" 
                            className="excel-cell-input"
                            value={g.d2} 
                            onChange={e => handleNoteChange(el.id, 'd2', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, i, 'd2')}
                            placeholder="—"
                            style={{ fontWeight: 700, color: g.d2 !== '' ? getMentionColor(g.d2) : '#0f172a', textAlign: 'center' }}
                          />
                        </td>
                        <td>
                          <input 
                            id={`input-compo-${i}`}
                            type="number" 
                            step="0.25" min="0" max="20" 
                            className="excel-cell-input"
                            value={g.compo} 
                            onChange={e => handleNoteChange(el.id, 'compo', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, i, 'compo')}
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
                            onChange={e => handleNoteChange(el.id, 'appreciation', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, i, 'appreciation')}
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
                              onClick={() => handleSaveSingle(el.id)}
                              disabled={submittingIds[el.id]}
                              title="Enregistrer"
                            >
                              <Save size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
            
            {message && (
              <div style={{ margin: '1.5rem', padding: '1rem', borderRadius: '8px', background: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#dcfce7' : '#fee2e2', color: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#166534' : '#991b1b' }}>
                {message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


