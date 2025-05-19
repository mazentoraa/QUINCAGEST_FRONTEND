import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  return (
    <nav className="navigation">
      <div className="logo">
        <h1>MetalGest</h1>
      </div>
      <ul className="nav-links">
        <li>
          <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
            Tableau de Bord
          </NavLink>
        </li>
        <li>
          <NavLink to="/stock" className={({ isActive }) => isActive ? "active" : ""}>
            Gestion des Produits
          </NavLink>
        </li>
        <li>
          <NavLink to="/client-materials" className={({ isActive }) => isActive ? "active" : ""}>
            Matières Client
          </NavLink>
        </li>
        <li>
          <NavLink to="/orders" className={({ isActive }) => isActive ? "active" : ""}>
            Gestion des Commandes
          </NavLink>
        </li>
        <li>
          <NavLink to="/manifeste" className={({ isActive }) => isActive ? "active" : ""}>
            Gestion des Manifestes
          </NavLink>
        </li>
        <li>
          <NavLink to="/installments" className={({ isActive }) => isActive ? "active" : ""}>
            Gestion des Traites
          </NavLink>
          <li>
            <NavLink to="/clients" className={({ isActive }) => isActive ? "active" : ""}>
              <i className="fas fa-users"></i>
              <span>Clients</span>
            </NavLink>
          </li>
        </li>
      </ul>
    </nav>
  );
}

export default Navigation;