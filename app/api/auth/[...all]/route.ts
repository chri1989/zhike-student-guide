import { getAuth, reply } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { return getAuth(request).handler(request); }
export async function POST(request: Request) {
  const path=new URL(request.url).pathname;
  if (path.endsWith('/admin/impersonate-user') || path.endsWith('/admin/remove-user') || path.endsWith('/admin/set-role')) return Response.json({error:'此操作未开放。'},{status:403});
  if(path.endsWith('/admin/create-user')){
    const input=await request.clone().json().catch(()=>null);
    if(!input||typeof input.name!=='string'||!input.name.trim()||input.name.length>40||typeof input.password!=='string'||input.password.length<12||input.password.length>128){
      return reply({error:'请填写姓名和 12 至 128 位的临时密码。'},400);
    }
    if((input.role!==undefined&&input.role!=='user')||input.data!==undefined)return reply({error:'此入口用于添加普通管理员。'},400);
  }
  return getAuth(request).handler(request);
}
