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

    const prompt = `Você é um especialista sênior em emissão de passagens aéreas com milhas e programas de fidelidade.
Analise a seguinte solicitação de voo e retorne exatamente 5 opções estratégicas de datas de viagem (ida e volta) com estimativas realistas de pontuação.

- Origem: ${origin.code} (${origin.city})
- Destino: ${destination.code} (${destination.city})
- Meses desejados: ${months.join(', ')}
- Duração da viagem: ${days} dias
- Quantidade exata de passageiros: ${paxCount} pessoa(s)
- Programa de fidelidade: ${program}

IMPORTANTE: 
O valor de "totalPoints" DEVE ser obrigatoriamente a pontuação unitária multiplicada por ${paxCount} (ou seja, o total para todos os passageiros juntos).`;

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
                  description: 'Análise curta e estratégica sobre o comportamento de tarifas.'
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
                      outboundPoints: { type: 'INTEGER', description: 'Total na ida para todos os passageiros juntos' },
                      returnPoints: { type: 'INTEGER', description: 'Total na volta para todos os passageiros juntos' },
                      totalPoints: { type: 'INTEGER', description: 'SOMA TOTAL (ida + volta) multiplicada por todos os passageiros' },
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

    // Garantia matemática no backend para evitar que a IA mande valor unitário por engano
    if (parsed && parsed.options) {
      parsed.options = parsed.options.map(opt => {
        const expectedTotal = opt.outboundPoints + opt.returnPoints;
        // Se a IA mandou um valor menor que o unitário, multiplicamos pelos passageiros
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
