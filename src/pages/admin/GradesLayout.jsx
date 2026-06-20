import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { PenLine, Eye } from 'lucide-react';
import './GradesLayout.css';

export default function GradesLayout() {
  return (
    <div className="grades-section">
      <div className="grades-section__header">
        <h1 className="admin-title">Notes</h1>
        <nav className="grades-tabs" aria-label="Sections notes">
          <NavLink
            to="/admin/grades"
            end
            className={({ isActive }) => `grades-tabs__link ${isActive ? 'active' : ''}`}
          >
            <PenLine size={16} />
            Saisie
          </NavLink>
          <NavLink
            to="/admin/grades/consultation"
            className={({ isActive }) => `grades-tabs__link ${isActive ? 'active' : ''}`}
          >
            <Eye size={16} />
            Consultation
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
