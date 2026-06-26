import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import BulletinCard from '../../components/BulletinCard/BulletinCard';
import { useStudentSchoolFilters } from './useStudentSchoolFilters';
import StudentSchoolFilters from './StudentSchoolFilters';
import '../admin/ResultsPage.css';
import './StudentSpace.css';

export default function StudentBulletinPage() {
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

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(
        `/student/bulletin?annee_scolaire=${encodeURIComponent(annee)}&periode=${encodeURIComponent(periode)}`
      );
      setData(res);
    } catch (err) {
      setError(err.data?.error || 'Impossible de charger votre bulletin.');
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
    load();
  }, [load, ready, filtersLoading]);

  return (
    <div className="student-page">
      <div className="student-page__header">
        <h1 className="student-page__title">Mon bulletin</h1>
        <p className="student-page__sub">Bulletin scolaire officiel par période</p>
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

      {data?.formules && (
        <div className="grades-view-intro">
          {typeof data.formules === 'string' ? (
            <p>{data.formules}</p>
          ) : (
            <p>
              <strong>Moyenne matière :</strong>{' '}
              <code>{data.formules.moyenneMatiere}</code>
              {' · '}
              <strong>Moyenne générale :</strong>{' '}
              <code>{data.formules.moyenneGenerale}</code>
              {' · '}
              <strong>Seuil de réussite :</strong>{' '}
              <strong>{data.formules.seuilReussite}/20</strong>
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="student-loading">Chargement du bulletin…</div>
      ) : error ? (
        <div className="student-alert student-alert--error">{error}</div>
      ) : data?.bulletin ? (
        <BulletinCard
          eleve={data.bulletin}
          classeInfo={data.classe}
          periode={periode}
        />
      ) : null}
    </div>
  );
}
