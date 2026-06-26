import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Award,
  Wallet,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  GraduationCap,
} from 'lucide-react';
import { api } from '../../services/api';
import PinnedAnnouncementBanner from '../../components/announcements/PinnedAnnouncementBanner';
import { getMention, getMentionColor, formatAverage } from '../../utils/gradeEntry';
import './StudentSpace.css';

function formatGnf(v) {
  if (v == null) return '—';
  return `${Number(v).toLocaleString('fr-FR')} GNF`;
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function matiereInitial(nom) {
  return (nom || '?').charAt(0).toUpperCase();
}

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dash = await api.get('/student/dashboard');
      setData(dash);

      const tasks = [
        api.get('/notifications?limit=5').catch(() => ({ notifications: [] })),
      ];

      if (dash.annee_scolaire) {
        tasks.push(
          api.get(
            `/student/notes?annee_scolaire=${encodeURIComponent(dash.annee_scolaire)}&periode=${encodeURIComponent(dash.periode || 'Trimestre 1')}`
          ).catch(() => null)
        );
      }

      const [notifRes, notesRes] = await Promise.all(tasks);
      setNotifications(notifRes?.notifications || []);
      setNotes(notesRes);
    } catch (err) {
      setError(err.data?.error || 'Impossible de charger votre tableau de bord.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="student-loading">Chargement de votre espace…</div>;
  }

  if (error) {
    return (
      <div className="student-alert student-alert--error">
        <AlertCircle size={18} />
        {error}
      </div>
    );
  }

  const fin = data?.finances || {};
  const moy = data?.moyenneGenerale;
  const recentGrades = (notes?.matieres || [])
    .filter((m) => m.moyenne != null)
    .slice(0, 5);
  const allMatieres = notes?.matieres || [];

  return (
    <div className="student-dashboard">
      <div className="student-welcome">
        <h1 className="student-welcome__title">
          Bonjour, {data?.eleve?.prenom} 👋
        </h1>
        <p className="student-welcome__sub">Bienvenue dans ton espace élève</p>
        <p className="student-welcome__meta">
          {data?.classe?.nom || '—'} · {data?.annee_scolaire || '—'} · {data?.periode}
        </p>
      </div>

      <PinnedAnnouncementBanner linkTo="/student/annonces" />

      {fin.annualAmount > 0 && !fin.paiementAJour && (
        <div className="student-alert student-alert--warn">
          <AlertCircle size={18} />
          <div>
            <strong>Paiement en attente</strong>
            <p>
              Votre situation financière n&apos;est pas à jour. Consultez{' '}
              <Link to="/student/paiements">Mes paiements</Link> ou contactez l&apos;administration.
            </p>
          </div>
        </div>
      )}

      <div className="student-stats">
        <div className="student-stat-card student-stat-card--blue">
          <div className="student-stat-card__top">
            <span className="student-stat-card__label">Moyenne générale</span>
            <div className="student-stat-card__icon-wrap">
              <TrendingUp size={18} color="#0A2F6B" />
            </div>
          </div>
          <div
            className="student-stat-card__value"
            style={{ color: moy != null ? getMentionColor(moy) : undefined }}
          >
            {moy != null ? `${formatAverage(moy)} / 20` : '—'}
          </div>
          <div className="student-stat-card__sub">
            {moy != null ? getMention(moy) : 'Notes en cours de saisie'}
          </div>
        </div>

        <div className="student-stat-card student-stat-card--green">
          <div className="student-stat-card__top">
            <span className="student-stat-card__label">Classement</span>
            <div className="student-stat-card__icon-wrap">
              <Users size={18} color="#16a34a" />
            </div>
          </div>
          <div className="student-stat-card__value">
            {data?.rang ? `${data.rang}${data.rang === 1 ? 'er' : 'e'}` : '—'}
          </div>
          <div className="student-stat-card__sub">
            sur {data?.effectifClasse ?? '—'} élèves
          </div>
        </div>

        <div className="student-stat-card student-stat-card--purple">
          <div className="student-stat-card__top">
            <span className="student-stat-card__label">Matières notées</span>
            <div className="student-stat-card__icon-wrap">
              <BookOpen size={18} color="#6d28d9" />
            </div>
          </div>
          <div className="student-stat-card__value">
            {data?.matieresNotees ?? 0}/{data?.totalMatieres ?? 0}
          </div>
          <div className="student-stat-card__sub">
            <Link to="/student/notes">Voir le détail →</Link>
          </div>
        </div>

        <div className={`student-stat-card student-stat-card--orange`}>
          <div className="student-stat-card__top">
            <span className="student-stat-card__label">Situation financière</span>
            <div className="student-stat-card__icon-wrap">
              {fin.paiementAJour ? (
                <CheckCircle size={18} color="#16a34a" />
              ) : (
                <Wallet size={18} color="#ea580c" />
              )}
            </div>
          </div>
          <div className="student-stat-card__value student-stat-card__value--sm">
            {fin.statut_financier || '—'}
          </div>
          <div className="student-stat-card__sub">
            Reste : {formatGnf(fin.remainingYear)}
          </div>
        </div>
      </div>

      <div className="student-dash-grid">
        <div className="student-dash-col">
          <div className="student-panel">
            <div className="student-panel__header">
              <h2 className="student-panel__title">Mes notes récentes</h2>
              <Link to="/student/notes" className="student-panel__link">Tout voir</Link>
            </div>
            <div className="student-panel__body">
              {recentGrades.length === 0 ? (
                <div className="student-empty">Aucune note publiée pour le moment.</div>
              ) : (
                recentGrades.map((m) => (
                  <div key={m.id} className="student-grade-row">
                    <div className="student-grade-row__icon">{matiereInitial(m.nom)}</div>
                    <div className="student-grade-row__info">
                      <div className="student-grade-row__name">{m.nom}</div>
                      <div className="student-grade-row__meta">
                        {m.professeur || '—'} · {data?.periode}
                      </div>
                    </div>
                    <div
                      className="student-grade-row__score"
                      style={{ color: getMentionColor(m.moyenne) }}
                    >
                      {formatAverage(m.moyenne)} / 20
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="student-panel__footer">
              <Link to="/student/notes" className="student-panel__footer-btn">
                <BookOpen size={16} />
                Voir toutes mes notes
              </Link>
            </div>
          </div>

          <div className="student-panel">
            <div className="student-panel__header">
              <h2 className="student-panel__title">Mes matières — {data?.classe?.nom}</h2>
            </div>
            <div className="student-panel__body">
              {allMatieres.length === 0 ? (
                <div className="student-empty">Aucune matière configurée pour votre classe.</div>
              ) : (
                allMatieres.map((m) => (
                  <div key={m.id} className="student-matiere-row">
                    <div>
                      <div className="student-matiere-row__name">{m.nom}</div>
                      <div className="student-matiere-row__prof">{m.professeur || '—'}</div>
                    </div>
                    <span className="student-matiere-row__badge">
                      {m.moyenne != null ? `${formatAverage(m.moyenne)}/20` : 'En attente'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {data?.eleve?.infos_importantes && (
            <div className="student-panel">
              <div className="student-panel__header">
                <h2 className="student-panel__title">Informations importantes</h2>
              </div>
              <div className="student-panel__body student-panel__body--padded">
                <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--st-text-muted)' }}>
                  {data.eleve.infos_importantes}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="student-dash-col">
          <div className="student-panel">
            <div className="student-panel__header">
              <h2 className="student-panel__title">
                Notifications
                {(data?.notificationsNonLues ?? 0) > 0 && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--st-danger)' }}>
                    ({data.notificationsNonLues} non lue{data.notificationsNonLues > 1 ? 's' : ''})
                  </span>
                )}
              </h2>
            </div>
            <div className="student-panel__body">
              {notifications.length === 0 ? (
                <div className="student-empty">Aucune notification pour le moment.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`student-notif-row${n.lu ? ' student-notif-row--read' : ''}`}
                  >
                    <div className="student-notif-row__dot" />
                    <div>
                      <p className="student-notif-row__title">{n.titre || n.type || 'Notification'}</p>
                      {n.message && (
                        <p className="student-notif-row__text">{n.message}</p>
                      )}
                      <div className="student-notif-row__date">{relativeTime(n.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="student-panel">
            <div className="student-panel__header">
              <h2 className="student-panel__title">Situation financière</h2>
            </div>
            <div className="student-finance-grid">
              <div className="student-finance-item">
                <div className="student-finance-item__label">Frais annuels</div>
                <div className="student-finance-item__value">{formatGnf(fin.annualAmount)}</div>
              </div>
              <div className="student-finance-item">
                <div className="student-finance-item__label">Payé</div>
                <div className="student-finance-item__value" style={{ color: 'var(--st-success)' }}>
                  {formatGnf(fin.totalPaid)}
                </div>
              </div>
              <div className="student-finance-item">
                <div className="student-finance-item__label">Reste à payer</div>
                <div className="student-finance-item__value" style={{ color: fin.remainingYear > 0 ? 'var(--st-danger)' : 'var(--st-success)' }}>
                  {formatGnf(fin.remainingYear)}
                </div>
              </div>
              <div className="student-finance-item">
                <div className="student-finance-item__label">Statut</div>
                <div className="student-finance-item__value">{fin.statut_financier || '—'}</div>
              </div>
            </div>
            <div className="student-panel__footer">
              <Link to="/student/paiements" className="student-panel__footer-btn">
                <Wallet size={16} />
                Voir mes paiements
              </Link>
            </div>
          </div>

          <div className="student-panel">
            <div className="student-panel__header">
              <h2 className="student-panel__title">Accès rapides</h2>
            </div>
            <div className="student-quick-grid">
              <Link to="/student/notes" className="student-quick-item">
                <div className="student-quick-item__icon student-quick-item__icon--blue">
                  <BookOpen size={20} />
                </div>
                Notes
              </Link>
              <Link to="/student/bulletin" className="student-quick-item">
                <div className="student-quick-item__icon student-quick-item__icon--green">
                  <Award size={20} />
                </div>
                Bulletin
              </Link>
              <Link to="/student/paiements" className="student-quick-item">
                <div className="student-quick-item__icon student-quick-item__icon--orange">
                  <Wallet size={20} />
                </div>
                Paiements
              </Link>
              <Link to="/student/profile" className="student-quick-item">
                <div className="student-quick-item__icon student-quick-item__icon--purple">
                  <GraduationCap size={20} />
                </div>
                Mon profil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
