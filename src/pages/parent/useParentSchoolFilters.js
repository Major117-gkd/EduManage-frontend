import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PERIODES } from '../../utils/gradeEntry';

export function useParentSchoolFilters({ withPeriode = false, eleveId } = {}) {
  const [annees, setAnnees] = useState([]);
  const [periodes, setPeriodes] = useState(PERIODES);
  const [annee, setAnnee] = useState('');
  const [periode, setPeriode] = useState(PERIODES[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eleveId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    api.get(`/parent/annees?eleve_id=${eleveId}`)
      .then((d) => {
        const list = d.annees || [];
        setAnnees(list);
        setPeriodes(d.periodes?.length ? d.periodes : PERIODES);
        setAnnee(d.defaultAnnee || d.active || list[0] || '');
        if (withPeriode) {
          setPeriode(d.defaultPeriode || d.periodes?.[0] || PERIODES[0]);
        }
      })
      .catch((err) => {
        setAnnees([]);
        setError(err.data?.error || 'Impossible de charger les années scolaires.');
      })
      .finally(() => setLoading(false));
  }, [eleveId, withPeriode]);

  return {
    annees,
    periodes,
    annee,
    setAnnee,
    periode,
    setPeriode,
    loading,
    error,
    ready: !loading && Boolean(annee) && Boolean(eleveId),
  };
}
