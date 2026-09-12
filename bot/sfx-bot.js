// Bot de efeitos sonoros: toca, um de cada vez por campanha (em fila), cada
// efeito que o mestre dispara no Music/SFX Board. Mistura de vários efeitos
// tocando ao mesmo tempo na mesma campanha fica fora de escopo desta versão
// — ver ARCHITECTURE.md, "Bots do Discord" — um efeito só começa quando o
// anterior da mesma campanha termina.
import { Client, GatewayIntentBits } from "discord.js";
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
} from "@discordjs/voice";

import { createHubClient } from "./shared/hub-client.js";

const POLL_INTERVAL_MS = 2000;
const TOKEN = process.env.DISCORD_SFX_BOT_TOKEN;
if (!TOKEN) {
  console.error("DISCORD_SFX_BOT_TOKEN ausente — veja bot/.env.example.");
  process.exit(1);
}

const hub = createHubClient();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

/** @type {Map<string, { connection: import("@discordjs/voice").VoiceConnection, player: import("@discordjs/voice").AudioPlayer, queue: string[] }>} */
const campaignState = new Map();

function playNextInQueue(state) {
  const nextUrl = state.queue.shift();
  if (!nextUrl) return;
  state.player.play(createAudioResource(nextUrl));
}

async function getOrCreateConnection(campaignId, guildId, voiceChannelId) {
  let state = campaignState.get(campaignId);
  if (state && state.connection.joinConfig.channelId === voiceChannelId) return state;

  if (state) state.connection.destroy();

  const guild = await client.guilds.fetch(guildId);
  const connection = joinVoiceChannel({
    channelId: voiceChannelId,
    guildId,
    adapterCreator: guild.voiceAdapterCreator,
  });

  const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
  connection.subscribe(player);

  state = { connection, player, queue: [] };
  campaignState.set(campaignId, state);

  player.on(AudioPlayerStatus.Idle, () => playNextInQueue(state));
  player.on("error", (error) => console.error(`[sfx] erro no player da campanha ${campaignId}:`, error.message));
  connection.on(VoiceConnectionStatus.Disconnected, () => campaignState.delete(campaignId));

  return state;
}

async function poll() {
  let events;
  try {
    events = await hub.getPendingSfx();
  } catch (error) {
    console.error("[sfx] falha ao consultar o hub:", error.message);
    return;
  }

  const processedIds = [];

  for (const event of events) {
    try {
      const state = await getOrCreateConnection(event.campaignId, event.guildId, event.voiceChannelId);
      if (state.player.state.status === AudioPlayerStatus.Idle && state.queue.length === 0) {
        state.player.play(createAudioResource(event.fileUrl));
      } else {
        state.queue.push(event.fileUrl);
      }
      processedIds.push(event.id);
    } catch (error) {
      console.error(`[sfx] falha ao tocar evento ${event.id}:`, error.message);
    }
  }

  await hub.ackSfx(processedIds).catch((error) => console.error("[sfx] falha ao confirmar eventos:", error.message));
}

client.once("ready", () => {
  console.log(`[sfx] conectado como ${client.user.tag}`);
  setInterval(poll, POLL_INTERVAL_MS);
  poll();
});

client.login(TOKEN);
