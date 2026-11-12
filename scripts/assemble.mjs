import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
const output=path.join(root,'_site');
function within(base,relative){const p=path.resolve(base,relative);if(!p.startsWith(base+path.sep))throw Error('Unsafe path: '+relative);return p;}
await fs.mkdir(output,{recursive:true});
let total=0;
for(const entry of manifest.files){
 const pieces=[];for(const part of entry.parts)pieces.push(await fs.readFile(within(root,part)));
 const data=Buffer.concat(pieces);
 if(data.length!==entry.bytes||createHash('sha256').update(data).digest('hex')!==entry.sha256)throw Error('Integrity check failed: '+entry.path);
 const target=within(output,entry.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,data);total+=data.length;
}
const expected=new Set(manifest.files.map(f=>f.path));
async function inspect(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await inspect(p);else if(!expected.has(path.relative(output,p).split(path.sep).join('/')))throw Error('Unexpected output file: '+p);}}
await inspect(output);
console.log(`Verified and assembled ${manifest.files.length} files (${total} bytes) into _site`);
