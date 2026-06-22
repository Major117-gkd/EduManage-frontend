import React from 'react';
import BulletinCard from '../BulletinCard/BulletinCard';
import {
  PrintDocument,
  PrintHeader,
  PrintMeta,
} from '../PrintLayout/PrintLayout';
import { formatPrintDate } from '../../utils/printConstants';
import { printDocument } from '../../utils/printDocument';
import './BulletinPrintBatch.css';

export default function BulletinPrintBatch({
  bulletins,
  classeInfo,
  periode,
  mode = 'all',
}) {
  return (
    <PrintDocument className="bulletin-print-batch" id="bulletin-print-batch-content">
      <div className="edu-print-cover">
        <PrintHeader
          badge="Bulletins"
          docTitle={`Bulletins scolaires — ${classeInfo.nom}`}
          docSubtitle="Document officiel de l'établissement"
        />
        <PrintMeta
          items={[
            { label: 'Période', value: periode },
            { label: 'Date', value: formatPrintDate() },
            { label: 'Élèves', value: bulletins.length },
            {
              label: 'Filtre',
              value: mode === 'paid' ? 'Paiement à jour uniquement' : 'Tous les élèves',
            },
          ]}
        />
      </div>

      {bulletins.length === 0 ? (
        <p className="edu-print-empty">Aucun bulletin à imprimer pour ce filtre.</p>
      ) : (
        bulletins.map((b) => (
          <div key={b.eleveId} className="edu-print-bulletin-page">
            <BulletinCard eleve={b} classeInfo={classeInfo} periode={periode} />
          </div>
        ))
      )}
    </PrintDocument>
  );
}

export function printBulletinsBatch() {
  printDocument('printing-bulletins', 400);
}

export async function exportBulletinsPDF(containerSelector, filename) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const root = document.querySelector(containerSelector);
  if (!root) return;

  const pages = root.querySelectorAll('.edu-print-bulletin-page');
  if (!pages.length) return;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');
    let imgHeight = (canvas.height * pageWidth) / canvas.width;
    let imgWidth = pageWidth;
    if (imgHeight > pageHeight) {
      const ratio = pageHeight / imgHeight;
      imgHeight = pageHeight;
      imgWidth = pageWidth * ratio;
    }
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  }

  pdf.save(filename || 'bulletins.pdf');
}
