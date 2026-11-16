import { createHash } from 'node:crypto';

export function config() {
  const rawUrl=process.env.SUPABASE_URL||'';
  const url=rawUrl.endsWith('/')?rawUrl.slice(0,-1):rawUrl;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error('Supabase não configurado no servidor.');
  return {url,key};
}
export function hashDeviceToken(token) {
  if(typeof token!=='string'||token.length<24) throw new Error('Identificador do dispositivo inválido.');
  return createHash('sha256').update(token).digest('hex');
}
export async function supabase(path, options={}) {
  const {url,key}=config();
  const response=await fetch(url+'/rest/v1/'+path,{
    ...options,
    headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',
      Accept:'application/json',...(options.headers||{})},
    signal:options.signal||AbortSignal.timeout(15000)
  });
  const body=await response.text();
  if(!response.ok) throw new Error('Supabase HTTP '+response.status+': '+body.slice(0,400));
  return body?JSON.parse(body):null;
}
