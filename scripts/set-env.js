const fs = require('fs');
const path = require('path');

const angularJsonPath = path.join(__dirname, '../angular.json');
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));

const key = process.env.GEMINI_API_KEY;

if (key) {
  console.log('Injecting GEMINI_API_KEY into angular.json');
  angularJson.projects.app.architect.build.options.define.GEMINI_API_KEY = `'${key}'`;
  fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));
} else {
  console.warn('GEMINI_API_KEY not found in environment. Using default/existing value.');
}
