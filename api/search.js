const AZUL_BASE = 'https://passagens.voeazul.com.br/pt';
const GECKO_URL = 'https://api.geckoapi.com.br/v1/extract';
const TRANSIENT = [429, 500, 502, 503, 504];

function slugify(value = '') {
  return String(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
}
function decodeHtml(value) {
  return value.replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
}
function htmlToText(html) {
  return decodeHtml(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<\/(?:tr|td|th|p|div|li|h[1-6]|section|article)>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .replace(/[ \t\r]+/g, ' ').replace(/\n\s*/g, '\n');
}
function parseMonthLabel(value) {
  const m = String(value).match(/^([A-Za-zÀ-ÿ]{3})\/(\d{2})$/);
  if (!m) return null;
  const months = {jan:0,fev:1,mar:2,abr:3,mai:4,jun:5,jul:6,ago:7,set:8,out:9,nov:10,dez:11};
  const month = months[m[1].toLowerCase()];
  return month === undefined ? null : (2000 + Number(m[2])) + '-' + String(month + 1).padStart(2,'0');
}
function monthSamples(label) {
  const key = parseMonthLabel(label);
  if (!key) return [];
  const [year,month] = key.split('-').map(Number);
  const last = new Date(Date.UTC(year,month,0)).getUTCDate();
  return [1,8,15,22].filter(d => d <= last).map(d => new Date(Date.UTC(year,month-1,d)).toISOString().slice(0,10));
}
function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+days);
  return d.toISOString().slice(0,10);
}
function brDate(iso) { const p=iso.slice(0,10).split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }

function parseOffers(text, requestedMonths, minimumDays, passengers) {
  const monthKeys = new Set((requestedMonths || []).map(parseMonthLabel).filter(Boolean));
  const pattern = /Ida\s*e\s*volta[\s\S]{0,180}?(\d{2})\/(\d{2})\/(\d{4})\s*[-–]\s*(\d{2})\/(\d{2})\/(\d{4})[\s\S]{0,100}?A partir de\s*([\d.,]+)\s*pontos/gi;
  const offers=[]; let m;
  while ((m=pattern.exec(text))!==null) {
    const [,d1,m1,y1,d2,m2,y2,raw]=m;
    const dep=new Date(Date.UTC(+y1,+m1-1,+d1)), ret=new Date(Date.UTC(+y2,+m2-1,+d2));
    const nights=Math.round((ret-dep)/86400000), points=Number(raw.replace(/[.,]/g,''));
    const key=y1+'-'+m1;
    if (!Number.isFinite(points)||points<=0||nights<minimumDays||(monthKeys.size&&!monthKeys.has(key))) continue;
    offers.push({id:y1+m1+d1+'-'+y2+m2+d2,departureDate:d1+'/'+m1+'/'+y1,returnDate:d2+'/'+m2+'/'+y2,
      monthLabel:dep.toLocaleDateString('pt-BR',{month:'short',year:'2-digit',timeZone:'UTC'}),
      pointsPerPassenger:points,totalPoints:points*passengers,passengers,airline:'Azul',
      stops:'Conforme disponibilidade no site da Azul',duration:nights+' noites',nights,
      priceBasis:'published-itinerary',insight:'Preço publicado pela Azul por adulto/criança; confirme a composição e o total no checkout.'});
  }
  return offers.sort((a,b)=>a.totalPoints-b.totalPoints);
}
function getAdultPointOption(journey) {
  const fares=[...(journey.fares||[])];
  if (journey.cheapestFare) fares.unshift(journey.cheapestFare);
  for (const fare of fares) {
    const options=(fare.pointsOptions||[]).filter(x=>x.passengerType==='ADT'&&Number(x.amountLevel||1)===1&&Number(x.points)>0);
    if (options.length) return options.sort((a,b)=>a.points-b.points)[0];
  }
  return null;
}
function normalizeGecko(data, adults, minNights) {
  const outbound=[], inbound=[];
  for (const trip of (data.trips||[])) {
    for (const j of (trip.journeys||[])) {
      if (j.available===false) continue;
      const opt=getAdultPointOption(j);
      if (!opt) continue;
      const row={journey:j,option:opt,points:Number(opt.points),
        discounted:Number(opt.discountedPoints)>0?Number(opt.discountedPoints):Number(opt.points),
        tax:Number(opt.taxesAndFees&&opt.taxesAndFees.amount||0)};
      if (trip.origin===data.from && trip.destination===data.to) outbound.push(row);
      if (trip.origin===data.to && trip.destination===data.from) inbound.push(row);
    }
  }
  if (!outbound.length || !inbound.length || !data.departureDate || !data.returnDate) return [];
  const dep=data.departureDate, ret=data.returnDate;
  const nights=Math.round((new Date(ret+'T00:00:00Z')-new Date(dep+'T00:00:00Z'))/86400000);
  if (nights<minNights) return [];
  const sort=(a,b)=>a.points-b.points;
  const out=outbound.sort(sort)[0], back=inbound.sort(sort)[0];
  const outJ=out.journey, backJ=back.journey;
  const totalPerAdult=out.points+back.points, discountedPerAdult=out.discounted+back.discounted;
  const taxesPerAdult=out.tax+back.tax;
  return [{
    id:'gecko-'+dep+'-'+ret,
    departureDate:brDate(dep),returnDate:brDate(ret),
    monthLabel:new Date(dep+'T00:00:00Z').toLocaleDateString('pt-BR',{month:'short',year:'2-digit',timeZone:'UTC'}),
    outboundPoints:out.points,returnPoints:back.points,
    pointsPerPassenger:totalPerAdult,discountedPointsPerPassenger:discountedPerAdult,
    totalPoints:totalPerAdult*adults,discountedTotalPoints:discountedPerAdult*adults,
    passengers:adults,taxesPerPassenger:taxesPerAdult,totalTaxes:taxesPerAdult*adults,
    airline:'Azul',
    stops:'Ida: '+((outJ.segments||[]).length>1?((outJ.segments||[]).length-1)+' conexão(ões)':'Direto')+
      ' • Volta: '+((backJ.segments||[]).length>1?((backJ.segments||[]).length-1)+' conexão(ões)':'Direto'),
    duration:'Ida '+(outJ.duration||'')+' • volta '+(backJ.duration||''),
    nights,departureTime:outJ.departure||null,arrivalTime:outJ.arrival||null,
    returnDepartureTime:backJ.departure||null,returnArrivalTime:backJ.arrival||null,
    outboundSegments:(outJ.segments||[]).map(s=>({from:s.origin,to:s.destination,departure:s.departure,arrival:s.arrival,flightNumber:s.flight&&s.flight.flightNumber||null})),
    returnSegments:(backJ.segments||[]).map(s=>({from:s.origin,to:s.destination,departure:s.departure,arrival:s.arrival,flightNumber:s.flight&&s.flight.flightNumber||null})),
    priceBasis:'geckoapi-points-options',
    insight:'GeckoAPI/Azul: ida '+out.points.toLocaleString('pt-BR')+' + volta '+back.points.toLocaleString('pt-BR')+
      ' pontos por adulto. Taxas somadas: R$ '+taxesPerAdult.toFixed(2)+' por adulto. Bebês/crianças são tratados separadamente.'
  }];
}
async function fetchGecko(args) {
  const key=process.env.GECKO_API_KEY||process.env.GECKOAPI_API_KEY;
  if (!key) throw new Error('GECKO_API_KEY não configurada');
  const response=await fetch(GECKO_URL,{method:'POST',
    headers:{Authorization:'Bearer '+key,'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({target:'voeazul.com.br',type:'plp',from:args.origin.code,to:args.destination.code,
      departureDate:args.departureDate,returnDate:args.returnDate,numAdults:args.adults,
      numChildren:args.children,numInfants:args.infants,currency:'BRL',points:true}),
    signal:AbortSignal.timeout(65000)});
  const payload=await response.json().catch(()=>null);
  if (!response.ok) throw new Error('GeckoAPI HTTP '+response.status+': '+(payload&& (payload.error||payload.message)||'falha na consulta'));
  if (payload&& (payload.notFound||payload.data===null)) return null;
  if (!payload||!payload.data) throw new Error('Resposta GeckoAPI sem data.');
  return payload.data;
}
async function reserveManualGeckoQuery() {
  const rawBase=process.env.SUPABASE_URL||'';\n  const base=rawBase.endsWith('/')?rawBase.slice(0,-1):rawBase;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base||!key) throw new Error('Limite diário indisponível: configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  const response=await fetch(base+'/rest/v1/rpc/reserve_milharadar_manual_gecko_query',{
    method:'POST',
    headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Accept:'application/json'},
    body:'{}',
    signal:AbortSignal.timeout(10000)
  });
  const payload=await response.json().catch(()=>null);
  if(!response.ok||!Array.isArray(payload)||!payload[0]) throw new Error('Não foi possível validar a cota diária da GeckoAPI no Supabase.');
  return payload[0];
}
async function searchGecko(args) {
  const departureDate=args.months.map(label=>monthSamples(label)[2]||monthSamples(label)[0]).find(Boolean);
  if(!departureDate) throw new Error('Não foi possível determinar uma data para a consulta.');
  const quota=await reserveManualGeckoQuery();
  if(!quota.allowed) {
    const error=new Error('Limite diário atingido: você já utilizou as 3 consultas manuais da GeckoAPI de hoje. Os alertas diários têm cota separada.');
    error.code='GECKO_DAILY_LIMIT';
    error.used=quota.used;
    throw error;
  }
  const returnDate=addDays(departureDate,args.days);
  try {
    const data=await fetchGecko({...args,departureDate,returnDate});
    if(!data) return {options:[],attemptedQueries:1,successfulQueries:1,failures:[],departureDate,returnDate,remaining:quota.remaining};
    if(data.from!==args.origin.code||data.to!==args.destination.code) throw new Error('A API retornou rota diferente da solicitada.');
    if(data.pricingMode!=='points') throw new Error('A API não retornou tarifas em pontos.');
    return {options:normalizeGecko(data,args.adults,args.days),attemptedQueries:1,successfulQueries:1,failures:[],
      departureDate,returnDate,remaining:quota.remaining};
  } catch(e) {
    return {options:[],attemptedQueries:1,successfulQueries:0,failures:[{departureDate,message:e.message}],
      departureDate,returnDate,remaining:quota.remaining};
  }
}
async function fetchAzulPage(url) {
  let response=null,status=null,error=null;
  for(let i=0;i<2;i++) try {
    response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept:'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8','Accept-Language':'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control':'no-cache',Pragma:'no-cache',Referer:'https://www.voeazul.com.br/'},signal:AbortSignal.timeout(7000)});
    if(response.ok) return {response};
    status=response.status;
    if(i===0&&TRANSIENT.includes(status)){await new Promise(r=>setTimeout(r,500));continue;}
    break;
  } catch(e) { error=e; if(i===0) await new Promise(r=>setTimeout(r,500)); }
  return {error:{status,error}};
}

export default async function handler(req,res) {
  if(req.method!=='POST') return res.status(405).json({error:'Método não permitido'});
  try {
    const body=req.body||{}, origin=body.origin,destination=body.destination,months=body.months;
    const adults=Math.max(1,Math.min(9,Number(body.adults??body.passengers)||1));
    const children=Math.max(0,Math.min(9,Number(body.children)||0));
    const infants=Math.max(0,Math.min(adults,Number(body.infants)||0));
    const days=Math.max(1,Math.min(60,Number(body.days)||7));
    const program=body.program||'TudoAzul';
    if(!origin?.code||!origin?.city||!destination?.code||!destination?.city||!Array.isArray(months)||!months.length)
      return res.status(400).json({error:'Informe origem, destino e pelo menos um mês.'});
    if(origin.code===destination.code) return res.status(400).json({error:'Origem e destino precisam ser diferentes.'});
    if(String(program).toLowerCase()!=='tudoazul') return res.status(400).json({error:'Busca real disponível somente para TudoAzul.'});

    const url=AZUL_BASE+'/voos-de-'+slugify(origin.city)+'-para-'+slugify(destination.city);
    const primary=await fetchAzulPage(url);
    if(primary.response) {
      const plain=htmlToText(await primary.response.text());
      const options=parseOffers(plain,months,days,adults+children);
      if(plain.trim()&&!/access denied|captcha|robot|cloudflare/i.test(plain.slice(0,1200))&&options.length)
        return res.status(200).json({routeSummary:options.length+' oferta(s) publicadas pela Azul encontradas.',options,
          source:'Azul — página pública de ofertas em pontos',sourceUrl:url,checkedAt:new Date().toISOString(),
          fallbackUsed:false,warning:'Ofertas públicas parciais; valores por passageiro adulto/criança. Bebês e taxas devem ser confirmados no checkout.'});
    }

    if(process.env.GECKO_API_KEY||process.env.GECKOAPI_API_KEY) {
      let backup;
      try {
        backup=await searchGecko({origin,destination,months,days,adults,children,infants});
      } catch(e) {
        if(e.code==='GECKO_DAILY_LIMIT') return res.status(429).json({error:e.message,quota:{dailyLimit:3,used:e.used,remaining:0}});
        throw e;
      }
      if(backup.options.length) return res.status(200).json({routeSummary:backup.options.length+' opção(ões) via GeckoAPI para '+brDate(backup.departureDate)+' a '+brDate(backup.returnDate)+'.',
        options:backup.options,source:'GeckoAPI → voeazul.com.br (TudoAzul)',sourceUrl:url,checkedAt:new Date().toISOString(),
        fallbackUsed:true,warning:'Consulta real de ida e volta em uma data representativa do primeiro mês selecionado. Não é varredura integral do mês nem dos demais meses. Preços por adulto, taxas separadas; valide disponibilidade conjunta no checkout.',
        quota:{dailyLimit:3,remaining:backup.remaining},diagnostics:{attemptedQueries:backup.attemptedQueries,successfulQueries:backup.successfulQueries,failures:backup.failures}});
      if(backup.successfulQueries>0) return res.status(200).json({routeSummary:'Consulta GeckoAPI concluída, mas sem jornadas com resgate em pontos na data consultada.',
        options:[],source:'GeckoAPI → voeazul.com.br (TudoAzul)',checkedAt:new Date().toISOString(),fallbackUsed:true,
        warning:'Resultado vazio para a data consultada; não significa ausência de assentos em todo o mês.',
        quota:{dailyLimit:3,remaining:backup.remaining},diagnostics:{attemptedQueries:backup.attemptedQueries,successfulQueries:backup.successfulQueries,failures:backup.failures}});
      return res.status(503).json({error:'A fonte oficial falhou e a GeckoAPI não concluiu uma consulta válida. Nenhum preço foi estimado.',
        retryable:true,fallbackUsed:true,quota:{dailyLimit:3,remaining:backup.remaining},
        diagnostics:{attemptedQueries:backup.attemptedQueries,failures:backup.failures}});
    }
    const detail=primary.error?.status?'HTTP '+primary.error.status:primary.error?.error?.name==='TimeoutError'?'tempo limite excedido':'falha de conexão';
    return res.status(503).json({error:'A Azul não disponibilizou a página ('+detail+'). Configure GECKO_API_KEY para ativar a redundância. Nenhum preço foi estimado.',
      sourceUrl:url,retryable:true,fallbackUsed:false});
  } catch(e) {
    return res.status(502).json({error:'Não foi possível concluir a consulta. Nenhum preço foi estimado.',detail:e.message});
  }
}
