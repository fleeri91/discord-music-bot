import { Client, GatewayIntentBits } from "discord.js";
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

  if (command.toLowerCase() === "!play") {
    await handlePlayCommand(message, args);
  } else if (command.toLowerCase() === "!stop") {
    const guildId = message.guild?.id;
    if (!guildId) return;

    const voiceData = guildVoiceMap.get(guildId);
    if (!voiceData) {
      await message.channel.send("Nothing is playing right now.");
      return;
    }

    try {
      voiceData.player.stop();
      voiceData.connection.destroy();
      guildVoiceMap.delete(guildId);
      await message.channel.send(
        "Stopped playback and left the voice channel."
      );
    } catch (error) {
      console.error(error);
      await message.channel.send("Failed to stop playback.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
