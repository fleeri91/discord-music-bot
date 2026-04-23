const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback and clear the queue'),

  async execute(interaction) {
    const player = interaction.client.musicPlayer;
    const queue = player.getQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
    }

    player.destroy(interaction.guildId);
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x7C3AED).setDescription('⏹️ Stopped playback and left the channel.')],
      ephemeral: true,
    });
  },
};
