import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, BookOpen, FileText, Settings, LogOut, Calendar, Menu, ClipboardList, DollarSign, Sun, Moon, UserCircle, Layers, Bell, Wallet, UserCog, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { useContext } from 'react';
import LogoutConfirmModal from '../../components/LogoutConfirmModal';
import NotificationBell from '../../components/NotificationBell';
import AdminGlobalSearch from '../../components/AdminGlobalSearch';
import DirecteurPerimetreBanner from '../../components/DirecteurPerimetreBanner';
import { getStaffNavItems, getStaffRoleLabel, canAccessStaffRoute } from '../../utils/rbac';
import { getHomePathForRole, isNavItemActive } from '../../utils/rolePaths';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [animating, setAnimating] = useState(false);
  const [ripples, setRipples] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
    setAnimating(true);
    const t = setTimeout(() => setAnimating(false), 400);
    return () => clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const handleNavClick = (path, e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => ({ ...prev, [path]: { x, y, id } }));
    setTimeout(() => setRipples(prev => { const n = { ...prev }; delete n[path]; return n; }), 600);
  };

  const navItems = getStaffNavItems(user?.role || 'ADMIN').map((item) => {
    const icons = {
      dashboard: <LayoutDashboard size={20} />,
      students: <Users size={20} />,
      teachers: <GraduationCap size={20} />,
      classes: <BookOpen size={20} />,
      niveaux: <Layers size={20} />,
      subjects: <BookOpen size={20} />,
      years: <Calendar size={20} />,
      payments: <DollarSign size={20} />,
      finance: <ClipboardList size={20} />,
      teacherPay: <Wallet size={20} />,
      notifications: <Bell size={20} />,
      annonces: <Megaphone size={20} />,
      grades: <FileText size={20} />,
      results: <ClipboardList size={20} />,
      users: <UserCog size={20} />,
      settings: <Settings size={20} />,
    };
    return { ...item, icon: icons[item.iconKey] || <LayoutDashboard size={20} /> };
  });

  const profilePath = '/admin/profile';
  const isProfileActive = location.pathname === profilePath;
  const displayName = user?.nom || 'Mon compte';
  const roleLabel = getStaffRoleLabel(user?.role, user?.perimetre);
  const staffRouteAllowed = canAccessStaffRoute(user?.role, location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo-wrap">
            <img src="/images/logo_boubacar.png" alt="Logo" className="admin-sidebar__logo-img" />
            <div className="admin-sidebar__logo-text">
              <span className="admin-sidebar__logo-main">GSP Elhadj Mamadou</span>
              <span className="admin-sidebar__logo-sub">Saïdou Diallo</span>
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
              onClick={(e) => handleNavClick(item.path, e)}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <span className="admin-nav__icon">{item.icon}</span>
              {item.label}
              {ripples[item.path] && (
                <span
                  className="nav-ripple"
                  style={{ left: ripples[item.path].x, top: ripples[item.path].y }}
                />
              )}
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
              className="sidebar-user-card__avatar"
              style={user?.photoUrl ? { padding: 0, overflow: 'hidden' } : undefined}
            >
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="" className="sidebar-user-card__avatar-img" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="sidebar-user-card__info">
              <span className="sidebar-user-card__name">{displayName}</span>
              <span className="sidebar-user-card__role">{roleLabel}</span>
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

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Navbar */}
        <header className="admin-header">
          {/* Hamburger button - mobile only */}
          <button
            type="button"
            className="admin-header__burger"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={sidebarOpen}
          >
            <Menu size={24} />
          </button>
          {user?.role === 'ADMIN' && <AdminGlobalSearch />}
          {user?.role === 'DIRECTEUR' && user?.perimetre && (
            <DirecteurPerimetreBanner perimetre={user.perimetre} compact />
          )}
          <div className="admin-header__actions">
            <button className="admin-header__btn theme-toggle-btn" onClick={toggleTheme} title="Basculer le thème" aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <NotificationBell />
            <div
              className="admin-header__profile"
              role="button"
              tabIndex={0}
              onClick={() => navigate(profilePath)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(profilePath)}
              title={user?.nom ? `${user.nom} — Mon profil` : 'Mon profil'}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="admin-profile__avatar"
                style={user?.photoUrl ? { padding: 0, overflow: 'hidden' } : undefined}
              >
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="admin-profile__avatar-img" />
                ) : (
                  user?.nom?.charAt(0) || 'A'
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          {user?.role === 'DIRECTEUR' && user?.perimetre && (
            <DirecteurPerimetreBanner perimetre={user.perimetre} />
          )}
          <div className={`page-transition ${animating ? 'page-enter' : 'page-visible'}`}>
            {!staffRouteAllowed ? (
              <Navigate to={getHomePathForRole(user?.role)} replace />
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
