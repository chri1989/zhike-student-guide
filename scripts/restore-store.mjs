import { DatabaseSync } from 'node:sqlite';
import { readFileSync,writeFileSync,mkdirSync,existsSync } from 'node:fs';
import path from 'node:path';

const [file,target]=process.argv.slice(2);
if(!file||!target) throw new Error('Usage: node scripts/restore-store.mjs private-backup.json new-data-directory');
const backup=JSON.parse(readFileSync(file,'utf8'));
const names=['user','account','drafts','releases','media','setup_lock','feedback'];
if(backup.format===1&&backup.tables&&backup.tables.feedback===undefined) backup.tables.feedback=[];
if(backup.format!==1||!backup.tables||names.some(name=>!Array.isArray(backup.tables[name]))||!Array.isArray(backup.images)) throw new Error('Invalid backup');
const filename=path.join(target,'guide.sqlite');
if(existsSync(filename)) throw new Error('Restore only into a new data directory; existing data was not changed.');
mkdirSync(path.join(target,'media'),{recursive:true});
for(const image of backup.images) {
  if(typeof image.key!=='string'||!/^[a-zA-Z0-9._-]+$/.test(image.key)||typeof image.data!=='string') throw new Error('Invalid backup image');
  writeFileSync(path.join(target,'media',image.key),Buffer.from(image.data,'base64'),{mode:0o600});
}
const db=new DatabaseSync(filename);
db.exec('PRAGMA foreign_keys=ON;');
db.exec('BEGIN IMMEDIATE');
try {
  db.exec(readFileSync('drizzle/0000_friendly_wildside.sql','utf8'));
  db.exec(readFileSync('drizzle/0001_tidy_rafael_vega.sql','utf8'));
  for(const name of names) {
    const columns=db.prepare('PRAGMA table_info("'+name+'")').all().map(c=>c.name);
    const insert=db.prepare('INSERT INTO "'+name+'" ('+columns.map(c=>'"'+c+'"').join(',')+') VALUES('+columns.map(()=>'?').join(',')+')');
    for(const row of backup.tables[name]) insert.run(...columns.map(c=>row[c]??null));
  }
  for(const media of backup.tables.media) if(!existsSync(path.join(target,'media',media.key))) throw new Error('Backup is missing an image');
  db.exec('COMMIT');
} catch(error) { db.exec('ROLLBACK'); throw error; }
finally { db.close(); }
console.log('Restored content, accounts and images. No previous data directory was overwritten.');
