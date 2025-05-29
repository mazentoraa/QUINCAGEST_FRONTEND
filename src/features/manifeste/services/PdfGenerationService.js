import html2pdf from "html2pdf.js";

class PdfGenerationService {
  /**
   * Fetch the invoice template HTML from the public folder
   * @returns {Promise<string>} The HTML template content
   */
  static async fetchInvoiceTemplate() {
    try {
      const response = await fetch(
        "/facturetemplates/facture_rm_metalazer.html"
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch template: ${response.status} ${response.statusText}`
        );
      }
      return await response.text();
    } catch (error) {
      console.error("Error fetching invoice template:", error);
      throw error;
    }
  }

  /**
   * Generate and download an invoice PDF directly in the browser
   * @param {Object} invoiceData - The data for the invoice
   * @param {string} filename - The filename for the downloaded PDF
   */
  static async generateAndDownloadInvoice(
    invoiceData,
    filename = "facture.pdf"
  ) {
    try {
      // Show loading message in console
      console.log("Generating invoice PDF...");
      console.log("Invoice Data:", invoiceData);

      // Fetch the template
      const templateHtml = await this.fetchInvoiceTemplate();
      console.log("Template loaded, length:", templateHtml.length);

      // Fill the template with data
      const filledHtml = this.fillInvoiceTemplate(templateHtml, invoiceData);
      console.log("Template filled, length:", filledHtml.length);

      // Create a temporary div to render the HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = filledHtml;

      // Fix image paths since we're in a temporary div
      const images = tempDiv.querySelectorAll("img");
      images.forEach((img) => {
        if (img.src && img.src.includes("images/")) {
          img.src = `${window.location.origin}/facturetemplates/${img.src
            .split("/")
            .pop()}`;
        }
      });

      // Make sure the div is properly styled and visible for rendering
      tempDiv.style.position = "fixed";
      tempDiv.style.top = "50px";
      tempDiv.style.left = "50px"; // Move content more to the right
      tempDiv.style.width = "210mm"; // A4 width
      tempDiv.style.minHeight = "297mm"; // A4 height
      tempDiv.style.padding = "0"; // Remove padding from container
      tempDiv.style.backgroundColor = "white";
      tempDiv.style.zIndex = "9999";
      tempDiv.style.visibility = "visible";
      tempDiv.style.opacity = "1";
      tempDiv.style.border = "1px solid #ccc"; // Add border to see boundaries

      document.body.appendChild(tempDiv);

      // Wait for the content to be properly rendered
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Temp div dimensions:", {
        width: tempDiv.offsetWidth,
        height: tempDiv.offsetHeight,
        scrollHeight: tempDiv.scrollHeight,
      });

      // Set options for the PDF with adjusted margins
      const options = {
        margin: [15, 15, 15, 15], // Increased margins: top, right, bottom, left
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
          width: tempDiv.scrollWidth,
          height: tempDiv.scrollHeight,
          x: 0, // Start from left edge
          y: 0, // Start from top edge
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      // Generate and download PDF
      await html2pdf().from(tempDiv).set(options).save();

      // Cleanup
      document.body.removeChild(tempDiv);
      return true;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  }

  /**
   * Fill the invoice template with data
   * @param {string} template - The HTML template
   * @param {Object} data - The invoice data
   * @returns {string} - The filled HTML template
   */
  static fillInvoiceTemplate(template, data) {
    let filledTemplate = template;

    console.log("Filling template with data:", data);

    // Client Information - be more specific with replacements
    filledTemplate = filledTemplate.replace(
      /(<strong>Nom Client :\s*<\/strong>\s*)YYYYYYYYYYYYYYYYYY/g,
      `$1${data.clientName || ""}`
    );
    filledTemplate = filledTemplate.replace(
      /(<strong>Adresse :\s*<\/strong>\s*)YYYYYYYYYYYYYYYY/g,
      `$1${data.clientAddress || ""}`
    );
    filledTemplate = filledTemplate.replace(
      /(<strong>M\.F :\s*<\/strong>\s*)YYYYYYYY\/Y\/Y\/YYY/g,
      `$1${data.clientTaxId || ""}`
    );
    filledTemplate = filledTemplate.replace(
      /(<strong>Tél\. :\s*<\/strong>\s*)XX XXX XXX/g,
      `$1${data.clientPhone || ""}`
    );

    // Invoice Details - be more specific
    filledTemplate = filledTemplate.replace(
      /(<strong>Facture N°:\s*<\/strong>\s*)XXXX/g,
      `$1${data.invoiceNumber || ""}`
    );
    filledTemplate = filledTemplate.replace(
      /(<strong>Date:\s*<\/strong>\s*)JJ\/MM\/AAAA/g,
      `$1${data.invoiceDate || ""}`
    );
    filledTemplate = filledTemplate.replace(
      /(<strong>Code Client:\s*<\/strong>\s*)XXXX/g,
      `$1${data.clientCode || ""}`
    );

    // Replace the table rows with actual data
    const tableRowsHtml = this.generateTableRows(data.items);
    console.log("Generated table rows:", tableRowsHtml);

    // Replace empty tbody with filled tbody
    filledTemplate = filledTemplate.replace(
      /<tbody><\/tbody>/g,
      `<tbody>${tableRowsHtml}</tbody>`
    );

    // Replace totals in the totals table
    filledTemplate = filledTemplate.replace(
      /(<td><strong>Total HT<\/strong><\/td>\s*<td>)XXXX,XXX(<\/td>)/g,
      `$1${data.totalHT ? data.totalHT.toFixed(3) : "0.000"}$2`
    );

    filledTemplate = filledTemplate.replace(
      /(<td><strong>Remise \(%\)<\/strong><\/td>\s*<td>)XX(<\/td>)/g,
      `$1${data.discountRate || "0"}$2`
    );

    filledTemplate = filledTemplate.replace(
      /(<td><strong>Total HT \(après remise\)<\/strong><\/td>\s*<td>)XXX,XXX(<\/td>)/g,
      `$1${
        data.totalHTAfterDiscount
          ? data.totalHTAfterDiscount.toFixed(3)
          : data.totalHT
          ? data.totalHT.toFixed(3)
          : "0.000"
      }$2`
    );

    filledTemplate = filledTemplate.replace(
      /(<td><strong>Total TVA<\/strong><\/td>\s*<td>)XXX,XXX(<\/td>)/g,
      `$1${data.totalTVA ? data.totalTVA.toFixed(3) : "0.000"}$2`
    );

    filledTemplate = filledTemplate.replace(
      /(<td><strong>NET À PAYER<\/strong><\/td>\s*<td><strong>)XXXXX,XXX(<\/strong><\/td>)/g,
      `$1${data.totalTTC ? data.totalTTC.toFixed(3) : "0.000"}$2`
    );

    // Replace footer information
    filledTemplate = filledTemplate.replace(
      /Base: XXX,XXX — Taux TVA: 19% — Montant TVA: XXX,XXX/g,
      `Base: ${
        data.totalHTAfterDiscount
          ? data.totalHTAfterDiscount.toFixed(3)
          : data.totalHT
          ? data.totalHT.toFixed(3)
          : "0.000"
      } — Taux TVA: ${data.taxRate || "19"}% — Montant TVA: ${
        data.totalTVA ? data.totalTVA.toFixed(3) : "0.000"
      }`
    );

    console.log(
      "Template after filling (first 500 chars):",
      filledTemplate.substring(0, 500)
    );

    return filledTemplate;
  }

  /**
   * Generate table rows for invoice items
   * @param {Array} items - The array of invoice items
   * @returns {string} - HTML string of table rows
   */
  static generateTableRows(items) {
    if (!items || items.length === 0) {
      return `<tr><td colspan="8">Aucun élément</td></tr>`;
    }

    console.log("Generating table rows for items:", items);

    return items
      .map((item) => {
        const totalHT = (item.unitPrice || 0) * (item.quantity || 0);
        const totalTVA = (totalHT * (item.taxRate || 19)) / 100;
        const totalTTC = totalHT + totalTVA;

        return `
        <tr>
          <td>${item.code || ""}</td>
          <td>${item.description || ""}</td>
          <td>${item.quantity || ""}</td>
          <td>${item.unitPrice ? item.unitPrice.toFixed(3) : "0.000"}</td>
          <td>${item.discount || "0"}</td>
          <td>${totalHT.toFixed(3)}</td>
          <td>${item.taxRate || "19"}%</td>
          <td>${totalTTC.toFixed(3)}</td>
        </tr>
      `;
      })
      .join("");
  }

  /**
   * Generate and download an invoice PDF using direct HTML generation approach
   * This is a fallback method if the template approach doesn't work
   */
  static async generateAndDownloadInvoiceDirectly(
    invoiceData,
    filename = "facture.pdf"
  ) {
    try {
      console.log("Generating invoice PDF with direct HTML...");
      console.log("Invoice data:", invoiceData);

      // Generate HTML directly instead of using template
      const directHTML = this.generateDirectHTML(invoiceData);
      console.log("Generated HTML length:", directHTML.length);

      // Create a temporary div to render the HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = directHTML;

      // Set fixed A4 dimensions in pixels (A4 at 96 DPI)
      const a4WidthPx = 794; // 210mm at 96 DPI
      const a4HeightPx = 1123; // 297mm at 96 DPI

      // Make sure the div is properly styled with A4 dimensions
      tempDiv.style.position = "fixed";
      tempDiv.style.top = "0";
      tempDiv.style.left = "0";
      tempDiv.style.width = `${a4WidthPx}px`;
      tempDiv.style.minHeight = `${a4HeightPx}px`;
      tempDiv.style.maxWidth = `${a4WidthPx}px`; // Prevent overflow
      tempDiv.style.padding = "0";
      tempDiv.style.margin = "0";
      tempDiv.style.backgroundColor = "white";
      tempDiv.style.zIndex = "10000";
      tempDiv.style.visibility = "visible";
      tempDiv.style.opacity = "1";
      tempDiv.style.border = "2px solid red";
      tempDiv.style.fontSize = "14px";
      tempDiv.style.fontFamily = "Arial, sans-serif";
      tempDiv.style.color = "black";
      tempDiv.style.overflow = "hidden"; // Prevent content overflow
      tempDiv.style.boxSizing = "border-box";

      // Add debugging ID
      tempDiv.id = "pdf-debug-content";

      document.body.appendChild(tempDiv);

      // Wait for the content to be properly rendered
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Temp div dimensions:", {
        width: tempDiv.offsetWidth,
        height: tempDiv.offsetHeight,
        scrollHeight: tempDiv.scrollHeight,
        scrollWidth: tempDiv.scrollWidth,
      });

      // DEBUGGING: Let's pause here so you can see the div

      // Use the exact dimensions we set, not the measured ones
      const options = {
        margin: [5, 5, 5, 5], // Smaller margins
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 1, // Use scale 1 for consistent results
          useCORS: true,
          allowTaint: true,
          logging: true,
          width: a4WidthPx, // Use our fixed width
          height: Math.max(tempDiv.scrollHeight, a4HeightPx), // Use scroll height or minimum A4 height
          backgroundColor: "white",
          foreignObjectRendering: true, // Better rendering for complex layouts
        },
        jsPDF: {
          unit: "px", // Use pixels for consistency
          format: [a4WidthPx, a4HeightPx], // A4 in pixels
          orientation: "portrait",
        },
      };

      console.log("PDF options:", options);

      // Generate and download PDF
      await html2pdf().from(tempDiv).set(options).save();

      // Cleanup
      document.body.removeChild(tempDiv);
      return true;
    } catch (error) {
      console.error("Error generating PDF with direct HTML:", error);
      // Clean up even if there's an error
      const debugDiv = document.getElementById("pdf-debug-content");
      if (debugDiv) {
        document.body.removeChild(debugDiv);
      }
      throw error;
    }
  }

  /**
   * Alternative method that creates HTML directly instead of using a template
   * Use this as a fallback if template approach fails
   */
  static generateDirectHTML(data) {
    console.log("Generating direct HTML with data:", data);

    if (!data.items || data.items.length === 0) {
      console.warn("No items in invoice data!");
    }

    const tableRows = data.items
      .map((item, index) => {
        console.log(`Processing item ${index}:`, item);
        const totalHT = (item.unitPrice || 0) * (item.quantity || 0);
        const totalTVA = (totalHT * (item.taxRate || 19)) / 100;
        const totalTTC = totalHT + totalTVA;

        return `
      <tr>
        <td style="border: 1px solid #000; padding: 6px; font-size: 10px; background: white;">${
          item.code || "N/A"
        }</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 10px; background: white; word-wrap: break-word; max-width: 200px;">${
          item.description || "N/A"
        }</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 10px; text-align: center; background: white;">${
          item.quantity || "0"
        }</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 10px; text-align: right; background: white;">${
          item.unitPrice ? item.unitPrice.toFixed(3) : "0.000"
        }</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 10px; text-align: center; background: white;">${
          item.discount || "0"
        }</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 10px; text-align: right; background: white;">${totalHT.toFixed(
          3
        )}</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 10px; text-align: center; background: white;">${
          item.taxRate || "19"
        }%</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 10px; text-align: right; background: white;">${totalTTC.toFixed(
          3
        )}</td>
      </tr>
    `;
      })
      .join("");

    console.log("Generated table rows:", tableRows);

    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Facture RM METALASER</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                color: black;
                background: white;
                padding: 15px;
                line-height: 1.3;
                width: 794px; /* Fixed A4 width in pixels */
                max-width: 794px;
                overflow: hidden;
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
                border: 2px solid blue; /* Debug border */
            }
            .header img {
                max-width: 120px;
                height: auto;
                margin-bottom: 8px;
            }
            .header h2 {
                margin: 8px 0;
                color: #333;
                font-size: 18px;
            }
            .header p {
                margin: 3px 0;
                line-height: 1.3;
                font-size: 11px;
            }
            .client-info {
                margin: 15px 0;
                border: 2px solid #000;
                padding: 10px;
                background: #f9f9f9;
                display: block;
                width: 100%;
                font-size: 11px;
            }
            .invoice-details {
                margin: 15px 0;
                border: 2px solid green; /* Debug border */
            }
            .invoice-details p {
                margin: 8px 0;
                font-size: 12px;
            }
            .invoice-table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
                border: 3px solid red; /* Debug border */
                font-size: 10px;
                table-layout: fixed; /* Fixed layout for better control */
            }
            .invoice-table th {
                border: 2px solid #000;
                padding: 8px 4px;
                text-align: left;
                background-color: #f0f0f0;
                font-weight: bold;
                font-size: 9px;
                word-wrap: break-word;
            }
            .invoice-table td {
                border: 1px solid #000;
                padding: 6px 4px;
                text-align: left;
                font-size: 10px;
                background: white;
                word-wrap: break-word;
                overflow: hidden;
            }
            /* Column widths */
            .invoice-table th:nth-child(1), .invoice-table td:nth-child(1) { width: 8%; }
            .invoice-table th:nth-child(2), .invoice-table td:nth-child(2) { width: 28%; }
            .invoice-table th:nth-child(3), .invoice-table td:nth-child(3) { width: 8%; }
            .invoice-table th:nth-child(4), .invoice-table td:nth-child(4) { width: 12%; }
            .invoice-table th:nth-child(5), .invoice-table td:nth-child(5) { width: 8%; }
            .invoice-table th:nth-child(6), .invoice-table td:nth-child(6) { width: 12%; }
            .invoice-table th:nth-child(7), .invoice-table td:nth-child(7) { width: 8%; }
            .invoice-table th:nth-child(8), .invoice-table td:nth-child(8) { width: 16%; }
            
            .totals {
                margin: 15px 0;
                text-align: right;
                border: 2px solid purple; /* Debug border */
            }
            .totals-table {
                width: 280px;
                border-collapse: collapse;
                margin-left: auto;
                font-size: 11px;
            }
            .totals-table td {
                padding: 6px 10px;
                border: 1px solid #000;
                background: white;
            }
            .signature {
                margin-top: 30px;
                text-align: right;
                border: 2px solid orange; /* Debug border */
                font-size: 11px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>RM METALASER</h2>
            <p>
                Découpes Métaux<br>
                Rue hedi khfecha Z Madagascar 3047 - Sfax ville<br>
                IF: 191 1419B/A/M//000<br>
                Tél. : +216 20 366 150<br>
                Email: contact@rmmetalaser.tn<br>
                Site Web: www.rmmetalaser.tn
            </p>
        </div>

        <div class="client-info">
            <strong>Nom Client :</strong> ${
              data.clientName || "TEST CLIENT"
            }<br>
            <strong>Adresse :</strong> ${
              data.clientAddress || "TEST ADDRESS"
            }<br>
            <strong>M.F :</strong> ${data.clientTaxId || "TEST TAX ID"}<br>
            <strong>Tél. :</strong> ${data.clientPhone || "TEST PHONE"}
        </div>

        <div class="invoice-details">
            <p><strong>Facture N°:</strong> ${
              data.invoiceNumber || "TEST-001"
            }</p>
            <p><strong>Date:</strong> ${data.invoiceDate || "2024-01-01"}</p>
            <p><strong>Code Client:</strong> ${
              data.clientCode || "TEST-CLIENT"
            }</p>
        </div>

        <table class="invoice-table">
            <thead>
                <tr>
                    <th>CODE</th>
                    <th>DESIGNATION</th>
                    <th>QTE</th>
                    <th>P.U. HT (TND)</th>
                    <th>REMISE (%)</th>
                    <th>Total P. HT (TND)</th>
                    <th>TVA</th>
                    <th>TOTAL P. TTC (TND)</th>
                </tr>
            </thead>
            <tbody>
                ${
                  tableRows ||
                  '<tr><td colspan="8" style="border: 1px solid red; padding: 10px; text-align: center;">NO ITEMS FOUND</td></tr>'
                }
            </tbody>
        </table>

        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td><strong>Total HT</strong></td>
                    <td style="text-align: right;"><strong>${
                      data.totalHT ? data.totalHT.toFixed(3) : "0.000"
                    }</strong></td>
                </tr>
                <tr>
                    <td><strong>Total TVA</strong></td>
                    <td style="text-align: right;">${
                      data.totalTVA ? data.totalTVA.toFixed(3) : "0.000"
                    }</td>
                </tr>
                <tr style="background-color: #f0f0f0;">
                    <td><strong>NET À PAYER</strong></td>
                    <td style="text-align: right;"><strong>${
                      data.totalTTC ? data.totalTTC.toFixed(3) : "0.000"
                    } TND</strong></td>
                </tr>
            </table>
        </div>

        <div class="signature">
            <p><strong>Cachet et Signature</strong></p>
            <p style="font-size: 10px;">
                Base: ${data.totalHT ? data.totalHT.toFixed(3) : "0.000"} — 
                Taux TVA: ${data.taxRate || "19"}% — 
                Montant TVA: ${
                  data.totalTVA ? data.totalTVA.toFixed(3) : "0.000"
                }
            </p>
        </div>
    </body>
    </html>
  `;

    console.log("Final HTML generated, length:", html.length);
    return html;
  }
}

export default PdfGenerationService;
