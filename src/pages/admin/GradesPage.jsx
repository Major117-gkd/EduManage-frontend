import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Save,
  Users,
  BarChart3,
  Search,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';
import './ExcelTable.css';
import {
  PERIODES,
  GRADE_COLUMNS,
  buildGradesMap,
  cloneGradesMap,
  normalizeGradeInput,
  finalizeGradeValue,
  isValidGradeValue,
  calculateSubjectAverage,
  formatAverage,
  getMention,
  getMentionColor,
  applyAutoAppreciation,
  rowHasSavedNotes,
  isRowDirty,
  countDirtyRows,
  getClassStats,
  getCompletionStats,
  getNextInputId,
  getPrevInputId,
  saveStudentGrades,
  validateRowBeforeSave,
  createEmptyGradeRow,
} from '../../utils/gradeEntry';

const API = 'http://localhost:5000';

export default function GradesPage() {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [matieres, setMatieres] = useState([]);
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [periode, setPeriode] = useState('Trimestre 1');
  const [annee, setAnnee] = useState('');
  const [annees, setAnnees] = useState([]);

  const [eleves, setEleves] = useState([]);
  const [grades, setGrades] = useState({});
  const [snapshot, setSnapshot] = useState({});
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [savingIds, setSavingIds] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);
  const [rowStatus, setRowStatus] = useState({});
  const [saveMsg, setSaveMsg] = useState('');
  const [saveMsgType, setSaveMsgType] = useState('success');

  const studentIds = useMemo(() => eleves.map((e) => e.eleveId), [eleves]);
  const dirtyCount = useMemo(() => countDirtyRows(grades, snapshot), [grades, snapshot]);
  const completion = useMemo(() => getCompletionStats(grades, studentIds), [grades, studentIds]);
  const classStats = useMemo(() => getClassStats(grades, studentIds), [grades, studentIds]);

  const filteredEleves = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eleves;
    return eleves.filter((e) =>
      `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(q)
    );
  }, [eleves, search]);

  const showMessage = (text, type = 'success') => {
    setSaveMsg(text);
    setSaveMsgType(type);
    if (type === 'success') {
      setTimeout(() => setSaveMsg(''), 3500);
    }
  };

  const resetSelection = () => {
    setSelectedClasse(null);
    setSelectedMatiere(null);
    setEleves([]);
    setGrades({});
    setSnapshot({});
    setRowStatus({});
  };

  const confirmIfDirty = () => {
    if (dirtyCount === 0) return true;
    return window.confirm(
      `${dirtyCount} ligne(s) contiennent des modifications non enregistrées. Continuer sans sauvegarder ?`
    );
  };

  useEffect(() => {
    fetch(`${API}/api/admin/classes`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setClasses(d);
      })
      .catch(() => {});

    fetch(`${API}/api/admin/annees`)
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d)) return;
        setAnnees(d);
        const active = d.find((y) => y.active);
        if (active) setAnnee(active.nom);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (dirtyCount > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyCount]);

  const niveaux = [...new Set(classes.map((c) => c.niveau))].sort();
  const classesFiltrees = selectedNiveau ? classes.filter((c) => c.niveau === selectedNiveau) : [];

  const selectClasse = (c) => {
    if (!confirmIfDirty()) return;
    setSelectedClasse(c);
    setSelectedMatiere(null);
    setEleves([]);
    setGrades({});
    setSnapshot({});
    setRowStatus({});
    fetch(`${API}/api/admin/classes/${c.id}/matieres`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setMatieres(d);
      })
      .catch(() => {});
  };

  const loadEleves = useCallback(() => {
    if (!selectedClasse || !selectedMatiere || !annee) return;

    setLoading(true);
    const params = new URLSearchParams({
      periode,
      annee_scolaire: annee,
    });

    fetch(
      `${API}/api/admin/classes/${selectedClasse.id}/matieres/${selectedMatiere.id}/notes?${params}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEleves(data);
          const map = buildGradesMap(data, { periode, anneeScolaire: annee });
          setGrades(map);
          setSnapshot(cloneGradesMap(map));
          setRowStatus({});
        }
      })
      .catch(() => showMessage('Impossible de charger les élèves.', 'error'))
      .finally(() => setLoading(false));
  }, [selectedClasse, selectedMatiere, periode, annee]);

  useEffect(() => {
    let timeoutId;
    if (selectedMatiere && annee) {
      timeoutId = setTimeout(() => loadEleves(), 0);
    }
    return () => clearTimeout(timeoutId);
  }, [selectedMatiere, periode, annee, loadEleves]);

  const updateGradeField = (eleveId, field, rawValue) => {
    setGrades((prev) => {
      const current = prev[eleveId] || createEmptyGradeRow();
      let next = { ...current };

      if (field === 'appreciation') {
        next.appreciation = rawValue;
        next.appreciationManual = true;
      } else {
        const normalized = normalizeGradeInput(rawValue);
        if (normalized === null) return prev;
        next[field] = normalized;

        if (!next.appreciationManual) {
          next = applyAutoAppreciation(next);
        }
      }

      return { ...prev, [eleveId]: next };
    });

    setRowStatus((prev) => ({ ...prev, [eleveId]: undefined }));
  };

  const finalizeGradeField = (eleveId, field) => {
    if (field === 'appreciation') return;

    setGrades((prev) => {
      const current = prev[eleveId];
      if (!current) return prev;

      const finalized = finalizeGradeValue(current[field]);
      let next = { ...current, [field]: finalized };

      if (!next.appreciationManual) {
        next = applyAutoAppreciation(next);
      }

      return { ...prev, [eleveId]: next };
    });
  };

  const discardRow = (eleveId) => {
    if (!snapshot[eleveId]) return;
    setGrades((prev) => ({ ...prev, [eleveId]: { ...snapshot[eleveId] } }));
    setRowStatus((prev) => ({ ...prev, [eleveId]: undefined }));
  };

  const handleSaveSingle = useCallback(async (eleveId, { silent = false, reload = true } = {}) => {
    const row = grades[eleveId];
    if (!row || !selectedMatiere) return { ok: false };

    const errors = validateRowBeforeSave(row);
    if (errors.length > 0) {
      if (!silent) showMessage(errors[0], 'error');
      setRowStatus((prev) => ({ ...prev, [eleveId]: 'error' }));
      return { ok: false };
    }

    setSavingIds((prev) => ({ ...prev, [eleveId]: true }));

    try {
      await saveStudentGrades({
        apiBase: API,
        eleveId,
        matiereId: selectedMatiere.id,
        periode,
        anneeScolaire: annee,
        row,
      });

      setRowStatus((prev) => ({ ...prev, [eleveId]: 'saved' }));
      setTimeout(() => {
        setRowStatus((prev) => ({ ...prev, [eleveId]: undefined }));
      }, 2000);

      if (!silent) showMessage('Notes enregistrées avec succès.');
      if (reload) await loadEleves();
      return { ok: true };
    } catch (err) {
      setRowStatus((prev) => ({ ...prev, [eleveId]: 'error' }));
      if (!silent) showMessage(err.message || 'Erreur lors de la sauvegarde.', 'error');
      return { ok: false };
    } finally {
      setSavingIds((prev) => ({ ...prev, [eleveId]: false }));
    }
  }, [grades, selectedMatiere, periode, annee, loadEleves]);

  const handleSaveAll = useCallback(async () => {
    const dirtyIds = studentIds.filter((id) => isRowDirty(grades[id], snapshot[id]));
    if (dirtyIds.length === 0) {
      showMessage('Aucune modification à enregistrer.', 'info');
      return;
    }

    setBulkSaving(true);
    let success = 0;
    let failed = 0;

    for (const eleveId of dirtyIds) {
      const result = await handleSaveSingle(eleveId, { silent: true, reload: false });
      if (result.ok) success += 1;
      else failed += 1;
    }

    await loadEleves();
    setBulkSaving(false);

    if (failed === 0) {
      showMessage(`${success} ligne(s) enregistrée(s) avec succès.`);
    } else {
      showMessage(`${success} enregistrée(s), ${failed} en échec.`, 'error');
    }
  }, [studentIds, grades, snapshot, handleSaveSingle, loadEleves]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (dirtyCount > 0 && !bulkSaving) handleSaveAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dirtyCount, bulkSaving, handleSaveAll]);

  const focusInput = (id) => {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      el.focus();
      el.select?.();
    }
  };

  const handleKeyDown = (e, index, field, eleveId) => {
    const moveNext = () => focusInput(getNextInputId(field, index));
    const movePrev = () => focusInput(getPrevInputId(field, index));

    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handleSaveSingle(eleveId);
        return;
      }
      moveNext();
      return;
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      moveNext();
      return;
    }

    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      movePrev();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusInput(`input-${field}-${index + 1}`);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusInput(`input-${field}-${index - 1}`);
    }
  };

  const handleNiveauChange = (n) => {
    if (!confirmIfDirty()) return;
    setSelectedNiveau(n);
    resetSelection();
  };

  const handleMatiereChange = (m) => {
    if (!confirmIfDirty()) return;
    setSelectedMatiere(m);
  };

  const handlePeriodeChange = (value) => {
    if (!confirmIfDirty()) return;
    setPeriode(value);
  };

  const getRowClassName = (eleveId) => {
    const classes = [];
    if (rowHasSavedNotes(grades[eleveId])) classes.push('selected-row');
    if (isRowDirty(grades[eleveId], snapshot[eleveId])) classes.push('grade-row--dirty');
    if (rowStatus[eleveId] === 'saved') classes.push('grade-row--saved');
    if (rowStatus[eleveId] === 'error') classes.push('grade-row--error');
    return classes.join(' ');
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header grades-page-header">
        <div className="grades-toolbar">
          {selectedClasse && selectedMatiere && dirtyCount > 0 && (
            <span className="grades-badge grades-badge--warning">
              <AlertTriangle size={14} />
              {dirtyCount} modification(s) non enregistrée(s)
            </span>
          )}
          {selectedClasse && (
            <button
              type="button"
              className="btn grades-btn-secondary"
              onClick={() => navigate('/admin/grades/results')}
            >
              <BarChart3 size={16} /> Bulletins & Résultats
            </button>
          )}
          {selectedMatiere && dirtyCount > 0 && (
            <button
              type="button"
              className="btn grades-btn-primary"
              onClick={handleSaveAll}
              disabled={bulkSaving}
            >
              {bulkSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              Tout enregistrer ({dirtyCount})
            </button>
          )}
        </div>
      </div>

      {saveMsg && (
        <div className={`grades-alert grades-alert--${saveMsgType}`}>
          {saveMsgType === 'success' && <CheckCircle2 size={16} />}
          {saveMsgType === 'error' && <AlertTriangle size={16} />}
          {saveMsg}
        </div>
      )}

      {!annee && (
        <div className="grades-alert grades-alert--error">
          <AlertTriangle size={16} />
          Aucune année scolaire active. Définissez-en une dans « Années Scolaires ».
        </div>
      )}

      <div className="admin-panel grades-step-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title grades-step-title">
            <span className={`grades-step-badge ${selectedNiveau ? 'active' : ''}`}>1</span>
            Sélectionner le Niveau
            {selectedNiveau && <span className="grades-step-value"> — {selectedNiveau}</span>}
          </h2>
        </div>
        <div className="grades-chip-row">
          {niveaux.length === 0 ? (
            <p className="grades-empty-hint">Aucune classe créée.</p>
          ) : (
            niveaux.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleNiveauChange(n)}
                className={`grades-chip ${selectedNiveau === n ? 'active' : ''}`}
              >
                {n}
              </button>
            ))
          )}
        </div>
      </div>

      {selectedNiveau && (
        <div className="admin-panel grades-step-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title grades-step-title">
              <span className={`grades-step-badge ${selectedClasse ? 'active' : ''}`}>2</span>
              Sélectionner la Classe
              {selectedClasse && <span className="grades-step-value"> — {selectedClasse.nom}</span>}
            </h2>
          </div>
          <div className="grades-step-content">
            {classesFiltrees.length === 0 ? (
              <p className="grades-empty-hint">Aucune classe pour ce niveau.</p>
            ) : (
              <select
                value={selectedClasse?.id || ''}
                onChange={(e) => {
                  const c = classesFiltrees.find((x) => x.id === parseInt(e.target.value, 10));
                  if (c) selectClasse(c);
                }}
                className="grades-select"
              >
                <option value="">-- Choisir une classe --</option>
                {classesFiltrees.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {selectedClasse && (
        <div className="admin-panel grades-step-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title grades-step-title">
              <span className={`grades-step-badge ${selectedMatiere ? 'active' : ''}`}>3</span>
              Sélectionner la Matière
              {selectedMatiere && (
                <span className="grades-step-value"> — {selectedMatiere.nom}</span>
              )}
            </h2>
          </div>
          <div className="grades-step-content">
            {matieres.length === 0 ? (
              <p className="grades-empty-hint">Aucune matière pour cette classe.</p>
            ) : (
              <select
                value={selectedMatiere?.id || ''}
                onChange={(e) => {
                  const m = matieres.find((x) => x.id === parseInt(e.target.value, 10));
                  if (m) handleMatiereChange(m);
                }}
                className="grades-select"
              >
                <option value="">-- Choisir une matière --</option>
                  {matieres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>
      )}

      {selectedMatiere && (
        <div className="admin-panel grades-step-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title grades-step-title">
              <span className="grades-step-badge active">4</span>
              Paramètres de l&apos;évaluation
            </h2>
          </div>
          <div className="grades-params-row">
            <div className="modal-form-group grades-param-field">
              <label>Période</label>
              <select value={periode} onChange={(e) => handlePeriodeChange(e.target.value)}>
                {PERIODES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-form-group grades-param-field">
              <label>Année scolaire</label>
              <select value={annee} onChange={(e) => setAnnee(e.target.value)} disabled={!annees.length}>
                {annees.map((a) => (
                  <option key={a.id} value={a.nom}>
                    {a.nom} {a.active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="grades-formula-note">
            Moy. matière (colonne « Moy. ») : calculée sans coefficient de la matière.
            Le coefficient s&apos;applique uniquement à la moyenne générale et au classement.
          </p>
        </div>
      )}

      {selectedMatiere && (
        <div className="admin-panel">
          <div className="admin-panel__header grades-table-header">
            <h2 className="admin-panel__title">
              <Users size={18} color="#0A2F6B" />
              {selectedClasse.nom} — {selectedMatiere.nom}
              <span className="grades-period-label">({periode})</span>
            </h2>
            <div className="grades-table-meta">
              <span>{eleves.length} élève(s)</span>
              {completion.total > 0 && (
                <span className="grades-progress-label">
                  {completion.complete}/{completion.total} complets ({completion.percent}%)
                </span>
              )}
            </div>
          </div>

          {eleves.length > 0 && (
            <div className="grades-summary-bar">
              <div className="grades-summary-item">
                <span className="grades-summary-label">Progression</span>
                <div className="grades-progress-track">
                  <div
                    className="grades-progress-fill"
                    style={{ width: `${completion.percent}%` }}
                  />
                </div>
              </div>
              <div className="grades-summary-item">
                <span className="grades-summary-label">Moy. classe</span>
                <strong style={{ color: getMentionColor(classStats.average) }}>
                  {classStats.average !== null ? formatAverage(classStats.average) : '—'}
                </strong>
              </div>
              <div className="grades-summary-item">
                <span className="grades-summary-label">Min / Max</span>
                <strong>
                  {classStats.min !== null
                    ? `${formatAverage(classStats.min)} / ${formatAverage(classStats.max)}`
                    : '—'}
                </strong>
              </div>
              <div className="grades-search-wrap">
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un élève..."
                  className="grades-search-input"
                />
              </div>
            </div>
          )}

          <div className="grades-keyboard-hint">
            <kbd>Tab</kbd> ou <kbd>Entrée</kbd> : cellule suivante · <kbd>Shift+Entrée</kbd> : enregistrer la ligne ·{' '}
            <kbd>Ctrl+S</kbd> : tout enregistrer · Moy. matière = (D1 + D2 + 2×Compo) / 4, sans coeff. matière
          </div>

          <div className="excel-table-container grades-table-wrap" ref={tableRef}>
            {loading ? (
              <div className="grades-loading">Chargement des élèves...</div>
            ) : eleves.length === 0 ? (
              <div className="grades-loading grades-empty-hint">
                Aucun élève validé pour cette classe et cette année.
              </div>
            ) : filteredEleves.length === 0 ? (
              <div className="grades-loading grades-empty-hint">Aucun élève ne correspond à la recherche.</div>
            ) : (
              <table className="excel-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}>#</th>
                    <th style={{ width: '80px' }}>Matricule</th>
                    <th>Nom & Prénom</th>
                    {GRADE_COLUMNS.map((col) => (
                      <th key={col.key} style={{ width: '75px', textAlign: 'center' }}>
                        {col.label}
                        {col.weight > 1 && (
                          <span className="grades-weight" title="Pondération dans la moy. matière (pas le coeff. matière)">
                            ×{col.weight}
                          </span>
                        )}
                      </th>
                    ))}
                    <th style={{ minWidth: '140px' }}>Appréciation</th>
                    <th style={{ width: '80px', textAlign: 'center' }} title="Sans coefficient de la matière">
                      Moy. mat.
                    </th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEleves.map((e, i) => {
                    const g = grades[e.eleveId] || createEmptyGradeRow();
                    const moy = calculateSubjectAverage(g);
                    const moyLabel = formatAverage(moy);
                    const dirty = isRowDirty(g, snapshot[e.eleveId]);
                    const invalidField = GRADE_COLUMNS.find(
                      (col) => g[col.key] !== '' && !isValidGradeValue(g[col.key])
                    );

                    return (
                      <tr key={e.eleveId} className={getRowClassName(e.eleveId)}>
                        <td className="readonly-cell" style={{ textAlign: 'center' }}>
                          {i + 1}
                        </td>
                        <td className="readonly-cell">{e.matricule}</td>
                        <td className="readonly-cell" style={{ fontWeight: 600 }}>
                          {e.nom} {e.prenom}
                          {dirty && <span className="grades-dot" title="Modifié" />}
                        </td>

                        {GRADE_COLUMNS.map((col) => (
                          <td key={col.key}>
                            <input
                              id={`input-${col.key}-${i}`}
                              type="text"
                              inputMode="decimal"
                              className={`excel-cell-input ${invalidField?.key === col.key ? 'grade-input--invalid' : ''}`}
                              value={g[col.key]}
                              onChange={(ev) => updateGradeField(e.eleveId, col.key, ev.target.value)}
                              onBlur={() => finalizeGradeField(e.eleveId, col.key)}
                              onKeyDown={(ev) => handleKeyDown(ev, i, col.key, e.eleveId)}
                              placeholder="—"
                              style={{
                                fontWeight: 700,
                                color:
                                  g[col.key] !== '' ? getMentionColor(g[col.key]) : '#0f172a',
                                textAlign: 'center',
                                background: col.key === 'compo' ? '#fdf4ff' : undefined,
                              }}
                            />
                          </td>
                        ))}

                        <td>
                          <input
                            id={`input-appreciation-${i}`}
                            type="text"
                            className="excel-cell-input"
                            value={g.appreciation}
                            onChange={(ev) =>
                              updateGradeField(e.eleveId, 'appreciation', ev.target.value)
                            }
                            onKeyDown={(ev) => handleKeyDown(ev, i, 'appreciation', e.eleveId)}
                            placeholder={moy !== null ? getMention(moy) : 'Appréciation...'}
                          />
                        </td>

                        <td className="readonly-cell" style={{ textAlign: 'center' }}>
                          {moy !== null && (
                            <div className="grades-average-cell">
                              <span
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  color: getMentionColor(moy),
                                }}
                              >
                                {moyLabel}
                              </span>
                              <span className="grades-mention">{getMention(moy)}</span>
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="grades-row-actions">
                            {dirty && (
                              <button
                                type="button"
                                className="excel-action-btn grades-action-reset"
                                onClick={() => discardRow(e.eleveId)}
                                title="Annuler les modifications"
                              >
                                <RotateCcw size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="excel-action-btn"
                              onClick={() => handleSaveSingle(e.eleveId)}
                              disabled={savingIds[e.eleveId] || !dirty}
                              title="Enregistrer (Shift+Entrée)"
                            >
                              {savingIds[e.eleveId] ? (
                                <Loader2 size={16} className="spin" />
                              ) : rowStatus[e.eleveId] === 'saved' ? (
                                <CheckCircle2 size={16} color="#059669" />
                              ) : (
                                <Save size={16} />
                              )}
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
