import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";

import { stream } from "play-dl";

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

  const playStream = await stream(url);

  const resource = createAudioResource(playStream.stream, {
    inputType: playStream.type,
  });

  const player = createAudioPlayer();

  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
  });

  player.on("error", (err) => {
    console.error("Playback error:", err);
    connection.destroy();
  });

  connection.subscribe(player);
  player.play(resource);
}
