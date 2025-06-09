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

  // Get full GuildMember object
  const member =
    interaction.member instanceof GuildMember
      ? interaction.member
      : await guild.members.fetch(interaction.user.id);

  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      content: "You need to be in a voice channel!",
      ephemeral: true,
    });
    return;
  }

  const command = interaction.commandName;

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
      await interaction.editReply("Musicbot: Failed to play audio.");
    }
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
    await interaction.reply("Musicbot: Stopped music.");
  } else if (command === "mbjoin") {
    try {
      const { connection, player } = await joinAndPlay(voiceChannel); // No URL passed!
      await interaction.reply("Musicbot: Joined the voice channel.");
    } catch (err) {
      console.error(err);
      await interaction.reply("Musicbot: Failed to join the channel.");
    }
  } else if (command === "mbleave") {
    const voiceData = guildVoiceMap.get(guild.id);
    if (!voiceData) {
      await interaction.reply("Musicbot: I'm not in a voice channel.");
      return;
    }

    voiceData.connection.destroy();
    guildVoiceMap.delete(guild.id);
    await interaction.reply("Musicbot: Left the voice channel.");
  }
});

client.login(process.env.DISCORD_TOKEN);
