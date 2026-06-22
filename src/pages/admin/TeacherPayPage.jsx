import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Calendar, Save, AlertCircle, Clock, Layers, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import './AdminDashboard.css';

function formatGnf(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Number(value).toLocaleString('fr-FR')} GNF`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthStr() {
  return todayStr().slice(0, 7);
}

function formatMois(key) {
  if (!key) return '—';
  const [y, m] = key.split('-');
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function classeLabel(aff) {
  const c = aff.classe;
  if (!c) return '—';
  const niveau = c.niveauEtude || c.niveau;
  return niveau ? `${c.nom} — ${niveau}` : c.nom;
}

export default function TeacherPayPage() {
  const [tab, setTab] = useState('presences');
  const [tarifs, setTarifs] = useState([]);
  const [tarifEdits, setTarifEdits] = useState({});
  const [savingTarifId, setSavingTarifId] = useState(null);
  const [date, setDate] = useState(todayStr());
  const [mois, setMois] = useState(currentMonthStr());
  const [feuille, setFeuille] = useState(null);
  const [synthese, setSynthese] = useState(null);
  const [loadingTarifs, setLoadingTarifs] = useState(true);
  const [loadingFeuille, setLoadingFeuille] = useState(true);
  const [loadingSynthese, setLoadingSynthese] = useState(true);
  const [busyKey, setBusyKey] = useState(null);
  const [hourInputs, setHourInputs] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadTarifs = useCallback(async () => {
    setLoadingTarifs(true);
    try {
      const data = await api.get('/admin/tarifs-horaires');
      setTarifs(data);
      const edits = {};
      data.forEach((c) => {
        edits[c.id] = {
          tarif_horaire: c.tarif_horaire ?? '',
          heures_seance: c.heures_seance ?? 1,
        };
      });
      setTarifEdits(edits);
    } catch (err) {
      setError(err.data?.error || 'Impossible de charger les tarifs.');
    } finally {
      setLoadingTarifs(false);
    }
  }, []);

  const loadFeuille = useCallback(async () => {
    setLoadingFeuille(true);
    setError('');
    try {
      const data = await api.get(`/admin/presences-professeurs?date=${date}`);
      setFeuille(data);
    } catch (err) {
      setError(err.data?.error || 'Impossible de charger la feuille de présence.');
      setFeuille(null);
    } finally {
      setLoadingFeuille(false);
    }
  }, [date]);

  const loadSynthese = useCallback(async () => {
    setLoadingSynthese(true);
    setError('');
    try {
      const data = await api.get(`/admin/remuneration-mensuelle?mois=${mois}`);
      setSynthese(data);
    } catch (err) {
      setError(err.data?.error || 'Impossible de charger la synthèse mensuelle.');
      setSynthese(null);
    } finally {
      setLoadingSynthese(false);
    }
  }, [mois]);

  useEffect(() => {
    loadTarifs();
  }, [loadTarifs]);

  useEffect(() => {
    if (tab === 'presences') loadFeuille();
    if (tab === 'mensuel') loadSynthese();
  }, [tab, loadFeuille, loadSynthese]);

  useEffect(() => {
    if (!feuille?.professeurs) return;
    setHourInputs((prev) => {
      const next = { ...prev };
      for (const prof of feuille.professeurs) {
        for (const aff of prof.affectations) {
          const k = `${prof.professeurId}-${aff.classeId}`;
          if (next[k] === undefined) {
            next[k] = String(aff.heures_defaut ?? 1);
          }
        }
      }
      return next;
    });
  }, [feuille]);

  const handleSaveTarif = async (classeId) => {
    const edit = tarifEdits[classeId];
    setSavingTarifId(classeId);
    setMessage('');
    setError('');
    try {
      await api.put(`/admin/tarifs-horaires/${classeId}`, {
        tarif_horaire: parseFloat(edit.tarif_horaire),
        heures_seance: parseFloat(edit.heures_seance),
      });
      setMessage('Tarif enregistré.');
      await loadTarifs();
      if (tab === 'presences') await loadFeuille();
      if (tab === 'mensuel') await loadSynthese();
    } catch (err) {
      setError(err.data?.error || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSavingTarifId(null);
    }
  };

  const affectationKey = (profId, classeId) => `${profId}-${classeId}`;

  const handleAddPassage = async (professeurId, aff) => {
    if (!aff.tarif_horaire) {
      setError(`Définissez d'abord le tarif pour la classe ${aff.classe?.nom}.`);
      return;
    }

    const key = affectationKey(professeurId, aff.classeId);
    const heures = parseFloat(hourInputs[key]);
    if (!Number.isFinite(heures) || heures <= 0) {
      setError('Saisissez un nombre d\'heures valide (supérieur à 0).');
      return;
    }

    setBusyKey(key);
    setMessage('');
    setError('');

    try {
      const res = await api.post('/admin/presences-professeurs', {
        professeurId,
        classeId: aff.classeId,
        nombre_heures: heures,
        date,
      });
      setMessage(res.message || `Passage enregistré pour ${aff.classe?.nom}.`);
      await loadFeuille();
    } catch (err) {
      setError(err.data?.error || 'Erreur lors de l\'enregistrement.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteSeance = async (seanceId, classeNom) => {
    setBusyKey(`del-${seanceId}`);
    setMessage('');
    setError('');
    try {
      await api.delete(`/admin/presences-professeurs/${seanceId}`);
      setMessage(`Passage supprimé${classeNom ? ` — ${classeNom}` : ''}.`);
      await loadFeuille();
    } catch (err) {
      setError(err.data?.error || 'Erreur lors de la suppression.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleUpdateSeanceHours = async (seanceId, value) => {
    const heures = parseFloat(value);
    if (!Number.isFinite(heures) || heures <= 0) {
      setError('Nombre d\'heures invalide.');
      await loadFeuille();
      return;
    }
    setBusyKey(`edit-${seanceId}`);
    setError('');
    try {
      await api.put(`/admin/presences-professeurs/${seanceId}`, { nombre_heures: heures });
      await loadFeuille();
    } catch (err) {
      setError(err.data?.error || 'Erreur lors de la modification.');
      await loadFeuille();
    } finally {
      setBusyKey(null);
    }
  };

  const professeurs = feuille?.professeurs || [];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h1 className="admin-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={28} color="#0A2F6B" />
            Paie des professeurs
          </h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
            Sélectionnez la classe, saisissez les heures et ajoutez chaque passage
          </p>
        </div>
      </div>

      {message && (
        <div style={{ padding: '0.75rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '1rem' }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${tab === 'presences' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setTab('presences')}
        >
          <Calendar size={16} />
          Présences du jour
        </button>
        <button
          type="button"
          className={`btn ${tab === 'mensuel' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setTab('mensuel')}
        >
          <Clock size={16} />
          Synthèse mensuelle
        </button>
        <button
          type="button"
          className={`btn ${tab === 'tarifs' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setTab('tarifs')}
        >
          <DollarSign size={16} />
          Tarifs horaires
        </button>
      </div>

      {tab === 'tarifs' && (
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Prime horaire par niveau et classe</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Chaque classe a son tarif — appliqué au total d&apos;heures en fin de mois
            </p>
          </div>
          {loadingTarifs ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Niveau</th>
                    <th>Classe</th>
                    <th>Tarif / heure (GNF)</th>
                    <th>Heures par défaut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tarifs.map((c) => {
                    const edit = tarifEdits[c.id] || { tarif_horaire: '', heures_seance: 1 };
                    return (
                      <tr key={c.id}>
                        <td>{c.niveauEtude?.nom || c.niveau || '—'}</td>
                        <td>{c.nom}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            className="form-input"
                            style={{ width: '140px' }}
                            value={edit.tarif_horaire}
                            onChange={(e) => setTarifEdits((prev) => ({
                              ...prev,
                              [c.id]: { ...prev[c.id], tarif_horaire: e.target.value },
                            }))}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            className="form-input"
                            style={{ width: '80px' }}
                            value={edit.heures_seance}
                            onChange={(e) => setTarifEdits((prev) => ({
                              ...prev,
                              [c.id]: { ...prev[c.id], heures_seance: e.target.value },
                            }))}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            disabled={savingTarifId === c.id}
                            onClick={() => handleSaveTarif(c.id)}
                          >
                            <Save size={14} />
                            {savingTarifId === c.id ? '...' : 'Enregistrer'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'mensuel' && (
        <>
          <div className="admin-panel" style={{ marginBottom: '1rem' }}>
            <div className="admin-panel__header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="admin-panel__title">Calcul de fin de mois</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                  Par classe : heures du mois × tarif horaire défini
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  Mois :
                  <input
                    type="month"
                    className="form-input"
                    value={mois}
                    onChange={(e) => setMois(e.target.value)}
                  />
                </label>
                {synthese && (
                  <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    {synthese.total_heures}h — Total : <strong>{formatGnf(synthese.total_montant)}</strong>
                    {synthese.est_mois_courant && ' (mois en cours)'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {loadingSynthese ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chargement...</div>
          ) : !synthese?.professeurs?.length ? (
            <div className="admin-panel" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Aucune présence pour {formatMois(mois)}.
            </div>
          ) : (
            synthese.professeurs.map((prof) => (
              <div key={prof.professeurId} className="admin-panel" style={{ marginBottom: '1rem' }}>
                <div className="admin-panel__header">
                  <h3 className="admin-panel__title" style={{ fontSize: '1rem' }}>
                    {prof.professeur?.prenom} {prof.professeur?.nom}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#0A2F6B', fontWeight: 600 }}>
                    {prof.heures}h — {formatGnf(prof.montant)}
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Classe</th>
                        <th>Heures du mois</th>
                        <th>Tarif / h</th>
                        <th>Montant (H × tarif)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prof.par_classe.map((c) => (
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
              </div>
            ))
          )}
        </>
      )}

      {tab === 'presences' && (
        <>
          <div className="admin-panel" style={{ marginBottom: '1rem' }}>
            <div className="admin-panel__header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="admin-panel__title">Feuille de présence</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                  Plusieurs passages possibles par jour — saisissez le nombre d&apos;heures à chaque fois
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  Date :
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                {feuille && (
                  <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    {feuille.presences_count} passage(s) — <strong>{feuille.heures_jour}h</strong> aujourd&apos;hui
                  </span>
                )}
              </div>
            </div>
          </div>

          {loadingFeuille ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chargement...</div>
          ) : professeurs.length === 0 ? (
            <div className="admin-panel" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Aucun professeur avec matière assignée à une classe.
            </div>
          ) : (
            professeurs.map((group) => {
              const heuresJour = group.affectations.reduce(
                (s, a) => s + (a.heures_jour || 0),
                0,
              );
              const multiClasses = group.nb_classes > 1;

              return (
                <div key={group.professeurId} className="admin-panel" style={{ marginBottom: '1rem' }}>
                  <div className="admin-panel__header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 className="admin-panel__title" style={{ fontSize: '1rem', marginBottom: multiClasses ? 4 : 0 }}>
                        {group.professeur?.prenom} {group.professeur?.nom}
                      </h3>
                      {multiClasses && (
                        <p style={{ fontSize: '0.8rem', color: '#2563eb', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Layers size={14} />
                          {group.nb_classes} classes — ajoutez un passage par classe concernée
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#0A2F6B', fontWeight: 600 }}>
                      {heuresJour}h aujourd&apos;hui
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Classe / Niveau</th>
                          <th>Matière(s)</th>
                          <th>Tarif / h</th>
                          <th style={{ width: 100 }}>Heures</th>
                          <th style={{ width: 140 }}>Passage</th>
                          <th>Passages du jour</th>
                          <th>Total jour</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.affectations.map((aff) => {
                          const key = affectationKey(group.professeurId, aff.classeId);
                          const busy = busyKey === key;
                          const noTarif = aff.tarif_horaire == null;
                          const matieresLabel = aff.matieres.map((m) => m.nom).join(', ');
                          const seances = aff.seances || [];

                          return (
                            <tr
                              key={aff.classeId}
                              style={noTarif ? { opacity: 0.65 } : undefined}
                            >
                              <td style={{ fontWeight: multiClasses ? 600 : 400 }}>
                                {classeLabel(aff)}
                              </td>
                              <td style={{ fontSize: '0.9rem', color: '#475569' }}>{matieresLabel}</td>
                              <td>
                                {noTarif
                                  ? <span style={{ color: '#dc2626' }}>Non défini</span>
                                  : formatGnf(aff.tarif_horaire)}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  className="form-input"
                                  style={{ width: '72px', padding: '4px 8px' }}
                                  value={hourInputs[key] ?? String(aff.heures_defaut ?? 1)}
                                  disabled={noTarif || busy}
                                  onChange={(e) => setHourInputs((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))}
                                  title="Nombre d'heures pour ce passage"
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn--primary btn--sm"
                                  disabled={noTarif || busy}
                                  onClick={() => handleAddPassage(group.professeurId, aff)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                                >
                                  <Plus size={14} />
                                  {busy ? '...' : 'Ajouter'}
                                </button>
                              </td>
                              <td>
                                {seances.length === 0 ? (
                                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Aucun passage</span>
                                ) : (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                    {seances.map((s, idx) => (
                                      <span
                                        key={s.id}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4,
                                          background: '#f0fdf4',
                                          border: '1px solid #bbf7d0',
                                          borderRadius: 6,
                                          padding: '2px 6px',
                                          fontSize: '0.8rem',
                                        }}
                                      >
                                        <span style={{ color: '#64748b' }}>#{idx + 1}</span>
                                        <input
                                          type="number"
                                          min="0.5"
                                          step="0.5"
                                          defaultValue={s.nombre_heures}
                                          disabled={busyKey === `edit-${s.id}` || busyKey === `del-${s.id}`}
                                          onBlur={(e) => {
                                            const v = parseFloat(e.target.value);
                                            if (v !== s.nombre_heures) {
                                              handleUpdateSeanceHours(s.id, e.target.value);
                                            }
                                          }}
                                          style={{
                                            width: 44,
                                            border: 'none',
                                            background: 'transparent',
                                            fontWeight: 600,
                                            color: '#166534',
                                            padding: 0,
                                          }}
                                          title="Modifier les heures"
                                        />
                                        <span style={{ color: '#166534' }}>h</span>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSeance(s.id, aff.classe?.nom)}
                                          disabled={busyKey === `del-${s.id}`}
                                          title="Supprimer ce passage"
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 0,
                                            color: '#dc2626',
                                            display: 'flex',
                                          }}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td style={{ fontWeight: 600, color: aff.heures_jour > 0 ? '#16a34a' : '#94a3b8' }}>
                                {aff.heures_jour > 0 ? `${aff.heures_jour}h` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
