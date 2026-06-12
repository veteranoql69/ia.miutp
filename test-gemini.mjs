import fs from 'fs';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

// Leer .env directamente
const envContent = fs.readFileSync('.env', 'utf-8');
const match = envContent.match(/GEMINI_API_KEY\s*=\s*([^\s#]+)/);
const apiKey = match ? match[1] : '';

console.log('Testing with API Key:', apiKey ? 'FOUND (starts with ' + apiKey.slice(0, 8) + '...)' : 'NOT FOUND');

const googleAI = createGoogleGenerativeAI({
  apiKey: apiKey,
});

const modelsToTest = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-2.5-flash',
  'gemini-1.5-pro',
  'gemini-2.5-pro',
];

async function runTests() {
  for (const modelName of modelsToTest) {
    console.log(`\n----------------------------------------`);
    console.log(`Testing model: ${modelName}`);
    try {
      const { text } = await generateText({
        model: googleAI(modelName),
        prompt: 'Hi, return just the word "OK" if you receive this message.',
      });
      console.log(`[SUCCESS] Model '${modelName}' responded: "${text.trim()}"`);
    } catch (err) {
      console.error(`[FAILED] Model '${modelName}' failed with error:`, err.message || err);
    }
  }
}

runTests();
