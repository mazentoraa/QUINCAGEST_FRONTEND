import React, { useContext } from 'react';
import { OrderContext } from '../../contexts/OrderContext';
import { InstallmentContext } from '../../features/installments/contexts/InstallmentContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './InvoiceGenerator.css';

function InvoiceGenerator({ order }) {
  const { findClient } = useContext(OrderContext);
  const { getInstallmentsByOrder } = useContext(InstallmentContext);
  
  const client = findClient(order.clientId);
  const installmentPlan = order.paymentMethod === 'installments' 
    ? getInstallmentsByOrder(order.id) 
    : null;
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-TN');
  };

  const calculateTotal = () => {
    return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Logo et en-tête
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("MetalGest", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Entreprise de métallurgie", 20, 30);
    doc.text("Adresse: Rue de la République, Tunis", 20, 35);
    doc.text("Tél: +216 71 123 456", 20, 40);
    doc.text("Email: contact@metalgest.tn", 20, 45);
    
    // Informations facture
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("FACTURE", 150, 20);
    
    doc.setFontSize(10);
    doc.text(`N°: ${order.id.substring(0, 8)}`, 150, 30);
    doc.text(`Date: ${formatDate(order.date)}`, 150, 35);
    
    // Informations client
    doc.setFontSize(14);
    doc.text("Client:", 20, 60);
    
    doc.setFontSize(10);
    if (client) {
      doc.text(`${client.firstName} ${client.lastName}`, 20, 65);
      doc.text(`Adresse: ${client.address}`, 20, 70);
      doc.text(`Tél: ${client.phone}`, 20, 75);
      if (client.email) {
        doc.text(`Email: ${client.email}`, 20, 80);
      }
    } else {
      doc.text("Client inconnu", 20, 65);
    }
    
    // Tableau des produits
    doc.autoTable({
      startY: 90,
      head: [['Produit', 'Quantité', 'Prix unitaire', 'Total']],
      body: order.items.map(item => [
        item.productName,
        item.quantity,
        `${item.price.toFixed(2)} DT`,
        `${(item.price * item.quantity).toFixed(2)} DT`
      ]),
      foot: [
        ['', '', 'Total:', `${calculateTotal().toFixed(2)} DT`]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [66, 133, 244],
        textColor: 255,
        fontStyle: 'bold'
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      }
    });
    
    // Informations de paiement
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.text("Informations de paiement:", 20, finalY);
    
    doc.setFontSize(10);
    if (order.paymentMethod === 'cash') {
      doc.text("Mode de paiement: Comptant", 20, finalY + 5);
    } else if (order.paymentMethod === 'installments' && installmentPlan) {
      doc.text("Mode de paiement: Traites", 20, finalY + 5);
      doc.text(`Nombre de traites: ${installmentPlan.numberOfInstallments}`, 20, finalY + 10);
      doc.text(`Montant par traite: ${installmentPlan.installmentAmount.toFixed(2)} DT`, 20, finalY + 15);
      
      // Tableau des traites
      doc.autoTable({
        startY: finalY + 25,
        head: [['N°', 'Date d\'échéance', 'Montant']],
        body: installmentPlan.installments.map(inst => [
          inst.number,
          formatDate(inst.dueDate),
          `${inst.amount.toFixed(2)} DT`
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [66, 133, 244],
          textColor: 255,
          fontStyle: 'bold'
        }
      });
    }
    
    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Merci pour votre confiance!", 105, 280, { align: 'center' });
    
    // Sauvegarde du PDF
    doc.save(`facture-${order.id.substring(0, 8)}.pdf`);
  };

  return (
    <div className="invoice-generator">
      <div className="invoice-header">
        <div className="company-info">
          <h2>MetalGest</h2>
          <p>Entreprise de métallurgie</p>
          <p>Rue de la République, Tunis</p>
          <p>Tél: +216 71 123 456</p>
        </div>
        
        <div className="invoice-info">
          <h3>FACTURE</h3>
          <p><strong>N°:</strong> {order.id.substring(0, 8)}</p>
          <p><strong>Date:</strong> {formatDate(order.date)}</p>
        </div>
      </div>
      
      <div className="client-info">
        <h3>Client:</h3>
        {client ? (
          <div>
            <p><strong>Nom:</strong> {client.firstName} {client.lastName}</p>
            <p><strong>Adresse:</strong> {client.address}</p>
            <p><strong>Tél:</strong> {client.phone}</p>
            {client.email && <p><strong>Email:</strong> {client.email}</p>}
          </div>
        ) : (
          <p>Client inconnu</p>
        )}
      </div>
      
      <div className="invoice-items">
        <h3>Détails de la commande:</h3>
        <table className="items-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td>{item.productName}</td>
                <td>{item.quantity}</td>
                <td>{item.price.toFixed(2)} DT</td>
                <td>{(item.price * item.quantity).toFixed(2)} DT</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="total-label">Total:</td>
              <td className="total-value">{calculateTotal().toFixed(2)} DT</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="payment-info">
        <h3>Informations de paiement:</h3>
        {order.paymentMethod === 'cash' ? (
          <p>Mode de paiement: <strong>Comptant</strong></p>
        ) : (
          <>
            <p>Mode de paiement: <strong>Traites</strong></p>
            
            {installmentPlan && (
              <>
                <p>Nombre de traites: <strong>{installmentPlan.numberOfInstallments}</strong></p>
                <p>Montant par traite: <strong>{installmentPlan.installmentAmount.toFixed(2)} DT</strong></p>
                
                <h4>Échéancier:</h4>
                <table className="installments-table">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Date d'échéance</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installmentPlan.installments.map((inst, index) => (
                      <tr key={index}>
                        <td>{inst.number}</td>
                        <td>{formatDate(inst.dueDate)}</td>
                        <td>{inst.amount.toFixed(2)} DT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>
      
      <div className="invoice-actions">
        <button className="print-btn" onClick={generatePDF}>
          <i className="fas fa-print"></i> Imprimer la facture
        </button>
      </div>
    </div>
  );
}

export default InvoiceGenerator;