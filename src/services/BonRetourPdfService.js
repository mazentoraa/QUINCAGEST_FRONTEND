import moment from "moment";

class BonRetourPdfService {
  // APDF.io API token and URL (replace with your actual token if different)
  static API_TOKEN = "kMZrwMgVmmej90g7wimNOcvwFaGRQhXndOVKfTSPf540b6d3"; // Example token
  static API_URL = "https://apdf.io/api/pdf/file/create";

  static statusOptions = [
    { label: "Brouillon", value: "draft" },
    { label: "Envoyé", value: "sent" },
    { label: "Terminé", value: "completed" },
    { label: "Annulé", value: "cancelled" },
  ];

  static async generateBonRetourPDF(bonData, filename = "bon-retour.pdf") {
    try {
      console.log("Generating Bon de Retour PDF using APDF.io API...",bonData);
      const htmlContent = this.generateBonRetourHTML(bonData);
      // console.log("Generated HTML for Bon de Retour API (length):", htmlContent.length); // For debugging

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
          return { success: true, file: data.file };
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
      throw error; // Re-throw to be caught by the caller
    }
  }

  static openPDFInNewWindow(url, title = "PDF Document") {
    try {
      const newWindow = window.open(
        url,
        "_blank",
        "width=1000,height=800,scrollbars=yes,resizable=yes"
      );
      if (newWindow) {
        newWindow.document.title = title;
        newWindow.focus();
      } else {
        this.createDownloadLink(url, title);
      }
    } catch (error) {
      console.error("Error opening PDF in new window:", error);
      this.createDownloadLink(url, title);
    }
  }

  static createDownloadLink(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank"; // Open in new tab for viewing, download attribute handles filename
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  static getDimensionDisplayValue(valPrimary, valSecondary) {
    if (valPrimary !== undefined && valPrimary !== null)
      return valPrimary.toString();
    if (valSecondary !== undefined && valSecondary !== null)
      return valSecondary.toString();
    return "-";
  }

  static generateBonRetourHTML(bonData) {
    const client = bonData.client || {};
    const statusObj = this.statusOptions.find(
      (s) => s.value === bonData.status
    );
    const statusLabel = statusObj ? statusObj.label : bonData.status;

    let materialRows = "";
    if (bonData.matiere_retours && bonData.matiere_retours.length > 0) {
      bonData.matiere_retours.forEach((retour) => {
        const matiere_details = retour.matiere_details || retour.matiere || {}; // Added fallback to retour.matiere
        const quantity = (
          retour.quantite_retournee ??
          retour.quantity ??
          retour.quantite ??
          "0"
        ).toString();

        const thickness = this.getDimensionDisplayValue(
          matiere_details.thickness,
          matiere_details.epaisseur
        );
        const length = this.getDimensionDisplayValue(
          matiere_details.length,
          matiere_details.longueur
        );
        const width = this.getDimensionDisplayValue(
          matiere_details.width,
          matiere_details.largeur
        );
        const dimensions = `${thickness}x${length}x${width}mm`;

        const type =
          matiere_details.type_matiere ||
          matiere_details.type ||
          matiere_details.category ||
          "N/A";
        const description =
          matiere_details.description ||
          matiere_details.designation ||
          matiere_details.name ||
          matiere_details.nom ||
          "N/A";

        materialRows += `
          <tr>
           <td style="border: 1px solid #000; padding: 6px 4px; font-size: 10px;text-align:center;">${retour.nom_matiere}</td>
            <td style="border: 1px solid #000; padding: 6px 4px; font-size: 10px; text-align: center;">${quantity}</td>
          </tr>
        `;
      });
    } else {
      materialRows =
        '<tr><td colspan="4" style="border: 1px solid #000; padding: 6px 4px; font-size: 10px; text-align:center;">Aucune matière retournée</td></tr>';
    }

    // Default company details (can be customized or passed in bonData if needed)
    const company = {
      name: "RM METALASER",
      address: "Rue hedi khfecha Z Madagascar 3047 - Sfax ville",
      if: "191 1419B/A/M/000",
      tel: "+216 20 366 150",
      email: "contact@rmmetalaser.tn",
      website: "www.rmmetalaser.tn",
      logoUrl: "https://s6.imgcdn.dev/Y6OYhg.jpg", // Same logo as BonRetourDecoupe
    };

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <title>Bon de Retour - ${bonData.numero_bon}</title>
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
  margin-top : 20px ;
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

  <!-- Bon de Retour and Client info, each 50% -->
  <!-- Bon de Retour and Client info, each 50% -->
<div style="display: flex; flex-direction: row; margin-top: 20px; gap: 20px;">
  <!-- Bon de Retour Section -->
  <div style="width: 50%;">
    <div class="order-header" style="margin-bottom: 10px; ">
      <h2>Bon de Retour</h2>
    </div>
    <div style="display: flex; flex-direction: row;gap: 10px; width:100%">
      <div  style="flex: 1;" class="order-header">
        <p><strong>Bon N°:</strong> <br> ${bonData.numero_bon || "N/A"}</p>
      </div>
      <div  style="flex: 1;" class="order-header">
        <p><strong>Date:</strong> <br>${
          bonData.date_emission
            ? moment(bonData.date_emission).format("DD/MM/YYYY")
            : moment(bonData.date_retour).format("DD/MM/YYYY") // Fallback to date_retour if emission not present
        }</p>
      </div>
      <div  style="flex: 1;" class="order-header">
        <p><strong>Code Client:</strong> <br> ${client.code_client || "N/A"}</p>
      </div>
    </div>
  </div>

  <!-- Client Info -->
  <div class="order-header" style="width: 50%; text-align: left; padding-left:20px">
    <p><strong>Nom Client:</strong>  ${client.nom_client || "N/A"}</p>
    <p>Adresse:${client.adresse || "N/A"}</p>
    <p>M.F: ${
      client.numero_fiscal || "N/A"
    }</p>
    <p>Tél.: ${client.telephone || "N/A"}</p>
  </div>
</div>

    </header>
       
        
          <table class="items-table">
              <thead>
                  <tr>
                      <th style="width: 25%;">Matière</th>
                      <th style="width: 15%;">Quantité Retournée</th>
                  </tr>
              </thead>
              <tbody>
                  ${materialRows}
              </tbody>
          </table>

          ${
            bonData.notes
              ? `
                <div class="notes-section">
                    <h4>Notes Supplémentaires</h4>
                    <p>${bonData.notes.replace(/\n/g, "<br>")}</p>
                </div>
              `
              : ""
          }

          
 
    <div style="display:flex ; flex-direction:row ; margin-top :20px ; height :150px">
           <div style="width:50% ; border: 1px solid black; padding-left: 18px; padding-top:0;text-align:center;">
    <p><strong>Cachet et Signature Client</strong></p>
    </div>
        <div style="width:50% ; border: 1px solid black; padding-left: 18px; padding-top:0;text-align:center;">
    <p><strong>Cachet et Signature du RM METALASER</strong></p>
    </div>
       
    </div>
      </body>
      </html>
    `;
  }
}

export default BonRetourPdfService;
