import React from "react";
import { SupplierInstallmentProvider } from "./contexts/SupplierInstallmentContext";
import SupplierInstallmentManagement from "./components/SupplierInstallmentManagement";

const SupplierInstallmentManagementPage = () => {
  return (
    <SupplierInstallmentProvider>
      <SupplierInstallmentManagement />
    </SupplierInstallmentProvider>
  );
};

export default SupplierInstallmentManagementPage;
