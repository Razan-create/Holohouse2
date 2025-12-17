// backend/routes/fileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { analyzeAggregatedData } = require('../utils/geminiClient');
const { createDetailedPdfReport } = require('../utils/pdfReport');

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
});

const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

// In-memory databas för filer och deras analyser
const files = [];

/**
 * GET /api/files
 * Lista över tidigare uppladdningar med analysdata
 */
router.get('/', (req, res) => {
  res.json(
    files.map(f => ({
      id: f.id,
      filename: f.filename,
      size: f.size,
      uploadedAt: f.uploadedAt,
      analysisData: f.analysisData,
    }))
  );
});

/**
 * POST /api/files
 * Laddar upp Excel, analyserar med AI, skapar detaljerad PDF
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Ingen fil mottagen' });
    }

    const uploadedAt = new Date().toISOString();

    // 1. Läs Excel
    const wb = xlsx.readFile(req.file.path);

    console.log('=== EXCEL SHEETS DEBUG ===');
    console.log('Alla sheets i filen:', wb.SheetNames);

    // Hitta klimat-sheet
    let klimatData = {};

    for (const sName of wb.SheetNames) {
      const sheet = wb.Sheets[sName];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      if (sName.toLowerCase().includes('klimat') || sName.toLowerCase().includes('indelning')) {
        console.log(`\n📊 Läser klimat-sheet: ${sName}`);
        
        const klimatHeader = rows[0] || [];
        const klimatRows = rows.slice(1);
        
        klimatRows.forEach(row => {
          if (row && row[0]) {
            const kategori = String(row[0]).trim();
            const klimatIndex = klimatHeader.findIndex(h => 
              h && String(h).toLowerCase().includes('klimat')
            );
            
            if (klimatIndex !== -1 && row[klimatIndex]) {
              const klimatStr = String(row[klimatIndex]);
              const match = klimatStr.match(/(\d+(?:\.\d+)?)/);
              if (match) {
                klimatData[kategori.toLowerCase()] = parseFloat(match[1]);
              }
            }
          }
        });
        
        console.log('✅ Klimatdata laddad:', Object.keys(klimatData).length, 'kategorier');
      }
    }

    // Hitta data-sheet (det med mest transaktioner)
    let dataSheet = null;
    let dataHeader = [];
    let dataRows = [];

    for (const sName of wb.SheetNames) {
      const sheet = wb.Sheets[sName];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      for (let i = 0; i < Math.min(20, rows.length); i++) {
        const row = rows[i];
        if (row && row.length > 10) {
          const nonEmptyCells = row.filter(c => c !== null && c !== undefined && c !== '').length;
          
          if (nonEmptyCells > 10) {
            const potentialDataRows = rows.slice(i + 1).filter(r => {
              return r && r.some(cell => cell !== null && cell !== undefined && cell !== '');
            });
            
            if (potentialDataRows.length > dataRows.length) {
              dataSheet = sName;
              dataHeader = row;
              dataRows = potentialDataRows;
            }
            break;
          }
        }
      }
    }

    if (!dataSheet || !dataHeader.length) {
      throw new Error('Kunde inte hitta transaktionsdata');
    }

    console.log('\n=== DATA SHEET ===');
    console.log('Sheet:', dataSheet);
    console.log('Antal rader:', dataRows.length);
    console.log('Headers:', dataHeader.slice(0, 10));

    // 2. AGGREGERA ALL DATA PER KATEGORI (Node.js processar alla rader!)
    console.log('\n🔄 Aggregerar ALLA', dataRows.length, 'rader per kategori...');
    
    const aggregated = {};
    let totalProcessed = 0;
    
    for (const row of dataRows) {
      const kategori = row[1]; // UNSPSC-kategori
      const belopp = parseFloat(row[12]) || 0;
      const antal = parseFloat(row[13]) || 0;
      
      if (kategori && belopp > 0) {
        if (!aggregated[kategori]) {
          aggregated[kategori] = {
            name: kategori,
            totalCost: 0,
            totalQuantity: 0,
            count: 0
          };
        }
        
        aggregated[kategori].totalCost += belopp;
        aggregated[kategori].totalQuantity += antal;
        aggregated[kategori].count++;
        totalProcessed++;
      }
    }

    console.log('✅ Aggregering klar!');
    console.log('  Processade rader:', totalProcessed);
    console.log('  Unika kategorier:', Object.keys(aggregated).length);

    // Sortera efter kostnad och ta topp 20
    const topCategories = Object.values(aggregated)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 20);

    console.log('\n📊 Topp 10 kategorier efter kostnad:');
    topCategories.slice(0, 10).forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat.name}: ${cat.totalCost.toLocaleString('sv-SE')} kr (${cat.totalQuantity} st)`);
    });

    // 3. Skicka aggregerad data till AI för klassificering och CO2-beräkning
    console.log('\n🤖 Skickar aggregerad data till AI...');
    
    const analysisData = await analyzeAggregatedData(topCategories, klimatData);

    console.log('\n✅ AI-analys klar!');
    console.log('  Kategorier:', analysisData.categories?.length || 0);
    console.log('  Total kostnad:', analysisData.summary?.totalCost?.toLocaleString('sv-SE') || 0, 'kr');
    console.log('  Total CO2:', analysisData.summary?.totalEmissions?.co2?.toLocaleString('sv-SE') || 0, 'kg');

    // 4. Skapa PDF-rapport
    const pdfFilename = `${Date.now()}_${req.file.originalname.replace(/\.[^.]+$/, '')}.pdf`;
    const pdfPath = path.join(reportsDir, pdfFilename);

    await createDetailedPdfReport({
      filename: req.file.originalname,
      uploadedAt,
      analysisData,
      outPath: pdfPath,
    });

    // 5. Spara i "databasen"
    const file = {
      id: String(files.length + 1),
      filename: req.file.originalname,
      size: req.file.size,
      uploadedAt,
      excelPath: req.file.path,
      pdfPath,
      analysisData,
    };
    files.push(file);

    return res.json({
      id: file.id,
      filename: file.filename,
      size: file.size,
      uploadedAt: file.uploadedAt,
      analysisData: file.analysisData,
    });

  } catch (err) {
    console.error('❌ Fel vid uppladdning/analys:', err);
    return res.status(500).json({ 
      error: 'Internt serverfel vid AI-analys',
      details: err.message 
    });
  }
});

/**
 * GET /api/files/:id/download
 * Ladda ner PDF-rapport
 */
router.get('/:id/download', (req, res) => {
  const file = files.find(f => f.id === req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'Fil hittades inte' });
  }
  if (!fs.existsSync(file.pdfPath)) {
    return res.status(404).json({ error: 'PDF saknas på servern' });
  }

  const baseName = file.filename.replace(/\.[^.]+$/, '');
  res.download(file.pdfPath, `${baseName}-rapport.pdf`);
});

/**
 * GET /api/files/:id/analysis
 * Hämta endast analysdata för en specifik fil
 */
router.get('/:id/analysis', (req, res) => {
  const file = files.find(f => f.id === req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'Fil hittades inte' });
  }
  res.json(file.analysisData);
});

module.exports = router;