import { AudioPlayer, VoiceConnection } from "@discordjs/voice";

export const guildVoiceMap: Map<
  string,
  { connection: VoiceConnection; player: AudioPlayer }
> = new Map();
