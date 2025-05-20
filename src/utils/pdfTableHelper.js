// Simple alternative to jspdf-autotable when it's not working
export function drawTable(doc, tableData, startY, config = {}) {
  const { head, body } = tableData;
  const {
    margin = 20,
    fontSize = 10,
    lineHeight = 10,
    headerBgColor = [50, 50, 50],
    headerTextColor = [255, 255, 255],
    cellPadding = 3,
    columnWidths = [],
    pageWidth = 210  // A4 width in mm
  } = config;
  
  // Calculate default column widths if not provided
  let calculatedColumnWidths = [];
  const tableWidth = pageWidth - 2 * margin;
  const numCols = head[0].length;
  
  if (columnWidths.length === numCols) {
    calculatedColumnWidths = columnWidths;
  } else {
    const defaultColWidth = tableWidth / numCols;
    calculatedColumnWidths = Array(numCols).fill(defaultColWidth);
  }
  
  // Set current position
  let currentY = startY;
  
  // Draw header
  doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
  doc.setTextColor(headerTextColor[0], headerTextColor[1], headerTextColor[2]);
  doc.setFontSize(fontSize);
  
  // Header row
  const headerHeight = lineHeight + cellPadding * 2;
  doc.rect(margin, currentY, tableWidth, headerHeight, 'F');
  
  let currentX = margin + cellPadding;
  head[0].forEach((cell, colIndex) => {
    doc.text(cell.toString(), currentX, currentY + cellPadding + lineHeight / 2);
    currentX += calculatedColumnWidths[colIndex];
  });
  
  currentY += headerHeight;
  
  // Reset text color for body
  doc.setTextColor(0, 0, 0);
  
  // Draw body
  body.forEach((row, rowIndex) => {
    const rowHeight = lineHeight + cellPadding * 2;
    
    // Draw row background (alternate colors for better readability)
    if (rowIndex % 2 === 0) {
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, currentY, tableWidth, rowHeight, 'F');
    }
    
    // Draw cell borders
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, currentY, tableWidth, rowHeight);
    
    // Draw cell contents
    currentX = margin + cellPadding;
    row.forEach((cell, colIndex) => {
      // For numbers, align right
      const cellText = cell.toString();
      let x = currentX;
      if (!isNaN(parseFloat(cellText)) && isFinite(cellText)) {
        x = currentX + calculatedColumnWidths[colIndex] - cellPadding - doc.getTextWidth(cellText);
      }
      
      doc.text(cellText, x, currentY + cellPadding + lineHeight / 2);
      currentX += calculatedColumnWidths[colIndex];
    });
    
    currentY += rowHeight;
    
    // Check if we need a new page
    if (currentY > 270) {
      doc.addPage();
      currentY = margin;
    }
  });
  
  return currentY;
}
