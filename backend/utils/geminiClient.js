// backend/utils/geminiClient.js
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// snabb, billig modell – byt till "gemini-1.5-pro" om du vill
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function analyzeText(summaryText) {
  const prompt = `
Du är en AI som analyserar miljödata från Excel.
Du får här en sammanfattning av tabellen (rubriker och några rader).
Gör:

1. Kort övergripande sammanfattning.
2. Viktiga mönster / trender.
3. Eventuella avvikelser.
4. Konkreta rekommendationer (max 5 punkter).

Dataöversikt:
${summaryText}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (err) {
    console.error('Fel från Gemini:', err);

    // Fallback så att uppladdningen ändå lyckas
    return `AI-analysen kunde inte genomföras (fel från Gemini).\n\n` +
           `Här är en enkel textöversikt av dina data:\n\n${summaryText}`;
  }
}

module.exports = { analyzeText };

