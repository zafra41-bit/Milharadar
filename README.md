# MilhaRadar — Guia de Publicação em Produção (Sem Programação)

Este pacote já contém todo o aplicativo pronto, com:
- Interface estilo painel de aeroporto otimizada para celular (PWA instalável na tela inicial)
- Backend seguro (`/api/search`) já configurado para consultar a IA sem expor sua chave
- Agendamento automático configurado (`vercel.json`) para rodar 3x por dia (08h, 14h e 20h)

## Como colocar no ar em 3 passos simples:

### Passo 1: Pegar sua chave gratuita da IA
1. Acesse **https://aistudio.google.com/apikey**
2. Clique em **Create API Key** e copie o código gerado.

### Passo 2: Subir os arquivos no GitHub
1. Crie uma conta gratuita em **https://github.com** e clique em **New** (para criar um repositório chamado `milharadar`).
2. Clique em **uploading an existing file** e arraste todos os arquivos desta pasta para lá, depois clique em **Commit changes**.

### Passo 3: Publicar na Vercel (Gera o link do App)
1. Acesse **https://vercel.com** e entre usando sua conta do GitHub.
2. Clique em **Add New > Project** e selecione o repositório `milharadar`.
3. Antes de clicar em Deploy, abra a aba **Environment Variables** e adicione:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** *(cole a chave que você copiou no Passo 1)*
4. Clique em **Deploy**.

Em cerca de 1 minuto você terá o link público (ex: `milharadar.vercel.app`). Abra no celular e toque em **"Adicionar à Tela de Início"** para usar como aplicativo nativo!
