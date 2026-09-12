# Bots do Discord — RPG Master Hub

Dois processos Node **separados** do app Next.js (ver `ARCHITECTURE.md`, seção
"Bots do Discord", na raiz do projeto):

- **Bot de trilha sonora** (`music-bot.js`) — entra no canal de voz da
  campanha e toca a música ambiente escolhida no Music/SFX Board, em loop
  quando configurado. Reflete o estado do hub; nunca decide sozinho o que
  tocar.
- **Bot de efeitos sonoros** (`sfx-bot.js`) — toca, um de cada vez por
  campanha (em fila), cada efeito disparado no board.

Cada bot é uma aplicação separada no Discord Developer Portal, com seu
próprio token. Nenhum dos dois fala com o Postgres diretamente — ambos só
consultam o hub via HTTP (`/api/v1/bot/music`, `/api/v1/bot/sfx`,
`/api/v1/bot/sfx/ack`), autenticados por um secret compartilhado
(`BOT_SERVICE_SECRET`, o mesmo configurado no `.env` da raiz do projeto).

## Quando rodar

**Não é necessário manter os bots rodando 24/7.** Eles só precisam estar
ativos durante a sessão de jogo — o mestre inicia os processos antes de
começar a jogar e pode encerrá-los (`Ctrl+C`) ao terminar. Rodar localmente
na máquina do mestre, ao lado do hub (ou apontando `HUB_BASE_URL` para a
instância publicada), é suficiente para esse uso.

## Como rodar

```bash
cd bot
npm install
cp .env.example .env   # preencha com os valores reais (ver abaixo)
npm run music   # inicia o bot de trilha sonora
npm run sfx     # em outro terminal: inicia o bot de efeitos sonoros
```

Cada bot pode rodar em paralelo, em terminais/processos independentes.

### Variáveis de ambiente (`bot/.env`)

| Variável | Descrição |
|---|---|
| `HUB_BASE_URL` | URL do hub acessível pelo bot (ex.: `http://localhost:3000` em dev, ou a URL pública em produção). |
| `BOT_SERVICE_SECRET` | Mesmo valor do `.env` da raiz do projeto. Usado no header `Authorization: Bearer <secret>` ao chamar o hub. |
| `DISCORD_MUSIC_BOT_TOKEN` / `DISCORD_MUSIC_BOT_CLIENT_ID` | Token e Application ID da aplicação Discord do bot de trilha sonora. |
| `DISCORD_SFX_BOT_TOKEN` / `DISCORD_SFX_BOT_CLIENT_ID` | Token e Application ID da aplicação Discord do bot de efeitos sonoros. |

### Convidando os bots para o servidor

No Discord Developer Portal, em cada aplicação → OAuth2 → URL Generator,
selecione o scope `bot` e as permissões `Connect` e `Speak`. Abra a URL
gerada e escolha o servidor (guild) da campanha.

Depois, no Music/SFX Board (`/campaigns/[campaignId]/audio`) da campanha,
preencha o `Guild ID` e o `Voice Channel ID` (copiados no Discord com o
Modo Desenvolvedor ativado → botão direito no servidor/canal → "Copiar ID").

## Limitação do ambiente de desenvolvimento

Este projeto foi desenvolvido em um sandbox cuja política de rede bloqueia
conexões de saída para `discord.com`. Isso significa que a conectividade
real com o Gateway/Voice do Discord **não pôde ser testada a partir desse
ambiente** — a verificação ficou limitada a:

- checagem de sintaxe (`node --check`) dos dois scripts;
- verificação de que as APIs do `@discordjs/voice` usadas (`createAudioResource`
  com string de URL, `joinVoiceChannel`, etc.) existem e têm a assinatura
  esperada, conferida diretamente nos `.d.ts` do pacote instalado;
- `generateDependencyReport()` do próprio `@discordjs/voice`, confirmando
  que a cadeia de dependências de áudio (Opus, criptografia, FFmpeg) resolve
  corretamente em tempo de instalação.

Ao rodar os bots pela primeira vez em uma máquina com acesso à internet,
vale observar o log de conexão (`[música] conectado como ...` / `[sfx]
conectado como ...`) e testar tocar uma música/efeito de fato em um canal
de voz real antes de usar em sessão.

## Segurança

- `bot/.env` nunca deve ser commitado (já coberto pelo `.gitignore` do
  projeto, padrão `.env*`).
- Os tokens dos bots dão controle total sobre a aplicação Discord
  correspondente — trate-os como credenciais de produção.
