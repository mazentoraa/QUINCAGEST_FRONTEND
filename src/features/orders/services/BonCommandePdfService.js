class BonCommandePdfService {
  // Your APDF.io API token
  static API_TOKEN = "kMZrwMgVmmej90g7wimNOcvwFaGRQhXndOVKfTSPf540b6d3";
  static API_URL = "https://apdf.io/api/pdf/file/create";

  /**
   * Test the API connection
   */
  static async testAPI() {
    try {
      console.log("Testing APDF.io API connection for orders...");

      const testHTML =
        "<html><body><h1>Test Bon de Commande PDF</h1><p>This is a test document for order generation.</p></body></html>";

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
          this.openPDFInNewWindow(data.file, "Test Bon de Commande PDF");
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
   * Generate PDF for order
   */
  static async generateOrderPDF(orderData, filename = "bon_commande.pdf") {
    try {
      console.log("Generating order PDF using APDF.io API...");

      const htmlContent = this.generateOrderHTML(orderData);
      console.log("Generated HTML for order API (length):", htmlContent.length);

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
   * Get status color for styling
   */
  static getStatusColor(status) {
    switch (status) {
      case "pending":
        return "#faad14";
      case "processing":
        return "#1890ff";
      case "completed":
        return "#52c41a";
      case "cancelled":
        return "#ff4d4f";
      case "invoiced":
        return "#13c2c2";
      default:
        return "#d9d9d9";
    }
  }

  /**
   * Get status label
   */
  static getStatusLabel(status) {
    const statuses = {
      pending: "En attente",
      processing: "En cours",
      completed: "Terminée",
      cancelled: "Annulée",
      invoiced: "Facturée",
    };
    return statuses[status] || status;
  }

  /**
   * Format currency
   */


  /**
   * Generate HTML for order
   */
  static generateOrderHTML(data) {
    console.log("Generating PDF for order data:", data); // Debug log

    const products = data.produit_commande || [];
    let tableRows = "";

    if (products.length > 0) {
      tableRows = products
        .map((item) => {
          // Calculate total with proper fallback
          const quantite = parseFloat(item.quantite) || 0;
          const prixUnitaire = parseFloat(item.prix_unitaire) || 0;
          const remisePourcentage = parseFloat(item.remise_pourcentage) || 0;

          const total =
            typeof item.prix_total === "number" // Use pre-calculated if valid
              ? item.prix_total
              : quantite * prixUnitaire * (1 - remisePourcentage / 100);

          // This console.log is for debugging the HTML generation string, not visible in client browser for APDF.io
          // console.log(
          //   `PDF Service - Product: ${item.nom_produit}, Qty: ${quantite}, Price: ${prixUnitaire}, Discount: ${remisePourcentage}%, Total: ${total}`
          // );

          return `
            <tr>
              <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">${
                item.nom_produit ||
                `Produit ID ${item.produit_id || item.produit || "N/A"}`
              }</td>
              <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${quantite}</td>
              <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: right;">${
                prixUnitaire
              }</td>
              <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${remisePourcentage}%</td>
              <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: right; font-weight: bold;">${
                total
              }</td>
            </tr>
          `;
        })
        .join("");
    } else {
      tableRows = `
        <tr>
          <td colspan="5" style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">
            Aucun produit dans cette commande.
          </td>
        </tr>
      `;
    }

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <title>Bon de Commande ${data.numero_commande} - RM METALASER</title>
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
                  margin: 15px 0 8px 0;
                  color: #333;
                  font-size: 24px;
                  text-transform: uppercase;
                  letter-spacing: 2px;
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
              .header a {
                  color: #1890ff;
                  text-decoration: none;
              }
              .order-info {
                  display: flex;
                  justify-content: space-between;
                  margin: 20px 0;
              }
              .client-info {
                  width: 48%;
                  border: 2px solid #000;
                  padding: 12px;
                  background: #f9f9f9;
                  font-size: 11px;
              }
              .order-details {
                  width: 48%;
                  border: 2px solid #000;
                  padding: 12px;
                  background: #f0f8ff;
                  font-size: 11px;
              }
              .status-badge {
                  display: inline-block;
                  padding: 4px 8px;
                  border-radius: 4px;
                  color: white;
                  font-weight: bold;
                  font-size: 10px;
                  background-color: ${this.getStatusColor(data.statut)};
              }
              .products-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                  font-size: 10px;
              }
              .products-table th {
                  border: 2px solid #000;
                  padding: 10px 6px;
                  text-align: center;
                  background-color: #e6f7ff;
                  font-weight: bold;
                  font-size: 10px;
              }
              .products-table td {
                  border: 1px solid #000;
                  padding: 8px 6px;
                  font-size: 10px;
              }
              .totals-section {
                  margin: 20px 0;
                  display: flex;
                  justify-content: flex-end;
              }
              .totals-table {
                  width: 350px;
                  border-collapse: collapse;
                  font-size: 11px;
              }
              .totals-table td {
                  padding: 8px 12px;
                  border: 1px solid #000;
              }
              .totals-table .total-ht {
                  background-color: #f5f5f5;
              }
              .totals-table .total-tva {
                  background-color: #fff7e6;
              }
              .totals-table .total-ttc {
                  background-color: #e6f7ff;
                  font-weight: bold;
                  font-size: 12px;
              }
              .terms-section {
                  margin-top: 25px;
                  padding: 15px;
                  background: #f9f9f9;
                  border: 1px solid #d9d9d9;
                  border-radius: 4px;
              }
              .terms-title {
                  font-weight: bold;
                  margin-bottom: 10px;
                  font-size: 12px;
                  color: #333;
              }
              .terms-content {
                  font-size: 10px;
                  line-height: 1.5;
                  white-space: pre-line;
              }
              .signature-section {
                  margin-top: 40px;
                  display: flex;
                  justify-content: space-between;
              }
              .signature-box {
                  width: 45%;
                  text-align: center;
                  border: 1px solid #ccc;
                  padding: 15px;
                  min-height: 60px;
              }
              .signature-title {
                  font-weight: bold;
                  margin-bottom: 10px;
                  font-size: 11px;
              }
              .footer {
                  margin-top: 30px;
                  text-align: center;
                  font-size: 9px;
                  color: #666;
                  border-top: 1px solid #ddd;
                  padding-top: 10px;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <img src="https://s6.imgcdn.dev/Y6OYhg.jpg" alt="RM METALASER Logo">
              <h1>BON DE COMMANDE</h1>
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

          <div class="order-info">
              <div class="client-info">
                  <strong>COMMANDE POUR :</strong><br><br>
                  <strong>Nom Client :</strong> ${data.nom_client || ""}<br>
                  <strong>Adresse :</strong> ${data.client_address || ""}<br>
                  <strong>M.F :</strong> ${data.client_tax_id || ""}<br>
                  <strong>Tél. :</strong> ${data.client_phone || ""}
              </div>
              
              <div class="order-details">
                  <strong>DÉTAILS DE LA COMMANDE :</strong><br><br>
                  <strong>N° Commande :</strong> ${
                    data.numero_commande || ""
                  }<br>
                  <strong>Date de commande :</strong> ${
                    data.date_commande || ""
                  }<br>
                  <strong>Date livr. prévue :</strong> ${
                    data.date_livraison_prevue || ""
                  }<br>
                  <strong>Conditions :</strong> ${
                    data.conditions_paiement || ""
                  }
              </div>
          </div>

          <table class="products-table">
              <thead>
                  <tr>
                      <th style="width: 40%;">DÉSIGNATION</th>
                      <th style="width: 12%;">QTÉ</th>
                      <th style="width: 16%;">PRIX UNIT. HT</th>
                      <th style="width: 12%;">REMISE (%)</th>
                      <th style="width: 20%;">TOTAL HT</th>
                  </tr>
              </thead>
              <tbody>
                  ${tableRows}
              </tbody>
          </table>

          <div class="totals-section">
              <table class="totals-table">
                  <tr class="total-ht">
                      <td><strong>Total HT</strong></td>
                      <td style="text-align: right;"><strong>${
                        data.montant_ht || 0
                      }</strong></td>
                  </tr>
                  <tr class="total-tva">
                      <td><strong>TVA (${data.tax_rate || 0}%)</strong></td>
                      <td style="text-align: right;"><strong>${
                        data.montant_tva || 0
                      }</strong></td>
                  </tr>
                  <tr class="total-ttc">
                      <td><strong>TOTAL TTC</strong></td>
                      <td style="text-align: right;"><strong>${
                        data.montant_ttc || 0
                      }</strong></td>
                  </tr>
              </table>
          </div>

          ${
            data.notes
              ? `
          <div class="terms-section">
              <div class="terms-title">Notes :</div>
              <div class="terms-content">${data.notes}</div>
          </div>
          `
              : ""
          }

          ${
            data.conditions_paiement
              ? `
          <div class="terms-section" style="margin-top: 15px;">
              <div class="terms-title">Conditions de Paiement :</div>
              <div class="terms-content">${data.conditions_paiement}</div>
          </div>
          `
              : ""
          }

          <div class="signature-section">
              <div class="signature-box">
                  <div class="signature-title">SIGNATURE CLIENT</div>
                  <div style="margin-top: 20px;">
                      Date : ___________<br><br>
                      Signature :
                  </div>
              </div>
              
              <div class="signature-box">
                  <div class="signature-title">SIGNATURE RM METALASER</div>
                  <div style="margin-top: 20px;">
                      Date : ___________<br><br>
                      Cachet et Signature :
                  </div>
              </div>
          </div>

          <div class="footer">
              <p>
                  Commande émise le ${data.date_commande || ""} — 
                  Total produits: ${(data.produit_commande || []).length} — 
                  Montant TTC: ${data.montant_ttc || 0}
              </p>
              <p style="margin-top: 5px;">
                  <strong>Conditions générales :</strong> Cette commande est confirmée et engage les deux parties. 
                  Les prix sont exprimés en TND et peuvent être sujets à modification selon accord préalable.
              </p>
          </div>
      </body>
      </html>
    `;
  }
}

export default BonCommandePdfService;
