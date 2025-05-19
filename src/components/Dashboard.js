import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Tableau de Bord</h1>
      <div className="dashboard-cards">
        <Link to="/stock" className="dashboard-card">
          <div className="card-icon">
            <i className="fas fa-boxes"></i>
          </div>
          <h2>Gestion des Stocks</h2>
          <p>Gérez vos produits, matériaux et quantités</p>
        </Link>
        
        <Link to="/orders" className="dashboard-card">
          <div className="card-icon">
            <i className="fas fa-shopping-cart"></i>
          </div>
          <h2>Gestion des Commandes</h2>
          <p>Créez et suivez vos commandes et factures</p>
        </Link>

        <Link to="/manifeste" className="dashboard-card">
          <div className="card-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <h2>Gestion des Manifestes</h2>
          <p>Créez et gérez vos documents de manifeste</p>
        </Link>
        <Link to="/installments" className="dashboard-card">
          <div className="card-icon">
            <i className="fas fa-money-check"></i>
          </div>
          <h2>Gestion des Traites</h2>
          <p>Générez et imprimez les traites bancaires</p>
        </Link>
        <Link to="/clients" className="dashboard-card">
          <div className="card-icon">
            <i className="fas fa-users"></i>
          </div>
          <h2>Gestion des Clients</h2>
          <p>Gérez vos clients, contacts et informations</p>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;