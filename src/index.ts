import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { handlePlayCommand } from "./commands/play";

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
  }
});

client.login(process.env.DISCORD_TOKEN);
