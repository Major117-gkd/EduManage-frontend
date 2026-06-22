import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, CalendarDays, Info } from 'lucide-react';
import { api } from '../../services/api';
import '../admin/AdminDashboard.css';

function formatGnf(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Number(value).toLocaleString('fr-FR')} GNF`;
}

function formatMois(key) {
  if (!key) return '—';
  const [y, m] = key.split('-');
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function TeacherRemunerationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/teacher/remuneration')
      .then(setData)
      .catch((err) => setError(err.data?.error || 'Impossible de charger votre rémunération.'))
      .finally(() => setLoading(false));
  }, []);

  const moisCourant = data?.mois_courant;

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h1 className="admin-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={28} color="#0A2F6B" />
            Ma rémunération
          </h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
            {data?.formule || 'Montant mensuel = heures du mois × tarif horaire défini'}
            {data?.annee_scolaire ? ` — ${data.annee_scolaire}` : ''}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chargement...</div>
      ) : (
        <>
          <div style={{ padding: '0.75rem 1rem', background: '#eff6ff', color: '#1e40af', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.9rem' }}>
            <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Chaque présence enregistrée par l&apos;administration ajoute des heures.
              En fin de mois, le montant est calculé : <strong>heures du mois × tarif horaire</strong> (par classe).
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="admin-stat-card">
              <div className="admin-stat-card__icon" style={{ background: '#dbeafe' }}>
                <DollarSign size={22} color="#0A2F6B" />
              </div>
              <div className="admin-stat-card__info">
                <span className="admin-stat-card__label">Total année (calculé)</span>
                <span className="admin-stat-card__value">{formatGnf(data?.total)}</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__icon" style={{ background: '#ede9fe' }}>
                <Clock size={22} color="#7c3aed" />
              </div>
              <div className="admin-stat-card__info">
                <span className="admin-stat-card__label">Heures enregistrées</span>
                <span className="admin-stat-card__value">{data?.total_heures ?? 0}h</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__icon" style={{ background: '#dcfce7' }}>
                <CalendarDays size={22} color="#16a34a" />
              </div>
              <div className="admin-stat-card__info">
                <span className="admin-stat-card__label">Séances</span>
                <span className="admin-stat-card__value">{data?.seances ?? 0}</span>
              </div>
            </div>
          </div>

          {moisCourant && (
            <div className="admin-panel" style={{ marginBottom: '1.5rem', border: '2px solid #bfdbfe' }}>
              <div className="admin-panel__header">
                <h2 className="admin-panel__title">
                  Mois en cours — {formatMois(moisCourant.mois)}
                </h2>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0A2F6B' }}>
                  {moisCourant.heures}h × tarif = {formatGnf(moisCourant.montant)}
                </span>
              </div>
              {moisCourant.par_classe?.length > 0 && (
                <div style={{ overflowX: 'auto', padding: '0 1rem 1rem' }}>
                  <table className="admin-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Classe</th>
                        <th>Heures</th>
                        <th>Tarif / h</th>
                        <th>Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moisCourant.par_classe.map((c) => (
                        <tr key={c.classeId}>
                          <td>{c.classe_nom}</td>
                          <td>{c.heures}h</td>
                          <td>{formatGnf(c.tarif_horaire)}</td>
                          <td style={{ fontWeight: 600 }}>{formatGnf(c.montant)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {data?.par_mois?.length > 0 && (
            <div className="admin-panel" style={{ marginBottom: '1.5rem' }}>
              <div className="admin-panel__header">
                <h2 className="admin-panel__title">Récapitulatif mensuel</h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Mois</th>
                      <th>Séances</th>
                      <th>Heures</th>
                      <th>Montant (H × tarif)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.par_mois.map((row) => (
                      <tr key={row.mois}>
                        <td style={{ textTransform: 'capitalize' }}>
                          {formatMois(row.mois)}
                          {row.est_mois_courant && (
                            <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#2563eb' }}>(en cours)</span>
                          )}
                        </td>
                        <td>{row.seances}</td>
                        <td>{row.heures}h</td>
                        <td style={{ fontWeight: 600, color: '#0A2F6B' }}>{formatGnf(row.montant)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="admin-panel">
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Historique des présences (heures)</h2>
            </div>
            {data?.historique?.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                Aucune présence enregistrée pour le moment.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Classe</th>
                      <th>Matière</th>
                      <th>Heures</th>
                      <th>Mois</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.historique.map((row) => (
                      <tr key={row.id}>
                        <td>{new Date(`${row.date}T12:00:00`).toLocaleDateString('fr-FR')}</td>
                        <td style={{ fontWeight: 600 }}>{row.classe || row.classe_nom || '—'}</td>
                        <td>{row.matiere}</td>
                        <td>{row.nombre_heures}h</td>
                        <td style={{ textTransform: 'capitalize' }}>{formatMois(row.mois)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
