const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyAjNkYOJokcgVV8q9mJbYfxUFqbzbth_cU');

async function testGemini() {
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.5-pro', 
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-pro-latest'
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log('🧪 Testar: ' + modelName);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Säg hej på svenska!');
      const text = result.response.text();
      
      console.log('✅✅✅ SUCCESS med ' + modelName + '! ✅✅✅');
      console.log('Svar:', text);
      console.log('\n🎯 Använd denna modell: ' + modelName);
      return;
      
    } catch (e) {
      console.log('❌ ' + modelName + ' fungerade inte');
    }
  }
}

testGemini();
