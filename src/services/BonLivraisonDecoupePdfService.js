import n2words from 'n2words';


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

   static formatCurrency(value) {
    const number = parseFloat(value);
    return isNaN(number) ? '0.00' : number.toFixed(3);
  }

  /**
   * Generate HTML for decoupe invoice
   */
  static generateDecoupeInvoiceHTML(invoice) {
    console.log(invoice);
    const tableRows =
      invoice.items
        ?.map((item) => {
          const productTotal = item.billable?.total_ht || 0;
          const productDescription = `${item.produit_name || "Produit"} ${
            item.description ? `(${item.description})` : ""
          }`;

          let rows = `
        <tr>
           <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
    ${item.code_produit || "N/A"}
  </td>
  <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
    ${item.nom_produit || "N/A"}
  </td>
   <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
    ${item.billable?.quantite || 0}
  </td>
   <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center;">${this.formatCurrency(
     item.billable?.prix_unitaire || 0
   )}</td>
             <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
    ${item.billable?.remise_percent || 0}%
  </td>
     <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
    ${this.formatCurrency(productTotal)}
  </td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">
    ${invoice.tax_rate || 20}%
  </td>
    <td style="border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle;">${this.formatCurrency(
      productTotal * (1 + (invoice.tax_rate || 0) / 100)
    )}</td>
        </tr>
        `;

          // Add material lines if they exist
          // if (item.matiere_usages && item.matiere_usages.length > 0) {
          //   item.matiere_usages.forEach((material) => {
          //     const materialTotal = material.total || 0;
          //     if (materialTotal > 0) {
          //       const materialDescription = `  Matériau: ${
          //         material.nom_matiere
          //       } (${material.type_matiere || ""})`;

          //       rows += `
          //     <tr style="background-color: #f9f9f9;">
          //       <td style="border: 1px solid #000; padding: 8px; font-size: 10px; font-style: italic;">${materialDescription}</td>
          //       <td style="border: 1px solid #000; padding: 8px; font-size: 10px; text-align: center;">${
          //         material.quantite_utilisee
          //       }</td>
          //       <td style="border: 1px solid #000; padding: 8px; font-size: 10px; text-align: right;">${(
          //         material.prix_unitaire || 0
          //       ).toFixed(3)}</td>
          //       <td style="border: 1px solid #000; padding: 8px; font-size: 10px; text-align: right;">${materialTotal.toFixed(
          //         3
          //       )}</td>
          //     </tr>
          //     `;
          //     }
          //   });
          // }

          return rows;
        })
        .join("") || "";

    const totals = {
      totalHT: invoice.total_ht || 0,
      totalTVA: invoice.total_tax || 0,
      totalTTC: invoice.total_ttc || 0,
    };

    const totalRemise = invoice.items.reduce((acc, item) => {
      const prixUnitaire = item.billable.prix_unitaire || 0;
      const quantite = item.billable.quantite || 0;
      const remisePourcentage = item.billable.remise_percent || 0;

      const remise = prixUnitaire * quantite * (remisePourcentage / 100);
      return acc + remise;
    }, 0);
      const totalBrut = invoice.items.reduce((acc, item) => {
        const prixUnitaire = item.billable.prix_unitaire || 0;
        const quantite = item.billable.quantite || 0;
        return acc + prixUnitaire * quantite;
      } , 0 )
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <title>Facture Découpe - RM METALASER</title>
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
          .order-header {
    border: 1px solid #000;
    padding : 2px 8px
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
        <span style="color: blue; font-weight: bold;">Découpes Métaux</span><br>
        Rue hedi khfecha ZI Madagascar 3047 - Sfax ville<br>
        MF: 191 1419B/A/M/000<br>
        Tél. : +216 20 366 150<br>
        Email: contact@rmmetalaser.tn<br>
        Site Web: <a href="http://www.rmmetalaser.tn">www.rmmetalaser.tn</a>
      </p>
    </div>
    <div class="logo" style="text-align: right;">
 <img src="https://i.postimg.cc/7hhjQYRS/logo.jpg" alt="RM METALASER Logo" style="width: 300px; margin-bottom: 5px;">    </div>
  </div>

  <!-- Bon de livraison and Client info, each 50% -->
  <!-- Bon de livraison and Client info, each 50% -->
<div style="display: flex; flex-direction: row; margin-top: 20px; gap: 20px;">
  <!-- Bon de livraison Section -->
  <div style="width: 50%;">
    <div class="order-header" style="margin-bottom: 10px; ">
      <h2>Bon de livraison</h2>
    </div>
    <div style="display: flex; flex-direction: row;gap: 10px; width:100%">
      <div  style="flex: 1;" class="order-header">
        <p><strong>Bon N°:</strong> <br> ${invoice.numero_facture || "N/A"} </p>
      </div>
      <div  style="flex: 1;" class="order-header">
        <p><strong>Date:</strong> <br> ${invoice.date_emission || "N/A"}</p>
      </div>
      <div  style="flex: 1;" class="order-header">
        <p><strong>Code Client:</strong> <br>  0001 </p>
      </div>
    </div>
  </div>

  <!-- Client Info -->
  <div class="order-header" style="width: 50%; text-align: left; padding-left:20px">
    <p><strong>Nom Client:</strong> ${
      invoice.client_details?.nom_client || "N/A"
    }</p>
    <p>Adresse: ${invoice.client_details?.adresse || "N/A"}</p>
    <p>M.F: ${invoice.client_details?.numero_fiscal || "N/A"}</p>
    <p>Tél.: ${invoice.client_details?.telephone || "N/A"}</p>
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
    <th style="width: 12%;text-align: center; vertical-align: middle; border: 1px solid #000;">Total P. TTC</th>
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
        <td style="border: 1px solid black; padding: 8px;">${this.formatCurrency(totals.totalHT)}</td>
        <td style="border: 1px solid black; padding: 8px;">${ invoice.tax_rate || 20}%</td>
        <td style="border: 1px solid black; padding: 8px;">${this.formatCurrency(totals.totalTVA)}</td>
      </tr>
      <tr style="height: 20px;">
        <td colspan="2" style="border: 1px solid black; padding: 8px;">${this.formatCurrency(totals.totalHT)}</td>
        <td style="border: 1px solid black; padding: 8px;">${this.formatCurrency(totals.totalTVA)}</td>
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
      <td style="border: 1px solid black; padding: 2px;">${this.formatCurrency((totalBrut|| 0) )}</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Total Remise</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatCurrency(totalRemise)}</td>
    </tr>

    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Total HTVA</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatCurrency(totalBrut - totalRemise || 0)}</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Total TVA</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatCurrency(totals.totalTVA|| 0)}</td>
    </tr>
    
    <tr>
      <td style="border: 1px solid black; padding: 2px;"><strong>Net à Payer</strong></td>
      <td style="border: 1px solid black; padding: 2px;">${this.formatCurrency((totalBrut - totalRemise || 0) + totals.totalTVA )}</td>
    </tr>
  </table>
</div>
          <div style="display: flex; flex-direction: row; justify-content: space-between; margin-top: 20px;">
  <div style="width:50% ; border: 1px solid black; padding: 5px ;">
   <p style="padding : 12px ">
         <strong>
         Arrêtée la présente facture à la somme de:
         </strong> <br>
         ${this.formatMontantEnLettres((totals.totalTTC || 0))}
    
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
  static formatMontantEnLettres(amount) {
        const dinars = Math.floor(amount);
        const millimes = Math.round((amount - dinars) * 1000);
      
        const dinarsEnLettres = n2words(dinars, { lang: 'fr' });
        const millimesEnLettres = millimes > 0 ? `et ${n2words(millimes, { lang: 'fr' })} millimes` : '';
      
        return `${dinarsEnLettres} dinars ${millimesEnLettres}`;
      }
}

export default BonLivraisonDecoupePdfService;