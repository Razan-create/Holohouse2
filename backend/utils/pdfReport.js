const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Skapar en professionell PDF-rapport med emoji-support och boxad layout
 */
async function createDetailedPdfReport({ filename, uploadedAt, analysisData, outPath }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 60, left: 40, right: 40 }
    });

    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    const pageWidth = doc.page.width - 80;
    const leftMargin = 40;

    // Ladda emoji font
    const emojiFont = path.join(__dirname, '..', 'fonts', 'NotoEmoji-Regular.ttf');
    let hasEmojiSupport = false;
    
    try {
      if (fs.existsSync(emojiFont)) {
        doc.registerFont('Emoji', emojiFont);
        hasEmojiSupport = true;
        console.log('✅ Emoji font laddad!');
      }
    } catch (err) {
      console.log('⚠️ Emoji font ej tillgänglig');
    }

    // Helper för emoji/text
    const drawText = (emoji, text, x, y, options = {}) => {
      if (hasEmojiSupport) {
        doc.font('Emoji').text(emoji + ' ', x, y, { ...options, continued: true });
        doc.font(options.font || 'Helvetica').text(text, options);
      } else {
        doc.font(options.font || 'Helvetica').text(text, x, y, options);
      }
    };

    // ===== HEADER =====
    doc.rect(0, 0, doc.page.width, 120).fill('#1a5e3b');
    doc.rect(0, 0, doc.page.width, 100).fill('#2d7a4f');

    doc.fontSize(32).font('Helvetica-Bold').fillColor('#ffffff');
    drawText('🌱', 'Miljorapport', leftMargin, 25, { font: 'Helvetica-Bold' });
    
    doc.fontSize(14).font('Helvetica').fillColor('#e8f5e9')
       .text('Detaljerad Hallbarhetsanalys', leftMargin, 65);

    const infoBoxX = doc.page.width - 240;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
    drawText('📄', 'KALLA:', infoBoxX, 30, { font: 'Helvetica-Bold' });
    
    doc.font('Helvetica').fontSize(7)
       .text(filename, infoBoxX, 42, { width: 200, lineBreak: true });
    
    doc.font('Helvetica-Bold').fontSize(9);
    drawText('📅', 'DATUM:', infoBoxX, 62, { font: 'Helvetica-Bold' });
    
    doc.font('Helvetica').fontSize(7)
       .text(new Date(uploadedAt).toLocaleDateString('sv-SE', {
         year: 'numeric', month: 'long', day: 'numeric',
         hour: '2-digit', minute: '2-digit'
       }), infoBoxX, 74, { width: 200 });

    doc.y = 120;

    // ===== SAMMANFATTNING =====
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a5e3b');
    drawText('📊', 'SAMMANFATTNING', leftMargin, doc.y, { font: 'Helvetica-Bold' });
    doc.moveDown(0.5);

    const summary = analysisData.summary;
    const cardWidth = (pageWidth - 15) / 2;
    const cardHeight = 75;
    let cardY = doc.y;

    drawCompactCard(doc, leftMargin, cardY, cardWidth, cardHeight, 
      '📦 TOTALA ENHETER', 
      (summary.totalItems || 0).toLocaleString('sv-SE', { maximumFractionDigits: 0 }), 
      'st', '#4CAF50', hasEmojiSupport);

    drawCompactCard(doc, leftMargin + cardWidth + 15, cardY, cardWidth, cardHeight,
      '💰 TOTAL KOSTNAD',
      (summary.totalCost || 0).toLocaleString('sv-SE', { maximumFractionDigits: 0 }),
      'kr', '#2196F3', hasEmojiSupport);

    cardY += cardHeight + 10;

    const totalCO2 = summary.totalEmissions && typeof summary.totalEmissions === 'object'
      ? Object.values(summary.totalEmissions).reduce((a, b) => a + b, 0) : 0;
    
    drawCompactCard(doc, leftMargin, cardY, cardWidth, cardHeight,
      '🌍 TOTALA UTSLAPP', totalCO2.toLocaleString('sv-SE', { maximumFractionDigits: 0 }),
      'kg CO2e', '#FF5722', hasEmojiSupport);

    drawCompactCard(doc, leftMargin + cardWidth + 15, cardY, cardWidth, cardHeight,
      '⚡ TOTAL ENERGI',
      (summary.totalEnergy || 0).toLocaleString('sv-SE', { maximumFractionDigits: 0 }),
      'kWh', '#FFC107', hasEmojiSupport);

    doc.y = cardY + cardHeight + 25;

    // ===== KATEGORIER MED BOXAR =====
    if (analysisData.categories && analysisData.categories.length > 0) {
      doc.addPage();
      
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a5e3b');
      drawText('📋', 'DETALJERAD KATEGORISERING', leftMargin, 50, { font: 'Helvetica-Bold' });
      doc.moveDown(1);

      analysisData.categories.forEach((category, catIndex) => {
        if (doc.y > 620) {
          doc.addPage();
          doc.y = 50;
        }

        const categoryY = doc.y;
        const categoryColors = [
          '#1a5e3b', '#2d7a4f', '#388e3c', '#4caf50', '#66bb6a',
          '#1976d2', '#1e88e5', '#2196f3', '#ff5722', '#ff6f00'
        ];
        const categoryColor = categoryColors[catIndex % categoryColors.length];

        // Kategori header
        doc.roundedRect(leftMargin, categoryY, pageWidth, 45, 5).fill(categoryColor);

        const categoryName = category.name || 'Okaand kategori';
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff')
           .text(`${catIndex + 1}. ${categoryName}`, 
                 leftMargin + 15, categoryY + 15, 
                 { width: pageWidth - 30, lineBreak: true });

        doc.y = categoryY + 55;

        // Statistik box
        const statBoxY = doc.y;
        const statBoxHeight = 140;

        doc.roundedRect(leftMargin, statBoxY, pageWidth, statBoxHeight, 5)
           .fillAndStroke('#f5f5f5', '#e0e0e0');

        const statY = statBoxY + 15;
        const lineHeight = 28;
        let currentY = statY;

        doc.fontSize(12).font('Helvetica-Bold').fillColor('#424242');

        // Antal
        const itemCount = category.totals?.quantity || category.totalQuantity || 0;
        if (hasEmojiSupport) {
          doc.font('Emoji').text('📦 ', leftMargin + 20, currentY, { continued: true });
          doc.font('Helvetica-Bold').text('Antal:');
        } else {
          doc.text('Antal:', leftMargin + 20, currentY);
        }
        doc.font('Helvetica').fillColor('#666666')
           .text(`${itemCount.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} enheter`, 
                 leftMargin + 150, currentY);
        currentY += lineHeight;

        // Utsläpp
        const categoryEmissions = category.totals?.emissions || category.totalEmissions || {};
        const categoryCO2 = typeof categoryEmissions === 'object'
          ? Object.values(categoryEmissions).reduce((a, b) => a + b, 0) : 0;
        
        doc.font('Helvetica-Bold').fillColor('#424242');
        if (hasEmojiSupport) {
          doc.font('Emoji').text('🌍 ', leftMargin + 20, currentY, { continued: true });
          doc.font('Helvetica-Bold').text('Utslapp:');
        } else {
          doc.text('Utslapp:', leftMargin + 20, currentY);
        }
        doc.font('Helvetica').fillColor('#ff5722')
           .text(`${categoryCO2.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kg CO2e`, 
                 leftMargin + 150, currentY);
        currentY += lineHeight;

        // Kostnad
        const costValue = category.totals?.cost || category.totalCost || 0;
        doc.font('Helvetica-Bold').fillColor('#424242');
        if (hasEmojiSupport) {
          doc.font('Emoji').text('💰 ', leftMargin + 20, currentY, { continued: true });
          doc.font('Helvetica-Bold').text('Kostnad:');
        } else {
          doc.text('Kostnad:', leftMargin + 20, currentY);
        }
        doc.font('Helvetica').fillColor('#2196f3')
           .text(`${costValue.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr`, 
                 leftMargin + 150, currentY);
        currentY += lineHeight;

        // Energi
        const energyValue = category.totals?.energy || category.totalEnergy || 0;
        doc.font('Helvetica-Bold').fillColor('#424242');
        if (hasEmojiSupport) {
          doc.font('Emoji').text('⚡ ', leftMargin + 20, currentY, { continued: true });
          doc.font('Helvetica-Bold').text('Energi:');
        } else {
          doc.text('Energi:', leftMargin + 20, currentY);
        }
        doc.font('Helvetica').fillColor('#ffc107')
           .text(`${energyValue.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kWh`, 
                 leftMargin + 150, currentY);

        doc.y = statBoxY + statBoxHeight + 25;
        doc.moveDown(0.5);
      });

      // Ny sida för rekommendationer (kategorier är klara)
    }

    // ===== REKOMMENDATIONER =====
    doc.addPage();

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a5e3b');
    drawText('💡', 'REKOMMENDATIONER & INSIKTER', leftMargin, 50, { font: 'Helvetica-Bold' });
    doc.moveDown(1);

    if (analysisData.recommendations && analysisData.recommendations.length > 0) {
      const recIcons = ['🎯', '♻️', '🌱', '📊', '⚡', '🌍', '💡', '📈'];
      
      analysisData.recommendations.forEach((rec, idx) => {
        if (doc.y > 650) {
          doc.addPage();
          doc.y = 50;
        }

        const recY = doc.y;
        doc.roundedRect(leftMargin, recY, pageWidth, 70, 5)
           .fillAndStroke('#e8f5e9', '#4caf50');

        if (hasEmojiSupport) {
          doc.fontSize(16).font('Emoji').fillColor('#1a5e3b')
             .text(recIcons[idx % recIcons.length], leftMargin + 15, recY + 20);
        } else {
          doc.fontSize(18).font('Helvetica-Bold').fillColor('#2e7d32')
             .text(`${idx + 1}`, leftMargin + 15, recY + 20);
        }

        doc.fontSize(10).font('Helvetica').fillColor('#1b5e20')
           .text(rec, leftMargin + 45, recY + 18, { 
             width: pageWidth - 65, align: 'left', lineGap: 1
           });

        doc.y = recY + 80;
      });
    }

    addFooter(doc, leftMargin, pageWidth);
    doc.end();

    stream.on('finish', () => {
      console.log(`✅ PDF skapad ${hasEmojiSupport ? 'med emojis' : 'utan emojis'}:`, outPath);
      resolve(outPath);
    });

    stream.on('error', reject);
  });
}

function drawCompactCard(doc, x, y, width, height, title, value, unit, color, hasEmoji) {
  doc.roundedRect(x + 2, y + 2, width, height, 6).fill('#00000010');
  doc.roundedRect(x, y, width, height, 6).fill('#ffffff');
  doc.roundedRect(x, y, width, 6, 6).fill(color);

  const textTitle = hasEmoji ? title : title.replace(/[^\w\s]/g, '').trim();
  
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#666666')
     .text(textTitle, x + 12, y + 15, { width: width - 24 });

  doc.fontSize(22).font('Helvetica-Bold').fillColor(color)
     .text(value, x + 12, y + 30, { width: width - 24 });

  doc.fontSize(9).font('Helvetica').fillColor('#999999')
     .text(unit, x + 12, y + 58, { width: width - 24 });
}

function addFooter(doc, leftMargin, pageWidth) {
  const footerY = doc.page.height - 45;
  doc.moveTo(leftMargin, footerY - 5)
     .lineTo(doc.page.width - leftMargin, footerY - 5).stroke('#cccccc');
  doc.fontSize(7).font('Helvetica').fillColor('#999999')
     .text('Denna rapport ar automatiskt genererad med AI-driven hallbarhetsanalys',
           leftMargin, footerY, { align: 'center', width: pageWidth });
}

function createPdfReport(opts) {
  return createDetailedPdfReport(opts);
}

module.exports = { createPdfReport, createDetailedPdfReport };