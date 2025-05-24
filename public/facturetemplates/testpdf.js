// puppeteer script
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file:///home/barribarri/Downloads/application1%20-%20Copie/src/facturetemplates/facture_rm_metalazer.html', { waitUntil: 'networkidle0' });
  await page.pdf({ path: '/home/barribarri/Downloads/application1 - Copie/src/facturetemplates/invoice.pdf', format: 'A4' });
  await browser.close();
})();
