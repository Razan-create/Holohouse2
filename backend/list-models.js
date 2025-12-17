const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyAjNkYOJokcgVV8q9mJbYfxUFqbzbth_cU');

async function listModels() {
  try {
    console.log('📋 Hämtar tillgängliga modeller...\n');
    
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAjNkYOJokcgVV8q9mJbYfxUFqbzbth_cU'
    );
    
    const data = await response.json();
    
    if (data.models) {
      console.log('✅ Tillgängliga modeller:');
      data.models.forEach(model => {
        console.log('- ' + model.name);
      });
      
      // Testa första modellen
      console.log('\n🧪 Testar första modellen...');
      const modelName = data.models[0].name.split('/')[1];
      const geminiModel = genAI.getGenerativeModel({ model: modelName });
      const result = await geminiModel.generateContent('Säg hej på svenska');
      console.log('\n✅ SUCCESS!');
      console.log('Svar:', result.response.text());
    } else {
      console.log('❌ Inga modeller hittades:', data);
    }
    
  } catch (e) {
    console.log('❌ Fel:', e.message);
  }
}

listModels();
