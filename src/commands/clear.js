const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear the queue (keeps current song)'),

  async execute(interaction) {
    const player = interaction.client.musicPlayer;
    if (player.clear(interaction.guildId)) {
      await interaction.reply('🧹 Queue cleared!');
    } else {
      await interaction.reply({ content: '❌ Nothing to clear.', ephemeral: true });
    }
  },
};
