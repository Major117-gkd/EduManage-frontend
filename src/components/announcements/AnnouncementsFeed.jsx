import React, { useState, useEffect } from 'react';
import { Megaphone, Pin } from 'lucide-react';
import { api } from '../../services/api';
import AnnonceCard from './AnnonceCard';
import './AnnouncementsFeed.css';

export default function AnnouncementsFeed({ className = '' }) {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api.get('/public/annonces')
      .then((data) => setAnnonces(Array.isArray(data) ? data : []))
      .catch(() => setError('Impossible de charger les annonces.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={`annonces-feed__skeleton ${className}`.trim()}>
        <div className="annonces-feed__skeleton-card" />
        <div className="annonces-feed__skeleton-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`annonces-feed__state annonces-feed__state--error ${className}`.trim()}>
        {error}
      </div>
    );
  }

  if (annonces.length === 0) {
    return (
      <div className={`annonces-feed__state ${className}`.trim()}>
        <div className="annonces-feed__state-icon">
          <Megaphone size={28} color="#94a3b8" />
        </div>
        <p><strong>Aucune annonce pour le moment</strong></p>
        <p>Revenez bientôt ou contactez le secrétariat.</p>
      </div>
    );
  }

  const pinned = annonces.find((a) => a.epinglee);
  const others = pinned ? annonces.filter((a) => a.id !== pinned.id) : annonces;

  return (
    <div className={`annonces-feed ${className}`.trim()}>
      {pinned && (
        <>
          <p className="annonces-feed__section-label">
            <Pin size={13} /> À la une
          </p>
          <AnnonceCard
            annonce={pinned}
            featured
            expanded={expandedId === pinned.id}
            onToggle={() => setExpandedId(expandedId === pinned.id ? null : pinned.id)}
          />
        </>
      )}

      {others.length > 0 && (
        <>
          {pinned && (
            <p className="annonces-feed__section-label" style={{ marginTop: '0.5rem' }}>
              Toutes les annonces
            </p>
          )}
          {others.map((a) => (
            <AnnonceCard
              key={a.id}
              annonce={a}
              expanded={expandedId === a.id}
              onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}
