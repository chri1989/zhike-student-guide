import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { database } from '@/lib/storage';
import type { SQLInputValue } from 'node:sqlite';
import * as schema from './schema';

export function getDb() {
  return drizzle(async (sql,params,method)=>{
    const statement=database().prepare(sql);
    statement.setReturnArrays(true);
    const values=params as SQLInputValue[];
    if(method==='run') { statement.run(...values); return {rows:[]}; }
    const rows=statement.all(...values) as unknown as unknown[][];
    return {rows:method==='get' ? rows[0] : rows};
  },{schema});
}
