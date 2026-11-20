import { z } from 'zod';
import { bindings, fail, HttpError, publicGuide, reply, requireEditor, sameOrigin } from '@/lib/server';
import { database } from '@/lib/storage';
import type { ProgressRecord } from '@/lib/feedback-progress';

export const dynamic = 'force-dynamic';

const id = z.string().uuid();
const requestSchema = z.object({
  id, title: z.string().trim().min(1).max(100), summary: z.string().trim().min(1).max(400),
  stage: z.enum(['received','following','referred','resolved']), guideId: z.string().default(''),
  revision: z.number().int().nonnegative(),
});

export async function GET(request: Request) {
  try {
    await requireEditor(request);
    const parsed = id.safeParse(new URL(request.url).searchParams.get('id'));
    if (!parsed.success) throw new HttpError(400,'请选择一条反馈。');
    const record = await bindings().DB.prepare('SELECT * FROM feedback_progress WHERE feedback_id=?').bind(parsed.data).first<ProgressRecord>();
    return reply({ record });
  } catch (error) { return fail(error); }
}

export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    await requireEditor(request);
    const input = requestSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) throw new HttpError(400,'请填写公开标题和脱敏后的处理说明。');
    const { id, title, summary, stage, guideId, revision } = input.data;
    if (/@|https?:\/\/|(?<!\d)\d{7,}(?!\d)/i.test(title + '\n' + summary)) throw new HttpError(400,'请移除联系方式、学号和外部链接后再公开。');
    if ((stage === 'resolved' || guideId) && !(await publicGuide()).articles.some(item => item.id === guideId)) {
      throw new HttpError(400,'请选择一篇已发布的指南作为答复。');
    }
    const db = database();
    const now = new Date().toISOString();
    db.exec('BEGIN IMMEDIATE');
    try {
      if (!db.prepare('SELECT id FROM feedback WHERE id=?').get(id)) throw new HttpError(404,'没有找到这条反馈。');
      const updated = revision === 0
        ? db.prepare('INSERT OR IGNORE INTO feedback_progress(feedback_id,title,summary,stage,guide_id,updated_at) VALUES(?,?,?,?,?,?)').run(id,title,summary,stage,guideId,now)
        : db.prepare('UPDATE feedback_progress SET title=?,summary=?,stage=?,guide_id=?,updated_at=?,revision=revision+1 WHERE feedback_id=? AND revision=?').run(title,summary,stage,guideId,now,id,revision);
      if (updated.changes !== 1) throw new HttpError(409,'该进展已被更新，请重新打开后再编辑。');
      const inboxStatus = stage === 'resolved' ? 'done' : stage === 'received' ? 'new' : 'processing';
      db.prepare('UPDATE feedback SET status=?,revision=revision+1,updated_at=? WHERE id=?').run(inboxStatus,now,id);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    return reply({ ok:true });
  } catch (error) { return fail(error); }
}

export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    await requireEditor(request);
    const input = requestSchema.pick({id:true,revision:true}).safeParse(await request.json().catch(() => null));
    if (!input.success) throw new HttpError(400,'请选择要撤下的进展。');
    const result = await bindings().DB.prepare('DELETE FROM feedback_progress WHERE feedback_id=? AND revision=?').bind(input.data.id,input.data.revision).run();
    if (result.meta.changes !== 1) throw new HttpError(409,'该进展已改变，请重新核对。');
    return reply({ok:true});
  } catch (error) { return fail(error); }
}
