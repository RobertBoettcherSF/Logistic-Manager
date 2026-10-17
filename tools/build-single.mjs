// Builds dist/swift-drive.html: one self-contained file (demo/local mode, no backend).
import fs from 'fs';
const r=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const js=s=>s.replace(/<\/script/gi,'<\\/script');
let h=r('index.html');
const icon='data:image/png;base64,'+fs.readFileSync(new URL('../icons/icon-180.png',import.meta.url)).toString('base64');
h=h.replace(/<link rel="apple-touch-icon"[^>]*>/,`<link rel="apple-touch-icon" href="${icon}"><link rel="icon" href="${icon}">`)
 .replace(/<link rel="manifest"[^>]*>\n?/,'')
 .replace(/<link rel="stylesheet" href="([^"]+)">/g,(m,f)=>`<style>${r(f)}</style>`)
 .replace(/<script src="([^"]+)"><\/script>/g,(m,f)=>`<script>${js(r(f))}</script>`)
 .replace('<head>','<head>\n<script>window.SD_SINGLE_FILE=1</script>');
fs.mkdirSync(new URL('../dist/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../dist/swift-drive.html',import.meta.url),h);
console.log('dist/swift-drive.html',h.length,'bytes');
