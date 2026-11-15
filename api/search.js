export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave GEMINI_API_KEY não configurada no servidor.' });
  }

  try {
    const { origin, destination, months, days, program, targetPoints, passengers = 1 } = req.body;
    const paxCount = Math.max(1, Number(passengers) || 1);
    const targetPerPax = Number(targetPoints) || 45000;
    const totalTargetAllPax = targetPerPax * paxCount;

    const prompt = `Você é um especialista em milhas aéreas. Analise a rota e retorne EXATAMENTE 3 opções estratégicas de datas (ida e volta) com estimativas realistas de pontuação.

- Origem: ${origin.code} (${origin.city})
- Destino: ${destination.code} (${destination.city})
- Meses: ${months.join(', ')}
- Duração: ${days} dias
- Passageiros: ${paxCount} pessoa(s)
- Programa: ${program}

IMPORTANTE: 
O valor de "totalPoints" DEVE ser obrigatoriamente a pontuação total somada para todos os ${paxCount} passageiros juntos.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                routeSummary: {
                  type: 'STRING',
                  description: 'Análise curta e estratégica sobre a rota.'
                },
                options: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      id: { type: 'STRING' },
                      departureDate: { type: 'STRING' },
                      returnDate: { type: 'STRING' },
                      monthLabel: { type: 'STRING' },
                      outboundPoints: { type: 'INTEGER', description: 'Total na ida para todos os passageiros' },
                      returnPoints: { type: 'INTEGER', description: 'Total na volta para todos os passageiros' },
                      totalPoints: { type: 'INTEGER', description: 'SOMA TOTAL (ida + volta) para todos os passageiros' },
                      airline: { type: 'STRING' },
                      stops: { type: 'STRING' },
                      duration: { type: 'STRING' },
                      insight: { type: 'STRING' }
                    },
                    required: ['id', 'departureDate', 'returnDate', 'monthLabel', 'outboundPoints', 'returnPoints', 'totalPoints', 'airline', 'stops', 'duration', 'insight']
                  }
                }
              },
              required: ['routeSummary', 'options']
            }
          }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erro na Gemini API' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);

    // Garante no máximo 3 opções e que o cálculo de passageiros esteja correto
    if (parsed && parsed.options) {
      parsed.options = parsed.options.slice(0, 3).map(opt => {
        const expectedTotal = opt.outboundPoints + opt.returnPoints;
        const finalTotal = opt.totalPoints < expectedTotal * 1.5 ? expectedTotal : opt.totalPoints;
        return {
          ...opt,
          totalPoints: finalTotal
        };
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno no servidor' });
  }
}
