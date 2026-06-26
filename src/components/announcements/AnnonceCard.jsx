import React from 'react';
import { Pin, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';
import {
  formatAnnonceDateShort,
  getCategoryStyle,
  getCategoryIcon,
} from './announcementUtils';
import './AnnouncementsFeed.css';

export default function AnnonceCard({ annonce, expanded, onToggle, featured = false }) {
  const style = getCategoryStyle(annonce.categorie);
  const CategoryIcon = getCategoryIcon(annonce.categorie);
  const isLong = annonce.contenu.length > 320;
  const showFull = expanded || !isLong;
  const displayContent = showFull ? annonce.contenu : `${annonce.contenu.slice(0, 320)}…`;
  const isPinned = annonce.epinglee || featured;

  return (
    <article
      className={[
        'annonce-card',
        isPinned ? 'annonce-card--featured' : '',
        expanded ? 'annonce-card--expanded' : '',
      ].filter(Boolean).join(' ')}
      style={{ '--annonce-accent': style.accent }}
    >
      <div className="annonce-card__accent" aria-hidden="true" />

      <div className="annonce-card__inner">
        <div className="annonce-card__top">
          <div
            className="annonce-card__icon"
            style={{ background: style.bg, color: style.color, borderColor: style.border }}
          >
            <CategoryIcon size={20} strokeWidth={2.25} />
          </div>

          <div className="annonce-card__head">
            <div className="annonce-card__labels">
              <span
                className="annonce-card__category"
                style={{ background: style.bg, color: style.color, borderColor: style.border }}
              >
                {annonce.categorie}
              </span>
              {isPinned && (
                <span className="annonce-card__pin-badge">
                  <Pin size={12} /> À la une
                </span>
              )}
            </div>
            <h2 className="annonce-card__title">{annonce.titre}</h2>
            <div className="annonce-card__meta">
              <span className="annonce-card__meta-chip">
                <Calendar size={13} />
                {formatAnnonceDateShort(annonce.createdAt)}
              </span>
              {annonce.auteurNom && (
                <span className="annonce-card__meta-chip">
                  <User size={13} />
                  {annonce.auteurNom}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="annonce-card__body">
          {displayContent.split('\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {isLong && (
          <button type="button" className="annonce-card__more" onClick={onToggle}>
            {expanded ? (
              <>Réduire <ChevronUp size={16} /></>
            ) : (
              <>Lire la suite <ChevronDown size={16} /></>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
