import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, BookOpen, FileText, Settings, LogOut, Search, Bell, Calendar, Menu, X as XIcon, ClipboardList, DollarSign } from 'lucide-react';
import './AdminLayout.css';

export default function AdminLayout() {
  const location = useLocation();
  const [animating, setAnimating] = useState(false);
  const [ripples, setRipples] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
    setAnimating(true);
    const t = setTimeout(() => setAnimating(false), 400);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const handleNavClick = (path, e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => ({ ...prev, [path]: { x, y, id } }));
    setTimeout(() => setRipples(prev => { const n = { ...prev }; delete n[path]; return n; }), 600);
  };

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Vue d\'ensemble', exact: true },
    { path: '/admin/students', icon: <Users size={20} />, label: 'Élèves' },
    { path: '/admin/teachers', icon: <GraduationCap size={20} />, label: 'Professeurs' },
    { path: '/admin/classes', icon: <BookOpen size={20} />, label: 'Classes' },
    { path: '/admin/subjects', icon: <BookOpen size={20} />, label: 'Matières' },
    { path: '/admin/years', icon: <Calendar size={20} />, label: 'Années Scolaires' },
    { path: '/admin/payments', icon: <DollarSign size={20} />, label: 'Paiements' },
    { path: '/admin/grades', icon: <FileText size={20} />, label: 'Saisie des Notes' },
    { path: '/admin/grades/results', icon: <ClipboardList size={20} />, label: 'Bulletins & Résultats' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Paramètres' },
  ];

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
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`admin-nav__link ${
                item.exact
                  ? location.pathname === item.path
                  : location.pathname === item.path
                ? 'active' : ''
              }`}
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
          ))}
        </nav>
        <div className="admin-sidebar__bottom">
          <Link to="/" className="admin-nav__link admin-nav__link--logout">
            <span className="admin-nav__icon"><LogOut size={20} /></span>
            Quitter l'ERP
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Navbar */}
        <header className="admin-header">
          {/* Hamburger button - mobile only */}
          <button
            className="admin-header__burger"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Menu"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '6px' }}
          >
            <Menu size={24} color="#0A2F6B" />
          </button>
          <div className="admin-header__search">
            <Search size={20} color="#94a3b8" />
            <input type="text" placeholder="Rechercher un élève, une classe..." />
          </div>
          <div className="admin-header__actions">
            <button className="admin-header__btn">
              <Bell size={20} color="#64748b" />
              <span className="admin-header__badge">3</span>
            </button>
            <div className="admin-header__profile">
              <div className="admin-profile__avatar">A</div>
              <div className="admin-profile__info">
                <span className="admin-profile__name">Admin</span>
                <span className="admin-profile__role">Directeur</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          <div className={`page-transition ${animating ? 'page-enter' : 'page-visible'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
