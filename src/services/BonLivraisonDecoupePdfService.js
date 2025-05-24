class BonLivraisonDecoupePdfService {
  // Your APDF.io API token
  static API_TOKEN = "kMZrwMgVmmej90g7wimNOcvwFaGRQhXndOVKfTSPf540b6d3";
  static API_URL = "https://apdf.io/api/pdf/file/create";

  /**
   * Test the API connection
   */
  static async testAPI() {
    try {
      console.log("Testing APDF.io API connection for decoupe invoices...");

      const testHTML =
        "<html><body><h1>Test Facture Decoupe PDF</h1><p>This is a test document for decoupe invoices.</p></body></html>";

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
          this.openPDFInNewWindow(data.file, "Test Facture Decoupe PDF");
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
   * Generate PDF for decoupe invoice
   */
  static async generateDecoupeInvoicePDF(
    invoiceData,
    filename = "facture-decoupe.pdf"
  ) {
    try {
      console.log("Generating decoupe invoice PDF using APDF.io API...");

      const htmlContent = this.generateDecoupeInvoiceHTML(invoiceData);
      console.log(
        "Generated HTML for decoupe invoice API (length):",
        htmlContent.length
      );

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

      const newWindow = window.open(
        url,
        "_blank",
        "width=1000,height=800,scrollbars=yes,resizable=yes"
      );

      if (newWindow) {
        newWindow.document.title = title;
        newWindow.focus();
        console.log("PDF opened successfully in new window");
      } else {
        console.warn("Popup blocked, creating download link");
        this.createDownloadLink(url, title);
      }
    } catch (error) {
      console.error("Error opening PDF in new window:", error);
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
   * Generate HTML for decoupe invoice
   */
  static generateDecoupeInvoiceHTML(invoice) {
    const tableRows =
      invoice.items
        ?.map((item) => {
          const productTotal = item.billable?.total_ht || 0;
          const productDescription = `${item.produit_name || "Produit"} ${
            item.description ? `(${item.description})` : ""
          }`;

          let rows = `
        <tr>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">${productDescription}</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${
            item.billable?.quantite || 0
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: right;">${(
            item.billable?.prix_unitaire || 0
          ).toFixed(3)}</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: right;">${productTotal.toFixed(
            3
          )}</td>
        </tr>
        `;

          // Add material lines if they exist
          if (item.matiere_usages && item.matiere_usages.length > 0) {
            item.matiere_usages.forEach((material) => {
              const materialTotal = material.total || 0;
              if (materialTotal > 0) {
                const materialDescription = `  Matériau: ${
                  material.nom_matiere
                } (${material.type_matiere || ""})`;

                rows += `
              <tr style="background-color: #f9f9f9;">
                <td style="border: 1px solid #000; padding: 8px; font-size: 10px; font-style: italic;">${materialDescription}</td>
                <td style="border: 1px solid #000; padding: 8px; font-size: 10px; text-align: center;">${
                  material.quantite_utilisee
                }</td>
                <td style="border: 1px solid #000; padding: 8px; font-size: 10px; text-align: right;">${(
                  material.prix_unitaire || 0
                ).toFixed(3)}</td>
                <td style="border: 1px solid #000; padding: 8px; font-size: 10px; text-align: right;">${materialTotal.toFixed(
                  3
                )}</td>
              </tr>
              `;
              }
            });
          }

          return rows;
        })
        .join("") || "";

    const totals = {
      totalHT: invoice.total_ht || 0,
      totalTVA: invoice.total_tax || 0,
      totalTTC: invoice.total_ttc || 0,
    };

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <title>Facture Découpe - RM METALASER</title>
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
              .header h1 {
                  margin: 8px 0;
                  color: #333;
                  font-size: 24px;
                  text-transform: uppercase;
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
              .invoice-info {
                  display: flex;
                  justify-content: space-between;
                  margin: 20px 0;
              }
              .company-info {
                  width: 48%;
              }
              .invoice-details {
                  width: 48%;
                  text-align: right;
              }
              .client-info {
                  margin: 20px 0;
                  border: 2px solid #000;
                  padding: 12px;
                  background: #f9f9f9;
                  font-size: 11px;
              }
              .items-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 15px 0;
                  font-size: 10px;
              }
              .items-table th {
                  border: 2px solid #000;
                  padding: 8px 4px;
                  text-align: center;
                  background-color: #333;
                  color: white;
                  font-weight: bold;
                  font-size: 10px;
              }
              .items-table td {
                  border: 1px solid #000;
                  padding: 6px 4px;
                  font-size: 10px;
              }
              .totals {
                  margin: 20px 0;
                  text-align: right;
              }
              .totals-table {
                  width: 300px;
                  border-collapse: collapse;
                  margin-left: auto;
                  font-size: 11px;
              }
              .totals-table td {
                  padding: 6px 10px;
                  border: 1px solid #000;
              }
              .totals-table .total-row {
                  background-color: #f0f0f0;
                  font-weight: bold;
              }
              .signature {
                  margin-top: 30px;
                  display: flex;
                  justify-content: space-between;
                  font-size: 10px;
              }
              .signature-box {
                  width: 200px;
                  height: 80px;
                  border: 1px solid #000;
                  text-align: center;
                  padding: 10px;
              }
              .footer {
                  margin-top: 30px;
                  text-align: center;
                  font-size: 9px;
                  font-style: italic;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <img src="https://s6.imgcdn.dev/Y6OYhg.jpg" alt="RM METALASER Logo">
              <h1>FACTURE</h1>
              <p>
                  RM METALASER - Découpes Métaux<br>
                  Rue hedi khfecha Z Madagascar 3047 - Sfax ville<br>
                  IF: 191 1419B/M/A/000<br>
                  Tél. : +216 20 366 150<br>
                  Email: contact@rmmetalaser.tn<br>
                  Site Web: <a href="http://www.rmmetalaser.tn">www.rmmetalaser.tn</a>
              </p>
          </div>

          <div class="invoice-info">
              <div class="invoice-details">
                  <p><strong>Date:</strong> ${invoice.date_emission || ""}</p>
                  <p><strong>Facture N°:</strong> ${
                    invoice.numero_facture || ""
                  }</p>
              </div>
          </div>

          <div class="client-info">
              <h4>Client</h4>
              <strong>Nom:</strong> ${
                invoice.client_details?.nom_client || "N/A"
              }<br>
              <strong>Adresse:</strong> ${
                invoice.client_details?.adresse || "N/A"
              }<br>
              <strong>Matricule Fiscale:</strong> ${
                invoice.client_details?.numero_fiscal || "N/A"
              }<br>
              <strong>Tél.:</strong> ${
                invoice.client_details?.telephone || "N/A"
              }
          </div>

          <table class="items-table">
              <thead>
                  <tr>
                      <th style="width: 50%;">Description</th>
                      <th style="width: 15%;">Quantité</th>
                      <th style="width: 17.5%;">Prix unitaire (DT)</th>
                      <th style="width: 17.5%;">Total HT (DT)</th>
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
                      <td style="text-align: right;">${totals.totalHT.toFixed(
                        3
                      )} DT</td>
                  </tr>
                  <tr>
                      <td><strong>TVA (${invoice.tax_rate || 19}%)</strong></td>
                      <td style="text-align: right;">${totals.totalTVA.toFixed(
                        3
                      )} DT</td>
                  </tr>
                  <tr class="total-row">
                      <td><strong>Total TTC</strong></td>
                      <td style="text-align: right;"><strong>${totals.totalTTC.toFixed(
                        3
                      )} DT</strong></td>
                  </tr>
              </table>
          </div>

          <div class="signature">
              <div>
                  <p><strong>Signature Client:</strong></p>
                  <div class="signature-box">
                      <p style="margin-top: 50px;">Signature et cachet</p>
                  </div>
              </div>
              <div>
                  <p><strong>Signature R.C:</strong></p>
                  <div class="signature-box">
                      <p style="margin-top: 50px;">Signature et cachet</p>
                  </div>
              </div>
          </div>

          <div class="footer">
              <p>Merci pour votre confiance !</p>
              <p>
                  Date d'émission: ${invoice.date_emission || ""} — 
                  Facture N°: ${invoice.numero_facture || ""} — 
                  Total TTC: ${totals.totalTTC.toFixed(3)} DT
              </p>
          </div>
      </body>
      </html>
    `;
  }
}

export default BonLivraisonDecoupePdfService;
