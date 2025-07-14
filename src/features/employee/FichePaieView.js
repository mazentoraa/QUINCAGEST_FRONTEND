import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EmployeeService from './EmployeeService';
import { Spin, Typography } from 'antd';
import moment from 'moment';
import './FichePaieView.css';

const { Title, Text } = Typography;

const FichePaieView = () => {
  const { id } = useParams();
  const [fiche, setFiche] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFiche = async () => {
      try {
        const res = await EmployeeService.getFichePaieById(id);
        setFiche(res.data || res);
      } catch (error) {
        console.error("Erreur chargement fiche", error);
      } finally {
        setLoading(false);
      }
    };
    loadFiche();
  }, [id]);

  if (loading) return <Spin tip="Chargement..." style={{ margin: 50 }} />;
  if (!fiche) return <div>Fiche introuvable</div>;

  const { employee } = fiche;

  return (
    <div className="fiche-paie-container">
      <div className="fiche-card">
        {/* Header Section */}
        <div className="fiche-header">
          <div className="header-left">
            <img src="https://i.postimg.cc/7hhjQYRS/logo.jpg" alt="RM METALASER Logo" />
            <div className="company-info">
              <p>RM METALASER</p>
              <p>Découpes Métaux</p>
              <p>Rue hedi khfecha Z Madagascar 3047 - Sfax ville</p>
              <p>IF: 191 1419B/A/M/000</p>
              <p>Tél. : +216 20 366 150</p>
              <p>Email: contact@rmmetalaser.tn</p>
              <p>Site Web: www.rmmetalaser.tn</p>
            </div>
          </div>

          <div className="header-center">
            <Title level={2}>BULLETIN DE PAIE</Title>
          </div>

          <div className="header-right">
            <p><strong>Période :</strong></p>
            <p>{moment().month(fiche.mois - 1).format('MMMM')} {fiche.annee}</p>
          </div>
        </div>

        {/* Infos RH */}
        <div className="rh-info">
          <p><strong>Nature de contrat :</strong> {employee?.type_contrat}</p>
          <p><strong>Date d'embauche :</strong> {employee?.date_embauche}</p>
          <p><strong>Catégorie :</strong> {employee?.categorie}</p>
          <p><strong>Emploi occupé :</strong> {employee?.poste}</p>
          <p><strong>Département :</strong> {employee?.departement}</p>
          <p><strong>N° CNSS :</strong> {employee?.num_cnss}</p>
          <p><strong>CIN :</strong> {employee?.cin}</p>
          <p><strong>Situation familiale :</strong> {employee?.situation_familiale}</p>
          <p><strong>Nombre d'enfants :</strong> {employee?.nbr_enfant}</p>
          <p><strong>Enfants à charge :</strong> {employee?.nbr_enfant_charge}</p>
          <p><strong>Congé maladie M :</strong> {fiche.conge_maladie_m}</p>
          <p><strong>Congé maladie A :</strong> {fiche.conge_maladie_a}</p>
        </div>

        {/* Congés */}
        <div className="conges-section">
          <div>
            <p><strong>C. Pér. :</strong> {fiche.conge_periode}</p>
            <p><strong>C. Acquis :</strong> {fiche.conge_acquis}</p>
            <p><strong>C. Pris mois :</strong> {fiche.conge_pris}</p>
            <p><strong>C. Reste :</strong> {fiche.conge_restant}</p>
            <p><strong>C. Spéciaux :</strong> {fiche.conge_speciaux}</p>
            <p><strong>RIB :</strong> {fiche.rib}</p>
            <p><strong>Banque :</strong> {fiche.banque}</p>
          </div>

          <div className="employee-summary">
            <div className="summary-box">
              <p><strong>Matricule :</strong> {employee?.matricule}</p>
              <p><strong>Nom :</strong> {employee?.nom} {employee?.prenom}</p>
              <p><strong>Adresse :</strong> {employee?.adresse}</p>
            </div>
          </div>
        </div>

        {/* Tableau Designation */}
        <table className="fiche-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Salaire de base</td><td>{fiche.salaire_base} </td></tr>
            <tr><td>Prime ancienneté</td><td>{fiche.prime_anciennete} </td></tr>
            <tr><td>Indemnité présence</td><td>{fiche.indemnite_presence} </td></tr>
            <tr><td>Indemnité transport</td><td>{fiche.indemnite_transport} </td></tr>
            <tr><td>Prime langue</td><td>{fiche.prime_langue} </td></tr>
            <tr><td>Prime Ramadan</td><td>{fiche.prime_ramadan} </td></tr>
            <tr><td>Prime télétravail</td><td>{fiche.prime_teletravail} </td></tr>
            <tr><td>Avantage assurance</td><td>{fiche.avantage_assurance} </td></tr>
            <tr className="highlight"><td><b>Salaire Brut</b></td><td>{fiche.salaire_brut} </td></tr>
            <tr><td>CNSS salarié</td><td>{fiche.cnss_salarie} </td></tr>
            <tr><td>IRPP</td><td>{fiche.irpp} </td></tr>
            <tr><td>CSS</td><td>{fiche.css} </td></tr>
            <tr className="highlight"><td><b>Déductions totales</b></td><td>{fiche.deduction_totale} </td></tr>
            <tr className="highlight"><td><b>Salaire net à payer</b></td><td>{fiche.net_a_payer} </td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FichePaieView;
