import React, { useState } from 'react';

// Correction pour le PDF : utiliser la remise et la tva de l'order si présents
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
  doc.text("YUCCAINFO", 10, 10);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text("Solutions ERP", 10, 15);
  doc.text("Dar Chaabane Fehri, Nabeul, Tunisia", 10, 20);
  doc.text("Tél : +216 23 198 524 / +216 97 131 795", 10, 25);
  doc.text("MF : 19144189/N/A/000", 10, 30);
  doc.text("Email : contact@yuccainfo.com.tn", 10, 35);
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
            `Nom Client : ${client?.firstName || ''} ${client?.lastName || ''}\n` +
            `Adresse : ${client?.address || '-'}\n` +
            `M.F : ${client?.fiscalMatricule || '-'}\n` +
            `Tél : ${client?.phone || '-'}`,
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
      'P.U. HT\n( )', 'REMISE (%)',
      'TOTAL P. HT\n( )', 'TVA', 'TOTAL P. TTC\n( )'
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

  // Correction pour le PDF : utiliser la remise et la tva de l'order si présents
  const remise = order.remise !== undefined ? order.remise : 0;
  const tva = order.tva !== undefined ? order.tva : 19;
  const totalHTPDF = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalRemisePDF = totalHTPDF * (remise / 100);
  const totalHTRemisePDF = totalHTPDF - totalRemisePDF;
  const totalTVAPDF = totalHTRemisePDF * (tva / 100);
  const totalTTCPDF = totalHTRemisePDF + totalTVAPDF;

  autoTable(doc, {
    startY: y,
    body: [
      ['Total HT', `${totalHTPDF.toFixed(3)} DT`],
      ['Remise (%)', `${remise}%`],
      ['Total HT après remise', `${totalHTRemisePDF.toFixed(3)} DT`],
      ['TVA', `${tva}%`],
      ['Total TVA', `${totalTVAPDF.toFixed(3)} DT`],
      [{ content: 'NET A PAYER', styles: { fontStyle: 'bold' } }, `${totalTTCPDF.toFixed(3)} DT`]
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

function InvoiceGenerator({ order, editable = false, onEdit }) {
  const [editMode, setEditMode] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);
  const client = localOrder.client || localOrder.clientData || {};

  // Gestion de la modification des infos client
  const handleClientChange = (field, value) => {
    const updatedClient = { ...client, [field]: value };
    setLocalOrder({ ...localOrder, client: updatedClient });
    if (onEdit) onEdit({ ...localOrder, client: updatedClient });
  };

  // Gestion de la modification des articles
  const handleItemChange = (idx, field, value) => {
    const updatedItems = localOrder.items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setLocalOrder({ ...localOrder, items: updatedItems });
    if (onEdit) onEdit({ ...localOrder, items: updatedItems });
  };

  // Ajout de la gestion de la TVA et de la remise
  const [tva, setTva] = useState(localOrder.tva !== undefined ? localOrder.tva : 19);
  const [remise, setRemise] = useState(localOrder.remise !== undefined ? localOrder.remise : 0);

  // Calculs avec TVA et remise modifiables
  const totalHT = localOrder.items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
  const totalRemise = localOrder.remise !== undefined ? totalHT * (localOrder.remise / 100) : totalHT * (remise / 100);
  const totalHTRemise = totalHT - totalRemise;
  const totalTVA = localOrder.tva !== undefined ? totalHTRemise * (localOrder.tva / 100) : totalHTRemise * (tva / 100);
  const totalTTC = totalHTRemise + totalTVA;

  // Rendu principal
  return (
    <div className="invoice-preview" style={{ background: '#fff', color: '#222', maxWidth: 800, margin: '0 auto', padding: 32, fontFamily: 'Arial, sans-serif', border: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>YUCCAINFO</h2>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Solutions ERP</div>
          <div style={{ fontSize: 12 }}>Dar Chaabane Fehri, Nabeul, Tunisia</div>
          <div style={{ fontSize: 12 }}>Tél : +216 23 198 524 / +216 97 131 795</div>
          <div style={{ fontSize: 12 }}>MF : 19144189/N/A/000</div>
          <div style={{ fontSize: 12 }}>Email : contact@yuccainfo.com.tn</div>
          <div style={{ fontSize: 12 }}>Site Web : www.RMETALASER.tn</div>
        </div>
        <img src="/images/logo.jpg" alt="Logo" style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
      </div>
      <h2 style={{ textAlign: 'center', margin: '32px 0 16px', color: '#222' }}>Facture</h2>
      {/* Tableau d'informations principales */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 14 }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: 6, fontWeight: 'bold', width: 160 }}>N° Facture</td>
            <td style={{ border: '1px solid #ccc', padding: 6 }}>{localOrder.id?.slice(0, 8) || '1'}</td>
            <td style={{ border: '1px solid #ccc', padding: 6, fontWeight: 'bold', width: 160 }}>Date</td>
            <td style={{ border: '1px solid #ccc', padding: 6 }}>{localOrder.date ? new Date(localOrder.date).toLocaleDateString('fr-TN') : '-'}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: 6, fontWeight: 'bold' }}>Code client</td>
            <td style={{ border: '1px solid #ccc', padding: 6 }}>{client.id || 'XXX'}</td>
            <td style={{ border: '1px solid #ccc', padding: 6, fontWeight: 'bold' }}>Nom Client</td>
            <td style={{ border: '1px solid #ccc', padding: 6 }}>
              {editMode ? (
                <input value={client.firstName || ''} onChange={e => handleClientChange('firstName', e.target.value)} style={{width: '45%'}} />
              ) : client.firstName || ''} {editMode ? (
                <input value={client.lastName || ''} onChange={e => handleClientChange('lastName', e.target.value)} style={{width: '45%'}} />
              ) : client.lastName || ''}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: 6, fontWeight: 'bold' }}>Adresse</td>
            <td style={{ border: '1px solid #ccc', padding: 6 }}>
              {editMode ? (
                <input value={client.address || ''} onChange={e => handleClientChange('address', e.target.value)} style={{width: '90%'}} />
              ) : client.address || '-'}
            </td>
            <td style={{ border: '1px solid #ccc', padding: 6, fontWeight: 'bold' }}>M.F</td>
            <td style={{ border: '1px solid #ccc', padding: 6 }}>
              {editMode ? (
                <input value={client.fiscalMatricule || ''} onChange={e => handleClientChange('fiscalMatricule', e.target.value)} style={{width: '90%'}} />
              ) : client.fiscalMatricule || '-'}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: 6, fontWeight: 'bold' }}>Tél</td>
            <td style={{ border: '1px solid #ccc', padding: 6 }}>
              {editMode ? (
                <input value={client.phone || ''} onChange={e => handleClientChange('phone', e.target.value)} style={{width: '90%'}} />
              ) : client.phone || '-'}
            </td>
            <td style={{ border: '1px solid #ccc', padding: 6 }}></td>
            <td style={{ border: '1px solid #ccc', padding: 6 }}></td>
          </tr>
        </tbody>
      </table>
      {/* Tableau des articles */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#f0f0f0', color: '#222' }}>
            <th style={{ border: '1px solid #ccc', padding: 6 }}>CODE P.</th>
            <th style={{ border: '1px solid #ccc', padding: 6 }}>DESIGNATION</th>
            <th style={{ border: '1px solid #ccc', padding: 6 }}>QTE</th>
            <th style={{ border: '1px solid #ccc', padding: 6 }}>P.U. HT ( )</th>
            <th style={{ border: '1px solid #ccc', padding: 6 }}>REMISE (%)</th>
            <th style={{ border: '1px solid #ccc', padding: 6 }}>TOTAL P. HT ( )</th>
            <th style={{ border: '1px solid #ccc', padding: 6 }}>TVA</th>
            <th style={{ border: '1px solid #ccc', padding: 6 }}>TOTAL P. TTC ( )</th>
          </tr>
        </thead>
        <tbody>
          {localOrder.items && localOrder.items.map((item, idx) => {
            const price = typeof item.price === 'number' ? item.price : 0;
            const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
            const totalHT = price * quantity;
            const totalTTC = totalHT * 1.19;
            return (
              <tr key={idx}>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>{item.code || '---'}</td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>{item.productName || 'Article'}</td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>
                  {editMode ? (
                    <input type="number" value={quantity} min={1} style={{width: 60}}
                      onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)} />
                  ) : quantity}
                </td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>
                  {editMode ? (
                    <input type="number" value={price} min={0} step={0.001} style={{width: 80}}
                      onChange={e => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)} />
                  ) : price.toFixed(3)}
                </td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>0%</td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>{(price * quantity).toFixed(3)}</td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>19%</td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>{totalTTC.toFixed(3)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* Totaux */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 32, marginBottom: 24 }}>
        <table style={{ minWidth: 220, fontSize: 13 }}>
          <tbody>
            <tr>
              <td>Total HT</td>
              <td style={{ textAlign: 'right' }}>{totalHT.toFixed(3)} DT</td>
            </tr>
            <tr>
              <td>Remise (%)</td>
              <td style={{ textAlign: 'right' }}>
                {editMode ? (
                  <input type="number" min={0} max={100} value={remise} style={{width: 60}}
                    onChange={e => { setRemise(Number(e.target.value)); if (onEdit) onEdit({ ...localOrder, remise: Number(e.target.value) }); }}
                  />
                ) : `${localOrder.remise !== undefined ? localOrder.remise : remise}%`}
              </td>
            </tr>
            <tr>
              <td>Total HT après remise</td>
              <td style={{ textAlign: 'right' }}>{totalHTRemise.toFixed(3)} DT</td>
            </tr>
            <tr>
              <td>TVA (%)</td>
              <td style={{ textAlign: 'right' }}>
                {editMode ? (
                  <input type="number" min={0} max={100} value={tva} style={{width: 60}}
                    onChange={e => { setTva(Number(e.target.value)); if (onEdit) onEdit({ ...localOrder, tva: Number(e.target.value) }); }}
                  />
                ) : `${localOrder.tva !== undefined ? localOrder.tva : tva}%`}
              </td>
            </tr>
            <tr>
              <td>Total TVA</td>
              <td style={{ textAlign: 'right' }}>{totalTVA.toFixed(3)} DT</td>
            </tr>
            <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
              <td>NET A PAYER</td>
              <td style={{ textAlign: 'right' }}>{totalTTC.toFixed(3)} DT</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        <div style={{ fontSize: 13 }}>
          Arrêtée la présente facture à la somme de :<br />
          # .............................................................. DT #
        </div>
        <div style={{ textAlign: 'center', minWidth: 180 }}>
          <div style={{ border: '1px solid #ccc', minHeight: 40, marginBottom: 8, padding: 8 }}>
            Cachet et Signature
          </div>
          <div style={{ fontWeight: 'bold', marginTop: 16 }}>Signature du client</div>
        </div>
      </div>
      {/* Bouton pour activer/désactiver le mode édition */}
      {editable && (
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button className="edit-invoice-btn" onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Terminer la modification' : 'Modifier la facture'}
          </button>
        </div>
      )}
    </div>
  );
}

export default InvoiceGenerator;