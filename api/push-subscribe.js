import {hashDeviceToken,supabase} from './_lib/supabase.js';

export default async function handler(req,res) {
  if(req.method!=='POST') return res.status(405).json({error:'Método não permitido.'});
  try {
    const device_token_hash=hashDeviceToken(req.headers['x-device-token']);
    const subscription=req.body?.subscription;
    if(!subscription?.endpoint||!subscription?.keys?.p256dh||!subscription?.keys?.auth)
      return res.status(400).json({error:'Inscrição push inválida.'});
    await supabase('milharadar_push_subscriptions?on_conflict=device_token_hash',{
      method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({device_token_hash,subscription,updated_at:new Date().toISOString()})
    });
    return res.status(200).json({ok:true});
  } catch(e) { return res.status(500).json({error:e.message}); }
}
