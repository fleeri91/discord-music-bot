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
import ffmpeg from "@ffmpeg-installer/ffmpeg";

// Required for @discordjs/voice to locate ffmpeg
process.env.FFMPEG_PATH = ffmpeg.path;

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
  });

  player.on("error", (err) => {
    console.error("Playback error:", err);
    connection.destroy();
  });

  connection.subscribe(player);
  player.play(resource);
}
