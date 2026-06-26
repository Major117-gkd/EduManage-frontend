import React from 'react';
import { Shield } from 'lucide-react';
import './DirecteurPerimetreBanner.css';

export default function DirecteurPerimetreBanner({ perimetre, compact = false }) {
  if (!perimetre) return null;

  if (compact) {
    return (
      <span className="directeur-perimetre-badge" title={`Données limitées au cycle ${perimetre}`}>
        <Shield size={14} aria-hidden />
        Cycle {perimetre}
      </span>
    );
  }

  return (
    <div className="directeur-perimetre-banner" role="status" aria-live="polite">
      <div className="directeur-perimetre-banner__icon" aria-hidden>
        <Shield size={28} />
      </div>
      <div className="directeur-perimetre-banner__body">
        <p className="directeur-perimetre-banner__label">Périmètre de direction</p>
        <p className="directeur-perimetre-banner__cycle">{perimetre}</p>
        <p className="directeur-perimetre-banner__hint">
          Vous consultez uniquement les élèves, classes, professeurs, notes et bulletins de ce cycle.
        </p>
      </div>
    </div>
  );
}
