// Carrega `.env` para dentro do processo/worker de teste — o Next.js faz
// isso sozinho em dev/build, mas o Vitest roda fora do Next, então
// `DATABASE_URL`/`AUTH_SECRET`/etc. precisam ser carregados explicitamente
// (mesmo pacote `dotenv` que `prisma7.config.ts` já usa).
import "dotenv/config";
