import { VoiceConnection, AudioPlayer } from "@discordjs/voice";

interface VoiceData {
  connection: VoiceConnection;
  player: AudioPlayer;
}

export const guildVoiceMap = new Map<string, VoiceData>();
