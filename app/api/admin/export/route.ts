import { bindings,requireEditor,fail } from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  try {
    await requireEditor(request,true);
    const names=['user','account','drafts','releases','media','setup_lock','feedback'] as const;
    const {DB,BUCKET}=bindings();
    const snapshot=await DB.batch(names.map(name=>DB.prepare('SELECT * FROM "'+name+'"')));
    const tables=Object.fromEntries(names.map((name,i)=>[name,snapshot[i].results]));
    const images=[];
    for(const row of tables.media) {
      const key=String(row.key);
      if(!/^[a-zA-Z0-9._-]+$/.test(key)) throw new Error('Invalid stored image key');
      const image=await BUCKET.get(key);
      if(!image) throw new Error('Missing stored image');
      images.push({key,data:Buffer.from(image.body).toString('base64')});
    }
    return Response.json({format:1,generatedAt:new Date().toISOString(),tables,images},{headers:{
      'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
      'Content-Disposition':'attachment; filename="zhike-private-backup.json"',
      'X-Content-Type-Options':'nosniff',
    }});
  } catch(error) { return fail(error); }
}
