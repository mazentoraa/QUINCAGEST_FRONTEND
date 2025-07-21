import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EmployeeService from './EmployeeService';
import moment from 'moment';
import './FichePaiePrint.css';

const FichePaiePrint = () => {
  const { id } = useParams();
  const [fiche, setFiche] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Récupération de la fiche avec ID:', id);
        
        // Récupération de la fiche de paie
        const ficheResponse = await EmployeeService.getFichePaieById(id);
        console.log('Réponse fiche complète:', ficheResponse);
        
        const ficheData = ficheResponse.data || ficheResponse;
        console.log('Données fiche extraites:', ficheData);
        setFiche(ficheData);

        // Vérification si les données employé sont incluses dans la fiche
        if (ficheData.employee) {
          console.log('Données employé trouvées dans la fiche:', ficheData.employee);
          setEmployee(ficheData.employee);
        } else if (ficheData.employe_id || ficheData.employe) {
          // Si pas d'objet employee, récupérer les données employé séparément
          const employeId = ficheData.employe_id || ficheData.employe;
          console.log('ID employé trouvé:', employeId, 'Récupération des données...');
          
          try {
            const employeeResponse = await EmployeeService.getById(employeId);
            console.log('Réponse employé:', employeeResponse);
            const employeeData = employeeResponse.data || employeeResponse;
            setEmployee(employeeData);
          } catch (empError) {
            console.error('Erreur récupération employé:', empError);
            setError('Impossible de récupérer les données de l\'employé');
          }
        } else {
          console.warn('Aucun ID employé trouvé dans la fiche');
          setError('ID employé manquant dans la fiche de paie');
        }
        
      } catch (error) {
        console.error('Erreur complète:', error);
        setError('Erreur lors de la récupération des données');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);

  // Fonction d'impression personnalisée
  const handlePrint = () => {
    const nonPrintElements = document.querySelectorAll('.no-print');
    nonPrintElements.forEach(el => el.style.display = 'none');
    
    window.print();
    
    setTimeout(() => {
      nonPrintElements.forEach(el => el.style.display = 'block');
    }, 100);
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div style={{color: 'red'}}>Erreur: {error}</div>;
  if (!fiche) return <div>Aucune fiche trouvée</div>;

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
              <p><strong>Matricule:</strong> {employee?.id_employe || ' '}</p>
              <p><strong>Nom:</strong> {employee?.nom || ' '} {employee?.prenom || ''}</p>
              <p><strong>Adresse:</strong> {employee?.adresse || ' '}</p>
              <p><strong>CIN:</strong> {employee?.cin || ' '}</p>
              <p><strong>N° CNSS:</strong> {employee?.numero_cnss || ' '}</p>
            </div>
            <div className="employee-right">
              <p><strong>Nature contrat:</strong> {employee?.type_contrat || ' '}</p>
              <p><strong>Date embauche:</strong> {employee?.date_embauche ? moment(employee.date_embauche).format("DD/MM/YYYY") : ' '}</p>
              <p><strong>Catégorie:</strong> {employee?.categorie || ' '}</p>
              <p><strong>Emploi occupé:</strong> {employee?.poste || ' '}</p>
              <p><strong>Département:</strong> {employee?.departement || ' '}</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="additional-info">
          <div className="info-left">
            <p><strong>Situation familiale:</strong> {employee?.situation_familiale || ' '}</p>
            <p><strong>Nombre enfant:</strong> {employee?.nombre_enfants || ' '}</p>
            <p><strong>Enfants à charge:</strong> {employee?.enfants_a_charge || ' '}</p>
          </div>
          <div className="info-center">
            <p><strong>Maladie (M):</strong> {fiche.conge_maladie_m || 0}</p>
            <p><strong>Maladie (A):</strong> {fiche.conge_maladie_a || 0}</p>
            <p><strong>Congé Période:</strong> {fiche.conge_precedent || 0}</p>
          </div>
          <div className="info-right">
            <p><strong>RIB:</strong> {fiche.rib || ' '}</p>
            <p><strong>Banque:</strong> {fiche.banque || ' '}</p>
            <p><strong>Congé Acquis:</strong> {fiche.conge_acquis || 0}</p>
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
                <td>{fiche.salaire_base || 0}</td>
                <td></td>
                <td>{fiche.salaire_base || 0}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Prime ancienneté</td>
                <td>{fiche.prime_anciennete || 0}</td>
                <td></td>
                <td>{fiche.prime_anciennete || 0}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Indemnité présence</td>
                <td>{fiche.indemnite_presence || 0}</td>
                <td></td>
                <td>{fiche.indemnite_presence || 0}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Indemnité transport</td>
                <td>{fiche.indemnite_transport || 0}</td>
                <td></td>
                <td>{fiche.indemnite_transport || 0}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Prime langue</td>
                <td>{fiche.prime_langue || 0}</td>
                <td></td>
                <td>{fiche.prime_langue || 0}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Prime Ramadan</td>
                <td>{fiche.prime_ramadan || 0}</td>
                <td></td>
                <td>{fiche.prime_ramadan || 0}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Prime télétravail</td>
                <td>{fiche.prime_teletravail || 0}</td>
                <td></td>
                <td>{fiche.prime_teletravail || 0}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Avantage assurance</td>
                <td>{fiche.avantage_assurance || 0}</td>
                <td></td>
                <td>{fiche.avantage_assurance || 0}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr className="total-brut">
                <td><strong>TOTAL BRUT</strong></td>
                <td><strong>{fiche.salaire_brut || 0}</strong></td>
                <td><strong></strong></td>
                <td><strong>{fiche.salaire_brut || 0}</strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
              </tr>
              <tr>
                <td>CNSS salarié</td>
                <td>{fiche.salaire_brut || 0}</td>
                <td>9.18%</td>
                <td></td>
                <td>{fiche.cnss_salarie || 0}</td>
                <td>16.57%</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>IRPP</td>
                <td></td>
                <td>Variable</td>
                <td></td>
                <td>{fiche.irpp || 0}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>CSS</td>
                <td></td>
                <td>1%</td>
                <td></td>
                <td>{fiche.css || 0}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr className="total-deductions">
                <td><strong>TOTAL DÉDUCTIONS</strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong>{fiche.deduction_totale || 0}</strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
              </tr>
              <tr className="net-payer">
                <td><strong>NET À PAYER</strong></td>
                <td><strong></strong></td>
                <td><strong></strong></td>
                <td><strong>{fiche.net_a_payer || 0}</strong></td>
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