import {bindings,requireEditor,sameOrigin,reply,fail,HttpError} from '@/lib/server';
import {Feedback,FeedbackStatus,feedbackStatuses} from '@/lib/feedback';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  try {
    await requireEditor(request);
    const params=new URL(request.url).searchParams,status=params.get('status')||'all',requestedPage=Number(params.get('page')||1);
    if(status!=='all'&&!Object.hasOwn(feedbackStatuses,status)||!Number.isSafeInteger(requestedPage)||requestedPage<1) throw new HttpError(400,'筛选条件不正确。');
    const db=bindings().DB;
    const grouped=await db.prepare('SELECT status,COUNT(*) AS count FROM feedback GROUP BY status').all<{status:FeedbackStatus;count:number}>();
    const counts={new:0,processing:0,done:0};for(const row of grouped.results)counts[row.status]=row.count;
    const total=status==='all'?Object.values(counts).reduce((a,b)=>a+b,0):counts[status as FeedbackStatus],pages=Math.max(1,Math.ceil(total/20)),page=Math.min(requestedPage,pages);
    const query=status==='all'?db.prepare('SELECT * FROM feedback ORDER BY created_at DESC,id DESC LIMIT 20 OFFSET ?').bind((page-1)*20):db.prepare('SELECT * FROM feedback WHERE status=? ORDER BY created_at DESC,id DESC LIMIT 20 OFFSET ?').bind(status,(page-1)*20);
    const items=await query.all<Feedback>();
    return reply({items:items.results,counts,total,page,pages});
  }catch(error){return fail(error);}
}
export async function PATCH(request:Request) {
  try {
    sameOrigin(request);await requireEditor(request);
    const input=await request.json().catch(()=>{throw new HttpError(400,'处理状态格式不正确。');}) as {id:string;status:FeedbackStatus;revision:number};
    if(!input||typeof input.id!=='string'||!/^[a-f0-9-]{36}$/.test(input.id)||typeof input.status!=='string'||!Object.hasOwn(feedbackStatuses,input.status)||!Number.isSafeInteger(input.revision)||input.revision<1) throw new HttpError(400,'处理状态不正确。');
    const updatedAt=new Date().toISOString();
    const result=await bindings().DB.prepare('UPDATE feedback SET status=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(input.status,updatedAt,input.id,input.revision).run();
    if(result.meta.changes!==1) throw new HttpError(409,'这条反馈已被其他维护者处理，请刷新后重试。');
    return reply({ok:true});
  }catch(error){return fail(error);}
}
