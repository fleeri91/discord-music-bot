import { Message, TextChannel } from "discord.js";
import { joinAndPlay } from "../utils/voicePlayer";

/**
 * Handles the play command issued through a text message.
 * This command allows users to play audio from a YouTube URL
 * in the voice channel they are currently in.
 *
 * @param message - The Discord message object containing the command.
 * @param args - An array of arguments passed with the command, where the first element is expected to be a YouTube URL.
 */
export async function handlePlayCommand(message: Message, args: string[]) {
  const url = args[0];
  const textChannel = message.channel as TextChannel;

  /**
   * Validate that a valid URL is provided.
   * If not, send an error message and return.
   */
  if (!url || !/^https?:\/\/.+/.test(url)) {
    await textChannel.send("Please provide a valid YouTube link.");
    return;
  }

  /**
   * Check if the user is currently in a voice channel.
   * If not, prompt them to join one before using the command.
   */
  const voiceChannel = message.member?.voice.channel;
  if (!voiceChannel) {
    await textChannel.send("You need to be in a voice channel first!");
    return;
  }

  /**
   * Attempt to join the user's voice channel and play the audio.
   * Send a confirmation message or an error message depending on the result.
   */
  try {
    await joinAndPlay(voiceChannel, url);
    await textChannel.send(`Playing: ${url}`);
  } catch (error) {
    console.error(error);
    await textChannel.send("Failed to play audio.");
  }
}
