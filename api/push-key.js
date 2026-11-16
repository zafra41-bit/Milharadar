export default async function handler(req,res) {
  if(req.method!=='GET') return res.status(405).json({error:'Método não permitido.'});
  const key=process.env.VAPID_PUBLIC_KEY;
  if(!key) return res.status(503).json({error:'Chave pública de notificações não configurada.'});
  return res.status(200).json({publicKey:key});
}
