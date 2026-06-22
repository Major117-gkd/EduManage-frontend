import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { refreshNotifications } from '../../components/NotificationBell';
import '../admin/AdminDashboard.css';
import '../admin/ExcelTable.css';
import { api } from '../../services/api';

export default function TeacherGradesPage() {
  const { matiereId } = useParams();
  const navigate = useNavigate();
  const [matiere, setMatiere] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [activeYear, setActiveYear] = useState('');
  const [form, setForm] = useState({ periode: 'Trimestre 1' });
  const [notes, setNotes] = useState({});
  const [submittingIds, setSubmittingIds] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const loadEleves = () => {
    if (!activeYear || accessDenied) return;

    const params = new URLSearchParams({
      annee_scolaire: activeYear,
      periode: form.periode,
    });

    api
      .get(`/teacher/matieres/${matiereId}/eleves?${params}`)
      .then((data) => {
        if (data.matiere) setMatiere(data.matiere);
        if (data.eleves) {
          setEleves(data.eleves);
          const initialNotes = {};
          data.eleves.forEach((el) => {
            const d1 = el.notes?.find(
              (n) =>
                n.type_evaluation === 'Devoir 1' &&
                n.periode === form.periode &&
                n.annee_scolaire === activeYear
            );
            const d2 = el.notes?.find(
              (n) =>
                n.type_evaluation === 'Devoir 2' &&
                n.periode === form.periode &&
                n.annee_scolaire === activeYear
            );
            const compo = el.notes?.find(
              (n) =>
                n.type_evaluation === 'Composition' &&
                n.periode === form.periode &&
                n.annee_scolaire === activeYear
            );
            const app = compo?.appreciation || d2?.appreciation || d1?.appreciation || '';
            initialNotes[el.id] = {
              d1: d1 ? d1.valeur : '',
              d1Id: d1 ? d1.id : null,
              d2: d2 ? d2.valeur : '',
              d2Id: d2 ? d2.id : null,
              compo: compo ? compo.valeur : '',
              compoId: compo ? compo.id : null,
              appreciation: app,
            };
          });
          setNotes(initialNotes);
        }
      })
      .catch((err) => {
        if (err.status === 403) {
          setAccessDenied(true);
        }
      });
  };

  useEffect(() => {
    setLoading(true);
    setAccessDenied(false);

    api
      .get(`/teacher/matieres/${matiereId}`)
      .then((data) => {
        setMatiere(data.matiere);
        return api.get('/teacher/annees');
      })
      .then((annees) => {
        if (annees.active) setActiveYear(annees.active);
        setLoading(false);
      })
      .catch((err) => {
        if (err.status === 403) setAccessDenied(true);
        setLoading(false);
      });
  }, [matiereId]);

  useEffect(() => {
    if (activeYear && !accessDenied) loadEleves();
  }, [activeYear, form.periode, accessDenied]);

  const handleNoteChange = (eleveId, field, value) => {
    if (field !== 'appreciation' && value !== '') {
      let num = parseFloat(value);
      if (num > 20) value = '20';
      if (num < 0) value = '0';
    }
    setNotes((prev) => ({
      ...prev,
      [eleveId]: { ...prev[eleveId], [field]: value },
    }));
  };

  const handleSaveSingle = async (eleveId) => {
    const n = notes[eleveId];
    if (!n) return;
    setSubmittingIds((prev) => ({ ...prev, [eleveId]: true }));
    setMessage('');

    try {
      await api.post('/teacher/notes/eleve', {
        eleveId,
        matiereId: parseInt(matiereId, 10),
        periode: form.periode,
        annee_scolaire: activeYear,
        d1: n.d1,
        d2: n.d2,
        compo: n.compo,
        d1Id: n.d1Id,
        d2Id: n.d2Id,
        compoId: n.compoId,
        appreciation: n.appreciation || '',
      });
      setMessage('Notes enregistrées — notification envoyée');
      refreshNotifications();
      loadEleves();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.data?.error || err.message || 'Erreur de connexion');
    }
    setSubmittingIds((prev) => ({ ...prev, [eleveId]: false }));
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
    let sum = 0;
    let count = 0;
    if (g.d1 !== '') {
      sum += parseFloat(g.d1);
      count++;
    }
    if (g.d2 !== '') {
      sum += parseFloat(g.d2);
      count++;
    }
    if (g.compo !== '') {
      sum += parseFloat(g.compo) * 2;
      count += 2;
    }
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

  if (accessDenied) {
    return (
      <div className="admin-dashboard">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#991b1b', marginBottom: '1rem' }}>
            Cette matière ne vous est pas assignée. Vous ne pouvez voir que vos propres cours.
          </p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/teacher')}>
            Retour à mes cours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div className="page-header-with-back">
          <button
            type="button"
            onClick={() => navigate('/teacher')}
            className="page-back-btn"
            aria-label="Retour à mes cours"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
            <span className="page-back-btn__label">Mes cours</span>
          </button>
          <div className="page-header-with-back__text">
            <h1 className="admin-title">Saisie des notes</h1>
            {matiere && (
              <p className="page-header-with-back__subtitle">
                {matiere.nom}
                {matiere.classe ? ` — ${matiere.classe.nom}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={24} className="spin" style={{ margin: '0 auto 0.5rem' }} />
          Chargement...
        </div>
      ) : !activeYear ? (
        <div style={{ padding: '1.5rem', background: '#fee2e2', color: '#991b1b', borderRadius: '12px' }}>
          L&apos;administration n&apos;a défini aucune année scolaire active.
        </div>
      ) : (
        <div className="admin-panel" style={{ width: '100%' }}>
          <div className="admin-panel__header" style={{ display: 'flex', gap: '1rem', background: '#f8fafc' }}>
            <div style={{ flex: 1, maxWidth: '300px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#64748b', marginBottom: '0.25rem' }}>
                Période
              </label>
              <select
                value={form.periode}
                onChange={(e) => setForm({ ...form, periode: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="Trimestre 1">Trimestre 1</option>
                <option value="Trimestre 2">Trimestre 2</option>
                <option value="Trimestre 3">Trimestre 3</option>
                <option value="Semestre 1">Semestre 1</option>
                <option value="Semestre 2">Semestre 2</option>
              </select>
            </div>
            <div style={{ flex: 1, maxWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#64748b', marginBottom: '0.25rem' }}>
                Année
              </label>
              <input
                type="text"
                value={activeYear}
                disabled
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9' }}
              />
            </div>
          </div>

          <div className="excel-table-container" style={{ margin: '1rem 1.5rem 1.5rem' }}>
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
                  <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {eleves.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      Aucun élève validé dans cette classe pour {activeYear}.
                    </td>
                  </tr>
                ) : (
                  eleves.map((el, i) => {
                    const g = notes[el.id] || { d1: '', d2: '', compo: '', appreciation: '' };
                    const hasData = g.d1Id || g.d2Id || g.compoId;
                    const moy = getMoyenne(el.id);

                    return (
                      <tr key={el.id} className={hasData ? 'selected-row' : ''}>
                        <td className="readonly-cell" style={{ textAlign: 'center' }}>
                          {i + 1}
                        </td>
                        <td className="readonly-cell">{el.matricule}</td>
                        <td className="readonly-cell" style={{ fontWeight: 600 }}>
                          {el.nom} {el.prenom}
                        </td>
                        <td>
                          <input
                            id={`input-d1-${i}`}
                            type="number"
                            step="0.25"
                            min="0"
                            max="20"
                            className="excel-cell-input"
                            value={g.d1}
                            onChange={(e) => handleNoteChange(el.id, 'd1', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 'd1')}
                            placeholder="—"
                            style={{
                              fontWeight: 700,
                              color: g.d1 !== '' ? getMentionColor(g.d1) : '#0f172a',
                              textAlign: 'center',
                            }}
                          />
                        </td>
                        <td>
                          <input
                            id={`input-d2-${i}`}
                            type="number"
                            step="0.25"
                            min="0"
                            max="20"
                            className="excel-cell-input"
                            value={g.d2}
                            onChange={(e) => handleNoteChange(el.id, 'd2', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 'd2')}
                            placeholder="—"
                            style={{
                              fontWeight: 700,
                              color: g.d2 !== '' ? getMentionColor(g.d2) : '#0f172a',
                              textAlign: 'center',
                            }}
                          />
                        </td>
                        <td>
                          <input
                            id={`input-compo-${i}`}
                            type="number"
                            step="0.25"
                            min="0"
                            max="20"
                            className="excel-cell-input"
                            value={g.compo}
                            onChange={(e) => handleNoteChange(el.id, 'compo', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 'compo')}
                            placeholder="—"
                            style={{
                              fontWeight: 700,
                              color: g.compo !== '' ? getMentionColor(g.compo) : '#0f172a',
                              textAlign: 'center',
                              background: '#fdf4ff',
                            }}
                          />
                        </td>
                        <td>
                          <input
                            id={`input-appreciation-${i}`}
                            type="text"
                            className="excel-cell-input"
                            value={g.appreciation}
                            onChange={(e) => handleNoteChange(el.id, 'appreciation', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 'appreciation')}
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
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="excel-action-btn"
                              onClick={() => handleSaveSingle(el.id)}
                              disabled={submittingIds[el.id]}
                              title="Enregistrer"
                            >
                              {submittingIds[el.id] ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {message && (
            <div
              style={{
                margin: '0 1.5rem 1.5rem',
                padding: '1rem',
                borderRadius: '8px',
                background: !message.toLowerCase().includes('erreur') ? '#dcfce7' : '#fee2e2',
                color: !message.toLowerCase().includes('erreur') ? '#166534' : '#991b1b',
              }}
            >
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
