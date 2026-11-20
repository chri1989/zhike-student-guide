import { spawn } from 'node:child_process';
import { initializeStore } from './initialize-store.mjs';

if(!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length<32 || !process.env.SITE_URL) {
  throw new Error('Set AUTH_SECRET (at least 32 characters) and SITE_URL before starting the website.');
}
initializeStore();
const server=spawn(process.execPath,['.next/standalone/server.js'],{
  stdio:'inherit',env:{...process.env,PORT:process.env.PORT||'7860',HOSTNAME:'0.0.0.0'},
});
for(const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>server.kill(signal));
server.on('exit',code=>process.exit(code??1));
