import { DatabaseSync } from 'node:sqlite';
import { mkdirSync,readFileSync,copyFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';

export function initializeStore() {
  const directory=process.env.GUIDE_DATA_DIR;
  if(!directory || !path.isAbsolute(directory)) throw new Error('Set GUIDE_DATA_DIR to an absolute persistent data directory.');
  mkdirSync(path.join(directory,'media'),{recursive:true});
  const db=new DatabaseSync(path.join(directory,'guide.sqlite'));
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;');
  if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='releases'").get()) {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(readFileSync('drizzle/0000_friendly_wildside.sql','utf8'));
      db.exec('COMMIT');
    } catch(error) { db.exec('ROLLBACK'); db.close(); throw error; }
  }
  if(!db.prepare('SELECT id FROM releases LIMIT 1').get()) {
    const seed=JSON.parse(readFileSync('data/seed.json','utf8'));
    const now=new Date().toISOString();
    const articles=seed.articles.map(a=>({...a,updatedAt:now,images:a.images.map(i=>({...i,src:'/api/media/'+path.basename(i.src)}))}));
    for(const image of seed.media) {
      const key=path.basename(image.path);
      copyFileSync(path.join('public','seed-images',key),path.join(directory,'media',key));
    }
    db.exec('BEGIN IMMEDIATE');
    try {
      const draft=db.prepare('INSERT INTO drafts(id,content,active,revision,editor,edited_at) VALUES(?,?,1,1,?,?)');
      for(const a of articles) draft.run(a.id,JSON.stringify(a),'原表迁移',now);
      const media=db.prepare('INSERT INTO media(key,content_type,published) VALUES(?,?,1)');
      for(const image of seed.media) {
        const key=path.basename(image.path);
        media.run(key,key.endsWith('.png')?'image/png':'image/jpeg');
      }
      db.prepare('INSERT INTO releases(id,token,articles,changes,summary,publisher,published_at) VALUES(1,?,?,?,?,?,?)').run(crypto.randomUUID(),JSON.stringify(articles),JSON.stringify([{id:'',title:`迁入 ${articles.length} 个条目与 ${seed.media.length} 张图片`,kind:'added'}]),'新增全文搜索、分类目录和更新记录。','智科学代团',now);
      db.exec('COMMIT');
    } catch(error) { db.exec('ROLLBACK'); db.close(); throw error; }
  }
  if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='feedback'").get()) {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(readFileSync('drizzle/0001_tidy_rafael_vega.sql','utf8'));
      db.exec('COMMIT');
    } catch(error) { db.exec('ROLLBACK'); db.close(); throw error; }
  }
  db.exec(readFileSync('drizzle/0002_feedback_progress.sql','utf8'));
  db.close();
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  initializeStore();
  console.log('Guide data is ready. Existing content and accounts were preserved.');
}
