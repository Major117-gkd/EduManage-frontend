import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { refreshNotifications } from '../../components/NotificationBell';
import {
  formatRelativeTime,
  formatFullDate,
  getNotificationTypeLabel,
  getNotificationIcon,
  isToday,
} from '../../utils/notificationUtils';
import './NotificationsPage.css';
import './AdminDashboard.css';

const PAGE_SIZE = 15;

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');

  const loadNotifications = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (statutFilter !== 'all') params.set('statut', statutFilter);
    if (typeFilter) params.set('type', typeFilter);

    api.get(`/notifications?${params}`)
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch((err) => {
        setError(err.data?.error || err.message || 'Impossible de charger les notifications.');
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, [page, statutFilter, typeFilter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    setPage(1);
  }, [statutFilter, typeFilter]);

  const todayCount = useMemo(
    () => notifications.filter((n) => isToday(n.createdAt)).length,
    [notifications],
  );

  const markRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      refreshNotifications();
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnreadCount(0);
      refreshNotifications();
    } catch {
      /* ignore */
    }
  };

  const handleItemClick = (notif) => {
    if (!notif.lu) markRead(notif.id);
    if (notif.lien) navigate(notif.lien);
  };

  return (
    <div className="admin-dashboard notifications-page">
      <div className="admin-dashboard__header">
        <div>
          <h1 className="admin-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={22} color="#0A2F6B" />
            Notifications
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Activité récente de l&apos;établissement — saisies de notes et alertes admin
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="btn btn--outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={markAllRead}
          >
            <CheckCheck size={16} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="notifications-page__stats">
        <div className="notifications-page__stat notifications-page__stat--unread">
          <strong>{unreadCount}</strong>
          <span>Non lues</span>
        </div>
        <div className="notifications-page__stat">
          <strong>{total}</strong>
          <span>Total (filtre actif)</span>
        </div>
        <div className="notifications-page__stat notifications-page__stat--today">
          <strong>{todayCount}</strong>
          <span>Sur cette page — aujourd&apos;hui</span>
        </div>
      </div>

      <div className="admin-panel">
        <div className="notifications-page__toolbar">
          <div className="notifications-page__filters">
            <label htmlFor="notif-statut">Statut</label>
            <select
              id="notif-statut"
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
            >
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </select>

            <label htmlFor="notif-type">Type</label>
            <select
              id="notif-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Tous les types</option>
              <option value="NOTE_SAISIE">Saisie de notes</option>
            </select>
          </div>
        </div>

        {error && (
          <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: '0 0 1rem' }}>{error}</p>
        )}

        {loading ? (
          <p className="notifications-page__empty">Chargement des notifications…</p>
        ) : notifications.length === 0 ? (
          <div className="notifications-page__empty">
            <Bell size={40} color="#94a3b8" />
            <p>Aucune notification pour ce filtre.</p>
          </div>
        ) : (
          <div className="notifications-page__list">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                role="button"
                tabIndex={0}
                className={`notifications-page__item${notif.lu ? '' : ' is-unread'}`}
                onClick={() => handleItemClick(notif)}
                onKeyDown={(e) => e.key === 'Enter' && handleItemClick(notif)}
              >
                <span className="notifications-page__item-icon" aria-hidden>
                  {getNotificationIcon(notif.type)}
                </span>
                <div className="notifications-page__item-body">
                  <div className="notifications-page__item-top">
                    <strong>{notif.titre}</strong>
                    <span className="notifications-page__type-badge">
                      {getNotificationTypeLabel(notif.type)}
                    </span>
                    <span className={`notifications-page__status-badge notifications-page__status-badge--${notif.lu ? 'read' : 'unread'}`}>
                      {notif.lu ? 'Lue' : 'Non lue'}
                    </span>
                  </div>
                  <p className="notifications-page__message">{notif.message}</p>
                  <div className="notifications-page__meta">
                    <time title={formatFullDate(notif.createdAt)}>
                      {formatRelativeTime(notif.createdAt)}
                    </time>
                    {notif.lien && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <ExternalLink size={12} />
                        Voir le détail
                      </span>
                    )}
                  </div>
                </div>
                <div className="notifications-page__actions-col">
                  {!notif.lu && (
                    <button
                      type="button"
                      className="notifications-page__mark-btn"
                      onClick={(e) => markRead(notif.id, e)}
                    >
                      Marquer lue
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="notifications-page__pagination">
            <button
              type="button"
              className="btn btn--outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
              Précédent
            </button>
            <span>Page {page} / {totalPages}</span>
            <button
              type="button"
              className="btn btn--outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
