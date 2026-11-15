export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave GEMINI_API_KEY não configurada no servidor.' });
  }

  try {
    const { origin, destination, months, days, program, targetPoints } = req.body;

    const prompt = `Você é um especialista sênior em emissão de passagens aéreas com milhas e programas de fidelidade.
Analise a seguinte solicitação de voo e retorne exatamente 5 opções estratégicas de datas de viagem (ida e volta) com estimativas realistas de pontuação baseadas nas tabelas dinâmicas/fixas e histórico do programa selecionado:

- Origem: ${origin.code} (${origin.city} - ${origin.name})
- Destino: ${destination.code} (${destination.city} - ${destination.name})
- Meses desejados: ${months.join(', ')}
- Duração da viagem: ${days} dias
- Programa de fidelidade: ${program}
- Pontuação Target (meta total ida+volta por passageiro): ${targetPoints} pontos

Considere sazonalidade real, janelas de baixa temporada dentro dos meses solicitados, voos diretos vs conexões, companhias parceiras e oportunidades de tabela fixa quando aplicável.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
                  description: 'Análise curta e estratégica sobre o comportamento de tarifas em milhas para essa rota e programa.'
                },
                options: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      id: { type: 'STRING' },
                      departureDate: { type: 'STRING', description: 'Ex: 14 Mai 2027' },
                      returnDate: { type: 'STRING', description: 'Ex: 21 Mai 2027' },
                      monthLabel: { type: 'STRING', description: 'Ex: Mai/27' },
                      outboundPoints: { type: 'INTEGER' },
                      returnPoints: { type: 'INTEGER' },
                      totalPoints: { type: 'INTEGER' },
                      airline: { type: 'STRING' },
                      stops: { type: 'STRING', description: 'Ex: Direto ou 1 parada (VCP)' },
                      duration: { type: 'STRING', description: 'Ex: 3h 25m' },
                      insight: { type: 'STRING', description: 'Justificativa prática do porquê essa data tem boa pontuação.' }
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
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno no servidor' });
  }
}
