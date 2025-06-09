import { Client, GatewayIntentBits, GuildMember } from "discord.js";
import dotenv from "dotenv";
import { joinAndPlay } from "./utils/voicePlayer";
import { guildVoiceMap } from "./utils/voiceManager";

// Load environment variables from .env file
dotenv.config();

/**
 * Create a new Discord.js client with necessary intents.
 * - Guilds: Enables the bot to receive basic guild events.
 * - GuildVoiceStates: Enables the bot to access and react to voice state changes.
 */
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

/**
 * Event: Client is ready
 * Triggered once when the bot has successfully logged in.
 */
client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

/**
 * Event: Interaction Create
 * Triggered every time a user interacts with a slash command.
 */
client.on("interactionCreate", async (interaction) => {
  // Only handle chat input commands (slash commands)
  if (!interaction.isChatInputCommand()) return;

  const guild = interaction.guild;

  /**
   * Check if the command was used within a guild.
   * If not, reply with an error message.
   */
  if (!guild) {
    await interaction.reply({
      content: "This command only works in guilds.",
      ephemeral: true,
    });
    return;
  }

  /**
   * Fetch the full GuildMember object for the user if it's not already resolved.
   */
  const member =
    interaction.member instanceof GuildMember
      ? interaction.member
      : await guild.members.fetch(interaction.user.id);

  const voiceChannel = member.voice.channel;

  /**
   * Ensure the user is in a voice channel before executing any command.
   */
  if (!voiceChannel) {
    await interaction.reply({
      content: "You need to be in a voice channel!",
      ephemeral: true,
    });
    return;
  }

  const command = interaction.commandName;

  /**
   * Command: /mbplay
   * Description: Bot joins the voice channel and plays audio from a given YouTube URL.
   */
  if (command === "mbplay") {
    const url = interaction.options.getString("url");
    if (!url) {
      await interaction.reply({
        content: "You must provide a URL!",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    try {
      await joinAndPlay(voiceChannel, url);
      await interaction.editReply(`Now playing: ${url}`);
    } catch (err) {
      console.error(err);
      await interaction.editReply("Music bot: Failed to play audio.");
    }

    /**
     * Command: /mbstop
     * Description: Stops currently playing audio, if any.
     */
  } else if (command === "mbstop") {
    const voiceData = guildVoiceMap.get(guild.id);
    if (!voiceData) {
      await interaction.reply({
        content: "Nothing is playing.",
        ephemeral: true,
      });
      return;
    }

    voiceData.player.stop();
    await interaction.reply("Music bot: Stopped music.");

    /**
     * Command: /mbjoin
     * Description: Bot joins the voice channel without playing any audio.
     */
  } else if (command === "mbjoin") {
    try {
      const { connection, player } = await joinAndPlay(voiceChannel); // No URL passed = join only
      await interaction.reply("Music bot: Joined the voice channel.");
    } catch (err) {
      console.error(err);
      await interaction.reply("Music bot: Failed to join the channel.");
    }

    /**
     * Command: /mbleave
     * Description: Bot leaves the current voice channel and cleans up state.
     */
  } else if (command === "mbleave") {
    const voiceData = guildVoiceMap.get(guild.id);
    if (!voiceData) {
      await interaction.reply("Music bot: I'm not in a voice channel.");
      return;
    }

    voiceData.connection.destroy(); // Close the connection
    guildVoiceMap.delete(guild.id); // Remove guild from map
    await interaction.reply("Music bot: Left the voice channel.");
  }
});

/**
 * Log the bot in using the Discord token from the .env file.
 */
client.login(process.env.DISCORD_TOKEN);
