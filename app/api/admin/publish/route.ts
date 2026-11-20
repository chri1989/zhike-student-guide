import { bindings,requireEditor,sameOrigin,reply,fail,latest,HttpError } from '@/lib/server';
import { Article, Change } from '@/lib/guide';
export const dynamic='force-dynamic';
export async function POST(request:Request) {
  try {
    sameOrigin(request); const user=await requireEditor(request);
    const input=await request.json() as {selected:{id:string;revision:number}[];expectedRelease:number;summary:string};
    if(!Array.isArray(input.selected)||input.selected.length===0||input.selected.length>200||new Set(input.selected.map(s=>s.id)).size!==input.selected.length||typeof input.summary!=='string'||!input.summary.trim()||input.summary.length>2000) throw new HttpError(400,'请选择改动，并填写 2000 字以内的更新说明。');
    const db=bindings().DB, previous=await latest();
    if(!previous || previous.id!==input.expectedRelease) throw new HttpError(409,'网站已发布过新版本，请刷新后重新核对。');
    const articles=new Map<string,Article>((JSON.parse(previous.articles) as Article[]).map(a=>[a.id,a]));
    const chosenJson=JSON.stringify(input.selected);
    const selectedRows=await db.prepare("SELECT d.id,d.content,d.active,d.revision FROM drafts d JOIN json_each(?) j ON d.id=json_extract(j.value,'$.id')").bind(chosenJson).all<{id:string;content:string;active:number;revision:number}>();
    const draftMap=new Map(selectedRows.results.map(d=>[d.id,d]));
    const changes:Change[]=[]; const now=new Date().toISOString();
    for(const chosen of input.selected){
      const d=draftMap.get(chosen.id);
      if(!d||d.revision!==chosen.revision) throw new HttpError(409,'部分草稿已改变，请刷新并核对后发布。');
      const a=JSON.parse(d.content) as Article, old=articles.get(chosen.id);
      if(!d.active){if(old){articles.delete(a.id);changes.push({id:a.id,title:a.title,kind:'removed'});}}
      else {articles.set(a.id,{...a,updatedAt:now});changes.push({id:a.id,title:a.title,kind:old?'updated':'added'});}
    }
    if(!changes.length) throw new HttpError(400,'所选草稿没有可发布的改动。');
    const id=previous.id+1, token=crypto.randomUUID();
    // An immutable release holds both content and announcement. The INSERT checks
    // the live version and all chosen draft revisions in the same database write.
    const result=await db.batch([
      db.prepare("INSERT INTO releases(id,token,articles,changes,summary,publisher,published_at) SELECT ?,?,?,?,?,?,? WHERE (SELECT MAX(id) FROM releases)=? AND (SELECT COUNT(*) FROM drafts d JOIN json_each(?) j ON d.id=json_extract(j.value,'$.id') AND d.revision=json_extract(j.value,'$.revision'))=?").bind(id,token,JSON.stringify([...articles.values()]),JSON.stringify(changes),input.summary.trim(),user.name,now,previous.id,chosenJson,input.selected.length),
      db.prepare("UPDATE media SET published=1 WHERE EXISTS(SELECT 1 FROM releases,json_each(releases.articles) a,json_each(json_extract(a.value,'$.images')) i WHERE releases.token=? AND json_extract(i.value,'$.src')='/api/media/'||media.key)").bind(token),
    ]);
    if(result[0].meta.changes!==1) throw new HttpError(409,'内容刚发生变化，本次未发布，请重新核对。');
    return reply({ok:true,release:id});
  }catch(e){return fail(e);}
}
