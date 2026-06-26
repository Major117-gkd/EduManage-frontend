import React from 'react';

export default function StudentSchoolFilters({
  annees,
  periodes,
  annee,
  setAnnee,
  periode,
  setPeriode,
  loading,
  showPeriode = false,
}) {
  return (
    <div className="student-filters">
      <div className="modal-form-group">
        <label>Année scolaire</label>
        <select
          value={annee}
          onChange={(e) => setAnnee(e.target.value)}
          disabled={loading || !annees.length}
        >
          {!annee && <option value="">Chargement…</option>}
          {annees.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      {showPeriode && (
        <div className="modal-form-group">
          <label>Période</label>
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            disabled={loading || !periodes.length}
          >
            {periodes.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
