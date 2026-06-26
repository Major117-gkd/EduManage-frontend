import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import AnnouncementsFeed from '../components/announcements/AnnouncementsFeed';
import './AnnouncementsPage.css';

export default function AnnouncementsPage() {
  const [schoolName, setSchoolName] = useState('GSP Elhadj Mamadou Saïdou Diallo');

  useEffect(() => {
    api.get('/public/site-info', { skipAuth: true })
      .then((d) => { if (d?.nom_ecole) setSchoolName(d.nom_ecole); })
      .catch(() => {});
  }, []);

  return (
    <div className="annonces-page">
      <header className="annonces-page__header">
        <div className="annonces-page__header-inner">
          <Link to="/" className="annonces-page__back">
            <ArrowLeft size={18} /> Retour à l&apos;accueil
          </Link>
          <div className="annonces-page__brand">
            <img src="/images/logo_boubacar.png" alt="Logo" />
            <div>
              <span className="annonces-page__school">{schoolName}</span>
              <h1 className="annonces-page__title">
                <Megaphone size={28} />
                Annonces &amp; informations
              </h1>
            </div>
          </div>
          <p className="annonces-page__intro">
            Retrouvez ici les communications officielles de l&apos;établissement : rentrée, événements, rappels importants et informations pour les familles.
          </p>
        </div>
      </header>

      <main className="annonces-page__main">
        <AnnouncementsFeed />
      </main>

      <footer className="annonces-page__footer">
        <Link to="/infos">Infos &amp; tarifs</Link>
        <span>·</span>
        <Link to="/login">Espace connecté</Link>
      </footer>
    </div>
  );
}
