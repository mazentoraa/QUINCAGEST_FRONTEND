import n2words from 'n2words';

class FacturePdfApiService {
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

  static generateOrderHTML(orderData) {
    const items = orderData.produit_commande || [];
    const type_facture = orderData.type_facture
    // Helper to format invoice number as FAC-YYYY-NNNNN
    const formatInvoiceNumber = (order) => {
      return order.numero_commande;
    };

    // Group items by bon_numero if type_facture is "bon"
    let itemsHTML = '';
    if (type_facture === 'bon') {
      const grouped = {};
      
      items.forEach(item => {
        const bon = item.bon_numero || 'N/A';
        if (!grouped[bon]) grouped[bon] = [];
        grouped[bon].push(item);
      });

      for (const [bon_numero, group] of Object.entries(grouped)) {
        group.forEach((item, index) => {
          // Calculs ligne
          const qte = item.quantite || 0;
          const puht = item.prix_unitaire || 0;
          const remise = item.remise_pourcentage || 0;
          const fodecRate = orderData.fodec_rate || 1; // 1% par défaut
          const tvaRate = orderData.tax_rate || 0;
          const totalHT = qte * puht * (1 - remise /100 );
          const remiseVal = totalHT * (remise / 100);
          const fodecVal = totalHT * (fodecRate / 100);
          const totalHTVA = totalHT + fodecVal;
          const tvaVal = totalHTVA * (tvaRate / 100);
          const totalTTC = totalHTVA + tvaVal;
          itemsHTML += `
            <tr>
              ${index === 0 ? `
                <td rowspan="${group.length}" style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
                  ${bon_numero}
                </td>` : ''}
              <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
                ${item.ref_produit || "N/A"}
              </td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
                ${item.ref_produit || "N/A"}
              </td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
                ${qte}
              </td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
                ${puht.toFixed(3)}
              </td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
                ${remise}%
              </td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
                ${totalHT.toFixed(3)}
              </td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
                1 %
              </td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
                ${totalHTVA.toFixed(3)}
              </td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
                ${(tvaRate)}%
              </td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
                ${totalTTC.toFixed(3)}
              </td>
            </tr>`;
        });
      }
    } else {
      // Default rendering if not grouped by bon
      itemsHTML = items.map((item) => {
        const qte = item.quantite || 0;
        const puht = item.prix_unitaire || 0;
        const remise = item.remise_pourcentage || 0;
        const fodecRate = orderData.fodec_rate || 1; // 1% par défaut
        const tvaRate = orderData.tax_rate || 0;
        const totalHT = qte * puht * (1 - remise /100);
        const remiseVal = totalHT * (remise / 100);
        const fodecVal = totalHT * (fodecRate / 100);
        const totalHTVA = totalHT + fodecVal;
        const tvaVal = totalHTVA * (tvaRate / 100);
        const totalTTC = totalHTVA + tvaVal;
        return `
        <tr>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
            ${item.ref_produit || "N/A"}
          </td>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
            ${item.nom_produit || "N/A"}
          </td>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
            ${qte}
          </td>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
            ${puht.toFixed(3)}
          </td>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
            ${remise}%
          </td>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
            ${totalHT.toFixed(3)}
          </td>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
            1 %
          </td>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
            ${totalHTVA.toFixed(3)}
          </td>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
            ${(tvaRate)}%
          </td>
          <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
            ${totalTTC.toFixed(3)}
          </td>
        </tr>`;
      }).join('');
    }

  // Total brut = somme des prix unitaires * quantités
const totalBrut = items.reduce((acc, item) => {
  return acc + (item.prix_unitaire || 0) * (item.quantite || 0);
}, 0);

// Total remise = somme des remises pour chaque ligne
const totalRemise = items.reduce((acc, item) => {
  const prixUnitaire = item.prix_unitaire || 0;
  const quantite = item.quantite || 0;
  const remisePourcentage = item.remise_pourcentage || 0;

  const remise = prixUnitaire * quantite * (remisePourcentage / 100);
  return acc + remise;
}, 0);
const netCommercial = totalBrut - totalRemise;
// FODEC = 1% du total brut
const fodec = (orderData.nature == 'facture'? netCommercial * 0.01 : 0);

// Total HTVA = total brut + FODEC
const totalHTVA = netCommercial + fodec;

// TVA = total HTVA * taux TVA (%)
const tvaPourcentage = orderData.tax_rate || 0;
const totalTVA = totalHTVA * (tvaPourcentage / 100);

// Timbre fiscal
const timbreFiscal = (orderData.nature == 'facture'? orderData.timbre_fiscal || 0 : 0);

// Net à payer = HTVA + TVA + timbre
const netAPayer = totalHTVA + totalTVA + timbreFiscal;

    // const remise = prixUnitaire * quantite * (remisePourcentage / 100);
    //   return acc + remise;
    // }, 0);
    // const totalHTVA = orderData.montant_ht || 0;
    // const fodec = (orderData.nature == 'facture'? totalHTVA * 0.01 : 0);
    // const totalTVA = (totalHTVA + fodec) * ((orderData.tax_rate || 0) / 100);
    // const timbreFiscal = (orderData.nature == 'facture'? orderData.timbre_fiscal || 0 : 0);
    // const netAPayer = totalHTVA + fodec + totalTVA + timbreFiscal;


    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>${orderData.nature == 'facture'? 'Facture' : 'Avoir'}</title>
        <script src="https://cdn.jsdelivr.net/npm/n2words/dist/n2words.umd.min.js"></script>
        <style>
            body {
                font-family: Arial, sans-serif;
              
                font-size: 14px;
                color: #000;
            }

            header,
            footer {
                text-align: center;
              
            }

          

            .client-info {
                margin-top: 20px;
                border: 1px solid #000;
                padding: 10px;
                text-align: left;
                width:300px;
                line-height : 1.2 ; 
            }

            .order-details table, .totals table {
        border-collapse: collapse;
        width: 100%;
        margin-top: 5px;
      }

            .order-details th, .order-details td,
      .totals th, .totals td {
    
        border: 1px solid #ddd;
        text-align: center;
      
      }

            .totals {
                margin-top: 10px;
                width: 100%;
                display: flex;
                justify-content: space-between ; 
            }

            .totals table {
                width: 300px;
                border-collapse: collapse;
            }

            .totals td {
            
                padding: 2px ;
                border: 1px solid #000;
                text-align: start ;
                font-size: bold;
            }

            .signature {
                margin-top: 40px;
              display : flex ;
                justify-content : space-between ; 
            }
                .order-header {
        border: 1px solid #000;
        padding : 4px
    }

            

            .conditions {
                margin-top: 20px;
                font-size: 12px;
            }
                .rectangle {
          width: 300px;
          height: 100px;
          border: 2px dashed grey;
          background-color: #fff;
          
        }
    @page {
      margin-top: 0px;
      margin-bottom : 50px ;
    }
    thead {
      display: table-header-group;

    }





        </style>
    </head>
    <body>
    <table style="width: 100%; border-collapse: collapse;" cellspacing="0" cellpadding="0">
      <thead>
        <tr>
          <td colspan="2">
            <!-- Place your header here (logo, client info, etc.) -->
            <div>

            <div style="display: flex; flex-direction: row; justify-content: space-between;">
        <div style="text-align:left" class="company-info">
          <h2 style="margin-bottom: 6px;">YUCCAINFO</h2>
          <p style="margin: 0; line-height: 1.5;">
            <span style="color: grey; font-weight: bold;">Solutions ERP</span><br>
            Dar Chaabane Fehri, Nabeul, Tunisia<br>
            MF: 1883737/D/A/M/000<br>
            Tél. : +216 23 198 524 / +216 97 131 795<br>
            Email: contact@yuccainfo.com.tn<br>
            Site Web: <a href="http://www.yuccainfo.com.tn/">www.yuccainfo.com.tn/</a>
          </p>
        </div>
            
            <div class="logo" style="text-align: right; margin-top: 20px;">
          <img src="https://imgcdn.dev/i/YQD9nL" alt="YUCCAINFO Logo" style="width: 300px;">
        </div>
      </div>

      </div>
          
          </td>
        </tr>
      </thead>
    <tbody>
      <tr>
          <td colspan="2">
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead style="display: table-header-group;">
        <tr>
          <td colspan="2">
          <div style="display: flex; flex-direction: row; margin-bottom: 15px; gap: 20px;">
      <!-- Facture Section -->
      <div style="width: 50%;">
        <div class="order-header" style="margin-bottom: 10px;">
          <h2 style="text-align:center">${orderData.nature == 'facture'?'Facture': 'Avoir Client'}</h2>
        </div>
    <div style="display: flex; flex-direction: row;gap: 10px; width:100%">
          <div  style="flex: 1;" class="order-header">
            <p><strong>${orderData.nature == 'facture'? 'Facture' : 'Avoir'} N°:</strong> <br> ${formatInvoiceNumber(orderData)}</p>
          </div>
          
            <div  style="flex: 1;" class="order-header">
            <p><strong>Date: </strong> <br>  ${orderData.date_commande || "N/A"}</p>
          </div>
          <div  style="flex: 1;" class="order-header">
            <p><strong>Code Client: </strong> <br> ${orderData.code_client || "N/A"}</p>
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
      </thead>
        </tr>
      <tbody>
      <tr>
          <td colspan="2">
      <div style="margin-top: 20px; display: flex;" class="order-details">
            <table >
                <thead>
                  
                <tr>
        ${type_facture=='bon'?
        `<th style="width: 8%; text-align: center; vertical-align: middle; border: 1px solid #000;">Bon N°:</th>`
        :''}
        <th style="width: 8%; text-align: center; vertical-align: middle; border: 1px solid #000;">Code</th>
        <th style="width: 18%; text-align: center; vertical-align: middle;border: 1px solid #000;">DESIGNATION</th>
        <th style="width: 6%; text-align: center; vertical-align: middle; border: 1px solid #000;">QTE</th>
        <th style="width: 13%;text-align: center; vertical-align: middle; border: 1px solid #000;">P.U. HT</th>
        <th style="width: 7%; text-align: center; vertical-align: middle; border: 1px solid #000;">REMISE</th>
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

      


    <!-- FOOTER SECTION -->

    <div style="
      page-break-inside: avoid;
      break-inside: avoid;
      margin-top: 30px;
      padding: 10px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;

    ">
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
          <td style="border: 1px solid black; padding: 8px;">${totalHTVA.toFixed(3)}</td>
            <td style="border: 1px solid black; padding: 8px;">${orderData.tax_rate} %</td>
            <td style="border: 1px solid black; padding: 8px;">${totalTVA.toFixed(3)}</td>
          </tr>
          <tr style="height: 20px;">
            <td colspan="2" style="border: 1px solid black; padding: 8px;">${totalHTVA.toFixed(3)}</td>
            <td style="border: 1px solid black; padding: 8px;">${totalTVA.toFixed(3)}</td>
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
          <td style="border: 1px solid black; padding: 2px;"><strong>Total Brut</strong></td>
          <td style="border: 1px solid black; padding: 2px;">${(totalBrut || 0).toFixed(3) }</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 2px;"><strong>Total Remise</strong></td>
          <td style="border: 1px solid black; padding: 2px;">${ totalRemise.toFixed(3)}</td>
        </tr>
        ${orderData.nature == 'facture'? `
        <tr>
          <td style="border: 1px solid black; padding: 2px;"><strong>Fodec (1%)</strong></td>
          <td style="border: 1px solid black; padding: 2px;">${fodec.toFixed(3)}</td>
        </tr>` : '' }
        <tr>
          <td style="border: 1px solid black; padding: 2px;"><strong>Total HTVA</strong></td>
          <td style="border: 1px solid black; padding: 2px;">${totalHTVA.toFixed(3)}</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 2px;"><strong>Total TVA</strong></td>
          <td style="border: 1px solid black; padding: 2px;">${totalTVA.toFixed(3)}</td>
        </tr>
        ${orderData.nature == 'facture'?
        `<tr>
          <td style="border: 1px solid black; padding: 2px;"><strong>Timbre Fiscal</strong></td>
          <td style="border: 1px solid black; padding: 2px;">${timbreFiscal.toFixed(3)}</td>
        </tr>` : '' }
        <tr>
          <td style="border: 1px solid black; padding: 2px;"><strong>Net à Payer</strong></td>
          <td style="border: 1px solid black; padding: 2px;">${netAPayer.toFixed(3)}</td>
        </tr>

      </table>
    </div>

      <div style="display: flex; justify-content: space-between; gap: 0px; height: 120px;">
        <div style="flex: 1; border: 1px solid black; padding: 12px;">
          <p style="margin: 0;">
            <strong>${orderData.nature == 'facture'? 'Arrêtée la présente facture': 'Arrêté le présent avoir'} à la somme de:</strong><br>
            ${this.formatMontantEnLettres(netAPayer)}

          </p>
        </div>
        <div style="
      width: 32%;
      border: 1px solid black;
      text-align: center;
      display: flex;
      align-items: start;
      justify-content: center;
      padding-top: 8px;
    ">
      <strong>Signature du client</strong>
    </div>

      </div>
    </div>



      
        

        </div>

          </td>
        </tr>
      </tbody>

    </table>
        </td>
        </tr>
      </tbody>
      </table>
      
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
  static formatCurrency(amount) {
    return new Intl.NumberFormat("fr-FR", {
      // style: "currency",
      style: "decimal",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
      // currency: " ",
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
}

export default FacturePdfApiService;