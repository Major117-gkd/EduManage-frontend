import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Eye, Edit, Trash2, X, RotateCw, Check, Printer, CreditCard } from 'lucide-react';
import StudentCard from '../../components/StudentCard/StudentCard';
import '../admin/AdminDashboard.css';
import '../admin/Modal.css';

const API = 'http://localhost:5000';

export default function StudentsPage() {
  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeYear, setActiveYear] = useState('');
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGlobalReInscriptionOpen, setIsGlobalReInscriptionOpen] = useState(false);
  const [selectedCardStudent, setSelectedCardStudent] = useState(null);
  const [reInscrireEleve, setReInscrireEleve] = useState(null);
  const [validateConfirmId, setValidateConfirmId] = useState(null);
  const [form, setForm] = useState({ prenom: '', nom: '', date_naissance: '', adresse: '', parent_nom: '', filiation: '', parent_telephone: '', parent_email: '', infos_importantes: '', classeId: '', annee_scolaire: '', matricule: '', photoUrl: '' });
  const [reForm, setReForm] = useState({ classeId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = () => {
    fetch(`${API}/api/admin/eleves`).then(r => r.json()).then(d => { if (Array.isArray(d)) setEleves(d); }).catch(() => {});
    fetch(`${API}/api/admin/classes`).then(r => r.json()).then(d => { if (Array.isArray(d)) setClasses(d); }).catch(() => {});
    fetch(`${API}/api/admin/annees`).then(r => r.json()).then(d => { 
      if (Array.isArray(d)) {
        const active = d.find(y => y.active);
        if (active) {
          setActiveYear(active.nom);
          setForm(f => ({ ...f, annee_scolaire: active.nom }));
        }
      }
    }).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setMessage('');
    try {
      const res = await fetch(`${API}/api/admin/eleves`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { setMessage('' + data.message); loadData(); setForm({ prenom: '', nom: '', date_naissance: '', adresse: '', parent_nom: '', filiation: '', parent_telephone: '', parent_email: '', infos_importantes: '', classeId: '', annee_scolaire: activeYear }); setTimeout(() => { setIsModalOpen(false); setMessage(''); }, 1500); }
      else setMessage('' + (data.error || 'Erreur'));
    } catch { setMessage('Impossible de contacter le serveur'); }
    setSubmitting(false);
  };

  const handleReInscription = async (e) => {
    e.preventDefault(); setSubmitting(true); setMessage('');
    try {
      const res = await fetch(`${API}/api/admin/eleves/${reInscrireEleve.id}/reinscription`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ classeId: reForm.classeId, annee_scolaire: activeYear }) 
      });
      const data = await res.json();
      if (res.ok) { setMessage('' + data.message); loadData(); setTimeout(() => { setReInscrireEleve(null); setMessage(''); }, 1500); }
      else setMessage('' + (data.error || 'Erreur'));
    } catch { setMessage('Impossible de contacter le serveur'); }
    setSubmitting(false);
  };

  const toggleRow = (id) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter(rowId => rowId !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };

  const handleValidate = async () => {
    if (!validateConfirmId) return;
    try {
      const res = await fetch(`${API}/api/admin/inscriptions/${validateConfirmId}/valider`, {
        method: 'PUT'
      });
      if (res.ok) {
        loadData();
        setValidateConfirmId(null);
      } else {
        alert("Erreur lors de la validation");
      }
    } catch {
      alert("Erreur réseau");
    }
  };

  const filtered = eleves.filter(e => `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-title">Gestion des Élèves</h1>
        <div className="print-hide" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn--outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #cbd5e1' }} onClick={() => window.print()}>
            <Printer size={18} /> Imprimer
          </button>
          <button className="btn btn--outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #cbd5e1' }} onClick={() => setIsGlobalReInscriptionOpen(true)}>
            <RotateCw size={18} /> Réinscription
          </button>
          <button className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsModalOpen(true)}>
            <UserPlus size={18} /> Nouvelle Inscription
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="print-hide" style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Search size={18} color="#94a3b8" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou matricule..." style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#0f172a', backgroundColor: 'transparent' }} />
      </div>

      {/* Table */}
      <div className="admin-panel">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr><th></th><th>Matricule</th><th>Nom Complet</th><th>Date de naissance</th><th>Classe</th><th>Statut</th><th className="print-hide">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>Aucun élève trouvé.</td></tr>
              ) : filtered.map(el => {
                const isExpanded = expandedRows.includes(el.id);
                return (
                  <React.Fragment key={el.id}>
                    <tr onClick={() => toggleRow(el.id)} style={{ cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white' }}>
                      <td style={{ width: '40px', color: '#64748b' }}>
                        {isExpanded ? '▼' : '▶'}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0A2F6B' }}>{el.matricule}</td>
                      <td style={{ fontWeight: 500, color: '#0f172a' }}>{el.prenom} {el.nom}</td>
                      <td>{el.date_naissance ? new Date(el.date_naissance).toLocaleDateString('fr-FR') : '—'}</td>
                      <td>{el.inscriptions?.[0]?.classe?.nom ?? '—'}</td>
                      <td><span className={`status-badge status-badge--${el.inscriptions?.[0]?.statut === 'Validé' ? 'success' : 'warning'}`}>{el.inscriptions?.[0]?.statut ?? '—'}</span></td>
                      <td className="print-hide" style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                        {el.inscriptions?.[0]?.statut === 'En attente' && (
                          <button className="action-btn action-btn--view" title="Valider l'inscription" style={{ background: '#fef08a', color: '#854d0e' }} onClick={() => setValidateConfirmId(el.inscriptions[0].id)}>
                            <Check size={16} />
                          </button>
                        )}
                        <button className="action-btn action-btn--view" title="Réinscrire" style={{ background: '#dcfce7', color: '#16a34a' }} onClick={() => setReInscrireEleve(el)}><RotateCw size={16} /></button>
                        <button className="action-btn action-btn--view" title="Générer Carte" style={{ background: '#e0e7ff', color: '#4f46e5' }} onClick={() => setSelectedCardStudent(el)}>
                          <CreditCard size={16} />
                        </button>
                        <button className="action-btn action-btn--view" title="Voir"><Eye size={16} /></button>
                        <button className="action-btn action-btn--edit" title="Modifier"><Edit size={16} /></button>
                        <button className="action-btn action-btn--delete" title="Supprimer"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <td colSpan="7" style={{ padding: '1rem 2rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', fontSize: '0.9rem', color: '#475569' }}>
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Parent / Tuteur</p>
                              <p style={{ margin: 0, fontWeight: 500, color: '#0f172a' }}>{el.parent_nom || '—'} <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({el.filiation || '—'})</span></p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Contact Parent</p>
                              <p style={{ margin: 0 }}>📞 {el.parent_telephone || '—'}</p>
                              <p style={{ margin: 0 }}>📧 {el.parent_email || '—'}</p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Adresse</p>
                              <p style={{ margin: 0 }}>{el.adresse || '—'}</p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Infos Médicales/Importantes</p>
                              <p style={{ margin: 0, color: el.infos_importantes ? '#b91c1c' : '#475569', fontWeight: el.infos_importantes ? 500 : 400 }}>{el.infos_importantes || 'Aucune'}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src="/images/logo_boubacar.png" alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'contain' }} />
                <h2>Inscrire un Élève</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '0.75rem', background: '#fffbeb', color: '#b45309', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', border: '1px solid #fef3c7' }}>
                <strong style={{ fontSize: '1.2rem' }}>⚠️</strong> 
                <div>
                  <strong>Attention aux doublons :</strong> Si l'élève a déjà étudié dans notre établissement par le passé, fermez cette fenêtre et utilisez le bouton <strong>Réinscription</strong>.
                </div>
              </div>
              {message && <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#d1fae5' : '#fee2e2', color: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>{message}</div>}
              <form id="studentForm" onSubmit={handleSubmit}>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Prénom</label><input type="text" name="prenom" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} placeholder="Ex: Amadou" required /></div>
                  <div className="modal-form-group"><label>Nom</label><input type="text" name="nom" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Ex: Diallo" required /></div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Date de naissance</label><input type="date" value={form.date_naissance} onChange={e => setForm({...form, date_naissance: e.target.value})} /></div>
                  <div className="modal-form-group"><label>Année scolaire</label><input type="text" value={form.annee_scolaire} onChange={e => setForm({...form, annee_scolaire: e.target.value})} required /></div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>N° d'élève (Matricule)</label><input type="text" value={form.matricule} onChange={e => setForm({...form, matricule: e.target.value})} placeholder="Ex: GSP-2024-001 (Laisser vide pour auto)" /></div>
                  <div className="modal-form-group">
                    <label>Photo de l'élève</label>
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setForm({...form, photoUrl: reader.result});
                        reader.readAsDataURL(file);
                      }
                    }} />
                    {form.photoUrl && <img src={form.photoUrl} alt="Aperçu" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginTop: '4px' }} />}
                  </div>
                </div>
                <div className="modal-form-group"><label>Adresse (optionnel)</label><input type="text" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} placeholder="Ex: Quartier Almamya, Conakry" /></div>
                
                <h3 style={{ fontSize: '1.05rem', color: '#1e293b', margin: '1.5rem 0 1rem 0', fontWeight: 600 }}>Informations du Parent / Tuteur</h3>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Nom complet</label><input type="text" value={form.parent_nom} onChange={e => setForm({...form, parent_nom: e.target.value})} placeholder="Ex: Ousmane Diallo" required /></div>
                  <div className="modal-form-group"><label>Lien de parenté</label><select value={form.filiation} onChange={e => setForm({...form, filiation: e.target.value})} required><option value="">Sélectionner</option><option value="Père">Père</option><option value="Mère">Mère</option><option value="Tuteur">Tuteur</option></select></div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group"><label>Téléphone</label><input type="text" value={form.parent_telephone} onChange={e => setForm({...form, parent_telephone: e.target.value})} placeholder="Ex: +224 620 000 000" required /></div>
                  <div className="modal-form-group"><label>Email (optionnel)</label><input type="email" value={form.parent_email} onChange={e => setForm({...form, parent_email: e.target.value})} placeholder="Ex: contact@email.com" /></div>
                </div>
                <div className="modal-form-group"><label>Informations importantes (optionnel)</label><input type="text" value={form.infos_importantes} onChange={e => setForm({...form, infos_importantes: e.target.value})} placeholder="Ex: Allergies, asthme, etc." /></div>

                <h3 style={{ fontSize: '1.05rem', color: '#1e293b', margin: '1.5rem 0 1rem 0', fontWeight: 600 }}>Affectation Scolaire</h3>
                <div className="modal-form-group">
                  <label>Affecter à une classe</label>
                  <select value={form.classeId} onChange={e => setForm({...form, classeId: e.target.value})} required>
                    <option value="">Sélectionnez une classe</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>)}
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button type="submit" form="studentForm" className="btn-submit" disabled={submitting || !activeYear}>{submitting ? 'Enregistrement...' : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Réinscription */}
      {reInscrireEleve && (
        <div className="modal-overlay" onClick={() => setReInscrireEleve(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src="/images/logo_boubacar.png" alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'contain' }} />
                <h2>Réinscrire {reInscrireEleve.prenom} {reInscrireEleve.nom}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setReInscrireEleve(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {message && <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#d1fae5' : '#fee2e2', color: !message.toLowerCase().includes('erreur') && !message.toLowerCase().includes('impossible') ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>{message}</div>}
              
              {!activeYear ? (
                <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
                  Aucune année scolaire active. Veuillez en définir une dans les paramètres.
                </div>
              ) : (
                <form id="reForm" onSubmit={handleReInscription}>
                  <div className="modal-form-group">
                    <label>Année Scolaire</label>
                    <input type="text" value={activeYear} disabled style={{ background: '#f1f5f9', color: '#64748b' }} />
                  </div>
                  <div className="modal-form-group">
                    <label>Nouvelle Classe</label>
                    <select value={reForm.classeId} onChange={e => setReForm({ classeId: e.target.value })} required>
                      <option value="">Sélectionnez une classe</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>)}
                    </select>
                  </div>
                </form>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setReInscrireEleve(null)}>Annuler</button>
              <button type="submit" form="reForm" className="btn-submit" disabled={submitting || !activeYear}>{submitting ? 'Enregistrement...' : 'Confirmer la réinscription'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Confirmation Modal */}
      {validateConfirmId && (
        <div className="modal-overlay" onClick={() => setValidateConfirmId(null)} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', padding: '2.5rem 2rem', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.2)', animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '1.5rem', marginTop: '0', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)' }}>
              <Check size={36} strokeWidth={3} />
            </div>
            <h2 style={{ marginBottom: '1rem', color: '#0f172a', fontSize: '1.5rem', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>Confirmer la validation</h2>
            <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: 1.6 }}>
              Voulez-vous vraiment valider cette inscription ?<br/>L'élève sera officiellement ajouté à la classe.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setValidateConfirmId(null)} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem' }} onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }} onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>Annuler</button>
              <button onClick={handleValidate} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #0A2F6B 0%, #1e40af 100%)', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(10, 47, 107, 0.2)', fontSize: '1rem' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(10, 47, 107, 0.3)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(10, 47, 107, 0.2)'; }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Réinscription Globale (Sélection de l'élève) */}
      {isGlobalReInscriptionOpen && (
        <div className="modal-overlay" onClick={() => setIsGlobalReInscriptionOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <RotateCw size={24} color="#0A2F6B" />
                <h2>Réinscription d'un élève</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setIsGlobalReInscriptionOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Sélectionnez un élève déjà existant dans le système pour le réinscrire dans une nouvelle classe.<br/>
                Cela permet de conserver son historique scolaire et d'éviter les doublons.
              </p>
              <div className="modal-form-group">
                <label>Rechercher l'élève (par nom ou matricule)</label>
                <select 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: '#f8fafc' }}
                  onChange={(e) => {
                    const selected = eleves.find(el => el.id === parseInt(e.target.value));
                    if (selected) {
                      setReInscrireEleve(selected);
                      setIsGlobalReInscriptionOpen(false);
                    }
                  }}
                >
                  <option value="">Sélectionnez un élève...</option>
                  {eleves.map(el => (
                    <option key={el.id} value={el.id}>{el.matricule} — {el.prenom} {el.nom}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Carte Scolaire */}
      {selectedCardStudent && (
        <div className="modal-overlay" onClick={() => setSelectedCardStudent(null)}>
          <div className="modal-content print-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1100px', width: '95%', background: '#f8fafc' }}>
            <div className="modal-header print-hide">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <CreditCard size={24} color="#0A2F6B" />
                <h2>Carte d'identité scolaire</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedCardStudent(null)}><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0', background: '#e2e8f0', borderRadius: '12px' }}>
              <StudentCard student={selectedCardStudent} anneeScolaire={activeYear || '2024 - 2025'} />
            </div>
            
            <div className="modal-footer print-hide">
              <button className="btn-cancel" onClick={() => setSelectedCardStudent(null)}>Fermer</button>
              <button className="btn-submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => {
                document.body.classList.add('printing-card');
                // Wait for next paint, then print. Remove class only after dialog closes.
                setTimeout(() => {
                  window.print();
                  // Remove class after printing dialog is closed
                  const cleanup = () => {
                    document.body.classList.remove('printing-card');
                    window.removeEventListener('afterprint', cleanup);
                  };
                  window.addEventListener('afterprint', cleanup);
                }, 300);
              }}>
                <Printer size={18} /> Imprimer la carte
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


