const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the queue'),

  async execute(interaction) {
    const player = interaction.client.musicPlayer;

    if (player.shuffle(interaction.guildId)) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x7C3AED).setDescription('🔀 Queue shuffled')],
        ephemeral: true,
      });
    } else {
      await interaction.reply({ content: '❌ Not enough songs to shuffle.', ephemeral: true });
    }
  },
};
