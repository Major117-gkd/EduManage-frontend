import React from 'react';
import { Award, Star, CheckCircle, XCircle } from 'lucide-react';
import { getMention, getMentionColor, getMentionBg } from './bulletinHelpers';

export default function BulletinCard({ eleve, classeInfo, periode, onBack, className = '' }) {
  if (!eleve) return null;

  const classeNom = classeInfo?.nom || '—';

  return (
    <div className={`admin-panel bulletin-card ${className}`.trim()}>
      <div className="bulletin-card__header">
        <div className="bulletin-card__school-badge">
          <Award size={16} />
          Bulletin Scolaire Officiel
        </div>
        <div className="bulletin-card__identity">
          <div>
            <h2 className="bulletin-card__name">
              {eleve.prenom} {eleve.nom}
            </h2>
            <p className="bulletin-card__meta">
              {classeNom} · {periode} · Matricule : <strong>{eleve.matricule || '—'}</strong>
            </p>
          </div>
          <div className="bulletin-card__avg-block">
            <span
              className="bulletin-card__avg-value"
              style={{ color: getMentionColor(eleve.moyenneGenerale) }}
            >
              {eleve.moyenneGenerale
                ? `${parseFloat(eleve.moyenneGenerale).toFixed(2)}/20`
                : 'N/A'}
            </span>
            <span
              className="bulletin-card__avg-mention"
              style={{
                background: getMentionBg(eleve.moyenneGenerale),
                color: getMentionColor(eleve.moyenneGenerale),
              }}
            >
              {getMention(eleve.moyenneGenerale)} · Rang {eleve.rang ?? '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table bulletin-subject-table">
          <thead>
            <tr>
              <th>Matière</th>
              <th>Prof. responsable</th>
              <th style={{ textAlign: 'center' }}>Coeff.</th>
              <th>Notes</th>
              <th style={{ textAlign: 'center' }}>Moy. matière</th>
              <th>Mention</th>
            </tr>
          </thead>
          <tbody>
            {(eleve.matieres || []).map((m) => (
              <tr key={m.matiereId} className={!m.moyenne ? 'bulletin-row--empty' : ''}>
                <td className="bulletin-subject-name">{m.matiere}</td>
                <td className="bulletin-teacher">{m.professeur}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className="bulletin-coeff">{m.coefficient}</span>
                </td>
                <td>
                  <div className="bulletin-notes-wrap">
                    {m.notes.length === 0 ? (
                      <span className="bulletin-no-note">Aucune note</span>
                    ) : (
                      m.notes.map((n) => (
                        <span
                          key={n.id}
                          title={n.type}
                          className="bulletin-note-chip"
                          style={{
                            background: getMentionBg(n.valeur),
                            color: getMentionColor(n.valeur),
                          }}
                        >
                          {n.valeur}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {m.moyenne !== null && m.moyenne !== undefined ? (
                    <span
                      className="bulletin-avg-chip"
                      style={{
                        color: getMentionColor(m.moyenne),
                        background: getMentionBg(m.moyenne),
                      }}
                    >
                      {Number(m.moyenne).toFixed(2)}/20
                    </span>
                  ) : (
                    <span className="bulletin-no-note">—</span>
                  )}
                </td>
                <td>
                  {m.moyenne && (
                    <span
                      className="bulletin-mention-pill"
                      style={{
                        background: getMentionBg(m.moyenne),
                        color: getMentionColor(m.moyenne),
                      }}
                    >
                      {getMention(m.moyenne)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bulletin-card__footer">
        <div className="bulletin-card__footer-stats">
          <div className="bulletin-footer-stat">
            <Star size={14} />
            <span>Rang : <strong style={{ color: '#0A2F6B' }}>{eleve.rang ?? '—'}</strong></span>
          </div>
          <div className="bulletin-footer-stat">
            <Award size={14} />
            <span>
              Mention :{' '}
              <strong style={{ color: getMentionColor(eleve.moyenneGenerale) }}>
                {getMention(eleve.moyenneGenerale)}
              </strong>
            </span>
          </div>
          <div className="bulletin-footer-stat">
            {parseFloat(eleve.moyenneGenerale) >= 10 ? (
              <CheckCircle size={14} color="#059669" />
            ) : (
              <XCircle size={14} color="#dc2626" />
            )}
            <span
              style={{
                color: parseFloat(eleve.moyenneGenerale) >= 10 ? '#059669' : '#dc2626',
                fontWeight: 700,
              }}
            >
              {parseFloat(eleve.moyenneGenerale) >= 10 ? 'Admis(e)' : 'Non admis(e)'}
            </span>
          </div>
        </div>
        {onBack && (
          <button type="button" className="results-btn results-btn--outline print-hide" onClick={onBack}>
            ← Retour à la liste
          </button>
        )}
      </div>
    </div>
  );
}
