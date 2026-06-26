import React from 'react';
import {
  PrintDocument,
  PrintHeader,
  PrintMeta,
  PrintSection,
  PrintFooter,
} from '../PrintLayout/PrintLayout';
import { formatPrintDate } from '../../utils/printConstants';
import { printDocument } from '../../utils/printDocument';
import PaymentSummaryCard from './PaymentSummaryCard';
import './PaymentSummaryCard.css';

export default function PaymentReceipt({ paiement }) {
  if (!paiement) return null;

  const eleve = paiement.eleve || {};
  const classe = eleve.inscriptions?.[0]?.classe;

  return (
    <PrintDocument className="edu-print-receipt">
      <PrintHeader
        badge="Reçu officiel"
        docTitle="Reçu de paiement"
        reference={paiement.reference || '—'}
      />

      <PrintMeta
        items={[
          { label: 'Date', value: formatPrintDate(paiement.date_paiement, true) },
          { label: 'Année scolaire', value: paiement.annee_scolaire || '—' },
          { label: 'Période / Tranche', value: paiement.periode || '—' },
        ]}
      />

      <PrintSection title="Informations élève">
        <div className="edu-print-field-grid">
          <div className="edu-print-field">
            <label>Nom complet</label>
            <strong>{eleve.prenom} {eleve.nom}</strong>
          </div>
          <div className="edu-print-field">
            <label>Matricule</label>
            <strong>{eleve.matricule || '—'}</strong>
          </div>
          <div className="edu-print-field">
            <label>Classe</label>
            <strong>{classe?.nom || '—'}</strong>
          </div>
          <div className="edu-print-field">
            <label>Parent / Tuteur</label>
            <strong>{eleve.parent_nom || '—'}</strong>
          </div>
          {eleve.parent_telephone && (
            <div className="edu-print-field">
              <label>Téléphone parent</label>
              <strong>{eleve.parent_telephone}</strong>
            </div>
          )}
        </div>
      </PrintSection>

      <PaymentSummaryCard paiement={paiement} finances={paiement.finances} variant="print" />

      {paiement.notes && (
        <PrintSection title="Notes">
          <p className="edu-print-notes">{paiement.notes}</p>
        </PrintSection>
      )}

      <PrintFooter
        signatures={['Signature du payeur', "Cachet et signature de l'école"]}
      >
        <p>Ce reçu atteste du paiement des frais de scolarité pour la période indiquée.</p>
      </PrintFooter>
    </PrintDocument>
  );
}

export function printPaymentReceipt() {
  printDocument('printing-receipt');
}
