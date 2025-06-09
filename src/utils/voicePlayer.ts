import { VoiceBasedChannel } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import { guildVoiceMap } from "./voiceManager";

/**
 * Joins a voice channel and optionally plays audio from a YouTube URL.
 *
 * @param voiceChannel - The voice channel to join.
 * @param url - Optional YouTube URL to stream audio from.
 * @returns The voice connection and audio player instance for the guild.
 */
export async function joinAndPlay(
  voiceChannel: VoiceBasedChannel,
  url?: string
) {
  const guildId = voiceChannel.guild.id;

  // Retrieve existing voice connection and audio player for the guild, if available
  let voiceData = guildVoiceMap.get(guildId);
  let connection = voiceData?.connection;
  let player = voiceData?.player;

  /**
   * If no connection exists, create a new one and wait for it to become ready.
   */
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false, // Keep bot undeafened to hear itself (optional based on use case)
    });

    // Wait until the connection is ready or timeout after 20 seconds
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  }

  /**
   * If no audio player exists, create one and set up listeners for idle and error events.
   */
  if (!player) {
    player = createAudioPlayer();

    player.on(AudioPlayerStatus.Idle, () => {
      console.log("Audio player is idle.");
    });

    player.on("error", (error) => {
      console.error("Playback error:", error);
    });

    // Subscribe the voice connection to the audio player
    connection.subscribe(player);
  }

  // Save the (new or existing) connection and player back to the guild map
  guildVoiceMap.set(guildId, { connection, player });

  /**
   * If a URL is provided, stream audio from it and play it using the audio player.
   */
  if (url) {
    const stream = ytdl(url, {
      filter: "audioonly", // Stream only the audio portion
      quality: "highestaudio", // Use the highest audio quality available
      highWaterMark: 1 << 25, // Set buffer size to avoid stream interruptions
    });

    const resource = createAudioResource(stream);
    player.play(resource);
  }

  return { connection, player };
}
