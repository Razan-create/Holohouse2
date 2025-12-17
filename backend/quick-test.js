const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyAjNkYOJokcgVV8q9mJbYfxUFqbzbth_cU');

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Hej');
    console.log('✅ FUNKAR!', result.response.text());
  } catch (e) {
    console.log('❌ Fel:', e.message);
  }
}

test();
