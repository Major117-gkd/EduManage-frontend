import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';

const ParentContext = createContext(null);

export function ParentProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const eleveParam = searchParams.get('eleve');

  const eleveId = useMemo(() => {
    if (eleveParam) {
      const parsed = parseInt(eleveParam, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return profil?.eleve_id || profil?.eleve_actif?.id || profil?.enfants?.[0]?.id || null;
  }, [eleveParam, profil]);

  const childSearch = eleveId ? `?eleve=${eleveId}` : '';

  const loadProfil = useCallback(async (childId) => {
    setLoading(true);
    try {
      const qs = childId ? `?eleve_id=${childId}` : '';
      const data = await api.get(`/parent/me${qs}`);
      setProfil(data);

      const activeId = data.eleve_id || data.eleve_actif?.id;
      if (activeId && String(eleveParam) !== String(activeId)) {
        setSearchParams({ eleve: String(activeId) }, { replace: true });
      }
    } catch (err) {
      if (childId && err?.status === 403) {
        setSearchParams({}, { replace: true });
        return;
      }
      setProfil(null);
    } finally {
      setLoading(false);
    }
  }, [eleveParam, setSearchParams]);

  useEffect(() => {
    const childId = eleveParam ? parseInt(eleveParam, 10) : null;
    loadProfil(Number.isNaN(childId) ? null : childId);
  }, [eleveParam, loadProfil]);

  const setActiveChild = useCallback(
    (id) => {
      if (!id) return;
      setSearchParams({ eleve: String(id) });
    },
    [setSearchParams]
  );

  const enfants = profil?.enfants || [];
  const eleveActif = useMemo(() => {
    if (profil?.eleve_actif) return profil.eleve_actif;
    return enfants.find((e) => e.id === eleveId) || null;
  }, [profil, enfants, eleveId]);

  const hasMultipleChildren = enfants.length > 1;

  const value = useMemo(
    () => ({
      profil,
      loading,
      eleveId,
      childSearch,
      enfants,
      eleveActif,
      hasMultipleChildren,
      setActiveChild,
      reloadProfil: () => loadProfil(eleveId),
    }),
    [profil, loading, eleveId, childSearch, enfants, eleveActif, hasMultipleChildren, setActiveChild, loadProfil]
  );

  return <ParentContext.Provider value={value}>{children}</ParentContext.Provider>;
}

export function useParentContext() {
  const ctx = useContext(ParentContext);
  if (!ctx) throw new Error('useParentContext doit être utilisé dans ParentProvider');
  return ctx;
}
