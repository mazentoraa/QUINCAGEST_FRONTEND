import n2words from 'n2words';
class BonCommandePdfApiService {
  // Use the same APDF.io API as ClientMaterialPdfService
  static API_TOKEN = "kMZrwMgVmmej90g7wimNOcvwFaGRQhXndOVKfTSPf540b6d3";
  static API_URL = "https://apdf.io/api/pdf/file/create";

  static async generateOrderPDF(orderData, filename = "bon-commande.pdf") {
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

  static openPDFInNewWindow(fileUrl, filename) {
    try {
      console.log("Opening PDF in new window:", fileUrl);

      const newWindow = window.open(
        fileUrl,
        "_blank",
        "width=1000,height=800,scrollbars=yes,resizable=yes"
      );

      if (newWindow) {
        newWindow.document.title = filename;
        newWindow.focus();
        console.log("PDF opened successfully in new window");
      } else {
        console.warn("Popup blocked, creating download link");
        this.createDownloadLink(fileUrl, filename);
      }
    } catch (error) {
      console.error("Error opening PDF in new window:", error);
      this.createDownloadLink(fileUrl, filename);
    }
  }

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
  static formatFloat(value) {
    const number = parseFloat(value);
    return isNaN(number) ? '0.000' : number.toFixed(3);
  }
  
  static generateOrderHTML(orderData) {
    const items = orderData.produit_commande || [];

    const itemsHTML = items
      .map((item) => {
        const remise = item.remise_pourcentage || 0;
        const totalPHT = (item.quantite || 0) * (item.prix_unitaire || 0) * (1 - remise / 100);
        const fodec = totalPHT * 0.01; // 1%
        const totalPHTVA = totalPHT + fodec;
        const tva = orderData.tax_rate || 20;
        const totalPTTC = totalPHTVA + (totalPHTVA * tva / 100);

        return `
      <tr>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${
          item.ref_produit || ""
        }</td>
        <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">${
          item.nom_produit || "N/A"
        }</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${
          item.quantite || 0
        }</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${
          this.formatFloat(item.prix_unitaire || 0)
        }</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${
          remise
        }%</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${
          this.formatFloat(totalPHT)
        }</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">1%</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${
          this.formatFloat(totalPHTVA)
        }</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${
          tva
        }%</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${
          this.formatFloat(totalPTTC)
        }</td>
      </tr>
    `;
      })
      .join("");
      const totalRemise = orderData.produit_commande.reduce((acc, item) => {
  const prixUnitaire = item.prix_unitaire || 0;
  const quantite = item.quantite || 0;
  const remisePourcentage = item.remise_pourcentage || 0;

  const remise = prixUnitaire * quantite * (remisePourcentage / 100);
  return acc + remise;
}, 0);

// ✅ total brut = somme des PU * quantité
const totalBrut = orderData.produit_commande.reduce((acc, item) => {
  const prixUnitaire = item.prix_unitaire || 0;
  const quantite = item.quantite || 0;
  return acc + prixUnitaire * quantite;
}, 0);

// ✅ FODEC = 1% du total brut
const fodec = totalBrut * 0.01;

// ✅ total HTVA = total brut + fodec
const totalHTVA = totalBrut + fodec;

// ✅ TVA = total HTVA * taux
const totalTVA = totalHTVA * ((orderData.tax_rate || 0) / 100);


// ✅ net à payer = total HTVA + TVA + timbre fiscal
const netAPayer = totalHTVA + totalTVA + (orderData.timbre_fiscal || 0);

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Bon de Commande RM METALASER</title>
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
  <!-- Bon de Commande Section -->
  <div style="width: 50%;">
    <div class="order-header" style="margin-bottom: 10px;">
      <h2>Bon de Commande</h2>
      </div>
          <div style="display: flex; flex-direction: row; justify-content: space-between; gap: 10px;">
      <div class="order-header">
        <p><strong> :</strong> <br> ${orderData.numero_commande || "N/A"} </p>
      </div>
      <div class="order-header">
        <p><strong>Date:</strong> ${ orderData.date_commande || "N/A"}</p>
      </div>
      <div class="order-header">
        <p><strong>Code Client:</strong> ${orderData.code_client || "N/A"}</p>
      </div>
    </div>
  </div>

  <!-- Client Info -->
  <div class="order-header" style="width: 50%; text-align: left; padding-left:20px">
    <p><strong>Nom Client:</strong> ${orderData.nom_client || "N/A"}</p>
    <p>Adresse: ${orderData.client_address || "N/A"}</p>
    <p>M.F: ${orderData.client_tax_id || "N/A"}</p>
    <p>Tél.: ${orderData.client_phone || "N/A"}</p>
  </div>
</div>

</header>
<div style="margin-top: 20px;" class="order-details">
        <table>
            <thead>
 <tr>
    <th style="width: 8%; text-align: center; vertical-align: middle; border: 1px solid #000;">Code</th>
    <th style="width: 18%; text-align: center; vertical-align: middle;border: 1px solid #000;">DESIGNATION</th>
    <th style="width: 6%; text-align: center; vertical-align: middle; border: 1px solid #000;">QTE</th>
    <th style="width: 13%;text-align: center; vertical-align: middle; border: 1px solid #000;">P.U. HT</th>
    <th style=" width: 7%; text-align: center; vertical-align: middle; border: 1px solid #000;">REMISE</th>
    
            <th style="width: 13%; text-align: center; vertical-align: middle; border: 1px solid #000;">Total P. HT</th>
        <th style="width: 6%; text-align: center; vertical-align: middle; border: 1px solid #000;">Fodec</th>
        <th style="width: 13%; text-align: center; vertical-align: middle; border: 1px solid #000;">Total P. HTVA</th>
        <th style="width: 5%; text-align: center; vertical-align: middle; border: 1px solid #000;">TVA</th>
        <th style="width: 18%; text-align: center; vertical-align: middle; border: 1px solid #000;">Total P. TTC</th>
          </tr>
</thead>

            <tbody>
                        ${itemsHTML}
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
        <td style="border: 1px solid black; padding: 8px;">${this.formatFloat(totalHTVA || 0)}</td>
        <td style="border: 1px solid black; padding: 8px;">${orderData.tax_rate} %</td>
        <td style="border: 1px solid black; padding: 8px;">${this.formatFloat(totalTVA)}</td>
      </tr>
      <tr style="height: 20px;">
        <td colspan="2" style="border: 1px solid black; padding: 8px;">${this.formatFloat(totalHTVA)}</td>
        <td style="border: 1px solid black; padding: 8px;">${this.formatFloat(totalTVA)}</td>
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
      <td style="border: 1px solid black; padding: 2px;">${this.formatFloat(totalBrut || 0) }</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Total Remise</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatFloat(totalRemise)}</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Fodec (1%)</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatFloat(fodec)}</td>
    </tr>

    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Total HTVA</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatFloat(totalHTVA || 0)}</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Total TVA</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatFloat(totalTVA || 0)}</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Timbre Fiscal</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatFloat(orderData.timbre_fiscal || 0)}</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Net à Payer</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatFloat(netAPayer)}</td>
    </tr>
  </table>
</div>


  <div style="display: flex; flex-direction: row; justify-content: space-between; margin-top: 20px;">
  <div style="width:50% ; border: 1px solid black; padding: 5px ;">
   <p style="padding : 12px ">
         <strong>
         Arrêtée la présente bon de commande à la somme de:
         </strong> <br>
         ${this.formatMontantEnLettres((netAPayer || 0))}
    
         </p>
   </div>
   <div style="width:50% ; border: 1px solid black; padding-left: 18px; padding-top:0;text-align:center;">
    <p><strong>Signature</strong></p>
    </div>
 </div>

 </div>


</body>
</html>
    `;
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: " ",
    }).format(amount || 0);
  }

  static translateStatus(status) {
    const statusMap = {
      pending: "En attente",
      processing: "En cours",
      completed: "Terminée",
      cancelled: "Annulée",
      invoiced: "Facturée",
    };
    return statusMap[status] || status;
  }

  static async testAPI() {
    try {
      console.log("Testing APDF.io API connection for orders...");

      const testHTML =
        "<html><body><h1>Test Order PDF</h1><p>This is a test document for orders.</p></body></html>";

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
          this.openPDFInNewWindow(data.file, "Test Order PDF");
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
  static formatMontantEnLettres(amount) {
        const dinars = Math.floor(amount);
        const millimes = Math.round((amount - dinars) * 1000);
      
        const dinarsEnLettres = n2words(dinars, { lang: 'fr' });
        const millimesEnLettres = millimes > 0 ? `et ${n2words(millimes, { lang: 'fr' })} millimes` : '';
      
        return `${dinarsEnLettres} dinars ${millimesEnLettres}`;
      }
}

export default BonCommandePdfApiService;
