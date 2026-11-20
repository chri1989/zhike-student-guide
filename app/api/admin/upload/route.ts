import { bindings,requireEditor,sameOrigin,reply,fail,HttpError } from '@/lib/server';
export const dynamic='force-dynamic';
export async function POST(request:Request){
  try{
    sameOrigin(request); await requireEditor(request);
    const form=await request.formData(); const file=form.get('file');
    if(!(file instanceof File)||file.size>8*1024*1024) throw new HttpError(400,'请上传不超过 8 MB 的图片。');
    const types:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
    if(!types[file.type]) throw new HttpError(400,'支持 JPG、PNG 或 WebP 图片。');
    const bytes=new Uint8Array(await file.arrayBuffer());
    const valid=file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78: new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
    if(!valid) throw new HttpError(400,'文件内容与图片格式不一致。');
    const key=crypto.randomUUID()+'.'+types[file.type];
    await bindings().BUCKET.put(key,bytes);
    await bindings().DB.prepare('INSERT INTO media(key,content_type,published) VALUES(?,?,0)').bind(key,file.type).run();
    return reply({src:'/api/media/'+key,alt:file.name});
  }catch(e){return fail(e);}
}
