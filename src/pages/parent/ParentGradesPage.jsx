import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Printer,
  Search,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Minus,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  formatAverage,
  getMention,
  getMentionColor,
  GRADE_COLUMNS,
} from '../../utils/gradeEntry';
import { printDocument } from '../../utils/printDocument';
import {
  PrintDocument,
  PrintFooter,
  PrintHeader,
  PrintMeta,
  PrintSection,
  PrintStats,
  PrintTable,
} from '../../components/PrintLayout/PrintLayout';
import { useParentContext } from './ParentContext';
import { useParentSchoolFilters } from './useParentSchoolFilters';
import StudentSchoolFilters from '../student/StudentSchoolFilters';
import '../admin/GradesViewPage.css';
import '../../styles/print-design.css';
import './ParentSpace.css';

const SORT_OPTIONS = [
  { value: 'matiere-asc', label: 'Matière (A → Z)' },
  { value: 'matiere-desc', label: 'Matière (Z → A)' },
  { value: 'moyenne-desc', label: 'Moyenne (meilleure)' },
  { value: 'moyenne-asc', label: 'Moyenne (plus faible)' },
];

function getPreviousPeriode(periodes, current) {
  const idx = periodes.indexOf(current);
  if (idx <= 0) return null;
  return periodes[idx - 1];
}

function exportGradesCsv(data, { annee, periode }) {
  const eleve = data?.eleve;
  const rows = [
    ['Élève', `${eleve?.prenom || ''} ${eleve?.nom || ''}`.trim()],
    ['Classe', data?.classe?.nom || ''],
    ['Année', annee],
    ['Période', periode],
    ['Moyenne générale', data?.moyenneGenerale != null ? formatAverage(data.moyenneGenerale) : ''],
    ['Rang', data?.rang ?? ''],
    [],
    ['Matière', 'Professeur', 'Coeff.', 'D1', 'D2', 'Compo', 'Moyenne', 'Appréciation'],
  ];

  (data?.matieres || []).forEach((m) => {
    rows.push([
      m.nom,
      m.professeur || '',
      m.coefficient ?? '',
      m.d1 ?? '',
      m.d2 ?? '',
      m.compo ?? '',
      m.moyenne != null ? formatAverage(m.moyenne) : '',
      m.appreciation || '',
    ]);
  });

  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(';')
    )
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notes-${eleve?.nom || 'eleve'}-${periode.replace(/\s+/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function TrendBadge({ current, previous }) {
  if (current == null || previous == null) return null;
  const diff = Math.round((current - previous) * 100) / 100;
  if (Math.abs(diff) < 0.05) {
    return (
      <span className="parent-grades-trend parent-grades-trend--stable" title="Stable vs période précédente">
        <Minus size={12} /> =
      </span>
    );
  }
  if (diff > 0) {
    return (
      <span className="parent-grades-trend parent-grades-trend--up" title={`+${formatAverage(diff)} vs période préc.`}>
        <TrendingUp size={12} /> +{formatAverage(diff)}
      </span>
    );
  }
  return (
    <span className="parent-grades-trend parent-grades-trend--down" title={`${formatAverage(diff)} vs période préc.`}>
      <TrendingDown size={12} /> {formatAverage(diff)}
    </span>
  );
}

export default function ParentGradesPage() {
  const { eleveId, childSearch } = useParentContext();
  const filters = useParentSchoolFilters({ withPeriode: true, eleveId });
  const [data, setData] = useState(null);
  const [prevData, setPrevData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('matiere-asc');
  const [expandedId, setExpandedId] = useState(null);

  const loadNotes = useCallback(async () => {
    if (!filters.ready || !eleveId) return;
    setLoading(true);
    setError('');
    setExpandedId(null);
    try {
      const res = await api.get(
        `/parent/notes?eleve_id=${eleveId}&annee_scolaire=${encodeURIComponent(filters.annee)}&periode=${encodeURIComponent(filters.periode)}`
      );
      setData(res);

      const prevPeriode = getPreviousPeriode(filters.periodes, filters.periode);
      if (prevPeriode) {
        try {
          const prev = await api.get(
            `/parent/notes?eleve_id=${eleveId}&annee_scolaire=${encodeURIComponent(filters.annee)}&periode=${encodeURIComponent(prevPeriode)}`
          );
          setPrevData(prev);
        } catch {
          setPrevData(null);
        }
      } else {
        setPrevData(null);
      }
    } catch (err) {
      setError(err.data?.error || 'Impossible de charger les notes.');
      setData(null);
      setPrevData(null);
    } finally {
      setLoading(false);
    }
  }, [eleveId, filters.annee, filters.periode, filters.periodes, filters.ready]);

  useEffect(() => {
    if (!filters.ready) {
      if (!filters.loading) setLoading(false);
      return;
    }
    loadNotes();
  }, [loadNotes, filters.ready, filters.loading]);

  const prevMoyennes = useMemo(() => {
    const map = {};
    (prevData?.matieres || []).forEach((m) => {
      if (m.moyenne != null) map[m.id] = m.moyenne;
    });
    return map;
  }, [prevData]);

  const matieresNotees = useMemo(
    () => (data?.matieres || []).filter((m) => m.moyenne != null).length,
    [data]
  );

  const filteredMatieres = useMemo(() => {
    let list = [...(data?.matieres || [])];
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((m) =>
        [m.nom, m.professeur, m.appreciation]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case 'matiere-desc':
          return b.nom.localeCompare(a.nom, 'fr');
        case 'moyenne-desc':
          return (b.moyenne ?? -1) - (a.moyenne ?? -1);
        case 'moyenne-asc':
          return (a.moyenne ?? 999) - (b.moyenne ?? 999);
        default:
          return a.nom.localeCompare(b.nom, 'fr');
      }
    });
    return list;
  }, [data?.matieres, searchTerm, sortBy]);

  const qs = childSearch;
  const prevPeriode = getPreviousPeriode(filters.periodes, filters.periode);

  const toggleExpand = (id) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  const handlePrint = () => printDocument('printing-parent-grades');

  const handleExport = () => {
    if (data) exportGradesCsv(data, { annee: filters.annee, periode: filters.periode });
  };

  return (
    <div className="parent-page parent-grades-page">
      <div className="parent-grades-top">
        <div className="parent-page__header">
          <h1 className="parent-page__title">Notes de l&apos;enfant</h1>
          <p className="parent-page__sub">
            Détail par matière, évolution et export — consultation uniquement
          </p>
        </div>
        <div className="parent-grades-actions">
          <Link to={`/parent/bulletin${qs}`} className="parent-grades-action parent-grades-action--gold">
            <Award size={16} />
            Voir le bulletin
          </Link>
          <button type="button" className="parent-grades-action" onClick={handleExport} disabled={!data?.matieres?.length}>
            <FileSpreadsheet size={16} />
            Export CSV
          </button>
          <button type="button" className="parent-grades-action parent-grades-action--primary" onClick={handlePrint} disabled={!data}>
            <Printer size={16} />
            Imprimer
          </button>
        </div>
      </div>

      <StudentSchoolFilters {...filters} showPeriode />

      {filters.error && <div className="parent-alert parent-alert--error">{filters.error}</div>}
      {error && <div className="parent-alert parent-alert--error">{error}</div>}

      {loading ? (
        <div className="parent-loading">Chargement des notes</div>
      ) : data ? (
        <>
          <div className="parent-stats">
            <div className="parent-stat">
              <div className="parent-stat__top">
                <span className="parent-stat__label">Moyenne générale</span>
                <div className="parent-stat__icon parent-stat__icon--blue">
                  <BookOpen size={20} />
                </div>
              </div>
              <div className="parent-stat__value" style={{ color: getMentionColor(data.moyenneGenerale) }}>
                {data.moyenneGenerale != null ? `${formatAverage(data.moyenneGenerale)} / 20` : '—'}
              </div>
              <div className="parent-stat__sub">
                {data.moyenneGenerale != null ? getMention(data.moyenneGenerale) : 'En cours de saisie'}
              </div>
            </div>

            <div className="parent-stat">
              <div className="parent-stat__top">
                <span className="parent-stat__label">Classement</span>
                <div className="parent-stat__icon parent-stat__icon--green">
                  <Trophy size={20} />
                </div>
              </div>
              <div className="parent-stat__value">
                {data.rang ? `${data.rang}${data.rang === 1 ? 'er' : 'e'}` : '—'}
              </div>
              <div className="parent-stat__sub">sur {data.effectifClasse ?? '—'} élèves</div>
            </div>

            <div className="parent-stat">
              <div className="parent-stat__top">
                <span className="parent-stat__label">Matières notées</span>
                <div className="parent-stat__icon parent-stat__icon--purple">
                  <Users size={20} />
                </div>
              </div>
              <div className="parent-stat__value">
                {matieresNotees}/{data.matieres?.length ?? 0}
              </div>
              <div className="parent-stat__sub">{filters.periode}</div>
            </div>

            <div className="parent-stat">
              <div className="parent-stat__top">
                <span className="parent-stat__label">Classe</span>
                <div className="parent-stat__icon parent-stat__icon--gold">
                  <GraduationCap size={20} />
                </div>
              </div>
              <div className="parent-stat__value" style={{ fontSize: '1.15rem' }}>
                {data.classe?.nom || '—'}
              </div>
              <div className="parent-stat__sub">{filters.annee}</div>
            </div>
          </div>

          {prevPeriode && prevData && (
            <p className="parent-grades-trend-hint">
              Les flèches indiquent l&apos;évolution par rapport à <strong>{prevPeriode}</strong>.
            </p>
          )}

          <div className="parent-panel">
            <div className="parent-panel__header">
              <h2 className="parent-panel__title">
                {filters.periode} · {filters.annee}
              </h2>
              <div className="parent-grades-toolbar">
                <div className="parent-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher une matière…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="parent-grades-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {!filteredMatieres.length ? (
              <div className="parent-grades-empty">
                {searchTerm ? 'Aucune matière ne correspond à votre recherche.' : 'Aucune matière configurée pour cette classe.'}
              </div>
            ) : (
              <div className="parent-grades-table-wrap">
                <table className="grades-view-table parent-grades-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }} aria-label="Déplier" />
                      <th>Matière</th>
                      <th>Professeur</th>
                      <th style={{ textAlign: 'center' }}>Coeff.</th>
                      <th style={{ textAlign: 'center' }}>D1</th>
                      <th style={{ textAlign: 'center' }}>D2</th>
                      <th style={{ textAlign: 'center' }}>Compo</th>
                      <th style={{ textAlign: 'center' }}>Moyenne</th>
                      <th>Mention</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMatieres.map((m) => {
                      const isExpanded = expandedId === m.id;
                      const hasNotes = m.d1 != null || m.d2 != null || m.compo != null;
                      return (
                        <React.Fragment key={m.id}>
                          <tr
                            className={`grades-view-row parent-grades-row${isExpanded ? ' expanded' : ''}${hasNotes ? '' : ' parent-grades-row--empty'}`}
                            onClick={() => hasNotes && toggleExpand(m.id)}
                          >
                            <td className="grades-view-toggle">
                              {hasNotes ? (isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />) : null}
                            </td>
                            <td>
                              <strong>{m.nom}</strong>
                              {prevMoyennes[m.id] != null && m.moyenne != null && (
                                <TrendBadge current={m.moyenne} previous={prevMoyennes[m.id]} />
                              )}
                            </td>
                            <td>{m.professeur && m.professeur !== '—' ? m.professeur : <span className="grades-view-empty">Non renseigné</span>}</td>
                            <td style={{ textAlign: 'center' }}>{m.coefficient}</td>
                            <td style={{ textAlign: 'center' }}>{m.d1 ?? '—'}</td>
                            <td style={{ textAlign: 'center' }}>{m.d2 ?? '—'}</td>
                            <td style={{ textAlign: 'center' }}>{m.compo ?? '—'}</td>
                            <td style={{ textAlign: 'center', fontWeight: 800, color: getMentionColor(m.moyenne) }}>
                              {m.moyenne != null ? formatAverage(m.moyenne) : '—'}
                            </td>
                            <td>
                              {m.moyenne != null ? (
                                <span className="grades-view-mention" style={{ color: getMentionColor(m.moyenne) }}>
                                  {getMention(m.moyenne)}
                                </span>
                              ) : (
                                <span className="grades-view-empty">—</span>
                              )}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="grades-view-detail-row">
                              <td colSpan={9}>
                                <div className="grades-view-detail parent-grades-detail">
                                  <h3>Détail — {m.nom}</h3>
                                  <div className="parent-grades-detail__grid">
                                    {GRADE_COLUMNS.map((col) => (
                                      <div key={col.key} className="parent-grades-detail__cell">
                                        <span className="parent-grades-detail__label">{col.label}</span>
                                        <strong style={{ color: m[col.key] != null ? getMentionColor(m[col.key]) : undefined }}>
                                          {m[col.key] != null ? formatAverage(m[col.key]) : '—'}
                                        </strong>
                                        <span className="parent-grades-detail__weight">Coef. {col.weight}</span>
                                      </div>
                                    ))}
                                    <div className="parent-grades-detail__cell parent-grades-detail__cell--avg">
                                      <span className="parent-grades-detail__label">Moyenne matière</span>
                                      <strong style={{ fontSize: '1.35rem', color: getMentionColor(m.moyenne) }}>
                                        {m.moyenne != null ? formatAverage(m.moyenne) : '—'}
                                      </strong>
                                      <span className="parent-grades-detail__weight">Coeff. classe {m.coefficient}</span>
                                    </div>
                                  </div>
                                  {m.appreciation ? (
                                    <div className="parent-grades-appreciation">
                                      <span>Appréciation du professeur</span>
                                      <p>{m.appreciation}</p>
                                    </div>
                                  ) : (
                                    <p className="parent-grades-no-appreciation">Aucune appréciation pour cette matière.</p>
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
              </div>
            )}
          </div>

          {data.formules?.length > 0 && (
            <div className="parent-panel parent-grades-formula">
              <div className="parent-panel__header">
                <h2 className="parent-panel__title">Formule de calcul</h2>
              </div>
              <div style={{ padding: '1rem 1.35rem', fontSize: '0.88rem', color: 'var(--pa-muted)', lineHeight: 1.6 }}>
                {data.formules.map((f, i) => (
                  <p key={i} style={{ margin: i ? '0.5rem 0 0' : 0 }}>{f}</p>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {data && (
        <div className="edu-print-root parent-grades-print" aria-hidden="true">
          <PrintDocument>
            <PrintHeader
              badge="Espace parent"
              docTitle="Relevé de notes"
              docSubtitle={`${data.eleve?.prenom} ${data.eleve?.nom} · ${filters.periode}`}
              reference={filters.annee}
            />
            <PrintMeta
              items={[
                { label: 'Élève', value: `${data.eleve?.prenom} ${data.eleve?.nom}` },
                { label: 'Matricule', value: data.eleve?.matricule },
                { label: 'Classe', value: data.classe?.nom },
                { label: 'Période', value: filters.periode },
              ]}
            />
            <PrintStats
              items={[
                {
                  label: 'Moyenne générale',
                  value: data.moyenneGenerale != null ? `${formatAverage(data.moyenneGenerale)} / 20` : '—',
                  variant: 'gold',
                },
                {
                  label: 'Classement',
                  value: data.rang ? `${data.rang}e / ${data.effectifClasse}` : '—',
                },
                {
                  label: 'Matières notées',
                  value: `${matieresNotees}/${data.matieres?.length ?? 0}`,
                },
              ]}
            />
            <PrintSection title="Notes par matière">
              <PrintTable>
                <thead>
                  <tr>
                    <th>Matière</th>
                    <th>Prof.</th>
                    <th>Coef.</th>
                    <th>D1</th>
                    <th>D2</th>
                    <th>Compo</th>
                    <th>Moy.</th>
                    <th>Appréciation</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.matieres || []).map((m) => (
                    <tr key={m.id}>
                      <td><strong>{m.nom}</strong></td>
                      <td>{m.professeur !== '—' ? m.professeur : ''}</td>
                      <td className="edu-print-table__num">{m.coefficient}</td>
                      <td className="edu-print-table__num">{m.d1 ?? '—'}</td>
                      <td className="edu-print-table__num">{m.d2 ?? '—'}</td>
                      <td className="edu-print-table__num">{m.compo ?? '—'}</td>
                      <td className="edu-print-table__num">{m.moyenne != null ? formatAverage(m.moyenne) : '—'}</td>
                      <td>{m.appreciation || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </PrintTable>
            </PrintSection>
            <PrintFooter>
              <p>Document généré depuis l&apos;espace parent — consultation uniquement, sans valeur officielle de bulletin.</p>
            </PrintFooter>
          </PrintDocument>
        </div>
      )}
    </div>
  );
}
