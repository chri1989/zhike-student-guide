import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const origin='http://127.0.0.1:5173';
const vars=Object.fromEntries((await fs.readFile('.dev.vars','utf8')).trim().split(/\r?\n/).map(l=>l.split('=')));
const checks=[];
function check(name,fn){fn();checks.push(name);console.log('PASS '+name);}
class Client{
  cookies=new Map();
  async request(path,body,method){
    const headers={Origin:origin};
    if(this.cookies.size)headers.Cookie=[...this.cookies].map(([k,v])=>k+'='+v).join('; ');
    const options={method:method||(body?'POST':'GET'),headers};
    if(body instanceof FormData)options.body=body;
    else if(body){headers['Content-Type']='application/json';options.body=JSON.stringify(body);}
    const r=await fetch(origin+path,options);
    for(const cookie of r.headers.getSetCookie()){const [name,...rest]=cookie.split(';')[0].split('=');this.cookies.set(name,rest.join('='));}
    const raw=await r.text();let data;try{data=JSON.parse(raw);}catch{data=raw;}
    return {status:r.status,data,headers:r.headers};
  }
  async ok(path,body,method){const r=await this.request(path,body,method);assert.equal(r.status,200,JSON.stringify(r.data));return r.data;}
}
const guest=new Client(),owner=new Client(),editor=new Client();
assert.equal((await guest.request('/api/admin/export')).status,401);checks.push('Private migration backups are unavailable to guests');
const baseline=await guest.ok('/api/guide');
check('Initial content: 162 articles, 24 images and no source metadata',()=>{assert.equal(baseline.articles.length,162);assert.equal(baseline.articles.flatMap(a=>a.images).length,24);assert(baseline.articles.every(a=>!a.sources));});
check('Guide is never served as a cached response',()=>assert.equal((baseline&&true),true));
assert.equal((await guest.request('/api/guide')).headers.get('cache-control'),'no-store');
assert.equal((await guest.request('/api/admin/articles')).status,401);checks.push('Anonymous admin access rejected');
assert.equal((await guest.request('/api/setup',{token:'invalid',email:'none@guide.test',name:'无效测试',password:'invalid123456'})).status,403);checks.push('Setup requires the private one-time credential');
const setup=await guest.ok('/api/setup');
assert(setup.needsSetup,'Run verification against a fresh local database.');
const password=crypto.randomBytes(24).toString('base64url');
await owner.ok('/api/setup',{token:vars.BOOTSTRAP_TOKEN,email:'owner@guide.test',name:'本地测试管理员',password});
assert.equal((await guest.request('/api/setup',{token:vars.BOOTSTRAP_TOKEN,email:'second@guide.test',name:'重复初始化',password})).status,409);checks.push('First administrator can only be created once');
assert.equal((await guest.request('/api/auth/sign-up/email',{name:'Unauthorized',email:'other@guide.test',password})).status,400);checks.push('Public registration is disabled');
await owner.ok('/api/auth/sign-in/email',{email:'owner@guide.test',password});
let admin=await owner.ok('/api/admin/articles');assert.equal(admin.user.role,'admin');checks.push('Ordinary password login and owner role work');
const first=structuredClone(admin.drafts.find(d=>d.content.title==='宿舍报修流程与电话'));
const second=structuredClone(admin.drafts.find(d=>d.content.title==='校园网无法连接'));
const before=baseline.articles.find(a=>a.id===first.id).body;
first.content.body+='\n\n本地流程验证文本。';
const saved=await owner.ok('/api/admin/articles',{content:first.content,active:true,revision:first.revision},'PUT');
assert.equal((await guest.ok('/api/guide')).articles.find(a=>a.id===first.id).body,before);checks.push('Saving a draft leaves public content unchanged');
assert.equal((await owner.request('/api/admin/articles',{content:first.content,active:true,revision:first.revision},'PUT')).status,409);checks.push('Conflicting draft edits cannot overwrite each other');
first.revision=saved.revision;
second.content.body+='\n\n未选择发布的本地草稿。';
await owner.ok('/api/admin/articles',{content:second.content,active:true,revision:second.revision},'PUT');
const pub=await owner.ok('/api/admin/publish',{expectedRelease:baseline.release.id,selected:[{id:first.id,revision:first.revision}],summary:'本地测试：更新报修说明。'});
let current=await guest.ok('/api/guide');
assert.equal(current.release.id,pub.release);assert.equal(current.release.changes[0].id,first.id);assert.equal(current.articles.find(a=>a.id===first.id).body,first.content.body);assert(!current.articles.find(a=>a.id===second.id).body.includes('未选择发布'));
checks.push('One release atomically publishes selected content and its announcement');checks.push('Unselected coeditor drafts stay private');
assert.equal((await owner.request('/api/admin/publish',{expectedRelease:baseline.release.id,selected:[{id:first.id,revision:first.revision}],summary:'过时版本测试'})).status,409);checks.push('A stale publication is rejected');
const image=current.articles.flatMap(a=>a.images)[0];const raw=await fetch(origin+image.src);assert.equal(raw.status,200);assert(raw.headers.get('content-type').startsWith('image/'));checks.push('Imported images load from cloud-compatible storage');
const imageFile=(await fs.readdir('public/seed-images')).find(n=>n.endsWith('.jpeg'));
const file=new File([await fs.readFile('public/seed-images/'+imageFile)],'测试图片.jpeg',{type:'image/jpeg'});
const form=new FormData();form.set('file',file);
assert.equal((await guest.request('/api/admin/upload',form)).status,401);
const upload=await owner.ok('/api/admin/upload',form);
assert.equal((await guest.request(upload.src)).status,401);checks.push('Unpublished uploaded images are private');
admin=await owner.ok('/api/admin/articles');let draft=admin.drafts.find(d=>d.id===first.id);draft.content.images.push({src:upload.src,alt:'本地上传验证'});
const nextSave=await owner.ok('/api/admin/articles',{content:draft.content,active:true,revision:draft.revision},'PUT');
await owner.ok('/api/admin/publish',{expectedRelease:current.release.id,selected:[{id:draft.id,revision:nextSave.revision}],summary:'本地测试：发布图片。'});
assert.equal((await fetch(origin+upload.src)).status,200);checks.push('Publishing makes the selected uploaded image readable');
await owner.ok('/api/auth/admin/create-user',{name:'本地测试维护者',email:'editor@guide.test',password,role:'user'});
await editor.ok('/api/auth/sign-in/email',{email:'editor@guide.test',password});
const editorData=await editor.ok('/api/admin/articles');assert.equal(editorData.user.role,'user');
assert.equal((await editor.request('/api/admin/export')).status,403);checks.push('Only the owner can export accounts and content for migration');
assert.equal((await editor.request('/api/auth/admin/list-users')).status,403);checks.push('Coeditors can maintain content but cannot manage accounts');
await owner.ok('/api/auth/admin/ban-user',{userId:editorData.user.id,banReason:'本地停用测试'});
assert.equal((await editor.request('/api/admin/articles')).status,401);checks.push('Deactivated accounts immediately lose write access');
admin=await owner.ok('/api/admin/articles');draft=admin.drafts.find(d=>d.id===first.id);
const remove=await owner.ok('/api/admin/articles',{content:draft.content,active:false,revision:draft.revision},'PUT');
await owner.ok('/api/admin/publish',{expectedRelease:admin.release.id,selected:[{id:draft.id,revision:remove.revision}],summary:'本地测试：停用条目。'});
current=await guest.ok('/api/guide');assert(!current.articles.some(a=>a.id===first.id));assert.equal(current.release.changes[0].kind,'removed');checks.push('Unpublishing removes the article from the shared snapshot and records the change');
assert((await guest.ok('/api/updates')).length>=4);checks.push('Public update history preserves previous announcements');
const backup=await owner.ok('/api/admin/export');
assert.equal(backup.format,1);assert.equal(backup.tables.releases.length,4);assert.equal(backup.images.length,25);
assert.equal(backup.tables.account.filter(a=>a.password).length,2);
await fs.mkdir('work',{recursive:true});
await fs.writeFile('work/private-test-backup.json',JSON.stringify(backup));
await fs.writeFile('work/restart-check.json',JSON.stringify({email:'owner@guide.test',password,guide:current,uploadedImage:upload.src}));
checks.push('A private backup includes complete release history, account hashes and uploaded images');
await owner.ok('/api/auth/sign-out',{});assert.equal((await owner.request('/api/admin/articles')).status,401);checks.push('Signing out invalidates the session');
await fs.mkdir('work',{recursive:true});await fs.writeFile('work/verification.json',JSON.stringify({passed:checks.length,checks},null,2));
console.log(JSON.stringify({passed:checks.length,allPassed:true}));
