const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

walk('./src', (filePath) => {
  if (filePath.endsWith('.js')) {
    const code = fs.readFileSync(filePath, 'utf-8');
    try {
      parse(code, { sourceType: 'module' });
    } catch (e) {
      console.log(`Syntax error in ${filePath}: ${e.message}`);
    }
  }
});
