const fs = require('fs');
const path = require('path');

const angularJsonPath = path.join(__dirname, '../angular.json');

try {
  const content = fs.readFileSync(angularJsonPath, 'utf8');
  if (!content || !content.trim()) {
    throw new Error('angular.json is empty or not found');
  }
  const angularJson = JSON.parse(content);

  const key = process.env.GEMINI_API_KEY;

  if (key) {
    console.log('Injecting GEMINI_API_KEY into angular.json');
    if (angularJson.projects && angularJson.projects.app && angularJson.projects.app.architect && angularJson.projects.app.architect.build) {
      // Ensure define exists
      angularJson.projects.app.architect.build.options.define = angularJson.projects.app.architect.build.options.define || {};
      angularJson.projects.app.architect.build.options.define.GEMINI_API_KEY = `'${key}'`;
      fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));
    } else {
      console.warn('Could not find projects.app.architect.build.options in angular.json');
    }
  } else {
    console.warn('GEMINI_API_KEY not found in environment. Using default/existing value.');
  }
} catch (error) {
  console.error('Error in set-env.js:', error.message);
  // We exit with 0 if it's just a warning, but here it might be fatal for the build if we expect the key
  // However, local builds might not have the key, so we should be careful.
  // Given the Vercel error was a crash, let's keep it informative.
}
