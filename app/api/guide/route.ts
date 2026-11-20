import { publicGuide, reply, fail } from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET() { try { return reply(await publicGuide()); } catch(e) { return fail(e); } }
