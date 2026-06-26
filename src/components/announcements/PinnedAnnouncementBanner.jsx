import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Pin } from 'lucide-react';
import { api } from '../../services/api';
import { plainTextExcerpt, getCategoryStyle } from './announcementUtils';
import './PinnedAnnouncementBanner.css';

export default function PinnedAnnouncementBanner({ linkTo = '/annonces' }) {
  const [annonce, setAnnonce] = useState(null);

  useEffect(() => {
    api.get('/public/annonces/epinglee')
      .then((data) => setAnnonce(data?.id ? data : null))
      .catch(() => {});
  }, []);

  if (!annonce) return null;

  const excerpt = plainTextExcerpt(annonce.contenu, 220);
  const categoryStyle = getCategoryStyle(annonce.categorie);

  return (
    <section className="pinned-annonce-banner" aria-label="Annonce à la une">
      <div className="pinned-annonce-banner__inner">
        <div className="pinned-annonce-banner__badge">
          <Pin size={16} /> À la une
        </div>
        <div className="pinned-annonce-banner__content">
          <div className="pinned-annonce-banner__meta">
            <span
              className="pinned-annonce-banner__category"
              style={{
                background: categoryStyle.bg,
                color: categoryStyle.color,
                borderColor: categoryStyle.border,
              }}
            >
              <Megaphone size={14} aria-hidden />
              {annonce.categorie || 'Info'}
            </span>
          </div>
          <h2 className="pinned-annonce-banner__title">{annonce.titre}</h2>
          <p className="pinned-annonce-banner__text">{excerpt}</p>
          <Link to={linkTo} className="pinned-annonce-banner__link">
            Lire toutes les annonces →
          </Link>
        </div>
      </div>
    </section>
  );
}
