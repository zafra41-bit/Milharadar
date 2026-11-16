const AZUL_BASE = 'https://passagens.voeazul.com.br/pt';

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function htmlToText(html) {
  return decodeHtml(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(?:tr|td|th|p|div|li|h[1-6]|section|article)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/[ \t\r]+/g, ' ').replace(/\n\s*/g, '\n');
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthLabel(value) {
  const match = String(value).match(/^([A-Za-zÀ-ÿ]{3})\/(\d{2})$/);
  if (!match) return null;
  const months = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
  const month = months[match[1].toLowerCase()];
  return month === undefined ? null : `${Number(`20${match[2]}`)}-${String(month + 1).padStart(2, '0')}`;
}

function parseOffers(text, requestedMonths, minimumDays, passengers) {
  const monthKeys = new Set((requestedMonths || []).map(parseMonthLabel).filter(Boolean));
  const pattern = /Ida\s*e\s*volta[\s\S]{0,180}?(\d{2})\/(\d{2})\/(\d{4})\s*[-–]\s*(\d{2})\/(\d{2})\/(\d{4})[\s\S]{0,100}?A partir de\s*([\d.,]+)\s*pontos/gi;
  const offers = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const [, d1, m1, y1, d2, m2, y2, rawPoints] = match;
    const departure = new Date(Date.UTC(Number(y1), Number(m1) - 1, Number(d1)));
    const returning = new Date(Date.UTC(Number(y2), Number(m2) - 1, Number(d2)));
    const nights = Math.round((returning - departure) / 86400000);
    const points = Number(rawPoints.replace(/[.,]/g, ''));

    if (!Number.isFinite(points) || points <= 0 || nights < minimumDays) continue;
    if (monthKeys.size && !monthKeys.has(monthKey(departure))) continue;

    const departureDate = `${d1}/${m1}/${y1}`;
    const returnDate = `${d2}/${m2}/${y2}`;
    offers.push({
      id: `${y1}${m1}${d1}-${y2}${m2}${d2}`,
      departureDate,
      returnDate,
      monthLabel: departure.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      outboundPoints: null,
      returnPoints: null,
      pointsPerPassenger: points,
      totalPoints: points * passengers,
      passengers,
      airline: 'Azul',
      stops: 'Conforme disponibilidade no site da Azul',
      duration: `${nights} noites`,
      nights,
      priceBasis: 'published-itinerary',
      insight: `A Azul publicou ${points.toLocaleString('pt-BR')} pontos por passageiro. Total estimado multiplicado por ${passengers} passageiro(s); confirme o valor final no checkout.`
    });
  }

  return offers.sort((a, b) => a.totalPoints - b.totalPoints);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { origin, destination, months, days = 7, passengers = 1, program = 'TudoAzul' } = req.body || {};
    const paxCount = Math.max(1, Math.min(9, Number(passengers) || 1));
    if (!origin?.city || !destination?.city || !Array.isArray(months) || months.length === 0) {
      return res.status(400).json({ error: 'Informe origem, destino e pelo menos um mês.' });
    }
    if (origin.code === destination.code) {
      return res.status(400).json({ error: 'Origem e destino precisam ser diferentes.' });
    }
    if (!['TudoAzul', 'tudoazul'].includes(String(program).toLowerCase()) && program !== 'TudoAzul') {
      return res.status(400).json({ error: 'Nesta versão, a busca real está disponível somente para o programa Azul.' });
    }

    const url = `${AZUL_BASE}/voos-de-${slugify(origin.city)}-para-${slugify(destination.city)}`;
    // A página pública da Azul pode responder com erro transitório. Faça uma
    // segunda tentativa curta antes de devolver falha; nunca gere tarifas fictícias.
    let response;
    let lastStatus = null;
    let lastError = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://www.voeazul.com.br/'
          },
          signal: AbortSignal.timeout(7000)
        });

        if (response.ok) break;
        lastStatus = response.status;
        if (attempt === 0 && [429, 500, 502, 503, 504].includes(response.status)) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        break;
      } catch (error) {
        lastError = error;
        if (attempt === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
      }
    }

    if (!response?.ok) {
      const statusDetail = lastStatus ? `HTTP ${lastStatus}` : (lastError?.name === 'TimeoutError' ? 'tempo limite excedido' : 'falha de conexão');
      return res.status(503).json({
        error: `A Azul não disponibilizou a página de ofertas após 2 tentativas (${statusDetail}). Nenhum preço foi estimado. Tente novamente mais tarde.`,
        sourceUrl: url,
        upstreamStatus: lastStatus,
        retryable: true
      });
    }

    const html = await response.text();
    const text = htmlToText(html);
    const options = parseOffers(text, months, Math.max(1, Math.min(60, Number(days) || 7)), paxCount);
    if (!text.trim() || /access denied|captcha|robot|cloudflare/i.test(text.slice(0, 1200))) {
      return res.status(502).json({ error: 'A Azul bloqueou ou não entregou o conteúdo da página para a consulta automática. Tente novamente mais tarde; nenhum preço foi estimado.', sourceUrl: url });
    }

    if (!options.length) {
      return res.status(200).json({
        routeSummary: 'A Azul não publicou, na página consultada, uma oferta de ida e volta que corresponda aos meses e à duração mínima selecionados. Isso não significa ausência total de assentos: a página de ofertas é parcial e pode não listar todas as datas.',
        options: [],
        source: 'Azul — página pública de ofertas em pontos',
        sourceUrl: url,
        checkedAt: new Date().toISOString(),
        warning: 'Somente tarifas publicadas pela Azul são exibidas. Não são feitas estimativas nem combinações artificiais de trechos.'
      });
    }

    return res.status(200).json({
      routeSummary: `${options.length} oferta(s) de ida e volta em pontos encontrada(s) na página pública da Azul, filtradas pelos meses e pela duração mínima informados.`,
      options,
      source: 'Azul — página pública de ofertas em pontos',
      sourceUrl: url,
      checkedAt: new Date().toISOString(),
      warning: `A Azul informa que as ofertas são coletadas nas últimas 48 horas e podem não estar mais disponíveis. O app multiplica o valor anunciado por passageiro por ${paxCount}; confirme a tarifa final no checkout.`
    });
  } catch (error) {
    return res.status(502).json({
      error: 'Não foi possível consultar a página pública da Azul agora. Nenhuma tarifa estimada foi exibida.',
      detail: error?.name === 'TimeoutError' ? 'Tempo limite excedido ao consultar a Azul.' : error?.message
    });
  }
}
