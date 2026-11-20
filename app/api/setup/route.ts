import { bindings, getAuth, sameOrigin, reply, fail, HttpError } from '@/lib/server';
import { minimumAdminPasswordLength, studentEmail } from '@/lib/student-account.mjs';
export const dynamic='force-dynamic';
export async function GET() {
  try {
    const exists=await bindings().DB.prepare('SELECT id FROM user LIMIT 1').first();
    return reply({needsSetup:!exists});
  }catch(e){return fail(e);}
}
export async function POST(request:Request) {
  const db=bindings().DB;
  let locked=false;
  try {
    sameOrigin(request);
    const {token,studentId,password,name}=await request.json() as {token:string;studentId:string;password:string;name:string};
    if (!bindings().BOOTSTRAP_TOKEN || token!==bindings().BOOTSTRAP_TOKEN) throw new HttpError(403,'初始化凭证不正确。');
    const email=studentEmail(studentId);
    if (!email||typeof name!=='string'||!name.trim()||name.length>40||typeof password!=='string'||password.length<minimumAdminPasswordLength) throw new HttpError(400,`请填写学号、姓名和至少 ${minimumAdminPasswordLength} 位的密码。`);
    if (await db.prepare('SELECT id FROM user LIMIT 1').first()) throw new HttpError(409,'管理员已设置，请直接登录。');
    const lock=await db.prepare("INSERT OR IGNORE INTO setup_lock(id,created_at) VALUES('owner',?)").bind(new Date().toISOString()).run();
    if (lock.meta.changes!==1) throw new HttpError(409,'初始化正在进行，请稍后重试。');
    locked=true;
    const auth=getAuth(request,true);
    await auth.api.signUpEmail({body:{email,password,name:name.trim()}});
    return reply({ok:true});
  }catch(e){
    if(locked && !await db.prepare('SELECT id FROM user LIMIT 1').first()) await db.prepare("DELETE FROM setup_lock WHERE id='owner'").run();
    return fail(e);
  }
}
