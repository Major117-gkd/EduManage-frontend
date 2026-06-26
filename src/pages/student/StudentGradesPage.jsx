import React, { useState, useEffect, useCallback } from 'react';
import { Filter } from 'lucide-react';
import { api } from '../../services/api';
import { formatAverage, getMentionColor } from '../../utils/gradeEntry';
import { useStudentSchoolFilters } from './useStudentSchoolFilters';
import StudentSchoolFilters from './StudentSchoolFilters';
import '../admin/GradesViewPage.css';
import './StudentSpace.css';

export default function StudentGradesPage() {
  const {
    annees,
    periodes,
    annee,
    setAnnee,
    periode,
    setPeriode,
    loading: filtersLoading,
    error: filtersError,
    ready,
  } = useStudentSchoolFilters({ withPeriode: true });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotes = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(
        `/student/notes?annee_scolaire=${encodeURIComponent(annee)}&periode=${encodeURIComponent(periode)}`
      );
      setData(res);
    } catch (err) {
      setError(err.data?.error || 'Impossible de charger vos notes.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [annee, periode, ready]);

  useEffect(() => {
    if (!ready) {
      if (!filtersLoading) setLoading(false);
      return;
    }
    loadNotes();
  }, [loadNotes, ready, filtersLoading]);

  return (
    <div className="student-page">
      <div className="student-page__header">
        <h1 className="student-page__title">Mes notes</h1>
        <p className="student-page__sub">Consultez vos résultats par matière et par période</p>
      </div>

      <StudentSchoolFilters
        annees={annees}
        periodes={periodes}
        annee={annee}
        setAnnee={setAnnee}
        periode={periode}
        setPeriode={setPeriode}
        loading={filtersLoading}
        showPeriode
      />

      {filtersError && (
        <div className="student-alert student-alert--error">{filtersError}</div>
      )}

      {data && (
        <div className="grades-view-stats">
          <div className="grades-view-stat">
            <div>
              <span className="grades-view-stat__label">Moyenne générale</span>
              <strong style={{ color: getMentionColor(data.moyenneGenerale) }}>
                {data.moyenneGenerale != null ? formatAverage(data.moyenneGenerale) : '—'}
              </strong>
            </div>
          </div>
          <div className="grades-view-stat">
            <div>
              <span className="grades-view-stat__label">Rang en classe</span>
              <strong>{data.rang ? `${data.rang}e / ${data.effectifClasse}` : '—'}</strong>
            </div>
          </div>
          <div className="grades-view-stat">
            <div>
              <span className="grades-view-stat__label">Classe</span>
              <strong>{data.classe?.nom}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="student-panel">
        <div className="student-panel__header">
          <h2 className="student-panel__title">
            <Filter size={16} style={{ verticalAlign: '-2px', marginRight: '0.35rem' }} />
            Détail par matière — {periode}
          </h2>
        </div>
        <div className="table-responsive">
          {loading ? (
            <div className="student-loading">Chargement…</div>
          ) : error ? (
            <div className="student-alert student-alert--error" style={{ margin: '1rem' }}>{error}</div>
          ) : !data?.matieres?.length ? (
            <div className="student-empty">Aucune matière configurée.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Matière</th>
                  <th>Professeur</th>
                  <th style={{ textAlign: 'center' }}>Coeff.</th>
                  <th style={{ textAlign: 'center' }}>D1</th>
                  <th style={{ textAlign: 'center' }}>D2</th>
                  <th style={{ textAlign: 'center' }}>Compo</th>
                  <th style={{ textAlign: 'center' }}>Moy.</th>
                </tr>
              </thead>
              <tbody>
                {data.matieres.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.nom}</td>
                    <td>{m.professeur}</td>
                    <td style={{ textAlign: 'center' }}>{m.coefficient}</td>
                    <td style={{ textAlign: 'center' }}>{m.d1 ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{m.d2 ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{m.compo ?? '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: getMentionColor(m.moyenne) }}>
                      {m.moyenne != null ? formatAverage(m.moyenne) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
