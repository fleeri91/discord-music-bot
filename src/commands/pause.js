const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause or resume playback'),

  async execute(interaction) {
    const player = interaction.client.musicPlayer;
    const queue = player.getQueue(interaction.guildId);

    if (!queue || !queue.current) {
      return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
    }

    let text;
    if (queue.paused) {
      player.resume(interaction.guildId);
      text = '▶️ Resumed';
    } else {
      player.pause(interaction.guildId);
      text = '⏸️ Paused';
    }

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x7C3AED).setDescription(text)],
      ephemeral: true,
    });
  },
};
