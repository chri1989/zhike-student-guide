import {bindings,sameOrigin,reply,fail,HttpError} from '@/lib/server';
export const dynamic='force-dynamic';
export async function POST(request:Request) {
  try {
    sameOrigin(request);
    if(Number(request.headers.get('content-length'))>16000) throw new HttpError(413,'反馈内容过长。');
    const reader=request.body?.getReader();
    if(!reader) throw new HttpError(400,'请填写反馈内容。');
    const decoder=new TextDecoder();let text='',size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();throw new HttpError(413,'反馈内容过长。');}text+=decoder.decode(value,{stream:true});}
    let input:Record<string,unknown>;
    try{input=JSON.parse(text+decoder.decode());}catch{throw new HttpError(400,'反馈格式不正确。');}
    if(!input||typeof input!=='object'||Array.isArray(input)) throw new HttpError(400,'反馈格式不正确。');
    const {title,body,contact='',articleId='',website=''}=input;
    if(typeof title!=='string'||!title.trim()||title.length>100) throw new HttpError(400,'请填写 100 字以内的标题。');
    if(typeof body!=='string'||!body.trim()||body.length>3000) throw new HttpError(400,'请填写 3000 字以内的问题内容。');
    if(typeof contact!=='string'||contact.length>100) throw new HttpError(400,'联系方式请控制在 100 字以内。');
    if(typeof articleId!=='string'||articleId&&!/^(g-[a-f0-9]{10}|g-[a-f0-9-]{36})$/.test(articleId)||website!=='') throw new HttpError(400,'请从反馈页面重新提交。');
    const time=Date.now(),window=Math.floor(time/600000);
    const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()||'local';
    const encoder=new TextEncoder();
    const key=await crypto.subtle.importKey('raw',encoder.encode(bindings().AUTH_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const digest=await crypto.subtle.sign('HMAC',key,encoder.encode(window+':'+ip));
    const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    const db=bindings().DB;
    await db.prepare('DELETE FROM feedback_limits WHERE expires_at < ?').bind(time).run();
    const allowance=await db.prepare('INSERT INTO feedback_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<60').bind(hash,(window+1)*600000).run();
    if(allowance.meta.changes!==1) throw new HttpError(429,'提交较频繁，请过几分钟再试。');
    const id=crypto.randomUUID(),now=new Date().toISOString();
    const reference=(id.slice(0,4)+'-'+id.slice(4,8)).toUpperCase();
    await db.batch([
      db.prepare("INSERT INTO feedback(id,title,body,contact,article_id,status,revision,created_at,updated_at) VALUES(?,?,?,?,?,'new',1,?,?)")
        .bind(id,title.trim(),body.trim(),contact.trim(),articleId,now,now),
      db.prepare("INSERT INTO feedback_progress(feedback_id,title,summary,stage,updated_at) VALUES(?,?,?,'received',?)")
        .bind(id,'校园问题反馈 '+reference,'已收到网站反馈，等待学代受理。',now),
    ]);
    return reply({ok:true,id,reference},201);
  }catch(error){return fail(error);}
}
