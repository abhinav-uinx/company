const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/app');
let replacedFiles = [];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('"/user/dashboard"') || content.includes("'/user/dashboard'") || content.includes('`/user/dashboard`')) {
        if (!file.includes('login') && !file.includes('dashboard\\page.tsx') && !file.includes('dashboard/page.tsx')) {
            content = content.replace(/"\/user\/dashboard"/g, '"/dashboard"');
            content = content.replace(/'\/user\/dashboard'/g, "'/dashboard'");
            content = content.replace(/`\/user\/dashboard`/g, "`/dashboard`");
            fs.writeFileSync(file, content);
            replacedFiles.push(file);
        }
    }
});
console.log('Replaced in:', replacedFiles);
