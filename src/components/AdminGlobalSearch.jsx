import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, BookOpen, GraduationCap } from 'lucide-react';
import { api } from '../services/api';
import './AdminGlobalSearch.css';

export default function AdminGlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  const runSearch = useCallback((q) => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    api.get(`/admin/search?q=${encodeURIComponent(q.trim())}`)
      .then((data) => setResults(data))
      .catch(() => setResults({ eleves: [], classes: [], professeurs: [] }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(query), 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const hasResults = results && (
    results.eleves?.length || results.classes?.length || results.professeurs?.length
  );

  const go = (path) => {
    navigate(path);
    setOpen(false);
    setQuery('');
    setResults(null);
  };

  return (
    <div className="admin-global-search" ref={wrapRef}>
      <Search size={20} color="#94a3b8" />
      <input
        type="text"
        placeholder="Rechercher un élève, une classe…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && query.trim().length >= 2 && (
        <div className="admin-global-search__panel">
          {loading && <p className="admin-global-search__empty">Recherche…</p>}
          {!loading && !hasResults && (
            <p className="admin-global-search__empty">Aucun résultat pour « {query} »</p>
          )}
          {!loading && results?.eleves?.length > 0 && (
            <div className="admin-global-search__group">
              <div className="admin-global-search__group-title">
                <Users size={14} /> Élèves
              </div>
              {results.eleves.map((e) => (
                <button key={`e-${e.id}`} type="button" className="admin-global-search__item" onClick={() => go(e.path)}>
                  <span>
                    <strong>{e.label}</strong>
                    <small>{e.sub}</small>
                  </span>
                  {e.statut_financier && (
                    <span className="admin-global-search__badge">{e.statut_financier}</span>
                  )}
                </button>
              ))}
            </div>
          )}
          {!loading && results?.classes?.length > 0 && (
            <div className="admin-global-search__group">
              <div className="admin-global-search__group-title">
                <BookOpen size={14} /> Classes
              </div>
              {results.classes.map((c) => (
                <button key={`c-${c.id}`} type="button" className="admin-global-search__item" onClick={() => go(c.path)}>
                  <span>
                    <strong>{c.label}</strong>
                    <small>{c.sub}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
          {!loading && results?.professeurs?.length > 0 && (
            <div className="admin-global-search__group">
              <div className="admin-global-search__group-title">
                <GraduationCap size={14} /> Professeurs
              </div>
              {results.professeurs.map((p) => (
                <button key={`p-${p.id}`} type="button" className="admin-global-search__item" onClick={() => go(p.path)}>
                  <span>
                    <strong>{p.label}</strong>
                    <small>{p.sub}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
