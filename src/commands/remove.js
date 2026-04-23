const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a song from the queue')
    .addIntegerOption(opt =>
      opt.setName('position')
        .setDescription('Position in queue (from /queue)')
        .setMinValue(1)
        .setRequired(true)
    ),

  async execute(interaction) {
    const player = interaction.client.musicPlayer;
    const pos = interaction.options.getInteger('position');
    const removed = player.remove(interaction.guildId, pos);

    if (removed) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x7C3AED).setDescription(`🗑️ Removed **${removed.title}**`)],
        ephemeral: true,
      });
    } else {
      await interaction.reply({ content: '❌ Invalid position.', ephemeral: true });
    }
  },
};
