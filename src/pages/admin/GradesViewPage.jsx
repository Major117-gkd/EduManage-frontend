import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  BookOpen,
  Filter,
  Trophy,
  Eye,
} from 'lucide-react';
import '../admin/AdminDashboard.css';
import './ExcelTable.css';
import './GradesViewPage.css';
import {
  PERIODES,
  GRADE_COLUMNS,
  formatAverage,
  getMention,
  getMentionColor,
} from '../../utils/gradeEntry';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function GradesViewPage() {
  const { user } = useAuth();
  const [annees, setAnnees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [annee, setAnnee] = useState('');
  const [periode, setPeriode] = useState('Trimestre 1');
  const [niveau, setNiveau] = useState('');
  const [classeId, setClasseId] = useState('');
  const [search, setSearch] = useState('');
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api.get('/admin/annees')
      .then((d) => {
        if (!Array.isArray(d)) return;
        setAnnees(d);
        const active = d.find((y) => y.active);
        if (active) setAnnee(active.nom);
      })
      .catch(() => {});

    api.get('/admin/classes')
      .then((d) => {
        if (Array.isArray(d)) setClasses(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!annee) return;

    setLoading(true);
    const params = new URLSearchParams({
      annee_scolaire: annee,
      periode,
    });
    if (niveau) params.set('niveau', niveau);
    if (classeId) params.set('classeId', classeId);

    api.get(`/admin/notes/consultation?${params}`)
      .then((data) => {
        setEleves(Array.isArray(data.eleves) ? data.eleves : []);
        setExpandedId(null);
      })
      .catch(() => setEleves([]))
      .finally(() => setLoading(false));
  }, [annee, periode, niveau, classeId]);

  const niveaux = useMemo(
    () => [...new Set(classes.map((c) => c.niveau))].sort(),
    [classes]
  );

  const classesFiltrees = useMemo(
    () => (niveau ? classes.filter((c) => c.niveau === niveau) : classes),
    [classes, niveau]
  );

  const filteredEleves = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? eleves.filter((e) =>
          `${e.nom} ${e.prenom} ${e.matricule} ${e.classe}`.toLowerCase().includes(q)
        )
      : eleves;

    return [...list].sort((a, b) => {
      if (a.rang === null && b.rang === null) return 0;
      if (a.rang === null) return 1;
      if (b.rang === null) return -1;
      if (a.rang !== b.rang) return a.rang - b.rang;
      return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr');
    });
  }, [eleves, search]);

  const stats = useMemo(() => {
    const withAverage = filteredEleves.filter((e) => e.moyenneGenerale !== null);
    const sum = withAverage.reduce((acc, e) => acc + e.moyenneGenerale, 0);
    return {
      total: filteredEleves.length,
      withGrades: withAverage.length,
      average:
        withAverage.length > 0
          ? Math.round((sum / withAverage.length) * 100) / 100
          : null,
    };
  }, [filteredEleves]);

  const toggleExpand = (eleveId) => {
    setExpandedId((prev) => (prev === eleveId ? null : eleveId));
  };

  const renderNote = (value) => {
    if (value === null || value === undefined) {
      return <span className="grades-view-empty">—</span>;
    }
    return (
      <span style={{ fontWeight: 700, color: getMentionColor(value) }}>
        {formatAverage(value)}
      </span>
    );
  };

  return (
    <div className="admin-dashboard grades-view">
      {user?.role !== 'DIRECTEUR' && (
      <div className="grades-view-readonly-banner">
        <Eye size={18} />
        <div>
          <strong>Consultation uniquement</strong>
          <p>
            En tant qu&apos;administrateur, vous pouvez consulter toutes les notes mais pas les modifier.
            Seul le professeur assigné à une matière peut saisir ou corriger les notes de cette matière
            depuis son espace professeur.
          </p>
        </div>
      </div>
      )}

      <div className="grades-view-intro">
        <p>
          <strong>Moy. matière</strong> : (D1 + D2 + 2×Compo) / 4 — sans coefficient de la matière.
          <strong> Moy. générale &amp; classement</strong> : Σ(moy. matière × coeff.) / Σ(coeff.).
        </p>
      </div>

      {!annee && (
        <div className="grades-alert grades-alert--error">
          Aucune année scolaire active. Définissez-en une dans « Années Scolaires ».
        </div>
      )}

      <div className="admin-panel grades-view-filters">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">
            <Filter size={18} color="#0A2F6B" />
            Filtres
          </h2>
        </div>
        <div className="grades-view-filters__grid">
          <div className="modal-form-group grades-param-field">
            <label>Année scolaire</label>
            <select value={annee} onChange={(e) => setAnnee(e.target.value)}>
              {annees.map((a) => (
                <option key={a.id} value={a.nom}>
                  {a.nom} {a.active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-form-group grades-param-field">
            <label>Période</label>
            <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
              {PERIODES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-form-group grades-param-field">
            <label>Niveau</label>
            <select
              value={niveau}
              onChange={(e) => {
                setNiveau(e.target.value);
                setClasseId('');
              }}
            >
              <option value="">Tous les niveaux</option>
              {niveaux.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-form-group grades-param-field">
            <label>Classe</label>
            <select value={classeId} onChange={(e) => setClasseId(e.target.value)}>
              <option value="">Toutes les classes</option>
              {classesFiltrees.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="grades-search-wrap grades-view-search">
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
      </div>

      <div className="grades-view-stats">
        <div className="grades-view-stat">
          <Users size={18} color="#0A2F6B" />
          <div>
            <span className="grades-view-stat__label">Élèves affichés</span>
            <strong>{stats.total}</strong>
          </div>
        </div>
        <div className="grades-view-stat">
          <BookOpen size={18} color="#0A2F6B" />
          <div>
            <span className="grades-view-stat__label">Avec moyenne générale</span>
            <strong>{stats.withGrades}</strong>
          </div>
        </div>
        <div className="grades-view-stat">
          <div>
            <span className="grades-view-stat__label">Moyenne globale</span>
            <strong style={{ color: getMentionColor(stats.average) }}>
              {stats.average !== null ? formatAverage(stats.average) : '—'}
            </strong>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header grades-table-header">
          <h2 className="admin-panel__title">
            Liste des élèves — {periode}
            {annee && <span className="grades-period-label"> ({annee})</span>}
          </h2>
          <span className="grades-readonly-badge">Lecture seule</span>
        </div>

        <div className="excel-table-container grades-table-wrap">
          {loading ? (
            <div className="grades-loading">Chargement des notes...</div>
          ) : filteredEleves.length === 0 ? (
            <div className="grades-loading grades-empty-hint">
              Aucun élève validé ne correspond aux filtres sélectionnés.
            </div>
          ) : (
            <table className="excel-table grades-view-table">
              <thead>
                <tr>
                  <th style={{ width: '36px' }} />
                  <th style={{ width: '60px', textAlign: 'center' }}>Rang</th>
                  <th style={{ width: '90px' }}>Matricule</th>
                  <th>Élève</th>
                  <th style={{ width: '110px' }}>Classe</th>
                  <th style={{ width: '100px' }}>Niveau</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Matières notées</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Moy. gén.</th>
                  <th style={{ width: '110px' }}>Mention</th>
                </tr>
              </thead>
              <tbody>
                {filteredEleves.map((eleve, index) => {
                  const isExpanded = expandedId === eleve.eleveId;
                  const matieresNotees = eleve.matieres.filter(
                    (m) => m.d1 !== null || m.d2 !== null || m.compo !== null
                  ).length;

                  return (
                    <React.Fragment key={`${eleve.eleveId}-${eleve.classeId}`}>
                      <tr
                        className={`grades-view-row ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleExpand(eleve.eleveId)}
                      >
                        <td className="readonly-cell grades-view-toggle">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                        <td className="readonly-cell" style={{ textAlign: 'center' }}>
                          {eleve.rang ? (
                            eleve.rang === 1 ? (
                              <span className="grades-view-rank grades-view-rank--first">
                                <Trophy size={13} /> {eleve.rang}
                              </span>
                            ) : (
                              <span className="grades-view-rank">{eleve.rang}</span>
                            )
                          ) : (
                            <span className="grades-view-empty">—</span>
                          )}
                        </td>
                        <td className="readonly-cell">{eleve.matricule}</td>
                        <td className="readonly-cell" style={{ fontWeight: 600 }}>
                          {eleve.nom} {eleve.prenom}
                        </td>
                        <td className="readonly-cell">{eleve.classe}</td>
                        <td className="readonly-cell">{eleve.niveau}</td>
                        <td className="readonly-cell" style={{ textAlign: 'center' }}>
                          {matieresNotees}/{eleve.matieres.length}
                        </td>
                        <td className="readonly-cell" style={{ textAlign: 'center' }}>
                          {eleve.moyenneGenerale !== null ? (
                            <span
                              style={{
                                fontWeight: 700,
                                color: getMentionColor(eleve.moyenneGenerale),
                              }}
                            >
                              {formatAverage(eleve.moyenneGenerale)}
                            </span>
                          ) : (
                            <span className="grades-view-empty">—</span>
                          )}
                        </td>
                        <td className="readonly-cell">
                          {eleve.moyenneGenerale !== null ? (
                            <span
                              className="grades-view-mention"
                              style={{ color: getMentionColor(eleve.moyenneGenerale) }}
                            >
                              {getMention(eleve.moyenneGenerale)}
                            </span>
                          ) : (
                            <span className="grades-view-empty">—</span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="grades-view-detail-row">
                          <td colSpan={10}>
                            <div className="grades-view-detail">
                              <h3>Détail des notes — {eleve.prenom} {eleve.nom}</h3>
                              {eleve.matieres.length === 0 ? (
                                <p className="grades-empty-hint">
                                  Aucune matière configurée pour cette classe.
                                </p>
                              ) : (
                                <table className="excel-table grades-view-detail-table">
                                  <thead>
                                    <tr>
                                      <th>Matière</th>
                                      {GRADE_COLUMNS.map((col) => (
                                        <th
                                          key={col.key}
                                          style={{ width: '70px', textAlign: 'center' }}
                                        >
                                          {col.label}
                                        </th>
                                      ))}
                                      <th style={{ width: '80px', textAlign: 'center' }} title="Sans coefficient matière">
                                        Moy. mat.
                                      </th>
                                      <th>Appréciation</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {eleve.matieres.map((mat) => (
                                      <tr key={mat.id}>
                                        <td className="readonly-cell" style={{ fontWeight: 600 }}>
                                          {mat.nom}
                                        </td>
                                        <td
                                          className="readonly-cell"
                                          style={{ textAlign: 'center' }}
                                        >
                                          {renderNote(mat.d1)}
                                        </td>
                                        <td
                                          className="readonly-cell"
                                          style={{ textAlign: 'center' }}
                                        >
                                          {renderNote(mat.d2)}
                                        </td>
                                        <td
                                          className="readonly-cell"
                                          style={{ textAlign: 'center', background: '#fdf4ff' }}
                                        >
                                          {renderNote(mat.compo)}
                                        </td>
                                        <td
                                          className="readonly-cell"
                                          style={{ textAlign: 'center' }}
                                        >
                                          {mat.moyenne !== null ? (
                                            <span
                                              style={{
                                                fontWeight: 700,
                                                color: getMentionColor(mat.moyenne),
                                              }}
                                            >
                                              {formatAverage(mat.moyenne)}
                                            </span>
                                          ) : (
                                            <span className="grades-view-empty">—</span>
                                          )}
                                        </td>
                                        <td className="readonly-cell">
                                          {mat.appreciation || (
                                            <span className="grades-view-empty">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                              {eleve.moyenneGenerale !== null && (
                                <div className="grades-general-formula">
                                  <span className="grades-general-formula__label">Moyenne générale</span>
                                  <span className="grades-general-formula__expr">
                                    {eleve.matieres
                                      .filter((m) => m.moyenne !== null)
                                      .map((m) => `${m.nom} (${formatAverage(m.moyenne)} × ${m.coefficient})`)
                                      .join(' + ')}
                                    {' '}/ Σ coeff. ={' '}
                                    <strong style={{ color: getMentionColor(eleve.moyenneGenerale) }}>
                                      {formatAverage(eleve.moyenneGenerale)}
                                    </strong>
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
