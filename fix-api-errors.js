const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (file.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walkDir(path.join(__dirname, 'app', 'api'));
let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Fix JWT error catch blocks
  const catchRegex = /\} catch \(e\) \{\s*return NextResponse\.json\(\{ error: String\(e\) \}, \{ status: 500 \}\);\s*\}/g;
  if (catchRegex.test(content)) {
    content = content.replace(catchRegex, `} catch (e: any) {
    if (e?.name === 'JsonWebTokenError' || e?.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }`);
    changed = true;
  }

  // 2. Fix empty body update SQL syntax errors
  const setClauseRegex = /const setClause = keys\.map/g;
  if (setClauseRegex.test(content) && !content.includes('keys.length === 0')) {
    content = content.replace(setClauseRegex, `if (keys.length === 0) return NextResponse.json({ success: true });\n    const setClause = keys.map`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log('Fixed', file);
  }
}

console.log('Total files fixed:', changedFiles);
