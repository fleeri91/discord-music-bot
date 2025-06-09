import {
  Client,
  GatewayIntentBits,
  ChatInputCommandInteraction,
  GuildMember,
} from "discord.js";
import dotenv from "dotenv";
import { joinAndPlay } from "./utils/voicePlayer";
import { guildVoiceMap } from "./utils/voiceManager";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({
      content: "This command only works in guilds.",
      ephemeral: true,
    });
    return;
  }

  if (interaction.commandName === "stop") {
    // Check if bot has a player for this guild
    const voiceData = guildVoiceMap.get(guild.id);

    if (!voiceData) {
      await interaction.reply({
        content: "Nothing is playing right now.",
        ephemeral: true,
      });
      return;
    }

    try {
      voiceData.player.stop(); // Stops current playback but keeps connection alive
      await interaction.reply(
        "Playback stopped. I am still connected to the voice channel."
      );
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Failed to stop playback.",
        ephemeral: true,
      });
    }
  }

  // Get full GuildMember object
  const member =
    interaction.member instanceof GuildMember
      ? interaction.member
      : await guild.members.fetch(interaction.user.id);

  const voiceChannel = member.voice.channel;
  if (!voiceChannel) {
    await interaction.reply({
      content: "You need to be in a voice channel first!",
      ephemeral: true,
    });
    return;
  }

  // Get the "url" option string from the slash command
  const url = interaction.options.getString("url");
  if (!url) {
    await interaction.reply({
      content: "You must provide a URL to play!",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    await joinAndPlay(voiceChannel, url);
    await interaction.editReply(`Now playing: ${url}`);
  } catch (error) {
    console.error(error);
    await interaction.editReply("Failed to play audio.");
  }
});

client.login(process.env.DISCORD_TOKEN);
