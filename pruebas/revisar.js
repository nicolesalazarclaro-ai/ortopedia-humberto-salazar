// Revisión rápida en navegador: desbordamiento horizontal, errores JS y que el editor no esté publicado.
// Uso: NODE_PATH=$(npm root -g) node pruebas/revisar.js sitio/index.html
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const archivo = 'file://' + path.resolve(process.argv[2] || 'sitio/index.html');
  const browser = await chromium.launch();
  let fallas = 0;
  for (const ancho of [390, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width: ancho, height: 900 } });
    const errores = [];
    page.on('pageerror', e => errores.push(e.message));
    await page.goto(archivo);
    const r = await page.evaluate(() => ({
      desborde: document.documentElement.scrollWidth > innerWidth,
      editor: !!document.getElementById('local-editor'),
      imgRotas: [...document.images].filter(i => i.complete && i.naturalWidth === 0).length,
      botonesWA: document.querySelectorAll('[data-wa]').length,
    }));
    const ok = !r.desborde && !r.editor && !r.imgRotas && !errores.length;
    if (!ok) fallas++;
    console.log(`${ancho}px ${ok ? 'OK' : 'FALLA'}`, JSON.stringify(r), errores.join(' | '));
    await page.close();
  }
  await browser.close();
  process.exit(fallas ? 1 : 0);
})();
