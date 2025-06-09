import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import dotenv from "dotenv";
import { SlashCommandBuilder } from "discord.js";

dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play audio from a YouTube link")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("YouTube video URL to play")
        .setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop playing music"),

  // You can add more commands here
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

async function deploy() {
  try {
    console.log("Started refreshing application (slash) commands.");

    // For global commands:
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: commands,
    });

    // For guild-specific commands (for testing faster):
    // await rest.put(
    //   Routes.applicationGuildCommands(process.env.CLIENT_ID!, "YOUR_GUILD_ID"),
    //   { body: commands }
    // );

    console.log("Successfully reloaded application (slash) commands.");
  } catch (error) {
    console.error(error);
  }
}

deploy();
