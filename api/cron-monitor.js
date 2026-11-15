export default async function handler(req, res) {
  // Este endpoint é acionado automaticamente às 08h, 14h e 20h (horário de Brasília)
  // Conecte aqui seu banco de dados (ex: Supabase/Firebase) e disparo de WhatsApp/E-mail
  return res.status(200).json({
    status: 'ok',
    executedAt: new Date().toISOString(),
    message: 'Ciclo de monitoramento 3x/dia executado.'
  });
}
