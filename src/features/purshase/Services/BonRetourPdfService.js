import moment from "moment";

class BonRetourPdfService {
  static API_TOKEN = "kMZrwMgVmmej90g7wimNOcvwFaGRQhXndOVKfTSPf540b6d3";
  static API_URL = "https://apdf.io/api/pdf/file/create";

  static statusOptions = [
    { label: "Brouillon", value: "draft" },
    { label: "Envoyé", value: "sent" },
    { label: "Terminé", value: "completed" },
    { label: "Annulé", value: "cancelled" },
  ];

  static async generateBonRetourPDF(bonData, filename = "bon-retour-fournisseur.pdf") {
    try {
      const htmlContent = this.generateBonRetourHTML(bonData);

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.API_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `html=${encodeURIComponent(htmlContent)}`,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.file) {
          this.openPDFInNewWindow(data.file, filename);
          return { success: true, file: data.file };
        } else {
          throw new Error(`API returned unexpected format: ${JSON.stringify(data)}`);
        }
      } else {
        const errorText = await response.text();
        throw new Error(`PDF API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("Error generating PDF with APDF.io API:", error);
      throw error;
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
    a.target = "_blank";
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  static generateBonRetourHTML(bonData) {
    const fournisseur = bonData.fournisseur || {};
    const statusObj = this.statusOptions.find(s => s.value === bonData.status);
    const statusLabel = statusObj ? statusObj.label : bonData.status;

    let materialRows = "";
    if (bonData.matiere_retours && bonData.matiere_retours.length > 0) {
      bonData.matiere_retours.forEach(retour => {
        const quantity = (retour.quantite_retournee ?? "0").toString();
        materialRows += `
          <tr>
            <td style="border: 1px solid #000; padding: 6px; font-size: 12px; text-align: center;">
              ${retour.nom_matiere || "N/A"}
            </td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 12px; text-align: center;">
              ${quantity}
            </td>
          </tr>
        `;
      });
    } else {
      materialRows = `
        <tr>
          <td colspan="2" style="border: 1px solid #000; padding: 6px; font-size: 12px; text-align: center;">
            Aucune matière retournée
          </td>
        </tr>
      `;
    }

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Bon de Retour Fournisseur - ${bonData.numero_bon}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #000;
          }
          header, footer {
            text-align: center;
          }
          .order-header {
            border: 1px solid #000;
            padding: 2px 8px;
          }
          table {
            border-collapse: collapse;
            margin-top: 20px;
            width: 100%;
          }
        </style>
      </head>
      <body>
        <header style="display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between;">
            <div style="text-align:left">
              <h2 style="margin-bottom: 6px;">RM METALASER</h2>
              <p style="margin: 0; line-height: 1.5;">
                <span style="color: blue; font-weight: bold;">Découpes Métaux</span><br />
                Rue hedi khfecha ZI Madagascar 3047 - Sfax ville<br />
                MF: 191 1419B/A/M/000<br />
                Tél. : +216 20 366 150<br />
                Email: contact@rmmetalaser.tn<br />
                Site Web: <a href="http://www.rmmetalaser.tn">www.rmmetalaser.tn</a>
              </p>
            </div>
            <div style="text-align: right;">
              <img src="https://i.postimg.cc/7hhjQYRS/logo.jpg" alt="Logo" style="width: 300px; margin-bottom: 5px;" />
            </div>
          </div>

          <div style="display: flex; flex-direction: row; margin-top: 20px; gap: 20px;">
            <div style="width: 50%;">
              <div class="order-header" style="margin-bottom: 10px;">
                <h2>Bon de Retour Fournisseur</h2>
              </div>
              <div style="display: flex; gap: 10px;">
                <div class="order-header" style="flex: 1;">
                  <p><strong>Bon N°:</strong><br /> ${bonData.numero_bon || "N/A"}</p>
                </div>
                <div class="order-header" style="flex: 1;">
                  <p><strong>Date:</strong><br /> ${
                    bonData.date_emission
                      ? moment(bonData.date_emission).format("DD/MM/YYYY")
                      : moment(bonData.date_retour).format("DD/MM/YYYY")
                  }</p>
                </div>
              </div>
            </div>

            <div class="order-header" style="width: 50%; text-align: left; padding-left: 20px;">
              <p><strong>Nom Fournisseur:</strong> ${fournisseur.nom || "N/A"}</p>
              <p>Numéro d'enregistrement fiscal: ${fournisseur.num_reg_fiscal || "N/A"}</p>
              <p>Adresse: ${fournisseur.adresse || "N/A"}</p>
              <p>Tél.: ${fournisseur.telephone || "N/A"}</p>
            </div>
          </div>
        </header>

        <table>
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; font-size: 12px; background-color: #f2f2f2; text-align: center; width: 70%;">Achats</th>
              <th style="border: 1px solid #000; padding: 8px; font-size: 12px; background-color: #f2f2f2; text-align: center; width: 30%;">Quantité Retournée</th>
            </tr>
          </thead>
          <tbody>
            ${materialRows}
          </tbody>
        </table>

        ${
          bonData.notes
            ? `<div class="notes-section" style="margin-top: 20px;">
                <h4>Notes Supplémentaires</h4>
                <p>${bonData.notes.replace(/\n/g, "<br>")}</p>
              </div>`
            : ""
        }

        <div style="display: flex; margin-top: 20px; height: 150px;">
          <div style="width: 50%; border: 1px solid black; text-align: center;">
            <p><strong>Cachet et Signature Fournisseur</strong></p>
          </div>
          <div style="width: 50%; border: 1px solid black; text-align: center;">
            <p><strong>Cachet et Signature du RM METALASER</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default BonRetourPdfService;
