const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear the queue (keeps current song)'),

  async execute(interaction) {
    const player = interaction.client.musicPlayer;

    if (player.clear(interaction.guildId)) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x7C3AED).setDescription('🧹 Queue cleared')],
        ephemeral: true,
      });
    } else {
      await interaction.reply({ content: '❌ Nothing to clear.', ephemeral: true });
    }
  },
};
