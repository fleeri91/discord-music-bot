const { SlashCommandBuilder } = require('discord.js');

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

    if (queue.paused) {
      player.resume(interaction.guildId);
      await interaction.reply('▶️ Resumed playback.');
    } else {
      player.pause(interaction.guildId);
      await interaction.reply('⏸️ Paused playback.');
    }
  },
};
