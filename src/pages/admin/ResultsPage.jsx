import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Trophy, BarChart3, User,
  TrendingUp, CheckCircle, XCircle, Printer,
  GraduationCap, BookOpen, DollarSign, X, FileDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';
import './ResultsPage.css';

import { api } from '../../services/api';
import PaymentStatusList, { printPaymentStatusList, isStudentPaid } from '../../components/PaymentStatusList/PaymentStatusList';
import BulletinCard from '../../components/BulletinCard/BulletinCard';
import { getMention, getMentionColor, getMentionBg } from '../../components/BulletinCard/bulletinHelpers';
import BulletinPrintBatch, {
  printBulletinsBatch,
  exportBulletinsPDF,
} from '../../components/BulletinPrintBatch/BulletinPrintBatch';
import ClassResultsPrint, { printClassResults } from '../../components/ClassResultsPrint/ClassResultsPrint';
import '../../components/BulletinPrintBatch/BulletinPrintBatch.css';
import '../../components/ClassResultsPrint/ClassResultsPrint.css';

const PERIODES = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Semestre 1', 'Semestre 2'];

export default function ResultsPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [periode, setPeriode] = useState('Trimestre 1');
  const [bulletins, setBulletins] = useState([]);
  const [classeInfo, setClasseInfo] = useState({ nom: '', niveau: '' });
  const [classeMatieres, setClasseMatieres] = useState([]);
  const [classeFormules, setClasseFormules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [filterPaidOnly, setFilterPaidOnly] = useState(false);
  const [paymentPrintMode, setPaymentPrintMode] = useState(null);
  const [bulletinPrintOpen, setBulletinPrintOpen] = useState(false);
  const [bulletinPrintMode, setBulletinPrintMode] = useState('all');
  const [resultsPrintOpen, setResultsPrintOpen] = useState(false);
  const [filterNiveau, setFilterNiveau] = useState('');
  const [pdfExporting, setPdfExporting] = useState(false);

  const paidStudents = bulletins.filter((b) => isStudentPaid(b.statut_financier));
  const unpaidStudents = bulletins.filter((b) => !isStudentPaid(b.statut_financier));
  const bulletinsForPrint = bulletinPrintMode === 'paid' ? paidStudents : bulletins;

  const openPaymentPrint = (mode, autoPrint = false) => {
    setPaymentPrintMode(mode);
    if (autoPrint) {
      setTimeout(() => printPaymentStatusList(), 500);
    }
  };

  const getPaymentBadge = (statut) => {
    if (isStudentPaid(statut)) {
      return (
        <span className="results-payment-badge results-payment-badge--paid">
          <CheckCircle size={12} /> À jour
        </span>
      );
    }
    return (
      <span className="results-payment-badge results-payment-badge--unpaid">
        <XCircle size={12} /> {statut || 'Non à jour'}
      </span>
    );
  };

  useEffect(() => {
    api.get('/admin/classes')
      .then(d => { if (Array.isArray(d)) setClasses(d); })
      .catch(() => {});
  }, []);

  const openBulletinPrint = (mode = 'all') => {
    setBulletinPrintMode(mode);
    setBulletinPrintOpen(true);
  };

  const niveauOptions = useMemo(() => {
    const map = new Map();
    classes.forEach((c) => {
      const nom = c.niveau || c.niveauEtude?.nom;
      if (!nom) return;
      if (!map.has(nom)) {
        map.set(nom, {
          nom,
          cycle: c.cycle || c.niveauEtude?.cycle || '',
          classCount: 0,
        });
      }
      map.get(nom).classCount += 1;
    });
    const cycleOrder = { Primaire: 0, Collège: 1, Lycée: 2 };
    return [...map.values()].sort(
      (a, b) =>
        (cycleOrder[a.cycle] ?? 9) - (cycleOrder[b.cycle] ?? 9)
        || a.nom.localeCompare(b.nom, 'fr')
    );
  }, [classes]);

  const filteredClasses = useMemo(() => {
    if (!filterNiveau) return classes;
    return classes.filter(
      (c) => c.niveau === filterNiveau || c.niveauEtude?.nom === filterNiveau
    );
  }, [classes, filterNiveau]);

  const handleNiveauFilter = (niveau) => {
    setFilterNiveau(niveau);
    if (niveau && selectedClasse) {
      const c = classes.find((x) => x.id === selectedClasse.id);
      if (!c || (c.niveau !== niveau && c.niveauEtude?.nom !== niveau)) {
        setSelectedClasse(null);
        setBulletins([]);
        setClasseMatieres([]);
      }
    }
  };

  const seuilReussite = classeFormules?.seuilReussite ?? 10;

  const handleExportSinglePDF = async () => {
    if (!selectedEleve) return;
    setPdfExporting(true);
    try {
      await exportBulletinsPDF(
        '#bulletin-single-export',
        `bulletin_${selectedEleve.prenom}_${selectedEleve.nom}.pdf`
      );
    } finally {
      setPdfExporting(false);
    }
  };

  const handleExportBatchPDF = async () => {
    setPdfExporting(true);
    try {
      const safeClass = (classeInfo.nom || 'classe').replace(/\s+/g, '_');
      await exportBulletinsPDF(
        '#bulletin-print-batch-content',
        `bulletins_${safeClass}_${periode.replace(/\s+/g, '_')}.pdf`
      );
    } finally {
      setPdfExporting(false);
    }
  };

  const loadBulletins = (classeId, p) => {
    setLoading(true);
    setBulletins([]);
    setClasseMatieres([]);
    setSelectedEleve(null);
    api.get(`/admin/classes/${classeId}/bulletins?periode=${encodeURIComponent(p)}`)
      .then(data => {
        if (data.bulletins) {
          setBulletins(data.bulletins);
          setClasseInfo({ nom: data.classe, niveau: data.niveau });
          setClasseMatieres(data.matieres || []);
          setClasseFormules(data.formules || null);
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
  const admis = withGrades.filter(b => parseFloat(b.moyenneGenerale) >= seuilReussite).length;
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

  const printStats = {
    total: filteredBulletins.length,
    withGrades: withGrades.length,
    admis,
    tauxReussite,
    classeMoyenne: classeMoyenne ? `${classeMoyenne}/20` : null,
    bestName: best ? `${best.prenom} ${best.nom}` : null,
    bestMoy: best ? parseFloat(best.moyenneGenerale).toFixed(2) : null,
  };

  return (
    <div className="results-page">

      {/* ── Page Header ── */}
      <div className="results-header">
        <div className="results-header__left">
          <button className="results-back-btn" onClick={() => navigate('/admin/grades/consultation')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="results-title">Bulletins & Résultats</h1>
            <p className="results-subtitle">Classement, moyennes générales et bulletins individuels</p>
          </div>
        </div>
        {selectedEleve && (
          <div className="results-header__actions">
            <button className="results-btn results-btn--outline" onClick={handleExportSinglePDF} disabled={pdfExporting}>
              <FileDown size={16} /> {pdfExporting ? 'Export...' : 'Exporter PDF'}
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
              {filterNiveau ? `${filterNiveau} · ` : ''}{classeInfo.nom} · {periode}
            </span>
          )}
        </div>
        <div className="results-filters__body">
          <div className="results-filter-group">
            <p className="results-filter-label">Niveau d&apos;étude</p>
            <div className="results-chips">
              <button
                type="button"
                onClick={() => handleNiveauFilter('')}
                className={`results-chip ${!filterNiveau ? 'active' : ''}`}
              >
                Tous
              </button>
              {niveauOptions.map((n) => (
                <button
                  key={n.nom}
                  type="button"
                  onClick={() => handleNiveauFilter(n.nom)}
                  className={`results-chip ${filterNiveau === n.nom ? 'active' : ''}`}
                  title={`${n.cycle} · ${n.classCount} classe(s)`}
                >
                  {n.nom}
                  <span className="results-chip__meta">{n.classCount}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="results-filter-divider" />
          <div className="results-filter-group">
            <p className="results-filter-label">Classe</p>
            <div className="results-chips">
              {filteredClasses.length === 0 ? (
                <span className="results-filter-empty">Aucune classe pour ce niveau.</span>
              ) : (
                filteredClasses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectClasse(c)}
                    className={`results-chip ${selectedClasse?.id === c.id ? 'active' : ''}`}
                    title={c.niveau ? `Niveau : ${c.niveau}` : undefined}
                  >
                    {c.nom}
                  </button>
                ))
              )}
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
          {selectedClasse && bulletins.length > 0 && (
            <>
              <div className="results-filter-divider" />
              <div className="results-filter-group">
                <p className="results-filter-label">Imprimer le classement</p>
                <div className="results-print-payment-btns">
                  <button
                    type="button"
                    className="results-btn results-btn--primary results-btn--sm"
                    onClick={() => setResultsPrintOpen(true)}
                  >
                    <Printer size={14} /> Résultats — {classeInfo.nom}
                  </button>
                </div>
              </div>
              <div className="results-filter-divider" />
              <div className="results-filter-group">
                <p className="results-filter-label">Imprimer les bulletins</p>
                <div className="results-print-payment-btns">
                  <button
                    type="button"
                    className="results-btn results-btn--primary results-btn--sm"
                    onClick={() => openBulletinPrint('all')}
                  >
                    <Printer size={14} /> Tous ({bulletins.length})
                  </button>
                  <button
                    type="button"
                    className="results-btn results-btn--outline results-btn--sm"
                    onClick={() => openBulletinPrint('paid')}
                  >
                    <Printer size={14} /> À jour ({paidStudents.length})
                  </button>
                </div>
              </div>
              <div className="results-filter-divider" />
              <div className="results-filter-group">
                <p className="results-filter-label">Imprimer statut paiements</p>
                <div className="results-print-payment-btns">
                  <button
                    type="button"
                    className="results-btn results-btn--outline results-btn--sm"
                    onClick={() => openPaymentPrint('paid')}
                  >
                    <Printer size={14} /> À jour ({paidStudents.length})
                  </button>
                  <button
                    type="button"
                    className="results-btn results-btn--outline results-btn--sm"
                    onClick={() => openPaymentPrint('unpaid')}
                  >
                    <Printer size={14} /> Non à jour ({unpaidStudents.length})
                  </button>
                  <button
                    type="button"
                    className="results-btn results-btn--primary results-btn--sm"
                    onClick={() => openPaymentPrint('both')}
                  >
                    <Printer size={14} /> Les deux listes
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedClasse && !loading && (
        <div className="results-formula-banner" style={{ marginTop: 0, marginBottom: '1rem', background: classeMatieres.length ? '#ecfdf5' : '#fffbeb', borderColor: classeMatieres.length ? '#a7f3d0' : '#fde68a', color: classeMatieres.length ? '#065f46' : '#92400e' }}>
          <BookOpen size={15} />
          <span>
            {classeMatieres.length > 0
              ? (
                <>
                  <strong>{classeMatieres.length} matière(s)</strong> affectée(s) à {classeInfo.nom} ({classeMatieres.map((m) => m.nom).join(', ')}).
                  {classeFormules && (
                    <>
                      {' '}Moyenne matière : <code>{classeFormules.moyenneMatiere}</code>
                      {' · '}Moyenne générale : <code>{classeFormules.moyenneGenerale}</code>
                    </>
                  )}
                </>
              )
              : (
                <>
                  <strong>Aucune matière affectée</strong> à cette classe. Allez dans « Classes » pour ajouter les matières.
                </>
              )}
          </span>
        </div>
      )}

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
              label: `Admis (≥${seuilReussite})`,
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
        <div id="bulletin-single-export">
          <div className="bulletin-print-page">
            <BulletinCard
              eleve={selectedEleve}
              classeInfo={classeInfo}
              periode={periode}
              onBack={() => setSelectedEleve(null)}
            />
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
            <span className="results-count-badge">
              {bulletins.length} élève(s) · {paidStudents.length} à jour · {unpaidStudents.length} non à jour
            </span>
            <button
              type="button"
              className="results-btn results-btn--outline results-btn--sm print-hide"
              onClick={() => setResultsPrintOpen(true)}
              title="Imprimer le classement"
            >
              <Printer size={14} /> Imprimer résultats
            </button>
          </div>

          <div className="table-responsive">
            {bulletins.length === 0 ? (
              <div className="results-empty-table">
                <BarChart3 size={36} color="#e2e8f0" />
                <p>Aucune note saisie pour cette période.</p>
                <span>Les professeurs saisissent les notes depuis leur espace. Consultez les résultats ici une fois les notes enregistrées.</span>
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
                    <th style={{ textAlign: 'center' }}>Paiement</th>
                    <th style={{ textAlign: 'center' }}>Statut</th>
                    <th style={{ textAlign: 'center' }}>Bulletin</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBulletins.map((b, idx) => {
                    const moy = b.moyenneGenerale !== null ? parseFloat(b.moyenneGenerale) : NaN;
                    const admisRow = !isNaN(moy) && moy >= seuilReussite;
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
                          {getPaymentBadge(b.statut_financier)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {b.moyenneGenerale ? (
                            <span className={`results-status-badge ${admisRow ? 'results-status-badge--success' : 'results-status-badge--fail'}`}>
                              {admisRow
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

      {bulletinPrintOpen && selectedClasse && (
        <div className="modal-overlay" onClick={() => setBulletinPrintOpen(false)}>
          <div className="modal-content print-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '980px', width: '95%' }}>
            <div className="modal-header print-hide">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Printer size={22} color="#0A2F6B" />
                <h2>
                  Imprimer les bulletins — {classeInfo.nom}
                </h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setBulletinPrintOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body print-hide" style={{ padding: '0 1.5rem 1rem' }}>
              <p style={{ margin: '0 0 0.75rem', color: '#64748b', fontSize: '0.88rem' }}>
                Choisissez les élèves à inclure dans l&apos;impression ou l&apos;export PDF.
              </p>
              <div className="bulletin-print-mode-btns">
                <button
                  type="button"
                  className={bulletinPrintMode === 'all' ? 'active' : ''}
                  onClick={() => setBulletinPrintMode('all')}
                >
                  Tous les élèves ({bulletins.length})
                </button>
                <button
                  type="button"
                  className={bulletinPrintMode === 'paid' ? 'active' : ''}
                  onClick={() => setBulletinPrintMode('paid')}
                >
                  Paiement à jour uniquement ({paidStudents.length})
                </button>
              </div>
            </div>
            <div
              className="modal-body bulletin-print-wrapper edu-print-root"
              style={{ padding: '1rem 1.5rem', background: '#e2e8f0', maxHeight: '55vh', overflowY: 'auto' }}
            >
              <BulletinPrintBatch
                bulletins={bulletinsForPrint}
                classeInfo={classeInfo}
                periode={periode}
                mode={bulletinPrintMode}
              />
            </div>
            <div className="modal-footer print-hide">
              <button type="button" className="btn-cancel" onClick={() => setBulletinPrintOpen(false)}>Fermer</button>
              <button
                type="button"
                className="btn-submit"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#475569' }}
                onClick={() => printBulletinsBatch()}
                disabled={bulletinsForPrint.length === 0}
              >
                <Printer size={18} /> Imprimer
              </button>
              <button
                type="button"
                className="btn-submit"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleExportBatchPDF}
                disabled={bulletinsForPrint.length === 0 || pdfExporting}
              >
                <FileDown size={18} /> {pdfExporting ? 'Export...' : 'Exporter PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {resultsPrintOpen && selectedClasse && (
        <div className="modal-overlay" onClick={() => setResultsPrintOpen(false)}>
          <div className="modal-content print-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
            <div className="modal-header print-hide">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Printer size={22} color="#0A2F6B" />
                <h2>
                  Résultats — {filterNiveau ? `${filterNiveau} · ` : ''}{classeInfo.nom}
                </h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setResultsPrintOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body print-hide" style={{ padding: '0 1.5rem 0.75rem' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
                Aperçu du relevé de classement ({periode}). Utilisez « Imprimer » pour lancer l&apos;impression.
              </p>
            </div>
            <div
              className="modal-body class-results-print-wrapper edu-print-root"
              style={{ padding: '1rem 1.5rem', background: '#e2e8f0', maxHeight: '60vh', overflowY: 'auto' }}
            >
              <ClassResultsPrint
                bulletins={sortedBulletins}
                classeInfo={classeInfo}
                periode={periode}
                stats={printStats}
                seuilReussite={seuilReussite}
              />
            </div>
            <div className="modal-footer print-hide">
              <button type="button" className="btn-cancel" onClick={() => setResultsPrintOpen(false)}>Fermer</button>
              <button
                type="button"
                className="btn-submit"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => printClassResults()}
                disabled={sortedBulletins.length === 0}
              >
                <Printer size={18} /> Imprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentPrintMode && selectedClasse && (
        <div className="modal-overlay" onClick={() => setPaymentPrintMode(null)}>
          <div className="modal-content print-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '960px', width: '95%' }}>
            <div className="modal-header print-hide">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <DollarSign size={22} color="#0A2F6B" />
                <h2>
                  Statut des paiements — {classeInfo.nom}
                  {paymentPrintMode === 'paid' && ' (À jour)'}
                  {paymentPrintMode === 'unpaid' && ' (Non à jour)'}
                  {paymentPrintMode === 'both' && ' (Complet)'}
                </h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setPaymentPrintMode(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body payment-status-print-wrapper edu-print-root" style={{ padding: '1.5rem', background: '#e2e8f0' }}>
              <PaymentStatusList
                classeInfo={classeInfo}
                periode={periode}
                paidStudents={paidStudents}
                unpaidStudents={unpaidStudents}
                mode={paymentPrintMode}
              />
            </div>
            <div className="modal-footer print-hide">
              <button type="button" className="btn-cancel" onClick={() => setPaymentPrintMode(null)}>Fermer</button>
              <button
                type="button"
                className="btn-submit"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => printPaymentStatusList()}
              >
                <Printer size={18} /> Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
