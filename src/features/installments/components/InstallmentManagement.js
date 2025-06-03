import React, { useState, useContext, useEffect } from 'react';
import { InstallmentContext } from '../contexts/InstallmentContext';
import InstallmentForm from './InstallmentForm';
import InstallmentsPrinter from './InstallmentsPrinter';
import InstallmentDetails from './InstallmentDetails';
import './InstallmentManagement.css';

const InstallmentManagement = () => {
  const { installments, updateInstallment } = useContext(InstallmentContext);
  const [activeTab, setActiveTab] = useState('create');
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bankFilter, setBankFilter] = useState('all');

  const filteredInstallments = installments.filter(installment => {
    const clientName = installment.client_nom || installment.clientName || "";
    const invoiceNumber = installment.numero_commande || installment.invoiceNumber || "";
    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || installment.status === statusFilter;
    const matchesBank = bankFilter === 'all' || installment.bankName === bankFilter;
    return matchesSearch && matchesStatus && matchesBank;
  });

  const handleStatusChange = (installmentId, newStatus) => {
    const installmentToUpdate = installments.find(item => item.id === installmentId);
    if (installmentToUpdate) {
      const updatedInstallment = {
        ...installmentToUpdate,
        status: newStatus
      };
      updateInstallment(updatedInstallment);
    }
  };

  const handleClientClick = (installment) => {
    setSelectedInstallment(installment);
    setShowDetails(true);
  };

  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedInstallment(null);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.tab === 'view') {
        setActiveTab('view');
      }
    };
    window.addEventListener('switchInstallmentTab', handler);
    return () => window.removeEventListener('switchInstallmentTab', handler);
  }, []);

  if (showDetails && selectedInstallment) {
    return (
      <InstallmentDetails
        installment={selectedInstallment}
        onBack={handleBackToList}
        onUpdateInstallment={updateInstallment}
      />
    );
  }

  return (
    <div className="installment-management">
      <div className="installment-header">
        <h1>Gestion des Traites</h1>
      </div>

      <div className="tab-navigation">
        <button className={`tab-button ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
          <i className="fas fa-plus-circle"></i> Créer des Traites
        </button>
        <button className={`tab-button ${activeTab === 'view' ? 'active' : ''}`} onClick={() => setActiveTab('view')}>
          <i className="fas fa-list-alt"></i> Voir les Traites
        </button>
        <button className={`tab-button ${activeTab === 'print' ? 'active' : ''}`} onClick={() => setActiveTab('print')}>
          <i className="fas fa-print"></i> Imprimer les Traites
        </button>
      </div>

      <div className="tab-content">
        <div className={`tab-panel ${activeTab === 'create' ? 'active' : ''}`}>
          {activeTab === 'create' && <InstallmentForm />}
        </div>

        <div className={`tab-panel ${activeTab === 'view' ? 'active' : ''}`}>
          {activeTab === 'view' && (
            <>
              <h2 className="panel-title">Traites Existantes</h2>

              <div className="filter-section">
                <div className="filter-row">
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Rechercher par client ou numéro de facture..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    <i className="fas fa-search search-icon"></i>
                  </div>

                  <div className="status-filter">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="status-select"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="non_paye">Non payé</option>
                      <option value="paye">Payé</option>
                    </select>
                  </div>

                  <div className="bank-filter">
                    <select
                      value={bankFilter}
                      onChange={(e) => setBankFilter(e.target.value)}
                      className="bank-select"
                    >
                      <option value="all">Toutes les banques</option>
                      <option value="BCT">Banque Centrale de Tunisie (BCT)</option>
                      <option value="STB">Société Tunisienne de Banque (STB)</option>
                      <option value="BNA">Banque Nationale Agricole (BNA)</option>
                      <option value="BIAT">Banque Internationale Arabe de Tunisie (BIAT)</option>
                      <option value="Attijari_Bank">Attijari Bank</option>
                      <option value="BT">Banque de Tunisie (BT)</option>
                      <option value="UIB">Union Internationale de Banques (UIB)</option>
                      <option value="Amen Bank">Amen Bank</option>
                      <option value="ATB">Arab Tunisian Bank (ATB)</option>
                      <option value="BTK">Banque Tuniso-Koweitienne (BTK)</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredInstallments.length === 0 ? (
                <div className="empty-state">
                  {installments.length === 0 ? (
                    <>
                      <p>Aucune traite n'a été créée.</p>
                      <p>Utilisez l'onglet "Créer des Traites" pour ajouter de nouvelles traites.</p>
                    </>
                  ) : (
                    <p>Aucune traite ne correspond aux critères de recherche.</p>
                  )}
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
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInstallments.map((installment) => (
                        <tr key={installment.id}>
                          <td>
                            <button
                              className="client-name-button"
                              onClick={() => handleClientClick(installment)}
                            >
                              {installment.client_nom || installment.clientName || 'N/A'}
                            </button>
                          </td>
                          <td>{installment.numero_commande || installment.invoiceNumber || 'N/A'}</td>
                          <td>
                            {installment.montant_total
                              ? parseFloat(installment.montant_total).toFixed(3)
                              : 'N/A'}
                          </td>
                          <td>{installment.nombre_traite || installment.numberOfInstallments || 'N/A'}</td>
                          <td>
                            <select
                              value={installment.status || 'non_paye'}
                              onChange={(e) => handleStatusChange(installment.id, e.target.value)}
                              className={`status-select-table ${installment.status === 'paye' ? 'paid' : 'unpaid'}`}
                            >
                              <option value="non_paye">Non payé</option>
                              <option value="paye">Payé</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className="action-button print-button"
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
