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
            <div className="company-logo">
              <img src="https://imgcdn.dev/i/YQD9nL" alt="YUCCAINFO Logo" />
            </div>
            <div className="company-info">
              <h3>YUCCAINFO</h3>
              <p>Solutions ERP</p>
              <p>Dar Chaabane Fehri, Nabeul, Tunisia</p>
              <p>IF: 1883737/D/A/M/000</p>
              <p>Tél. : +216 23 198 524 / +216 97 131 795</p>
              <p>Email: contact@yuccainfo.com.tn</p>
              <p>Site Web: www.yuccainfo.com.tn/</p>
            </div>
          </div>

          <div className="header-center">
            <div className="title-section">
              <Title level={1} className="bulletin-title">BULLETIN DE PAIE</Title>
              <div className="period-info">
                <span className="period-label">Période :</span>
                <span className="period-value">{moment().month(fiche.mois - 1).format('MMMM')} {fiche.annee}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Info Card */}
        <div className="employee-card">
          <div className="employee-header">
            <h3>Informations Employé</h3>
          </div>
          <div className="employee-details">
            <div className="detail-item">
              <span className="label">Matricule :</span>
              <span className="value"> {employee?.id_employe}</span>
            </div>
            <div className="detail-item">
              <span className="label">Nom complet :</span>
              <span className="value">{employee?.nom} {employee?.prenom}</span>
            </div>
            <div className="detail-item">
              <span className="label">Adresse :</span>
              <span className="value">{employee?.adresse}</span>
            </div>
            <div className="detail-item">
              <span className="label">CIN :</span>
              <span className="value">{employee?.cin}</span>
            </div>
          </div>
        </div>

        {/* Contract and HR Info */}
        <div className="info-sections">
          <div className="info-section">
            <h4>Informations Contractuelles</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Nature de contrat :</span>
                <span className="value">{employee?.type_contrat}</span>
              </div>
              <div className="info-item">
                <span className="label">Date d'embauche :</span>
                <span className="value">{employee?.date_embauche}</span>
              </div>
              <div className="info-item">
                <span className="label">Catégorie :</span>
                <span className="value">{employee?.categorie}</span>
              </div>
              <div className="info-item">
                <span className="label">Emploi occupé :</span>
                <span className="value">{employee?.poste}</span>
              </div>
              <div className="info-item">
                <span className="label">Département :</span>
                <span className="value">{employee?.departement}</span>
              </div>
              <div className="info-item">
                <span className="label">N° CNSS :</span>
                <span className="value">{employee?.numero_cnss}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h4>Informations Personnelles</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Situation familiale :</span>
                <span className="value">{employee?.situation_familiale}</span>
              </div>
              <div className="info-item">
                <span className="label">Nombre d'enfants :</span>
                <span className="value">{employee?.nombre_enfants}</span>
              </div>
              <div className="info-item">
                <span className="label">Enfants à charge :</span>
                <span className="value">{employee?.enfants_a_charge}</span>
              </div>
              <div className="info-item">
                <span className="label">RIB :</span>
                <span className="value">{fiche.rib}</span>
              </div>
              <div className="info-item">
                <span className="label">Banque :</span>
                <span className="value">{fiche.banque}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Congés Section */}
        <div className="conges-section">
          <h4>Congés et Absences</h4>
          <div className="conges-grid">
            <div className="conge-item">
              <span className="label">C. Période :</span>
              <span className="value">{fiche.conge_precedent}</span>
            </div>
            <div className="conge-item">
              <span className="label">C. Acquis :</span>
              <span className="value">{fiche.conge_acquis}</span>
            </div>
            <div className="conge-item">
              <span className="label">C. Pris mois :</span>
              <span className="value">{fiche.conge_pris}</span>
            </div>
            <div className="conge-item">
              <span className="label">C. Reste :</span>
              <span className="value">{fiche.conge_restant}</span>
            </div>
            <div className="conge-item">
              <span className="label">C. Spéciaux :</span>
              <span className="value">{fiche.conge_speciaux}</span>
            </div>
            <div className="conge-item">
              <span className="label">Congé maladie M :</span>
              <span className="value">{fiche.conge_maladie_m}</span>
            </div>
            <div className="conge-item">
              <span className="label">Congé maladie A :</span>
              <span className="value">{fiche.conge_maladie_a}</span>
            </div>
          </div>
        </div>

        {/* Salary Table */}
        <div className="salary-section">
          <h4>Détail de la Paie</h4>
          <table className="salary-table">
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Montant (TND)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Salaire de base</td><td>{fiche.salaire_base}</td></tr>
              <tr><td>Prime ancienneté</td><td>{fiche.prime_anciennete}</td></tr>
              <tr><td>Indemnité présence</td><td>{fiche.indemnite_presence}</td></tr>
              <tr><td>Indemnité transport</td><td>{fiche.indemnite_transport}</td></tr>
              <tr><td>Prime langue</td><td>{fiche.prime_langue}</td></tr>
              <tr><td>Prime Ramadan</td><td>{fiche.prime_ramadan}</td></tr>
              <tr><td>Prime télétravail</td><td>{fiche.prime_teletravail}</td></tr>
              <tr><td>Avantage assurance</td><td>{fiche.avantage_assurance}</td></tr>
              <tr className="subtotal-row">
                <td><strong>Salaire Brut</strong></td>
                <td><strong>{fiche.salaire_brut}</strong></td>
              </tr>
              <tr className="deduction-row"><td>CNSS salarié</td><td>-{fiche.cnss_salarie}</td></tr>
              <tr className="deduction-row"><td>IRPP</td><td>-{fiche.irpp}</td></tr>
              <tr className="deduction-row"><td>CSS</td><td>-{fiche.css}</td></tr>
              <tr className="subtotal-row">
                <td><strong>Déductions totales</strong></td>
                <td><strong>-{fiche.deduction_totale}</strong></td>
              </tr>
              <tr className="total-row">
                <td><strong>Salaire net à payer</strong></td>
                <td><strong>{fiche.net_a_payer}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
       
      </div>
    </div>
  );
};

export default FichePaieView;