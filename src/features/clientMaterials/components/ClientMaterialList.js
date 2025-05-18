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
        <div className="materials-grid">
          {materials.map(material => (
            <ClientMaterialCard key={material.id} material={material} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientMaterialList;