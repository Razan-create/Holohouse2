// backend/routes/fileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { analyzeAggregatedData } = require('../utils/geminiClient');
const { createDetailedPdfReport } = require('../utils/pdfReport');

const prisma = require('../prismaClient');
const auth = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
});

const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

/**
 * GET /api/files
 * Bara inloggads egna filer
 */
router.get('/', auth, async (req, res) => {
  try {
    const rows = await prisma.fileUpload.findMany({
      where: { userId: req.user.id },
      orderBy: { uploadedAt: 'desc' },
    });

    return res.json(
      rows.map(r => ({
        id: String(r.id),
        filename: r.originalName,
        size: r.size,
        uploadedAt: r.uploadedAt,
        analysisData: r.analysisData,
      }))
    );
  } catch (err) {
    console.error('❌ Fel vid hämtning av filer:', err);
    return res.status(500).json({ error: 'Fel vid hämtning av filer' });
  }
});

/**
 * POST /api/files
 * Laddar upp Excel, analyserar, skapar PDF, sparar i MySQL kopplat till userId
 */
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Ingen fil mottagen' });
    }

    const uploadedAt = new Date().toISOString();

    // 1. Läs Excel
    const wb = xlsx.readFile(req.file.path);

    // Hitta klimat-sheet
    let klimatData = {};

    for (const sName of wb.SheetNames) {
      const sheet = wb.Sheets[sName];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      if (sName.toLowerCase().includes('klimat') || sName.toLowerCase().includes('indelning')) {
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
      }
    }

    // Hitta data-sheet
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

    // 2. Aggregera
    const aggregated = {};

    for (const row of dataRows) {
      const kategori = row[1];
      const belopp = parseFloat(row[12]) || 0;
      const antal = parseFloat(row[13]) || 0;

      if (kategori && belopp > 0) {
        if (!aggregated[kategori]) {
          aggregated[kategori] = { name: kategori, totalCost: 0, totalQuantity: 0, count: 0 };
        }
        aggregated[kategori].totalCost += belopp;
        aggregated[kategori].totalQuantity += antal;
        aggregated[kategori].count++;
      }
    }

    const topCategories = Object.values(aggregated)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 20);

    // 3. AI-analys
    const analysisData = await analyzeAggregatedData(topCategories, klimatData);

    // 4. PDF
    const pdfFilename = `${Date.now()}_${req.file.originalname.replace(/\.[^.]+$/, '')}.pdf`;
    const pdfPath = path.join(reportsDir, pdfFilename);

    await createDetailedPdfReport({
      filename: req.file.originalname,
      uploadedAt,
      analysisData,
      outPath: pdfPath,
    });

    // 5. Spara i SQL kopplat till userId ✅
    const row = await prisma.fileUpload.create({
      data: {
        userId: req.user.id,
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        pdfPath: pdfPath,
        analysisData: analysisData,
      },
    });

    return res.json({
      id: String(row.id),
      filename: row.originalName,
      size: row.size,
      uploadedAt: row.uploadedAt,
      analysisData: row.analysisData,
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
 * Bara ägaren får ladda ner ✅
 */
router.get('/:id/download', auth, async (req, res) => {
  const id = Number(req.params.id);

  const file = await prisma.fileUpload.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!file) {
    return res.status(404).json({ error: 'Fil hittades inte' });
  }
  if (!file.pdfPath || !fs.existsSync(file.pdfPath)) {
    return res.status(404).json({ error: 'PDF saknas på servern' });
  }

  const baseName = file.originalName.replace(/\.[^.]+$/, '');
  res.download(file.pdfPath, `${baseName}-rapport.pdf`);
});

/**
 * GET /api/files/:id/analysis
 * Bara ägaren ✅
 */
router.get('/:id/analysis', auth, async (req, res) => {
  const id = Number(req.params.id);

  const file = await prisma.fileUpload.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!file) {
    return res.status(404).json({ error: 'Fil hittades inte' });
  }

  res.json(file.analysisData);
});

module.exports = router;
