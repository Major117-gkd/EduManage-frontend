import React from 'react';
import { getMention } from '../BulletinCard/bulletinHelpers';
import {
  PrintDocument,
  PrintHeader,
  PrintMeta,
  PrintStats,
  PrintTable,
  PrintFooter,
} from '../PrintLayout/PrintLayout';
import { formatPrintDate } from '../../utils/printConstants';
import { printDocument } from '../../utils/printDocument';

export default function ClassResultsPrint({
  bulletins,
  classeInfo,
  periode,
  stats,
  seuilReussite = 10,
}) {
  const sorted = [...bulletins].sort((a, b) => {
    if (a.rang === null && b.rang === null) return 0;
    if (a.rang === null) return 1;
    if (b.rang === null) return -1;
    return a.rang - b.rang;
  });

  return (
    <PrintDocument>
      <PrintHeader
        badge="Résultats"
        docTitle="Relevé de résultats par classe"
        docSubtitle="Bulletins & performances — année en cours"
      />

      <PrintMeta
        items={[
          { label: 'Niveau', value: classeInfo.niveau || '—' },
          { label: 'Classe', value: classeInfo.nom },
          { label: 'Période', value: periode },
          { label: 'Date', value: formatPrintDate() },
        ]}
      />

      <PrintStats
        items={[
          { label: 'Élèves', value: stats.total },
          { label: 'Avec moyenne', value: stats.withGrades },
          { label: `Admis (≥${seuilReussite})`, value: stats.admis, variant: 'success' },
          { label: 'Taux de réussite', value: `${stats.tauxReussite}%` },
          { label: 'Moy. de classe', value: stats.classeMoyenne ?? '—', variant: 'gold' },
        ]}
      />

      {sorted.length === 0 ? (
        <p className="edu-print-empty">Aucun élève à afficher.</p>
      ) : (
        <PrintTable>
          <thead>
            <tr>
              <th>Rang</th>
              <th>Matricule</th>
              <th>Nom & Prénom</th>
              <th>Moy. générale</th>
              <th>Mention</th>
              <th>Statut</th>
              <th>Paiement</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => {
              const moy = b.moyenneGenerale != null ? parseFloat(b.moyenneGenerale) : null;
              const admis = moy !== null && !Number.isNaN(moy) && moy >= seuilReussite;
              return (
                <tr
                  key={b.eleveId}
                  className={b.rang === 1 ? 'edu-print-table__row--highlight' : ''}
                >
                  <td className="edu-print-table__rank">{b.rang ?? '—'}</td>
                  <td>{b.matricule}</td>
                  <td className="edu-print-table__name">
                    <strong>{b.nom} {b.prenom}</strong>
                  </td>
                  <td className="edu-print-table__num">
                    {moy !== null ? `${moy.toFixed(2)}/20` : '—'}
                  </td>
                  <td>{moy !== null ? getMention(moy) : '—'}</td>
                  <td>
                    {moy !== null ? (
                      <span className={`edu-print-badge edu-print-badge--${admis ? 'success' : 'danger'}`}>
                        {admis ? 'Admis' : 'Non admis'}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{b.statut_financier || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </PrintTable>
      )}

      <PrintFooter
        signatures={['Le Directeur des Études', 'Le Directeur']}
      >
        <p>
          Seuil de réussite : <strong>{seuilReussite}/20</strong>
          {stats.bestName && (
            <> · Meilleur élève : <strong>{stats.bestName}</strong> ({stats.bestMoy}/20)</>
          )}
        </p>
      </PrintFooter>
    </PrintDocument>
  );
}

export function printClassResults() {
  printDocument('printing-class-results');
}
