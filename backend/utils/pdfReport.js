// backend/utils/pdfReport.js
const fs = require('fs');
const PDFDocument = require('pdfkit');

/**
 * Skapar en PDF-rapport med AI-analysen.
 * @param {object} opts
 *  - excelName: filnamn på Excel-filen
 *  - uploadedAt: ISO-tid
 *  - analysis: text från Gemini
 *  - outPath: var PDF-filen ska sparas
 */
function createPdfReport({ excelName, uploadedAt, analysis, outPath }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outPath);

    doc.pipe(stream);

    doc.fontSize(22).text('Miljörapport', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Källa: ${excelName}`);
    doc.text(`Genererad: ${new Date(uploadedAt).toLocaleString('sv-SE')}`);
    doc.moveDown();

    doc.fontSize(14).text('AI-baserad analys', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(analysis, { align: 'left' });

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = { createPdfReport };
