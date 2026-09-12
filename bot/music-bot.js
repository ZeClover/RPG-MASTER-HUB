// Bot de trilha sonora: entra no canal de voz configurado para cada campanha
// e toca a música ambiente escolhida pelo mestre no Music/SFX Board — nunca
// decide sozinho o que tocar, só reflete o estado que o hub descreve.
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

const POLL_INTERVAL_MS = 4000;
const TOKEN = process.env.DISCORD_MUSIC_BOT_TOKEN;
if (!TOKEN) {
  console.error("DISCORD_MUSIC_BOT_TOKEN ausente — veja bot/.env.example.");
  process.exit(1);
}

const hub = createHubClient();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

/** @type {Map<string, { connection: import("@discordjs/voice").VoiceConnection, player: import("@discordjs/voice").AudioPlayer, trackId: string, fileUrl: string, loop: boolean }>} */
const activeByCampaign = new Map();

function playResource(state) {
  const resource = createAudioResource(state.fileUrl);
  state.player.play(resource);
}

async function ensureCampaignPlaying(desired) {
  let state = activeByCampaign.get(desired.campaignId);

  const needsNewConnection = !state || state.connection.joinConfig.channelId !== desired.voiceChannelId;
  if (needsNewConnection) {
    if (state) state.connection.destroy();

    const guild = await client.guilds.fetch(desired.guildId);
    const connection = joinVoiceChannel({
      channelId: desired.voiceChannelId,
      guildId: desired.guildId,
      adapterCreator: guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
    connection.subscribe(player);

    state = { connection, player, trackId: "", fileUrl: "", loop: false };
    activeByCampaign.set(desired.campaignId, state);

    player.on(AudioPlayerStatus.Idle, () => {
      if (state.loop) playResource(state);
    });
    player.on("error", (error) => {
      console.error(`[música] erro no player da campanha ${desired.campaignId}:`, error.message);
    });
    connection.on(VoiceConnectionStatus.Disconnected, () => {
      activeByCampaign.delete(desired.campaignId);
    });
  }

  const trackChanged = state.trackId !== desired.trackId;
  if (trackChanged || needsNewConnection) {
    state.trackId = desired.trackId;
    state.fileUrl = desired.fileUrl;
    state.loop = desired.loop;
    playResource(state);
  }
}

function stopCampaignsNotIn(desiredCampaignIds) {
  for (const [campaignId, state] of activeByCampaign) {
    if (!desiredCampaignIds.has(campaignId)) {
      state.connection.destroy();
      activeByCampaign.delete(campaignId);
    }
  }
}

async function poll() {
  try {
    const campaigns = await hub.getMusicState();
    const desiredIds = new Set(campaigns.map((entry) => entry.campaignId));
    stopCampaignsNotIn(desiredIds);
    for (const desired of campaigns) {
      await ensureCampaignPlaying(desired);
    }
  } catch (error) {
    console.error("[música] falha ao consultar o hub:", error.message);
  }
}

client.once("ready", () => {
  console.log(`[música] conectado como ${client.user.tag}`);
  setInterval(poll, POLL_INTERVAL_MS);
  poll();
});

client.login(TOKEN);
