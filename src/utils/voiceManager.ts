import { VoiceConnection, AudioPlayer } from "@discordjs/voice";
interface VoiceData {
  connection: VoiceConnection;
  player: AudioPlayer;
}

/**
 * @description
 * A map to keep track of voice connections and players for each guild.
 * This allows the bot to manage audio playback state per guild without
 * rejoining or recreating players unnecessarily.
 *
 * @param string Guild ID (string)
 * @param VoiceData Object containing the voice connection and audio player
 */
export const guildVoiceMap = new Map<string, VoiceData>();
