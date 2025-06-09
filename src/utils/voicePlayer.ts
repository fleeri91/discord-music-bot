import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js"; // ✅ CORRECT
import ytdl from "@distube/ytdl-core";
import { guildVoiceMap } from "./voiceManager";

export async function joinAndPlay(
  voiceChannel: VoiceBasedChannel,
  url: string
) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

  const stream = ytdl(url, {
    filter: "audioonly",
    quality: "highestaudio",
    highWaterMark: 1 << 25,
  });

  const resource = createAudioResource(stream);
  const player = createAudioPlayer();

  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
    guildVoiceMap.delete(voiceChannel.guild.id);
  });

  player.on("error", (err) => {
    console.error("Playback error:", err);
    connection.destroy();
    guildVoiceMap.delete(voiceChannel.guild.id);
  });

  connection.subscribe(player);
  player.play(resource);

  guildVoiceMap.set(voiceChannel.guild.id, { connection, player });
}
