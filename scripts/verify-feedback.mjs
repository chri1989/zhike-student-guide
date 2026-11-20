import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const origin='http://127.0.0.1:5173',checks=[];
const credentials=JSON.parse(await fs.readFile('work/restart-check.json','utf8'));
assert.equal(credentials.studentId,'0001000001','Use the local verification account only.');
class Client {
  cookies=new Map();
  constructor(ip){this.ip=ip;}
  async request(path,body,method='GET',headers={}){
    const options={method,headers:{Origin:origin,'X-Forwarded-For':this.ip,...headers}};
    if(this.cookies.size)options.headers.Cookie=[...this.cookies].map(([key,value])=>key+'='+value).join('; ');
    if(body!==undefined){options.headers['Content-Type']='application/json';options.body=typeof body==='string'?body:JSON.stringify(body);}
    const response=await fetch(origin+path,options);
    for(const cookie of response.headers.getSetCookie()){const [key,...value]=cookie.split(';')[0].split('=');this.cookies.set(key,value.join('='));}
    const raw=await response.text();let data;try{data=JSON.parse(raw);}catch{data=raw;}
    return {status:response.status,data,headers:response.headers};
  }
  async ok(path,body,method='GET') {const result=await this.request(path,body,method);assert(result.status>=200&&result.status<300,JSON.stringify(result.data));return result.data;}
}
async function check(name,run){await run();checks.push(name);console.log('PASS '+name);}
const student=new Client('198.51.100.1'),owner=new Client('198.51.100.2'),editor=new Client('198.51.100.3');
await owner.ok('/api/auth/sign-in/email',{studentId:credentials.studentId,password:credentials.password},'POST');
const guide=await student.ok('/api/guide');
const payload={title:'校园巴士时刻在哪里查？',body:'希望补充周末校园巴士的查询入口。',contact:'feedback-test@example.invalid'};
let submitted;
await check('An anonymous student can submit and receives no private fields',async()=>{
  const result=await student.request('/api/feedback',payload,'POST');assert.equal(result.status,201);assert.deepEqual(Object.keys(result.data).sort(),['id','ok']);submitted=result.data;
});
await check('Students cannot list feedback or read the maintenance inbox',async()=>{
  assert.equal((await student.request('/api/feedback')).status,405);assert.equal((await student.request('/api/admin/feedback')).status,401);
});
await check('An independent maintainer session can read the submitted feedback',async()=>{
  const inbox=await owner.ok('/api/admin/feedback?status=new');const item=inbox.items.find(item=>item.id===submitted.id);assert.equal(item.body,payload.body);assert.equal(item.contact,payload.contact);assert.equal(item.status,'new');
});
await check('Submitting feedback leaves the public guide and announcement unchanged',async()=>{
  const latest=await student.ok('/api/guide');assert.deepEqual(latest,guide);assert(!JSON.stringify(latest).includes(payload.contact));
});
await check('Blank, oversized, malformed and invalid related-guide inputs are rejected',async()=>{
  for(const input of [null,[],{...payload,title:'   '},{...payload,title:'题'.repeat(101)},{...payload,body:'\n '},{...payload,body:'文'.repeat(3001)},{...payload,contact:{}},{...payload,contact:'a'.repeat(101)},{...payload,articleId:'javascript:alert(1)'},'{'])assert.equal((await student.request('/api/feedback',input,'POST')).status,400);
  assert.equal((await student.request('/api/feedback',{...payload,body:'文'.repeat(17000)},'POST')).status,413);
});
await check('Cross-site posts and automated honeypot submissions are rejected',async()=>{
  assert.equal((await student.request('/api/feedback',payload,'POST',{Origin:'https://outside.invalid'})).status,403);
  assert.equal((await student.request('/api/feedback',{...payload,website:'https://spam.invalid'},'POST')).status,400);
});
await check('Contact details are optional and article feedback retains its reference',async()=>{
  const result=await student.ok('/api/feedback',{title:'补充指南',body:'这是关于已有指南的问题。',articleId:guide.articles[0].id},'POST');
  const inbox=await owner.ok('/api/admin/feedback');const item=inbox.items.find(item=>item.id===result.id);assert.equal(item.contact,'');assert.equal(item.article_id,guide.articles[0].id);
});
let item=(await owner.ok('/api/admin/feedback')).items.find(item=>item.id===submitted.id);
await check('Visitors cannot change processing status',async()=>{
  assert.equal((await student.request('/api/admin/feedback',{id:item.id,status:'done',revision:item.revision},'PATCH')).status,401);
});
await check('Maintainers can move feedback into processing',async()=>{
  await owner.ok('/api/admin/feedback',{id:item.id,status:'processing',revision:item.revision},'PATCH');
  const filtered=await owner.ok('/api/admin/feedback?status=processing');assert(filtered.items.some(row=>row.id===item.id));assert.equal(filtered.counts.processing,1);
});
await check('Conflicting status changes cannot overwrite another maintainer',async()=>{
  assert.equal((await owner.request('/api/admin/feedback',{id:item.id,status:'done',revision:item.revision},'PATCH')).status,409);
});
const editorPassword=crypto.randomBytes(24).toString('base64url');
const editorStudentId='0001000003';
const invite=await owner.ok('/api/auth/admin/create-user',{name:'反馈测试维护者',studentId:editorStudentId},'POST');
const token=new URLSearchParams(new URL(invite.activationUrl).hash.slice(1)).get('activate');
await editor.ok('/api/auth/activate',{studentId:editorStudentId,token,initialPassword:'000000',newPassword:editorPassword},'POST');
await editor.ok('/api/auth/sign-in/email',{studentId:editorStudentId,password:editorPassword},'POST');
const user=await editor.ok('/api/admin/articles');
await check('A regular maintainer can read feedback and finish processing it',async()=>{
  item=(await editor.ok('/api/admin/feedback?status=processing')).items.find(row=>row.id===submitted.id);
  await editor.ok('/api/admin/feedback',{id:item.id,status:'done',revision:item.revision},'PATCH');
  assert((await owner.ok('/api/admin/feedback?status=done')).items.some(row=>row.id===item.id));
});
await check('Invalid status, malformed edits and cross-site updates are rejected',async()=>{
  for(const value of [{id:item.id,status:'__proto__',revision:1},{id:item.id,status:'new',revision:0},null,'{'])assert.equal((await owner.request('/api/admin/feedback',value,'PATCH')).status,400);
  assert.equal((await owner.request('/api/admin/feedback',{id:item.id,status:'new',revision:item.revision},'PATCH',{Origin:'https://outside.invalid'})).status,403);
});
await check('Status filters and pagination keep older feedback accessible',async()=>{
  for(let i=0;i<22;i++)await student.ok('/api/feedback',{title:'分页测试 '+i,body:'本地功能验证记录。'},'POST');
  const first=await owner.ok('/api/admin/feedback?status=all&page=1'),second=await owner.ok('/api/admin/feedback?status=all&page=2');
  assert.equal(first.total,24);assert.equal(first.items.length,20);assert.equal(second.items.length,4);assert.equal(new Set([...first.items,...second.items].map(row=>row.id)).size,24);
  assert.equal((await owner.request('/api/admin/feedback?status=invalid')).status,400);assert.equal((await owner.request('/api/admin/feedback?page=0')).status,400);
});
await check('Public submissions have a server-enforced rate limit',async()=>{
  const limited=new Client('198.51.100.60');
  for(let i=0;i<60;i++)assert.equal((await limited.request('/api/feedback',{title:'频率测试 '+i,body:'本地频率验证。'},'POST')).status,201);
  assert.equal((await limited.request('/api/feedback',payload,'POST')).status,429);
});
await check('Stopping a maintainer account immediately blocks feedback access',async()=>{
  await owner.ok('/api/auth/admin/ban-user',{userId:user.user.id,banReason:'本地反馈权限验证'},'POST');
  assert.equal((await editor.request('/api/admin/feedback')).status,401);assert.equal((await editor.request('/api/admin/feedback',{id:item.id,status:'new',revision:2},'PATCH')).status,401);
});
await check('Private backups include submitted feedback and processing status',async()=>{
  const backup=await owner.ok('/api/admin/export');assert.equal(backup.tables.feedback.length,84);assert.equal(backup.tables.feedback.find(row=>row.id===submitted.id).status,'done');
  await fs.writeFile('work/private-feedback-test-backup.json',JSON.stringify(backup));
});
await fs.writeFile('work/feedback-verification.json',JSON.stringify({passed:checks.length,checks,feedbackId:submitted.id,release:guide.release.id},null,2));
console.log(JSON.stringify({passed:checks.length,allPassed:true}));
