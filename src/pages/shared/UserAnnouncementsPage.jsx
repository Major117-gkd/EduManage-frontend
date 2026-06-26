import React from 'react';
import { Megaphone } from 'lucide-react';
import AnnouncementsFeed from '../../components/announcements/AnnouncementsFeed';
import '../../components/announcements/AnnouncementsFeed.css';
import '../student/StudentSpace.css';

export default function UserAnnouncementsPage({ title = 'Annonces', subtitle }) {
  const defaultSubtitle = 'Retrouvez ici les communications officielles : rentrée, événements, rappels et informations importantes.';

  return (
    <div className="student-page annonces-embedded">
      <header className="annonces-hero">
        <div className="annonces-hero__content">
          <div className="annonces-hero__icon">
            <Megaphone size={26} />
          </div>
          <div>
            <h1 className="annonces-hero__title">{title}</h1>
            <p className="annonces-hero__sub">{subtitle || defaultSubtitle}</p>
          </div>
        </div>
      </header>
      <AnnouncementsFeed />
    </div>
  );
}
