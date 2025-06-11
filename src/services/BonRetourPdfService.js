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
      console.log("Generating Bon de Retour PDF using APDF.io API...");
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
           <td style="border: 1px solid #000; padding: 6px 4px; font-size: 10px;text-align:center;">${type}</td>
            <td style="border: 1px solid #000; padding: 6px 4px; font-size: 10px;text-align:center;">${description}</td>
            <td style="border: 1px solid #000; padding: 6px 4px; font-size: 10px;text-align:center;">${dimensions}</td>
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
      logoUrl: "https://s6.imgcdn.dev/Y6OYhg.jpg", // Same logo as BonLivraisonDecoupe
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
                  font-size: 12px; /* Base font size like invoice */
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
                  width: 190px; /* Consistent logo size */
                  margin-bottom: 5px;
                  display: block;
                  margin-left: auto;
                  margin-right: auto;
              }
              .header h1 {
                  margin: 8px 0;
                  color: #333;
                  font-size: 24px; /* Consistent title size */
                  text-transform: uppercase;
              }
              .header p {
                  margin: 3px 0;
                  line-height: 1.3;
                  font-size: 11px; /* Consistent company info font size */
              }
              .header a {
                  color: #1890ff;
                  text-decoration: none;
              }
              .info-section { /* Replaces .invoice-info */
                  display: flex;
                  justify-content: space-between;
                  margin: 20px 0;
                  font-size: 11px;
              }
              .company-details-inline { /* For company details next to bon details */
                  width: 55%; /* Adjusted width */
              }
              .bon-details-inline { /* For bon details */
                 .bon-details-inline { 
               border: 1px solid #000;
                padding: 2px 10px;
                margin-top: 15px ;
                display: flex;
                flex-direction:column; 
                justify-content: center;
                width: fit-content;
                line-height : 1.5 ; 
              }
              .client-info-box { /* Replaces .client-info */
                  margin-top: 40px;
                  border: 1px solid #000;
                  padding: 10px;
                  text-align: left; 
                  width:300px ; 
                  line-height : 1.5 ;
              }
              .items-table { /* Replaces .items-table from invoice */
                  width: 100%;
                  border-collapse: collapse;
                  margin: 15px 0;
              }
              .items-table th {
                  border: 1px solid #000; /* Consistent th border */
                  padding: 8px 4px;
                  text-align: center;
                  background-color: #f0f0f0; /* Consistent th background */
                  font-weight: bold;
                  font-size: 10px; /* Consistent th font size */
              }
              .items-table td {
                  border: 1px solid #000; /* Consistent td border */
                  padding: 6px 4px;
                  font-size: 10px; /* Consistent td font size */
              }
              .notes-section { /* Replaces .notes */
                  margin-top: 20px;
                  padding: 10px;
                  border: 1px solid #eee;
                  background-color: #f9f9f9;
                  font-size: 10px;
              }
               .signature {
               margin-top: 40px;
              display : flex ;
              justify-content : space-between ; 
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
            <p style="margin: 0; line-height: 1.5;"> <span style="color:grey; font-weight: bold;  ">Découpes Métaux </span><br>
            Rue hedi khfecha ZI Madagascar 3047 - Sfax ville<br>
            MF: 191 1419B/A/M/000<br>
            Tél. : +216 20 366 150<br>
            Email: contact@rmmetalaser.tn<br>
            Site Web: <a href="http://www.rmmetalaser.tn">www.rmmetalaser.tn</a></p>
             <div class="bon-details-inline">
                  <p><strong>Bon N°:</strong> ${bonData.numero_bon || "N/A"}<br>
                  <strong>Date d'émission:</strong> ${
                    bonData.date_emission
                      ? moment(bonData.date_emission).format("DD/MM/YYYY")
                      : moment(bonData.date_retour).format("DD/MM/YYYY") // Fallback to date_retour if emission not present
                  }</p>
                }<br>
                 <strong>Date de retour effective:</strong> ${moment(
                    bonData.date_retour
                   ).format("DD/MM/YYYY")}<br>
                  <strong>Date de réception effective:</strong> ${moment(
                    bonData.date_reception
                  ).format("DD/MM/YYYY")}<br>
                  <strong>Statut:</strong> ${statusLabel}</p>
              </div>
         </div>
          <div class="logo" style="display: flex; flex-direction: column; align-items: flex-end; text-align: right;">
  <img src="https://s6.imgcdn.dev/Y6OYhg.jpg" alt="RM METALASER Logo" style="width: 300px; margin-bottom: 5px;">
<div class="client-info-box">
              <strong>Nom:</strong> ${client.nom_client || "N/A"}<br>
              <strong>Adresse:</strong> ${client.adresse || "N/A"}<br>
              <strong>Matricule Fiscale:</strong> ${
                client.numero_fiscal || "N/A"
              }<br>
              <strong>Tél.:</strong> ${client.telephone || "N/A"}
          </div>
</div>
</header>
          <table class="items-table">
              <thead>
                  <tr>
                      <th style="width: 25%;">Type Matière</th>
                      <th style="width: 35%;">Description</th>
                      <th style="width: 25%;">Dimensions</th>
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

export default BonRetourPdfService;
