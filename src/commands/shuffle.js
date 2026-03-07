const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the queue'),

  async execute(interaction) {
    const player = interaction.client.musicPlayer;
    if (player.shuffle(interaction.guildId)) {
      await interaction.reply('🔀 Queue shuffled!');
    } else {
      await interaction.reply({ content: '❌ Not enough songs to shuffle.', ephemeral: true });
    }
  },
};
