import { NavLink, Outlet } from 'react-router-dom';
import { Eye, FileText, ClipboardList } from 'lucide-react';
import './GradesLayout.css';

export default function GradesLayout() {
  return (
    <div className="grades-section">
      <div className="grades-section__header">
        <div className="grades-section__title-group">
          <h1 className="grades-section__title">
            <FileText size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem', color: '#0A2F6B' }} />
            Notes & Évaluations
          </h1>
          <span className="grades-section__subtitle">
            Consultation en lecture seule · Bulletins et résultats
          </span>
        </div>
        <nav className="grades-tabs" aria-label="Sections notes">
          <NavLink
            to="/admin/grades/consultation"
            className={({ isActive }) => `grades-tabs__link ${isActive ? 'active' : ''}`}
          >
            <Eye size={15} />
            Consultation
          </NavLink>
          <NavLink
            to="/admin/grades/results"
            className={({ isActive }) => `grades-tabs__link ${isActive ? 'active' : ''}`}
          >
            <ClipboardList size={15} />
            Bulletins
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
