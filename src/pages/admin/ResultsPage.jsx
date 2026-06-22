import { useState, useEffect } from 'react';
import {
  ArrowLeft, Trophy, BarChart3, User, Award,
  TrendingUp, CheckCircle, XCircle, Printer,
  GraduationCap, BookOpen, Star, DollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';
import './ResultsPage.css';

const API = 'http://localhost:5000';
const PERIODES = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Semestre 1', 'Semestre 2'];

const getMentionColor = (val) => {
  const v = parseFloat(val);
  if (isNaN(v) || val === null) return '#94a3b8';
  if (v >= 16) return '#059669';
  if (v >= 14) return '#10b981';
  if (v >= 10) return '#d97706';
  return '#dc2626';
};

const getMentionBg = (val) => {
  const v = parseFloat(val);
  if (isNaN(v) || val === null) return '#f1f5f9';
  if (v >= 16) return '#ecfdf5';
  if (v >= 14) return '#d1fae5';
  if (v >= 10) return '#fffbeb';
  return '#fef2f2';
};

const getMention = (val) => {
  const v = parseFloat(val);
  if (isNaN(v) || val === null) return 'N/A';
  if (v >= 16) return 'Très Bien';
  if (v >= 14) return 'Bien';
  if (v >= 12) return 'Assez Bien';
  if (v >= 10) return 'Passable';
  return 'Insuffisant';
};

export default function ResultsPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [periode, setPeriode] = useState('Trimestre 1');
  const [bulletins, setBulletins] = useState([]);
  const [classeInfo, setClasseInfo] = useState({ nom: '', niveau: '' });
  const [loading, setLoading] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [filterPaidOnly, setFilterPaidOnly] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/admin/classes`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setClasses(d); })
      .catch(() => {});
  }, []);

  const loadBulletins = (classeId, p) => {
    setLoading(true);
    setBulletins([]);
    setSelectedEleve(null);
    fetch(`${API}/api/admin/classes/${classeId}/bulletins?periode=${encodeURIComponent(p)}`)
      .then(r => r.json())
      .then(data => {
        if (data.bulletins) {
          setBulletins(data.bulletins);
          setClasseInfo({ nom: data.classe, niveau: data.niveau });
        }
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  const handleSelectClasse = (c) => {
    setSelectedClasse(c);
    loadBulletins(c.id, periode);
  };

  const handlePeriodeChange = (p) => {
    setPeriode(p);
    if (selectedClasse) loadBulletins(selectedClasse.id, p);
  };

  // Stats
  const filteredBulletins = filterPaidOnly
    ? bulletins.filter(b => b.statut_financier === 'À jour')
    : bulletins;

  const withGrades = filteredBulletins.filter(b => b.moyenneGenerale !== null);
  const classeMoyenne = withGrades.length > 0
    ? (withGrades.reduce((s, b) => s + parseFloat(b.moyenneGenerale), 0) / withGrades.length).toFixed(2)
    : null;
  const admis = withGrades.filter(b => parseFloat(b.moyenneGenerale) >= 10).length;
  const tauxReussite = withGrades.length > 0 ? Math.round((admis / withGrades.length) * 100) : 0;
  const best = withGrades.length > 0
    ? withGrades.reduce((b, cur) => parseFloat(cur.moyenneGenerale) > parseFloat(b.moyenneGenerale) ? cur : b)
    : null;

  const sortedBulletins = [...filteredBulletins].sort((a, b) => {
    if (a.rang === null && b.rang === null) return 0;
    if (a.rang === null) return 1;
    if (b.rang === null) return -1;
    return a.rang - b.rang;
  });

  return (
    <div className="results-page">

      {/* ── Page Header ── */}
      <div className="results-header">
        <div className="results-header__left">
          <button className="results-back-btn" onClick={() => navigate('/admin/grades')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="results-title">Bulletins & Résultats</h1>
            <p className="results-subtitle">Classement, moyennes générales et bulletins individuels</p>
          </div>
        </div>
        {selectedEleve && (
          <div className="results-header__actions">
            <button className="results-btn results-btn--outline" onClick={() => window.print()}>
              <Printer size={16} /> Imprimer
            </button>
            <button className="results-btn results-btn--ghost" onClick={() => setSelectedEleve(null)}>
              <BarChart3 size={16} /> Vue d'ensemble
            </button>
          </div>
        )}
      </div>

      {/* ── Formula note ── */}
      <div className="results-formula-banner">
        <BookOpen size={15} />
        <span>
          <strong>Moy. matière</strong> (sans coeff.) = (D1 + D2 + 2×Compo) / 4 ·{' '}
          <strong>Moy. générale & classement</strong> = Σ(moy. matière × coeff.) / Σ(coeff.)
        </span>
      </div>

      {/* ── Filters ── */}
      <div className="results-filters admin-panel">
        <div className="admin-panel__header results-filters__header">
          <h2 className="admin-panel__title">
            <GraduationCap size={18} color="#0A2F6B" />
            Sélection
          </h2>
          {selectedClasse && (
            <span className="results-selected-badge">
              {classeInfo.nom} · {periode}
            </span>
          )}
        </div>
        <div className="results-filters__body">
          <div className="results-filter-group">
            <p className="results-filter-label">Classe</p>
            <div className="results-chips">
              {classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectClasse(c)}
                  className={`results-chip ${selectedClasse?.id === c.id ? 'active' : ''}`}
                >
                  {c.nom}
                </button>
              ))}
            </div>
          </div>
          <div className="results-filter-divider" />
          <div className="results-filter-group">
            <p className="results-filter-label">Période</p>
            <div className="results-chips">
              {PERIODES.map(p => (
                <button
                  key={p}
                  onClick={() => handlePeriodeChange(p)}
                  className={`results-chip results-chip--period ${periode === p ? 'active' : ''}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="results-filter-divider" />
          <div className="results-filter-group">
            <label className="results-filter-checkbox">
              <input
                type="checkbox"
                checked={filterPaidOnly}
                onChange={(e) => setFilterPaidOnly(e.target.checked)}
              />
              <DollarSign size={16} />
              <span>Élèves à jour uniquement</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {selectedClasse && !loading && withGrades.length > 0 && (
        <div className="results-stats-grid">
          {[
            {
              label: 'Moyenne de classe',
              value: classeMoyenne ? `${classeMoyenne}/20` : 'N/A',
              sub: getMention(classeMoyenne),
              color: getMentionColor(classeMoyenne),
              bg: getMentionBg(classeMoyenne),
              icon: <BarChart3 size={22} />,
            },
            {
              label: 'Taux de réussite',
              value: `${tauxReussite}%`,
              sub: `${admis} admis sur ${withGrades.length}`,
              color: tauxReussite >= 50 ? '#059669' : '#dc2626',
              bg: tauxReussite >= 50 ? '#ecfdf5' : '#fef2f2',
              icon: <TrendingUp size={22} />,
            },
            {
              label: 'Admis (≥10)',
              value: `${admis}/${withGrades.length}`,
              sub: `${withGrades.length - admis} non admis`,
              color: '#3b82f6',
              bg: '#eff6ff',
              icon: <CheckCircle size={22} />,
            },
            {
              label: 'Meilleur(e) élève',
              value: best ? `${best.prenom} ${best.nom}` : 'N/A',
              sub: best ? `${parseFloat(best.moyenneGenerale).toFixed(2)}/20 · 1er rang` : '',
              color: '#f59e0b',
              bg: '#fffbeb',
              icon: <Trophy size={22} />,
            },
          ].map((s, i) => (
            <div key={i} className="results-stat-card" style={{ '--stat-color': s.color }}>
              <div className="results-stat-card__icon" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div className="results-stat-card__info">
                <span className="results-stat-card__label">{s.label}</span>
                <span className="results-stat-card__value" style={{ color: s.color }}>{s.value}</span>
                {s.sub && <span className="results-stat-card__sub">{s.sub}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {!selectedClasse ? (
        <div className="results-empty-state">
          <div className="results-empty-state__icon">
            <GraduationCap size={40} color="#cbd5e1" />
          </div>
          <p className="results-empty-state__text">Sélectionnez une classe pour afficher les bulletins</p>
          <span className="results-empty-state__hint">Choisissez une classe et une période ci-dessus</span>
        </div>
      ) : loading ? (
        <div className="results-loading">
          <div className="results-loading__spinner" />
          <span>Chargement des résultats...</span>
        </div>
      ) : selectedEleve ? (

        /* ════════════════ BULLETIN DETAIL ════════════════ */
        <div className="admin-panel bulletin-card">
          {/* Bulletin header */}
          <div className="bulletin-card__header">
            <div className="bulletin-card__school-badge">
              <Award size={16} />
              Bulletin Scolaire Officiel
            </div>
            <div className="bulletin-card__identity">
              <div>
                <h2 className="bulletin-card__name">
                  {selectedEleve.prenom} {selectedEleve.nom}
                </h2>
                <p className="bulletin-card__meta">
                  {classeInfo.nom} · {periode} · Matricule : <strong>{selectedEleve.matricule}</strong>
                </p>
              </div>
              <div className="bulletin-card__avg-block">
                <span
                  className="bulletin-card__avg-value"
                  style={{ color: getMentionColor(selectedEleve.moyenneGenerale) }}
                >
                  {selectedEleve.moyenneGenerale
                    ? `${parseFloat(selectedEleve.moyenneGenerale).toFixed(2)}/20`
                    : 'N/A'}
                </span>
                <span
                  className="bulletin-card__avg-mention"
                  style={{
                    background: getMentionBg(selectedEleve.moyenneGenerale),
                    color: getMentionColor(selectedEleve.moyenneGenerale),
                  }}
                >
                  {getMention(selectedEleve.moyenneGenerale)} · Rang {selectedEleve.rang ?? '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Subject table */}
          <div className="table-responsive">
            <table className="admin-table bulletin-subject-table">
              <thead>
                <tr>
                  <th>Matière</th>
                  <th>Prof. responsable</th>
                  <th style={{ textAlign: 'center' }}>Coeff.</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'center' }}>Moy. matière</th>
                  <th>Mention</th>
                </tr>
              </thead>
              <tbody>
                {selectedEleve.matieres.map(m => (
                  <tr key={m.matiereId} className={!m.moyenne ? 'bulletin-row--empty' : ''}>
                    <td className="bulletin-subject-name">{m.matiere}</td>
                    <td className="bulletin-teacher">{m.professeur}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="bulletin-coeff">{m.coefficient}</span>
                    </td>
                    <td>
                      <div className="bulletin-notes-wrap">
                        {m.notes.length === 0 ? (
                          <span className="bulletin-no-note">Aucune note</span>
                        ) : m.notes.map(n => (
                          <span
                            key={n.id}
                            title={n.type}
                            className="bulletin-note-chip"
                            style={{
                              background: getMentionBg(n.valeur),
                              color: getMentionColor(n.valeur),
                            }}
                          >
                            {n.valeur}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {m.moyenne !== null && m.moyenne !== undefined ? (
                        <span
                          className="bulletin-avg-chip"
                          style={{
                            color: getMentionColor(m.moyenne),
                            background: getMentionBg(m.moyenne),
                          }}
                        >
                          {Number(m.moyenne).toFixed(2)}/20
                        </span>
                      ) : (
                        <span className="bulletin-no-note">—</span>
                      )}
                    </td>
                    <td>
                      {m.moyenne && (
                        <span
                          className="bulletin-mention-pill"
                          style={{
                            background: getMentionBg(m.moyenne),
                            color: getMentionColor(m.moyenne),
                          }}
                        >
                          {getMention(m.moyenne)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bulletin footer */}
          <div className="bulletin-card__footer">
            <div className="bulletin-card__footer-stats">
              <div className="bulletin-footer-stat">
                <Star size={14} />
                <span>Rang : <strong style={{ color: '#0A2F6B' }}>{selectedEleve.rang}</strong></span>
              </div>
              <div className="bulletin-footer-stat">
                <Award size={14} />
                <span>
                  Mention :{' '}
                  <strong style={{ color: getMentionColor(selectedEleve.moyenneGenerale) }}>
                    {getMention(selectedEleve.moyenneGenerale)}
                  </strong>
                </span>
              </div>
              <div className="bulletin-footer-stat">
                {parseFloat(selectedEleve.moyenneGenerale) >= 10
                  ? <CheckCircle size={14} color="#059669" />
                  : <XCircle size={14} color="#dc2626" />}
                <span style={{ color: parseFloat(selectedEleve.moyenneGenerale) >= 10 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                  {parseFloat(selectedEleve.moyenneGenerale) >= 10 ? 'Admis(e)' : 'Non admis(e)'}
                </span>
              </div>
            </div>
            <button className="results-btn results-btn--outline" onClick={() => setSelectedEleve(null)}>
              ← Retour à la liste
            </button>
          </div>
        </div>

      ) : (

        /* ════════════════ STUDENTS LIST ════════════════ */
        <div className="admin-panel">
          <div className="admin-panel__header results-list-header">
            <h2 className="admin-panel__title">
              Résultats — {classeInfo.nom}
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#94a3b8', marginLeft: '0.5rem' }}>
                · {periode}
              </span>
            </h2>
            <span className="results-count-badge">{bulletins.length} élève(s)</span>
          </div>

          <div className="table-responsive">
            {bulletins.length === 0 ? (
              <div className="results-empty-table">
                <BarChart3 size={36} color="#e2e8f0" />
                <p>Aucune note saisie pour cette période.</p>
                <span>Utilisez la page « Saisie des Notes » pour commencer.</span>
              </div>
            ) : (
              <table className="admin-table results-table">
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: 'center' }}>Rang</th>
                    <th style={{ width: 90 }}>Matricule</th>
                    <th>Nom & Prénom</th>
                    <th style={{ textAlign: 'center' }}>Moy. générale</th>
                    <th>Mention</th>
                    <th style={{ textAlign: 'center' }}>Statut</th>
                    <th style={{ textAlign: 'center' }}>Bulletin</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBulletins.map((b, idx) => {
                    const moy = b.moyenneGenerale !== null ? parseFloat(b.moyenneGenerale) : NaN;
                    const admis = !isNaN(moy) && moy >= 10;
                    const isFirst = b.rang === 1;
                    return (
                      <tr
                        key={b.eleveId}
                        className={`results-row ${isFirst ? 'results-row--gold' : ''}`}
                        style={{ animationDelay: `${idx * 0.03}s` }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          {isFirst ? (
                            <span className="results-rank results-rank--first">
                              <Trophy size={13} /> {b.rang}er
                            </span>
                          ) : b.rang ? (
                            <span className="results-rank">{b.rang}</span>
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>—</span>
                          )}
                        </td>
                        <td className="results-matricule">{b.matricule}</td>
                        <td className="results-student-name">
                          {b.nom} {b.prenom}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {b.moyenneGenerale !== null && b.moyenneGenerale !== undefined ? (
                            <span
                              className="results-avg-chip"
                              style={{
                                color: getMentionColor(b.moyenneGenerale),
                                background: getMentionBg(b.moyenneGenerale),
                              }}
                            >
                              {Number(b.moyenneGenerale).toFixed(2)}/20
                            </span>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.82rem' }}>
                              Aucune note
                            </span>
                          )}
                        </td>
                        <td>
                          {b.moyenneGenerale && (
                            <span
                              className="results-mention-pill"
                              style={{
                                background: getMentionBg(b.moyenneGenerale),
                                color: getMentionColor(b.moyenneGenerale),
                              }}
                            >
                              {getMention(b.moyenneGenerale)}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {b.moyenneGenerale ? (
                            <span className={`results-status-badge ${admis ? 'results-status-badge--success' : 'results-status-badge--fail'}`}>
                              {admis
                                ? <><CheckCircle size={12} /> Admis</>
                                : <><XCircle size={12} /> Non admis</>}
                            </span>
                          ) : null}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="results-view-btn"
                            title="Voir le bulletin"
                            onClick={() => setSelectedEleve(b)}
                          >
                            <User size={14} />
                            Bulletin
                          </button>
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
