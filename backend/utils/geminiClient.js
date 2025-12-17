// backend/utils/geminiClient.js
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * Analyserar AGGREGERAD data (alla rader redan summerade per kategori)
 */
async function analyzeAggregatedData(categories, klimatData) {
  console.log('\n🤖 Förbereder AI-analys...');
  console.log('  Kategorier att analysera:', categories.length);
  console.log('  Klimatdata tillgänglig:', Object.keys(klimatData).length);

  // Skapa prompt med aggregerad data
  const categoriesText = categories.map(cat => 
    `${cat.name}: ${cat.totalCost.toFixed(2)} kr, ${cat.totalQuantity} enheter`
  ).join('\n');

  const klimatText = Object.entries(klimatData).map(([kat, co2]) => 
    `${kat}: ${co2} kg CO2 per enhet`
  ).join('\n');

  const prompt = `
Analysera denna miljödata. All data är redan aggregerad per kategori.

KLIMATDATA (kg CO2 per enhet):
${klimatText}

KATEGORIER MED TOTALER:
${categoriesText}

UPPGIFT:
1. För varje kategori, matcha med klimatdata om möjligt
2. Beräkna CO2: antal enheter × CO2 per enhet
3. Om ingen match finns, använd "övrigt" (7 kg CO2) som fallback
4. Returnera de 10 kategorierna med högst kostnad

MATCHNINGSREGLER:
- "Arbetskläder" matchar "arbetskläder: 5 kg CO2"
- "Kyl" eller "Kylskåp" matchar "kyl, frys: 410 kg CO2"
- Ignorera stora/små bokstäver
- Om osäker, använd "övrigt: 7 kg CO2"

Svara ENDAST med JSON:
{
  "categories": [
    {
      "name": "Kategorinamn",
      "items": [],
      "totals": {
        "quantity": 100,
        "emissions": {"co2": 500},
        "cost": 50000,
        "energy": 0
      }
    }
  ],
  "summary": {
    "totalEmissions": {"co2": 5000},
    "totalCost": 500000,
    "totalEnergy": 0,
    "totalItems": 1000
  },
  "recommendations": [
    "Fokusera på kategorier med högst CO2",
    "Överväg alternativ till kategorier med höga utsläpp"
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    // Rensa JSON
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    const analysisData = JSON.parse(text);

    console.log('✅ AI-parsing lyckades!');
    return analysisData;

  } catch (err) {
    console.error('❌ AI misslyckades, använder manuell matchning:', err.message);
    
    // Fallback: Manuell matchning
    return manualMatch(categories, klimatData);
  }
}

/**
 * Manuell matchning om AI misslyckas
 */
function manualMatch(categories, klimatData) {
  console.log('\n🔧 Kör manuell matchning...');
  
  const results = [];
  let totalCO2 = 0;
  let totalCost = 0;
  let totalItems = 0;

  for (const cat of categories.slice(0, 10)) {
    const catLower = cat.name.toLowerCase();
    let co2PerUnit = 0;
    let matchedWith = null;

    // Försök matcha med klimatdata
    for (const [klimatKat, klimatCO2] of Object.entries(klimatData)) {
      const klimatLower = klimatKat.toLowerCase();
      
      // Direktmatch
      if (catLower.includes(klimatLower) || klimatLower.includes(catLower)) {
        co2PerUnit = klimatCO2;
        matchedWith = klimatKat;
        break;
      }

      // Nyckelordsm matchning
      const keywords = {
        'arbetskläder': ['kläd', 'byxa', 'tröja', 'sko', 'skydd'],
        'arbetsverktyg': ['verktyg', 'hammare', 'skruv', 'tång', 'mejsel'],
        'kyl': ['kyl', 'frys'],
        'ugn': ['ugn', 'spis'],
        'tvättmaskin': ['tvätt'],
        'torkskåp': ['tork'],
        'säkerhetsdörr': ['dörr']
      };

      for (const [key, words] of Object.entries(keywords)) {
        if (klimatLower.includes(key)) {
          for (const word of words) {
            if (catLower.includes(word)) {
              co2PerUnit = klimatCO2;
              matchedWith = klimatKat;
              break;
            }
          }
        }
        if (co2PerUnit > 0) break;
      }

      if (co2PerUnit > 0) break;
    }

    // Fallback till "övrigt"
    if (co2PerUnit === 0 && klimatData['övrigt']) {
      co2PerUnit = klimatData['övrigt'];
      matchedWith = 'övrigt (fallback)';
    }

    const totalCO2ForCat = cat.totalQuantity * co2PerUnit;
    
    if (matchedWith) {
      console.log(`  ✅ ${cat.name} → ${matchedWith}: ${cat.totalQuantity} × ${co2PerUnit} = ${totalCO2ForCat.toFixed(2)} kg CO2`);
    }

    results.push({
      name: cat.name,
      items: [],
      totals: {
        quantity: cat.totalQuantity,
        emissions: { co2: totalCO2ForCat },
        cost: cat.totalCost,
        energy: 0
      }
    });

    totalCO2 += totalCO2ForCat;
    totalCost += cat.totalCost;
    totalItems += cat.totalQuantity;
  }

  console.log('\n✅ Manuell matchning klar!');
  console.log('  Total CO2:', totalCO2.toFixed(2), 'kg');
  console.log('  Total kostnad:', totalCost.toFixed(2), 'kr');
  console.log('  Totalt antal:', totalItems);

  return {
    categories: results,
    summary: {
      totalEmissions: { co2: totalCO2 },
      totalCost: totalCost,
      totalEnergy: 0,
      totalItems: totalItems
    },
    recommendations: [
      `Totalt analyserades ${categories.length} kategorier från filen.`,
      `Total klimatpåverkan: ${totalCO2.toFixed(2)} kg CO2.`,
      totalCO2 > 0 
        ? 'Fokusera på kategorier med högst CO2-utsläpp för att minska miljöpåverkan.'
        : 'Komplettera med mer detaljerad klimatdata för bättre analys.'
    ]
  };
}

module.exports = { analyzeAggregatedData };