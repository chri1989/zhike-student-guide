import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';

class Statement {
  constructor(readonly sql: string, readonly values: SQLInputValue[] = []) {}
  bind(...values: SQLInputValue[]) { return new Statement(this.sql, values); }
  async first<T>() { return (database().prepare(this.sql).get(...this.values) as T | undefined) ?? null; }
  async all<T>() { return { results: database().prepare(this.sql).all(...this.values) as T[] }; }
  execute() {
    const statement=database().prepare(this.sql);
    if(statement.columns().length) return {results:statement.all(...this.values),meta:{changes:0}};
    const result=statement.run(...this.values);
    return {results:[],meta:{changes:Number(result.changes)}};
  }
  async run() { return this.execute(); }
}

let connection: DatabaseSync;
export function dataDirectory() {
  const directory=process.env.GUIDE_DATA_DIR;
  if(!directory || !path.isAbsolute(directory)) throw new Error('Set GUIDE_DATA_DIR to an absolute persistent data directory.');
  return directory;
}
export function database() {
  if (!connection) {
    connection=new DatabaseSync(path.join(dataDirectory(),'guide.sqlite'));
    connection.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;');
  }
  return connection;
}
const DB={
  prepare(sql:string) { return new Statement(sql); },
  async batch(statements:Statement[]) {
    const db=database();
    db.exec('BEGIN IMMEDIATE');
    try {
      const results=statements.map(s=>s.execute());
      db.exec('COMMIT');
      return results;
    } catch(error) { db.exec('ROLLBACK'); throw error; }
  },
};
const BUCKET={
  async put(key:string,bytes:Uint8Array) {
    const directory=path.join(dataDirectory(),'media');
    mkdirSync(directory,{recursive:true});
    const target=path.join(directory,key), temporary=target+'.tmp';
    writeFileSync(temporary,bytes,{mode:0o600});
    renameSync(temporary,target);
  },
  async get(key:string) {
    try { return {body:new Uint8Array(readFileSync(path.join(dataDirectory(),'media',key)))}; }
    catch(error) { if ((error as NodeJS.ErrnoException).code==='ENOENT') return null; throw error; }
  },
};
export function bindings() {
  return {DB,BUCKET,AUTH_SECRET:process.env.AUTH_SECRET||'',BOOTSTRAP_TOKEN:process.env.BOOTSTRAP_TOKEN||''};
}
