import React, { useState, useContext } from 'react';
import { InstallmentContext } from '../contexts/InstallmentContext';
import InstallmentForm from './InstallmentForm';
import InstallmentsPrinter from './InstallmentsPrinter';
import './InstallmentManagement.css';

const InstallmentManagement = () => {
  const { installments } = useContext(InstallmentContext);
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'view', 'print'
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  return (
    <div className="installment-management">
      <div className="installment-header">
        <h1>Gestion des Traites</h1>
      </div>
      
      {/* Navigation des onglets */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <i className="fas fa-plus-circle"></i> Créer des Traites
        </button>
        <button
          className={`tab-button ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          <i className="fas fa-list-alt"></i> Voir les Traites
        </button>
        <button
          className={`tab-button ${activeTab === 'print' ? 'active' : ''}`}
          onClick={() => setActiveTab('print')}
        >
          <i className="fas fa-print"></i> Imprimer les Traites
        </button>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="tab-content">
        <div className={`tab-panel ${activeTab === 'create' ? 'active' : ''}`}>
          {activeTab === 'create' && <InstallmentForm />}
        </div>

        <div className={`tab-panel ${activeTab === 'view' ? 'active' : ''}`}>
          {activeTab === 'view' && (
            <>
              <h2 className="panel-title">Traites Existantes</h2>
              {installments.length === 0 ? (
                <div className="empty-state">
                  <p>Aucune traite n'a été créée.</p>
                  <p>Utilisez l'onglet "Créer des Traites" pour ajouter de nouvelles traites.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="installments-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Numéro de Facture</th>
                        <th>Montant Total</th>
                        <th>Nombre de Traites</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installments.map((installment) => (
                        <tr key={installment.id}>
                          <td>{installment.clientName}</td>
                          <td>{installment.invoiceNumber}</td>
                          <td>{installment.totalAmount} DT</td>
                          <td>{installment.numberOfInstallments}</td>
                          <td>
                            <button 
                              className="action-button"
                              onClick={() => {
                                setSelectedInstallment(installment);
                                setActiveTab('print');
                              }}
                            >
                              <i className="fas fa-print"></i> Imprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className={`tab-panel ${activeTab === 'print' ? 'active' : ''}`}>
          {activeTab === 'print' && <InstallmentsPrinter selectedInstallment={selectedInstallment} />}
        </div>
      </div>
    </div>
  );
};

export default InstallmentManagement;