import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, FileText, Calendar, MessageSquare, LogOut, Bell, Search } from 'lucide-react';
import '../admin/AdminLayout.css'; // Reusing admin CSS for similar sidebar style

export default function TeacherLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/teacher', icon: <BookOpen size={20} />, label: 'Mes Cours' },
    { path: '/teacher/grades', icon: <FileText size={20} />, label: 'Saisie des notes' },
    { path: '/teacher/schedule', icon: <Calendar size={20} />, label: 'Emploi du temps' },
    { path: '/teacher/messages', icon: <MessageSquare size={20} />, label: 'Messages' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
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
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`admin-nav__link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="admin-nav__icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar__bottom">
          <Link to="/" className="admin-nav__link admin-nav__link--logout">
            <span className="admin-nav__icon"><LogOut size={20} /></span>
            Se déconnecter
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Navbar */}
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '99px', flex: 1, maxWidth: '400px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input type="text" placeholder="Rechercher un élève..." style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.95rem', backgroundColor: 'transparent' }} />
          </div>
          <div className="admin-header__actions">
            <button className="admin-header__btn">
              <Bell size={20} color="#64748b" />
            </button>
            <div className="admin-header__profile">
              <div className="admin-profile__avatar" style={{backgroundColor: '#7c3aed'}}>P</div>
              <div className="admin-profile__info">
                <span className="admin-profile__name">Professeur</span>
                <span className="admin-profile__role">Enseignant</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
