import React from 'react';
import './DeliveryNoteList.css';

function DeliveryNoteList({ deliveryNotes }) {
  // Fonction pour grouper les bons de livraison par client
  const groupedByClient = deliveryNotes.reduce((acc, note) => {
    if (!acc[note.clientId]) {
      acc[note.clientId] = {
        clientName: note.clientName,
        notes: []
      };
    }
    acc[note.clientId].notes.push(note);
    return acc;
  }, {});

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusBadge = (type) => {
    switch (type) {
      case 'reception':
        return <span className="badge reception">Réception</span>;
      case 'cutting':
        return <span className="badge cutting">Découpe</span>;
      default:
        return <span className="badge">Autre</span>;
    }
  };

  const printDeliveryNote = (note) => {
    // Ici, vous implémenteriez la logique d'impression réelle
    console.log("Impression du bon de livraison:", note.deliveryNoteNumber);
    alert(`Impression du bon de livraison: ${note.deliveryNoteNumber}`);
  };

  return (
    <div className="delivery-note-list">
      {Object.keys(groupedByClient).length === 0 ? (
        <div className="no-notes">
          <p>Aucun bon de livraison trouvé pour la période sélectionnée</p>
        </div>
      ) : (
        Object.entries(groupedByClient).map(([clientId, client]) => (
          <div key={clientId} className="client-notes-group">
            <h3 className="client-name">{client.clientName}</h3>
            
            <table className="notes-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>N° Bon</th>
                  <th>Type</th>
                  <th>Matériau</th>
                  <th>Détails</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {client.notes.sort((a, b) => new Date(b.date) - new Date(a.date)).map(note => (
                  <tr key={note.id} className={`note-row ${note.type}`}>
                    <td>{formatDate(note.date)}</td>
                    <td>{note.deliveryNoteNumber}</td>
                    <td>{getStatusBadge(note.type)}</td>
                    <td>
                      {note.items && note.items[0] ? (
                        <span className="material-info">
                          {note.items[0].material} ({note.items[0].thickness} mm)
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {note.items && note.items.map((item, index) => (
                        <div key={index} className="item-detail">
                          {item.length && item.width ? (
                            <>
                              <span className="dimensions">{item.length}×{item.width} mm</span>
                              <span className="quantity">Qté: {item.quantity}</span>
                            </>
                          ) : (
                            <span className="quantity">Qté: {item.quantity}</span>
                          )}
                          {item.description && <span className="description">{item.description}</span>}
                        </div>
                      ))}
                    </td>
                    <td>
                      <div className="note-actions">
                        <button 
                          className="print-btn" 
                          onClick={() => printDeliveryNote(note)}
                          title="Imprimer"
                        >
                          <i className="fas fa-print"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

export default DeliveryNoteList;