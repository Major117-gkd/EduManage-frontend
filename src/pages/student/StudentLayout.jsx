import React, { useState, useEffect, useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Wallet,
  LogOut,
  Menu,
  Sun,
  Moon,
  UserCircle,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { api } from '../../services/api';
import LogoutConfirmModal from '../../components/LogoutConfirmModal';
import NotificationBell from '../../components/NotificationBell';
import { isNavItemActive } from '../../utils/navActive';
import './StudentSpace.css';

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [profil, setProfil] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    api.get('/student/me')
      .then((data) => setProfil(data))
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

  const eleve = profil?.eleve;
  const classe = profil?.inscription?.classe;
  const avatarUrl = eleve?.photoUrl || user?.photoUrl;
  const displayName = eleve
    ? `${eleve.prenom} ${eleve.nom}`
    : user?.nom || 'Élève';

  const profilePath = '/student/profile';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/student', icon: <LayoutDashboard size={20} />, label: 'Accueil', exact: true },
    { path: profilePath, icon: <UserCircle size={20} />, label: 'Mon profil', exact: true },
    { path: '/student/notes', icon: <BookOpen size={20} />, label: 'Mes notes', exact: true },
    { path: '/student/bulletin', icon: <Award size={20} />, label: 'Mon bulletin', exact: true },
    { path: '/student/paiements', icon: <Wallet size={20} />, label: 'Mes paiements', exact: true },
    { path: '/student/annonces', icon: <Megaphone size={20} />, label: 'Annonces', exact: true },
  ];

  return (
    <div className="student-layout">
      <div
        className={`student-sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`student-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="student-sidebar__brand">
          <img src="/images/logo_boubacar.png" alt="Logo GSP" className="student-sidebar__logo" />
          <div className="student-sidebar__brand-text">
            <span className="student-sidebar__brand-name">EduManage</span>
            <span className="student-sidebar__brand-sub">GSP Saïdou Diallo</span>
          </div>
        </div>

        <nav className="student-nav">
          {navItems.map((item) => {
            const active = isNavItemActive(location.pathname, item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`student-nav__link${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="student-nav__icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="student-sidebar__footer">
          <button type="button" className="student-logout-btn" onClick={() => setLogoutConfirmOpen(true)}>
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="student-main">
        <header className="student-header">
          <button
            type="button"
            className="student-header__burger"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
          <div className="student-header__spacer" />
          <div className="student-header__actions">
            <button
              type="button"
              className="student-header__theme-btn"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Mode clair' : 'Mode sombre'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <NotificationBell />
            <Link to={profilePath} className="student-header__profile">
              <div className="student-header__avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="student-header__profile-info">
                <span className="student-header__profile-name">{displayName}</span>
                <span className="student-header__profile-class">
                  {classe?.nom || eleve?.matricule || 'Élève'}
                </span>
              </div>
            </Link>
          </div>
        </header>

        <main className="student-content">
          <Outlet />
        </main>
      </div>

      <LogoutConfirmModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
