import { Client, GatewayIntentBits, Message, TextChannel } from "discord.js";
import dotenv from "dotenv";
import { handlePlayCommand } from "./commands/play";
import { guildVoiceMap } from "./utils/voiceManager";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith("!")) return;

  const [command, ...args] = message.content.trim().split(/\s+/);
  const guildId = message.guild?.id;
  if (!guildId) return;

  const channel = message.channel;

  if (command.toLowerCase() === "!play") {
    await handlePlayCommand(message, args);
  } else if (command.toLowerCase() === "!stop") {
    const voiceData = guildVoiceMap.get(guildId);
    if (!voiceData) {
      if (channel.isTextBased())
        await channel.send("Nothing is playing right now.");
      return;
    }

    try {
      voiceData.player.stop();
      if (channel.isTextBased())
        await channel.send("Playback stopped, but I am still connected.");
    } catch (error) {
      console.error(error);
      if (channel.isTextBased()) await channel.send("Failed to stop playback.");
    }
  } else if (command.toLowerCase() === "!leave") {
    const voiceData = guildVoiceMap.get(guildId);
    if (!voiceData) {
      if (channel.isTextBased())
        await channel.send("I'm not connected to a voice channel.");
      return;
    }

    try {
      voiceData.connection.destroy();
      guildVoiceMap.delete(guildId);
      if (channel.isTextBased())
        await channel.send("Disconnected from the voice channel.");
    } catch (error) {
      console.error(error);
      if (channel.isTextBased()) await channel.send("Failed to disconnect.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
