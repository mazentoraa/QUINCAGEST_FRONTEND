import { jsPDF } from './pdfSetup'; // Changed import

// Simple test pour voir si jsPDF et autoTable fonctionnent correctement
function testJsPdf() {
  console.log('Testing jsPDF...');
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    console.log('jsPDF instance created:', doc);
    console.log('autoTable method available: ', typeof doc.autoTable === 'function');
    
    if (typeof doc.autoTable === 'function') {
      const tableData = {
        head: [['Name', 'Age']],
        body: [['John', '25'], ['Jane', '30']]
      };
      doc.autoTable({
        head: tableData.head,
        body: tableData.body
      });
      console.log('autoTable executed successfully');
      return true;
    } else {
      console.error('autoTable method not found on jsPDF instance');
      return false;
    }
  } catch (error) {
    console.error('Error testing jsPDF:', error);
    return false;
  }
}

export { testJsPdf };
