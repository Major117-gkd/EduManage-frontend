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
import LogoutConfirmModal from '../../components/LogoutConfirmModal';
import NotificationBell from '../../components/NotificationBell';
import { isNavItemActive } from '../../utils/navActive';
import { ParentProvider, useParentContext } from './ParentContext';
import ParentChildSelector from './ParentChildSelector';
import '../student/StudentSpace.css';
import './ParentSpace.css';

function ParentLayoutInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { profil, eleveActif, loading, childSearch, hasMultipleChildren, eleveId } = useParentContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const displayName = user?.nom || 'Parent';
  const childName = eleveActif
    ? `${eleveActif.prenom} ${eleveActif.nom}`
    : '—';
  const profilePath = `/parent/profile${childSearch}`;

  const navItems = [
    { path: '/parent', icon: <LayoutDashboard size={20} />, label: 'Accueil', exact: true },
    { path: '/parent/notes', icon: <BookOpen size={20} />, label: 'Notes', exact: true },
    { path: '/parent/bulletin', icon: <Award size={20} />, label: 'Bulletin', exact: true },
    { path: '/parent/paiements', icon: <Wallet size={20} />, label: 'Paiements', exact: true },
    { path: '/parent/annonces', icon: <Megaphone size={20} />, label: 'Annonces', exact: true },
    { path: '/parent/profile', icon: <UserCircle size={20} />, label: 'Mon profil', exact: true },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="student-layout parent-layout">
      <div
        className={`student-sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`student-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="student-sidebar__brand">
          <img src="/images/logo_boubacar.png" alt="Logo GSP" className="student-sidebar__logo" />
          <div className="student-sidebar__brand-text">
            <span className="student-sidebar__brand-name">GSP EduManage</span>
            <span className="student-sidebar__brand-sub">Espace parent</span>
          </div>
        </div>

        <p className="parent-sidebar-tag">
          {hasMultipleChildren
            ? 'Sélectionnez un enfant pour consulter ses notes, bulletins et paiements.'
            : 'Suivez la scolarité et les finances de votre enfant en toute simplicité.'}
        </p>

        <ParentChildSelector variant="sidebar" />

        <nav className="student-nav">
          {navItems.map((item) => {
            const active = isNavItemActive(location.pathname, item);
            return (
              <Link
                key={item.path}
                to={`${item.path}${location.search || childSearch}`}
                className={`student-nav__link${active ? ' active' : ''}`}
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
          <button type="button" className="student-header__burger" onClick={() => setSidebarOpen((o) => !o)}>
            <Menu size={22} />
          </button>
          <ParentChildSelector />
          <div className="student-header__spacer" />
          <div className="student-header__actions">
            <button type="button" className="student-header__theme-btn" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <NotificationBell />
            <Link to={profilePath} className="student-header__profile">
              <div className="student-header__avatar">{displayName.charAt(0).toUpperCase()}</div>
              <div className="student-header__profile-info">
                <span className="student-header__profile-name">{displayName}</span>
                <span className="student-header__profile-class">
                  {loading ? '…' : childName}
                </span>
              </div>
            </Link>
          </div>
        </header>

        <main className="student-content">
          <Outlet key={eleveId || 'none'} context={{ profil, eleveActif }} />
        </main>
      </div>

      <LogoutConfirmModal
        open={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}

export default function ParentLayout() {
  return (
    <ParentProvider>
      <ParentLayoutInner />
    </ParentProvider>
  );
}
