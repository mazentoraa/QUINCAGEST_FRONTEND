import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

class InvoiceService {
  async createInvoice(invoiceData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/factures/`, invoiceData);

      return response.data;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }
}

export default new InvoiceService();
