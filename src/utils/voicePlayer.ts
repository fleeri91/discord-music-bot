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

export async function joinAndPlay(
  voiceChannel: VoiceBasedChannel,
  url?: string
) {
  const guildId = voiceChannel.guild.id;

  let voiceData = guildVoiceMap.get(guildId);
  let connection = voiceData?.connection;
  let player = voiceData?.player;

  if (!connection) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  }

  if (!player) {
    player = createAudioPlayer();

    player.on(AudioPlayerStatus.Idle, () => {
      console.log("Audio player is idle.");
    });

    player.on("error", (error) => {
      console.error("Playback error:", error);
    });

    connection.subscribe(player);
  }

  // Store updated connection/player
  guildVoiceMap.set(guildId, { connection, player });

  // Only play if URL is provided
  if (url) {
    const stream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    });

    const resource = createAudioResource(stream);
    player.play(resource);
  }

  return { connection, player };
}
