-- CreateEnum
CREATE TYPE "AudioTrackCategory" AS ENUM ('MUSIC', 'SFX');

-- CreateTable
CREATE TABLE "audio_tracks" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AudioTrackCategory" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "loop" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_links" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "voiceChannelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discord_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "music_playback_states" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "trackId" TEXT,
    "isPlaying" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "music_playback_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sfx_trigger_events" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "sfx_trigger_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audio_tracks_campaignId_category_idx" ON "audio_tracks"("campaignId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "discord_links_campaignId_key" ON "discord_links"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "music_playback_states_campaignId_key" ON "music_playback_states"("campaignId");

-- CreateIndex
CREATE INDEX "sfx_trigger_events_campaignId_processedAt_idx" ON "sfx_trigger_events"("campaignId", "processedAt");

-- AddForeignKey
ALTER TABLE "audio_tracks" ADD CONSTRAINT "audio_tracks_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discord_links" ADD CONSTRAINT "discord_links_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_playback_states" ADD CONSTRAINT "music_playback_states_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_playback_states" ADD CONSTRAINT "music_playback_states_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "audio_tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sfx_trigger_events" ADD CONSTRAINT "sfx_trigger_events_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sfx_trigger_events" ADD CONSTRAINT "sfx_trigger_events_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "audio_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
