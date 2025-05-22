import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Fonction pour générer un PDF de facture
export const generateInvoicePDF = (order, client, products) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  // En-tête
  doc.setFontSize(20);
  doc.text('FACTURE', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Facture N°: ${order.invoiceNumber}`, 15, 40);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 45);
  
  // Informations client
  doc.setFontSize(14);
  doc.text('Informations Client', 15, 60);
  doc.setFontSize(12);
  doc.text(`Nom: ${client.name}`, 15, 70);
  doc.text(`Adresse: ${client.address}`, 15, 75);
  doc.text(`Tel: ${client.phone}`, 15, 80);
  
  // Informations société (à remplacer par vos infos réelles)
  doc.setFontSize(14);
  doc.text('Informations Société', 130, 60);
  doc.setFontSize(12);
  doc.text('Votre Société', 130, 70);
  doc.text('123 Rue Exemple, Tunis', 130, 75);
  doc.text('Tel: +216 xx xxx xxx', 130, 80);
  doc.text('MF: xxxxxxxxx', 130, 85);
  
  // Tableau des produits
  const tableColumn = ["Produit", "Quantité", "Prix unitaire", "Total"];
  const tableRows = [];
  
  products.forEach(product => {
    const productData = [
      product.name,
      product.quantity,
      `${product.unitPrice.toFixed(2)} DT`,
      `${(product.quantity * product.unitPrice).toFixed(2)} DT`
    ];
    tableRows.push(productData);
  });
  
  // Calculer le total
  const total = products.reduce((sum, product) => sum + (product.quantity * product.unitPrice), 0);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 100,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 80 },
      3: { halign: 'right' }
    },
    headStyles: { fillColor: [66, 66, 66] }
  });
  
  const finalY = doc.lastAutoTable.finalY || 150;
  
  // Résumé de la facture
  doc.text(`Sous-total: ${total.toFixed(2)} DT`, 140, finalY + 20, { align: 'right' });
  doc.text(`TVA (19%): ${(total * 0.19).toFixed(2)} DT`, 140, finalY + 25, { align: 'right' });
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(`Total TTC: ${(total * 1.19).toFixed(2)} DT`, 140, finalY + 35, { align: 'right' });
  doc.setFont(undefined, 'normal');
  
  // Mode de paiement
  doc.setFontSize(12);
  doc.text(`Mode de paiement: ${order.paymentMethod}`, 15, finalY + 20);
  
  if (order.paymentMethod === 'traite') {
    doc.text(`Nombre de traites: ${order.installments}`, 15, finalY + 25);
  }
  
  // Pied de page
  doc.setFontSize(10);
  doc.text('Merci pour votre confiance!', 105, 280, { align: 'center' });
  
  // Sauvegarder le PDF
  doc.save(`facture_${order.invoiceNumber}.pdf`);
  
  return true;
};

// Fonction pour générer un PDF de traites bancaires tunisiennes
export const generateInstallmentsPDF = async (installmentData, printAll = false) => {
  const doc = new jsPDF();
  
  // Paramètres pour une traite
  const drawInstallment = (data, installmentDetail, pageNum) => {
    doc.setFontSize(16);
    doc.text('LETTRE DE CHANGE', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    // Cadre principal
    doc.rect(10, 30, 190, 100);
    
    // Informations de base
    doc.text(`À ${installmentDetail.dueDate}`, 15, 40);
    doc.text(`PAYEZ CONTRE CETTE LETTRE DE CHANGE À L'ORDRE DE:`, 15, 50);
    doc.text(`Votre Société`, 15, 60);
    
    // Montant en chiffres
    doc.rect(150, 40, 45, 20);
    doc.text(`${parseFloat(installmentDetail.amount).toFixed(2)} DT`, 160, 55);
    
    // Infos tireur
    doc.text(`TIREUR:`, 15, 75);
    doc.text(`${data.clientName}`, 15, 80);
    doc.text(`${data.clientAddress || 'N/A'}`, 15, 85);
    doc.text(`CIN/RNE: ${data.clientId || 'N/A'}`, 15, 90);
    
    // Infos banque
    doc.text(`DOMICILIATION:`, 15, 105);
    doc.text(`Banque: __________________`, 15, 110);
    doc.text(`RIB: _______________________`, 15, 115);
    
    // Cadre signature
    doc.rect(140, 75, 55, 45);
    doc.text('SIGNATURE', 167.5, 80, { align: 'center' });
    
    // Référence facture
    doc.setFontSize(10);
    doc.text(`Réf. Facture: ${data.invoiceNumber}`, 15, 135);
    doc.text(`Traite ${installmentDetail.index}/${data.numberOfInstallments}`, 170, 135);
    
    // Montant en lettres
    doc.setFontSize(11);
    doc.text(`Montant en lettres: ${convertNumberToWords(parseFloat(installmentDetail.amount))} dinars tunisiens`, 15, 145);
    
    // Si ce n'est pas la dernière page, ajouter une nouvelle page
    if (pageNum < data.installmentDetails.length && printAll) {
      doc.addPage();
    }
  };
  
  // Si on imprime toutes les traites
  if (printAll) {
    installmentData.installmentDetails.forEach((detail, index) => {
      drawInstallment(installmentData, detail, index + 1);
    });
  } else {
    // Imprimer seulement la première traite
    drawInstallment(installmentData, installmentData.installmentDetails[0], 1);
  }
  
  // Sauvegarder le PDF
  doc.save(`traites_${installmentData.invoiceNumber}.pdf`);
  
  return true;
};

// Fonction pour convertir un nombre en texte (français)
const convertNumberToWords = (number) => {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
  // Fonction pour convertir un nombre inférieur à 1000 en texte
  const convertLessThanOneThousand = (num) => {
    if (num === 0) return '';
    
    let result = '';
    
    // Centaines
    if (num >= 100) {
      const hundreds = Math.floor(num / 100);
      result += hundreds === 1 ? 'cent ' : units[hundreds] + ' cent ';
      num %= 100;
    }
    
    // Dizaines et unités
    if (num >= 10) {
      if (num < 20) {
        // 10-19
        result += teens[num - 10] + ' ';
        return result;
      } else {
        const ten = Math.floor(num / 10);
        const unit = num % 10;
        
        if (ten === 7 || ten === 9) {
          // 70-79 ou 90-99
          result += tens[ten - 1] + '-';
          if (unit === 1) {
            result += 'et-' + teens[unit] + ' ';
          } else {
            result += teens[unit] + ' ';
          }
          return result;
        } else {
          // 20-69 ou 80-89
          result += tens[ten];
          if (unit === 1 && ten < 8) {
            result += '-et-un ';
          } else if (unit > 0) {
            result += '-' + units[unit] + ' ';
          } else {
            result += ' ';
          }
          return result;
        }
      }
    }
    
    // Unités
    if (num > 0) {
      result += units[num] + ' ';
    }
    
    return result;
  };
  
  // Gestion des nombres décimaux
  const wholeNumber = Math.floor(number);
  const decimal = Math.round((number - wholeNumber) * 100);
  
  let result = '';
  
  if (wholeNumber === 0) {
    result = 'zéro';
  } else if (wholeNumber === 1) {
    result = 'un';
  } else {
    // Gestion des milliers
    if (wholeNumber < 1000) {
      result = convertLessThanOneThousand(wholeNumber);
    } else if (wholeNumber < 1000000) {
      // Milliers
      const thousands = Math.floor(wholeNumber / 1000);
      const remainder = wholeNumber % 1000;
      
      if (thousands === 1) {
        result = 'mille ';
      } else {
        result = convertLessThanOneThousand(thousands) + 'mille ';
      }
      
      if (remainder > 0) {
        result += convertLessThanOneThousand(remainder);
      }
    } else {
      // Millions (pour les montants plus grands)
      const millions = Math.floor(wholeNumber / 1000000);
      const remainder = wholeNumber % 1000000;
      
      if (millions === 1) {
        result = 'un million ';
      } else {
        result = convertLessThanOneThousand(millions) + 'millions ';
      }
      
      if (remainder > 0) {
        if (remainder < 1000) {
          result += convertLessThanOneThousand(remainder);
        } else {
          result += 'et ' + convertLessThanOneThousand(Math.floor(remainder / 1000)) + 'mille ';
          if (remainder % 1000 > 0) {
            result += convertLessThanOneThousand(remainder % 1000);
          }
        }
      }
    }
  }
  
  // Ajouter les centimes si nécessaire
  if (decimal > 0) {
    result += 'et ' + (decimal === 1 ? 'un centime' : decimal + ' centimes');
  }
  
  return result.trim();
};

// Fonction pour générer un PDF d'une seule facture
export const generateSingleInvoicePDF = (invoice) => {
  const doc = new jsPDF('l', 'mm', 'a4');

  // En-tête
  doc.setFontSize(22);
  doc.text('FACTURE', 105, 20, { align: 'center' });
  
  // Logo (à remplacer par votre logo)
  // doc.addImage(logoDataUrl, 'PNG', 15, 15, 30, 30);
  
  // Rectangle décoratif
  doc.setFillColor(220, 220, 220);
  doc.rect(10, 40, 190, 10, 'F');
  
  // Informations facture
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Facture N°:', 15, 47);
  doc.text('Date:', 120, 47);
  doc.setFont(undefined, 'normal');
  doc.text(invoice.invoiceNumber, 50, 47);
  doc.text(new Date(invoice.date).toLocaleDateString('fr-TN'), 140, 47);
  
  // Informations client
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('CLIENT', 15, 65);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(12);
  doc.text(`Nom: ${invoice.client.name}`, 15, 75);
  doc.text(`Adresse: ${invoice.client.address}`, 15, 80);
  doc.text(`Tel: ${invoice.client.phone}`, 15, 85);
  if (invoice.client.id) {
    doc.text(`CIN/MF: ${invoice.client.id}`, 15, 90);
  }
  
  // Informations société
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('FOURNISSEUR', 130, 65);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(12);
  doc.text('Votre Société', 130, 75);
  doc.text('123 Rue Exemple, Tunis', 130, 80);
  doc.text('Tel: +216 xx xxx xxx', 130, 85);
  doc.text('MF: xxxxxxxxx', 130, 90);
  
  // Tableau des produits
  const tableColumn = ["Produit", "Type", "Épaisseur", "Quantité", "Prix unitaire", "Total"];
  const tableRows = [];
  
  invoice.items.forEach(item => {
    const productData = [
      item.name,
      item.materialType || '-',
      item.thickness ? `${item.thickness} mm` : '-',
      item.quantity,
      `${item.unitPrice.toFixed(3)} DT`,
      `${(item.quantity * item.unitPrice).toFixed(3)} DT`
    ];
    tableRows.push(productData);
  });
  
  autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 100,
    theme: 'striped',
    styles: { 
      fontSize: 10, 
      cellPadding: 3,
      lineColor: [80, 80, 80],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 50 },
      4: { halign: 'right' },
      5: { halign: 'right' }
    },
    headStyles: { 
      fillColor: [70, 70, 70],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }
  });
  
  const finalY = doc.lastAutoTable.finalY || 150;
  
  // Résumé de la facture
  const totals = {
    subtotal: invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
    tax: invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * 0.19,
    total: invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * 1.19
  };
  
  // Rectangle pour les totaux
  doc.setFillColor(240, 240, 240);
  doc.rect(110, finalY + 10, 90, 40, 'F');
  doc.setDrawColor(180, 180, 180);
  doc.rect(110, finalY + 10, 90, 40);
  
  doc.setFontSize(12);
  doc.text('Sous-total:', 115, finalY + 20);
  doc.text('TVA (19%):', 115, finalY + 30);
  doc.setFont(undefined, 'bold');
  doc.text('Total TTC:', 115, finalY + 40);
  
  doc.setFont(undefined, 'normal');
  doc.text(`${totals.subtotal.toFixed(3)} DT`, 195, finalY + 20, { align: 'right' });
  doc.text(`${totals.tax.toFixed(3)} DT`, 195, finalY + 30, { align: 'right' });
  doc.setFont(undefined, 'bold');
  doc.text(`${totals.total.toFixed(3)} DT`, 195, finalY + 40, { align: 'right' });
  
  // Mode de paiement
  doc.setFont(undefined, 'normal');
  doc.setFontSize(12);
  doc.text(`Mode de paiement: ${invoice.paymentMethod === 'traite' ? 'Par traites' : 'Comptant'}`, 15, finalY + 20);
  
  if (invoice.paymentMethod === 'traite') {
    doc.text(`Nombre de traites: ${invoice.installmentsCount}`, 15, finalY + 30);
    doc.text(`Première échéance: ${new Date(invoice.firstDueDate).toLocaleDateString('fr-TN')}`, 15, finalY + 40);
  }
  
  // Total en lettres
  doc.setFontSize(10);
  doc.text(`Arrêtée la présente facture à la somme de: ${convertNumberToWords(totals.total)} dinars tunisiens`, 15, finalY + 60);
  
  // Signature
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Signature et cachet', 160, finalY + 75, { align: 'center' });
  
  // Rectangle signature
  doc.rect(130, finalY + 80, 60, 30);
  
  // Pied de page
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Merci pour votre confiance!', 105, 280, { align: 'center' });
  
  // Sauvegarder le PDF
  doc.save(`facture_${invoice.invoiceNumber}.pdf`);
  
  return true;
};

// Fonction pour générer un document PDF
export const generateDocument = async (documentType, documentData) => {
  switch (documentType) {
    case 'invoice':
      return generateSingleInvoicePDF(documentData);
    case 'installments':
      return generateInstallmentsPDF(documentData, true);
    case 'singleInstallment':
      return generateInstallmentsPDF(documentData, false);
    default:
      throw new Error('Type de document non pris en charge');
  }
};