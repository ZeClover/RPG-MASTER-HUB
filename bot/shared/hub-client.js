// Cliente HTTP fininho para as rotas /api/v1/bot/* do hub. Os bots nunca
// falam com o Postgres diretamente — só com o hub, autenticados por um
// secret compartilhado (nunca por sessão de usuário). Ver ARCHITECTURE.md,
// "Bots do Discord".

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}. Veja bot/.env.example.`);
  }
  return value;
}

export function createHubClient() {
  const baseUrl = requireEnv("HUB_BASE_URL").replace(/\/$/, "");
  const secret = requireEnv("BOT_SERVICE_SECRET");

  async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${secret}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Hub respondeu ${response.status} em ${path}: ${body.slice(0, 200)}`);
    }

    return response.json();
  }

  return {
    async getMusicState() {
      const data = await request("/api/v1/bot/music");
      return data.campaigns;
    },
    async getPendingSfx() {
      const data = await request("/api/v1/bot/sfx");
      return data.events;
    },
    async ackSfx(ids) {
      if (ids.length === 0) return;
      await request("/api/v1/bot/sfx/ack", { method: "POST", body: JSON.stringify({ ids }) });
    },
  };
}
