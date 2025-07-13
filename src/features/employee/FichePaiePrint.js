import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EmployeeService from './EmployeeService';
import moment from 'moment';
import './FichePaiePrint.css';

const FichePaiePrint = () => {
  const { id } = useParams();
  const [fiche, setFiche] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await EmployeeService.getFichePaieById(id);
        setFiche(res.data || res);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };
    fetchData();
  }, [id]);

  if (!fiche) return <div>Chargement...</div>;

  const { employee } = fiche;

  return (
    <div className="fiche-paie-print">
      <div id="printable">
        <div className="entete">
          <div className="logo-section">
            <img src="https://i.postimg.cc/7hhjQYRS/logo.jpg" alt="Logo" />
            <div className="entreprise-infos">
              <strong>RM METALASER</strong><br />
              Découpes Métaux<br />
              Rue Hédi Khfech Z, Madagascar 3047 - Sfax<br />
              IF: 191 1419B/A/M/000<br />
              Tél : +216 20 366 150<br />
              Email: contact@rmmetalaser.tn<br />
              Site: www.rmmetalaser.tn
            </div>
          </div>

          <div className="titre-section">
            <h2>BULLETIN DE PAIE</h2>
          </div>

          <div className="periode-section">
            <div><strong>Mois:</strong> {moment().month(fiche.mois - 1).format('MMMM')}</div>
            <div><strong>Année:</strong> {fiche.annee}</div>
          </div>
        </div>

        <div className="admin-infos">
          <div><strong>Nature contrat:</strong> {employee?.nature_contrat}</div>
          <div><strong>Date embauche:</strong> {moment(employee?.date_embauche).format("DD/MM/YYYY")}</div>
          <div><strong>Catégorie:</strong> {employee?.categorie}</div>
          <div><strong>Emploi occupé:</strong> {employee?.poste}</div>
          <div><strong>Département:</strong> {employee?.departement}</div>
          <div><strong>N° CNSS:</strong> {employee?.cnss}</div>
          <div><strong>CIN:</strong> {employee?.cin}</div>
          <div><strong>Situation familiale:</strong> {employee?.situation_familiale}</div>
          <div><strong>Nb enfant:</strong> {employee?.nbr_enfant}</div>
          <div><strong>Enfants à charge:</strong> {employee?.enfants_charge}</div>
          <div><strong>Maladie (M):</strong> {fiche.conge_maladie_m}</div>
          <div><strong>Maladie (A):</strong> {fiche.conge_maladie_a}</div>
        </div>

        <div className="conges-banque">
          <div className="conges">
            <h4>Congés</h4>
            <p>Congé Période: {fiche.conge_periode}</p>
            <p>Congé Acquis: {fiche.conge_acquis}</p>
            <p>Pris Mois: {fiche.conge_pris}</p>
            <p>Reste à Prendre: {fiche.conge_restant}</p>
            <p>Congé Spéciaux: {fiche.conge_speciaux}</p>
          </div>

          <div className="banque">
            <h4>Banque</h4>
            <p>RIB: {fiche.rib}</p>
            <p>Nom banque: {fiche.banque}</p>
          </div>

          <div className="employee-side">
            <div className="carte-bleue">
              <p><strong>Matricule:</strong> {employee?.matricule}</p>
              <p><strong>Nom:</strong> {employee?.nom} {employee?.prenom}</p>
              <p><strong>Adresse:</strong> {employee?.adresse}</p>
            </div>
          </div>
        </div>

        <table className="designation-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Salaire de base</td><td>{fiche.salaire_base} </td></tr>
            <tr><td>Prime ancienneté</td><td>{fiche.prime_anciennete}</td></tr>
            <tr><td>Indemnité présence</td><td>{fiche.indemnite_presence} </td></tr>
            <tr><td>Indemnité transport</td><td>{fiche.indemnite_transport} </td></tr>
            <tr><td>Prime langue</td><td>{fiche.prime_langue} </td></tr>
            <tr><td>Prime Ramadan</td><td>{fiche.prime_ramadan} </td></tr>
            <tr><td>Prime télétravail</td><td>{fiche.prime_teletravail} </td></tr>
            <tr><td>Avantage assurance</td><td>{fiche.avantage_assurance} </td></tr>
            <tr className="highlight"><td>Salaire Brut</td><td>{fiche.salaire_brut} </td></tr>
            <tr><td>CNSS salarié</td><td>{fiche.cnss_salarie} </td></tr>
            <tr><td>IRPP</td><td>{fiche.irpp} </td></tr>
            <tr><td>CSS</td><td>{fiche.css} </td></tr>
            <tr className="highlight"><td>Déductions</td><td>{fiche.deduction_totale} </td></tr>
            <tr className="highlight"><td>Net à payer</td><td>{fiche.net_a_payer} </td></tr>
          </tbody>
        </table>
      </div>
      <div className="no-print">
        <button onClick={() => window.print()}>🖨️ Imprimer</button>
      </div>
    </div>
  );
};

export default FichePaiePrint;
