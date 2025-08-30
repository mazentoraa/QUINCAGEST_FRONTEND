import React from "react";
import TraitePrinter from "./TraitePrinter";

const SupplierTraitePrinter = (props) => {
  // Mapping fournisseur : RM METALAZER dans les champs client (tiré), fournisseur dans les champs tireur
  const { installmentData, ...rest } = props;
  if (!installmentData) return null;
  const mappedInstallmentData = {
    ...installmentData,
    // RM METALAZER = client (tiré)
    clientName: "RM METALAZER",
    clientAddress: "Sfax",
    clientTaxId: "1883737/D/A/M/000",
    // Fournisseur = tireur
    drawerName: installmentData.fournisseur_nom || installmentData.supplierName || installmentData.nom_raison_sociale || '',
    drawerAddress: installmentData.fournisseur_adresse || installmentData.supplierAddress || installmentData.fournisseurAddress || '',
    drawerTaxId: installmentData.fournisseur_matricule || installmentData.supplierTaxId || installmentData.matricule_fiscal || '',
  };
  return <TraitePrinter {...rest} installmentData={mappedInstallmentData} />;
};

export default SupplierTraitePrinter;
