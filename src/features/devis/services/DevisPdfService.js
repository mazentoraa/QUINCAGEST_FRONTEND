class DevisPdfService {
  // Your APDF.io API token
  static API_TOKEN = "kMZrwMgVmmej90g7wimNOcvwFaGRQhXndOVKfTSPf540b6d3";
  static API_URL = "https://apdf.io/api/pdf/file/create";

  /**
   * Test the API connection
   */
  static async testAPI() {
    try {
      console.log("Testing APDF.io API connection for devis...");

      const testHTML =
        "<html><body><h1>Test Devis PDF</h1><p>This is a test document for devis generation.</p></body></html>";

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
          this.openPDFInNewWindow(data.file, "Test Devis PDF");
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
   * Generate PDF for devis
   */
  static async generateDevisPDF(devisData, filename = "devis.pdf") {
    try {
      console.log("Generating devis PDF using APDF.io API...");

      const htmlContent = this.generateDevisHTML(devisData);
      console.log("Generated HTML for devis API (length):", htmlContent.length);

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
      case "draft":
        return "#8c8c8c";
      case "sent":
        return "#1890ff";
      case "accepted":
        return "#52c41a";
      case "rejected":
        return "#ff4d4f";
      case "expired":
        return "#faad14";
      case "converted":
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
      draft: "Brouillon",
      sent: "Envoyé",
      accepted: "Accepté",
      rejected: "Rejeté",
      expired: "Expiré",
      converted: "Converti",
    };
    return statuses[status] || status;
  }

  /**
   * Format currency
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 3,
    }).format(amount || 0);
  }

  /**
   * Generate HTML for devis
   */
  static generateDevisHTML(data) {
    const tableRows = (data.produit_devis || [])
      .map((item) => {
        const total =
          item.prix_total ||
          item.quantite *
            item.prix_unitaire *
            (1 - (item.remise_pourcentage || 0) / 100);
        return `
        <tr>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px;text-align: center;">${
            item.nom_produit || `Produit ID ${item.produit}`
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${
            item.quantite || ""
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${this.formatCurrency(
            item.prix_unitaire
          )}</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${
            item.remise_pourcentage || 0
          }%</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center; font-weight: bold;">${this.formatCurrency(
            total
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
          <title>Devis ${data.numero_devis} - RM METALASER</title>
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
              .devis-info {
                  display: flex;
                  justify-content: space-between;
                  margin: 20px 0;
              }
              .client-info {
                margin-top: 40px;
            border: 1px solid #000;
            padding: 10px;
            text-align: left; 
            width:300px ; 
            line-height : 1.2 ; 
              }
              .devis-details {
                border: 1px solid #000;
    padding: 8px 24px;
    margin-top: 18px;
    display: flex;
    flex-direction:column ; 
    justify-content: center;
    width: fit-content;
              }
              .products-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                  font-size: 10px;
              }
              .products-table th {
                  border: 1px solid #000;
                  padding: 10px 6px;
                  text-align: center;
                  background-color: #f0f0f0;
                  font-weight: bold;
                  font-size: 10px;
              }
              .products-table td {
                  border: 1px solid #000;
                  padding: 8px 6px;
                  text-align: center;
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
            
              .totals-table .total-ttc {
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
              .signature {
            margin-top: 40px;
            display : flex ;
            justify-content : space-between ; 
           
        }
              .footer {
                  margin-top: 30px;
                  text-align: center;
                  font-size: 9px;
                  color: #666;
                  border-top: 1px solid #ddd;
                  padding-top: 10px;
              }
                        .rectangle {
      width: 300px;
      height: 100px;
      border: 2px dashed grey;
      background-color: #fff;
      
    }
          </style>
      </head>
      <body>
      <header style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <div class="company-info" style="text-align: left;">
            <h2 style="margin-buttom: 1px;">RM METALASER</h2>
            <p style="margin: 0; line-height: 1.5;"> <span style="color:grey; font-weight: bold; ">Découpes Métaux </span><br>
            Rue hedi khfecha ZI Madagascar 3047 - Sfax ville<br>
            MF: 191 1419B/A/M/000<br>
            Tél. : +216 20 366 150<br>
            Email: contact@rmmetalaser.tn<br>
            Site Web: <a href="http://www.rmmetalaser.tn">www.rmmetalaser.tn</a></p>
              <div class="devis-details">
                <p>  <strong>N° Devis :</strong> ${data.numero_devis || "N/A"}<br>
                  <strong>Date d'émission :</strong> ${
                    data.date_emission || "N/A"
                  }<br>
                  <strong>Valide jusqu'au :</strong> ${
                    data.date_validite || "N/A"
                  }<br>
                  <strong>Conditions :</strong> ${
                    data.conditions_paiement || "N/A"
                  }
                   </p>
              </div>
    </div>
        </div>
        <div class="logo" style="text-align: right;">
            <img src="https://s6.imgcdn.dev/Y6OYhg.jpg" alt="RM METALASER Logo" style="width: 300px; margin-bottom: 5px;">

        <div class="client-info">
                  <strong>Nom Client :</strong> ${data.nom_client || ""}<br>
                  <strong>Adresse :</strong> ${data.client_address || ""}<br>
                  <strong>M.F :</strong> ${data.client_tax_id || ""}<br>
                  <strong>Tél. :</strong> ${data.client_phone || ""}
              </div>
        </div>
    </header>
          

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
          <div style ="display:flex; justify-content : space-between" >
         

          <div class="terms-section">
              <div class="terms-title">Remarques et Conditions :</div>
              <div class="terms-content">${
                data.remarques || "Aucune remarque spécifiée."
              }</div>
          </div>

          ${
            data.notes
              ? `
          <div class="terms-section" style="margin-top: 15px;">
              <div class="terms-title">Notes internes :</div>
              <div class="terms-content">${data.notes}</div>
          </div>
          `
              : ""
          }
           <div class="totals-section">
              <table class="totals-table">
                  <tr class="total-ht">
                      <td><strong>Total HT</strong></td>
                      <td style="text-align: center;"><strong>${this.formatCurrency(
                        data.montant_ht || 0
                      )}</strong></td>
                  </tr>
                  <tr class="total-tva">
                      <td><strong>TVA (${data.tax_rate || 0}%)</strong></td>
                      <td style="text-align: center;"><strong>${this.formatCurrency(
                        data.montant_tva || 0
                      )}</strong></td>
                  </tr>
                  <tr class="total-ttc">
                      <td><strong>TOTAL TTC</strong></td>
                      <td style="text-align: center;"><strong>${this.formatCurrency(
                        data.montant_ttc || 0
                      )}</strong></td>
                  </tr>
              </table>
          </div>
            </div>
            <div class="signature">
    <div>
            <p><strong>Cachet et Signature Client </strong></p>
              <div class="rectangle"></div>
     </div>
         <div>
            <p><strong>Cachet et Signature du RM METALASER</strong></p>
              <div class="rectangle"></div>
     </div>
       
    </div>
          

      </body>
      </html>
    `;
  }
}

export default DevisPdfService;