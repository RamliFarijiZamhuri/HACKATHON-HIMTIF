const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace single quotes: 'http://localhost:5000/api/...' -> `${import.meta.env.VITE_API_URL}/...`
  content = content.replace(/'http:\/\/localhost:5000\/api([^']*)'/g, '`${import.meta.env.VITE_API_URL}$1`');
  
  // Replace backticks: `http://localhost:5000/api/...` -> `${import.meta.env.VITE_API_URL}/...`
  content = content.replace(/`http:\/\/localhost:5000\/api([^`]*)`/g, '`${import.meta.env.VITE_API_URL}$1`');
  
  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${filePath}`);
}

const files = [
  'src/components/auth/AuthPage.tsx',
  'src/components/features/marketplace/MarketplacePage.tsx',
  'src/components/features/kos/KosFinderPage.tsx',
  'src/components/features/event/EventPage.tsx',
  'src/components/features/community/CommunityPage.tsx',
  'src/components/features/temuan/LostFoundPage.tsx',
  'src/components/features/profile/ProfileSettingsPage.tsx'
];

files.forEach(f => replaceInFile(f));
console.log('All API URLs replaced successfully!');
