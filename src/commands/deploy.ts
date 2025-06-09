import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Define the slash commands to be registered
const commands = [
  // /mbplay command to play a YouTube URL in the user's voice channel
  new SlashCommandBuilder()
    .setName("mbplay")
    .setDescription("Play a YouTube URL in your voice channel")
    .addStringOption((opt) =>
      opt.setName("url").setDescription("YouTube URL").setRequired(true)
    ),

  // /mbstop command to stop playback but stay connected to the voice channel
  new SlashCommandBuilder()
    .setName("mbstop")
    .setDescription("Stop the current playback but stay in voice channel"),

  // /mbjoin command to join the user's voice channel without playing anything
  new SlashCommandBuilder()
    .setName("mbjoin")
    .setDescription("Join your voice channel without playing music"),

  // /mbleave command to leave the voice channel
  new SlashCommandBuilder()
    .setName("mbleave")
    .setDescription("Leave the voice channel"),
].map((command) => command.toJSON()); // Convert each command to JSON for the API

// Initialize REST API client with Discord bot token
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

// Register the commands with the Discord API for a specific guild
(async () => {
  try {
    console.log("Started refreshing application (/) commands...");

    // Register commands to the specified guild (for quicker updates vs global)
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!, // Your bot's client ID
        process.env.GUILD_ID! // Target guild ID (for development/testing)
      ),
      { body: commands } // Send the defined slash commands
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
