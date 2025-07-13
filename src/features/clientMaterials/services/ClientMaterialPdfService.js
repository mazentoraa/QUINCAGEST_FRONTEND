class ClientMaterialPdfService {
  // Your APDF.io API token
  static API_TOKEN = "kMZrwMgVmmej90g7wimNOcvwFaGRQhXndOVKfTSPf540b6d3";
  static API_URL = "https://apdf.io/api/pdf/file/create";

  /**
   * Test the API connection
   */
  static async testAPI() {
    try {
      console.log("Testing APDF.io API connection for client materials...");

      const testHTML =
        "<html><body><h1>Test Client Materials PDF</h1><p>This is a test document for client materials.</p></body></html>";

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
          this.openPDFInNewWindow(data.file, "Test Client Materials PDF");
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
   * Generate PDF for client materials delivery note
   */
  static async generateClientMaterialsPDF(
    materialsData,
    filename = "bon-livraison-matieres.pdf"
  ) {
    try {
      console.log("Generating client materials PDF using APDF.io API...");

      const htmlContent = this.generateClientMaterialsHTML(materialsData);
      console.log(
        "Generated HTML for materials API (length):",
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
   * Get material type color for styling
   */
  static getMaterialTypeColor(type) {
    switch (type) {
      case "acier":
        return "#1890ff";
      case "acier_inoxydable":
        return "#13c2c2";
      case "aluminium":
        return "#8c8c8c";
      case "laiton":
        return "#faad14";
      case "cuivre":
        return "#fa541c";
      case "acier_galvanise":
        return "#722ed1";
      default:
        return "#d9d9d9";
    }
  }

  /**
   * Get material type label
   */
  static getMaterialTypeLabel(type) {
    const types = {
      acier: "Acier",
      acier_inoxydable: "Acier inoxydable",
      aluminium: "Aluminium",
      laiton: "Laiton",
      cuivre: "Cuivre",
      acier_galvanise: "Acier galvanisé",
      autre: "Autre",
    };
    return types[type] || type;
  }

  /**
   * Generate HTML for client materials delivery note
   */
  static generateClientMaterialsHTML(data) {
    const tableRows = data.materials
      .map((material) => {
        return `
        <tr>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${
            material.numero_bon || ""
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${
            material.reception_date || ""
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">
            
              ${this.getMaterialTypeLabel(material.type_matiere)}
        
          </td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${
            material.thickness || "-"
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${
            material.length || "-"
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${
            material.width || "-"
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${
            material.quantite || ""
          }</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; word-wrap: break-word;">${
            material.description || ""
          }</td>
        </tr>
      `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <title>Bon de Livraison Matières - RM METALASER</title>
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
                  border: 1px solid #000;
                  padding: 10px;
                  text-align: left; 
                  width: 300px; 
                  line-height: 1.2;
              }
              .delivery-details {
                  border: 1px solid #000;
                  padding: 10px;
                  text-align: left;
                  width: 300px;
                  line-height: 1.2;
              }
              .info-container {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 20px;
                  margin-bottom: 20px;
              }
              .materials-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 15px 0;
                  font-size: 10px;
              }
              .materials-table th {
                  border: 1px solid #000;
                  padding: 8px 4px;
                  text-align: center;
                  background-color: #f0f0f0;
                  font-weight: bold;
                  font-size: 9px;
              }
              .materials-table td {
                  border: 1px solid #000;
                  padding: 6px 4px;
                  text-align: center;
                  font-size: 10px;
              }
              .summary {
                  margin: 20px 0;
                  text-align: right;
              }
              .summary-table {
                  width: 280px;
                  border-collapse: collapse;
                  margin-left: auto;
                  font-size: 11px;
              }
              .summary-table td {
                  padding: 6px 10px;
                  border: 1px solid #000;
              }
              .signature {
                  margin-top: 40px;
                  display: flex;
                  justify-content: space-between;
              }
              .remarks {
                  margin-top: 20px;
                  font-size: 10px;
                  font-style: italic;
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
                  <h2 style="margin-bottom: 1px;">RM METALASER</h2>
                  <p style="margin: 0; line-height: 1.5;">
                      <span style="color:grey; font-weight: bold;">Découpes Métaux</span><br>
                      Rue hedi khfecha ZI Madagascar 3047 - Sfax ville<br>
                      MF: 191 1419B/A/M/000<br>
                      Tél. : +216 20 366 150<br>
                      Email: contact@rmmetalaser.tn<br>
                      Site Web: <a href="http://www.rmmetalaser.tn">www.rmmetalaser.tn</a>
                  </p>
              </div>
              <div class="logo" style="display: flex; flex-direction: column; align-items: flex-end; text-align: right;">
                  <img src="https://i.postimg.cc/7hhjQYRS/logo.jpg" alt="RM METALASER" style="width: 300px;">
              </div>
          </header>

          <!-- Section avec les deux boîtes alignées horizontalement -->
          <div class="info-container">
              <div class="delivery-details">
                  <p><strong>Bon de Livraison N°:</strong> ${data.deliveryNumber || "N/A"}</p>
                  <p><strong>Date:</strong> ${data.deliveryDate || "N/A"}</p>
                  <p><strong>Code Client:</strong> ${data.code_client || "N/A"}</p>
              </div>
              
              <div class="client-info">
                  <p><strong>Nom Client :</strong> ${data.clientName || ""}</p>
                  <p><strong>Adresse :</strong> ${data.clientAddress || ""}</p>
                  <p><strong>M.F :</strong> ${data.clientTaxId || ""}</p>
                  <p><strong>Tél. :</strong> ${data.clientPhone || ""}</p>
              </div>
          </div>

          <table class="materials-table">
              <thead>
                  <tr>
                      <th style="width: 19%;text-align: center; vertical-align: middle">N° Bon</th>
                      <th style="width: 12%;text-align: center; vertical-align: middle">Date réception</th>
                      <th style="width: 12%;text-align: center; vertical-align: middle">Type</th>
                      <th style="width: 8%;text-align: center; vertical-align: middle">Épaisseur (mm)</th>
                      <th style="width: 8%;text-align: center; vertical-align: middle">Longueur (mm)</th>
                      <th style="width: 8%;text-align: center; vertical-align: middle">Largeur (mm)</th>
                      <th style="width: 8%;text-align: center; vertical-align: middle">Quantité</th>
                      <th style="width: 25%;text-align: center; vertical-align: middle">Description</th>
                  </tr>
              </thead>
              <tbody>
                  ${tableRows}
              </tbody>
          </table>

          <div class="summary">
              <table class="summary-table">
                  <tr>
                      <td style="text-align: left;"><strong>Total quantité</strong></td>
                      <td style="text-align: center;"><strong>${data.totalQuantity || "0"}</strong></td>
                  </tr>
                  <tr>
                      <td style="text-align: left;"><strong>Nombre de matières</strong></td>
                      <td style="text-align: center;"><strong>${data.materials ? data.materials.length : "0"}</strong></td>
                  </tr>
              </table>
          </div>

          <div class="remarks">
              <p><strong>Remarques :</strong></p>
              <ul>
                  <li>Vérifier si les matières premières livrées sont en bon état.</li>
                  <li>Ce bon de livraison doit être signé par le responsable à la réception des matières.</li>
                  <li>Conserver ce document pour vos dossiers.</li>
              </ul>
          </div>

          <div class="signature">
              <div>
                  <p><strong>Cachet et Signature Responsable</strong></p>
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

export default ClientMaterialPdfService;