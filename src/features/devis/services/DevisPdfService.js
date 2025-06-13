import n2words from 'n2words';

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
      style: "decimal",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
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
           <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
    ${item.code_produit || "N/A"}
  </td>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
    ${item.nom_produit || "N/A"}
  </td>
            <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
    ${item.quantite || 0}
  </td>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center;">${this.formatCurrency(
            item.prix_unitaire
          )}</td>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
    ${item.remise_pourcentage || 0}%
  </td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
    ${total}
  </td>
 <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
    ${item.tax_rate || 20}%
  </td>
           <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">${this.formatCurrency(
            total * (1 + (item.tax_rate || 0 )/100)
          )}</td>
        </tr>
      `;
      })
      .join("");
       const totalRemise = data.produit_devis.reduce((acc, item) => {
        const prixUnitaire = item.prix_unitaire || 0;
        const quantite = item.quantite || 0;
        const remisePourcentage = item.remise_pourcentage || 0;
  
        const remise = prixUnitaire * quantite * (remisePourcentage / 100);
        return acc + remise;
      }, 0);

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <title>Devis ${data.numero_devis} - RM METALASER</title>
          <script src="https://cdn.jsdelivr.net/npm/n2words/dist/n2words.umd.min.js"></script>
          <style>
                body {
                  font-family: Arial, sans-serif;
                  font-size: 14px;
                  color: #000;
        }
                header,footer {
            text-align: center;
            }
              .order-header {
    border: 1px solid #000;
}
   table {
  border-collapse: collapse;
}
          </style>
      </head>
      <body>
      <header style="display: flex; flex-direction: column;">
  <div style="display: flex; flex-direction: row; justify-content: space-between;">
    <div style="text-align:left" class="company-info">
      <h2 style="margin-bottom: 6px;">RM METALASER</h2>
      <p style="margin: 0; line-height: 1.5;">
        <span style="color: grey; font-weight: bold;">Découpes Métaux</span><br>
        Rue hedi khfecha ZI Madagascar 3047 - Sfax ville<br>
        MF: 191 1419B/A/M/000<br>
        Tél. : +216 20 366 150<br>
        Email: contact@rmmetalaser.tn<br>
        Site Web: <a href="http://www.rmmetalaser.tn">www.rmmetalaser.tn</a>
      </p>
    </div>
        
        <div class="logo" style="text-align: right;">
      <img src="https://i.postimg.cc/7hhjQYRS/logo.jpg" alt="RM METALASER Logo" style="width: 300px; margin-bottom: 5px;">
    </div>
  </div>
          
<div style="display: flex; flex-direction: row; margin-top: 20px; gap: 20px;">
  <!-- Devis Section -->
  <div style="width: 50%;">
    <div class="order-header" style="margin-bottom: 10px;">
      <h2>Devis</h2>
      </div>
          <div style="display: flex; flex-direction: row; justify-content: space-between; gap: 10px;">
      <div class="order-header">
        <p><strong>Devis N°:</strong> <br> ${data.numero_devis || "N/A"} </p>
      </div>
      <div class="order-header">
        <p><strong>Date:</strong> ${ data.date_emission|| "N/A"}</p>
      </div>
      <div class="order-header">
        <p><strong>Code Client:</strong> ${data.code_client || "N/A"}</p>
      </div>
    </div>
  </div>

  <!-- Client Info -->
  <div class="order-header" style="width: 50%; text-align: left; padding-left:20px">
    <p><strong>Nom Client:</strong> ${data.nom_client || "N/A"}</p>
    <p>Adresse: ${data.client_address || "N/A"}</p>
    <p>M.F: ${data.client_tax_id || "N/A"}</p>
    <p>Tél.: ${data.client_phone || "N/A"}</p>
  </div>
</div>

</header>
         <div style="margin-top: 20px;" class="order-details">
        <table>
            <thead>
  <tr>
    <th style="width: 8%; text-align: center; vertical-align: middle; border: 1px solid #000;">Code</th>
    <th style="width: 25%; text-align: center; vertical-align: middle;border: 1px solid #000;">DESIGNATION</th>
    <th style="width: 7%; text-align: center; vertical-align: middle; border: 1px solid #000;">QTE</th>
    <th style="width: 16%;text-align: center; vertical-align: middle; border: 1px solid #000;">P.U. HT</th>
    <th style=" width: 7%; text-align: center; vertical-align: middle; border: 1px solid #000;">REMISE</th>
    <th style="width: 18%;text-align: center; vertical-align: middle; border: 1px solid #000;">Total P. HT</th>
    <th style="width: 7%;text-align: center; vertical-align: middle; border: 1px solid #000;">TVA</th>
    <th style="width: 12%;text-align: center; vertical-align: middle; border: 1px solid #000;">TOTAL P. TTC</th>
  </tr>
</thead>

            <tbody>
                    ${tableRows}
            </tbody>
        </table>
    </div>

  <div style="display: flex; flex-direction: row; justify-content: space-between; margin-top: 20px;">
  
  <!-- Table 1: TVA -->
  <table style=" width:32% ; border-collapse: collapse; text-align: center; font-family: Arial, sans-serif;">
    <thead>
      <tr>
        <th style="border: 1px solid black; padding: 8px;">Base</th>
        <th style="border: 1px solid black; padding: 8px;">Taux</th>
        <th style="border: 1px solid black; padding: 8px;">Montant TVA</th>
      </tr>
    </thead>
    <tbody>
      <tr style="height: 80px;">
        <td style="border: 1px solid black; padding: 8px;">${this.formatCurrency(data.montant_ht)}</td>
        <td style="border: 1px solid black; padding: 8px;">${data.tax_rate} %</td>
        <td style="border: 1px solid black; padding: 8px;">${this.formatCurrency(data.montant_tva)}</td>
      </tr>
      <tr style="height: 20px;">
        <td colspan="2" style="border: 1px solid black; padding: 8px;">${this.formatCurrency(data.montant_ht)}</td>
        <td style="border: 1px solid black; padding: 8px;">${this.formatCurrency(data.montant_tva)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Signature Box -->
  <div style=" width:32% ; height: 150px; border: 1px solid black; padding: 8px; margin-left: 10px; text-align:center">
    <p><strong>Cachet et Signature</strong></p>
  </div>

  <!-- Totals Table -->
  <table style=" width:32% ; border-collapse: collapse; font-family: Arial, sans-serif; margin-left: 10px; font-size: 12px;">
    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Totale Brut</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatCurrency((data.montant_ttc || 0) )}</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Total Remise</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatCurrency(totalRemise)}</td>
    </tr>

    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Total HTVA</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatCurrency(data.montant_ht || 0)}</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Total TVA</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatCurrency(data.montant_tva || 0)}</td>
    </tr>

    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Net à Payer</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatCurrency((data.montant_ht || 0)+(data.montant_tva)  )}</td>
    </tr>
  </table>
</div>


  <div style="display: flex; flex-direction: row; justify-content: space-between; margin-top: 20px;">
  <div style="width:70% ; border: 1px solid black; padding: 5px ;">
   <p>
         <strong>
         Arrêtée la présente facture à la somme de:
         </strong> <br>
         ${this.formatMontantEnLettres((data.montant_ttc || 0))}
    
         </p>
   </div>
   <div style="width:30% ; border: 1px solid black; padding-left: 18px; padding-top:0;text-align:center;">
    <p><strong>Signature</strong></p>
    </div>
 </div>

 </div>

      </body>
      </html>
    `;
  }
  static formatMontantEnLettres(amount) {
      const dinars = Math.floor(amount);
      const millimes = Math.round((amount - dinars) * 1000);
    
      const dinarsEnLettres = n2words(dinars, { lang: 'fr' });
      const millimesEnLettres = millimes > 0 ? `et ${n2words(millimes, { lang: 'fr' })} millimes` : '';
    
      return `${dinarsEnLettres} dinars ${millimesEnLettres}`;
    }
}

export default DevisPdfService;