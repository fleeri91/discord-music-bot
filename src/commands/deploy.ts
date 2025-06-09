// deploy-commands.ts
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import { getCommands } from "./helpers";

dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName("mbplay")
    .setDescription("Play a YouTube URL in your voice channel")
    .addStringOption((opt) =>
      opt.setName("url").setDescription("YouTube URL").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("mbstop")
    .setDescription("Stop the current playback but stay in voice channel"),

  new SlashCommandBuilder()
    .setName("mbjoin")
    .setDescription("Join your voice channel without playing music"),

  new SlashCommandBuilder()
    .setName("mbleave")
    .setDescription("Leave the voice channel"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log("Started refreshing application (/) commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!
      ),
      { body: commands }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
