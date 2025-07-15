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

  // Fonction d'impression personnalisée
  const handlePrint = () => {
    // Masquer temporairement les éléments non imprimables
    const nonPrintElements = document.querySelectorAll('.no-print');
    nonPrintElements.forEach(el => el.style.display = 'none');
    
    // Lancer l'impression
    window.print();
    
    // Rétablir l'affichage après impression
    setTimeout(() => {
      nonPrintElements.forEach(el => el.style.display = 'block');
    }, 100);
  };

  if (!fiche) return <div>Chargement...</div>;

  const { employee } = fiche;

  return (
    <div className="fiche-paie-print">
      <div id="printable">
        {/* Header Section */}
        <div className="entete">
         <div className="logo-section">
  <img src="https://i.postimg.cc/7hhjQYRS/logo.jpg " alt="Logo" />
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

        {/* Employee Information */}
        <div className="employee-info-section">
          <div className="employee-details">
            <div className="employee-left">
              <p><strong>Matricule:</strong> {employee?.id_employe}</p>
              <p><strong>Nom:</strong> {employee?.nom} {employee?.prenom}</p>
              <p><strong>Adresse:</strong> {employee?.adresse}</p>
              <p><strong>CIN:</strong> {employee?.cin}</p>
              <p><strong>N° CNSS:</strong> {employee?.numero_cnss}</p>
            </div>
            <div className="employee-right">
              <p><strong>Nature contrat:</strong> {employee?.type_contrat}</p>
              <p><strong>Date embauche:</strong> {moment(employee?.date_embauche).format("DD/MM/YYYY")}</p>
              <p><strong>Catégorie:</strong> {employee?.categorie}</p>
              <p><strong>Emploi occupé:</strong> {employee?.poste}</p>
              <p><strong>Département:</strong> {employee?.departement}</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="additional-info">
          <div className="info-left">
            <p><strong>Situation familiale:</strong> {employee?.situation_familiale}</p>
            <p><strong>Nombre enfant:</strong> {employee?.nombre_enfants}</p>
            <p><strong>Enfants à charge:</strong> {employee?.enfants_a_charge}</p>
          </div>
          <div className="info-center">
            <p><strong>Maladie (M):</strong> {fiche.conge_maladie_m}</p>
            <p><strong>Maladie (A):</strong> {fiche.conge_maladie_a}</p>
            <p><strong>Congé Période:</strong> {fiche.conge_precedent}</p>
          </div>
          <div className="info-right">
            <p><strong>RIB:</strong> {fiche.rib}</p>
            <p><strong>Banque:</strong> {fiche.banque}</p>
            <p><strong>Congé Acquis:</strong> {fiche.conge_acquis}</p>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="payroll-table-section">
          <table className="payroll-table">
            <thead>
              <tr>
                <th rowSpan="2">Désignation</th>
                <th rowSpan="2">Base</th>
                <th colSpan="3">Part Salariale</th>
                <th colSpan="3">Part Patronale</th>
              </tr>
              <tr>
                <th>Taux</th>
                <th>Gain</th>
                <th>Retenue</th>
                <th>Taux</th>
                <th>Retenue +</th>
                <th>Retenue -</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Salaire de base</td>
                <td>{fiche.salaire_base}</td>
                <td></td>
                <td>{fiche.salaire_base}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Prime ancienneté</td>
                <td>{fiche.prime_anciennete}</td>
                <td></td>
                <td>{fiche.prime_anciennete}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Indemnité présence</td>
                <td>{fiche.indemnite_presence}</td>
                <td></td>
                <td>{fiche.indemnite_presence}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Indemnité transport</td>
                <td>{fiche.indemnite_transport}</td>
                <td></td>
                <td>{fiche.indemnite_transport}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Prime langue</td>
                <td>{fiche.prime_langue}</td>
                <td></td>
                <td>{fiche.prime_langue}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Prime Ramadan</td>
                <td>{fiche.prime_ramadan}</td>
                <td></td>
                <td>{fiche.prime_ramadan}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Prime télétravail</td>
                <td>{fiche.prime_teletravail}</td>
                <td></td>
                <td>{fiche.prime_teletravail}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Avantage assurance</td>
                <td>{fiche.avantage_assurance}</td>
                <td></td>
                <td>{fiche.avantage_assurance}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr className="total-brut">
                <td><strong>TOTAL BRUT</strong></td>
                <td><strong>{fiche.salaire_brut}</strong></td>
                <td><strong></strong></td>
                <td><strong>{fiche.salaire_brut}</strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
              </tr>
              <tr>
                <td>CNSS salarié</td>
                <td>{fiche.salaire_brut}</td>
                <td>9.18%</td>
                <td></td>
                <td>{fiche.cnss_salarie}</td>
                <td>16.57%</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>IRPP</td>
                <td></td>
                <td>Variable</td>
                <td></td>
                <td>{fiche.irpp}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>CSS</td>
                <td></td>
                <td>1%</td>
                <td></td>
                <td>{fiche.css}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr className="total-deductions">
                <td><strong>TOTAL DÉDUCTIONS</strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong>{fiche.deduction_totale}</strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
              </tr>
              <tr className="net-payer">
                <td><strong>NET À PAYER</strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong>{fiche.net_a_payer}</strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
              </tr>
            </tbody>
          </table>
          <p> Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée. </p>
        </div>

        {/* Footer */}
        <div className="footer-section">
          <div className="signature-area">
            <div className="signature-left">
              <p><strong>Signature Employé</strong></p>
              <div className="signature-box"></div>
            </div>
            <div className="signature-right">
              <p><strong>Signature Employeur</strong></p>
              <div className="signature-box"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="no-print">
        <button onClick={handlePrint}>🖨️ Imprimer</button>
      </div>
    </div>
  );
};

export default FichePaiePrint;