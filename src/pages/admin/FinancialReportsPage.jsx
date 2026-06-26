import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Download, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import './AdminDashboard.css';

function formatGnf(v) {
  if (v == null) return '—';
  return `${Number(v).toLocaleString('fr-FR')} GNF`;
}

function currentMonthInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function exportCsv(report) {
  const lines = [
    'Date;Élève;Matricule;Montant;Mode;Période;Référence',
    ...(report.paiements || []).map((p) => [
      new Date(p.date).toLocaleDateString('fr-FR'),
      `${p.eleve?.prenom || ''} ${p.eleve?.nom || ''}`.trim(),
      p.eleve?.matricule || '',
      p.montant,
      p.mode_paiement,
      p.periode,
      p.reference || '',
    ].join(';')),
  ];
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rapport-paiements-${report.periode?.mois || 'periode'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportRetardsCsv(retards) {
  const lines = [
    'Matricule;Nom;Prénom;Classe;Statut;Solde;Payé;Reste;Parent;Téléphone',
    ...(retards || []).map((e) => [
      e.matricule,
      e.nom,
      e.prenom,
      e.classe,
      e.statut_financier,
      e.solde,
      e.totalPaid,
      e.remaining,
      e.parent_nom || '',
      e.parent_telephone || '',
    ].join(';')),
  ];
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'eleves-en-retard.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function FinancialReportsPage() {
  const [annees, setAnnees] = useState([]);
  const [mois, setMois] = useState(currentMonthInput());
  const [anneeScolaire, setAnneeScolaire] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/annees')
      .then((list) => {
        setAnnees(list || []);
        const active = list?.find((a) => a.active);
        setAnneeScolaire(active?.nom || list?.[0]?.nom || '');
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (mois) params.set('mois', mois);
      if (anneeScolaire) params.set('annee_scolaire', anneeScolaire);
      const data = await api.get(`/admin/rapports/financiers?${params}`);
      setReport(data);
    } catch (err) {
      setError(err.data?.error || 'Impossible de charger le rapport.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [mois, anneeScolaire]);

  useEffect(() => {
    if (anneeScolaire) load();
  }, [load, anneeScolaire]);

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="admin-title">Rapports financiers</h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Calendar size={18} color="#64748b" />
          <input type="month" value={mois} onChange={(e) => setMois(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <select value={anneeScolaire} onChange={(e) => setAnneeScolaire(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            {annees.map((a) => <option key={a.id} value={a.nom}>{a.nom}</option>)}
          </select>
          {report && (
            <button type="button" className="btn-submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => exportCsv(report)}>
              <Download size={16} /> Export CSV paiements
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: '#fee2e2', color: '#991b1b' }}>{error}</div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chargement…</div>
      ) : report ? (
        <>
          <div className="dashboard-stats-grid">
            <div className="admin-stat-card admin-stat-card--stacked">
              <div className="admin-stat-card__top">
                <DollarSign size={24} color="#0A2F6B" />
                <span className="admin-stat-card__label">Total encaissé</span>
              </div>
              <div className="admin-stat-card__value">{formatGnf(report.totalEncaisse)}</div>
              <div className="admin-stat-card__sub">{report.nombrePaiements} paiement(s) sur la période</div>
            </div>
            <div className="admin-stat-card admin-stat-card--stacked">
              <div className="admin-stat-card__top">
                <BarChart3 size={24} color="#16a34a" />
                <span className="admin-stat-card__label">Modes de paiement</span>
              </div>
              <div className="admin-stat-card__sub" style={{ marginTop: '0.5rem' }}>
                {(report.parMode || []).map((m) => (
                  <div key={m.mode} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>{m.mode}</span>
                    <strong>{formatGnf(m.montant)}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-stat-card admin-stat-card--stacked">
              <div className="admin-stat-card__top">
                <AlertTriangle size={24} color="#dc2626" />
                <span className="admin-stat-card__label">Élèves en retard</span>
              </div>
              <div className="admin-stat-card__value">{report.elevesEnRetard?.length || 0}</div>
              <div className="admin-stat-card__sub">
                <button type="button" className="btn-cancel" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }} onClick={() => exportRetardsCsv(report.elevesEnRetard)}>
                  <Download size={14} /> Exporter la liste
                </button>
              </div>
            </div>
          </div>

          <div className="admin-panel" style={{ marginTop: '1.5rem' }}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Élèves en situation de retard ou partielle</h2>
            </div>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Élève</th>
                    <th>Classe</th>
                    <th>Statut</th>
                    <th>Payé</th>
                    <th>Reste</th>
                    <th>Parent / Tél.</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.elevesEnRetard || []).length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Aucun élève en retard</td></tr>
                  ) : (
                    report.elevesEnRetard.map((e) => (
                      <tr key={e.id}>
                        <td><strong>{e.prenom} {e.nom}</strong><br /><small>{e.matricule}</small></td>
                        <td>{e.classe}</td>
                        <td>{e.statut_financier}</td>
                        <td>{formatGnf(e.totalPaid)}</td>
                        <td style={{ color: e.remaining > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{formatGnf(e.remaining)}</td>
                        <td>{e.parent_nom || '—'}<br /><small>{e.parent_telephone || ''}</small></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
