import React from 'react';
import {
  PrintDocument,
  PrintHeader,
  PrintMeta,
  PrintStats,
  PrintSection,
  PrintTable,
  PrintFooter,
} from '../PrintLayout/PrintLayout';
import { formatPrintDate, formatPrintAmount } from '../../utils/printConstants';
import { printDocument } from '../../utils/printDocument';

function StudentTable({ title, students, variant }) {
  return (
    <PrintSection
      title={<>{title} <span className="edu-print-section__count">({students.length})</span></>}
      variant={variant}
    >
      {students.length === 0 ? (
        <p className="edu-print-empty">Aucun élève dans cette catégorie.</p>
      ) : (
        <PrintTable>
          <thead>
            <tr>
              <th>#</th>
              <th>Matricule</th>
              <th>Nom & Prénom</th>
              <th>Statut financier</th>
              <th>Solde restant</th>
              <th>Moy. générale</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.eleveId}>
                <td className="edu-print-table__rank">{i + 1}</td>
                <td>{s.matricule}</td>
                <td className="edu-print-table__name"><strong>{s.nom} {s.prenom}</strong></td>
                <td>
                  <span className={`edu-print-badge edu-print-badge--${variant === 'paid' ? 'success' : 'danger'}`}>
                    {s.statut_financier || '—'}
                  </span>
                </td>
                <td>{formatPrintAmount(s.solde)}</td>
                <td className="edu-print-table__num">
                  {s.moyenneGenerale != null
                    ? `${Number(s.moyenneGenerale).toFixed(2)}/20`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </PrintTable>
      )}
    </PrintSection>
  );
}

export default function PaymentStatusList({
  classeInfo,
  periode,
  paidStudents,
  unpaidStudents,
  mode = 'both',
}) {
  return (
    <PrintDocument>
      <PrintHeader
        badge="Finances"
        docTitle="Statut des paiements"
        docSubtitle="Frais de scolarité — liste par classe"
      />

      <PrintMeta
        items={[
          { label: 'Classe', value: classeInfo.nom },
          { label: 'Période', value: periode },
          { label: 'Date', value: formatPrintDate() },
        ]}
      />

      <PrintStats
        items={[
          { label: 'Élèves à jour', value: paidStudents.length, variant: 'success' },
          { label: 'Non à jour', value: unpaidStudents.length, variant: 'danger' },
          { label: 'Total élèves', value: paidStudents.length + unpaidStudents.length },
        ]}
      />

      {(mode === 'paid' || mode === 'both') && (
        <StudentTable
          title="Élèves à jour (paiement effectué)"
          students={paidStudents}
          variant="paid"
        />
      )}

      {(mode === 'unpaid' || mode === 'both') && (
        <StudentTable
          title="Élèves non à jour (paiement en attente ou incomplet)"
          students={unpaidStudents}
          variant="unpaid"
        />
      )}

      <PrintFooter>
        <p>Document à usage administratif — module Bulletins & Résultats.</p>
      </PrintFooter>
    </PrintDocument>
  );
}

export function printPaymentStatusList() {
  printDocument('printing-payment-status');
}

export function isStudentPaid(statut) {
  return statut === 'À jour';
}
