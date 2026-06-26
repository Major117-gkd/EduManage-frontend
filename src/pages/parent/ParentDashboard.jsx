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
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import PinnedAnnouncementBanner from '../../components/announcements/PinnedAnnouncementBanner';
import { getMention, getMentionColor, formatAverage } from '../../utils/gradeEntry';
import { useParentContext } from './ParentContext';
import './ParentSpace.css';

function formatGnf(v) {
  if (v == null) return '—';
  return `${Number(v).toLocaleString('fr-FR')} GNF`;
}

export default function ParentDashboard() {
  const { eleveId, childSearch } = useParentContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!eleveId) return;
    setLoading(true);
    setError('');
    try {
      const dash = await api.get(`/parent/dashboard?eleve_id=${eleveId}`);
      setData(dash);
    } catch (err) {
      setError(err.data?.error || 'Impossible de charger le tableau de bord.');
    } finally {
      setLoading(false);
    }
  }, [eleveId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="parent-loading">Chargement du suivi scolaire</div>;
  if (error) {
    return (
      <div className="parent-alert parent-alert--error">
        <AlertCircle size={20} />
        <div>{error}</div>
      </div>
    );
  }

  const fin = data?.finances || {};
  const moy = data?.moyenneGenerale;
  const qs = childSearch;

  return (
    <div className="parent-dashboard">
      <section className="parent-hero">
        <div>
          <span className="parent-hero__badge">
            <Sparkles size={14} />
            Espace parent
          </span>
          <h1 className="parent-hero__title">
            {data?.eleve?.prenom} {data?.eleve?.nom}
          </h1>
          <p className="parent-hero__sub">Suivi scolaire en temps réel · consultation uniquement</p>
          <div className="parent-hero__meta">
            <span className="parent-hero__pill">
              <GraduationCap size={14} />
              {data?.classe?.nom || '—'}
            </span>
            <span className="parent-hero__pill">{data?.annee_scolaire || '—'}</span>
            <span className="parent-hero__pill">{data?.periode}</span>
          </div>
        </div>
        <div className="parent-hero__score">
          <span className="parent-hero__score-label">Moyenne</span>
          <span className="parent-hero__score-value" style={{ color: moy != null ? getMentionColor(moy) : '#fff' }}>
            {moy != null ? formatAverage(moy) : '—'}
          </span>
          <span className="parent-hero__score-mention">
            {moy != null ? getMention(moy) : 'En cours'}
          </span>
        </div>
      </section>

      <PinnedAnnouncementBanner linkTo="/parent/annonces" />

      {fin.annualAmount > 0 && !fin.paiementAJour && (
        <div className="parent-alert parent-alert--warn">
          <AlertCircle size={20} />
          <div>
            <strong>Paiement en attente</strong>
            <p style={{ margin: '0.35rem 0 0' }}>
              La situation financière n&apos;est pas à jour. Consultez{' '}
              <Link to={`/parent/paiements${qs}`}>Paiements</Link> ou contactez l&apos;administration.
            </p>
          </div>
        </div>
      )}

      <div className="parent-stats">
        <div className="parent-stat">
          <div className="parent-stat__top">
            <span className="parent-stat__label">Moyenne générale</span>
            <div className="parent-stat__icon parent-stat__icon--blue">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="parent-stat__value" style={{ color: moy != null ? getMentionColor(moy) : undefined }}>
            {moy != null ? `${formatAverage(moy)} / 20` : '—'}
          </div>
          <div className="parent-stat__sub">{moy != null ? getMention(moy) : 'Notes en cours'}</div>
        </div>

        <div className="parent-stat">
          <div className="parent-stat__top">
            <span className="parent-stat__label">Classement</span>
            <div className="parent-stat__icon parent-stat__icon--green">
              <Users size={20} />
            </div>
          </div>
          <div className="parent-stat__value">
            {data?.rang ? `${data.rang}${data.rang === 1 ? 'er' : 'e'}` : '—'}
          </div>
          <div className="parent-stat__sub">sur {data?.effectifClasse ?? '—'} élèves</div>
        </div>

        <div className="parent-stat">
          <div className="parent-stat__top">
            <span className="parent-stat__label">Matières notées</span>
            <div className="parent-stat__icon parent-stat__icon--purple">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="parent-stat__value">
            {data?.matieresNotees ?? 0}/{data?.totalMatieres ?? 0}
          </div>
          <div className="parent-stat__sub">
            <Link to={`/parent/notes${qs}`}>Voir le détail →</Link>
          </div>
        </div>

        <div className="parent-stat">
          <div className="parent-stat__top">
            <span className="parent-stat__label">Finances</span>
            <div className="parent-stat__icon parent-stat__icon--gold">
              {fin.paiementAJour ? <CheckCircle size={20} /> : <Wallet size={20} />}
            </div>
          </div>
          <div className="parent-stat__value" style={{ fontSize: '1.1rem' }}>
            {fin.statut_financier || '—'}
          </div>
          <div className="parent-stat__sub">Reste : {formatGnf(fin.remainingYear)}</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--pa-muted)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Accès rapide
      </h2>
      <div className="parent-actions">
        <Link to={`/parent/notes${qs}`} className="parent-action">
          <div className="parent-action__icon parent-action__icon--notes">
            <BookOpen size={22} />
          </div>
          <div className="parent-action__body">
            <strong>Notes</strong>
            <span>Résultats par matière et appréciations des professeurs</span>
          </div>
          <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--pa-muted)', flexShrink: 0 }} />
        </Link>
        <Link to={`/parent/bulletin${qs}`} className="parent-action">
          <div className="parent-action__icon parent-action__icon--bulletin">
            <Award size={22} />
          </div>
          <div className="parent-action__body">
            <strong>Bulletin</strong>
            <span>Bulletin officiel avec moyennes et classement</span>
          </div>
          <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--pa-muted)', flexShrink: 0 }} />
        </Link>
        <Link to={`/parent/paiements${qs}`} className="parent-action">
          <div className="parent-action__icon parent-action__icon--payments">
            <Wallet size={22} />
          </div>
          <div className="parent-action__body">
            <strong>Paiements</strong>
            <span>Historique des versements et reçus</span>
          </div>
          <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--pa-muted)', flexShrink: 0 }} />
        </Link>
      </div>
    </div>
  );
}
