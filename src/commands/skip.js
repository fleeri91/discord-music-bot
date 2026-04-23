const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),

  async execute(interaction) {
    const player = interaction.client.musicPlayer;
    const queue = player.getQueue(interaction.guildId);

    if (!queue || !queue.current) {
      return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    }

    const { title, url } = queue.current;
    player.skip(interaction.guildId);

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x7C3AED).setDescription(`⏭️ Skipped **[${title}](${url})**`)],
      ephemeral: true,
    });
  },
};
