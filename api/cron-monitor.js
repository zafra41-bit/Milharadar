import webpush from 'web-push';
import {supabase} from './_lib/supabase.js';

function monthDate(label, day=15) {
  const m=String(label||'').match(/^([A-Za-zÀ-ÿ]{3})\/(\d{2})$/);
  if(!m) return null;
  const months={jan:0,fev:1,mar:2,abr:3,mai:4,jun:5,jul:6,ago:7,set:8,out:9,nov:10,dez:11};
  const month=months[m[1].toLowerCase()];
  if(month===undefined) return null;
  return new Date(Date.UTC(2000+Number(m[2]),month,day)).toISOString().slice(0,10);
}
function plusDays(date,n){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function pointsForJourney(j) {
  if(j.available===false) return null;
  const fares=[...(j.fares||[])];
  if(j.cheapestFare) fares.unshift(j.cheapestFare);
  const opts=fares.flatMap(f=>f.pointsOptions||[]).filter(o=>o.passengerType==='ADT'&&Number(o.amountLevel||1)===1&&Number(o.points)>0);
  return opts.length?Math.min(...opts.map(o=>Number(o.points))):null;
}
async function queryGecko(alert,departureDate) {
  const key=process.env.GECKO_API_KEY||process.env.GECKOAPI_API_KEY;
  if(!key) throw new Error('GECKO_API_KEY não configurada.');
  const returnDate=plusDays(departureDate,alert.duration_days);
  const r=await fetch('https://api.geckoapi.com.br/v1/extract',{method:'POST',
    headers:{Authorization:'Bearer '+key,'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({target:'voeazul.com.br',type:'plp',from:alert.origin.code,to:alert.destination.code,
      departureDate,returnDate,numAdults:alert.passengers,numChildren:0,numInfants:0,currency:'BRL',points:true}),
    signal:AbortSignal.timeout(65000)});
  const p=await r.json().catch(()=>null);
  if(!r.ok) throw new Error('GeckoAPI HTTP '+r.status);
  if(!p||!p.data||p.notFound) return null;
  if(p.data.from!==alert.origin.code||p.data.to!==alert.destination.code||p.data.pricingMode!=='points')
    throw new Error('Resposta GeckoAPI incompatível com a rota ou modalidade solicitada.');
  const trips=p.data.trips||[];
  const outbound=trips.filter(t=>t.origin===alert.origin.code&&t.destination===alert.destination.code)
    .flatMap(t=>t.journeys||[]).map(j=>({j,p:pointsForJourney(j)})).filter(x=>x.p!==null);
  const inbound=trips.filter(t=>t.origin===alert.destination.code&&t.destination===alert.origin.code)
    .flatMap(t=>t.journeys||[]).map(j=>({j,p:pointsForJourney(j)})).filter(x=>x.p!==null);
  if(!outbound.length||!inbound.length) return null;
  const best=Math.min(...outbound.map(o=>o.p))+Math.min(...inbound.map(o=>o.p));
  return {totalPoints:best*alert.passengers,pointsPerPassenger:best,departureDate,returnDate,
    status:best*alert.passengers<=alert.target_points_per_pax*alert.passengers?'hit':'monitoring'};
}
export default async function handler(req,res) {
  if(req.method!=='GET') return res.status(405).json({error:'Método não permitido.'});
  if(!process.env.CRON_SECRET||req.headers.authorization!=='Bearer '+process.env.CRON_SECRET)
    return res.status(401).json({error:'Não autorizado.'});
  try {
    const alerts=await supabase('milharadar_alerts?active=eq.true&order=created_at.asc');
    let checked=0,matched=0,failed=0,credits=0;
    let pushReady=false;
    if(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.VAPID_SUBJECT) {
      try { webpush.setVapidDetails(process.env.VAPID_SUBJECT,process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY); pushReady=true; }
      catch(e) { pushReady=false; }
    }
    for(const alert of alerts) {
      try {
        const labels=Array.isArray(alert.months)?alert.months:[];
        if(!labels.length) continue;
        const date=monthDate(labels[(new Date().getUTCDate()-1)%labels.length]);
        if(!date) continue;
        await supabase('rpc/record_milharadar_alert_gecko_query',{method:'POST',body:'{}'});
        const match=await queryGecko(alert,date); credits++;
        const previous=alert.last_match;
        const now=new Date().toISOString();
        await supabase('milharadar_alerts?id=eq.'+alert.id,{method:'PATCH',headers:{Prefer:'return=minimal'},
          body:JSON.stringify({last_checked_at:now,last_match:match?{...match,checkedAt:now}:null,updated_at:now})});
        checked++;
        if(match&&match.status==='hit') {
          matched++;
          const changed=!previous||previous.status!=='hit'||previous.totalPoints!==match.totalPoints||previous.departureDate!==match.departureDate;
          if(changed&&pushReady) {
            const subs=await supabase('milharadar_push_subscriptions?device_token_hash=eq.'+alert.device_token_hash);
            for(const sub of subs) {
              try { await webpush.sendNotification(sub.subscription,JSON.stringify({title:'MilhaRadar: meta encontrada!',body:alert.origin.code+' → '+alert.destination.code+' por '+match.totalPoints.toLocaleString('pt-BR')+' pontos.',url:'/'})); }
              catch(e) { if(e.statusCode===404||e.statusCode===410) await supabase('milharadar_push_subscriptions?id=eq.'+sub.id,{method:'DELETE'}); }
            }
          }
        }
      } catch(e) { failed++; }
    }
    return res.status(200).json({status:'ok',executedAt:new Date().toISOString(),alerts:alerts.length,checked,matched,failed,geckoQueries:credits,geckoCredits:credits*5,pushConfigured:pushReady});
  } catch(e) { return res.status(500).json({error:e.message}); }
}
