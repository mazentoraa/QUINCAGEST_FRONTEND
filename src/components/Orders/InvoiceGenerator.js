import React from 'react';

export async function generatePDF(order, client) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const getBase64FromUrl = async (url) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
    });
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('fr-TN');
  const doc = new jsPDF('p', 'mm', 'a4');

  try {
    const logo = await getBase64FromUrl('/images/logo.jpg');
    doc.addImage(logo, 'JPEG', 150, 8, 45, 25);
  } catch (e) {
    console.warn('Logo non chargé');
  }

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text("RM METALASER", 10, 10);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text("Découpes Métaux", 10, 15);
  doc.text("Rue hedi Khfecha Z l Madagascar 3047 sfax ville", 10, 20);
  doc.text("Tél : +216 20 366 150", 10, 25);
  doc.text("MF : 19144189/N/A/000", 10, 30);
  doc.text("Email : contact@rmmetalaser.tn", 10, 35);
  doc.text("Site Web : www.RMETALASER.tn", 10, 40);

  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text("Facture", 105, 50, { align: 'center' });

  autoTable(doc, {
    startY: 55,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 2 },
    tableLineWidth: 0.3,
    body: [
      [
        { content: 'N° Facture:\n' + order.id.slice(0, 8), styles: { cellWidth: 40 } },
        { content: 'Date:\n' + formatDate(order.date), styles: { cellWidth: 40 } },
        { content: 'Code client:\n' + (client?.id || 'XXX'), styles: { cellWidth: 40 } },
        {
          content:
            'Nom Client : ' + `${client?.firstName} ${client?.lastName}` + '\n' +
            'Adresse : ' + (client?.address || '-') + '\n' +
            'M.F : ' + (client?.fiscalMatricule || '-') + '\n' +
            'Tél : ' + (client?.phone || '-'),
          styles: {
            cellWidth: 75,
            halign: 'left',
            valign: 'top'
          }
        }
      ]
    ]
  });

  const items = order.items.map(item => {
    const price = typeof item.price === 'number' ? item.price : 0;
    const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
    const totalHT = price * quantity;
    const totalTTC = totalHT * 1.19;
    return [
      item.code || '---',
      item.productName || 'Article',
      quantity,
      price.toFixed(3),
      '0%',
      totalHT.toFixed(3),
      '19%',
      totalTTC.toFixed(3)
    ];
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 3,
    head: [[
      'CODE P.', 'DESIGNATION', 'QTE',
      'P.U. HT\n(TND)', 'REMISE (%)',
      'TOTAL P. HT\n(TND)', 'TVA', 'TOTAL P. TTC\n(TND)'
    ]],
    body: items,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: {
      fillColor: [240, 240, 240], // fond gris clair
      textColor: 0,               // noir
      halign: 'center',
      valign: 'middle',
      fontStyle: 'bold'
    }
  });

  const totalHT = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalTVA = totalHT * 0.19;
  const totalTTC = totalHT + totalTVA;
  const y = doc.lastAutoTable.finalY + 5;

  autoTable(doc, {
    startY: y,
    body: [
      [{ content: 'Base' }, 'Taux', 'Montant T.V.A'],
      [`${totalHT.toFixed(3)} DT`, '19%', `${totalTVA.toFixed(3)} DT`]
    ],
    theme: 'grid',
    margin: { left: 10 },
    tableWidth: 90,
    styles: { fontSize: 9 }
  });

  autoTable(doc, {
    startY: y,
    body: [[
      {
        content: 'Cachet et Signature',
        styles: {
          halign: 'center',
          valign: 'middle',
          fontSize: 10,
          minCellHeight: 40
        }
      }
    ]],
    theme: 'grid',
    margin: { left: 100 },
    tableWidth: 50
  });

  autoTable(doc, {
    startY: y,
    body: [
      ['Total HT', `${totalHT.toFixed(3)} DT`],
      ['Remise (%)', '0%'],
      ['Total HT', `${totalHT.toFixed(3)} DT`],
      ['Total TVA', `${totalTVA.toFixed(3)} DT`],
      [{ content: 'NET A PAYER', styles: { fontStyle: 'bold' } }, `${totalTTC.toFixed(3)} DT`]
    ],
    theme: 'grid',
    margin: { left: 155 },
    tableWidth: 45,
    styles: { fontSize: 9 }
  });

  doc.setFontSize(10);
  doc.text(`Arrêtée la présente facture à la somme de :`, 10, y + 50);
  doc.text(`# .............................................................. DT #`, 10, y + 55);
  doc.setFont(undefined, 'bold');
  doc.text("Signature du client", 155, y + 60);

  doc.save(`facture-${order.id.slice(0, 8)}.pdf`);
}

function InvoiceGenerator({ order }) {
  return null;
}

export default InvoiceGenerator;
