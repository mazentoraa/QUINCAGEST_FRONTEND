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
            <td style="border: 1px solid #000; padding: 6px 4px; font-size: 10px;">${type}</td>
            <td style="border: 1px solid #000; padding: 6px 4px; font-size: 10px;">${description}</td>
            <td style="border: 1px solid #000; padding: 6px 4px; font-size: 10px;">${dimensions}</td>
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
      if: "191 1419B/M/A/000",
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
                  width: 40%; /* Adjusted width */
                  text-align: right;
              }
              .client-info-box { /* Replaces .client-info */
                  margin: 20px 0;
                  border: 2px solid #000; /* Consistent border */
                  padding: 12px;
                  background: #f9f9f9; /* Consistent background */
                  font-size: 11px;
              }
              .items-table { /* Replaces .items-table from invoice */
                  width: 100%;
                  border-collapse: collapse;
                  margin: 15px 0;
              }
              .items-table th {
                  border: 2px solid #000; /* Consistent th border */
                  padding: 8px 4px;
                  text-align: center;
                  background-color: #333; /* Consistent th background */
                  color: white;
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
              .signatures {
                  margin-top: 30px; /* Consistent margin */
                  display: flex;
                  justify-content: space-between;
                  font-size: 10px;
              }
              .signature-box {
                  width: 200px; /* Consistent width */
                  height: 80px; /* Consistent height */
                  border: 1px solid #000;
                  text-align: center;
                  padding: 10px;
              }
              .signature-box p {
                  margin-top: 50px; /* Text at bottom */
              }
              .footer {
                  margin-top: 30px; /* Consistent margin */
                  text-align: center;
                  font-size: 9px; /* Consistent font size */
                  font-style: italic;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <img src="${company.logoUrl}" alt="${company.name} Logo">
              <h1>BON DE RETOUR</h1>
              <p>
                  ${company.name} - Découpes Métaux<br>
                  ${company.address}<br>
                  IF: ${company.if}<br>
                  Tél. : ${company.tel}<br>
                  Email: <a href="mailto:${company.email}">${
      company.email
    }</a><br>
                  Site Web: <a href="http://${company.website}">${
      company.website
    }</a>
              </p>
          </div>

          <div class="info-section">
              <div class="bon-details-inline">
                  <p><strong>Bon N°:</strong> ${bonData.numero_bon || "N/A"}</p>
                  <p><strong>Date d'émission:</strong> ${
                    bonData.date_emission
                      ? moment(bonData.date_emission).format("DD/MM/YYYY")
                      : moment(bonData.date_retour).format("DD/MM/YYYY") // Fallback to date_retour if emission not present
                  }</p>
                  <p><strong>Date de retour effective:</strong> ${moment(
                    bonData.date_retour
                  ).format("DD/MM/YYYY")}</p>
                  <p><strong>Date de réception effective:</strong> ${moment(
                    bonData.date_reception
                  ).format("DD/MM/YYYY")}</p>
                  <p><strong>Statut:</strong> ${statusLabel}</p>
              </div>
          </div>
          
          <div class="client-info-box">
              <h4>Client</h4>
              <strong>Nom:</strong> ${client.nom_client || "N/A"}<br>
              <strong>Adresse:</strong> ${client.adresse || "N/A"}<br>
              <strong>Matricule Fiscale:</strong> ${
                client.numero_fiscal || "N/A"
              }<br>
              <strong>Tél.:</strong> ${client.telephone || "N/A"}
          </div>

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

          <div class="signatures">
              <div>
                  <p><strong>Signature Client:</strong></p>
                  <div class="signature-box">
                      <p>Signature et cachet</p>
                  </div>
              </div>
              <div>
                  <p><strong>Signature ${company.name}:</strong></p>
                  <div class="signature-box">
                      <p>Signature et cachet</p>
                  </div>
              </div>
          </div>

          <div class="footer">
              <p>Merci pour votre collaboration !</p>
              <p>
                  Bon de Retour N°: ${bonData.numero_bon || ""} — 
                  Date: ${moment(bonData.date_retour).format("DD/MM/YYYY")}
              </p>
          </div>
      </body>
      </html>
    `;
  }
}

export default BonRetourPdfService;
