// Optional maintenance command; GitHub Pages serves the committed site.css.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const root=new URL('./',import.meta.url);
const names=JSON.parse(await fs.readFile(new URL('styles/order.json',root),'utf8'));
const text=(await Promise.all(names.map(n=>fs.readFile(new URL('styles/'+n,root),'utf8')))).join('\n');
await fs.writeFile(new URL('site.css',root),text);
const version=crypto.createHash('sha256').update(text).digest('hex').slice(0,8);
for(const name of await fs.readdir(root))if(name.endsWith('.html')){
 const path=new URL(name,root),html=await fs.readFile(path,'utf8');
 let result=html.replace(/site\.css\?v=[a-z\d]+/g,'site.css?v='+version);
 const scripts=[...result.matchAll(/<script src="([\w-]+\.js)(?:\?[^\"]*)?"/g)];
 for(const match of scripts){
   const bytes=await fs.readFile(new URL(match[1],root));
   const hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,8);
   result=result.replace(match[0],'<script src="'+match[1]+'?v='+hash+'"');
 }
 await fs.writeFile(path,result);
}
console.log('site.css '+version+'; '+names.length+' source files.');
