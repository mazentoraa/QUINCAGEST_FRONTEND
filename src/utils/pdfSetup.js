// This file sets up jsPDF with the autoTable plugin
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

// Verify that autoTable is correctly attached to jsPDF
const doc = new jsPDF();
if (typeof autoTable !== 'function') {
  console.error('Warning: autoTable is not properly attached to jsPDF');
}

export { jsPDF, autoTable };
