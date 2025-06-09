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
  url: string
) {
  const guildId = voiceChannel.guild.id;

  let voiceData = guildVoiceMap.get(guildId);

  // Reuse connection and player if already exists
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

    // Listen for idle but DON'T destroy connection to keep bot in VC
    player.on(AudioPlayerStatus.Idle, () => {
      console.log("Audio player is idle, but connection stays alive.");
      // Do NOT call connection.destroy() here
    });

    player.on("error", (error) => {
      console.error("Playback error:", error);
      // Optionally destroy connection on error or keep alive based on your preference
      // connection.destroy();
      // guildVoiceMap.delete(guildId);
    });

    connection.subscribe(player);
  }

  // Store or update the map
  guildVoiceMap.set(guildId, { connection, player });

  const stream = ytdl(url, {
    filter: "audioonly",
    quality: "highestaudio",
    highWaterMark: 1 << 25,
  });

  const resource = createAudioResource(stream);
  player.play(resource);
}
