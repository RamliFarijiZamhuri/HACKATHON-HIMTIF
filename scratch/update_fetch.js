const fs = require('fs');
const path = require('path');

const frontendDir = path.join('d:', 'Pribadi', 'Ide Ide, Project Project', 'Project Hackathon HIMTIF', 'Hackathon HIMTIF', 'unpam-space', 'frontend', 'src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // 1. Ganti fetch(`...`) menjadi fetch(`...`, { headers: { 'x-api-key': import.meta.env.VITE_KODE_RAHASIA_FRONTEND } })
  content = content.replace(/fetch\((`[^`]+`)\)(?![\s]*\{)/g, 
    "fetch($1, { headers: { 'x-api-key': import.meta.env.VITE_KODE_RAHASIA_FRONTEND } })");

  // 2. Ganti headers: { menjadi headers: { 'x-api-key': import.meta.env.VITE_KODE_RAHASIA_FRONTEND,
  content = content.replace(/headers:\s*\{/g, 
    "headers: {\n        'x-api-key': import.meta.env.VITE_KODE_RAHASIA_FRONTEND,");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated: ' + filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walk(frontendDir);
