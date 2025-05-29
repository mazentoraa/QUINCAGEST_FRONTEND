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

    const itemsHTML = items
      .map(
        (item) => `
      <tr>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${
          item.produit_id || ""
        }</td>
        <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">${
          item.nom_produit || "N/A"
        }</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${
          item.quantite || 0
        }</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 11px;">${this.formatCurrency(
          item.prix_unitaire || 0
        )}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${
          item.remise_pourcentage || 0
        }%</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 11px;">${this.formatCurrency(
          item.prix_total || 0
        )}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${
          orderData.tax_rate || 20
        }%</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 11px;">${this.formatCurrency(
          (item.prix_total || 0) * (1 + (orderData.tax_rate || 20) / 100)
        )}</td>
      </tr>
    `
      )
      .join("");

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture RM METALASER</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            font-size: 14px;
            color: #000;
        }

        header,
        footer {
            text-align: center;
            margin-bottom: 20px;
        }

        .company-info {
            text-align: left;
            margin-bottom: 20px;
        }

        .client-info {
            margin-top: 20px;
            border: 1px solid #000;
            padding: 10px;
            width: fit-content;
        }

        .order-details {
            margin-top: 20px;
        }

        .order-details table {
            width: 100%;
            border-collapse: collapse;
        }

        .order-details th,
        .order-details td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }

        .totals {
            margin-top: 20px;
            width: 100%;
            display: flex;
            justify-content: flex-end;
        }

        .totals table {
            width: 300px;
            border-collapse: collapse;
        }

        .totals td {
            padding: 4px 8px;
            border: 1px solid #000;
        }

        .signature {
            margin-top: 40px;
            text-align: right;
        }

        .order-header {
            margin-bottom: 20px;
        }

        .conditions {
            margin-top: 20px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <header style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <div class="company-info" style="text-align: left;">
            <h2 style="margin: 0;">RM METALASER</h2>
            <p style="margin: 0;">Découpes Métaux<br>
            Rue hedi khfecha Z Madagascar 3047 - Sfax ville<br>
            IF: 191 1419B/A/M//000<br>
            Tél. : +216 20 366 150<br>
            Email: contact@rmmetalaser.tn<br>
            Site Web: <a href="http://www.rmmetalaser.tn">www.rmmetalaser.tn</a></p>
        </div>
        <div class="logo" style="text-align: right;">
            <img src="https://s6.imgcdn.dev/Y6OYhg.jpg" alt="RM METALASER Logo" style="width: 190px; margin-bottom: 5px;">
        </div>
    </header>

    <div class="client-info">
        <strong>Nom Client :</strong> ${orderData.nom_client || "N/A"}<br>
        <strong>Adresse :</strong> ${orderData.client_address || "N/A"}<br>
        <strong>M.F :</strong> ${orderData.client_tax_id || "N/A"}<br>
        <strong>Tél. :</strong> ${orderData.client_phone || "N/A"}
    </div>

    <div class="order-header">
        <p><strong>Facture N°:</strong> ${
          orderData.numero_commande || "N/A"
        }<br>
            <strong>Methode du Paiement:</strong> ${
              orderData.mode_paiement || "N/A"
            }<br>
            <strong>Date:</strong> ${orderData.date_commande || "N/A"}<br>
            <strong>Date Livraison Prévue:</strong> ${
              orderData.date_livraison_prevue || "N/A"
            }<br>
            <strong>Statut:</strong> ${this.translateStatus(
              orderData.statut
            )}<br>
        </p>
    </div>

    <div class="order-details">
        <table>
            <thead>
                <tr>
                    <th>CODE</th>
                    <th>DESIGNATION</th>
                    <th>QTE</th>
                    <th>P.U. HT (TND)</th>
                    <th>REMISE (%)</th>
                    <th>Total P. HT (TND)</th>
                    <th>TVA</th>
                    <th>TOTAL P. TTC (TND)</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>
    </div>

    <div class="totals">
        <table>
            <tr>
                <td><strong>Totale Timbre</strong></td>
                <td>${this.formatCurrency(1)}</td>
            </tr>
            <tr>
                <td><strong>Total HT</strong></td>
                <td>${this.formatCurrency(orderData.montant_ht || 0)}</td>
            </tr>
            <tr>
                <td><strong>Total TVA</strong></td>
                <td>${this.formatCurrency(orderData.montant_tva || 0)}</td>
            </tr>
            <tr>
                <td><strong>Timbre Fiscal</strong></td>
                <td>${this.formatCurrency(orderData.timbre_fiscal || 0)}</td>
            </tr>
            <tr>
                <td><strong>NET À PAYER</strong></td>
                <td><strong>${this.formatCurrency(
                  (orderData.montant_ttc || 0) + 1
                )}</strong></td>
            </tr>
        </table>
    </div>

    ${
      orderData.conditions_paiement
        ? `
    <div class="conditions">
        <p><strong>Conditions de paiement:</strong> ${orderData.conditions_paiement}</p>
    </div>`
        : ""
    }

    ${
      orderData.notes
        ? `
    <div class="conditions">
        <p><strong>Notes:</strong> ${orderData.notes}</p>
    </div>`
        : ""
    }

    <div class="signature">
        <p><strong>Cachet et Signature</strong></p>
        <p>Base: ${this.formatCurrency(
          orderData.montant_ht || 0
        )} — Taux TVA: ${
      orderData.tax_rate || 20
    }% — Montant TVA: ${this.formatCurrency(orderData.montant_tva || 0)}</p>
    </div>
</body>
</html>
    `;
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "TND",
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
