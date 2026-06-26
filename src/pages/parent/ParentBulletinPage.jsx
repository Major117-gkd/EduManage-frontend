import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import BulletinCard from '../../components/BulletinCard/BulletinCard';
import { useParentContext } from './ParentContext';
import { useParentSchoolFilters } from './useParentSchoolFilters';
import StudentSchoolFilters from '../student/StudentSchoolFilters';
import '../admin/ResultsPage.css';
import './ParentSpace.css';

export default function ParentBulletinPage() {
  const { eleveId } = useParentContext();
  const filters = useParentSchoolFilters({ withPeriode: true, eleveId });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!filters.ready || !eleveId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(
        `/parent/bulletin?eleve_id=${eleveId}&annee_scolaire=${encodeURIComponent(filters.annee)}&periode=${encodeURIComponent(filters.periode)}`
      );
      setData(res);
    } catch (err) {
      setError(err.data?.error || 'Impossible de charger le bulletin.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [eleveId, filters.annee, filters.periode, filters.ready]);

  useEffect(() => {
    if (!filters.ready) {
      if (!filters.loading) setLoading(false);
      return;
    }
    load();
  }, [load, filters.ready, filters.loading]);

  return (
    <div className="parent-page">
      <div className="parent-page__header">
        <h1 className="parent-page__title">Bulletin scolaire</h1>
        <p className="parent-page__sub">Bulletin officiel de votre enfant par période</p>
      </div>

      <StudentSchoolFilters {...filters} showPeriode />

      {filters.error && <div className="parent-alert parent-alert--error">{filters.error}</div>}
      {error && <div className="parent-alert parent-alert--error">{error}</div>}

      {loading ? (
        <div className="parent-loading">Chargement du bulletin</div>
      ) : data?.bulletin ? (
        <div className="parent-panel" style={{ padding: '1rem' }}>
          <BulletinCard
            eleve={data.bulletin}
            classeInfo={data.classe}
            periode={filters.periode}
          />
        </div>
      ) : null}
    </div>
  );
}
