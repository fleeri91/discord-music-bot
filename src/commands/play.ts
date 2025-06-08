import { Message, TextChannel } from "discord.js";
import { joinAndPlay } from "../utils/voicePlayer";

export async function handlePlayCommand(message: Message, args: string[]) {
  const url = args[0];
  const textChannel = message.channel as TextChannel;

  if (!url || !/^https?:\/\/.+/.test(url)) {
    await textChannel.send("Please provide a valid YouTube link.");
    return;
  }

  const voiceChannel = message.member?.voice.channel;
  if (!voiceChannel) {
    await textChannel.send("You need to be in a voice channel first!");
    return;
  }

  try {
    await joinAndPlay(voiceChannel, url);
    await textChannel.send(`Playing: ${url}`);
  } catch (error) {
    console.error(error);
    await textChannel.send("Failed to play audio.");
  }
}
