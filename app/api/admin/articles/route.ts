import { bindings,requireEditor,sameOrigin,reply,fail,latest,validateArticle,HttpError,releaseInfo } from '@/lib/server';
import { Article } from '@/lib/guide';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  try {
    const user=await requireEditor(request);
    const [all,row]=await Promise.all([bindings().DB.prepare('SELECT * FROM drafts ORDER BY edited_at DESC').all<{id:string;content:string;active:number;revision:number;editor:string;edited_at:string}>(),latest()]);
    return reply({user:{id:user.id,name:user.name,email:user.email,role:user.role},drafts:all.results.map(d=>({...d,content:JSON.parse(d.content),active:!!d.active})),published:row?JSON.parse(row.articles):[],release:row?releaseInfo(row):null});
  }catch(e){return fail(e);}
}
export async function PUT(request:Request) {
  try {
    sameOrigin(request); const user=await requireEditor(request);
    const input=await request.json() as {content:Article;revision:number;active:boolean};
    const content=validateArticle(input.content as Article);
    if(!Number.isInteger(input.revision)||input.revision<0||typeof input.active!=='boolean') throw new HttpError(400,'草稿版本不正确。');
    if(input.revision===0&&!content.body&&!content.images.length) throw new HttpError(400,'请填写回答或上传图片。');
    const db=bindings().DB;
    const existing=await db.prepare('SELECT content FROM drafts WHERE id=?').bind(content.id).first<{content:string}>();
    if(existing){content.sources=JSON.parse(existing.content).sources;}
    const now=new Date().toISOString();
    const result=input.revision===0
      ? await db.prepare('INSERT OR IGNORE INTO drafts(id,content,active,revision,editor,edited_at) VALUES(?,?,?,1,?,?)').bind(content.id,JSON.stringify(content),input.active?1:0,user.name,now).run()
      : await db.prepare('UPDATE drafts SET content=?,active=?,revision=revision+1,editor=?,edited_at=? WHERE id=? AND revision=?').bind(JSON.stringify(content),input.active?1:0,user.name,now,content.id,input.revision).run();
    if(result.meta.changes!==1) throw new HttpError(409,'这条内容刚被其他维护者修改，请重新载入后再编辑。你输入的文字仍保留在当前页面。');
    return reply({ok:true,revision:input.revision+1,editedAt:now});
  }catch(e){return fail(e);}
}
