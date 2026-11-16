import {hashDeviceToken,supabase} from './_lib/supabase.js';

export default async function handler(req,res) {
  try {
    const token=req.headers['x-device-token'];
    const device_token_hash=hashDeviceToken(token);
    if(req.method==='GET') {
      const rows=await supabase('milharadar_alerts?device_token_hash=eq.'+device_token_hash+'&active=eq.true&order=created_at.desc');
      return res.status(200).json({alerts:rows.map(row=>({...row,id:row.id,days:row.duration_days,
        targetPointsPerPax:row.target_points_per_pax,bestFound:row.last_match?.totalPoints??null,
        bestDate:row.last_match?.date??null,lastChecked:row.last_checked_at??null,
        status:row.last_match?.status??'monitoring'}))});
    }
    if(req.method==='POST') {
      const b=req.body||{};
      if(!b.origin?.code||!b.destination?.code||b.origin.code===b.destination.code||!Array.isArray(b.months)||!b.months.length)
        return res.status(400).json({error:'Dados do alerta inválidos.'});
      const payload={device_token_hash,origin:b.origin,destination:b.destination,months:b.months,
        duration_days:Math.max(1,Math.min(60,Number(b.days)||7)),
        passengers:Math.max(1,Math.min(9,Number(b.passengers)||1)),program:'TudoAzul',
        target_points_per_pax:Math.max(1,Number(b.targetPointsPerPax)||45000),active:true};
      const rows=await supabase('milharadar_alerts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
      return res.status(201).json({alert:rows[0]});
    }
    if(req.method==='DELETE') {
      const id=String(req.query?.id||'');
      if(!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({error:'ID de alerta inválido.'});
      await supabase('milharadar_alerts?id=eq.'+id+'&device_token_hash=eq.'+device_token_hash,{method:'DELETE'});
      return res.status(200).json({ok:true});
    }
    return res.status(405).json({error:'Método não permitido.'});
  } catch(e) { return res.status(500).json({error:e.message}); }
}
