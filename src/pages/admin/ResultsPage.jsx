import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, BarChart3, Download, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';

const API = 'http://localhost:5000';
const PERIODES = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Semestre 1', 'Semestre 2'];

const getMentionColor = (val) => {
  const v = parseFloat(val);
  if (isNaN(v) || v === null) return '#94a3b8';
  if (v >= 16) return '#059669';
  if (v >= 14) return '#10b981';
  if (v >= 10) return '#d97706';
  return '#dc2626';
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
  const [selectedEleve, setSelectedEleve] = useState(null); // for detail view

  useEffect(() => {
    fetch(`${API}/api/admin/classes`).then(r => r.json()).then(d => { if (Array.isArray(d)) setClasses(d); }).catch(() => {});
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
  const withGrades = bulletins.filter(b => b.moyenneGenerale !== null);
  const classeMoyenne = withGrades.length > 0
    ? (withGrades.reduce((s, b) => s + parseFloat(b.moyenneGenerale), 0) / withGrades.length).toFixed(2)
    : null;
  const admis = withGrades.filter(b => parseFloat(b.moyenneGenerale) >= 10).length;
  const tauxReussite = withGrades.length > 0 ? Math.round((admis / withGrades.length) * 100) : 0;
  const best = withGrades.length > 0 ? withGrades.reduce((best, b) => parseFloat(b.moyenneGenerale) > parseFloat(best.moyenneGenerale) ? b : best) : null;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-dashboard__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/admin/grades')}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} color="#0A2F6B" />
          </button>
          <h1 className="admin-title">Bulletins & Résultats</h1>
        </div>
        {selectedEleve && (
          <button className="btn" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setSelectedEleve(null)}>
            <BarChart3 size={16} /> Vue d'ensemble
          </button>
        )}
      </div>

      {/* Class + Period Selector */}
      <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Filtres</h2>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Classe</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {classes.map(c => (
                <button key={c.id} onClick={() => handleSelectClasse(c)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                    background: selectedClasse?.id === c.id ? '#0A2F6B' : 'white',
                    color: selectedClasse?.id === c.id ? 'white' : '#0f172a',
                    border: `2px solid ${selectedClasse?.id === c.id ? '#0A2F6B' : '#e2e8f0'}`,
                    transition: 'all 0.2s'
                  }}>
                  {c.nom}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Période</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {PERIODES.map(p => (
                <button key={p} onClick={() => handlePeriodeChange(p)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
                    background: periode === p ? '#8b5cf6' : 'white',
                    color: periode === p ? 'white' : '#0f172a',
                    border: `2px solid ${periode === p ? '#8b5cf6' : '#e2e8f0'}`,
                    transition: 'all 0.2s'
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {selectedClasse && !loading && withGrades.length > 0 && (
        <div className="admin-stats__grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Moyenne de classe', value: classeMoyenne ? `${classeMoyenne}/20` : 'N/A', color: getMentionColor(classeMoyenne), icon: <BarChart3 size={22} color={getMentionColor(classeMoyenne)} />, bg: getMentionColor(classeMoyenne) + '18' },
            { label: 'Taux de réussite', value: `${tauxReussite}%`, color: tauxReussite >= 50 ? '#059669' : '#dc2626', icon: <Trophy size={22} color={tauxReussite >= 50 ? '#059669' : '#dc2626'} />, bg: (tauxReussite >= 50 ? '#059669' : '#dc2626') + '18' },
            { label: 'Admis (≥10)', value: `${admis}/${withGrades.length}`, color: '#3b82f6', icon: <User size={22} color="#3b82f6" />, bg: '#eff6ff' },
            { label: 'Meilleur(e) élève', value: best ? `${best.prenom} ${best.nom}` : 'N/A', sub: best ? `${best.moyenneGenerale}/20` : '', color: '#f59e0b', icon: <Trophy size={22} color="#f59e0b" />, bg: '#fffbeb' },
          ].map((s, i) => (
            <div key={i} className="admin-stat-card">
              <div className="admin-stat-card__icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="admin-stat-card__info">
                <span className="admin-stat-card__label">{s.label}</span>
                <span className="admin-stat-card__value" style={{ fontSize: '1.2rem', color: s.color }}>{s.value}</span>
                {s.sub && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.sub}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content area */}
      {!selectedClasse ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <BarChart3 size={48} color="#e2e8f0" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '1.1rem', fontStyle: 'italic' }}>Sélectionnez une classe pour afficher les bulletins.</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Chargement des résultats...</div>
      ) : selectedEleve ? (
        /* ── BULLETIN DETAIL ── */
        <div className="admin-panel">
          <div className="admin-panel__header" style={{ background: 'linear-gradient(135deg, #0A2F6B 0%, #1e40af 100%)', borderRadius: 0 }}>
            <div>
              <h2 style={{ color: 'white', fontSize: '1.2rem', margin: 0 }}>{selectedEleve.prenom} {selectedEleve.nom}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                {classeInfo.nom} · {periode} · Matricule : {selectedEleve.matricule}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>
                {selectedEleve.moyenneGenerale ? `${selectedEleve.moyenneGenerale}/20` : 'N/A'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                {getMention(selectedEleve.moyenneGenerale)} · Rang {selectedEleve.rang}
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Matière</th>
                  <th>Prof. responsable</th>
                  <th>Coefficient</th>
                  <th>Notes</th>
                  <th>Moyenne</th>
                  <th>Mention</th>
                </tr>
              </thead>
              <tbody>
                {selectedEleve.matieres.map(m => (
                  <tr key={m.matiereId} style={{ background: !m.moyenne ? '#fafafa' : 'transparent' }}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{m.matiere}</td>
                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{m.professeur}</td>
                    <td style={{ textAlign: 'center' }}><span style={{ background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>{m.coefficient}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {m.notes.length === 0 ? (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>Aucune note</span>
                        ) : m.notes.map(n => (
                          <span key={n.id} title={n.type}
                            style={{ background: getMentionColor(n.valeur) + '18', color: getMentionColor(n.valeur), padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                            {n.valeur}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: getMentionColor(m.moyenne) }}>
                        {m.moyenne ? `${m.moyenne}/20` : '—'}
                      </span>
                    </td>
                    <td>
                      {m.moyenne && (
                        <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: getMentionColor(m.moyenne) + '18', color: getMentionColor(m.moyenne) }}>
                          {getMention(m.moyenne)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Rang : <strong style={{ color: '#0A2F6B' }}>{selectedEleve.rang}</strong></span>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Mention : <strong style={{ color: getMentionColor(selectedEleve.moyenneGenerale) }}>{getMention(selectedEleve.moyenneGenerale)}</strong></span>
            </div>
            <button onClick={() => setSelectedEleve(null)} className="btn" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a' }}>
              ← Retour à la liste
            </button>
          </div>
        </div>
      ) : (
        /* ── LIST OF ALL STUDENTS ── */
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              Résultats — {classeInfo.nom} · {periode}
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{bulletins.length} élève(s)</span>
          </div>
          <div className="table-responsive">
            {bulletins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontStyle: 'italic' }}>
                Aucune note saisie pour cette période. Utilisez la page "Saisie des Notes" pour commencer.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Matricule</th>
                    <th>Nom & Prénom</th>
                    <th>Moyenne générale</th>
                    <th>Mention</th>
                    <th>Statut</th>
                    <th>Bulletin</th>
                  </tr>
                </thead>
                <tbody>
                  {[...bulletins].sort((a, b) => {
                    if (a.moyenneGenerale === null) return 1;
                    if (b.moyenneGenerale === null) return -1;
                    return parseFloat(b.moyenneGenerale) - parseFloat(a.moyenneGenerale);
                  }).map((b, i) => {
                    const moy = parseFloat(b.moyenneGenerale);
                    return (
                      <tr key={b.eleveId} style={{ background: i === 0 && b.moyenneGenerale ? '#fffbeb' : 'transparent' }}>
                        <td>
                          {i === 0 && b.moyenneGenerale ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Trophy size={14} color="#f59e0b" /> <strong style={{ color: '#f59e0b' }}>1er</strong>
                            </span>
                          ) : (
                            <span style={{ color: '#64748b' }}>{b.moyenneGenerale ? i + 1 : '—'}</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.matricule}</td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{b.nom} {b.prenom}</td>
                        <td>
                          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: getMentionColor(b.moyenneGenerale) }}>
                            {b.moyenneGenerale ? `${b.moyenneGenerale}/20` : <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>Aucune note</span>}
                          </span>
                        </td>
                        <td>
                          {b.moyenneGenerale && (
                            <span style={{ padding: '0.2rem 0.65rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: getMentionColor(b.moyenneGenerale) + '18', color: getMentionColor(b.moyenneGenerale) }}>
                              {getMention(b.moyenneGenerale)}
                            </span>
                          )}
                        </td>
                        <td>
                          {b.moyenneGenerale ? (
                            <span className={`status-badge ${!isNaN(moy) && moy >= 10 ? 'status-badge--success' : 'status-badge--warning'}`}>
                              {!isNaN(moy) && moy >= 10 ? 'Admis' : 'Non admis'}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <button className="action-btn action-btn--view" title="Voir le bulletin" onClick={() => setSelectedEleve(b)}>
                            <User size={15} />
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
