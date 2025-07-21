import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  Table,
  Tag,
  Statistic,
  Space,
  Tooltip,
  message,
  Modal,
  Form,
    Popconfirm,
  InputNumber,
  Select,
  Spin,
  Input,
  Divider,
  notification,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  PrinterOutlined,
  FileDoneOutlined,
  FileExclamationOutlined,
  ClockCircleOutlined,
  
  DollarOutlined,
  MinusCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import { Progress } from 'antd';

import EmployeeService from './EmployeeService';

const { Title, Text } = Typography;
const { Option } = Select;

const EmployeePayrollDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // États principaux
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFiche, setEditingFiche] = useState(null);
  const [form] = Form.useForm();

  // État pour le résumé des calculs
  const [resume, setResume] = useState({
    totalBrut: 0,
    salaireImposable: 0,
    cnssSalarie: 0,
    irpp: 0,
    css: 0,
    totalCotisations: 0,
    cnssPatronal: 0,
    accidentTravail: 0,
    chargesPatronales: 0,
    salaireNet: 0,
  });

  // Chargement des données de l'employé
const loadEmployee = useCallback(async () => {
  if (!id) return;
  
  setLoading(true);
  try {
    // Récupérer les données de l'employé
    const response = await EmployeeService.getById(id);
    let employeeData = response.data || response;
    
    // Récupérer les fiches de paie spécifiquement pour cet employé
    try {
      const fichesResponse = await EmployeeService.getFichesPaieByEmploye(id);
      console.log('Réponse complète des fiches:', fichesResponse);
      
      let fiches = [];
      
      // Gestion des différents formats de réponse
      if (fichesResponse.data) {
        if (Array.isArray(fichesResponse.data)) {
          fiches = fichesResponse.data;
        } else if (fichesResponse.data.results && Array.isArray(fichesResponse.data.results)) {
          fiches = fichesResponse.data.results;
        }
      } else if (Array.isArray(fichesResponse)) {
        fiches = fichesResponse;
      } else if (fichesResponse.results && Array.isArray(fichesResponse.results)) {
        fiches = fichesResponse.results;
      }
      
      // Filtrage amélioré pour s'assurer que seules les fiches de cet employé sont incluses
      const fichesFiltrees = fiches.filter(fiche => {
        const ficheEmployeId = fiche.employe || fiche.employe_id;
        const currentId = parseInt(id);
        
        // Comparaison en tant que nombres
        return parseInt(ficheEmployeId) === currentId;
      });
      
      console.log('Fiches avant filtrage:', fiches);
      console.log('Fiches après filtrage pour employé', id, ':', fichesFiltrees);
      
      employeeData.fiches_paie = fichesFiltrees;
      
    } catch (ficheError) {
      console.error('Erreur lors de la récupération des fiches:', ficheError);
      employeeData.fiches_paie = [];
    }
    
    setEmployee(employeeData);
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    notification.error({
      message: 'Erreur',
      description: "Impossible de charger les données de l'employé",
      placement: 'topRight',
    });
  } finally {
    setLoading(false);
  }
}, [id]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  // Calcul du résumé des statistiques
  const statistics = useMemo(() => {
    if (!employee?.fiches_paie) return { 
      totalFiches: 0, 
      fichesGenerees: [], 
      fichesEnAttente: 0, 
      totalNet: 0, 
      totalDeductions: 0 
    };

    
    const fichesSorted = [...employee.fiches_paie].sort((a, b) =>
      new Date(b.date_creation) - new Date(a.date_creation)
    );

    const fichesGenerees = fichesSorted.filter(f => 
      f.statut === 'Générée' || f.statut === 'Validée'
    );

    return {
      totalFiches: fichesSorted.length,
      fichesGenerees,
      fichesEnAttente: fichesSorted.length - fichesGenerees.length,
      totalNet: fichesGenerees.reduce((acc, f) => acc + (f.net_a_payer || 0), 0),
      totalDeductions: fichesGenerees.reduce((acc, f) => acc + (f.deduction_totale || 0), 0),
      fichesSorted
    };
  }, [employee]);
const refreshFiches = useCallback(async () => {
  if (!id) {
    console.error('ID employé manquant pour le rafraîchissement');
    return;
  }
  
  try {
    console.log('Rafraîchissement des fiches pour employé:', id);
    
    // Délai pour laisser le serveur traiter la suppression
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const fichesResponse = await EmployeeService.getFichesPaieByEmploye(id);
    console.log('Réponse rafraîchissement:', fichesResponse);
    
    let fiches = [];
    
    // Gestion des différents formats de réponse
    if (fichesResponse.data) {
      if (Array.isArray(fichesResponse.data)) {
        fiches = fichesResponse.data;
      } else if (fichesResponse.data.results && Array.isArray(fichesResponse.data.results)) {
        fiches = fichesResponse.data.results;
      }
    } else if (Array.isArray(fichesResponse)) {
      fiches = fichesResponse;
    } else if (fichesResponse.results && Array.isArray(fichesResponse.results)) {
      fiches = fichesResponse.results;
    }
    
    // Filtrage amélioré
    const fichesFiltrees = fiches.filter(fiche => {
      const ficheEmployeId = fiche.employe || fiche.employe_id;
      const currentId = parseInt(id);
      
      return parseInt(ficheEmployeId) === currentId;
    });
    
    console.log('Fiches après filtrage lors du rafraîchissement:', fichesFiltrees);
    
    // Mettre à jour l'état
    setEmployee(prev => ({
      ...prev,
      fiches_paie: fichesFiltrees
    }));
    
    console.log('Fiches rafraîchies avec succès');
    
  } catch (error) {
    console.error('Erreur lors du rafraîchissement:', error);
    notification.error({
      message: 'Erreur',
      description: 'Impossible de rafraîchir la liste des fiches',
      placement: 'topRight',
    });
  }
}, [id]);
  // Fonction de calcul du résumé (optimisée)
const calculateResume = useCallback((values) => {
  const {
    salaire_base = 0,
    prime_anciennete = 0,
    indemnite_presence = 0,
    indemnite_transport = 0,
    prime_langue = 0,
    jours_feries_payes = 0,
    absences_non_remunerees = 0,
    prime_ramadan = 0,
    prime_teletravail = 0,
    avantage_assurance = 0,
    avance = 0, // Montant de l'avance à déduire ce mois-ci
  } = values;

  // 1. Calcul du salaire brut (AVANT déduction de l'avance)
  const totalBrut = salaire_base + prime_anciennete + indemnite_presence +
                    indemnite_transport + prime_langue + jours_feries_payes +
                    prime_ramadan + prime_teletravail + avantage_assurance - absences_non_remunerees;

  // 2. Base CNSS = Salaire Brut - Avantages en Nature
  const plafondCNSS = 6000; // Plafond CNSS tunisien
  const baseCNSS = Math.min(totalBrut - avantage_assurance, plafondCNSS);

  // 3. Cotisations CNSS
  const cnssSalarie = baseCNSS * 0.0918; // 9.18%
  const cnssPatronal = baseCNSS * 0.1607; // 16.07%
  const accidentTravail = baseCNSS * 0.005; // 0.5%

  // 4. Salaire imposable = Salaire Brut - Cotisations Sociales Salarié - Avantages en Nature
  const salaireImposable = totalBrut - cnssSalarie - avantage_assurance;

  // 5. Calcul de l'IRPP annuel puis mensuel
  const salaireAnnuel = salaireImposable * 12;
  let irppAnnuel = 0;
  
  // Barème IRPP tunisien progressif annuel
  if (salaireAnnuel > 30000) {
    irppAnnuel = (salaireAnnuel - 30000) * 0.35 + 7500;
  } else if (salaireAnnuel > 20000) {
    irppAnnuel = (salaireAnnuel - 20000) * 0.25 + 2500;
  } else if (salaireAnnuel > 5000) {
    irppAnnuel = (salaireAnnuel - 5000) * 0.15;
  }
  
  const irpp = irppAnnuel / 12; // IRPP mensuel

  // 6. CSS = Salaire Imposable × 0.5%
  const css = salaireImposable * 0.005;

  // 7. Total cotisations salariales (sans l'avance)
  const totalCotisations = cnssSalarie + irpp + css;

  // 8. Charges patronales
  const chargesPatronales = cnssPatronal + accidentTravail;

  // 9. Salaire net AVANT déduction de l'avance
  const salaireNetAvantAvance = totalBrut - totalCotisations;
  
  // 10. Salaire net final = Salaire net - Avance
  const salaireNet = salaireNetAvantAvance - avance;

  // 11. Total des déductions = cotisations + avance
  const totalDeductions = totalCotisations + avance;

  return {
    totalBrut: Math.round(totalBrut * 100) / 100,
    salaireImposable: Math.round(salaireImposable * 100) / 100,
    cnssSalarie: Math.round(cnssSalarie * 100) / 100,
    irpp: Math.round(irpp * 100) / 100,
    css: Math.round(css * 100) / 100,
    totalCotisations: Math.round(totalCotisations * 100) / 100,
    cnssPatronal: Math.round(cnssPatronal * 100) / 100,
    accidentTravail: Math.round(accidentTravail * 100) / 100,
    chargesPatronales: Math.round(chargesPatronales * 100) / 100,
    salaireNetAvantAvance: Math.round(salaireNetAvantAvance * 100) / 100, 
    avance: Math.round(avance * 100) / 100, 
    salaireNet: Math.round(salaireNet * 100) / 100, 
    totalDeductions: Math.round(totalDeductions * 100) / 100, // NOUVEAU
    salaireAnnuel: Math.round(salaireAnnuel * 100) / 100,
    irppAnnuel: Math.round(irppAnnuel * 100) / 100,
  };
}, []);
const calculateAvanceMensuelle = useCallback(() => {
  if (!employee?.avances || !Array.isArray(employee.avances)) return 0;

  // Avances acceptées et non totalement remboursées
  const avancesEnCours = employee.avances.filter(avance =>
    avance?.statut === 'Acceptée' &&
    (avance.montant_rembourse ?? 0) < (avance.montant ?? 0)
  );

  let totalAvanceMensuelle = 0;

  avancesEnCours.forEach(avance => {
    const montant = avance.montant ?? 0;
    const montantRembourse = avance.montant_rembourse ?? 0;
    const duree = avance.duree_remboursement ?? 1;
    const moisRembourses = avance.mois_rembourses ?? 0;

    const montantRestant = montant - montantRembourse;
    const moisRestants = duree - moisRembourses;

    if (moisRestants > 0) {
      const mensualite = montantRestant / moisRestants;
      totalAvanceMensuelle += mensualite;
    }
  });

  return Math.round(totalAvanceMensuelle * 100) / 100;
}, [employee]);

const handleEdit = useCallback(async (fiche) => {
  try {
    setLoading(true);
    const response = await EmployeeService.getFichePaieById(fiche.id);
    const ficheDetails = response.data || response;
    
    // Calculer l'avance mensuelle automatiquement si elle n'existe pas dans la fiche
    const avanceMensuelle = ficheDetails.avance || calculateAvanceMensuelle();
    
    form.setFieldsValue({
      mois: ficheDetails.mois,
      annee: ficheDetails.annee,
      salaire_base: ficheDetails.salaire_base,
      prime_anciennete: ficheDetails.prime_anciennete,
      indemnite_presence: ficheDetails.indemnite_presence,
      indemnite_transport: ficheDetails.indemnite_transport,
      prime_langue: ficheDetails.prime_langue,
      jours_feries_payes: ficheDetails.jours_feries_payes,
      absences_non_remunerees: ficheDetails.absences_non_remunerees,
      prime_ramadan: ficheDetails.prime_ramadan,
      prime_teletravail: ficheDetails.prime_teletravail,
      avantage_assurance: ficheDetails.avantage_assurance,
      avance: avanceMensuelle, // Ajouter l'avance
      conge_precedent: ficheDetails.conge_precedent,
      conge_acquis: ficheDetails.conge_acquis,
      conge_pris: ficheDetails.conge_pris,
      conge_restant: ficheDetails.conge_restant,
      conge_speciaux: ficheDetails.conge_speciaux,
      conge_maladie_m: ficheDetails.conge_maladie_m,
      conge_maladie_a: ficheDetails.conge_maladie_a,
      banque: ficheDetails.banque,
      rib: ficheDetails.rib,
    });

    const calculatedResume = calculateResume({...ficheDetails, avance: avanceMensuelle});
    setResume(calculatedResume);
    setEditingFiche(fiche);
    setIsModalVisible(true);
  } catch (error) {
    console.error('Erreur lors du chargement de la fiche:', error);
    notification.error({
      message: 'Erreur',
      description: 'Impossible de charger les détails de la fiche',
      placement: 'topRight',
    });
  } finally {
    setLoading(false);
  }
}, [form, calculateResume, calculateAvanceMensuelle]);
const handlePrint = useCallback((fiche) => {
  navigate(`/fiches-paie/${fiche.id}/print`);
}, [navigate]);

 const handleView = (record) => {
  navigate(`/fiche-paie/${record.id}/view`);
};

const handleAddFiche = useCallback(() => {
  setEditingFiche(null);
  form.resetFields();
  
  // Calculer l'avance mensuelle automatiquement
  const avanceMensuelle = calculateAvanceMensuelle();
  
  // Valeurs par défaut
  const defaultValues = {
    mois: moment().month() + 1,
    annee: moment().year(),
    salaire_base: employee?.salaire || 0,
    prime_anciennete: 0,
    indemnite_presence: 0,
    indemnite_transport: 0,
    prime_langue: 0,
    jours_feries_payes: 0,
    absences_non_remunerees: 0,
    prime_ramadan: 0,
    prime_teletravail: 0,
    avantage_assurance: 0,
    avance: avanceMensuelle, // Ajouter l'avance calculée automatiquement
    conge_precedent: 0,
    conge_acquis: 0,
    conge_pris: 0,
    conge_restant: 0,
    conge_speciaux: 0,
    conge_maladie_m: 0,
    conge_maladie_a: 0,
    banque: employee?.banque || '',
    rib: employee?.rib || '',
  };

  form.setFieldsValue(defaultValues);
  setResume(calculateResume(defaultValues));
  setIsModalVisible(true);
}, [form, employee, calculateResume, calculateAvanceMensuelle]);

const handleDelete = useCallback(async (fiche) => {
  if (!fiche || !fiche.id) {
    notification.error({
      message: 'Erreur',
      description: 'Fiche invalide pour la suppression',
    });
    return;
  }

  try {
    const loadingMessage = message.loading('Suppression en cours...', 0);
    await EmployeeService.deleteFichePaie(fiche.id);
    loadingMessage();
    notification.success({
      message: 'Succès',
      description: 'Fiche de paie supprimée avec succès',
    });
    await refreshFiches();
  } catch (error) {
    message.destroy();
    let errorMessage = 'Erreur lors de la suppression';
    if (error.response?.status === 404) {
      errorMessage = 'Fiche non trouvée';
    } else if (error.response?.status === 403) {
      errorMessage = 'Permission refusée';
    }
    notification.error({
      message: 'Erreur',
      description: errorMessage,
    });
  }
}, [refreshFiches]);

  const handleBack = useCallback(() => {
    navigate('/employes/fiche-paie');
  }, [navigate]);


  const updateAvanceRemboursement = useCallback(async (avanceMensuelle) => {
  if (!employee?.avances || avanceMensuelle <= 0) return;

  try {
    const avancesEnCours = employee.avances.filter(avance => 
      avance.statut === 'Acceptée' && 
      (avance.montant_rembourse || 0) < avance.montant
    );

    for (const avance of avancesEnCours) {
      const montantRestant = avance.montant - (avance.montant_rembourse || 0);
      const nombreMoisRestants = avance.duree_remboursement - (avance.mois_rembourses || 0);
      
      if (nombreMoisRestants > 0) {
        const remboursementMensuel = montantRestant / nombreMoisRestants;
        
        // Mettre à jour l'avance
        const nouvelleAvance = {
          ...avance,
          montant_rembourse: (avance.montant_rembourse || 0) + remboursementMensuel,
          mois_rembourses: (avance.mois_rembourses || 0) + 1,
          statut: ((avance.montant_rembourse || 0) + remboursementMensuel) >= avance.montant ? 'Remboursée' : 'Acceptée'
        };

        // Appel API pour mettre à jour l'avance
        await EmployeeService.updateAvance(avance.id, nouvelleAvance);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des avances:', error);
  }
}, [employee]);

  // Soumission du formulaire
const onFinish = useCallback(async (values) => {
  try {
    setLoading(true);
    
    const calculatedResume = calculateResume(values);
    const ficheData = {
      employe: parseInt(id),
      mois: values.mois,
      annee: values.annee,
      salaire_brut: calculatedResume.totalBrut,
      salaire_imposable: calculatedResume.salaireImposable,
      cnss_salarie: calculatedResume.cnssSalarie,
      irpp: calculatedResume.irpp,
      css: calculatedResume.css,
      cotisations: calculatedResume.totalCotisations,
      cnss_patronal: calculatedResume.cnssPatronal,
      accident_travail: calculatedResume.accidentTravail,
      charges_patronales: calculatedResume.chargesPatronales,
      net_a_payer: calculatedResume.salaireNet, 
      deduction_totale: calculatedResume.totalDeductions, // Cotisations + Avance
      statut: editingFiche ? editingFiche.statut : 'Générée',
      date_creation: editingFiche ? editingFiche.date_creation : new Date().toISOString(),
      
      // Détails de la fiche
      salaire_base: values.salaire_base,
      prime_anciennete: values.prime_anciennete,
      indemnite_presence: values.indemnite_presence,
      indemnite_transport: values.indemnite_transport,
      prime_langue: values.prime_langue,
      jours_feries_payes: values.jours_feries_payes,
      absences_non_remunerees: values.absences_non_remunerees,
      prime_ramadan: values.prime_ramadan,
      prime_teletravail: values.prime_teletravail,
      avantage_assurance: values.avantage_assurance,
      avance: values.avance, 
      conge_precedent: values.conge_precedent,
      conge_acquis: values.conge_acquis,
      conge_pris: values.conge_pris,
      conge_restant: values.conge_restant,
      conge_speciaux: values.conge_speciaux,
      conge_maladie_m: values.conge_maladie_m,
      conge_maladie_a: values.conge_maladie_a,
      banque: values.banque,
      rib: values.rib,
    };

    console.log('Données envoyées pour l\'employé', id, ':', ficheData);

    let response;
    if (editingFiche) {
      response = await EmployeeService.updateFichePaie(editingFiche.id, ficheData);
    } else {
      response = await EmployeeService.createFichePaie(ficheData);
      
      // Mettre à jour les avances seulement lors de la création d'une nouvelle fiche
      if (values.avance > 0) {
        await updateAvanceRemboursement(values.avance);
      }
    }
    
    notification.success({
      message: 'Succès',
      description: editingFiche ? 'Fiche de paie modifiée avec succès' : 'Fiche de paie créée avec succès',
      placement: 'topRight',
    });
    
    setIsModalVisible(false);
    setEditingFiche(null);
    
    // Rafraîchir les données
    setTimeout(async () => {
      await refreshFiches();
      // Recharger les données de l'employé pour avoir les avances mises à jour
      const employeeResponse = await EmployeeService.getEmployeeById(id);
      setEmployee(employeeResponse.data || employeeResponse);
    }, 500);
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    notification.error({
      message: 'Erreur',
      description: `Impossible de sauvegarder la fiche de paie: ${error.response?.data?.message || error.message}`,
      placement: 'topRight',
    });
  } finally {
    setLoading(false);
  }
}, [id, editingFiche, calculateResume, refreshFiches, updateAvanceRemboursement]);

  // Mise à jour du résumé en temps réel
  const onFormValuesChange = useCallback((_, allValues) => {
    const calculatedResume = calculateResume(allValues);
    setResume(calculatedResume);
  }, [calculateResume]);

  // Configuration des colonnes du tableau
  const columns = useMemo(() => [
    {
      title: 'Période',
      key: 'periode',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {moment().month(record.mois - 1).format('MMMM')} {record.annee}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {moment(record.date_creation).format('DD/MM/YYYY')}
          </div>
        </div>
      ),
    },
    {
      title: 'Salaire Brut',
      dataIndex: 'salaire_brut',
      align: 'right',
      render: (val) => (
        <div style={{ fontWeight: 600, color: '#1890ff' }}>
          {val?.toLocaleString('fr-MA')} 
        </div>
      ),
    },
    {
      title: 'Cotisations',
      dataIndex: 'deduction_totale',
      align: 'right',
      render: (val) => (
        <div style={{ fontWeight: 600 }}>
          {val?.toLocaleString('fr-MA')} 
        </div>
      ),
    },
    {
      title: 'Salaire Net',
      dataIndex: 'net_a_payer',
      align: 'right',
      render: (val) => (
        <div style={{ fontWeight: 600 }}>
          {val?.toLocaleString('fr-MA')} 
        </div>
      ),
    },
    {
    title: 'Avance',
    key: 'avance',
    align: 'center',
    render: (_, record) => {
      // Utiliser les avances de l'employé global ou essayer de les récupérer
      const avancesAcceptees = employee?.avances?.filter(a => 
        a.statut === 'Acceptée'
      ) || [];
      
      if (avancesAcceptees.length > 0) {
        const total = avancesAcceptees.reduce((sum, a) => sum + (a.montant || 0), 0);
        return (
          <div>
            <Tag color="warning" style={{ marginBottom: 4 }}>
              Oui
            </Tag>
            <div style={{ 
              fontSize: 12, 
              fontWeight: 600, 
              color: '#fa8c16' 
            }}>
              {total.toLocaleString('fr-MA')} DT
            </div>
          </div>
        );
      }
      
      return <Tag color="default">Non</Tag>;
    }
  },
    {
      title: 'Statut',
      dataIndex: 'statut',
      align: 'center',
      render: (val) => {
        const isGenerated = val === 'Générée' || val === 'Validée';
        return (
          <Tag 
            icon={isGenerated ? <FileDoneOutlined /> : <FileExclamationOutlined />} 
            color={isGenerated ? 'success' : 'warning'}
          >
            {val}
          </Tag>
        );
      }
    },
    {
    title: 'Date de Création',
    dataIndex: 'date_creation',
    key: 'date_creation',
    render: (date) => (
      <div>
        <div style={{ fontWeight: 500 }}>
          {moment(date).format('DD/MM/YYYY')}
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>
          {moment(date).format('HH:mm')}
        </div>
      </div>
    ),
    sorter: (a, b) => moment(a.date_creation).valueOf() - moment(b.date_creation).valueOf(),
  },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Voir">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              style={{ color: '#fa8c16' }}
            />
          </Tooltip>
          <Tooltip title="Imprimer">
            <Button 
              type="text" 
              icon={<PrinterOutlined />} 
              onClick={() => handlePrint(record)}
              style={{ color: '#52c41a' }}
            />
          </Tooltip>
       <Tooltip title="Supprimer">
  <Popconfirm
    title={`Supprimer la fiche de ${moment().month(record.mois - 1).format('MMMM')} ${record.annee} ?`}
    icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
    okText="Oui"
    cancelText="Non"
    okType="danger"
    onConfirm={() => handleDelete(record)}
  >
    <Button 
      icon={<DeleteOutlined />} 
      type="text" 
      danger 
    />
  </Popconfirm>
</Tooltip>


        </Space>
      )
    }
  ], [handleView, handleEdit, handlePrint, handleDelete]);

  // Affichage du loading
  if (loading && !employee) {
    return (
      <div style={{ 
        padding: 24, 
        textAlign: 'center', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" tip="Chargement des données..." />
      </div>
    );
  }

  // Affichage si employé non trouvé
  if (!employee) {
    return (
      <div style={{ 
        padding: 24, 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <h2>Employé introuvable</h2>
          <Button type="primary" onClick={handleBack}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 24, 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
      minHeight: '100vh' 
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ marginBottom: 16 }}
        >
          Retour
        </Button>

        <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
          📄 Fiches de Paie - {employee.nom} {employee.prenom}
        </Title>
      </div>

      {/* Statistiques */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Fiches Générées"
              value={statistics.fichesGenerees.length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<FileDoneOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Fiches en Attente"
              value={statistics.fichesEnAttente}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Net à Payer"
              value={statistics.totalNet}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Déductions Totales"
              value={statistics.totalDeductions}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<MinusCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Informations employé */}
      <Card style={{ marginBottom: 24 }} title="Informations Employé">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div>
              <Text strong>Nom complet : </Text>
              <Text>{employee.nom} {employee.prenom}</Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div>
              <Text strong>Poste : </Text>
              <Text>{employee.poste || '-'}</Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div>
              <Text strong>Département : </Text>
              <Text>{employee.departement || '-'}</Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div>
              <Text strong>Matricule : </Text>
              <Text>{employee.id_employe || '-'}</Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div>
              <Text strong>Salaire de Base : </Text>
              <Text style={{ color: '#1890ff', fontWeight: 600 }}>
                {employee.salaire?.toLocaleString('fr-MA')} 
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div>
              <Text strong>Date d'embauche : </Text>
              <Text>{employee.date_embauche ? moment(employee.date_embauche).format('DD/MM/YYYY') : '-'}</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Bouton Ajouter et Tableau */}
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <Title level={4} style={{ margin: 0 }}>
            Liste des Fiches de Paie
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddFiche}
            style={{ 
              height: 40,
              borderRadius: 8,
              fontWeight: 600
            }}
          >
            Ajouter une fiche
          </Button>
        </div>
        
        <Table
          dataSource={statistics.fichesSorted}
          rowKey="id"
          columns={columns}
          loading={loading}
          bordered
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} sur ${total} fiches`
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Modal Formulaire */}
  <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              backgroundColor: '#f1f5f9', 
              borderRadius: '50%', 
              width: 40, 
              height: 40, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              📝
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
                {editingFiche ? 'Modifier la fiche de paie' : 'Ajouter une fiche de paie'}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                Saisir les informations de paie de l'employé
              </div>
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingFiche(null);
        }}
        onOk={() => form.submit()}
        okText={editingFiche ? "Modifier" : "Enregistrer"}
        cancelText="Annuler"
        width={1200}
        destroyOnClose
        style={{ top: 20 }}
        type="primary"
        okButtonProps={{
          style: { 
           
            height: 40,
            borderRadius: 8,
            fontWeight: 600
          },
          loading: loading
        }}
        cancelButtonProps={{
          style: { 
            height: 40,
            borderRadius: 8,
            fontWeight: 600
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onValuesChange={onFormValuesChange}
        >
          {/* PÉRIODE */}
          <Card 
            size="small" 
            style={{ 
              marginBottom: 20,
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              marginBottom: 16,
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: 6,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                backgroundColor: '#64748b', 
                borderRadius: '50%', 
                width: 28, 
                height: 28, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                📆
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Période</span>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="mois" 
                  label={<span style={{ color: '#374151', fontWeight: 500 }}>Mois</span>} 
                  rules={[{ required: true, message: 'Le mois est requis' }]}
                >
                  <Select 
                    placeholder="Sélectionner un mois" 
                    style={{ height: 40 }}
                  >
                    {moment.months().map((m, i) => (
                      <Option key={i + 1} value={i + 1}>{m}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="annee" 
                  label={<span style={{ color: '#374151', fontWeight: 500 }}>Année</span>} 
                  rules={[{ required: true, message: 'L\'année est requise' }]}
                >
                  <Select 
                    placeholder="Sélectionner une année" 
                    style={{ height: 40 }}
                  >
                    {Array.from({ length: 5 }, (_, i) => moment().year() - i).map(y => (
                      <Option key={y} value={y}>{y}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* EMPLOYÉ */}
          <Card 
            size="small" 
            style={{ 
              marginBottom: 20,
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              marginBottom: 16,
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: 6,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                backgroundColor: '#64748b', 
                borderRadius: '50%', 
                width: 28, 
                height: 28, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                👤
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Informations Employé</span>
            </div>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: 12, 
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Matricule</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{employee.id_employe}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: 12, 
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>CIN</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{employee.cin || '-'}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: 12, 
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>N° CNSS</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{employee.numero_cnss || '-'}</div>
                </div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={8}>
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: 12, 
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Situation Familiale</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{employee.situation_familiale || '-'}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: 12, 
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Nombre d'enfants</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{employee.nombre_enfants || 0}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: 12, 
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Enfants à charge</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{employee.enfants_a_charge || 0}</div>
                </div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={8}>
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: 12, 
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Catégorie</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{employee.categorie || '-'}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: 12, 
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Poste</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{employee.poste || '-'}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: 12, 
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Département</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{employee.departement || '-'}</div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* SALAIRE */}
          <Card 
            size="small" 
            style={{ 
              marginBottom: 20,
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              marginBottom: 16,
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: 6,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                backgroundColor: '#64748b', 
                borderRadius: '50%', 
                width: 28, 
                height: 28, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                💰
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Salaire et Primes</span>
            </div>
            <Row gutter={[16, 16]}>
              {[
                { name: 'salaire_base', label: 'Salaire Base Mensuel', icon: '🏢' },
                { name: 'prime_anciennete', label: "Prime d'ancienneté", icon: '⏰' },
                { name: 'indemnite_presence', label: 'Indemnité Présence', icon: '✅' },
                { name: 'indemnite_transport', label: 'Indemnité Transport', icon: '🚗' },
                { name: 'prime_langue', label: 'Prime de Langue', icon: '🗣️' },
                { name: 'jours_feries_payes', label: 'Jours Fériés Chômés Payés', icon: '🎉' },
                { name: 'absences_non_remunerees', label: 'Absences Non Rémunérées', icon: '❌' },
                { name: 'prime_ramadan', label: 'Prime de Ramadan', icon: '🌙' },
                { name: 'prime_teletravail', label: 'Prime de travail à domicile', icon: '💻' },
                { name: 'avantage_assurance', label: 'Avantage en Nature ASS GRP', icon: '🛡️' }
              ].map((field, i) => (
                <Col span={8} key={i}>
                  <Form.Item 
                    name={field.name} 
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151', fontWeight: 500 }}>
                        <span>{field.icon}</span>
                        <span>{field.label}</span>
                      </div>
                    }
                  >
                    <InputNumber 
                      min={0} 
                      style={{ width: '100%', height: 40, borderRadius: 6 }}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Card>
{/* AVANCES */}
<Card 
  size="small" 
  style={{ 
    marginBottom: 20,
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  }}
>
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 12, 
    marginBottom: 16,
    padding: '12px 16px',
    backgroundColor: '#fff7e6',
    borderRadius: 6,
    border: '1px solid #ffd591'
  }}>
    <div style={{ 
      backgroundColor: '#fa8c16', 
      borderRadius: '50%', 
      width: 28, 
      height: 28, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      💸
    </div>
    <span style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Avances sur Salaire</span>
  </div>

  {/* Affichage des avances existantes */}
 {employee?.avances && employee.avances.length > 0 && (
  <div style={{ marginBottom: 16 }}>
    <Text strong style={{ color: '#374151', marginBottom: 12, display: 'block' }}>
      📋 Avances en cours de remboursement :
    </Text>
    {employee.avances
      .filter(avance => avance.statut === 'Acceptée' && (avance.montant_rembourse || 0) < avance.montant)
      .map((avance, index) => {
        const montantRestant = avance.montant - (avance.montant_rembourse || 0);
        const moisRestants = avance.nbr_mensualite - (avance.mois_rembourses || 0);
        const avanceMensuelle = moisRestants > 0 ? montantRestant / moisRestants : 0;

        return (
          <div key={index} style={{ 
            backgroundColor: '#fff7e6', 
            padding: 12, 
            borderRadius: 6,
            border: '1px solid #ffd591',
            marginBottom: 8
          }}>
            <Row gutter={16}>
              <Col span={6}>
                <div style={{ fontSize: 12, color: '#8c4a00', fontWeight: 500 }}>Date demande</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                  {moment(avance.date_demande).format('DD/MM/YYYY')}
                </div>
              </Col>
              <Col span={6}>
                <div style={{ fontSize: 12, color: '#8c4a00', fontWeight: 500 }}>Montant total</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                  {avance.montant?.toLocaleString()} DT
                </div>
              </Col>
              <Col span={6}>
                <div style={{ fontSize: 12, color: '#8c4a00', fontWeight: 500 }}>Restant à rembourser</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#d46b08' }}>
                  {montantRestant?.toLocaleString()} DT
                </div>
              </Col>
              <Col span={6}>
                <div style={{ fontSize: 12, color: '#8c4a00', fontWeight: 500 }}>Déduction mensuelle</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#cf1322' }}>
                  {avanceMensuelle?.toLocaleString()} DT
                </div>
              </Col>
            </Row>
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={Math.round(((avance.mois_rembourses || 0) / avance.nbr_mensualite) * 100)}
                size="small"
                status="active"
                format={() => `${avance.mois_rembourses || 0}/${avance.nbr_mensualite} mois`}
              />
            </div>
          </div>
        );
      })}
  </div>
)}

   

  {/* Champ de saisie manuel */}
  <Row gutter={16}>
    <Col span={12}>
  <Form.Item 
  name="avance" 
  label={
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151', fontWeight: 500 }}>
      <span>💸</span>
      <span>Montant total à déduire ce mois-ci</span>
    </div>
  }
  tooltip="Ce montant est calculé automatiquement en fonction des avances en cours, mais vous pouvez le modifier si nécessaire."
  initialValue={calculateAvanceMensuelle() || 0}
>
  <InputNumber 
    min={0}
    style={{ width: '100%', height: 40, borderRadius: 6 }}
    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
    parser={value => value.replace(/\$\s?|(,*)/g, '')}
    placeholder="0"
    suffix=" DT"
  />
</Form.Item>

    </Col>
    <Col span={12}>
      <div style={{ 
        backgroundColor: '#f6ffed', 
        padding: 12, 
        borderRadius: 6,
        border: '1px solid #b7eb8f',
        marginTop: 30
      }}>
        <div style={{ fontSize: 12, color: '#389e0d', fontWeight: 500 }}>💡 Avance calculée automatiquement</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
          {calculateAvanceMensuelle()?.toLocaleString() || 0} DT
        </div>
      </div>
    </Col>
  </Row>
</Card>

          {/* CONGÉS */}
          <Card 
            size="small" 
            style={{ 
              marginBottom: 20,
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              marginBottom: 16,
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: 6,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                backgroundColor: '#64748b', 
                borderRadius: '50%', 
                width: 28, 
                height: 28, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                🏖️
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Congés</span>
            </div>
            <Row gutter={[16, 16]}>
              {[
                { name: 'conge_precedent', label: 'C. Période Précédente:', icon: '⏮️' },
                { name: 'conge_acquis', label: 'C. Acquis Mois en cours', icon: '➕' },
                { name: 'conge_pris', label: 'C. Pris Mois en cours', icon: '✈️' },
                { name: 'conge_restant', label: 'C. Reste à prendre', icon: '🏖️' },
                { name: 'conge_speciaux', label: 'C. Spéciaux', icon: '⭐' },
                { name: 'conge_maladie_m', label: 'Cong. maladie M', icon: '🏥' },
                { name: 'conge_maladie_a', label: 'Cong. Maladie A', icon: '🚑' },
              ].map((field, i) => (
                <Col span={8} key={i}>
                  <Form.Item 
                    name={field.name} 
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151', fontWeight: 500 }}>
                        <span>{field.icon}</span>
                        <span>{field.label}</span>
                      </div>
                    }
                  >
                    <InputNumber 
                      min={0} 
                      style={{ width: '100%', height: 40, borderRadius: 6 }}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Card>

          {/* BANCAIRE */}
          <Card 
            size="small" 
            style={{ 
              marginBottom: 20,
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              marginBottom: 16,
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: 6,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                backgroundColor: '#64748b', 
                borderRadius: '50%', 
                width: 28, 
                height: 28, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                🏦
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Informations Bancaires</span>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="banque" 
                  label={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151', fontWeight: 500 }}>
                      <span>🏛️</span>
                      <span>Nom de la Banque</span>
                    </div>
                  }
                >
                  <Input 
                    style={{ height: 40, borderRadius: 6 }}
                    placeholder="Ex: Banque Populaire"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="rib" 
                  label={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151', fontWeight: 500 }}>
                      <span>💳</span>
                      <span>RIB</span>
                    </div>
                  }
                >
                  <Input 
                    style={{ height: 40, borderRadius: 6 }}
                    placeholder="Ex: 230 240 0000123456789 12"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* RÉSUMÉ */}
          <Card 
            size="small" 
            style={{ 
              marginBottom: 20,
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              marginBottom: 20,
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: 6,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                backgroundColor: '#64748b', 
                borderRadius: '50%', 
                width: 28, 
                height: 28, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                📊
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Résumé des Calculs</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ 
                backgroundColor: '#f8fafc', 
                padding: 16, 
                borderRadius: 6,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  TOTAL BRUT
                </div>
                <div style={{ color: '#1f2937', fontSize: 18, fontWeight: 700 }}>
                  {resume.totalBrut?.toLocaleString() || 0} 
                </div>
              </div>
              <div style={{ 
                backgroundColor: '#f8fafc', 
                padding: 16, 
                borderRadius: 6,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  SALAIRE IMPOSABLE
                </div>
                <div style={{ color: '#1f2937', fontSize: 18, fontWeight: 700 }}>
                  {resume.salaireImposable?.toLocaleString() || 0} 
                </div>
              </div>
              <div style={{ 
                backgroundColor: '#f8fafc', 
                padding: 16, 
                borderRadius: 6,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  CNSS SALARIÉ (9.18%)
                </div>
                <div style={{ color: '#1f2937', fontSize: 18, fontWeight: 700 }}>
                  {resume.cnssSalarie?.toLocaleString() || 0} 
                </div>
              </div>
              <div style={{ 
                backgroundColor: '#f8fafc', 
                padding: 16, 
                borderRadius: 6,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  IRPP
                </div>
                <div style={{ color: '#1f2937', fontSize: 18, fontWeight: 700 }}>
                  {resume.irpp?.toLocaleString() || 0} 
                </div>
              </div>
              <div style={{ 
                backgroundColor: '#f8fafc', 
                padding: 16, 
                borderRadius: 6,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  CSS
                </div>
                <div style={{ color: '#1f2937', fontSize: 18, fontWeight: 700 }}>
                  {resume.css?.toLocaleString() || 0} 
                </div>
              </div>
              <div style={{ 
                backgroundColor: '#f8fafc', 
                padding: 16, 
                borderRadius: 6,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Total Cotisations Salariales
                </div>
                <div style={{ color: '#1f2937', fontSize: 18, fontWeight: 700 }}>
                  {resume.totalCotisations?.toLocaleString() || 0} 
                </div>
              </div>
              <div style={{ 
                backgroundColor: '#f8fafc', 
                padding: 16, 
                borderRadius: 6,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  CNSS PATRONAL (16.07%)
                </div>
                <div style={{ color: '#1f2937', fontSize: 18, fontWeight: 700 }}>
                  {resume.cnssPatronal?.toLocaleString() || 0} 
                </div>
              </div>
              <div style={{ 
                backgroundColor: '#f8fafc', 
                padding: 16, 
                borderRadius: 6,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  ACCIDENT DE TRAVAIL (0.5%)
                </div>
                <div style={{ color: '#1f2937', fontSize: 18, fontWeight: 700 }}>
                  {resume.accidentTravail?.toLocaleString() || 0} 
                </div>
              </div>
              <div style={{ 
                backgroundColor: '#f8fafc', 
                padding: 16, 
                borderRadius: 6,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  TOTAL CHARGES PATRONALES
                </div>
                <div style={{ color: '#1f2937', fontSize: 18, fontWeight: 700 }}>
                  {resume.chargesPatronales?.toLocaleString() || 0} 
                </div>
              </div>
            </div> 
            <div style={{ 
              marginTop: 24, 
              padding: 20, 
              backgroundColor: '#f0f9ff', 
              borderRadius: 8,
              border: '2px solidrgb(83, 144, 235)',
              textAlign: 'center'
            }}>
              <div style={{ color: '#001F3F', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                SALAIRE NET À PAYER
              </div>
              <div style={{ color: '#001F3F', fontSize: 28, fontWeight: 800 }}>
                {resume.salaireNet?.toLocaleString() || 0} 
              </div>
            </div>
            <div style={{ 
  backgroundColor: '#fff7e6', 
  padding: 16, 
  borderRadius: 6,
  border: '1px solid #ffd591'
}}>
  <div style={{ color: '#d46b08', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
    SALAIRE NET AVANT AVANCE
  </div>
  <div style={{ color: '#1f2937', fontSize: 18, fontWeight: 700 }}>
    {resume.salaireNetAvantAvance?.toLocaleString() || 0} DT
  </div>
</div>

<div style={{ 
  backgroundColor: '#fff1f0', 
  padding: 16, 
  borderRadius: 6,
  border: '1px solid #ffccc7'
}}>
  <div style={{ color: '#cf1322', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
    AVANCE À DÉDUIRE
  </div>
  <div style={{ color: '#1f2937', fontSize: 18, fontWeight: 700 }}>
    -{resume.avance?.toLocaleString() || 0} DT
  </div>
</div>

<div style={{ 
  backgroundColor: '#f6ffed', 
  padding: 16, 
  borderRadius: 6,
  border: '1px solid #b7eb8f'
}}>
  <div style={{ color: '#389e0d', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
    TOTAL DÉDUCTIONS (Cotisations + Avance)
  </div>
  <div style={{ color: '#1f2937', fontSize: 18, fontWeight: 700 }}>
    {resume.totalDeductions?.toLocaleString() || 0} DT
  </div>
</div>

          </Card>
        </Form>
      </Modal>
    </div>
  );
};
export default EmployeePayrollDetails;
