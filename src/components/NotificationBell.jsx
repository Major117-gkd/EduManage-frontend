import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  formatRelativeTime,
  getNotificationIcon,
} from '../utils/notificationUtils';
import './NotificationBell.css';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const loadNotifications = useCallback(() => {
    setLoading(true);
    api.get('/notifications?limit=8')
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 45000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const onRefresh = () => loadNotifications();
    window.addEventListener('edumanage:notifications-refresh', onRefresh);
    return () => window.removeEventListener('edumanage:notifications-refresh', onRefresh);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  const handleItemClick = (notif) => {
    if (!notif.lu) markRead(notif.id);
    if (notif.lien) {
      navigate(notif.lien);
      setOpen(false);
    }
  };

  return (
    <div className="notification-bell" ref={panelRef}>
      <button
        type="button"
        className="admin-header__btn notification-bell__trigger"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) loadNotifications();
        }}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={20} color="#64748b" />
        {unreadCount > 0 && (
          <span className="admin-header__badge notification-bell__badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-bell__panel" role="dialog" aria-label="Notifications">
          <div className="notification-bell__head">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button type="button" className="notification-bell__mark-all" onClick={markAllRead}>
                <CheckCheck size={14} />
                Tout lire
              </button>
            )}
          </div>

          <div className="notification-bell__list">
            {loading && notifications.length === 0 ? (
              <p className="notification-bell__empty">Chargement…</p>
            ) : notifications.length === 0 ? (
              <p className="notification-bell__empty">Aucune notification</p>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  className={`notification-bell__item${notif.lu ? '' : ' is-unread'}`}
                  onClick={() => handleItemClick(notif)}
                >
                  <span className="notification-bell__item-icon" aria-hidden>
                    {getNotificationIcon(notif.type, 16)}
                  </span>
                  <span className="notification-bell__item-body">
                    <strong>{notif.titre}</strong>
                    <span>{notif.message}</span>
                    <time>{formatRelativeTime(notif.createdAt)}</time>
                  </span>
                </button>
              ))
            )}
          </div>

          {isAdmin && (
            <div className="notification-bell__footer">
              <Link
                to="/admin/notifications"
                className="notification-bell__view-all"
                onClick={() => setOpen(false)}
              >
                Voir toutes les notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function refreshNotifications() {
  window.dispatchEvent(new Event('edumanage:notifications-refresh'));
}
