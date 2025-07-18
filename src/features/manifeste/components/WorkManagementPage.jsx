import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Typography,
  Button,
  message,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Popconfirm,
  Spin,
  Divider,
  Card,
  List,
  Tag,
  Badge,
  DatePicker,
  Row,
  Col,
  Tooltip,
  Flex,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  PrinterOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import debounce from "lodash/debounce";
import moment from "moment";
// Import our new PDF API service
import PdfApiService from "../services/PdfApiService";
import WorkService from "../services/WorkService";
import ClientService from "../services/ClientService";
import ProductService from "../services/ProductService";
// Import the RawMaterialService and InvoiceService
import RawMaterialService from "../services/RawMaterialService";
import InvoiceService from "../services/InvoiceService"; // Import CSS
import "./WorkManagementPage.css";
import { getApiService } from "../../../services/apiServiceFactory";
import BonLivraisonDecoupePdfService from "../../../services/BonLivraisonDecoupePdfService"; // si pas déjà importé
import { BuildOutlined } from "@ant-design/icons";
import MaterialAchatService from "../../purshase/Services/MaterialAchatService";
const { Option } = Select;
const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { cdsService } = getApiService();

const WorkManagementPage = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [billModalTarget, setBillModalTarget] = useState('');
  const [editingWork, setEditingWork] = useState(null);
  const [form] = Form.useForm();
  const [created, setCreated] = useState(false);

  // For client and product selection
  const [clientOptions, setClientOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [productSearchLoading, setProductSearchLoading] = useState(false);

  const [materialSource, setMaterialSource] = useState('');
  // For material selection (stock rmmetalaser)
  const [materialForm] = Form.useForm();
  const [availableMaterial, setAvailableMaterial] = useState([]);
  const [isMaterialModalVisible, setIsMaterialModalVisible] = useState(false);
  const [currentMaterialsInDrawer, setCurrentMaterialsInDrawer] = useState([]);
  const [newOrderMaterials, setNewOrderMaterials] = useState([]);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Add new state for client materials - RESTORED
  const [clientMaterials, setClientMaterials] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Add state for bill generation
  const [billableData, setBillableData] = useState([]);
  const [isBillModalVisible, setIsBillModalVisible] = useState(false);
  const [taxRate, setTaxRate] = useState(19); // Default tax rate of 19%
  const [timbreFiscal, setTimbreFiscal] = useState(0); // Default 
  const [billDate, setBillDate] = useState(moment().format("YYYY-MM-DD"));
  const [invoiceNumber, setInvoiceNumber] = useState(""); // State for invoice number

  // Add new state for client filter
  const [selectedClientFilter, setSelectedClientFilter] = useState(null);
  const [dateRangeFilter, setDateRangeFilter] = useState(null); // Pour la plage de dates

  // Add state for selected rows
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRowsData, setSelectedRowsData] = useState([]);
  // const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [TraiteMessage, setTraiteMessage] = useState(null);

  const formatCurrency = (amount, currency = " ") => {
    return new Intl.NumberFormat("fr-TN", {
      style: "decimal",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount || 0);
  };
  
  useEffect(() => {
    if (created) {
      console.log("✅ Modal.success triggered");
      Modal.success({
        title: "Facture créée avec succès",
        content: "La facture a bien été générée et enregistrée.",
        centered: true,
        onOk: () => setCreated(false),
        afterClose: () => setCreated(false),
      });
    }
  }, [created]);

  useEffect(() => {
    if (created) {
      const timer = setTimeout(() => {
        setCreated(false);
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [created]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchWorks();
    fetchInitialOptions();
  }, [selectedClientFilter]); // Re-fetch works when client filter changes
const fetchWorks = async () => {
  setLoading(true);
  try {
    let data;
    if (selectedClientFilter) {
      data = await WorkService.getWorksByClientId(selectedClientFilter);
    } else {
      data = await WorkService.getAllWorks();
    }

    // Appliquer le filtre par date si nécessaire
    if (dateRangeFilter && dateRangeFilter.length === 2) {
      const [startDate, endDate] = dateRangeFilter;
      const start = startDate.startOf("day").valueOf();
      const end = endDate.endOf("day").valueOf();

      data = data.filter((work) => {
        const workDate = moment(work.date_creation).valueOf(); // ou une autre date pertinente
        return workDate >= start && workDate <= end;
      });
    }

    setWorks(data);
  } catch (error) {
    message.error("Erreur lors du chargement des travaux");
  } finally {
    setLoading(false);
  }
};

  const fetchInitialOptions = async () => {
    try {
      // Fetch initial clients for dropdown
      const clients = await ClientService.getAllClients();
      setClientOptions(
        clients.map((client) => ({
          label: client.nom_client,
          value: client.id,
        }))
      );

      // Fetch initial products for dropdown
      const products = await ProductService.getAllProducts();
      setProductOptions(
        products.map((product) => ({
          label: product.nom_produit,
          value: product.id,
        }))
      );
    } catch (error) {
      message.error("Erreur lors du chargement des options");
    }
  };

  const handleSearch = async (value, type) => {
    if (value.length < 2) return;

    if (type === "client") {
      setClientSearchLoading(true);
      try {
        const clients = await ClientService.searchClients(value);
        setClientOptions(
          clients.map((client) => ({
            label: client.nom_client,
            value: client.id,
          }))
        );
      } catch (error) {
        console.error("Error searching clients:", error);
      } finally {
        setClientSearchLoading(false);
      }
    } else if (type === "product") {
      setProductSearchLoading(true);
      try {
        const products = await ProductService.searchProducts(value);
        setProductOptions(
          products.map((product) => ({
            label: product.nom_produit,
            value: product.id,
          }))
        );
      } catch (error) {
        console.error("Error searching products:", error);
      } finally {
        setProductSearchLoading(false);
      }
    }
  };

  const debouncedSearch = debounce(handleSearch, 500);

  const handleAdd = () => {
    form.resetFields();
    setMaterialSource('')
    setCurrentMaterialsInDrawer([])
    setEditingWork(null);
    setIsModalVisible(true);
  };

  const handleEdit = async (record) => {
    setEditingWork(record);
    setMaterialSource(record.matiere_usages?.[0]?.source)
    const source = record.matiere_usages?.[0]?.source
    form.setFieldsValue({
      client_id: record.client_id,
      source: record.matiere_usages?.[0]?.source,
      produit_id: record.produit_id,
      duree: record.duree,
      quantite: record.quantite,
      description: record.description,
    });

    // Fetch materials for this client - RESTORED
    let materials = []
      if (record.client_id) {
        materials = await handleClientChange(record.client_id);
      }
    if(materialSource=='client'){
      try {
        materials = await RawMaterialService.get_materials_by_client_id(
          record.client_id
        );
        setClientMaterials(materials);
      } catch (error) {
        console.error("Error fetching client materials:", error);
      }
    }
    
    // A supprimer
    // Pre-populate selected materials if record has matiere_usages - RESTORED
    if (record.matiere_usages && record.matiere_usages.length > 0) {
      const initialSelectedMaterials = record.matiere_usages.map((usage) => ({
        materialId: usage.material_id,
        quantite: usage.quantite_utilisee,
      }));

      const enrichedMaterials = record.matiere_usages.map(usage => {
        const mat = (source=='stock' ? availableMaterial : materials).find(m => (m.id || m.materialId) === (usage.material_id || usage.matiere_id));
        return {
          matiere_id: usage.material_id || mat.materialId,
          nom_matiere: mat?.nom_matiere || mat?.type_matiere || "Unknown",
          quantite: usage.quantite_utilisee,
          source: materialSource,
          ...(source=='stock' ? 
            {
              prix_unitaire: mat?.prix_unitaire || 0,
              prix_total: mat?.prix_unitaire * usage.quantite_utilisee || 0,
            } : {})
        };
      });

      setCurrentMaterialsInDrawer(enrichedMaterials || [])
      setSelectedMaterials(enrichedMaterials || []);
    } else {
      setSelectedMaterials([]);
    }
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await WorkService.deleteWork(id);
      message.success("Travail supprimé avec succès");
      fetchWorks();
    } catch (error) {
      message.error("Erreur lors de la suppression");
    }
  };

  // handleClientChange - RESTORED
  const handleClientChange = async (clientId) => {
    if (!clientId) {
      setClientMaterials([]);
      setSelectedMaterials([]);
      return;
    }

    setLoadingMaterials(true);
    try {
      console.log("Fetching materials for client ID:", clientId);
      const materials = await RawMaterialService.get_materials_by_client_id(
        clientId
      );
      console.log("Retrieved materials:", materials);
      setClientMaterials(materials);
      setSelectedMaterials([]); // Reset selected materials when client changes
      return materials;
    } catch (error) {
      console.error("Error fetching client materials:", error);
      message.error(
        "Erreur lors du chargement des matières premières du client."
      );
      return []
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Matière première du stock RM Metalaser
  useEffect(()=>{
    fetchAvailableMaterial()
  }, [isMaterialModalVisible])

  const fetchAvailableMaterial = useCallback(async () => {
    try {
      const response = await MaterialAchatService.getAllMaterial();
      // Check if response has a results property (paginated response)
      const material = response.results ? response.results : response;
      setAvailableMaterial(material);
    } catch (err) {
      console.error("Error fetching products:", err);
      message.error("Failed to fetch available products: " + err.message);
    }
  }, []);
  
  const handleAddMaterialToDrawerOrder = () => {
    materialForm.resetFields();
    setIsMaterialModalVisible(true);
  };

  const handleMaterialModalSave = async () => {
    try{
      const values = await materialForm.validateFields();
      const materialDetails = (materialSource == 'stock' ? availableMaterial : clientMaterials).find(
        (m) => m.id === values.matiere_id 
      );
      if (!materialDetails) {
      message.error("Selected material not found.");
      return;
      }
      if(editingMaterial){
        const updatedMaterials = currentMaterialsInDrawer.map((m) =>
            m.matiere_id === editingMaterial.matiere_id
              ? {
                  ...m,
                  quantite: values.quantite,
                  prix_unitaire: m.prix_unitaire,
                  source : materialSource,
                  prix_total:
                    values.quantite *
                    m.prix_unitaire
                  }
                  : m
          );
        setCurrentMaterialsInDrawer(updatedMaterials);
        setEditingMaterial(null);
        setIsMaterialModalVisible(false);
        message.success("Matière modifiée avec succès");
      }else{
        const newMaterialData = {
            matiere_id: values.matiere_id,
            nom_matiere: materialDetails.nom_matiere || materialDetails.type_matiere,
            quantite: values.quantite,
            source: materialSource,
            ...(materialSource === "stock"
              ? {
                  prix_unitaire: materialDetails.prix_unitaire,
                  prix_total: materialDetails.prix_unitaire * values.quantite,
                }
              : {}),
        };
        let updatedNewOrderMaterials = [...currentMaterialsInDrawer, newMaterialData];
        setIsMaterialModalVisible(false);
        message.success("Matière ajoutée à la commande");
        setSelectedMaterials(updatedNewOrderMaterials)
        setNewOrderMaterials(updatedNewOrderMaterials);
        setCurrentMaterialsInDrawer(updatedNewOrderMaterials);
      }
    }catch(e){
      console.error("Failed to save order : ", e)
      message.error("Échec de la sauvegarde. " + (e.message || "Check console for details."));
    }
  }

  const handleRemoveMaterialFromDrawerOrder = async (materialIdToRemove) => {
      try {
        // if (isCreating) {
          const updatedMaterials = currentMaterialsInDrawer.filter(
            (m) => m.matiere_id !== materialIdToRemove 
          );
          setNewOrderMaterials(updatedMaterials);
          setCurrentMaterialsInDrawer(updatedMaterials);
        // } else {
        //   // For existing order, find the product to get the correct produit_id
        //   const productToRemove = currentProductsInDrawer.find(
        //     (p) => p.id === produitIdToRemove
        //   );
  
        //   if (!productToRemove) {
        //     message.error("Produit non trouvé");
        //     return;
        //   }
  
        //   // Use produit_id instead of the PdC id for removal
        //   const actualProductId =
        //     productToRemove.produit_id || productToRemove.produit;
  
        //   await cdsService.removeProductFromOrder(
        //     editingOrder.id,
        //     actualProductId // Send the actual product ID, not the PdC ID
        //   );
        //   const updatedProducts = currentProductsInDrawer.filter(
        //     (p) => p.id !== produitIdToRemove
        //   );
        //   setCurrentProductsInDrawer(updatedProducts);
        //   recalculateTotalsInDrawer(
        //     updatedProducts,
        //     currentTaxRate,
        //     currentBonInDrawer
        //   );
        // }
        message.success("Material removed.");
      } catch (error) {
        console.error("Failed to remove material:", error);
        message.error("Failed to remove material: " + error.message);
      }
    };


  // handleMaterialSelect - RESTORED
  const handleMaterialSelect = (materialId, quantite) => {
    const existingIndex = selectedMaterials.findIndex(
      (m) => m.materialId === materialId
    );

    if (quantite === null || quantite === 0) {
      // If quantity is cleared or zero, remove it
      if (existingIndex >= 0) {
        setSelectedMaterials(
          selectedMaterials.filter((m) => m.materialId !== materialId)
        );
      }
      return;
    }

    if (existingIndex >= 0) {
      const updatedMaterials = [...selectedMaterials];
      updatedMaterials[existingIndex].quantite = quantite;
      setSelectedMaterials(updatedMaterials);
    } else {
      setSelectedMaterials([...selectedMaterials, { materialId, quantite }]);
    }
  };

  // handleRemoveMaterial - RESTORED
  const handleRemoveMaterial = (materialId) => {
    setSelectedMaterials(
      selectedMaterials.filter((m) => m.materialId !== materialId)
    );
  };

  const handleSubmit = async (values) => {
    try {
      // setFormError(null);
      setSuccessMessage(null);
      const adjustedMaterials = (currentMaterialsInDrawer)
        .filter((m) => m.quantite && m.quantite > 0)
        .map((m) => ({
          matiere_id: m.materialId || m.matiere_id || m.material_id || m.id,
          nom_matiere: m.nom_matiere,
          quantite_utilisee: m.quantite,
          source: materialSource,
        }))
      // if (adjustedMaterials.length === 0) {
      //   setFormError(
      //     "Veuillez sélectionner au moins une matière première avec une quantité valide."
      //   );
      //   return;
      // }

      const workData = {
        ...values,
        matiere_usages: adjustedMaterials,
      };

      if (editingWork) {
        await WorkService.updateWork(editingWork.id, workData);
        setIsModalVisible(false);
        setSuccessMessage("Travail mis à jour avec succès !");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        await WorkService.createWork(workData);
        setIsModalVisible(false);
        setSuccessMessage("Travail ajouté avec succès !");
        setTimeout(() => setSuccessMessage(null), 3000);
      }

      fetchWorks();
      form.resetFields();
      setSelectedMaterials([]);
      setClientMaterials([]);
    } catch (error) {
      const detail = error?.response?.data;
      // if (detail?.matiere_usages) {
      //   setFormError(
      //     "Une ou plusieurs matières premières sont invalides ou incomplètes."
      //   );
      //   setTimeout(() => setFormError(null), 4000);
      // } else {
        // setFormError(
        //   "Erreur lors de la création du travail. Veuillez vérifier les champs."
        // );
        // setTimeout(() => setFormError(null), 4000);
      // }
    }
  };

  // Function to handle selected works and prepare bill data
  const handleProcessSelectedWorks = async () => {
    try {
      if (!selectedRowsData || selectedRowsData.length === 0) {
        message.error("Aucun travail sélectionné");
        return;
      }

      // Show loading
      message.loading({
        content: "Récupération des détails...",
        key: "materialsLoading",
      });
      // Process each work to add client and material details
      const enrichedWorksData = await Promise.all(
        selectedRowsData.map(async (work) => {
          const enrichedWork = { ...work };

          // Ensure client_id is always included and available
          if (!work.client_id && work.client?.id) {
            enrichedWork.client_id = work.client.id;
          }

          // If client data is not already present, fetch it
          if (enrichedWork.client_id && (!work.clientDetails || !work.client)) {
            try {
              const clientData = await ClientService.getClientById(
                enrichedWork.client_id
              );
              enrichedWork.clientDetails = {
                id: clientData.id, // Ensure client ID is preserved
                nom_cf: clientData.nom_client,
                adresse: clientData.adresse,
                matricule_fiscale: clientData.numero_fiscal,
                tel: clientData.telephone,
                email: clientData.email,
                nom_responsable: clientData.nom_responsable,
                email_responsable: clientData.email_responsable,
                telephone_responsable: clientData.telephone_responsable,
                autre_numero: clientData.autre_numero,
              };
            } catch (error) {
              console.error(
                `Error fetching client ${enrichedWork.client_id}:`,
                error
              );
            }
          } else if (work.client) {
            // If client data is already present, still format it consistently
            enrichedWork.clientDetails = {
              id: work.client.id, // Ensure client ID is preserved
              nom_cf: work.client.nom_client,
              adresse: work.client.adresse,
              matricule_fiscale: work.client.numero_fiscal,
              tel: work.client.telephone,
              email: work.client.email,
              nom_responsable: work.client.nom_responsable,
              email_responsable: work.client.email_responsable,
              telephone_responsable: work.client.telephone_responsable,
              autre_numero: work.client.autre_numero,
            };
          }

          // Ensure product details, including unit price, are available for billing
          let productUnitPrice = 0;
          if (work.produit && typeof work.produit.prix !== "undefined") {
            productUnitPrice = work.produit.prix;
          } else if (work.produit_id) {
            try {
              const productDetails = await ProductService.getProductById(
                work.produit_id
              );
              if (productDetails) {
                productUnitPrice = productDetails.prix;
                enrichedWork.produit = productDetails;

                enrichedWork.code_produit =
                  productDetails.code_produit || "N/A";
              }
            } catch (error) {
              console.error(
                `Error fetching product details for ID ${work.produit_id}:`,
                error
              );
            }
          }

          if (typeof productUnitPrice !== "number" || isNaN(productUnitPrice)) {
            productUnitPrice = 0; // Default to 0 if undefined, null, or NaN
          }

          // If material usage data is present but missing details, enrich it
          if (work.matiere_usages && work.matiere_usages.length > 0) {
            const enrichedMaterialUsages = await Promise.all(
              work.matiere_usages.map(async (usage) => {
                // If the usage already has all necessary data, just return it
                if (
                  usage.nom_matiere &&
                  usage.type_matiere &&
                  usage.prix_unitaire
                ) {
                  return usage;
                }

                try {
                  // Get material details
                  const materialDetail =
                    await (usage.source=='client'?RawMaterialService:MaterialAchatService).getMaterialById(usage.material_id);
                  return {
                    ...usage,
                    nom_matiere:
                      materialDetail.nom_matiere || materialDetail.designation,
                    type_matiere: materialDetail.type_matiere || materialDetail.categorie,
                    prix_unitaire: materialDetail.prix_unitaire || 0,
                    thickness: materialDetail.thickness ||  materialDetail.epaisseur,
                    length: materialDetail.length || materialDetail.longueur,
                    width: materialDetail.width ||  materialDetail.largeur,
                  };
                } catch (error) {
                  console.error(
                    `Error fetching material details for ID ${usage.matiere_id}:`,
                    error
                  );
                  return usage;
                }
              })
            );
            enrichedWork.matiere_usages = enrichedMaterialUsages;

          }

          // Add billable data fields with default values
          enrichedWork.billable = {
            date_facturation: moment().format("YYYY-MM-DD"),
            prix_unitaire_produit: productUnitPrice, // Use fetched product unit price as default
            quantite_produit: enrichedWork.quantite || 1, // Quantity of the product
            taxe: taxRate,
            timbre_fiscal: timbreFiscal,
            remise_pourcentage: enrichedWork.remise || 0,
            remise: (enrichedWork.remise / 100) * (enrichedWork.quantite * productUnitPrice) || 0,
            // total_ht will be calculated dynamically in the modal/PDF
          };

          return enrichedWork;
        })
      );

      console.log(
        "Enriched works data with client details:",
        enrichedWorksData
      );

      // Hide loading
      message.success({
        content: "Détails récupérés",
        key: "materialsLoading",
        duration: 1,
      });

      // Set the billable data
      setBillableData(enrichedWorksData);
      const invoicesData = await InvoiceService.getAllInvoices();

      // Generate invoice number using InvoiceService
      const generatedInvoiceNumber = InvoiceService.generateInvoiceNumber(
        invoicesData.results
      );
      setInvoiceNumber(generatedInvoiceNumber);

      // Show the bill modal
      setIsBillModalVisible(true);
    } catch (error) {
      console.error("Error processing selected works:", error);
      message.error("Erreur lors du traitement des travaux sélectionnés");
    }
  };
  const sendDataToFacture = async () => {
    try {
      // Fallback: if billableData is empty, process selectedRowsData on the fly
      console.log(billableData)
      let workingData = billableData;
      if (!billableData || billableData.length === 0) {
        if (!selectedRowsData || selectedRowsData.length === 0) {
          message.error("Aucun travail sélectionné");
          return;
        }

        message.loading({
          content: "Préparation de la facture...",
          key: "facturePrep",
        });

        workingData = await Promise.all(
          selectedRowsData.map(async (work) => {
            const enrichedWork = { ...work };
            console.log(work)
            if (!work.client_id && work.client?.id) {
              enrichedWork.client_id = work.client.id;
            }

            if (
              enrichedWork.client_id &&
              (!work.clientDetails || !work.client)
            ) {
              const clientData = await ClientService.getClientById(
                enrichedWork.client_id
              );
              enrichedWork.clientDetails = {
                id: clientData.id,
                nom_cf: clientData.nom_client,
                adresse: clientData.adresse,
                matricule_fiscale: clientData.numero_fiscal,
                tel: clientData.telephone,
                email: clientData.email,
                nom_responsable: clientData.nom_responsable,
                email_responsable: clientData.email_responsable,
                telephone_responsable: clientData.telephone_responsable,
                autre_numero: clientData.autre_numero,
              };
            }

            let productUnitPrice = 0;
            if (work.produit && typeof work.produit.prix !== "undefined") {
              productUnitPrice = work.produit.prix;
            } else if (
              work.produit_id &&
              (!work.produit || !work.produit.code_produit)
            ) {
              try {
                const productDetails = await ProductService.getProductById(
                  work.produit_id
                );
                if (productDetails) {
                  enrichedWork.produit = productDetails;
                  enrichedWork.code_produit =
                    productDetails.code_produit || "N/A";
                }
              } catch (err) {
                console.warn("Could not fetch full product:", err);
              }
            }
            console.log(
              "✅ Processed work:",
              enrichedWork.produit?.code_produit
            );

            if (work.matiere_usages?.length > 0) {
              enrichedWork.matiere_usages = await Promise.all(
                work.matiere_usages.map(async (usage) => {
                  if (usage.nom_matiere && usage.prix_unitaire) return usage;
                  const mat = await RawMaterialService.getMaterialById(
                    usage.matiere_id
                  );
                  return {
                    ...usage,
                    nom_matiere: mat.nom_matiere || mat.designation,
                    type_matiere: mat.type_matiere,
                    prix_unitaire: mat.prix_unitaire || 0,
                    thickness: mat.thickness,
                    length: mat.length,
                    width: mat.width,
                  };
                })
              );
            }

            enrichedWork.billable = {
              date_facturation: moment().format("YYYY-MM-DD"),
              prix_unitaire_produit: productUnitPrice,
              quantite_produit: enrichedWork.quantite || 1,
              taxe: taxRate,
              timbre_fiscal: timbreFiscal,
              remise: enrichedWork.remise || 0,
            };

            return enrichedWork;
          })
        );

        setBillableData(workingData);
        message.success({
          content: "Données enrichies",
          key: "facturePrep",
          duration: 1,
        });
      }

      // From here: build orderPayload and send API request
      const client =
        workingData[0].clientDetails || workingData[0].client || {};
      const selectedClientId = client.id;

      let finalMontantHt = 0;

      const produits = workingData.flatMap((item) => {
        const produitId = item.produit_id || item.produit?.id;
        const quantite = item.billable?.quantite_produit || 0;
        const prixUnitaire = item.billable?.prix_unitaire_produit || 0;
        const remisePourcentage = item.billable?.remise_pourcentage || 0;
        const remise = (remisePourcentage / 100) * (quantite * prixUnitaire);

        const produitTotal = quantite * prixUnitaire - remise;
        finalMontantHt += produitTotal;

        const productLine = [
          {
            produit: produitId,
            quantite,
            prix_unitaire: prixUnitaire,
            remise_pourcentage: 0,
          },
        ];

        const materialLines =
          item.matiere_usages?.map((mat) => {
            const matTotal =
              (mat.prix_unitaire || 0) * (mat.quantite_utilisee || 0);
            finalMontantHt += matTotal;

            return {
              produit: mat.matiere_id,
              quantite: mat.quantite_utilisee || 0,
              prix_unitaire: mat.prix_unitaire || 0,
              remise_pourcentage: 0,
            };
          }) || [];
          // return [...productLine, ...materialLines];
          return [...productLine];
      });
      const finalMontantTva = finalMontantHt * (taxRate / 100);
      const finalMontantTtc = finalMontantHt + finalMontantTva;
      // adjust products to match backend
      let formattedProducts = billableData.map((item)=>({
        ...item.produit,
        produit: item.produit.id, 
        quantite: item.billable.quantite_produit,
        prix_unitaire: item.billable.prix_unitaire_produit,
        remise_pourcentage: item.billable.remise_pourcentage,
        remise: item.billable.remise,
      }))
      const orderPayload = {
        client_id: selectedClientId,
        client: selectedClientId,
        date_commande: moment(billDate).format("YYYY-MM-DD"),
        date_livraison_prevue: billableData[0].billable.date_livraison, // All items have it
        statut: billableData[0].billable.statut,
        notes: "",
        conditions_paiement: "",
        mode_paiement:  billableData[0].billable.mode_paiement,
        tax_rate: billableData[0].billable.taxe,
        timbre_fiscal: billableData[0].billable.timbre_fiscal,
        montant_ht: finalMontantHt,
        montant_tva: finalMontantTva,
        montant_ttc: finalMontantTtc,
        type_facture:'produit',
        produits: formattedProducts,
        billableData,
      };

      console.log("Payload prêt à envoyer :", orderPayload);

      const response = await cdsService.createOrder(orderPayload);
      message.success("Facture créée avec succès !");
      console.log("Facture créée :", response);
      setCreated(true);
      return true;
    } catch (error) {
      console.error("Erreur facture :", error);
      message.error(error?.response?.data?.detail || "Erreur inconnue.");
      return false;
    }
  };

  // When fetching works, we should also get material details
  // Updated function to fetch complete material details for a work
  const fetchWorkWithMaterialDetails = async (workId) => {
    try {
      // Get the basic work data
      const workData = await WorkService.getWorkById(workId);

      if (!workData) return null;

      // If the work has material usages, fetch material details
      if (workData.matiere_usages && workData.matiere_usages.length > 0) {
        const enrichedMaterialUsages = await Promise.all(
          workData.matiere_usages.map(async (usage) => {
            try {
              // Get material details
              let materialDetail;
              if(usage.stock==='client'){
                materialDetail = await RawMaterialService.getMaterialById(
                  usage.material_id
                );
              }else{
                materialDetail = await MaterialAchatService.getMaterialById(
                  usage.material_id
                );
              }
              return { ...usage, ...materialDetail };
            } catch (error) {
              return usage; // Return original usage if fetching details fails
            }
          })
        );

        workData.matiere_usages = enrichedMaterialUsages;
      }

      return workData;
    } catch (error) {
      console.error("Error fetching work details:", error);
      return null;
    }
  };

  // Expanded row selection configuration to potentially fetch material details
  const rowSelection = {
    selectedRowKeys,
    onChange: async (keys, selectedRows) => {
      setSelectedRowKeys(keys);

      // If you need to fetch additional material details when selecting rows:
      
      const enrichedRows = await Promise.all(selectedRows.map(async (row) => {
        if (row.matiere_usages && row.matiere_usages.some(m => !m.nom_matiere)) {
          // If any material is missing details, fetch them
          const workWithDetails = await fetchWorkWithMaterialDetails(row.id);
          return workWithDetails || row;
        }
        return row;
      }));
      setSelectedRowsData(enrichedRows);
      
      // Otherwise just use the rows as they are
      setSelectedRowsData(selectedRows);
      console.log(
        "🔎 Selected rows:",
        selectedRows.map((item) => ({
          id: item.id,
          produit: item.produit,
          code_produit: item.produit?.code_produit,
        }))
      );
    },
  };

  const columns = [
    {
      title: "Client",
      dataIndex: "client_name",
      key: "client",
      render: (text, record) => (
        <Space>
          {record.client_name || record.client?.nom_client || "N/A"}
          {record.client_id && (
            <Link
              to={`/clients/${record.client_id}`}
              style={{ color: "inherit" }}
            >
              <ArrowRightOutlined style={{ fontSize: "12px" }} />
            </Link>
          )}
        </Space>
      ),
    },
    {
      title: "Produit",
      dataIndex: "produit_name",
      key: "produit",
      render: (text, record) => (
        <Space>
          {record.produit_name || record.produit?.nom_produit || "N/A"}
          {record.produit_id && (
            <Link
              to={`/products/${record.produit_id}`}
              style={{ color: "inherit" }}
            >
              <ArrowRightOutlined style={{ fontSize: "12px" }} />
            </Link>
          )}
        </Space>
      ),
    },
    {
      title: "Durée (minutes)",
      dataIndex: "duree",
      key: "duree",
    },
    {
      title: "Quantité",
      dataIndex: "quantite",
      key: "quantite",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      // RESTORED Matériaux utilisés column
      title: "Matériaux utilisés",
      key: "materials",
      render: (_, record) =>
        record.matiere_usages && record.matiere_usages.length > 0 ? (
          <span>{record.matiere_usages.length} matière(s) utilisée(s)</span>
        ) : (
          <span>Aucun</span>
        ),
    },
    {
      title: "Source",
      key: "source",
      render: (_, record) =>{
        const source = record.matiere_usages?.[0]?.source
         return source ? (
            <Tag color={source === 'client' ? 'green' : 'blue'}>
              {source.charAt(0).toUpperCase() + source.slice(1)}
            </Tag>
          ) : (
            <Tag color="default">Aucun</Tag>
          );
      },
    },
    {
      title: "Date de création",
      dataIndex: "date_creation",
      key: "date_creation",
      render: (date) =>
        date
          ? new Date(date).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Modifier">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce travail?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Tooltip title="Supprimer">
              <Button icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];


  // Function to prepare data for print and save bon
  const prepareInvoiceData = () => {
    if (!billableData || billableData.length === 0) return null;

    const clientRaw = billableData[0].clientDetails || billableData[0].client || {};
    const clientId = clientRaw?.id;

    let totalHT = 0;
    let totalTVA = 0;

    const invoiceItems = [];
    const lineItems = [];
    billableData.forEach((item) => {
      const remisePourcentage = item.billable?.remise_pourcentage || 0;
      const remise = (remisePourcentage / 100) * (item.billable.quantite_produit * item.billable.prix_unitaire_produit);
      const productTotal = (item.billable.prix_unitaire_produit || 0) * (item.billable.quantite_produit || 0) - remise;
      totalHT += productTotal;

      invoiceItems.push({
        code: item.code_produit || "",
        description:
          (item.produit_name || "N/A") +
          (item.description ? ` (${item.description})` : ""),
        quantity: item.billable.quantite_produit || item.quantite,
        unitPrice: item.billable.prix_unitaire_produit || 0,
        taxRate,
        remise,
        remise_percent: remisePourcentage
      });

      lineItems.push({
        work_id: item.id,
        produit_id: item.produit_id || item.produit?.id,
        produit_name: item.produit_name || item.produit?.nom_produit || "Produit inconnu",
        code_produit: item.code_produit || item.produit?.code_produit,
        description_travail: item.description,
        quantite_produit: item.billable.quantite_produit,
        remise_produit: remise,
        remise_percent_produit: remisePourcentage, 
        prix_unitaire_produit: item.billable.prix_unitaire_produit,
        matiere_usages: (item.matiere_usages || []).map((mat) => {
          const matTotal = (mat.prix_unitaire || 0) * (mat.quantite_utilisee || 0);
          if (matTotal > 0) totalHT += matTotal;

          return {
            matiere_id: mat.matiere_id,
            nom_matiere: mat.nom_matiere || mat.designation || "Matériau inconnu",
            type_matiere: mat.type_matiere || "",
            thickness: mat.thickness,
            length: mat.length,
            width: mat.width,
            quantite_utilisee: mat.quantite_utilisee,
            prix_unitaire: mat.prix_unitaire,
          };
        }),
      });
    });

    const fodec = totalHT * 0.01;
    totalTVA = (totalHT + fodec) * (taxRate / 100);
    const totalTTC = totalHT + fodec + totalTVA + timbreFiscal;

    return {
      clientId,
      invoiceItems,
      lineItems,
      totalHT,
      totalTVA,
      totalTTC,
      clientDetails: {
        nom_client: clientRaw.nom_cf || clientRaw.nom_client || "N/A",
        adresse: clientRaw.adresse || "N/A",
        numero_fiscal: clientRaw.matricule_fiscale || clientRaw.numero_fiscal || "N/A",
        telephone: clientRaw.tel || clientRaw.telephone || "N/A",
      },
    };
  };


  // Function to generate PDF from bill data using PDF API
  const generateBillPDF = async () => {
    const prepared = prepareInvoiceData();
    if (!prepared) {
      message.error("Aucune donnée à imprimer");
      return;
    }

    const invoiceData = {
      numero_facture: invoiceNumber,
      date_emission: billDate,
      tax_rate: taxRate,
      client_details: prepared.clientDetails,
      items: billableData.map((item) => {
        const quantity = item.billable.quantite_produit || 0;
        const unitPrice = item.billable.prix_unitaire_produit || 0;
        const remisePercent = item.billable.remise_pourcentage;
        const remise = (remisePercent / 100) * (quantity * unitPrice) || 0;

        return {
          code_produit: item.code_produit || "N/A",
          nom_produit: item.produit_name || item.produit?.nom_produit || "N/A",
          description: item.description || "",
          billable: {
            quantite: quantity,
            prix_unitaire: unitPrice,
            remise_percent: parseFloat(remisePercent.toFixed(2)),
            total_remise: remise,
            total_ht: quantity * unitPrice - remise,
          },
        };
      }),
      timbre_fiscal: timbreFiscal,
      total_ht: prepared.totalHT,
      total_tax: prepared.totalTVA,
      total_ttc: prepared.totalTTC,
    };
    console.log("Final invoice data being sent to PDF API:", invoiceData);
    try{
      // Use the PDF API service
      await BonLivraisonDecoupePdfService.generateDecoupeInvoicePDF(
        invoiceData,
        `facture-${billDate}-${invoiceNumber}.pdf`
      );

      message.success({
        content: "Facture générée avec succès!",
        key: "generatePDF",
      });
      return true;
    } catch (error) {
      console.error("Error generating PDF with API:", error);
      message.error({
        content: `Erreur lors de la génération de la facture: ${error.message}`,
        key: "generatePDF",
      });
      return false;
    }
  };


    // Function to save invoice data using InvoiceService
  const saveBillableData = async () => {
    const prepared = prepareInvoiceData();
    if (!prepared || !prepared.clientId) {
      message.error("Données invalides ou client manquant");
      return false;
    }
    console.log(prepared)
    const invoiceToPost = {
      client_id: prepared.clientId,
      client: prepared.clientId,
      numero_facture: invoiceNumber,
      tax_rate: taxRate,
      timbre_fiscal: timbreFiscal,
      date_emission: billDate,
      date_echeance: moment(billDate).add(30, "days").format("YYYY-MM-DD"),
      statut: "draft",
      line_items: prepared.lineItems,
    };
    try{
     // Log the data that will be posted
      console.log(
        "Data to be posted for invoice:",
        JSON.stringify(invoiceToPost, null, 2)
      );

      // Show loading message
      message.loading({
        content: "Enregistrement de la facture...",
        key: "savingInvoice",
      });

      // Use InvoiceService to save the invoice.
      // The InvoiceService.createInvoice method should be adapted to accept this single object.
      const savedInvoice = await InvoiceService.createInvoice(
        invoiceToPost,
        prepared.clientId  
      );
        setTraiteMessage ("Travail traité avec succée ! ") ;
        setTimeout(() => setTraiteMessage(null), 4000);
      message.success({
        content: "Facture enregistrée avec succès!",
        key: "savingInvoice",
        duration: 2,
      });
      console.log("Saved invoice response:", savedInvoice);

      // Optionally, update the local state if the backend returns the full saved invoice object
      // For example, if the backend assigns an ID to the invoice or line items:
      // setInvoiceNumber(savedInvoice.numero_facture); // If it can change or be assigned by backend
      // setBillableData( ... updated billableData with IDs from savedInvoice.line_items ... );

      return true;
    } catch (error) {
      console.error("Error saving invoice data:", error);
      const errorMessage =
        error.response?.data?.detail || error.message || "Erreur inconnue";
      message.error({
        content: `Erreur lors de l'enregistrement: ${errorMessage}`,
        key: "savingInvoice",
        duration: 4,
      });
      return false;
    }
  };   


  return (
    <Content style={{ padding: "24px", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ background: "#fff", padding: "24px", borderRadius: "2px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <Title level={2}>Gestion des Travaux</Title>
          {successMessage && (
            <div style={{   marginBottom: 16,
              padding: "12px",
              border: "1px solid #52c41a",
              backgroundColor: "#f6ffed",
              color: "#237804",
              borderRadius: "6px",
              fontWeight: 500,}}>
              ✅ {successMessage}
            </div>
          )}
           {/* {formError && (
              <div style={{    marginBottom: 16,
                padding: "12px",
                border: "1px solid #ff4d4f",
                backgroundColor: "#fff1f0",
                color: "#a8071a",
                borderRadius: "6px",
                fontWeight: 500, }}>
                {formError}
              </div>
            )} */}
          
          <Space>
            {selectedRowKeys.length > 0 && (
              <div>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={()=>{
                      handleProcessSelectedWorks()
                      setBillModalTarget('bon')
                    }
                  }
                  style={{ marginRight: 10 }}
                  >
                  Traiter {selectedRowKeys.length} travail(s) sélectionné(s)
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={async () => {
                    handleProcessSelectedWorks()
                    setBillModalTarget('facture')
                    // const success = await sendDataToFacture();
                    // if (success) {
                    //   setCreated(true);

                    //   return true;
                    // }
                  }}
                >
                  Créer une facture
                </Button>

                
                {created && (
                  <div
                    style={{
                      position: "fixed",
                      top: "20px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#52c41a",
                      color: "white",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      zIndex: 9999,
                      fontSize: "16px",
                      fontWeight: "500",
                      transition: "opacity 0.3s ease-in-out",
                    }}
                  >
                    ✅ Facture créée avec succès !
                  </div>
                )}
              </div>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Ajouter un travail
            </Button>
          </Space>
        </div>
        {TraiteMessage && (
            <div style={{   marginBottom: 16,
              padding: "12px",
              border: "1px solid #52c41a",
              backgroundColor: "#f6ffed",
              color: "#237804",
              borderRadius: "6px",
              fontWeight: 500,}}>
              ✅ {TraiteMessage}
            </div>
          )}
        <div
          style={{ marginBottom: 16, display: "flex", alignItems: "center" }}
        >
          <Text strong style={{ marginRight: 12 }}>
            Filtrer par client:
          </Text>
          <Select
            style={{ width: 300 }}
            placeholder="Sélectionnez un client ou 'Tous'"
            onChange={(value) => setSelectedClientFilter(value)}
            value={selectedClientFilter}
            allowClear
            options={[
              { label: "Tous les clients", value: null },
              ...clientOptions,
            ]}
            loading={clientSearchLoading}
          />
          <DatePicker.RangePicker
  style={{ marginLeft: 16 }}
  format="DD/MM/YYYY"
  placeholder={["Date début", "Date fin"]}
  value={dateRangeFilter}
  onChange={(dates) => setDateRangeFilter(dates)}
/>
       
          {/* Bouton pour effacer tous les filtres */}
<div style={{ marginLeft: 8 }}>
  <Button

    onClick={() => {
      setSelectedClientFilter(null);
      setDateRangeFilter(null);
    }}
  >
    Effacer les filtres
  </Button>
</div>
        </div>

        {selectedClientFilter && (
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">
              {clientOptions.find((c) => c.value === selectedClientFilter)
                ?.label || "Client sélectionné"}
            </Tag>
          </div>
        )}

        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Badge
              count={selectedRowKeys.length}
              style={{ backgroundColor: "#108ee9" }}
            >
              <Tag color="processing">Travaux sélectionnés</Tag>
            </Badge>
            <Button
              size="small"
              type="link"
              onClick={() => {
                setSelectedRowKeys([]);
                setSelectedRowsData([]);
              }}
            >
              Effacer la sélection
            </Button>
          </div>
        )}

        <Table
          rowSelection={rowSelection}
          loading={loading}
          columns={columns}
          dataSource={works}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title={editingWork ? "Modifier un travail" : "Ajouter un travail"}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false)
            setCurrentMaterialsInDrawer([])
          }}
          footer={null}
          width={800}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="client_id"
              label="Client"
              rules={[
                { required: true, message: "Veuillez sélectionner un client" },
              ]}
            >
              <Select
                showSearch
                placeholder="Rechercher un client..."
                filterOption={false}
                onSearch={(value) => debouncedSearch(value, "client")}
                onChange={(value) => {
                  console.log("Client selected:", value);
                  handleClientChange(value);
                }}
                loading={clientSearchLoading}
                notFoundContent={
                  clientSearchLoading ? <Spin size="small" /> : null
                }
                options={clientOptions}
              />
            </Form.Item>
            <Form.Item
              name="source"
              label="Source de la matière première"
              rules={[
                { required: true, message: "Veuillez sélectionner une source" },
              ]}
            >
              <Select
                placeholder="Choisir la source"
                onChange={(value) => {
                  setMaterialSource(value);
                }}
              >
                <Option
                  value={'client'}
                  >Matières premières client</Option>
                <Option
                  value={'stock'}
                >Stock RM Metalaser</Option>
              </Select>
            </Form.Item>

            {materialSource && (
            <>
              <Divider>Matières Premières{materialSource=='client'?' Client':''}</Divider>

              <Button
                type="dashed"
                onClick={handleAddMaterialToDrawerOrder}
                style={{ width: "100%", marginBottom: 16 }}
                icon={<PlusOutlined />}
              >
                Ajouter une matière première
              </Button>

              <Table
                dataSource={currentMaterialsInDrawer}
                rowKey="matiere_id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "Matière",
                    dataIndex: "nom_matiere",
                    key: "nom_matiere",
                  },
                  {
                    title: "Quantité",
                    dataIndex: "quantite",
                    key: "quantite",
                  },
                  ...(materialSource === "stock"
                    ? [
                        {
                          title: "Prix Unitaire",
                          dataIndex: "prix_unitaire",
                          key: "prix_unitaire",
                          render: (prix) => (prix != null ? formatCurrency(prix) : "-"),
                        },
                        {
                          title: "Prix Total",
                          dataIndex: "prix_total",
                          key: "prix_total",
                          render: (prix) => (prix != null ? formatCurrency(prix) : "-"),
                        },
                      ]
                    : []),
                  {
                    title: "Actions",
                    key: "actions",
                    render: (_, record) => (
                      <Space>
                        <Button
                          icon={<EditOutlined />}
                          size="small"
                          onClick={() => {
                            materialForm.setFieldsValue({
                              matiere_id: record.matiere_id,
                              quantite: record.quantite,
                            });
                            setEditingMaterial(record);
                            setIsMaterialModalVisible(true);
                          }}
                        />
                        <Tooltip title="Supprimer">
                          <Popconfirm
                            title="Êtes-vous sûr de vouloir supprimer cette matière?"
                            onConfirm={() =>
                              handleRemoveMaterialFromDrawerOrder(record.matiere_id)
                            }
                            okText="Oui"
                            cancelText="Non"
                          >
                            <Button danger icon={<DeleteOutlined />} size="small" />
                          </Popconfirm>
                        </Tooltip>
                      </Space>
                    ),
                  },
                ]}
              />

              <Divider />
            </>
          )}

            {/* Material Modal */}
            <Modal
              title={`Ajouter une matière première ${materialSource === 'client' ? 'pour ce client' : ''}`}
              open={isMaterialModalVisible}
              onOk={handleMaterialModalSave}
              onCancel={() => {
                setEditingMaterial(null);
                setIsMaterialModalVisible(false);
              }}
              okText={editingMaterial ? "Modifier" : "Ajouter"}
              cancelText="Annuler"
            >
              <Form form={materialForm} layout="vertical">
                <Form.Item
                  name="matiere_id"
                  label="Matière Première"
                  rules={[
                    { required: true, message: "Veuillez sélectionner une matière première" },
                    {
                      validator: (_, value) => {
                        const exists = currentMaterialsInDrawer.find(m => m.matiere_id === value);
                        if (!editingMaterial && exists) {
                          return Promise.reject(new Error("Cette matière est déjà ajoutée."));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Select
                    placeholder="Sélectionner une matière première"
                    disabled={!!editingMaterial}
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {(materialSource === 'stock' ? availableMaterial : clientMaterials).map((material) => (
                      <Option key={material.id} value={material.id}>
                        {(material.nom_matiere || material.type_matiere)} (
                          {(material.longueur || material.length || "-")}mm ×
                          {(material.largeur || material.width || "-")}mm ×
                          {(material.epaisseur || material.thickness || "-")}mm
                        )
                        {materialSource === 'stock' && ` - ${formatCurrency(material.prix_unitaire)} TND`}
                        {" - Stock : " + material.remaining_quantity}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="quantite"
                  label="Quantité"
                  rules={[{ required: true, message: "Veuillez saisir une quantité" }]}
                >
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
              </Form>
            </Modal>


            {/* RESTORED clientMaterials and selectedMaterials sections
            {materialSource == 'client' && false && clientMaterials.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Divider orientation="left">
                  Matières Premières Disponibles pour ce Client
                </Divider>
                <List
                  loading={loadingMaterials}
                  dataSource={clientMaterials}
                  renderItem={(material) => {
                    console.log(material)
                    const currentSelection = selectedMaterials.find(
                      (sm) => sm.materialId === material.id
                    );
                    return (
                      <List.Item>
                        <Card style={{ width: "100%" }} size="small">
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <Tag color="blue">
                                {material.type_matiere || material.materialType}
                              </Tag>
                              <span>
                                {material?.description || material?.designation || ""} (
                                {material?.thickness != null
                                  ? `${material.thickness}mm`
                                  : "-"}{" "}
                                ×
                                {material?.length != null
                                  ? `${material.length}mm`
                                  : "-"}{" "}
                                ×
                                {material?.width != null
                                  ? `${material.width}mm`
                                  : "-"}
                                )
                              </span>
                              <div>
                                <Text type="secondary">
                                  Disponible: {material.remaining_quantity}
                                </Text>
                              </div>
                            </div>
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <InputNumber
                                min={0} // Allow 0 to remove
                                max={material.remaining_quantity}
                                value={
                                  currentSelection
                                    ? currentSelection.quantite
                                    : undefined
                                }
                                onChange={(value) =>
                                  handleMaterialSelect(material.id, value)
                                }
                                addonAfter="pièces"
                                placeholder="Qté"
                                style={{ width: 140, marginRight: 8 }}
                              />
                              {currentSelection && (
                                <Button
                                  type="link"
                                  danger
                                  onClick={() =>
                                    handleRemoveMaterial(material.id)
                                  }
                                >
                                  Retirer
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      </List.Item>
                    );
                  }}
                />

                {selectedMaterials.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Title level={5}>
                      Matières sélectionnées pour ce travail
                    </Title>
                    <List
                      size="small"
                      bordered
                      dataSource={selectedMaterials}
                      renderItem={(item) => {
                        const material = clientMaterials.find(
                          (m) => m.id === item.materialId
                        );
                        return (
                          <List.Item>
                            <Text>
                              {material?.designation ||
                                material?.type_matiere ||
                                "Matériau inconnu"}{" "}
                              ({material?.thickness || "-"}mm) - {item.quantite}{" "}
                              pièce(s)
                            </Text>
                          </List.Item>
                        );
                      }}
                    />
                  </div>
                )}
              </div>
            )} */}

            <Form.Item
              name="produit_id"
              label="Produit"
              rules={[
                { required: true, message: "Veuillez sélectionner un produit" },
              ]}
            >
              <Select
                showSearch
                placeholder="Rechercher un produit..."
                filterOption={false}
                onSearch={(value) => debouncedSearch(value, "product")}
                loading={productSearchLoading}
                notFoundContent={
                  productSearchLoading ? <Spin size="small" /> : null
                }
                options={productOptions}
              />
            </Form.Item>

            <Form.Item
              name="duree"
              label="Durée (minutes)"
              rules={[{ required: true, message: "Veuillez saisir la durée" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="quantite"
              label="Quantité Produit" // Label changed for clarity
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir la quantité du produit",
                },
              ]}
            >
              <InputNumber min={0} step={1} style={{ width: "100%" }} />
            </Form.Item>
            {/* A supprimer */}
            {/* <Form.Item name="remise" label="Remise(%)">
              <InputNumber
                min={0}
                step={1}
                style={{ width: "100%" }}
                placeholder="Ex: 5"
              />
            </Form.Item> */}

            <Form.Item name="description" label="Description">
              <TextArea rows={4} placeholder="Description du travail..." />
            </Form.Item>

            <Divider />

            <Form.Item>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <Button
                  onClick={() => {
                    setIsModalVisible(false);
                    setSelectedMaterials([]);
                    setClientMaterials([]);
                    setCurrentMaterialsInDrawer([])
                    form.resetFields();
                  }}
                >
                  Annuler
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingWork ? "Mettre à jour" : "Ajouter"}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        {/* Bill Modal */}
        <Modal
          title={`Préparation ${billModalTarget=='bon'? 'du bon de livraison' : 'de la facture'}`}
          open={isBillModalVisible}
          width={900}
          onCancel={() => setIsBillModalVisible(false)}
          footer={[
            <Button key="back" onClick={() => setIsBillModalVisible(false)}>
              Annuler
            </Button>,
            <Button
              key="save"
              type={billModalTarget=='facture'?'primary':''}
              icon={<SaveOutlined />}
              onClick={async () => {
                const success = await (billModalTarget=='bon'? saveBillableData():sendDataToFacture()); // Await the promise
                if (success) {
                  message.success("Facture sauvegardée avec succès");
                  setIsBillModalVisible(false); // Close modal
                }
              }}
            >
              Sauvegarder
            </Button>,
            (billModalTarget=='bon' && <Button
              key="print"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() => {
                // Generate and print the PDF
                const success = generateBillPDF();
                if (success) {
                  message.success("BON généré avec succès");
                }
                // Modal stays open as requested
              }}
            >
              Imprimer bon
            </Button>),
          ]}
          >
          <div className="bill-form-container">
            {/* Invoice Number */}
            {billModalTarget=='bon' && (
              <div style={{ textAlign: "right", marginBottom: "10px" }}>
                <Text strong>BON N°: </Text>
                <Text>{invoiceNumber}</Text>
              </div>
            )}
            {/* Global bill settings */}
            <div className="client-info-header">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Date Facture" layout="horizontal">
                    <DatePicker
                      style={{ width: "100%" }}
                      value={moment(billDate)}
                      onChange={(date) => {
                        const formattedDate = date
                          ? date.format("YYYY-MM-DD")
                          : moment().format("YYYY-MM-DD");
                        setBillDate(formattedDate);

                        // Update all items with the new date
                        const updatedItems = billableData.map((item) => ({
                          ...item,
                          billable: {
                            ...item.billable,
                            date_facturation: formattedDate,
                          },
                        }));
                        setBillableData(updatedItems);
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Taux de TVA (%)">
                    <Select
                      style={{ width: "100%" }}
                      onChange={(value) => {
                        setTaxRate(value);

                        // Update all items with the new tax rate
                        const updatedItems = billableData.map((item) => ({
                          ...item,
                          billable: {
                            ...item.billable,
                            taxe: value,
                          },
                        }));
                        setBillableData(updatedItems);
                      }}
                    >
                      <Option value={0}>0%</Option>
                      <Option value={7}>7%</Option>
                      <Option value={19}>19%</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Timbre Fiscal">
                    <InputNumber
                      min={0}
                      step={0.001}
                      onChange={(value) => {
                        setTimbreFiscal(value)                       
                        const updatedItems = billableData.map((item) => ({
                          ...item,
                          billable: {
                            ...item.billable,
                            timbre_fiscal: value,
                          },
                        }));
                        setBillableData(updatedItems);
                      }}
                    ></InputNumber>
                  </Form.Item>
                </Col>
              </Row>
              {billModalTarget=='facture' && (
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Date Livraison" layout="horizontal">
                    <DatePicker
                      style={{ width: "100%" }}
                      onChange={(date) => {
                        const formattedDate = date
                          ? date.format("YYYY-MM-DD")
                          : moment().format("YYYY-MM-DD");
                        // Update all items with the new date
                        const updatedItems = billableData.map((item) => ({
                          ...item,
                          billable: {
                            ...item.billable,
                            date_livraison: formattedDate,
                          },
                        }));
                        console.log(updatedItems)
                        setBillableData(updatedItems);
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={9}>
                  <Form.Item
                    layout="horizontal"
                    label="Mode de Paiement"
                    name="mode_paiement"
                    >
                    <Select
                      onChange={(value) => {
                        // Update all items with the new field
                        const updatedItems = billableData.map((item) => ({
                          ...item,
                          billable: {
                            ...item.billable,
                            mode_paiement: value,
                          },
                        }));
                        setBillableData(updatedItems);
                      }}
                    >
                      <Option value="traite">Traite</Option>
                      <Option value="cash">Comptant</Option>
                      <Option value="cheque">Chèque</Option>
                      <Option value="virement">Virement Bancaire</Option>
                      <Option value="carte">Carte de crédit</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Statut">
                    <Select
                      style={{ width: "100%" }}
                      onChange={(value) => {
                        // Update all items with the new field
                        const updatedItems = billableData.map((item) => ({
                          ...item,
                          billable: {
                            ...item.billable,
                            statut: value,
                          },
                        }));
                        setBillableData(updatedItems);
                      }}
                    >
                      <Option value="pending">En attente</Option>
                      <Option value="processing">En cours</Option>
                      <Option value="completed">Terminée</Option>
                      <Option value="cancelled">Annulée</Option>
                      <Option value="invoiced">Facturée</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              )}
              <Divider style={{ margin: "10px 0" }} />

              {/* Client info from first item (assuming all items are for the same client) */}
              {billableData.length > 0 && (
                <div>
                  <h3>
                    Client:{" "}
                    {billableData[0].clientDetails?.nom_cf ||
                      billableData[0].client?.nom_client ||
                      "N/A"}
                  </h3>
                  <p>
                    Matricule Fiscale:{" "}
                    {billableData[0].clientDetails?.matricule_fiscale ||
                      billableData[0].client?.numero_fiscal ||
                      "N/A"}
                  </p>
                  <p>
                    Adresse:{" "}
                    {billableData[0].clientDetails?.adresse ||
                      billableData[0].client?.adresse ||
                      "N/A"}
                  </p>
                  <p>
                    Téléphone:{" "}
                    {billableData[0].clientDetails?.tel ||
                      billableData[0].client?.telephone ||
                      "N/A"}
                  </p>
                </div>
              )}
            </div>

            {/* List of billable items */}
            <List
              dataSource={billableData}
              renderItem={(item, index) => (
                <List.Item>
                  <Card
                    title={`Travail ${index + 1}: ${
                      item.produit_name || "Produit Inconnu"
                    }`}
                    style={{ width: "100%" }}
                  >
                    <Form layout="vertical">
                      {/* Section for Product */}
                      <Row
                        gutter={16}
                        style={{
                          borderBottom: "1px solid #f0f0f0",
                          marginBottom: 16,
                          paddingBottom: 16,
                        }}
                      >
                        <Col span={8}>
                          <Form.Item label="Produit">
                            <Input
                              value={
                                item.produit_name +
                                (item.description
                                  ? ` - ${item.description}`
                                  : "")
                              }
                              disabled
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item label="Qté Produit">
                            <InputNumber
                              style={{ width: "100%" }}
                              min={0}
                              value={item.billable.quantite_produit}
                              onChange={(value) => {
                                const newData = [...billableData];
                                newData[index].billable.quantite_produit =
                                  value;
                                setBillableData(newData);
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item label="Prix U. Produit">
                            <InputNumber
                              style={{ width: "100%" }}
                              min={0}
                              step={0.001}
                              value={item.billable.prix_unitaire_produit}
                              onChange={(value) => {
                                const newData = [...billableData];
                                newData[index].billable.prix_unitaire_produit =
                                  value;
                                setBillableData(newData);
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item label="Remise (%)">
                            <InputNumber
                              style={{ width: "100%" }}
                              min={0}
                              step={1}
                              value={item.billable.remise_pourcentage}
                              onChange={(value) => {
                                const updatedData = billableData.map((i) => {
                                  if (i.id === item.id) {
                                    const pourcentage = parseFloat(value) || 0;
                                    const prix = parseFloat(item.billable?.prix_unitaire_produit) || 0;
                                    const quantite = parseFloat(item.billable?.quantite_produit) || 0;

                                    return {
                                      ...i,
                                      billable: {
                                        ...i.billable,
                                        remise_pourcentage: pourcentage,
                                        remise: (prix * quantite * pourcentage) / 100,
                                      },
                                    };
                                  }
                                else{
                                  return i;
                                }})
                                  console.log(updatedData)
                                  setBillableData(updatedData)
                                }
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item label="Total HT Produit">
                            <InputNumber
                              style={{ width: "100%" }}
                              min={0}
                              step={0.001}
                              value={(
                                (item.billable.prix_unitaire_produit || 0) *
                                (item.billable.quantite_produit || 0) - (item.billable.remise || 0)
                              ).toFixed(3)}
                              disabled
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* Materials section if available */}
                      {billModalTarget=='bon' && item.matiere_usages &&
                        item.matiere_usages.length > 0 && (
                          <div>
                            <Divider orientation="left">
                              Matériaux utilisés pour ce travail
                            </Divider>
                            <Table
                              className="material-table"
                              size="small"
                              pagination={false}
                              dataSource={item.matiere_usages}
                              columns={[
                                {
                                  title: "Matériau",
                                  dataIndex: "nom_matiere",
                                  key: "nom_matiere",
                                  render: (text, record) => {
                                    console.log(record)
                                    return (
                                      <Space>
                                        <Tag color={record.source==='stock'?'blue': 'green'}>
                                          {text || record.type_matiere}
                                        </Tag>
                                      </Space>
                                    )
                                  },
                                },
                                {
                                  title: "Dimensions",
                                  key: "dimensions",
                                  render: (_, record) => (
                                    <span>
                                      {record.thickness
                                        ? `${record.thickness}mm`
                                        : "-"}{" "}
                                      ×
                                      {record.length
                                        ? `${record.length}mm`
                                        : "-"}{" "}
                                      ×
                                      {record.width ? `${record.width}mm` : "-"}
                                    </span>
                                  ),
                                },
                                {
                                  title: "Quantité",
                                  dataIndex: "quantite_utilisee",
                                  key: "quantite_utilisee",
                                },
                                // ${ materialSource == 'stock' ?
                                // `{
                                //   title: "Prix unitaire",
                                //   dataIndex: "prix_unitaire",
                                //   key: "prix_unitaire",
                                //   render: (text, record, materialIndex) => (
                                //     <InputNumber
                                //       style={{ width: "100%" }}
                                //       min={0}
                                //       precision={3}
                                //       value={record.prix_unitaire}
                                //       onChange={(value) => {
                                //         // Ensure value is a number, default to 0 if invalid
                                //         const newPrice =
                                //           value === null || isNaN(value)
                                //             ? 0
                                //             : value;

                                //         setBillableData((prevBillableData) => {
                                //           return prevBillableData.map(
                                //             (item, i) => {
                                //               if (i === index) {
                                //                 // `index` is from the outer List's renderItem
                                //                 const updatedMatiereUsages =
                                //                   item.matiere_usages.map(
                                //                     (mat, mi) => {
                                //                       if (
                                //                         mi === materialIndex
                                //                       ) {
                                //                         // `materialIndex` is from the column's render
                                //                         return {
                                //                           ...mat,
                                //                           prix_unitaire:
                                //                             newPrice,
                                //                         };
                                //                       }
                                //                       return mat;
                                //                     }
                                //                   );
                                //                 // Recalculate item's total_ht if necessary, though it's mostly for display here
                                //                 // and final totals are calculated in the summary.
                                //                 return {
                                //                   ...item,
                                //                   matiere_usages:
                                //                     updatedMatiereUsages,
                                //                 };
                                //               }
                                //               return item;
                                //             }
                                //           );
                                //         });
                                //       }}
                                //     />
                                //   ),
                                // },
                                // {
                                //   title: "Total",
                                //   key: "total",
                                //   render: (_, record) => (
                                //     <span>
                                //       {(
                                //         record.prix_unitaire *
                                //         record.quantite_utilisee
                                //       ).toFixed(3)}{" "}
                                //     </span>
                                //   ),
                                // },` : ``}
                              ]}
                            />
                          </div>
                        )}
                    </Form>
                  </Card>
                </List.Item>
              )}
            />

            {/* Summary section */}
            <Card className="summary-card" style={{ marginTop: 16 }}>
              <Row justify="end">
                <Col span={8}>
                  <div style={{ textAlign: "right" }}>
                    <p>
                      <strong>Total HT:</strong>{" "}
                      {console.log(billableData)}
                      {billableData
                        .reduce((sum, item) => {
                          const productTotal =
                            (item.billable.prix_unitaire_produit || 0) *
                            (item.billable.quantite_produit || 0);
                          let materialTotalForItem = 0;
                          if (
                            item.matiere_usages &&
                            item.matiere_usages.length > 0
                          ) {
                            materialTotalForItem = item.matiere_usages.reduce(
                              (materialSum, mat) =>
                                materialSum +
                                (mat.prix_unitaire || 0) *
                                  (mat.quantite_utilisee || 0),
                              0
                            );
                          }
                          return sum + productTotal + materialTotalForItem;
                        }, 0)
                        .toFixed(3)}{" "}
                    </p>
                    <p>
                      <strong>TVA ({taxRate}%):</strong>{" "}
                      {(
                        (billableData.reduce((sum, item) => {
                          const productTotal =
                            (item.billable.prix_unitaire_produit || 0) *
                            (item.billable.quantite_produit || 0);
                          let materialTotalForItem = 0;
                          if (
                            item.matiere_usages &&
                            item.matiere_usages.length > 0
                          ) {
                            materialTotalForItem = item.matiere_usages.reduce(
                              (materialSum, mat) =>
                                materialSum +
                                (mat.prix_unitaire || 0) *
                                  (mat.quantite_utilisee || 0),
                              0
                            );
                          }
                          return sum + productTotal + materialTotalForItem;
                        }, 0) *
                          taxRate) /
                        100
                      ).toFixed(3)}{" "}
                    </p>
                    <p className="total-ttc">
                      <strong>Total TTC:</strong>{" "}
                      {(
                        billableData.reduce((sum, item) => {
                          const productTotal =
                            (item.billable.prix_unitaire_produit || 0) *
                            (item.billable.quantite_produit || 0);
                          let materialTotalForItem = 0;
                          if (
                            item.matiere_usages &&
                            item.matiere_usages.length > 0
                          ) {
                            materialTotalForItem = item.matiere_usages.reduce(
                              (materialSum, mat) =>
                                materialSum +
                                (mat.prix_unitaire || 0) *
                                  (mat.quantite_utilisee || 0),
                              0
                            );
                          }
                          return sum + productTotal + materialTotalForItem;
                        }, 0) *
                        (1 + taxRate / 100)
                      ).toFixed(3)}{" "}
                    </p>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        </Modal>
      </div>
    </Content>
  );
};

export default WorkManagementPage;
