import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { bindings, fail, getAuth, HttpError, reply, requireEditor, sameOrigin } from '@/lib/server';
import { initialAdminPassword, minimumAdminPasswordLength, studentEmail, studentIdFromEmail } from '@/lib/student-account.mjs';

export const dynamic = 'force-dynamic';

function authPath(request: Request) {
  return new URL(request.url).pathname.replace(/^\/api\/auth|\/+$/g, '');
}

function resetPath(path: string) {
  return /^\/(request-password-reset|reset-password)(\/|$)/.test(path);
}

function authRequest(request: Request, body: object) {
  const headers = new Headers(request.headers);
  headers.delete('content-length');
  headers.set('Content-Type', 'application/json');
  return new Request(request.url, { method: 'POST', headers, body: JSON.stringify(body) });
}

function activationDigest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function issueActivationLink(request: Request, userId: string) {
  const { DB } = bindings();
  // Better Auth identifies single-use password setup tokens with this prefix.
  const token = randomBytes(24).toString('base64url');
  const now = Date.now();
  await DB.batch([
    DB.prepare("DELETE FROM verification WHERE value=? AND identifier LIKE 'reset-password:%'").bind(userId),
    DB.prepare('INSERT INTO verification(id,identifier,value,expiresAt,createdAt,updatedAt) VALUES(?,?,?,?,?,?)')
      .bind(randomUUID(), `reset-password:${activationDigest(token)}`, userId, now + 86400000, now, now),
  ]);
  const url = new URL('/admin', process.env.SITE_URL || request.url);
  url.hash = new URLSearchParams({ activate: token }).toString();
  return reply({ activationUrl: url.href });
}

export async function GET(request: Request) {
  if (resetPath(authPath(request))) return reply({ error: '请使用管理员发给你的激活链接。' }, 403);
  return getAuth(request).handler(request);
}

export async function POST(request: Request) {
  const path = authPath(request);
  if (resetPath(path) || ['/admin/impersonate-user', '/admin/remove-user', '/admin/set-role'].includes(path)) {
    return reply({ error: '此操作未开放。' }, 403);
  }
  if (!['/sign-in/email', '/admin/create-user', '/admin/activation-link', '/activate'].includes(path)) {
    return getAuth(request).handler(request);
  }

  try {
    sameOrigin(request);
    const input = await request.json().catch(() => null);
    const { DB } = bindings();
    if (path === '/admin/activation-link') {
      await requireEditor(request, true);
      if (typeof input?.userId !== 'string') throw new HttpError(400, '请选择管理员。');
      const account = await DB.prepare("SELECT id,email FROM user WHERE id=? AND role='user' AND COALESCE(banned,0)=0")
        .bind(input.userId).first<{ id: string; email: string }>();
      if (!account || !studentIdFromEmail(account.email)) throw new HttpError(400, '请选择已开通、未停用的学号账号。');
      return await issueActivationLink(request, account.id);
    }

    const email = studentEmail(input?.studentId);
    if (!email) throw new HttpError(400, '请输入由数字组成的学号。');
    const auth = getAuth(request);
    if (path === '/sign-in/email') {
      const user = await DB.prepare("SELECT id,role FROM user WHERE email=? AND role IN ('admin','user') AND COALESCE(banned,0)=0")
        .bind(email).first<{ id: string; role: string }>();
      if (!user) throw new HttpError(403, '该账号未授权');
      if ((user.role === 'admin' || input.password === initialAdminPassword) && await DB.prepare("SELECT 1 FROM verification WHERE value=? AND identifier LIKE 'reset-password:%' AND expiresAt>?").bind(user.id, Date.now()).first()) {
        throw new HttpError(403, '请通过你的激活链接设置新密码。');
      }
      return auth.handler(authRequest(request, { email, password: input.password }));
    }
    if (path === '/admin/create-user') {
      await requireEditor(request, true);
      if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 40) throw new HttpError(400, '请填写姓名。');
      const response = await auth.handler(authRequest(request, {
        email, name: input.name.trim(), password: randomBytes(24).toString('base64url'), role: 'user',
      }));
      if (!response.ok) return response;
      const created = await response.json() as { user: { id: string } };
      return await issueActivationLink(request, created.user.id);
    }

    if (input.initialPassword !== initialAdminPassword) throw new HttpError(400, '初始密码不正确。');
    if (typeof input.newPassword !== 'string' || input.newPassword.length < minimumAdminPasswordLength) {
      throw new HttpError(400, `请设置至少 ${minimumAdminPasswordLength} 位的新密码。`);
    }
    const invalidLink = '激活链接已失效或与学号不匹配，请向总管理员索取。';
    if (typeof input.token !== 'string' || !/^[\w-]{32}$/.test(input.token)) throw new HttpError(400, invalidLink);
    const token = activationDigest(input.token);
    const authorized = await DB.prepare("SELECT 1 FROM verification v JOIN user u ON u.id=v.value WHERE v.identifier=? AND v.expiresAt>? AND u.email=? AND u.role IN ('admin','user') AND COALESCE(u.banned,0)=0")
      .bind(`reset-password:${token}`, Date.now(), email).first();
    if (!authorized) throw new HttpError(400, invalidLink);
    try {
      await auth.api.resetPassword({ body: { token, newPassword: input.newPassword }, headers: request.headers });
    } catch (error) {
      if ((error as { body?: { code?: string } }).body?.code === 'INVALID_TOKEN') throw new HttpError(400, invalidLink);
      throw error;
    }
    return reply({ ok: true });
  } catch(error) {
    return fail(error);
  }
}
