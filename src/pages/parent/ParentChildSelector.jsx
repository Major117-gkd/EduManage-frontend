import React from 'react';
import { Users, Heart, ChevronDown, Check } from 'lucide-react';
import { useParentContext } from './ParentContext';

function ChildAvatar({ prenom, active = false }) {
  return (
    <span className={`parent-child-chip__avatar${active ? ' parent-child-chip__avatar--active' : ''}`}>
      {prenom?.charAt(0)?.toUpperCase() || '?'}
    </span>
  );
}

export default function ParentChildSelector({ variant = 'header' }) {
  const { enfants, eleveId, setActiveChild, eleveActif, hasMultipleChildren, loading } = useParentContext();

  if (loading && !eleveActif) {
    return variant === 'header' ? (
      <div className="parent-child-badge parent-child-badge--loading">Chargement…</div>
    ) : null;
  }

  if (!eleveActif && !enfants.length) return null;

  /* ── Sidebar : liste verticale ── */
  if (variant === 'sidebar') {
    if (!hasMultipleChildren) return null;
    return (
      <div className="parent-sidebar-children">
        <p className="parent-sidebar-children__title">
          <Users size={14} />
          Mes enfants
        </p>
        <ul className="parent-sidebar-children__list">
          {enfants.map((e) => {
            const active = e.id === eleveId;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  className={`parent-sidebar-child${active ? ' active' : ''}`}
                  onClick={() => setActiveChild(e.id)}
                  aria-current={active ? 'true' : undefined}
                >
                  <ChildAvatar prenom={e.prenom} active={active} />
                  <span className="parent-sidebar-child__name">
                    {e.prenom} {e.nom}
                  </span>
                  {active && <Check size={16} className="parent-sidebar-child__check" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  /* ── Header : plusieurs enfants ── */
  if (hasMultipleChildren) {
    return (
      <div className="parent-child-switcher">
        <span className="parent-child-switcher__label parent-child-switcher__label--desktop">
          <Users size={14} />
          Enfant suivi
        </span>

        {/* Mobile / tablette : menu déroulant */}
        <div className="parent-child-select-wrap">
          <ChevronDown size={16} className="parent-child-select__icon" aria-hidden />
          <select
            className="parent-child-select"
            value={eleveId ?? ''}
            onChange={(e) => setActiveChild(parseInt(e.target.value, 10))}
            aria-label="Choisir l'enfant à consulter"
          >
            {enfants.map((e) => (
              <option key={e.id} value={e.id}>
                {e.prenom} {e.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop : pastilles cliquables */}
        <div className="parent-child-switcher__chips">
          {enfants.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`parent-child-chip${e.id === eleveId ? ' active' : ''}`}
              onClick={() => setActiveChild(e.id)}
              aria-pressed={e.id === eleveId}
            >
              <ChildAvatar prenom={e.prenom} active={e.id === eleveId} />
              {e.prenom} {e.nom}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Header : un seul enfant ── */
  if (eleveActif) {
    return (
      <div className="parent-child-badge">
        <Heart size={15} />
        Suivi : <strong>{eleveActif.prenom} {eleveActif.nom}</strong>
      </div>
    );
  }

  return null;
}
