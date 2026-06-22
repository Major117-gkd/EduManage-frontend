import React, { useState, useEffect, useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Menu, UserCircle, DollarSign, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { api } from '../../services/api';
import LogoutConfirmModal from '../../components/LogoutConfirmModal';
import NotificationBell from '../../components/NotificationBell';
import { isNavItemActive } from '../../utils/navActive';
import '../admin/AdminLayout.css';

export default function TeacherLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [profil, setProfil] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    api.get('/teacher/me')
      .then((data) => setProfil(data.professeur))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const avatarUrl = profil?.photoUrl || user?.photoUrl;

  const displayName = profil
    ? `${profil.prenom} ${profil.nom}`
    : user?.nom || 'Professeur';

  const profilePath = '/teacher/profile';
  const isProfileActive = location.pathname === profilePath;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      path: '/teacher',
      icon: <BookOpen size={20} />,
      label: 'Mes Cours',
      exact: true,
      alsoMatch: ['/teacher/grades'],
    },
    {
      path: '/teacher/pay',
      icon: <DollarSign size={20} />,
      label: 'Ma rémunération',
      exact: true,
    },
  ];

  return (
    <div className="admin-layout">
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo-wrap">
            <img src="/images/logo_boubacar.png" alt="Logo" className="admin-sidebar__logo-img" />
            <div className="admin-sidebar__logo-text">
              <span className="admin-sidebar__logo-main">Espace Professeur</span>
              <span className="admin-sidebar__logo-sub">GSP Saïdou Diallo</span>
            </div>
          </div>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => {
            const active = isNavItemActive(location.pathname, item);
            return (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav__link${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="admin-nav__icon">{item.icon}</span>
              {item.label}
            </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar__footer">
          <Link
            to={profilePath}
            className={`sidebar-user-card${isProfileActive ? ' sidebar-user-card--active' : ''}`}
          >
            <div
              className="sidebar-user-card__avatar sidebar-user-card__avatar--teacher"
              style={avatarUrl ? { padding: 0, overflow: 'hidden', background: 'transparent' } : undefined}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="sidebar-user-card__avatar-img" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="sidebar-user-card__info">
              <span className="sidebar-user-card__name">{displayName}</span>
              <span className="sidebar-user-card__role">Professeur</span>
            </div>
            <UserCircle size={16} className="sidebar-user-card__chevron" aria-hidden />
          </Link>
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={() => setLogoutConfirmOpen(true)}
          >
            <LogOut size={16} />
            Se déconnecter
          </button>
        </div>
      </aside>

      <LogoutConfirmModal
        open={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
      />

      <div className="admin-main">
        <header className="admin-header">
          <button
            type="button"
            className="admin-header__burger"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={sidebarOpen}
          >
            <Menu size={24} />
          </button>
          <div className="admin-header__title-wrap">
            <span className="admin-header__title">Espace Professeur</span>
          </div>
          <div className="admin-header__actions">
            <button
              type="button"
              className="admin-header__btn theme-toggle-btn"
              onClick={toggleTheme}
              title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
              aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <NotificationBell />
            <div
              className="admin-header__profile"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/teacher/profile')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/teacher/profile')}
              title={displayName ? `${displayName} — Mon profil` : 'Mon profil'}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="admin-profile__avatar"
                style={{
                  backgroundColor: avatarUrl ? 'transparent' : '#7c3aed',
                  overflow: 'hidden',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="admin-profile__avatar-img"
                  />
                ) : (
                  displayName.charAt(0)
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
