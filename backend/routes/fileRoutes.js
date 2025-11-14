// backend/routes/fileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const { analyzeText } = require('../utils/geminiClient');
const { createPdfReport } = require('../utils/pdfReport');

const router = express.Router();

// Mapp för uppladdade Excel-filer
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
});

// Mapp för genererade PDF-rapporter
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

// Enkel "minnesdatabas"
const files = [];

/**
 * GET /api/files
 * Lista över tidigare uppladdningar
 */
router.get('/', (req, res) => {
  // skicka inte med interna paths till frontend
  res.json(
    files.map(f => ({
      id: f.id,
      filename: f.filename,
      size: f.size,
      uploadedAt: f.uploadedAt,
    }))
  );
});

/**
 * POST /api/files
 * 1. Tar emot Excel
 * 2. Läser några rader
 * 3. Skickar sammanfattning till Gemini
 * 4. Skapar PDF-rapport
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Ingen fil mottagen' });
    }

    const uploadedAt = new Date().toISOString();

    // --- 1. Läs Excel och skapa enkel text-sammanfattning ---
    const wb = xlsx.readFile(req.file.path);
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const header = rows[0] || [];
    const sampleRows = rows.slice(1, 6); // max 5 rader exempel

    let summary = `Arbetsblad: ${sheetName}\nKolumner: ${header.join(', ')}\n\nExempelrader:\n`;
    for (const r of sampleRows) {
      summary += `- ${r.join(' | ')}\n`;
    }

    // --- 2. Skicka till Gemini för analys ---
    const analysisText = await analyzeText(summary);

    // --- 3. Skapa PDF-rapport ---
    const pdfFilename = `${Date.now()}_${req.file.originalname.replace(/\.[^.]+$/, '')}.pdf`;
    const pdfPath = path.join(reportsDir, pdfFilename);

    await createPdfReport({
      excelName: req.file.originalname,
      uploadedAt,
      analysis: analysisText,
      outPath: pdfPath,
    });

    // --- 4. Spara metadata i "databasen" ---
    const file = {
      id: String(files.length + 1),
      filename: req.file.originalname,
      size: req.file.size,
      uploadedAt,
      excelPath: req.file.path,
      pdfPath,
      analysis: analysisText,
    };

    files.push(file);

    // svar till frontend (utan känsliga paths)
    return res.json({
      id: file.id,
      filename: file.filename,
      size: file.size,
      uploadedAt: file.uploadedAt,
    });
  } catch (err) {
    console.error('Fel vid uppladdning/AI-analys:', err);
    return res.status(500).json({ error: 'Internt serverfel vid AI-analys' });
  }
});

/**
 * GET /api/files/:id/download
 * Skicka PDF-rapporten till klienten
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

module.exports = router;
