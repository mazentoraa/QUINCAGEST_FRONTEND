class PdfApiService {
  // Your APDF.io API token
  static API_TOKEN = "kMZrwMgVmmej90g7wimNOcvwFaGRQhXndOVKfTSPf540b6d3";
  static API_URL = "https://apdf.io/api/pdf/file/create";

  /**
   * Test the API connection with simple approach
   */
  static async testAPI() {
    try {
      console.log("Testing APDF.io API connection...");

      const testHTML =
        "<html><body><h1>Test PDF Generation</h1><p>This is a test document.</p></body></html>";

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.API_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `html=${encodeURIComponent(testHTML)}`,
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data);

        if (data.file) {
          // Open the PDF in a new window instead of downloading
          this.openPDFInNewWindow(data.file, "Test PDF");
          return {
            success: true,
            message: `API test successful - PDF opened in new window! (${data.pages} page(s), ${data.size} bytes)`,
          };
        } else {
          return {
            success: false,
            message: `Unexpected response format: ${JSON.stringify(data)}`,
          };
        }
      } else {
        const errorText = await response.text();
        console.error("API Error response:", errorText);
        return {
          success: false,
          message: `API Error: ${response.status} - ${errorText}`,
        };
      }
    } catch (error) {
      console.error("API test error:", error);
      return { success: false, message: `API test error: ${error.message}` };
    }
  }

  /**
   * Generate PDF using the simple approach
   */
  static async generateInvoicePDF(invoiceData, filename = "facture.pdf") {
    try {
      console.log("Generating PDF using APDF.io API...");

      // Generate the HTML content
      const htmlContent = this.generateInvoiceHTML(invoiceData);
      console.log("Generated HTML for API (length):", htmlContent.length);

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.API_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `html=${encodeURIComponent(htmlContent)}`,
      });

      console.log("API Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("PDF API Response:", data);

        if (data.file) {
          // Open the PDF in a new window instead of downloading
          this.openPDFInNewWindow(data.file, filename);
          console.log(
            `PDF generated successfully: ${data.pages} page(s), ${data.size} bytes`
          );
          return true;
        } else {
          throw new Error(
            `API returned unexpected format: ${JSON.stringify(data)}`
          );
        }
      } else {
        const errorText = await response.text();
        console.error("API Error response:", errorText);
        throw new Error(`PDF API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("Error generating PDF with APDF.io API:", error);
      throw error;
    }
  }

  /**
   * Open PDF in a new window/tab
   */
  static openPDFInNewWindow(url, title = "PDF Document") {
    try {
      console.log("Opening PDF in new window:", url);

      // Open the PDF URL in a new window/tab
      const newWindow = window.open(
        url,
        "_blank",
        "width=1000,height=800,scrollbars=yes,resizable=yes"
      );

      if (newWindow) {
        // Set the title if possible
        newWindow.document.title = title;
        newWindow.focus();
        console.log("PDF opened successfully in new window");
      } else {
        // Fallback if popup blocked
        console.warn("Popup blocked, creating download link");
        this.createDownloadLink(url, title);
      }
    } catch (error) {
      console.error("Error opening PDF in new window:", error);
      // Fallback to creating a download link
      this.createDownloadLink(url, title);
    }
  }

  /**
   * Create a download link as fallback
   */
  static createDownloadLink(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("Download link created and clicked");
  }

  /**
   * Alternative method: Open PDF with additional options
   */
  static openPDFWithOptions(url, filename = "document.pdf") {
    try {
      // Try to open in new tab first
      const newTab = window.open(url, "_blank");

      if (newTab) {
        // PDF opened successfully
        console.log("PDF opened in new tab");
        return true;
      } else {
        // Popup blocked or failed, show user a message and provide manual link
        console.warn("Could not open PDF automatically");
        this.showPDFLinkModal(url, filename);
        return false;
      }
    } catch (error) {
      console.error("Error opening PDF:", error);
      this.showPDFLinkModal(url, filename);
      return false;
    }
  }

  /**
   * Show a modal with the PDF link if automatic opening fails
   */
  static showPDFLinkModal(url, filename) {
    // Create a simple modal with the PDF link
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    const content = document.createElement("div");
    content.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      text-align: center;
    `;

    content.innerHTML = `
      <h3>PDF Ready</h3>
      <p>Your PDF has been generated successfully!</p>
      <p><a href="${url}" target="_blank" style="color: #1890ff; text-decoration: none; font-size: 16px;">Click here to open PDF</a></p>
      <p style="font-size: 12px; color: #666;">File: ${filename}</p>
      <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="
        background: #1890ff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      ">Close</button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }, 10000);
  }

  /**
   * Generate clean HTML for the invoice
   */
  static generateInvoiceHTML(data) {
    const tableRows = data.items
      .map((item) => {
        const totalHT = (item.unitPrice || 0) * (item.quantity || 0);
        const totalTVA = (totalHT * (item.taxRate || 19)) / 100;
        const totalTTC = totalHT + totalTVA;

        return `
        <tr>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">${
            item.code || ""
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; word-wrap: break-word;">${
            item.description || ""
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${
            item.quantity || ""
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: right;">${
            item.unitPrice ? item.unitPrice.toFixed(3) : "0.000"
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${
            item.discount || "0"
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: right;">${totalHT.toFixed(
            3
          )}</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${
            item.taxRate || "19"
          }%</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: right;">${totalTTC.toFixed(
            3
          )}</td>
        </tr>
      `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <title>Facture RM METALASER</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  font-size: 12px;
                  color: black;
                  margin: 0;
                  padding: 15px;
                  line-height: 1.4;
              }
              .header {
                  text-align: center;
                  margin-bottom: 25px;
              }
              .header img {
                  width: 190px;
                  margin-bottom: 5px;
                  display: block;
                  margin-left: auto;
                  margin-right: auto;
              }
              .header h2 {
                  margin: 8px 0;
                  color: #333;
                  font-size: 20px;
              }
              .header p {
                  margin: 3px 0;
                  line-height: 1.3;
                  font-size: 11px;
              }
              .header a {
                  color: #1890ff;
                  text-decoration: none;
              }
              .client-info {
                  margin: 20px 0;
                  border: 2px solid #000;
                  padding: 12px;
                  background: #f9f9f9;
                  display: inline-block;
                  font-size: 11px;
              }
              .invoice-details {
                  margin: 20px 0;
              }
              .invoice-details p {
                  margin: 6px 0;
                  font-size: 12px;
              }
              .invoice-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 15px 0;
                  font-size: 10px;
              }
              .invoice-table th {
                  border: 2px solid #000;
                  padding: 8px 4px;
                  text-align: left;
                  background-color: #f0f0f0;
                  font-weight: bold;
                  font-size: 9px;
              }
              .invoice-table td {
                  border: 1px solid #000;
                  padding: 6px 4px;
                  text-align: left;
                  font-size: 10px;
              }
              .totals {
                  margin: 20px 0;
                  text-align: right;
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
              }
              .signature {
                  margin-top: 30px;
                  text-align: right;
                  font-size: 10px;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <img src="https://s6.imgcdn.dev/Y6OYhg.jpg" alt="RM METALASER Logo">
              <h2>RM METALASER</h2>
              <p>
                  Découpes Métaux<br>
                  Rue hedi khfecha Z Madagascar 3047 - Sfax ville<br>
                  IF: 191 1419B/A/M/000<br>
                  Tél. : +216 20 366 150<br>
                  Email: contact@rmmetalaser.tn<br>
                  Site Web: <a href="http://www.rmmetalaser.tn">www.rmmetalaser.tn</a>
              </p>
          </div>

          <div class="client-info">
              <strong>Nom Client :</strong> ${data.clientName || ""}<br>
              <strong>Adresse :</strong> ${data.clientAddress || ""}<br>
              <strong>M.F :</strong> ${data.clientTaxId || ""}<br>
              <strong>Tél. :</strong> ${data.clientPhone || ""}
          </div>

          <div class="invoice-details">
              <p><strong>Facture N°:</strong> ${data.invoiceNumber || ""}</p>
              <p><strong>Date:</strong> ${data.invoiceDate || ""}</p>
              <p><strong>Code Client:</strong> ${data.clientCode || ""}</p>
          </div>

          <table class="invoice-table">
              <thead>
                  <tr>
                      <th style="width: 8%;">CODE</th>
                      <th style="width: 28%;">DESIGNATION</th>
                      <th style="width: 8%;">QTE</th>
                      <th style="width: 12%;">P.U. HT (TND)</th>
                      <th style="width: 8%;">REMISE (%)</th>
                      <th style="width: 12%;">Total P. HT (TND)</th>
                      <th style="width: 8%;">TVA</th>
                      <th style="width: 16%;">TOTAL P. TTC (TND)</th>
                  </tr>
              </thead>
              <tbody>
                  ${tableRows}
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
                      <td><strong>Remise (%)</strong></td>
                      <td style="text-align: right;">${
                        data.discountRate || "0"
                      }</td>
                  </tr>
                  <tr>
                      <td><strong>Total HT (après remise)</strong></td>
                      <td style="text-align: right;">${
                        data.totalHTAfterDiscount
                          ? data.totalHTAfterDiscount.toFixed(3)
                          : data.totalHT
                          ? data.totalHT.toFixed(3)
                          : "0.000"
                      }</td>
                  </tr>
                  <tr>
                      <td><strong>Total TVA</strong></td>
                      <td style="text-align: right;">${
                        data.totalTVA ? data.totalTVA.toFixed(3) : "0.000"
                      }</td>
                  </tr>
                  <tr style="background-color: #f0f0f0;">
                      <td><strong>NET À PAYER</strong></td>
                      <td style="text-align: right;"><strong style="font-size: 12px;">${
                        data.totalTTC ? data.totalTTC.toFixed(3) : "0.000"
                      } TND</strong></td>
                  </tr>
              </table>
          </div>

          <div class="signature">
              <p><strong>Cachet et Signature</strong></p>
              <br><br>
              <p style="font-size: 9px;">
                  Base: ${
                    data.totalHTAfterDiscount
                      ? data.totalHTAfterDiscount.toFixed(3)
                      : data.totalHT
                      ? data.totalHT.toFixed(3)
                      : "0.000"
                  } — 
                  Taux TVA: ${data.taxRate || "19"}% — 
                  Montant TVA: ${
                    data.totalTVA ? data.totalTVA.toFixed(3) : "0.000"
                  }
              </p>
          </div>
      </body>
      </html>
    `;
  }
}

export default PdfApiService;
