import React, { useState, useContext } from 'react';
import { ClientMaterialContext } from '../contexts/ClientMaterialContext';
import ClientMaterialForm from './ClientMaterialForm';
import ClientMaterialList from './ClientMaterialList';
import DeliveryNoteList from '../../stock/components/DeliveryNoteList';
import FilterSearch from './FilterSearch';
import './ClientMaterialManagement.css';

function ClientMaterialManagement() {
  const {
    filteredMaterials,
    deliveryNotes,
    clientMaterials,
    generateInventoryReport, // ✅ ajouté ici
  } = useContext(ClientMaterialContext);

  const [activeTab, setActiveTab] = useState('materials');
  const [reportParams, setReportParams] = useState({
    clientId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [inventoryReport, setInventoryReport] = useState(null);

  const clients = [...new Set(clientMaterials.map(material => material.clientId))].map(clientId => {
    const clientData = clientMaterials.find(material => material.clientId === clientId);
    return {
      id: clientId,
      name: clientData ? clientData.clientName : 'Client Inconnu',
    };
  });

  const handleReportParamChange = (e) => {
    const { name, value } = e.target;
    setReportParams({ ...reportParams, [name]: value });
  };

  const generateReport = () => {
    const report = generateInventoryReport(
      reportParams.clientId,
      reportParams.startDate,
      reportParams.endDate
    );
    setInventoryReport(report);
  };

  return (
    <div className="client-material-management">
      <div className="header">
        <h1>Gestion des Matières Premières Client</h1>
        {activeTab === 'materials' && (
          <button
            className="add-material-btn"
            data-bs-toggle="modal"
            data-bs-target="#addClientMaterialModal"
          >
            <i className="fas fa-plus"></i> Réceptionner matière client
          </button>
        )}
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          <i className="fas fa-boxes"></i> Matières premières
        </button>
        <button
          className={`tab-btn ${activeTab === 'delivery-notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivery-notes')}
        >
          <i className="fas fa-clipboard-list"></i> Bons de livraison
        </button>
        <button
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <i className="fas fa-tasks"></i> Inventaire et facturation
        </button>
      </div>

      {activeTab === 'materials' && (
        <>
          <FilterSearch type="client-materials" />
          <div className="stock-stats">
            <div className="stat-box">
              <h3>Total des matières client</h3>
              <span className="stat-number">{filteredMaterials.length}</span>
            </div>
            <div className="stat-box">
              <h3>Stock épuisé</h3>
              <span className="stat-number">
                {filteredMaterials.filter(m => m.remainingQuantity === 0).length}
              </span>
            </div>
          </div>
          <ClientMaterialList materials={filteredMaterials} />
        </>
      )}

      {activeTab === 'delivery-notes' && (
        <>
          <div className="filter-section">
            <div className="filter-box">
              <label htmlFor="clientFilter">Filtrer par client:</label>
              <select
                id="clientFilter"
                onChange={(e) =>
                  handleReportParamChange({
                    target: { name: 'clientId', value: e.target.value },
                  })
                }
              >
                <option value="">Tous les clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="date-filter">
              <div className="date-range">
                <label htmlFor="startDate">Du:</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={reportParams.startDate}
                  onChange={handleReportParamChange}
                />
              </div>

              <div className="date-range">
                <label htmlFor="endDate">Au:</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={reportParams.endDate}
                  onChange={handleReportParamChange}
                />
              </div>

              <button className="filter-btn" onClick={() => setActiveTab('delivery-notes')}>
                <i className="fas fa-filter"></i> Filtrer
              </button>
            </div>
          </div>

          <DeliveryNoteList
            deliveryNotes={deliveryNotes.filter(
              note =>
                (!reportParams.clientId || note.clientId === reportParams.clientId) &&
                new Date(note.date) >= new Date(reportParams.startDate) &&
                new Date(note.date) <= new Date(reportParams.endDate)
            )}
          />
        </>
      )}

      {activeTab === 'inventory' && (
        <div className="inventory-section">
          <div className="report-form">
            <h3>Générer un rapport d'inventaire</h3>
            <div className="form-group">
              <label htmlFor="reportClient">Client:</label>
              <select
                id="reportClient"
                name="clientId"
                value={reportParams.clientId}
                onChange={handleReportParamChange}
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reportStartDate">Date début:</label>
                <input
                  type="date"
                  id="reportStartDate"
                  name="startDate"
                  value={reportParams.startDate}
                  onChange={handleReportParamChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reportEndDate">Date fin:</label>
                <input
                  type="date"
                  id="reportEndDate"
                  name="endDate"
                  value={reportParams.endDate}
                  onChange={handleReportParamChange}
                  required
                />
              </div>
            </div>

            <button
              className="generate-btn"
              onClick={generateReport}
              disabled={!reportParams.clientId}
            >
              <i className="fas fa-file-invoice"></i> Générer le rapport
            </button>
          </div>

          {inventoryReport && (
            <div className="inventory-report">
              <div className="report-header">
                <h3>
                  Rapport d'inventaire -{' '}
                  {clients.find(c => c.id === inventoryReport.client)?.name}
                </h3>
                <p>
                  Période: {new Date(inventoryReport.period.startDate).toLocaleDateString()} au{' '}
                  {new Date(inventoryReport.period.endDate).toLocaleDateString()}
                </p>
                <div className="actions">
                  <button className="print-btn">
                    <i className="fas fa-print"></i> Imprimer
                  </button>
                  <button className="invoice-btn">
                    <i className="fas fa-file-invoice-dollar"></i> Créer une facture
                  </button>
                </div>
              </div>

              <div className="report-section">
                <h4>Matières premières reçues</h4>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Bon de livraison</th>
                      <th>Matériau</th>
                      <th>Dimensions</th>
                      <th>Quantité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryReport.receivedMaterials.map(note =>
                      note.items.map((item, index) => (
                        <tr key={`${note.id}-${index}`}>
                          <td>{new Date(note.date).toLocaleDateString()}</td>
                          <td>{note.deliveryNoteNumber}</td>
                          <td>{item.material}</td>
                          <td>
                            {item.length}×{item.width}×{item.thickness}mm
                          </td>
                          <td>{item.quantity}</td>
                        </tr>
                      ))
                    )}
                    {inventoryReport.receivedMaterials.length === 0 && (
                      <tr>
                        <td colSpan="5" className="no-data">
                          Aucune matière reçue sur cette période
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="report-section">
                <h4>Pièces découpées livrées</h4>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Bon de livraison</th>
                      <th>Description</th>
                      <th>Dimensions</th>
                      <th>Quantité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryReport.deliveryNotes.map(note =>
                      note.items.map((item, index) => (
                        <tr key={`${note.id}-${index}`}>
                          <td>{new Date(note.date).toLocaleDateString()}</td>
                          <td>{note.deliveryNoteNumber}</td>
                          <td>{item.description || '-'}</td>
                          <td>
                            {item.length}×{item.width}×{item.thickness}mm
                          </td>
                          <td>{item.quantity}</td>
                        </tr>
                      ))
                    )}
                    {inventoryReport.deliveryNotes.length === 0 && (
                      <tr>
                        <td colSpan="5" className="no-data">
                          Aucune pièce livrée sur cette période
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="report-section">
                <h4>Matériel restant en stock</h4>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Matériau</th>
                      <th>Épaisseur</th>
                      <th>Quantité initiale</th>
                      <th>Quantité restante</th>
                      <th>Utilisation (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryReport.remainingStock.map(stock => (
                      <tr key={stock.id}>
                        <td>{stock.material}</td>
                        <td>{stock.thickness} mm</td>
                        <td>{stock.initialQuantity}</td>
                        <td>{stock.remainingQuantity}</td>
                        <td>
                          {Math.round(
                            (1 - stock.remainingQuantity / stock.initialQuantity) * 100
                          )}
                          %
                        </td>
                      </tr>
                    ))}
                    {inventoryReport.remainingStock.length === 0 && (
                      <tr>
                        <td colSpan="5" className="no-data">
                          Aucun stock pour ce client
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className="modal fade"
        id="addClientMaterialModal"
        tabIndex="-1"
        aria-labelledby="addClientMaterialModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addClientMaterialModalLabel">
                Réception de matière première client
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <ClientMaterialForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientMaterialManagement;
