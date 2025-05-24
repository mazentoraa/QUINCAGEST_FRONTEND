import React, { useContext } from 'react';
import ClientMaterialCard from './ClientMaterialCard';
import './ClientMaterialList.css';

function ClientMaterialList({ materials }) {
  return (
    <div className="client-material-list">
      {materials.length === 0 ? (
        <div className="no-materials">
          <p>Aucune matière première client n'a été trouvée</p>
          <p>Cliquez sur "Réceptionner matière client" pour ajouter une matière</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nom du client</th>
              <th>ID Client</th>
              <th>N° Bon de livraison</th>
              <th>Date de réception</th>
              <th>Type</th>
              <th>Épaisseur</th>
              <th>Longueur</th>
              <th>Largeur</th>
              <th>Quantité</th>
              {/* ...autres colonnes... */}
            </tr>
          </thead>
          <tbody>
            {materials.map(material => (
              <tr key={material.id}>
                <td>{material.clientName}</td>
                <td>{material.client_id}</td>
                <td>{material.deliveryNote}</td>
                <td>{material.receiptDate ? new Date(material.receiptDate).toLocaleDateString() : ''}</td>
                <td>{material.material}</td>
                <td>{material.thickness}</td>
                <td>{material.length}</td>
                <td>{material.width}</td>
                <td>{material.quantity}</td>
                {/* ...autres colonnes... */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ClientMaterialList;